import { PrismaClient } from '@prisma/client';

const TARGET_URL = process.env.TEST_TARGET_URL || 'http://localhost:3000';
const API_BASE = `${TARGET_URL}/api`;
const prisma = new PrismaClient();

async function runSmtpVerification() {
  console.log('==================================================');
  console.log('STARTING SMTP PERSISTENCE VERIFICATION TEST');
  console.log('==================================================\n');

  // STEP 1: POST /api/smtp with real custom SMTP values
  console.log('--- STEP 1: POST /api/smtp ---');
  const testPayload = {
    host: 'smtp.hostinger.com',
    port: 465,
    user: 'info@hostingerdomain.com',
    pass: 'SECRET_HOSTINGER_PASS_123!',
    senderEmail: 'support@hostingerdomain.com',
    senderName: 'Hostinger Support',
    secure: true,
  };

  const postRes = await fetch(`${API_BASE}/smtp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ smtp: testPayload }),
  });

  const postData = await postRes.json();
  console.log('POST /api/smtp Response:', JSON.stringify(postData));

  if (!postData.success) {
    console.error('❌ STEP 1 FAILED: POST /api/smtp returned error');
    process.exit(1);
  }
  console.log('✅ STEP 1 PASSED: POST /api/smtp succeeded\n');

  // STEP 2: VERIFY POSTGRESQL DATABASE WRITE VIA PRISMA
  console.log('--- STEP 2: VERIFY SUPABASE POSTGRESQL DB WRITE ---');
  const dbRecord = await prisma.globalSettings.findUnique({ where: { id: 'default' } });
  if (!dbRecord || !dbRecord.smtpConfigJson) {
    console.error('❌ STEP 2 FAILED: No record found in GlobalSettings.smtpConfigJson');
    process.exit(1);
  }

  const dbSmtp = JSON.parse(dbRecord.smtpConfigJson);
  console.log('Database Stored Host:', dbSmtp.host);
  console.log('Database Stored User:', dbSmtp.user);
  console.log('Database Stored Port:', dbSmtp.port);
  console.log('Database Password Preserved:', dbSmtp.pass === 'SECRET_HOSTINGER_PASS_123!' ? 'YES (RAW SECRET)' : 'NO');

  if (
    dbSmtp.host === 'smtp.hostinger.com' &&
    dbSmtp.port === 465 &&
    dbSmtp.user === 'info@hostingerdomain.com' &&
    dbSmtp.pass === 'SECRET_HOSTINGER_PASS_123!'
  ) {
    console.log('✅ STEP 2 PASSED: PostgreSQL DB contains exact custom SMTP row & secret\n');
  } else {
    console.error('❌ STEP 2 FAILED: DB row mismatch', dbSmtp);
    process.exit(1);
  }

  // STEP 3: GET /api/smtp READ-BACK AND MASKING
  console.log('--- STEP 3: GET /api/smtp READ-BACK ---');
  const getRes = await fetch(`${API_BASE}/smtp`);
  const getData = await getRes.json();
  console.log('GET /api/smtp Response:', JSON.stringify(getData));

  if (
    getData.success &&
    getData.smtp &&
    getData.smtp.host === 'smtp.hostinger.com' &&
    getData.smtp.port === 465 &&
    getData.smtp.pass === '••••••••'
  ) {
    console.log('✅ STEP 3 PASSED: GET /api/smtp returns custom hostinger config with masked pass\n');
  } else {
    console.error('❌ STEP 3 FAILED: GET /api/smtp mismatch', getData);
    process.exit(1);
  }

  // STEP 4: PASSWORD PRESERVATION ON SUBSEQUENT SAVE
  console.log('--- STEP 4: PASSWORD PRESERVATION ON SUBSEQUENT SAVE ---');
  const updatePayload = {
    host: 'smtp.hostinger.com',
    port: 465,
    user: 'info@hostingerdomain.com',
    pass: '••••••••', // Masked password passed from UI
    senderEmail: 'support@hostingerdomain.com',
    senderName: 'Hostinger Support V2',
    secure: true,
  };

  const updateRes = await fetch(`${API_BASE}/smtp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ smtp: updatePayload }),
  });
  const updateData = await updateRes.json();
  console.log('POST update Response:', JSON.stringify(updateData));

  const dbRecord2 = await prisma.globalSettings.findUnique({ where: { id: 'default' } });
  const dbSmtp2 = JSON.parse(dbRecord2!.smtpConfigJson!);
  console.log('Database Stored Name After Update:', dbSmtp2.senderName);
  console.log('Database Password Still Preserved Raw:', dbSmtp2.pass === 'SECRET_HOSTINGER_PASS_123!' ? 'YES' : 'NO');

  if (dbSmtp2.senderName === 'Hostinger Support V2' && dbSmtp2.pass === 'SECRET_HOSTINGER_PASS_123!') {
    console.log('✅ STEP 4 PASSED: Masked password preserved real secret in PostgreSQL DB\n');
  } else {
    console.error('❌ STEP 4 FAILED: Password preservation failed', dbSmtp2);
    process.exit(1);
  }

  // STEP 5: EMAIL ALERTS SEPARATION
  console.log('--- STEP 5: EMAIL ALERTS SEPARATION ---');
  const alertPayload = {
    enabled: true,
    recipientEmails: ['alerts@hostingerdomain.com'],
    alertOnHighErrorRate: true,
    errorRateThresholdPercent: 4.5,
    alertOnDbConnectionFailure: true,
    alertOnProxyDowntime: true,
    alertOnRateLimitSpike: true,
    digestFrequency: 'Instant',
  };

  const alertRes = await fetch(`${API_BASE}/email-alerts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alerts: alertPayload }),
  });
  const alertData = await alertRes.json();
  console.log('POST /api/email-alerts Response:', JSON.stringify(alertData));

  const dbRecord3 = await prisma.globalSettings.findUnique({ where: { id: 'default' } });
  const dbSmtp3 = JSON.parse(dbRecord3!.smtpConfigJson!);
  const dbAlerts3 = JSON.parse(dbRecord3!.emailAlertsConfigJson!);

  if (dbSmtp3.host === 'smtp.hostinger.com' && dbAlerts3.recipientEmails[0] === 'alerts@hostingerdomain.com') {
    console.log('✅ STEP 5 PASSED: SMTP and Email Alerts stored separately without cross-contamination\n');
  } else {
    console.error('❌ STEP 5 FAILED: Email alerts separation mismatch');
    process.exit(1);
  }

  console.log('==================================================');
  console.log('ALL SMTP PERSISTENCE VERIFICATION TESTS PASSED!');
  console.log('==================================================');

  await prisma.$disconnect();
}

runSmtpVerification().catch((err) => {
  console.error('Verification script crashed:', err);
  process.exit(1);
});
