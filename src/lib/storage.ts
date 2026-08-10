import { MediaResult, SiteSettings, AdPlacementConfig, FAQItem, BlogPost, DownloadLogItem } from '../types';
import { DEFAULT_SITE_SETTINGS, DEFAULT_ADS_CONFIG, DEFAULT_FAQS, INITIAL_BLOG_POSTS } from '../config/siteConfig';
import { saveFirestoreGlobalSettings } from './firebase';

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
      if (data.success && data.ads && Array.isArray(data.ads) && data.ads.length > 0) {
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
  // 1. Post to PostgreSQL server API
  const res = await fetch('/api/ads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ads }),
  });
  if (!res.ok) throw new Error(`Server returned status ${res.status}`);
  const data = await res.json();
  if (!data.success || !data.verified) throw new Error('Database write verification failed');

  // 2. Mirror synchronously to Firestore so client & remote sync stay 100% identical
  try {
    await saveFirestoreGlobalSettings({ adsConfig: ads });
  } catch (fsErr) {
    console.warn('Notice: Mirroring adsConfig to Firestore warning:', fsErr);
  }

  cachedAdsConfig = data.ads || ads;
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
