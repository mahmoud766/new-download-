import http from 'http';

console.log('====================================================');
console.log('OMNIFETCH PRO — AUTOMATED SECURITY REGRESSION SUITE');
console.log('====================================================\n');

let failed = false;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failed = true;
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  try {
    // Test 1: Health Endpoint
    const healthRes = await makeRequest({ hostname: '127.0.0.1', port: 3000, path: '/api/health', method: 'GET' });
    const healthData = JSON.parse(healthRes.body);
    assert(healthRes.statusCode === 200 && healthData.status === 'ok', 'API Health Check returns 200 OK');

    // Test 2: Security Headers
    assert(healthRes.headers['x-content-type-options'] === 'nosniff', 'Header X-Content-Type-Options: nosniff present');
    assert(healthRes.headers['x-frame-options'] === 'SAMEORIGIN', 'Header X-Frame-Options: SAMEORIGIN present');
    assert(healthRes.headers['referrer-policy'] === 'strict-origin-when-cross-origin', 'Header Referrer-Policy present');

    // Test 3: /api/download Open Redirect / SSRF Rejection Test
    const maliciousProxyRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/download?url=https://malicious-external-domain.com/evil.exe',
      method: 'GET'
    });
    assert(maliciousProxyRes.statusCode === 403, '/api/download blocks unapproved external domains with 403 Forbidden');

    const internalIpProxyRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/download?url=http://169.254.169.254/latest/meta-data/',
      method: 'GET'
    });
    assert(internalIpProxyRes.statusCode === 403, '/api/download blocks internal Cloud metadata IP (169.254.169.254) with 403 Forbidden');

    // Test 4: /api/ads Security Sanitization
    const maliciousAdPayload = JSON.stringify({
      ads: [
        {
          id: 'test-ad-slot',
          enabled: true,
          code: '<script>window.top.location.href="https://attacker.com";</script>',
          format: 'leaderboard_728x90',
        }
      ]
    });

    const adSaveRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/ads',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(maliciousAdPayload),
      }
    }, maliciousAdPayload);

    const adSaveData = JSON.parse(adSaveRes.body);
    assert(adSaveRes.statusCode === 200 && adSaveData.success, '/api/ads POST endpoint returns 200 success');
    
    // Verify that window.top script was sanitized out
    const savedAdCode = adSaveData.ads[0].code;
    assert(!savedAdCode.includes('window.top.location.href'), '/api/ads server-side sanitizer stripped window.top redirect payload');
    assert(savedAdCode.includes('highperformanceformat.com'), '/api/ads safely fell back to clean Adsterra zone code');

    // Test 5: Verify Public GET /api/ads returns clean sanitized ad array
    const adGetRes = await makeRequest({ hostname: '127.0.0.1', port: 3000, path: '/api/ads', method: 'GET' });
    const adGetData = JSON.parse(adGetRes.body);
    assert(adGetRes.statusCode === 200 && Array.isArray(adGetData.ads), 'GET /api/ads returns valid ads array');
    
    let hasDangerousCode = false;
    for (const ad of adGetData.ads) {
      if (ad.code.includes('window.top') || ad.code.includes('location.replace') || ad.code.includes('eval(')) {
        hasDangerousCode = true;
      }
    }
    assert(!hasDangerousCode, 'GET /api/ads zero dangerous script constructs across all public slots');

    console.log('\n====================================================');
    if (failed) {
      console.error('❌ SECURITY REGRESSION TEST SUITE FAILED');
      process.exit(1);
    } else {
      console.log('🟢 ALL SECURITY REGRESSION TESTS PASSED SUCCESSFULLY');
      process.exit(0);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
