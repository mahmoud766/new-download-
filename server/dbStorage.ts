import fs from 'fs';
import path from 'path';
import { prisma } from '../src/lib/prisma';
import { DEFAULT_SITE_SETTINGS, DEFAULT_ADS_CONFIG, DEFAULT_FAQS, INITIAL_BLOG_POSTS, PLATFORMS_CONFIG } from '../src/config/siteConfig';
import { DEFAULT_PAGES, DEFAULT_SECURITY, DEFAULT_REDIRECTS, DEFAULT_USERS, DEFAULT_SMTP_CONFIG, DEFAULT_EMAIL_ALERTS } from '../src/lib/adminStorage';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'app_database.json');

// In-memory runtime state cache
interface ServerDatabaseState {
  settings: any;
  ads: any[];
  platforms: any;
  seo: any;
  pages: any[];
  faqs: any[];
  blogs: any[];
  smtp: any;
  emailAlerts: any;
  redirects: any[];
  users: any[];
  security: any;
  auditLogs: any[];
  trendingDownloads: any[];
  syncVersion: number;
}

const memoryDb: ServerDatabaseState = {
  settings: { ...DEFAULT_SITE_SETTINGS },
  ads: [...DEFAULT_ADS_CONFIG],
  platforms: { ...PLATFORMS_CONFIG },
  seo: {
    metaTitle: 'OmniFetch Pro - Free All-in-One Video Downloader (TikTok, FB, IG, YT)',
    metaDescription: 'Download TikTok videos without watermark, Facebook Reels, Instagram Stories, YouTube Shorts and Snapchat videos in HD for free.',
    keywords: 'video downloader, tiktok downloader no watermark, facebook video downloader, instagram reel saver, youtube shorts downloader',
    canonicalUrl: 'https://omnifetchpro.com',
    robotsDirective: 'index, follow, max-image-preview:large, max-snippet:-1',
    ogImage: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=1200&q=80',
    twitterHandle: '@OmniFetchPro',
  },
  pages: [...DEFAULT_PAGES],
  faqs: [...DEFAULT_FAQS],
  blogs: [...INITIAL_BLOG_POSTS],
  smtp: { ...DEFAULT_SMTP_CONFIG },
  emailAlerts: { ...DEFAULT_EMAIL_ALERTS },
  redirects: [...DEFAULT_REDIRECTS],
  users: [...DEFAULT_USERS],
  security: { ...DEFAULT_SECURITY },
  auditLogs: [],
  trendingDownloads: [],
  syncVersion: 1,
};

// Initialize file store
function initFileStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const loaded = JSON.parse(raw);
      if (loaded && typeof loaded === 'object') {
        if (loaded.settings) memoryDb.settings = { ...memoryDb.settings, ...loaded.settings };
        if (Array.isArray(loaded.ads)) memoryDb.ads = loaded.ads;
        if (loaded.platforms) memoryDb.platforms = loaded.platforms;
        if (loaded.seo) memoryDb.seo = loaded.seo;
        if (Array.isArray(loaded.pages)) memoryDb.pages = loaded.pages;
        if (Array.isArray(loaded.faqs)) memoryDb.faqs = loaded.faqs;
        if (Array.isArray(loaded.blogs)) memoryDb.blogs = loaded.blogs;
        if (loaded.smtp) memoryDb.smtp = loaded.smtp;
        if (loaded.emailAlerts) memoryDb.emailAlerts = loaded.emailAlerts;
        if (Array.isArray(loaded.redirects)) memoryDb.redirects = loaded.redirects;
        if (Array.isArray(loaded.users)) memoryDb.users = loaded.users;
        if (loaded.security) memoryDb.security = loaded.security;
        if (Array.isArray(loaded.auditLogs)) memoryDb.auditLogs = loaded.auditLogs;
        if (Array.isArray(loaded.trendingDownloads)) memoryDb.trendingDownloads = loaded.trendingDownloads;
        if (typeof loaded.syncVersion === 'number') memoryDb.syncVersion = loaded.syncVersion;
      }
    } else {
      fs.writeFileSync(DATA_FILE, JSON.stringify(memoryDb, null, 2), 'utf-8');
    }
  } catch (err) {
    console.warn('[Storage Notice] File persistence warning (in-memory mode active):', (err as Error).message);
  }
}

// Persist memoryDb to disk
function persistToDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(memoryDb, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Storage Notice] Could not write to disk, using in-memory store:', (err as Error).message);
  }
}

initFileStore();

/**
 * Execute a Prisma operation with a fast timeout (2000ms).
 * If it succeeds, return the result.
 * If it fails or times out (e.g. database pool timeout or unreachable DB),
 * log a notice and fall back gracefully to the local store without crashing or returning 500.
 */
export async function withSafeDb<T>(
  dbOperation: () => Promise<T>,
  fallbackValue: T,
  operationName = 'DB Operation',
  timeoutMs = 2500
): Promise<{ result: T; fromDb: boolean }> {
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timer = setTimeout(() => {
        const err = new Error(`Database query timed out after ${timeoutMs}ms`);
        (err as any).code = 'DB_TIMEOUT';
        reject(err);
      }, timeoutMs);
      if (typeof timer.unref === 'function') timer.unref();
    });

    const res = await Promise.race([dbOperation(), timeoutPromise]);
    return { result: res, fromDb: true };
  } catch (err: any) {
    console.warn(`[Resilient DB Fallback] ${operationName} Notice: ${err?.message || err}. Using local persistent store.`);
    return { result: fallbackValue, fromDb: false };
  }
}

// === Settings ===
export async function getGlobalSettings() {
  const { result: dbRecord } = await withSafeDb(
    async () => prisma.globalSettings.findUnique({ where: { id: 'default' } }),
    null,
    'getGlobalSettings'
  );

  if (dbRecord) {
    let themeExtras: any = {};
    let parsedSocials = memoryDb.settings.socialLinks || {};
    try {
      if (dbRecord.socialLinksJson) {
        const parsed = JSON.parse(dbRecord.socialLinksJson);
        if (parsed && typeof parsed === 'object') {
          themeExtras = parsed;
          parsedSocials = parsed.socialLinks || parsed;
        }
      }
    } catch {}

    const merged = {
      ...memoryDb.settings,
      siteName: dbRecord.siteName !== undefined && dbRecord.siteName !== null ? dbRecord.siteName : memoryDb.settings.siteName,
      shortName: dbRecord.shortName !== undefined && dbRecord.shortName !== null ? dbRecord.shortName : memoryDb.settings.shortName,
      tagline: dbRecord.tagline !== undefined && dbRecord.tagline !== null ? dbRecord.tagline : memoryDb.settings.tagline,
      siteDescription: dbRecord.siteDescription !== undefined && dbRecord.siteDescription !== null ? dbRecord.siteDescription : memoryDb.settings.siteDescription,
      logoUrl: dbRecord.logoUrl !== undefined && dbRecord.logoUrl !== null ? dbRecord.logoUrl : memoryDb.settings.logoUrl,
      faviconUrl: dbRecord.faviconUrl !== undefined && dbRecord.faviconUrl !== null ? dbRecord.faviconUrl : memoryDb.settings.faviconUrl,
      contactEmail: dbRecord.contactEmail !== undefined && dbRecord.contactEmail !== null ? dbRecord.contactEmail : memoryDb.settings.contactEmail,
      contactPhone: dbRecord.contactPhone !== undefined && dbRecord.contactPhone !== null ? dbRecord.contactPhone : memoryDb.settings.contactPhone,
      primaryColor: dbRecord.primaryColor !== undefined && dbRecord.primaryColor !== null ? dbRecord.primaryColor : memoryDb.settings.primaryColor,
      secondaryColor: dbRecord.secondaryColor !== undefined && dbRecord.secondaryColor !== null ? dbRecord.secondaryColor : memoryDb.settings.secondaryColor,
      adsenseClientId: dbRecord.adsenseClientId !== undefined && dbRecord.adsenseClientId !== null ? dbRecord.adsenseClientId : memoryDb.settings.adsenseClientId,
      ga4Id: dbRecord.ga4Id !== undefined && dbRecord.ga4Id !== null ? dbRecord.ga4Id : memoryDb.settings.ga4Id,
      gtmId: dbRecord.gtmId !== undefined && dbRecord.gtmId !== null ? dbRecord.gtmId : memoryDb.settings.gtmId,
      clarityId: dbRecord.clarityId !== undefined && dbRecord.clarityId !== null ? dbRecord.clarityId : memoryDb.settings.clarityId,
      fbPixelId: dbRecord.fbPixelId !== undefined && dbRecord.fbPixelId !== null ? dbRecord.fbPixelId : memoryDb.settings.fbPixelId,
      maintenanceMode: Boolean(dbRecord.maintenanceMode),
      allowMp3Conversion: Boolean(dbRecord.allowMp3Conversion),
      watermarkFreeByDefault: Boolean(dbRecord.watermarkFreeByDefault),
      headerStyle: dbRecord.headerStyle || memoryDb.settings.headerStyle,
      customCss: dbRecord.customCss !== undefined && dbRecord.customCss !== null ? dbRecord.customCss : memoryDb.settings.customCss,
      customJs: dbRecord.customJs !== undefined && dbRecord.customJs !== null ? dbRecord.customJs : memoryDb.settings.customJs,
      headerBlur: themeExtras.headerBlur || memoryDb.settings.headerBlur,
      fontFamily: themeExtras.fontFamily || memoryDb.settings.fontFamily,
      buttonRadius: themeExtras.buttonRadius || memoryDb.settings.buttonRadius,
      cardStyle: themeExtras.cardStyle || memoryDb.settings.cardStyle,
      logoHeightPx: themeExtras.logoHeightPx || memoryDb.settings.logoHeightPx,
      platformIconsCustom: themeExtras.platformIconsCustom || memoryDb.settings.platformIconsCustom || {},
      platformColorsCustom: themeExtras.platformColorsCustom || memoryDb.settings.platformColorsCustom || {},
      socialLinks: parsedSocials,
    };
    memoryDb.settings = merged;
    return merged;
  }

  return memoryDb.settings;
}

export async function saveGlobalSettings(data: Record<string, any>) {
  memoryDb.syncVersion += 1;

  let customCss = data.customCss !== undefined ? String(data.customCss) : memoryDb.settings.customCss;
  if (typeof customCss === 'string' && customCss.startsWith('base64:')) {
    try {
      customCss = Buffer.from(customCss.slice(7), 'base64').toString('utf-8');
    } catch {}
  }

  let customJs = data.customJs !== undefined ? String(data.customJs) : memoryDb.settings.customJs;
  if (typeof customJs === 'string' && customJs.startsWith('base64:')) {
    try {
      customJs = Buffer.from(customJs.slice(7), 'base64').toString('utf-8');
    } catch {}
  }

  const updatedSettings = {
    ...memoryDb.settings,
    ...data,
    customCss,
    customJs,
    socialLinks: data.socialLinks !== undefined ? data.socialLinks : memoryDb.settings.socialLinks,
  };

  memoryDb.settings = updatedSettings;
  persistToDisk();

  // Package all extended styling & social fields into socialLinksJson for full Prisma database persistence
  const themeExtras = {
    headerBlur: updatedSettings.headerBlur,
    fontFamily: updatedSettings.fontFamily,
    buttonRadius: updatedSettings.buttonRadius,
    cardStyle: updatedSettings.cardStyle,
    logoHeightPx: updatedSettings.logoHeightPx,
    platformIconsCustom: updatedSettings.platformIconsCustom,
    platformColorsCustom: updatedSettings.platformColorsCustom,
    socialLinks: updatedSettings.socialLinks,
  };
  const socialLinksJson = JSON.stringify(themeExtras);

  // Asynchronously attempt to sync with Prisma/MySQL without blocking or failing the request
  withSafeDb(
    async () =>
      prisma.globalSettings.upsert({
        where: { id: 'default' },
        update: {
          siteName: String(updatedSettings.siteName || 'OmniFetch Pro'),
          shortName: String(updatedSettings.shortName || 'PRO'),
          tagline: String(updatedSettings.tagline || ''),
          siteDescription: String(updatedSettings.siteDescription || ''),
          logoUrl: String(updatedSettings.logoUrl || ''),
          faviconUrl: String(updatedSettings.faviconUrl || ''),
          contactEmail: String(updatedSettings.contactEmail || 'support@omnifetchpro.com'),
          contactPhone: String(updatedSettings.contactPhone || ''),
          primaryColor: String(updatedSettings.primaryColor || '#9333ea'),
          secondaryColor: String(updatedSettings.secondaryColor || '#3b82f6'),
          adsenseClientId: String(updatedSettings.adsenseClientId || ''),
          ga4Id: String(updatedSettings.ga4Id || ''),
          gtmId: String(updatedSettings.gtmId || ''),
          clarityId: String(updatedSettings.clarityId || ''),
          fbPixelId: String(updatedSettings.fbPixelId || ''),
          maintenanceMode: Boolean(updatedSettings.maintenanceMode),
          allowMp3Conversion: Boolean(updatedSettings.allowMp3Conversion),
          watermarkFreeByDefault: Boolean(updatedSettings.watermarkFreeByDefault),
          headerStyle: String(updatedSettings.headerStyle || 'sticky'),
          customCss: String(customCss || ''),
          customJs: String(customJs || ''),
          socialLinksJson,
        },
        create: {
          id: 'default',
          siteName: String(updatedSettings.siteName || 'OmniFetch Pro'),
          shortName: String(updatedSettings.shortName || 'PRO'),
          tagline: String(updatedSettings.tagline || ''),
          siteDescription: String(updatedSettings.siteDescription || ''),
          logoUrl: String(updatedSettings.logoUrl || ''),
          faviconUrl: String(updatedSettings.faviconUrl || ''),
          contactEmail: String(updatedSettings.contactEmail || 'support@omnifetchpro.com'),
          contactPhone: String(updatedSettings.contactPhone || ''),
          primaryColor: String(updatedSettings.primaryColor || '#9333ea'),
          secondaryColor: String(updatedSettings.secondaryColor || '#3b82f6'),
          adsenseClientId: String(updatedSettings.adsenseClientId || ''),
          ga4Id: String(updatedSettings.ga4Id || ''),
          gtmId: String(updatedSettings.gtmId || ''),
          clarityId: String(updatedSettings.clarityId || ''),
          fbPixelId: String(updatedSettings.fbPixelId || ''),
          maintenanceMode: Boolean(updatedSettings.maintenanceMode),
          allowMp3Conversion: Boolean(updatedSettings.allowMp3Conversion),
          watermarkFreeByDefault: Boolean(updatedSettings.watermarkFreeByDefault),
          headerStyle: String(updatedSettings.headerStyle || 'sticky'),
          customCss: String(customCss || ''),
          customJs: String(customJs || ''),
          socialLinksJson,
        },
      }),
    null,
    'saveGlobalSettings'
  ).catch(() => {});

  return {
    settings: updatedSettings,
    syncVersion: memoryDb.syncVersion,
  };
}

// === Ads Placements ===
export async function getAds() {
  const { result: dbRecord } = await withSafeDb(
    async () => prisma.globalSettings.findUnique({ where: { id: 'default' } }),
    null,
    'getAds'
  );

  if (dbRecord && dbRecord.adsConfigJson) {
    try {
      const parsed = JSON.parse(dbRecord.adsConfigJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryDb.ads = parsed;
        return parsed;
      }
    } catch {}
  }

  return memoryDb.ads;
}

export async function saveAds(ads: any[]) {
  memoryDb.syncVersion += 1;
  memoryDb.ads = ads;
  persistToDisk();

  withSafeDb(
    async () =>
      prisma.globalSettings.upsert({
        where: { id: 'default' },
        update: { adsConfigJson: JSON.stringify(ads) },
        create: { id: 'default', adsConfigJson: JSON.stringify(ads) },
      }),
    null,
    'saveAds'
  ).catch(() => {});

  return { ads, syncVersion: memoryDb.syncVersion };
}

// === Platforms ===
export async function getPlatforms() {
  const { result: dbRecord } = await withSafeDb(
    async () => prisma.globalSettings.findUnique({ where: { id: 'default' } }),
    null,
    'getPlatforms'
  );

  if (dbRecord && dbRecord.platformsConfigJson) {
    try {
      const parsed = JSON.parse(dbRecord.platformsConfigJson);
      memoryDb.platforms = parsed;
      return parsed;
    } catch {}
  }

  return memoryDb.platforms;
}

export async function savePlatforms(platforms: any) {
  memoryDb.syncVersion += 1;
  memoryDb.platforms = platforms;
  persistToDisk();

  withSafeDb(
    async () =>
      prisma.globalSettings.upsert({
        where: { id: 'default' },
        update: { platformsConfigJson: JSON.stringify(platforms) },
        create: { id: 'default', platformsConfigJson: JSON.stringify(platforms) },
      }),
    null,
    'savePlatforms'
  ).catch(() => {});

  return { platforms, syncVersion: memoryDb.syncVersion };
}

// === SEO ===
export async function getSeo() {
  const { result: dbRecord } = await withSafeDb(
    async () => prisma.globalSettings.findUnique({ where: { id: 'default' } }),
    null,
    'getSeo'
  );

  if (dbRecord && dbRecord.seoConfigJson) {
    try {
      const parsed = JSON.parse(dbRecord.seoConfigJson);
      memoryDb.seo = parsed;
      return parsed;
    } catch {}
  }

  return memoryDb.seo;
}

export async function saveSeo(seo: any) {
  memoryDb.syncVersion += 1;
  memoryDb.seo = seo;
  persistToDisk();

  withSafeDb(
    async () =>
      prisma.globalSettings.upsert({
        where: { id: 'default' },
        update: { seoConfigJson: JSON.stringify(seo) },
        create: { id: 'default', seoConfigJson: JSON.stringify(seo) },
      }),
    null,
    'saveSeo'
  ).catch(() => {});

  return { seo, syncVersion: memoryDb.syncVersion };
}

// === CMS Pages ===
export async function getPages() {
  const { result: dbRecord } = await withSafeDb(
    async () => prisma.globalSettings.findUnique({ where: { id: 'default' } }),
    null,
    'getPages'
  );

  if (dbRecord && dbRecord.pagesConfigJson) {
    try {
      const parsed = JSON.parse(dbRecord.pagesConfigJson);
      if (Array.isArray(parsed)) {
        memoryDb.pages = parsed;
        return parsed;
      }
    } catch {}
  }

  return memoryDb.pages;
}

export async function savePages(pages: any[]) {
  memoryDb.syncVersion += 1;
  memoryDb.pages = pages;
  persistToDisk();

  withSafeDb(
    async () =>
      prisma.globalSettings.upsert({
        where: { id: 'default' },
        update: { pagesConfigJson: JSON.stringify(pages) },
        create: { id: 'default', pagesConfigJson: JSON.stringify(pages) },
      }),
    null,
    'savePages'
  ).catch(() => {});

  return { pages, syncVersion: memoryDb.syncVersion };
}

// === FAQs ===
export async function getFaqs() {
  const { result: dbRecord } = await withSafeDb(
    async () => prisma.globalSettings.findUnique({ where: { id: 'default' } }),
    null,
    'getFaqs'
  );

  if (dbRecord && dbRecord.faqsConfigJson) {
    try {
      const parsed = JSON.parse(dbRecord.faqsConfigJson);
      if (Array.isArray(parsed)) {
        memoryDb.faqs = parsed;
        return parsed;
      }
    } catch {}
  }

  return memoryDb.faqs;
}

export async function saveFaqs(faqs: any[]) {
  memoryDb.syncVersion += 1;
  memoryDb.faqs = faqs;
  persistToDisk();

  withSafeDb(
    async () =>
      prisma.globalSettings.upsert({
        where: { id: 'default' },
        update: { faqsConfigJson: JSON.stringify(faqs) },
        create: { id: 'default', faqsConfigJson: JSON.stringify(faqs) },
      }),
    null,
    'saveFaqs'
  ).catch(() => {});

  return { faqs, syncVersion: memoryDb.syncVersion };
}

// === Blogs ===
export async function getBlogs() {
  const { result: dbRecord } = await withSafeDb(
    async () => prisma.globalSettings.findUnique({ where: { id: 'default' } }),
    null,
    'getBlogs'
  );

  if (dbRecord && dbRecord.blogsConfigJson) {
    try {
      const parsed = JSON.parse(dbRecord.blogsConfigJson);
      if (Array.isArray(parsed)) {
        memoryDb.blogs = parsed;
        return parsed;
      }
    } catch {}
  }

  return memoryDb.blogs;
}

export async function saveBlogs(blogs: any[]) {
  memoryDb.syncVersion += 1;
  memoryDb.blogs = blogs;
  persistToDisk();

  withSafeDb(
    async () =>
      prisma.globalSettings.upsert({
        where: { id: 'default' },
        update: { blogsConfigJson: JSON.stringify(blogs) },
        create: { id: 'default', blogsConfigJson: JSON.stringify(blogs) },
      }),
    null,
    'saveBlogs'
  ).catch(() => {});

  return { blogs, syncVersion: memoryDb.syncVersion };
}

// === SMTP ===
export async function getSmtp() {
  const { result: dbRecord } = await withSafeDb(
    async () => prisma.globalSettings.findUnique({ where: { id: 'default' } }),
    null,
    'getSmtp'
  );

  if (dbRecord && dbRecord.smtpConfigJson) {
    try {
      const parsed = JSON.parse(dbRecord.smtpConfigJson);
      memoryDb.smtp = { ...memoryDb.smtp, ...parsed };
    } catch {}
  }

  return memoryDb.smtp;
}

export async function saveSmtp(smtp: any) {
  memoryDb.syncVersion += 1;
  memoryDb.smtp = { ...memoryDb.smtp, ...smtp };
  persistToDisk();

  withSafeDb(
    async () =>
      prisma.globalSettings.upsert({
        where: { id: 'default' },
        update: { smtpConfigJson: JSON.stringify(memoryDb.smtp) },
        create: { id: 'default', smtpConfigJson: JSON.stringify(memoryDb.smtp) },
      }),
    null,
    'saveSmtp'
  ).catch(() => {});

  return { smtp: memoryDb.smtp, syncVersion: memoryDb.syncVersion };
}

// === Email Alerts ===
export async function getEmailAlerts() {
  const { result: dbRecord } = await withSafeDb(
    async () => prisma.globalSettings.findUnique({ where: { id: 'default' } }),
    null,
    'getEmailAlerts'
  );

  if (dbRecord && dbRecord.emailAlertsConfigJson) {
    try {
      const parsed = JSON.parse(dbRecord.emailAlertsConfigJson);
      memoryDb.emailAlerts = { ...memoryDb.emailAlerts, ...parsed };
    } catch {}
  }

  return memoryDb.emailAlerts;
}

export async function saveEmailAlerts(alerts: any) {
  memoryDb.syncVersion += 1;
  memoryDb.emailAlerts = { ...memoryDb.emailAlerts, ...alerts };
  persistToDisk();

  withSafeDb(
    async () =>
      prisma.globalSettings.upsert({
        where: { id: 'default' },
        update: { emailAlertsConfigJson: JSON.stringify(memoryDb.emailAlerts) },
        create: { id: 'default', emailAlertsConfigJson: JSON.stringify(memoryDb.emailAlerts) },
      }),
    null,
    'saveEmailAlerts'
  ).catch(() => {});

  return { alerts: memoryDb.emailAlerts, syncVersion: memoryDb.syncVersion };
}

// === Redirects ===
export async function getRedirects() {
  const { result: dbRecord } = await withSafeDb(
    async () => prisma.globalSettings.findUnique({ where: { id: 'default' } }),
    null,
    'getRedirects'
  );

  if (dbRecord && dbRecord.redirectsConfigJson) {
    try {
      const parsed = JSON.parse(dbRecord.redirectsConfigJson);
      if (Array.isArray(parsed)) {
        memoryDb.redirects = parsed;
        return parsed;
      }
    } catch {}
  }

  return memoryDb.redirects;
}

export async function saveRedirects(redirects: any[]) {
  memoryDb.syncVersion += 1;
  memoryDb.redirects = redirects;
  persistToDisk();

  withSafeDb(
    async () =>
      prisma.globalSettings.upsert({
        where: { id: 'default' },
        update: { redirectsConfigJson: JSON.stringify(redirects) },
        create: { id: 'default', redirectsConfigJson: JSON.stringify(redirects) },
      }),
    null,
    'saveRedirects'
  ).catch(() => {});

  return { redirects, syncVersion: memoryDb.syncVersion };
}

// === Users ===
export async function getUsers() {
  const { result: dbRecord } = await withSafeDb(
    async () => prisma.globalSettings.findUnique({ where: { id: 'default' } }),
    null,
    'getUsers'
  );

  if (dbRecord && dbRecord.usersConfigJson) {
    try {
      const parsed = JSON.parse(dbRecord.usersConfigJson);
      if (Array.isArray(parsed)) {
        memoryDb.users = parsed;
        return parsed;
      }
    } catch {}
  }

  return memoryDb.users;
}

export async function saveUsers(users: any[]) {
  memoryDb.syncVersion += 1;
  memoryDb.users = users;
  persistToDisk();

  withSafeDb(
    async () =>
      prisma.globalSettings.upsert({
        where: { id: 'default' },
        update: { usersConfigJson: JSON.stringify(users) },
        create: { id: 'default', usersConfigJson: JSON.stringify(users) },
      }),
    null,
    'saveUsers'
  ).catch(() => {});

  return { users, syncVersion: memoryDb.syncVersion };
}

// === Security ===
export async function getSecurity() {
  const { result: dbRecord } = await withSafeDb(
    async () => prisma.globalSettings.findUnique({ where: { id: 'default' } }),
    null,
    'getSecurity'
  );

  if (dbRecord && dbRecord.securityConfigJson) {
    try {
      const parsed = JSON.parse(dbRecord.securityConfigJson);
      memoryDb.security = { ...memoryDb.security, ...parsed };
    } catch {}
  }

  return memoryDb.security;
}

export async function saveSecurity(security: any) {
  memoryDb.syncVersion += 1;
  memoryDb.security = { ...memoryDb.security, ...security };
  persistToDisk();

  withSafeDb(
    async () =>
      prisma.globalSettings.upsert({
        where: { id: 'default' },
        update: { securityConfigJson: JSON.stringify(memoryDb.security) },
        create: { id: 'default', securityConfigJson: JSON.stringify(memoryDb.security) },
      }),
    null,
    'saveSecurity'
  ).catch(() => {});

  return { security: memoryDb.security, syncVersion: memoryDb.syncVersion };
}

// === Audit Logs ===
export async function getAuditLogs() {
  const { result: dbLogs } = await withSafeDb(
    async () =>
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    [],
    'getAuditLogs'
  );

  if (dbLogs && dbLogs.length > 0) {
    return dbLogs;
  }

  return memoryDb.auditLogs;
}

export async function addAuditLog(log: { userEmail: string; action: string; details: string; ipAddress?: string }) {
  const newLog = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    ...log,
    createdAt: new Date().toISOString(),
  };

  memoryDb.auditLogs = [newLog, ...memoryDb.auditLogs].slice(0, 100);
  persistToDisk();

  withSafeDb(
    async () =>
      prisma.auditLog.create({
        data: {
          userEmail: log.userEmail || 'admin@omnifetchpro.com',
          action: log.action || 'ADMIN_ACTION',
          details: log.details || '',
          ipAddress: log.ipAddress || '127.0.0.1',
        },
      }),
    null,
    'addAuditLog'
  ).catch(() => {});

  return newLog;
}

// === Trending Downloads ===
export async function getTrendingDownloads() {
  const { result: dbItems } = await withSafeDb(
    async () =>
      prisma.downloadLog.findMany({
        orderBy: { downloadCount: 'desc' },
        take: 12,
      }),
    [],
    'getTrendingDownloads'
  );

  if (dbItems && dbItems.length > 0) {
    return dbItems;
  }

  return memoryDb.trendingDownloads;
}

export const getTrendingLogs = getTrendingDownloads;

export async function getDownloadLogs(): Promise<any[]> {
  const dbRecords = await withSafeDb(
    () => prisma.downloadLog.findMany({ orderBy: { updatedAt: 'desc' }, take: 100 }),
    null,
    'getDownloadLogs'
  );

  if (dbRecords && Array.isArray(dbRecords) && dbRecords.length > 0) {
    return dbRecords;
  }

  return memoryDb.trendingDownloads;
}

export async function recordDownloadLog(item: {
  url: string;
  title?: string;
  platform?: string;
  thumbnail?: string;
  quality?: string;
  ipAddress?: string;
}) {
  const existingIdx = memoryDb.trendingDownloads.findIndex((d) => d.url === item.url);
  let resultItem: any = null;

  if (existingIdx >= 0) {
    memoryDb.trendingDownloads[existingIdx].downloadCount =
      (memoryDb.trendingDownloads[existingIdx].downloadCount || 1) + 1;
    memoryDb.trendingDownloads[existingIdx].lastDownloadedAt = new Date().toISOString();
    resultItem = memoryDb.trendingDownloads[existingIdx];
  } else {
    resultItem = {
      id: 'trend_' + Date.now(),
      url: item.url,
      title: item.title || 'Extracted Media',
      platform: item.platform || 'General',
      thumbnail: item.thumbnail || '',
      quality: item.quality || 'HD',
      downloadCount: 1,
      lastDownloadedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    memoryDb.trendingDownloads.unshift(resultItem);
    memoryDb.trendingDownloads = memoryDb.trendingDownloads.slice(0, 50);
  }
  persistToDisk();

  withSafeDb(
    async () => {
      const record = await prisma.downloadLog.findFirst({ where: { url: item.url } });
      if (record) {
        return prisma.downloadLog.update({
          where: { id: record.id },
          data: {
            downloadCount: record.downloadCount + 1,
            title: item.title || record.title,
            thumbnail: item.thumbnail || record.thumbnail,
            updatedAt: new Date(),
          },
        });
      } else {
        return prisma.downloadLog.create({
          data: {
            url: item.url,
            title: item.title || 'Extracted Media',
            platform: item.platform || 'General',
            thumbnail: item.thumbnail || '',
            quality: item.quality || 'HD',
            ipAddress: item.ipAddress || '127.0.0.1',
            downloadCount: 1,
          },
        });
      }
    },
    null,
    'recordDownloadLog'
  ).catch(() => {});

  return resultItem;
}

export const addTrendingDownload = recordDownloadLog;
