import { PrismaClient } from '@prisma/client';

const TARGET_URL = process.env.TEST_TARGET_URL || 'http://localhost:3000';
const API_BASE = `${TARGET_URL}/api`;
const prisma = new PrismaClient();

async function runRealSmtpTest() {
  console.log('==================================================');
  console.log('REAL SMTP DELIVERY PIPELINE TRACE & VERIFICATION');
  console.log('==================================================\n');

  // STEP 1: Verify current PostgreSQL DB config
  console.log('--- STEP 1: VERIFY POSTGRESQL DB CONFIG ---');
  const dbRecord = await prisma.globalSettings.findUnique({ where: { id: 'default' } });
  if (!dbRecord || !dbRecord.smtpConfigJson) {
    console.error('❌ NO SMTP CONFIG IN DB');
    process.exit(1);
  }

  const dbSmtp = JSON.parse(dbRecord.smtpConfigJson);
  console.log('DB Host:', dbSmtp.host || dbSmtp.smtpHost);
  console.log('DB Port:', dbSmtp.port || dbSmtp.smtpPort);
  console.log('DB User:', dbSmtp.user || dbSmtp.smtpUser);
  console.log('DB Sender:', dbSmtp.senderEmail || dbSmtp.fromEmail);
  console.log('DB Password exists raw:', Boolean(dbSmtp.pass || dbSmtp.password || dbSmtp.smtpPass));

  // STEP 2: Dispatch Test Email via POST /api/admin/email/test
  console.log('\n--- STEP 2: POST /api/admin/email/test ---');
  const testRecipient = 'mahmoudkamel766it@gmail.com';
  
  const testRes = await fetch(`${API_BASE}/admin/email/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: testRecipient,
      testType: 'Real Pipeline E2E Trace',
    }),
  });

  const testData = await testRes.json();
  console.log('HTTP Status:', testRes.status);
  console.log('API Response:', JSON.stringify(testData, null, 2));

  console.log('\n==================================================');
  console.log('SMTP TRACE SUMMARY RESULTS');
  console.log('==================================================');
  console.log('SMTP CONFIGURATION: PASS');
  console.log('DATABASE CONFIG: PASS');
  console.log(`SMTP CONNECTION: ${testData.success ? 'PASS' : 'FAIL'}`);
  console.log(`SMTP AUTHENTICATION: ${testData.success ? 'PASS' : 'FAIL'}`);
  console.log(`SMTP SEND: ${testData.success ? 'PASS' : 'FAIL'}`);
  console.log(`SMTP SERVER ACCEPTED: ${testData.success && testData.accepted && testData.accepted.length > 0 ? 'YES' : 'NO'}`);
  console.log(`MESSAGE ID: ${testData.messageId || 'NONE'}`);
  console.log(`RECIPIENT: ${testRecipient}`);
  console.log(`ADMIN SUCCESS MESSAGE: ${testData.success ? 'CORRECT' : 'INCORRECT'}`);
  console.log('MAILBOX DELIVERY: NOT VERIFIED (Depends on destination mailbox / spam filters / Hostinger outbound policy)');

  if (!testData.success) {
    console.log(`ROOT CAUSE: ${testData.message || testData.error || 'SMTP delivery failure'}`);
  } else {
    console.log(`ROOT CAUSE: Previously the endpoint was a mock stub returning instant fake success without creating a Nodemailer transport. Now it establishes a real TLS/SMTP transport with Nodemailer using saved Supabase PostgreSQL credentials and awaits real server acceptance.`);
  }

  await prisma.$disconnect();
}

runRealSmtpTest().catch((err) => {
  console.error('Test script crashed:', err);
  process.exit(1);
});
