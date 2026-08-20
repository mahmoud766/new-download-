import { MediaResult, SiteSettings, AdPlacementConfig, FAQItem, BlogPost, DownloadLogItem } from '../types';
import { DEFAULT_SITE_SETTINGS, DEFAULT_ADS_CONFIG, DEFAULT_FAQS, INITIAL_BLOG_POSTS } from '../config/siteConfig';
import { saveFirestoreGlobalSettings } from './firebase';
import {
  fetchPlatformsConfigFromDb,
  fetchGlobalSeoFromDb,
  fetchManagedPagesFromDb,
  fetchRedirectRulesFromDb,
  fetchAdminUsersFromDb,
  fetchSecurityConfigFromDb,
  fetchSmtpConfigFromDb,
  fetchEmailAlertsFromDb,
} from './adminStorage';

const HISTORY_KEY = 'omnifetch_download_history_v1';

const SETTINGS_STORAGE_KEY = 'omnifetch_site_settings_v2';

function loadInitialSettings(): SiteSettings {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          return { ...DEFAULT_SITE_SETTINGS, ...parsed };
        }
      }
    }
  } catch {}
  return DEFAULT_SITE_SETTINGS;
}

// Internal memory caches
let cachedSettings: SiteSettings = loadInitialSettings();
let cachedAdsConfig: AdPlacementConfig[] = DEFAULT_ADS_CONFIG;
let cachedFaqs: FAQItem[] = DEFAULT_FAQS;
let cachedBlogs: BlogPost[] = INITIAL_BLOG_POSTS;
let currentSyncVersion = 0;

export function getDownloadHistory(): MediaResult[] {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(HISTORY_KEY) : null;
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveToHistory(item: MediaResult): void {
  try {
    const existing = getDownloadHistory();
    const filtered = existing.filter((x) => x.id !== item.id && x.originalUrl !== item.originalUrl);
    const updated = [item, ...filtered].slice(0, 30);
    if (typeof window !== 'undefined') {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    }

    // Post to PostgreSQL download logging API asynchronously
    fetch('/api/trending', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: item.originalUrl,
        title: item.title,
        platform: item.platformName,
        thumbnail: item.thumbnail,
        quality: item.formats?.[0]?.quality || 'HD No Watermark',
      }),
    }).catch(() => {});

    logDownloadEvent(item);
  } catch (e) {
    console.error('Error saving history:', e);
  }
}

export function clearDownloadHistory(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(HISTORY_KEY);
    }
  } catch (e) {
    console.error('Error clearing history:', e);
  }
}

// --- Site Settings ---
export function broadcastSettingsUpdated(settings: SiteSettings): void {
  cachedSettings = { ...DEFAULT_SITE_SETTINGS, ...cachedSettings, ...settings };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(cachedSettings));
    } catch {}
    window.dispatchEvent(new CustomEvent('omnifetch_settings_updated', { detail: cachedSettings }));
  }
}

export function getSiteSettings(): SiteSettings {
  return cachedSettings;
}

export async function fetchSiteSettingsFromDb(): Promise<SiteSettings> {
  try {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.settings) {
        cachedSettings = { ...DEFAULT_SITE_SETTINGS, ...cachedSettings, ...data.settings };
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(cachedSettings));
          } catch {}
          window.dispatchEvent(new CustomEvent('omnifetch_settings_updated', { detail: cachedSettings }));
        }
        return cachedSettings;
      }
    }
  } catch (e) {
    // Graceful fallback to default in-memory settings without throwing error
  }
  return cachedSettings;
}

export async function saveSiteSettingsToDb(settings: Partial<SiteSettings>): Promise<SiteSettings> {
  const payload = { ...settings };
  if (payload.customCss && typeof payload.customCss === 'string' && !payload.customCss.startsWith('base64:')) {
    payload.customCss = 'base64:' + encodeUtf8ToBase64(payload.customCss);
  }
  if (payload.customJs && typeof payload.customJs === 'string' && !payload.customJs.startsWith('base64:')) {
    payload.customJs = 'base64:' + encodeUtf8ToBase64(payload.customJs);
  }

  const res = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Server returned status ${res.status}`);
  }
  const data = await res.json();
  if (!data.success || !data.settings) {
    throw new Error(data.error || data.message || 'Failed to save settings to database');
  }
  cachedSettings = { ...DEFAULT_SITE_SETTINGS, ...cachedSettings, ...data.settings };
  if (data.syncVersion) currentSyncVersion = data.syncVersion;

  broadcastSettingsUpdated(cachedSettings);
  return cachedSettings;
}

export function saveSiteSettings(settings: Partial<SiteSettings>): SiteSettings {
  cachedSettings = { ...cachedSettings, ...settings };
  broadcastSettingsUpdated(cachedSettings);
  saveSiteSettingsToDb(settings).catch((e) => console.warn('Background save notice:', e));
  return cachedSettings;
}

// --- Base64 Transport Helpers for WAF Safety ---
export function encodeUtf8ToBase64(str: string): string {
  if (!str) return '';
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf-8').toString('base64');
  }
  return str;
}

export function decodeBase64ToUtf8(b64: string): string {
  if (!b64) return '';
  if (typeof window !== 'undefined' && typeof window.atob === 'function') {
    try {
      const binary = window.atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new TextDecoder('utf-8').decode(bytes);
    } catch {
      return b64;
    }
  }
  if (typeof Buffer !== 'undefined') {
    try {
      return Buffer.from(b64, 'base64').toString('utf-8');
    } catch {
      return b64;
    }
  }
  return b64;
}

// --- Ads Management ---
export function getAdsConfig(): AdPlacementConfig[] {
  return cachedAdsConfig;
}

export async function fetchAdsConfigFromDb(): Promise<AdPlacementConfig[]> {
  try {
    const res = await fetch('/api/ads');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.ads && Array.isArray(data.ads) && data.ads.length > 0) {
        const decodedAds: AdPlacementConfig[] = data.ads.map((ad: AdPlacementConfig) => {
          let cleanCode = ad.code || '';
          if (typeof cleanCode === 'string' && cleanCode.startsWith('base64:')) {
            cleanCode = decodeBase64ToUtf8(cleanCode.slice(7));
          }
          return {
            ...ad,
            code: cleanCode,
          };
        });
        cachedAdsConfig = decodedAds;
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('omnifetch_ads_updated', { detail: cachedAdsConfig }));
        }
        return cachedAdsConfig;
      }
    }
  } catch (e) {
    // Graceful fallback to default in-memory ads without throwing error
  }
  return cachedAdsConfig;
}

export async function saveAdsConfigToDb(ads: AdPlacementConfig[]): Promise<AdPlacementConfig[]> {
  // 1. Prepare WAF-safe transport payload by encoding code strings in Base64
  const transportAds = ads.map((ad) => {
    let transportCode = ad.code || '';
    if (typeof transportCode === 'string' && transportCode.length > 0 && !transportCode.startsWith('base64:')) {
      transportCode = 'base64:' + encodeUtf8ToBase64(transportCode);
    }
    return {
      ...ad,
      code: transportCode,
    };
  });

  // 2. Post WAF-safe payload to PostgreSQL server API
  const res = await fetch('/api/ads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ads: transportAds }),
  });
  if (!res.ok) throw new Error(`Server returned status ${res.status}`);
  const data = await res.json();
  if (!data.success || !data.verified) throw new Error('Database write verification failed');

  // 3. Mirror synchronously to Firestore so client & remote sync stay 100% identical
  try {
    await saveFirestoreGlobalSettings({ adsConfig: ads });
  } catch (fsErr) {
    console.warn('Notice: Mirroring adsConfig to Firestore warning:', fsErr);
  }

  // 4. Decode returned ads for local in-memory and event caching
  const returnedAds: AdPlacementConfig[] = Array.isArray(data.ads)
    ? data.ads.map((ad: AdPlacementConfig) => {
        let cleanCode = ad.code || '';
        if (typeof cleanCode === 'string' && cleanCode.startsWith('base64:')) {
          cleanCode = decodeBase64ToUtf8(cleanCode.slice(7));
        }
        return {
          ...ad,
          code: cleanCode,
        };
      })
    : ads;

  cachedAdsConfig = returnedAds;
  if (data.syncVersion) currentSyncVersion = data.syncVersion;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('omnifetch_ads_updated', { detail: cachedAdsConfig }));
  }
  return cachedAdsConfig;
}

export async function saveAdsConfig(ads: AdPlacementConfig[]): Promise<AdPlacementConfig[]> {
  cachedAdsConfig = ads;
  return await saveAdsConfigToDb(ads);
}

// --- Adsterra Auto-Sync Engine API Helpers ---
export async function testAdsterraConnection(token?: string): Promise<{ success: boolean; connected: boolean; message: string; domainsCount?: number }> {
  const res = await fetch('/api/admin/adsterra/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Adsterra connection test failed');
  }
  return data;
}

export async function fetchAdsterraMappingsFromDb(): Promise<any> {
  const res = await fetch('/api/admin/adsterra/mappings');
  if (!res.ok) throw new Error(`Failed to fetch mappings: HTTP ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch mappings');
  return data;
}

export async function triggerAdsterraSync(isDryRun: boolean = false): Promise<any> {
  const res = await fetch('/api/admin/adsterra/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isDryRun }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Adsterra Sync failed');
  }
  return data;
}

export async function saveAdsterraMappingsToDb(mappings: any[]): Promise<any> {
  const res = await fetch('/api/admin/adsterra/mappings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mappings }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to save mappings');
  }
  return data;
}


// --- FAQs & Blogs ---
export function getFaqsConfig(): FAQItem[] {
  return cachedFaqs;
}

export async function fetchFaqsConfigFromDb(): Promise<FAQItem[]> {
  try {
    const res = await fetch('/api/faqs');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.faqs)) {
        cachedFaqs = data.faqs.length > 0 ? data.faqs : DEFAULT_FAQS;
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('omnifetch_faqs_updated', { detail: cachedFaqs }));
        }
        return cachedFaqs;
      }
    }
  } catch (e) {
    // Graceful fallback to cached/default FAQs
  }
  return cachedFaqs;
}

export async function saveFaqsConfigToDb(faqs: FAQItem[]): Promise<FAQItem[]> {
  const res = await fetch('/api/faqs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ faqs }),
  });
  if (!res.ok) {
    throw new Error(`Server returned status ${res.status}`);
  }
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.message || data.error || 'Failed to save FAQs');
  }
  cachedFaqs = Array.isArray(data.faqs) ? data.faqs : faqs;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('omnifetch_faqs_updated', { detail: cachedFaqs }));
  }
  return cachedFaqs;
}

export async function saveFaqsConfig(faqs: FAQItem[]): Promise<FAQItem[]> {
  cachedFaqs = faqs;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('omnifetch_faqs_updated', { detail: faqs }));
  }
  return saveFaqsConfigToDb(faqs);
}

export function getBlogsConfig(): BlogPost[] {
  return cachedBlogs;
}

export async function fetchBlogsConfigFromDb(): Promise<BlogPost[]> {
  try {
    const res = await fetch('/api/blogs');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.blogs)) {
        cachedBlogs = data.blogs.length > 0 ? data.blogs : INITIAL_BLOG_POSTS;
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('omnifetch_blogs_updated', { detail: cachedBlogs }));
        }
        return cachedBlogs;
      }
    }
  } catch (e) {
    // Graceful fallback to cached/default blogs
  }
  return cachedBlogs;
}

export async function saveBlogsConfigToDb(blogs: BlogPost[]): Promise<BlogPost[]> {
  const res = await fetch('/api/blogs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blogs }),
  });
  if (!res.ok) {
    throw new Error(`Server returned status ${res.status}`);
  }
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.message || data.error || 'Failed to save blogs');
  }
  cachedBlogs = Array.isArray(data.blogs) ? data.blogs : blogs;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('omnifetch_blogs_updated', { detail: cachedBlogs }));
  }
  return cachedBlogs;
}

export async function saveBlogsConfig(blogs: BlogPost[]): Promise<BlogPost[]> {
  cachedBlogs = blogs;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('omnifetch_blogs_updated', { detail: blogs }));
  }
  return saveBlogsConfigToDb(blogs);
}

function logDownloadEvent(result: MediaResult): void {
  // Download logs are persisted to PostgreSQL /api/trending
}

export function getAdminDownloadLogs(): DownloadLogItem[] {
  return [];
}

// --- Realtime Synchronization Poller ---
let realtimeSyncInitialized = false;

export function initRealtimeSyncLoop(): void {
  if (realtimeSyncInitialized || typeof window === 'undefined') return;
  realtimeSyncInitialized = true;

  // Initial load across all modules
  const fetchAll = () => {
    fetchSiteSettingsFromDb();
    fetchAdsConfigFromDb();
    fetchFaqsConfigFromDb();
    fetchBlogsConfigFromDb();
    fetchPlatformsConfigFromDb();
    fetchGlobalSeoFromDb();
    fetchManagedPagesFromDb();
    fetchRedirectRulesFromDb();
    fetchAdminUsersFromDb();
    fetchSecurityConfigFromDb();
    fetchSmtpConfigFromDb();
    fetchEmailAlertsFromDb();
  };

  fetchAll();

  // Poll sync version every 3 seconds for zero-refresh real-time updates
  setInterval(async () => {
    try {
      const res = await fetch('/api/sync/version');
      if (res.ok) {
        const data = await res.json();
        if (data.success && typeof data.version === 'number') {
          if (currentSyncVersion === 0) {
            currentSyncVersion = data.version;
          } else if (data.version > currentSyncVersion) {
            currentSyncVersion = data.version;
            fetchAll();
          }
        }
      }
    } catch {}
  }, 3000);
}
