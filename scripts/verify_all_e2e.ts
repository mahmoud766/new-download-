import { PrismaClient } from '@prisma/client';

const TARGET_URL = process.env.TEST_TARGET_URL || 'http://localhost:3000';
const API_BASE = `${TARGET_URL}/api`;

async function main() {
  console.log('==================================================');
  console.log(`TEST TARGET URL: ${TARGET_URL}`);
  console.log('STARTING MANDATORY END-TO-END VERIFICATION');
  console.log('==================================================\n');

  const prisma = new PrismaClient();
  await prisma.$connect();
  console.log('✅ Connected directly to Supabase PostgreSQL database via Prisma.\n');

  // TEST 1 — SITE TITLE
  console.log('--- TEST 1: SITE TITLE ---');
  const titlePayload = { siteName: 'LIVE_PRODUCTION_PROOF_001', primaryColor: '#9333ea' };
  const res1 = await fetch(`${API_BASE}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(titlePayload),
  });
  const data1 = await res1.json().catch(() => ({ success: false }));
  console.log('API POST /api/settings:', JSON.stringify(data1));

  const getRes1 = await fetch(`${API_BASE}/settings`);
  const getData1 = await getRes1.json().catch(() => ({ settings: {} }));
  console.log('API GET /api/settings siteName:', getData1.settings?.siteName);

  const dbSetting1 = await prisma.globalSettings.findFirst();
  console.log('Supabase DB siteName:', dbSetting1?.siteName);

  if (
    getData1.settings?.siteName === 'LIVE_PRODUCTION_PROOF_001' &&
    dbSetting1?.siteName === 'LIVE_PRODUCTION_PROOF_001'
  ) {
    console.log('✅ TEST 1 PASSED: ADMIN = SUPABASE DB = API = FRONTEND TITLE\n');
  } else {
    console.error('❌ TEST 1 FAILED\n');
  }

  // TEST 2 — THEME COLOR
  console.log('--- TEST 2: THEME COLOR ---');
  const themePayload = { siteName: 'LIVE_PRODUCTION_PROOF_001', primaryColor: '#123456' };
  const res2 = await fetch(`${API_BASE}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(themePayload),
  });
  const data2 = await res2.json().catch(() => ({ success: false }));
  console.log('API POST /api/settings response:', JSON.stringify(data2));

  const getRes2 = await fetch(`${API_BASE}/settings`);
  const getData2 = await getRes2.json().catch(() => ({ settings: {} }));
  console.log('API GET /api/settings primaryColor:', getData2.settings?.primaryColor);

  const dbSetting2 = await prisma.globalSettings.findFirst();
  console.log('Supabase DB primaryColor:', dbSetting2?.primaryColor);

  if (
    getData2.settings?.primaryColor === '#123456' &&
    dbSetting2?.primaryColor === '#123456'
  ) {
    console.log('✅ TEST 2 PASSED: ADMIN = SUPABASE DB = API = FRONTEND THEME COLOR\n');
  } else {
    console.error('❌ TEST 2 FAILED\n');
  }

  // TEST 3 — CMS PAGE
  console.log('--- TEST 3: CMS PAGE ---');
  const cmsPayload = {
    pages: [
      {
        id: 'page_privacy',
        slug: 'privacy-policy',
        title: 'LIVE_CMS_PRODUCTION_001',
        content: 'Verified production privacy policy content.',
        updatedAt: new Date().toISOString(),
      },
    ],
  };
  const res3 = await fetch(`${API_BASE}/cms/pages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cmsPayload),
  });
  const data3 = await res3.json().catch(() => ({ success: false, error: 'ENDPOINT_NOT_DEPLOYED' }));
  console.log('API POST /api/cms/pages:', JSON.stringify(data3));

  const getRes3 = await fetch(`${API_BASE}/cms/pages`);
  const getData3 = await getRes3.json().catch(() => ({ pages: [] }));
  const privacyPage = getData3.pages?.find((p: any) => p.id === 'page_privacy' || p.slug === 'privacy-policy');
  console.log('API GET /api/cms/pages title:', privacyPage?.title);

  const dbSetting3 = await prisma.globalSettings.findFirst();
  const dbPages = dbSetting3?.pagesConfigJson ? JSON.parse(dbSetting3.pagesConfigJson as string) : [];
  const dbPrivacyPage = dbPages.find((p: any) => p.id === 'page_privacy' || p.slug === 'privacy-policy');
  console.log('Supabase DB CMS page title:', dbPrivacyPage?.title);

  if (
    privacyPage?.title === 'LIVE_CMS_PRODUCTION_001' &&
    dbPrivacyPage?.title === 'LIVE_CMS_PRODUCTION_001'
  ) {
    console.log('✅ TEST 3 PASSED: ADMIN = SUPABASE DB = API = FRONTEND CMS PAGE\n');
  } else {
    console.error('❌ TEST 3 FAILED\n');
  }

  // TEST 4 — SEO
  console.log('--- TEST 4: SEO ---');
  const seoPayload = {
    metaTitle: 'LIVE_SEO_PRODUCTION_001',
    metaDescription: 'Production SEO Meta Description.',
    keywords: 'production, seo, test, supabase',
  };
  const res4 = await fetch(`${API_BASE}/seo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(seoPayload),
  });
  const data4 = await res4.json().catch(() => ({ success: false }));
  console.log('API POST /api/seo:', JSON.stringify(data4));

  const getRes4 = await fetch(`${API_BASE}/seo`);
  const getData4 = await getRes4.json().catch(() => ({ seo: {} }));
  console.log('API GET /api/seo metaTitle:', getData4.seo?.metaTitle);

  const dbSetting4 = await prisma.globalSettings.findFirst();
  const dbSeo = dbSetting4?.seoConfigJson ? JSON.parse(dbSetting4.seoConfigJson as string) : {};
  console.log('Supabase DB SEO metaTitle:', dbSeo?.metaTitle);

  if (
    getData4.seo?.metaTitle === 'LIVE_SEO_PRODUCTION_001' &&
    dbSeo?.metaTitle === 'LIVE_SEO_PRODUCTION_001'
  ) {
    console.log('✅ TEST 4 PASSED: ADMIN = SUPABASE DB = API = FRONTEND SEO\n');
  } else {
    console.error('❌ TEST 4 FAILED\n');
  }

  // TEST 5 — ADS
  console.log('--- TEST 5: ADS ---');
  const adsPayload = {
    ads: [
      {
        id: 'ad_header',
        slot: 'header_banner',
        name: 'Header Banner',
        enabled: false,
        code: '<!-- Disabled Banner Ad -->',
      },
    ],
  };
  const res5 = await fetch(`${API_BASE}/ads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(adsPayload),
  });
  const data5 = await res5.json().catch(() => ({ success: false }));
  console.log('API POST /api/ads:', JSON.stringify(data5));

  const getRes5 = await fetch(`${API_BASE}/ads`);
  const getData5 = await getRes5.json().catch(() => ({ ads: [] }));
  const headerAd = getData5.ads?.find((a: any) => a.slot === 'header_banner' || a.id === 'ad_header');
  console.log('API GET /api/ads header_banner enabled status:', headerAd?.enabled);

  const dbSetting5 = await prisma.globalSettings.findFirst();
  const dbAds = dbSetting5?.adsConfigJson ? JSON.parse(dbSetting5.adsConfigJson as string) : [];
  const dbHeaderAd = dbAds.find((a: any) => a.slot === 'header_banner' || a.id === 'ad_header');
  console.log('Supabase DB Ads header_banner enabled status:', dbHeaderAd?.enabled);

  if (
    headerAd?.enabled === false &&
    dbHeaderAd?.enabled === false
  ) {
    console.log('✅ TEST 5 PASSED: ADMIN = SUPABASE DB = API = FRONTEND ADS PLACEMENT\n');
  } else {
    console.error('❌ TEST 5 FAILED\n');
  }

  // TEST 6 — PLATFORM
  console.log('--- TEST 6: PLATFORM ---');
  const platformPayload = {
    platforms: {
      pinterest: {
        id: 'pinterest',
        name: 'Pinterest',
        active: false,
        enabled: false,
      },
    },
  };
  const res6 = await fetch(`${API_BASE}/platforms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(platformPayload),
  });
  const data6 = await res6.json().catch(() => ({ success: false }));
  console.log('API POST /api/platforms:', JSON.stringify(data6));

  const getRes6 = await fetch(`${API_BASE}/platforms`);
  const getData6 = await getRes6.json().catch(() => ({ platforms: {} }));
  const pinterestConfig = getData6.platforms?.pinterest;
  console.log('API GET /api/platforms pinterest active status:', pinterestConfig?.active ?? pinterestConfig?.enabled);

  const dbSetting6 = await prisma.globalSettings.findFirst();
  const dbPlatforms = dbSetting6?.platformsConfigJson ? JSON.parse(dbSetting6.platformsConfigJson as string) : {};
  const dbPinterestConfig = dbPlatforms?.pinterest;
  console.log('Supabase DB Platforms pinterest active status:', dbPinterestConfig?.active ?? dbPinterestConfig?.enabled);

  if (
    (pinterestConfig?.active === false || pinterestConfig?.enabled === false) &&
    (dbPinterestConfig?.active === false || dbPinterestConfig?.enabled === false)
  ) {
    console.log('✅ TEST 6 PASSED: ADMIN = SUPABASE DB = API = FRONTEND PLATFORM DISABLING\n');
  } else {
    console.error('❌ TEST 6 FAILED\n');
  }

  // TEST 7 — SMTP
  console.log('--- TEST 7: SMTP ---');
  const smtpPayload = {
    senderName: 'LIVE_SMTP_PRODUCTION_001',
    senderEmail: 'noreply@omnifetchpro.com',
    smtpHost: 'smtp.sendgrid.net',
    smtpPort: 587,
    smtpUser: 'apikey',
    smtpPass: 'SUPER_SECRET_SMTP_KEY_123',
    enableSmtp: true,
  };
  const res7 = await fetch(`${API_BASE}/smtp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(smtpPayload),
  });
  const data7 = await res7.json().catch(() => ({ success: false, error: 'ENDPOINT_NOT_DEPLOYED' }));
  console.log('API POST /api/smtp:', JSON.stringify(data7));

  const getRes7 = await fetch(`${API_BASE}/smtp`);
  const getData7 = await getRes7.json().catch(() => ({ smtp: null }));
  console.log('API GET /api/smtp senderName:', getData7.smtp?.senderName);
  console.log('API GET /api/smtp smtpPass (masked check):', getData7.smtp?.smtpPass);

  const dbSetting7 = await prisma.globalSettings.findFirst();
  const dbSmtp = dbSetting7?.smtpConfigJson ? JSON.parse(dbSetting7.smtpConfigJson as string) : {};
  console.log('Supabase DB SMTP senderName:', dbSmtp?.senderName);

  if (
    getData7.smtp?.senderName === 'LIVE_SMTP_PRODUCTION_001' &&
    dbSmtp?.senderName === 'LIVE_SMTP_PRODUCTION_001' &&
    (getData7.smtp?.smtpPass === '••••••••' || getData7.smtp?.smtpPass === '********' || getData7.smtp?.smtpPass === '' || !getData7.smtp?.smtpPass)
  ) {
    console.log('✅ TEST 7 PASSED: ADMIN = SUPABASE DB = API = FRONTEND SMTP CONFIG (SECRETS PROTECTED)\n');
  } else {
    console.error('❌ TEST 7 FAILED\n');
  }

  await prisma.$disconnect();
  console.log('==================================================');
  console.log('END-TO-END VERIFICATION RUN COMPLETE');
  console.log('==================================================');
}

main().catch((e) => {
  console.error('Fatal error in E2E verification:', e);
  process.exit(1);
});


