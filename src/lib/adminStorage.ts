import {
  GlobalSeoConfig,
  RedirectRule,
  ManagedPage,
  AdminUser,
  ApiHealthStatus,
  SecurityConfig,
  SmtpConfig,
  EmailAlertSettings,
  PlatformConfig,
  PlatformSlug,
} from '../types';
import { PLATFORMS_CONFIG } from '../config/siteConfig';

// Internal Memory Caches
let cachedPlatforms: Record<string, PlatformConfig> = PLATFORMS_CONFIG;
let cachedSeo: GlobalSeoConfig = {
  metaTitle: 'OmniFetch Pro - Free All-in-One Video Downloader (TikTok, FB, IG, YT)',
  metaDescription: 'Download TikTok videos without watermark, Facebook Reels, Instagram Stories, YouTube Shorts and Snapchat videos in HD for free.',
  keywords: 'video downloader, tiktok downloader no watermark, facebook video downloader, instagram reel saver, youtube shorts downloader',
  canonicalUrl: 'https://omnifetchpro.com',
  robotsDirective: 'index, follow, max-image-preview:large, max-snippet:-1',
  ogImage: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=1200&q=80',
  twitterHandle: '@OmniFetchPro',
  organizationSchema: JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'OmniFetch Pro',
    'url': 'https://omnifetchpro.com',
    'logo': 'https://omnifetchpro.com/logo.png',
  }, null, 2),
  websiteSchema: JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'OmniFetch Pro',
    'url': 'https://omnifetchpro.com',
  }, null, 2),
};

export const DEFAULT_SMTP_CONFIG: SmtpConfig = {
  host: 'smtp.mailgun.org',
  port: 587,
  secure: true,
  user: 'postmaster@mg.omnifetchpro.com',
  pass: '••••••••••••••••',
  senderEmail: 'alerts@omnifetchpro.com',
  senderName: 'OmniFetch Monitoring Bot',
};

export const DEFAULT_EMAIL_ALERTS: EmailAlertSettings = {
  enabled: true,
  recipientEmails: ['admin@omnifetchpro.com', 'devops@omnifetchpro.com'],
  alertOnHighErrorRate: true,
  errorRateThresholdPercent: 5.0,
  alertOnDbConnectionFailure: true,
  alertOnProxyDowntime: true,
  alertOnRateLimitSpike: true,
  digestFrequency: 'Instant',
};

export const DEFAULT_REDIRECTS: RedirectRule[] = [
  { id: 'red_1', fromUrl: '/download-tiktok', toUrl: '/#tiktok', type: 301, active: true, hits: 1420, createdAt: '2026-01-15' },
  { id: 'red_2', fromUrl: '/yt-downloader', toUrl: '/#youtube', type: 301, active: true, hits: 890, createdAt: '2026-02-01' },
  { id: 'red_3', fromUrl: '/fb-reels-download', toUrl: '/#facebook', type: 302, active: true, hits: 512, createdAt: '2026-03-10' },
];

export const DEFAULT_PAGES: ManagedPage[] = [
  {
    id: 'page_privacy',
    title: 'Privacy Policy',
    slug: 'privacy-policy',
    content: 'OmniFetch Pro respects your privacy and does not log personal identifiable information...',
    published: true,
    metaTitle: 'Privacy Policy - OmniFetch Pro Video Downloader',
    metaDescription: 'Read the privacy policy of OmniFetch Pro online media downloader.',
    order: 1,
    updatedAt: '2026-06-01',
  },
  {
    id: 'page_terms',
    title: 'Terms of Service',
    slug: 'terms-of-service',
    content: 'By using OmniFetch Pro, you agree to respect content copyrights and personal use guidelines...',
    published: true,
    metaTitle: 'Terms of Service & Usage Conditions',
    metaDescription: 'Terms of service for downloading social media content via OmniFetch Pro.',
    order: 2,
    updatedAt: '2026-06-01',
  },
];

export const DEFAULT_USERS: AdminUser[] = [
  { id: 'u_1', name: 'Mahmoud Kamel', email: 'admin@omnifetchpro.com', role: 'Admin', status: 'Active', lastLogin: '2 mins ago', twoFactorEnabled: true },
];

export const DEFAULT_APIS: ApiHealthStatus[] = [
  { id: 'api_1', name: 'TikTok Direct Scraper v3', type: 'TikTok', endpoint: 'https://api.tiktok.com/v2/video', status: 'HEALTHY', latencyMs: 120, dailyRequests: 482100, errorRatePercent: 0.1, autoFailover: true },
  { id: 'api_2', name: 'YouTube Data & Stream Proxy', type: 'YouTube', endpoint: 'https://youtube.googleapis.com/v3', status: 'HEALTHY', latencyMs: 180, dailyRequests: 320400, errorRatePercent: 0.2, autoFailover: true },
  { id: 'api_3', name: 'Facebook Graph & Reels Proxy', type: 'Facebook', endpoint: 'https://graph.facebook.com/v18.0', status: 'HEALTHY', latencyMs: 210, dailyRequests: 194000, errorRatePercent: 0.4, autoFailover: true },
  { id: 'api_4', name: 'Instagram Story & Media Scraper', type: 'Instagram', endpoint: 'https://i.instagram.com/api/v1', status: 'HEALTHY', latencyMs: 250, dailyRequests: 285000, errorRatePercent: 0.5, autoFailover: true },
  { id: 'api_5', name: 'Gemini AI Content Generator', type: 'Gemini AI', endpoint: 'https://generativelanguage.googleapis.com/v1beta', status: 'HEALTHY', latencyMs: 340, dailyRequests: 14200, errorRatePercent: 0.0, autoFailover: true },
];

export const DEFAULT_SECURITY: SecurityConfig = {
  twoFactorRequired: true,
  rateLimitPerMin: 60,
  ipWhitelist: ['127.0.0.1'],
  ipBlacklist: [],
  blockedCountries: [],
  captchaEnabled: true,
  autoBackupsEnabled: true,
  backupFrequency: 'Daily',
};

export const DEFAULT_ROBOTS_TXT = `User-agent: *
Allow: /
Disallow: /admin-download
Disallow: /api/

Sitemap: https://omnifetchpro.com/sitemap.xml
`;

export function applySeoToDocument(config: GlobalSeoConfig): void {
  if (typeof document === 'undefined') return;

  if (config.metaTitle) {
    document.title = config.metaTitle;
  }

  const setMeta = (attrName: string, attrVal: string, contentVal: string) => {
    if (!contentVal) return;
    let el = document.querySelector(`meta[${attrName}="${attrVal}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attrName, attrVal);
      document.head.appendChild(el);
    }
    el.setAttribute('content', contentVal);
  };

  const setLink = (relVal: string, hrefVal: string) => {
    if (!hrefVal) return;
    let el = document.querySelector(`link[rel="${relVal}"]`);
    if (!el) {
      el = document.createElement('link');
      el.setAttribute('rel', relVal);
      document.head.appendChild(el);
    }
    el.setAttribute('href', hrefVal);
  };

  setMeta('name', 'description', config.metaDescription);
  setMeta('name', 'keywords', config.keywords);
  setMeta('name', 'robots', config.robotsDirective);
  setMeta('property', 'og:title', config.metaTitle);
  setMeta('property', 'og:description', config.metaDescription);
  setMeta('property', 'og:image', config.ogImage);
  setMeta('property', 'og:url', config.canonicalUrl || window.location.href);
  setMeta('property', 'og:type', 'website');
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', config.metaTitle);
  setMeta('name', 'twitter:description', config.metaDescription);
  setMeta('name', 'twitter:image', config.ogImage);
  if (config.twitterHandle) {
    setMeta('name', 'twitter:site', config.twitterHandle);
  }
  setLink('canonical', config.canonicalUrl);
}

// --- SEO Config ---
export function getGlobalSeoConfig(): GlobalSeoConfig {
  return cachedSeo;
}

export async function fetchGlobalSeoFromDb(): Promise<GlobalSeoConfig> {
  try {
    const res = await fetch('/api/seo');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.seo) {
        cachedSeo = { ...cachedSeo, ...data.seo };
        applySeoToDocument(cachedSeo);
        return cachedSeo;
      }
    }
  } catch (e) {
    console.error('Error fetching SEO from DB:', e);
  }
  return cachedSeo;
}

export async function saveGlobalSeoConfigToDb(config: GlobalSeoConfig): Promise<GlobalSeoConfig> {
  const res = await fetch('/api/seo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seo: config }),
  });
  if (!res.ok) throw new Error(`Server returned status ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error('Failed to save SEO config');

  cachedSeo = config;
  applySeoToDocument(config);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('omnifetch_seo_updated', { detail: config }));
  }
  return config;
}

export function saveGlobalSeoConfig(config: GlobalSeoConfig): void {
  cachedSeo = config;
  applySeoToDocument(config);
  saveGlobalSeoConfigToDb(config).catch((e) => console.error('Background save SEO error:', e));
}

// --- Platforms Config ---
export function getStoredPlatformsConfig(): Record<string, PlatformConfig> {
  return cachedPlatforms;
}

export async function fetchPlatformsConfigFromDb(): Promise<Record<string, PlatformConfig>> {
  try {
    const res = await fetch('/api/platforms');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.platforms) {
        cachedPlatforms = data.platforms;
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('omnifetch_platforms_updated', { detail: cachedPlatforms }));
        }
        return cachedPlatforms;
      }
    }
  } catch (e) {
    console.error('Error fetching platforms from DB:', e);
  }
  return cachedPlatforms;
}

export async function saveStoredPlatformsConfigToDb(platforms: Record<string, PlatformConfig>): Promise<Record<string, PlatformConfig>> {
  const res = await fetch('/api/platforms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ platforms }),
  });
  if (!res.ok) throw new Error(`Server returned status ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error('Failed to save platforms config');

  cachedPlatforms = platforms;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('omnifetch_platforms_updated', { detail: cachedPlatforms }));
  }
  return cachedPlatforms;
}

export function saveStoredPlatformsConfig(platforms: Record<string, PlatformConfig>): void {
  cachedPlatforms = platforms;
  saveStoredPlatformsConfigToDb(platforms).catch((e) => console.error('Background save platforms error:', e));
}

// Internal Caches
let cachedPages: ManagedPage[] = DEFAULT_PAGES;
let cachedSmtp: SmtpConfig = DEFAULT_SMTP_CONFIG;
let cachedEmailAlerts: EmailAlertSettings = DEFAULT_EMAIL_ALERTS;
let cachedRedirects: RedirectRule[] = DEFAULT_REDIRECTS;
let cachedUsers: AdminUser[] = DEFAULT_USERS;
let cachedSecurity: SecurityConfig = DEFAULT_SECURITY;

// --- Redirects, Pages, Users, APIs, Security, Robots, SMTP ---
export function getRedirectRules(): RedirectRule[] { return cachedRedirects; }
export async function fetchRedirectRulesFromDb(): Promise<RedirectRule[]> {
  try {
    const res = await fetch('/api/redirects');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.redirects) cachedRedirects = data.redirects;
    }
  } catch (e) {}
  return cachedRedirects;
}
export function saveRedirectRules(rules: RedirectRule[]): void {
  cachedRedirects = rules;
  fetch('/api/redirects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ redirects: rules }),
  }).catch(() => {});
}

export function getManagedPages(): ManagedPage[] { return cachedPages; }
export async function fetchManagedPagesFromDb(): Promise<ManagedPage[]> {
  try {
    const res = await fetch('/api/cms/pages');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.pages) {
        cachedPages = data.pages;
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('omnifetch_pages_updated', { detail: cachedPages }));
        }
      }
    }
  } catch (e) {}
  return cachedPages;
}
export function saveManagedPages(pages: ManagedPage[]): void {
  cachedPages = pages;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('omnifetch_pages_updated', { detail: pages }));
  }
  fetch('/api/cms/pages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pages }),
  }).catch(() => {});
}

export function getAdminUsers(): AdminUser[] { return cachedUsers; }
export async function fetchAdminUsersFromDb(): Promise<AdminUser[]> {
  try {
    const res = await fetch('/api/users');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.users) cachedUsers = data.users;
    }
  } catch (e) {}
  return cachedUsers;
}
export function saveAdminUsers(users: AdminUser[]): void {
  cachedUsers = users;
  fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ users }),
  }).catch(() => {});
}

export function getApiHealthList(): ApiHealthStatus[] { return DEFAULT_APIS; }
export function saveApiHealthList(apis: ApiHealthStatus[]): void {}

export function getSecurityConfig(): SecurityConfig { return cachedSecurity; }
export async function fetchSecurityConfigFromDb(): Promise<SecurityConfig> {
  try {
    const res = await fetch('/api/security');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.security && typeof data.security === 'object') {
        cachedSecurity = {
          ...DEFAULT_SECURITY,
          ...data.security,
          ipWhitelist: Array.isArray(data.security.ipWhitelist) ? data.security.ipWhitelist : DEFAULT_SECURITY.ipWhitelist,
          ipBlacklist: Array.isArray(data.security.ipBlacklist) ? data.security.ipBlacklist : DEFAULT_SECURITY.ipBlacklist,
          blockedCountries: Array.isArray(data.security.blockedCountries) ? data.security.blockedCountries : DEFAULT_SECURITY.blockedCountries,
        };
      }
    }
  } catch (e) {}
  return cachedSecurity;
}
export function saveSecurityConfig(sec: SecurityConfig): void {
  cachedSecurity = sec;
  fetch('/api/security', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ security: sec }),
  }).catch(() => {});
}

export function getRobotsTxt(): string { return DEFAULT_ROBOTS_TXT; }
export function saveRobotsTxt(txt: string): void {}

export function getSmtpConfig(): SmtpConfig { return cachedSmtp; }
export async function fetchSmtpConfigFromDb(): Promise<SmtpConfig> {
  try {
    const res = await fetch('/api/smtp');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.smtp && typeof data.smtp === 'object') {
        cachedSmtp = {
          ...DEFAULT_SMTP_CONFIG,
          ...data.smtp,
        };
      }
    }
  } catch (e) {}
  return cachedSmtp;
}
export function saveSmtpConfig(config: SmtpConfig): void {
  cachedSmtp = config;
  fetch('/api/smtp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ smtp: config }),
  }).catch(() => {});
}

export function getEmailAlertSettings(): EmailAlertSettings { return cachedEmailAlerts; }
export async function fetchEmailAlertsFromDb(): Promise<EmailAlertSettings> {
  try {
    const res = await fetch('/api/email-alerts');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.alerts && typeof data.alerts === 'object') {
        cachedEmailAlerts = {
          ...DEFAULT_EMAIL_ALERTS,
          ...data.alerts,
          recipientEmails: Array.isArray(data.alerts.recipientEmails)
            ? data.alerts.recipientEmails
            : DEFAULT_EMAIL_ALERTS.recipientEmails,
        };
      }
    }
  } catch (e) {}
  return cachedEmailAlerts;
}
export function saveEmailAlertSettings(settings: EmailAlertSettings): void {
  cachedEmailAlerts = settings;
  fetch('/api/email-alerts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alerts: settings }),
  }).catch(() => {});
}
