import { MediaResult, SiteSettings, AdPlacementConfig, FAQItem, BlogPost, DownloadLogItem } from '../types';
import { DEFAULT_SITE_SETTINGS, DEFAULT_ADS_CONFIG, DEFAULT_FAQS, INITIAL_BLOG_POSTS } from '../config/siteConfig';

const HISTORY_KEY = 'omnifetch_download_history_v1';

// Internal memory caches
let cachedSettings: SiteSettings = DEFAULT_SITE_SETTINGS;
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
export function getSiteSettings(): SiteSettings {
  return cachedSettings;
}

export async function fetchSiteSettingsFromDb(): Promise<SiteSettings> {
  try {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.settings) {
        cachedSettings = { ...DEFAULT_SITE_SETTINGS, ...data.settings };
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('omnifetch_settings_updated', { detail: cachedSettings }));
        }
        return cachedSettings;
      }
    }
  } catch (e) {
    console.error('Error fetching site settings from DB:', e);
  }
  return cachedSettings;
}

export async function saveSiteSettingsToDb(settings: Partial<SiteSettings>): Promise<SiteSettings> {
  const res = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) {
    throw new Error(`Server returned status ${res.status}`);
  }
  const data = await res.json();
  if (!data.success || !data.settings) {
    throw new Error(data.error || 'Failed to save settings to database');
  }
  cachedSettings = { ...DEFAULT_SITE_SETTINGS, ...data.settings };
  if (data.syncVersion) currentSyncVersion = data.syncVersion;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('omnifetch_settings_updated', { detail: cachedSettings }));
  }
  return cachedSettings;
}

export function saveSiteSettings(settings: Partial<SiteSettings>): SiteSettings {
  cachedSettings = { ...cachedSettings, ...settings };
  saveSiteSettingsToDb(settings).catch((e) => console.error('Background save error:', e));
  return cachedSettings;
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
      if (data.success && data.ads && Array.isArray(data.ads)) {
        cachedAdsConfig = data.ads;
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('omnifetch_ads_updated', { detail: cachedAdsConfig }));
        }
        return cachedAdsConfig;
      }
    }
  } catch (e) {
    console.error('Error fetching ads from DB:', e);
  }
  return cachedAdsConfig;
}

export async function saveAdsConfigToDb(ads: AdPlacementConfig[]): Promise<AdPlacementConfig[]> {
  const res = await fetch('/api/ads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ads }),
  });
  if (!res.ok) throw new Error(`Server returned status ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error('Failed to save ads config');

  cachedAdsConfig = ads;
  if (data.syncVersion) currentSyncVersion = data.syncVersion;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('omnifetch_ads_updated', { detail: cachedAdsConfig }));
  }
  return cachedAdsConfig;
}

export function saveAdsConfig(ads: AdPlacementConfig[]): void {
  cachedAdsConfig = ads;
  saveAdsConfigToDb(ads).catch((e) => console.error('Background save ads error:', e));
}

// --- FAQs & Blogs ---
export function getFaqsConfig(): FAQItem[] {
  return cachedFaqs;
}

export function saveFaqsConfig(faqs: FAQItem[]): void {
  cachedFaqs = faqs;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('omnifetch_faqs_updated', { detail: faqs }));
  }
}

export function getBlogsConfig(): BlogPost[] {
  return cachedBlogs;
}

export function saveBlogsConfig(blogs: BlogPost[]): void {
  cachedBlogs = blogs;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('omnifetch_blogs_updated', { detail: blogs }));
  }
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

  // Initial load
  fetchSiteSettingsFromDb();
  fetchAdsConfigFromDb();

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
            fetchSiteSettingsFromDb();
            fetchAdsConfigFromDb();
          }
        }
      }
    } catch {}
  }, 3000);
}
