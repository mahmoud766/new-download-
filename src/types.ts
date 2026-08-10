export type SupportedLanguage = 'ar' | 'en' | 'fr' | 'es' | 'de' | 'it' | 'pt' | 'hi';

export interface AuthorInfo {
  name: string;
  username: string;
  avatar?: string;
  verified?: boolean;
}

export interface MediaFormat {
  id: string;
  quality: string; // e.g. "4K Ultra HD", "1080p Full HD", "720p HD", "480p SD", "Audio MP3"
  format: 'mp4' | 'mp3' | 'webm';
  resolution?: string;
  sizeBytes: number;
  sizeFormatted: string;
  url: string;
  directVideoUrl?: string;
  filename?: string;
  hasAudio: boolean;
  watermarkFree?: boolean;
  bitrate?: string;
  forceProxy?: boolean;
}

export interface MediaResult {
  id: string;
  originalUrl: string;
  platform: PlatformSlug;
  platformName: string;
  title: string;
  thumbnail: string;
  duration?: string;
  author?: AuthorInfo;
  formats: MediaFormat[];
  viewsCount?: string;
  likesCount?: string;
  publishedAt?: string;
  createdAt: string;
}

export type PlatformSlug =
  | 'all'
  | 'tiktok'
  | 'facebook'
  | 'facebook-reels'
  | 'instagram'
  | 'instagram-reels'
  | 'youtube'
  | 'youtube-shorts'
  | 'snapchat'
  | 'twitter'
  | 'pinterest'
  | 'reddit'
  | 'threads'
  | 'linkedin';

export type LocalizedText = Partial<Record<SupportedLanguage, string>> & { en: string; ar?: string; [key: string]: string | undefined };
export type LocalizedList = Partial<Record<SupportedLanguage, string[]>> & { en: string[]; ar?: string[]; [key: string]: string[] | undefined };

export interface PlatformConfig {
  slug: PlatformSlug;
  name: string;
  iconName: string; // lucide icon identifier or SVG
  color: string;
  badgeBg: string;
  badgeText: string;
  description: LocalizedText;
  titleTemplate: LocalizedText;
  subtitle: LocalizedText;
  seoKeywords: string[];
  features: LocalizedList;
  supportedFormats: string[];
  placeholderUrl: string;
  popular: boolean;
  active?: boolean;
  enabled?: boolean;
}

export interface FAQItem {
  id: string;
  platform: PlatformSlug | 'general';
  question: LocalizedText;
  answer: LocalizedText;
  order: number;
}

export interface AdPlacementConfig {
  id: string;
  slot: 'header_banner' | 'pre_result' | 'post_result' | 'sidebar' | 'in_article' | 'footer_banner' | 'service_separator_1' | 'service_separator_2' | 'HOME_TOP' | 'HOME_AFTER_HERO' | 'HOME_AFTER_TRENDING' | 'HOME_AFTER_PLATFORM' | 'HOME_AFTER_TOOLS' | 'HOME_AFTER_HOW_TO' | 'HOME_AFTER_WHY_US' | 'HOME_AFTER_FACEBOOK_GUIDE' | 'HOME_AFTER_SECURITY' | 'HOME_AFTER_REVIEWS' | 'HOME_BOTTOM' | 'PLATFORM_TOP' | 'PLATFORM_AFTER_TOOL' | 'PLATFORM_AFTER_DESCRIPTION' | 'PLATFORM_AFTER_FAQ' | 'PLATFORM_BOTTOM' | 'BLOG_TOP' | 'BLOG_AFTER_INTRO' | 'BLOG_MIDDLE' | 'BLOG_AFTER_CONTENT' | 'BLOG_BOTTOM' | 'LEGAL_BOTTOM' | string;
  name: string;
  enabled: boolean;
  code: string;
  heightPx?: number;
  provider?: 'adsense' | 'adsterra' | 'custom_html' | string;
  publisherId?: string;
  slotId?: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical' | 'fluid' | string;
  responsive?: boolean;
  mobileEnabled?: boolean;
  desktopEnabled?: boolean;
  lazyLoad?: boolean;
  frequency?: number;
  priority?: number;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: LocalizedText;
  excerpt: LocalizedText;
  content: LocalizedText;
  category: 'tutorials' | 'tips' | 'platform-news' | 'tech';
  author: string;
  publishedAt: string;
  readTimeMinutes: number;
  coverImage: string;
  views: number;
  tags: string[];
}

export interface AnalyticsStats {
  totalDownloads: number;
  todayDownloads: number;
  successfulRate: number;
  totalBandwidthGB: number;
  activeUsers24h: number;
  platformBreakdown: { platform: string; count: number; percentage: number }[];
  countryBreakdown: { country: string; code: string; count: number }[];
  dailyTrend: { date: string; count: number }[];
  recentLogs: DownloadLogItem[];
}

export interface DownloadLogItem {
  id: string;
  timestamp: string;
  platform: string;
  title: string;
  quality: string;
  ip: string;
  country: string;
  status: 'SUCCESS' | 'FAILED';
  errorMessage?: string;
}

export interface SiteSettings {
  siteName: string;
  shortName: string;
  tagline?: string;
  logoUrl?: string;
  faviconUrl?: string;
  siteDescription?: string;
  contactEmail: string;
  contactPhone?: string;
  contactAddress?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
    telegram?: string;
  };
  customCss?: string;
  customJs?: string;
  themeMode?: 'light' | 'dark' | 'system';
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  headerStyle?: 'sticky' | 'fixed' | 'static' | 'floating';
  headerBlur?: 'none' | 'light' | 'medium' | 'heavy';
  buttonRadius?: 'rounded-none' | 'rounded-lg' | 'rounded-xl' | 'rounded-2xl' | 'rounded-full';
  cardStyle?: 'glass' | 'solid' | 'bordered' | 'neon';
  logoHeightPx?: number;
  platformIconsCustom?: Record<string, string>;
  platformColorsCustom?: Record<string, string>;
  adsenseClientId: string;
  ga4Id: string;
  gtmId: string;
  clarityId: string;
  fbPixelId: string;
  maintenanceMode: boolean;
  rateLimitPerMinute: number;
  allowMp3Conversion: boolean;
  watermarkFreeByDefault: boolean;
}

export interface GlobalSeoConfig {
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  canonicalUrl: string;
  robotsDirective: string;
  ogImage: string;
  twitterHandle: string;
  organizationSchema: string;
  websiteSchema: string;
}

export interface RedirectRule {
  id: string;
  fromUrl: string;
  toUrl: string;
  type: 301 | 302 | 307;
  active: boolean;
  hits: number;
  createdAt: string;
}

export interface ManagedPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  published: boolean;
  metaTitle: string;
  metaDescription: string;
  order: number;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Editor' | 'SEO Manager' | 'Content Manager' | 'Support' | 'Moderator';
  status: 'Active' | 'Inactive';
  lastLogin: string;
  twoFactorEnabled: boolean;
}

export interface ApiHealthStatus {
  id: string;
  name: string;
  type: 'TikTok' | 'YouTube' | 'Facebook' | 'Instagram' | 'Snapchat' | 'Gemini AI';
  endpoint: string;
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  latencyMs: number;
  dailyRequests: number;
  errorRatePercent: number;
  autoFailover: boolean;
}

export interface SecurityConfig {
  twoFactorRequired: boolean;
  rateLimitPerMin: number;
  ipWhitelist: string[];
  ipBlacklist: string[];
  blockedCountries: string[];
  captchaEnabled: boolean;
  autoBackupsEnabled: boolean;
  backupFrequency: 'Daily' | 'Weekly' | 'Monthly';
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  senderEmail: string;
  senderName: string;
}

export interface EmailAlertSettings {
  enabled: boolean;
  recipientEmails: string[];
  alertOnHighErrorRate: boolean;
  errorRateThresholdPercent: number;
  alertOnDbConnectionFailure: boolean;
  alertOnProxyDowntime: boolean;
  alertOnRateLimitSpike: boolean;
  digestFrequency: 'Instant' | 'Hourly' | 'Daily';
}

export interface SmtpTestResult {
  success: boolean;
  message: string;
  timestamp: string;
  latencyMs?: number;
}

export interface ExtractionDebugLog {
  id: string;
  timestamp: string;
  url: string;
  platform: string;
  httpStatus: number;
  success: boolean;
  durationMs: number;
  error?: string;
  debugDetails?: any;
  rawResponse?: any;
  requestHeaders?: Record<string, string>;
}
