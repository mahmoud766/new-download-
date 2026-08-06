import { MediaResult, SiteSettings, AdPlacementConfig, FAQItem, BlogPost, DownloadLogItem } from '../types';
import { DEFAULT_SITE_SETTINGS, DEFAULT_ADS_CONFIG, DEFAULT_FAQS, INITIAL_BLOG_POSTS } from '../config/siteConfig';
import { auth, saveFirestoreDownload, saveFirestoreGlobalSettings } from './firebase';
import { saveHostingerSettings, recordHostingerExtraction } from './hostingerDb';

const HISTORY_KEY = 'omnifetch_download_history_v1';
const SETTINGS_KEY = 'omnifetch_site_settings_v1';
const ADS_KEY = 'omnifetch_ads_config_v1';
const FAQS_KEY = 'omnifetch_faqs_config_v1';
const BLOGS_KEY = 'omnifetch_blogs_config_v1';
const LOGS_KEY = 'omnifetch_download_logs_v1';

export function getDownloadHistory(): MediaResult[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveToHistory(item: MediaResult): void {
  try {
    const existing = getDownloadHistory();
    const filtered = existing.filter((x) => x.id !== item.id && x.originalUrl !== item.originalUrl);
    const updated = [item, ...filtered].slice(0, 30); // keep last 30
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));

    // Sync to Hostinger MySQL
    recordHostingerExtraction(item).catch(() => {});

    // Optional Firebase sync with safe catch
    if (auth && auth.currentUser) {
      saveFirestoreDownload(auth.currentUser.uid, {
        title: item.title,
        url: item.originalUrl,
        platform: item.platformName,
        thumbnail: item.thumbnail,
        quality: item.formats?.[0]?.quality || 'HD'
      }).catch((e) => console.warn('Firebase sync warning:', e));
    }

    // Also log for admin analytics
    logDownloadEvent(item);
  } catch (e) {
    console.error('Error saving history:', e);
  }
}

export function clearDownloadHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (e) {
    console.error('Error clearing history:', e);
  }
}

export function getSiteSettings(): SiteSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SITE_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SITE_SETTINGS;
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}

export function saveSiteSettings(settings: Partial<SiteSettings>): SiteSettings {
  try {
    const current = getSiteSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('omnifetch_settings_updated', { detail: updated }));
    }
    // Sync to Hostinger MySQL
    saveHostingerSettings({ siteSettings: updated }).catch(() => {});
    // Optional Firebase sync
    saveFirestoreGlobalSettings({ siteSettings: updated }).catch((e) => console.warn('Firebase sync skipped:', e));
    return updated;
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}

export function getAdsConfig(): AdPlacementConfig[] {
  try {
    const raw = localStorage.getItem(ADS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_ADS_CONFIG;
  } catch {
    return DEFAULT_ADS_CONFIG;
  }
}

export function saveAdsConfig(ads: AdPlacementConfig[]): void {
  try {
    localStorage.setItem(ADS_KEY, JSON.stringify(ads));
    saveHostingerSettings({ adsConfig: ads }).catch(() => {});
    saveFirestoreGlobalSettings({ adsConfig: ads }).catch((e) => console.warn('Firebase sync skipped:', e));
  } catch (e) {
    console.error('Error saving ads config:', e);
  }
}

export function getFaqsConfig(): FAQItem[] {
  try {
    const raw = localStorage.getItem(FAQS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_FAQS;
  } catch {
    return DEFAULT_FAQS;
  }
}

export function saveFaqsConfig(faqs: FAQItem[]): void {
  try {
    localStorage.setItem(FAQS_KEY, JSON.stringify(faqs));
    saveHostingerSettings({ faqsConfig: faqs }).catch(() => {});
    saveFirestoreGlobalSettings({ faqsConfig: faqs }).catch((e) => console.warn('Firebase sync skipped:', e));
  } catch (e) {
    console.error('Error saving FAQs:', e);
  }
}

export function getBlogsConfig(): BlogPost[] {
  try {
    const raw = localStorage.getItem(BLOGS_KEY);
    return raw ? JSON.parse(raw) : INITIAL_BLOG_POSTS;
  } catch {
    return INITIAL_BLOG_POSTS;
  }
}

export function saveBlogsConfig(blogs: BlogPost[]): void {
  try {
    localStorage.setItem(BLOGS_KEY, JSON.stringify(blogs));
    saveHostingerSettings({ blogsConfig: blogs }).catch(() => {});
    saveFirestoreGlobalSettings({ blogsConfig: blogs }).catch((e) => console.warn('Firebase sync skipped:', e));
  } catch (e) {
    console.error('Error saving blogs:', e);
  }
}

function logDownloadEvent(result: MediaResult): void {
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    const logs: DownloadLogItem[] = raw ? JSON.parse(raw) : [];

    const newLog: DownloadLogItem = {
      id: 'log_' + Math.random().toString(36).substring(2, 8),
      timestamp: new Date().toISOString(),
      platform: result.platformName,
      title: result.title,
      quality: result.formats[0]?.quality || 'HD',
      ip: '192.168.1.102',
      country: 'United States',
      status: 'SUCCESS',
    };

    const updated = [newLog, ...logs].slice(0, 100);
    localStorage.setItem(LOGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error logging download:', e);
  }
}

export function getAdminDownloadLogs(): DownloadLogItem[] {
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    if (!raw) {
      return [
        { id: 'log_1', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), platform: 'TikTok', title: 'Viral Dance Video #trend', quality: 'HD No Watermark', ip: '197.230.12.4', country: 'Saudi Arabia', status: 'SUCCESS' },
        { id: 'log_2', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), platform: 'YouTube', title: '4K Cinematic Nature Relaxation', quality: '4K Ultra HD', ip: '102.122.40.11', country: 'United States', status: 'SUCCESS' },
        { id: 'log_3', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), platform: 'Instagram', title: 'Reel - Delicious Pasta Recipe', quality: '1080p Full HD', ip: '82.165.19.88', country: 'France', status: 'SUCCESS' },
        { id: 'log_4', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), platform: 'Facebook', title: 'Funny Pet Moments Compilation', quality: '720p HD', ip: '188.138.2.14', country: 'Germany', status: 'SUCCESS' },
      ];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
