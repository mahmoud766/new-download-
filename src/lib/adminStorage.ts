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

const GLOBAL_SEO_KEY = 'omnifetch_global_seo_v1';
const REDIRECTS_KEY = 'omnifetch_redirects_v1';
const PAGES_KEY = 'omnifetch_pages_v1';
const USERS_KEY = 'omnifetch_admin_users_v1';
const APIS_KEY = 'omnifetch_api_health_v1';
const SECURITY_KEY = 'omnifetch_security_config_v1';
const ROBOTS_KEY = 'omnifetch_robots_txt_v1';
const SMTP_CONFIG_KEY = 'omnifetch_smtp_config_v1';
const EMAIL_ALERTS_KEY = 'omnifetch_email_alerts_v1';
const PLATFORMS_KEY = 'omnifetch_platforms_config_v1';

export const DEFAULT_SMTP_CONFIG: SmtpConfig = {
  host: 'smtp.mailgun.org',
  port: 587,
  secure: true,
  user: 'postmaster@mg.omnifetch.com',
  pass: '••••••••••••••••',
  senderEmail: 'alerts@omnifetch.com',
  senderName: 'OmniFetch Monitoring Bot',
};

export const DEFAULT_EMAIL_ALERTS: EmailAlertSettings = {
  enabled: true,
  recipientEmails: ['admin@omnifetch.com', 'devops@omnifetch.com'],
  alertOnHighErrorRate: true,
  errorRateThresholdPercent: 5.0,
  alertOnDbConnectionFailure: true,
  alertOnProxyDowntime: true,
  alertOnRateLimitSpike: true,
  digestFrequency: 'Instant',
};

export const DEFAULT_GLOBAL_SEO: GlobalSeoConfig = {
  metaTitle: 'OmniFetch - Free All-in-One Video Downloader (TikTok, FB, IG, YT)',
  metaDescription: 'Download TikTok videos without watermark, Facebook Reels, Instagram Stories, YouTube Shorts and Snapchat videos in HD for free.',
  keywords: 'video downloader, tiktok downloader no watermark, facebook video downloader, instagram reel saver, youtube shorts downloader',
  canonicalUrl: 'https://omnifetch.com',
  robotsDirective: 'index, follow, max-image-preview:large, max-snippet:-1',
  ogImage: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=1200&q=80',
  twitterHandle: '@OmniFetchPro',
  organizationSchema: JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'OmniFetch Pro',
    'url': 'https://omnifetch.com',
    'logo': 'https://omnifetch.com/logo.png',
  }, null, 2),
  websiteSchema: JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'OmniFetch',
    'url': 'https://omnifetch.com',
    'potentialAction': {
      '@type': 'SearchAction',
      'target': 'https://omnifetch.com/?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  }, null, 2),
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
    content: 'OmniFetch respects your privacy and does not log personal identifiable information...',
    published: true,
    metaTitle: 'Privacy Policy - OmniFetch Video Downloader',
    metaDescription: 'Read the privacy policy of OmniFetch online media downloader.',
    order: 1,
    updatedAt: '2026-06-01',
  },
  {
    id: 'page_terms',
    title: 'Terms of Service',
    slug: 'terms-of-service',
    content: 'By using OmniFetch, you agree to respect content copyrights and personal use guidelines...',
    published: true,
    metaTitle: 'Terms of Service & Usage Conditions',
    metaDescription: 'Terms of service for downloading social media content via OmniFetch.',
    order: 2,
    updatedAt: '2026-06-01',
  },
  {
    id: 'page_contact',
    title: 'Contact Us',
    slug: 'contact',
    content: 'Have questions or feedback? Contact the OmniFetch support engineering team...',
    published: true,
    metaTitle: 'Contact Us - OmniFetch Team',
    metaDescription: 'Get in touch with OmniFetch support for API access, bug reports or feedback.',
    order: 3,
    updatedAt: '2026-07-10',
  }
];

export const DEFAULT_USERS: AdminUser[] = [
  { id: 'u_1', name: 'Mahmoud Kamel', email: 'admin@omnifetch.com', role: 'Admin', status: 'Active', lastLogin: '2 mins ago', twoFactorEnabled: true },
  { id: 'u_2', name: 'Sarah Connor', email: 'seo@omnifetch.com', role: 'SEO Manager', status: 'Active', lastLogin: '1 hour ago', twoFactorEnabled: true },
  { id: 'u_3', name: 'Alex Rivera', email: 'editor@omnifetch.com', role: 'Content Manager', status: 'Active', lastLogin: 'Yesterday', twoFactorEnabled: false },
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
  ipWhitelist: ['127.0.0.1', '192.168.1.1'],
  ipBlacklist: ['45.142.120.10', '185.220.101.5'],
  blockedCountries: ['KP', 'SY'],
  captchaEnabled: true,
  autoBackupsEnabled: true,
  backupFrequency: 'Daily',
};

export const DEFAULT_ROBOTS_TXT = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Disallow: /private/

Sitemap: https://omnifetch.com/sitemap.xml
Sitemap: https://omnifetch.com/sitemap-blogs.xml
`;

// Helper to apply SEO meta tags to document head
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

// Helper get / set functions
export function getGlobalSeoConfig(): GlobalSeoConfig {
  try {
    const raw = localStorage.getItem(GLOBAL_SEO_KEY);
    const config = raw ? JSON.parse(raw) : DEFAULT_GLOBAL_SEO;
    return config;
  } catch {
    return DEFAULT_GLOBAL_SEO;
  }
}

export function saveGlobalSeoConfig(config: GlobalSeoConfig): void {
  localStorage.setItem(GLOBAL_SEO_KEY, JSON.stringify(config));
  applySeoToDocument(config);
}

export function getRedirectRules(): RedirectRule[] {
  try {
    const raw = localStorage.getItem(REDIRECTS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_REDIRECTS;
  } catch {
    return DEFAULT_REDIRECTS;
  }
}

export function saveRedirectRules(rules: RedirectRule[]): void {
  localStorage.setItem(REDIRECTS_KEY, JSON.stringify(rules));
}

export function getManagedPages(): ManagedPage[] {
  try {
    const raw = localStorage.getItem(PAGES_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_PAGES;
  } catch {
    return DEFAULT_PAGES;
  }
}

export function saveManagedPages(pages: ManagedPage[]): void {
  localStorage.setItem(PAGES_KEY, JSON.stringify(pages));
}

export function getAdminUsers(): AdminUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_USERS;
  } catch {
    return DEFAULT_USERS;
  }
}

export function saveAdminUsers(users: AdminUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getApiHealthList(): ApiHealthStatus[] {
  try {
    const raw = localStorage.getItem(APIS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_APIS;
  } catch {
    return DEFAULT_APIS;
  }
}

export function saveApiHealthList(apis: ApiHealthStatus[]): void {
  localStorage.setItem(APIS_KEY, JSON.stringify(apis));
}

export function getSecurityConfig(): SecurityConfig {
  try {
    const raw = localStorage.getItem(SECURITY_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_SECURITY;
  } catch {
    return DEFAULT_SECURITY;
  }
}

export function saveSecurityConfig(sec: SecurityConfig): void {
  localStorage.setItem(SECURITY_KEY, JSON.stringify(sec));
}

export function getRobotsTxt(): string {
  try {
    const raw = localStorage.getItem(ROBOTS_KEY);
    return raw || DEFAULT_ROBOTS_TXT;
  } catch {
    return DEFAULT_ROBOTS_TXT;
  }
}

export function saveRobotsTxt(txt: string): void {
  localStorage.setItem(ROBOTS_KEY, txt);
}

export function getSmtpConfig(): SmtpConfig {
  try {
    const raw = localStorage.getItem(SMTP_CONFIG_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_SMTP_CONFIG;
  } catch {
    return DEFAULT_SMTP_CONFIG;
  }
}

export function saveSmtpConfig(config: SmtpConfig): void {
  localStorage.setItem(SMTP_CONFIG_KEY, JSON.stringify(config));
}

export function getEmailAlertSettings(): EmailAlertSettings {
  try {
    const raw = localStorage.getItem(EMAIL_ALERTS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_EMAIL_ALERTS;
  } catch {
    return DEFAULT_EMAIL_ALERTS;
  }
}

export function saveEmailAlertSettings(settings: EmailAlertSettings): void {
  localStorage.setItem(EMAIL_ALERTS_KEY, JSON.stringify(settings));
}

export function getStoredPlatformsConfig(): Record<string, PlatformConfig> {
  try {
    const raw = localStorage.getItem(PLATFORMS_KEY);
    return raw ? JSON.parse(raw) : PLATFORMS_CONFIG;
  } catch {
    return PLATFORMS_CONFIG;
  }
}

export function saveStoredPlatformsConfig(platforms: Record<string, PlatformConfig>): void {
  localStorage.setItem(PLATFORMS_KEY, JSON.stringify(platforms));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('omnifetch_platforms_updated', { detail: platforms }));
  }
}
