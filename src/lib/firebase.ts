import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
  serverTimestamp,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';

import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Explicitly pass the databaseId provisioned for this applet
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};
export type { User };

// Firestore Helper Functions

// 1. Sync / Save User Profile
export async function syncUserProfile(user: User) {
  if (!user) return;
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      displayName: user.displayName || 'User',
      email: user.email || '',
      photoURL: user.photoURL || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
}

// 2. Save Download Record
export async function saveFirestoreDownload(userId: string, downloadItem: any) {
  if (!userId) return;
  const historyCol = collection(db, 'users', userId, 'history');
  await addDoc(historyCol, {
    ...downloadItem,
    timestamp: serverTimestamp()
  });
}

// 3. Get Download History
export async function fetchFirestoreHistory(userId: string) {
  if (!userId) return [];
  try {
    const historyCol = collection(db, 'users', userId, 'history');
    const q = query(historyCol, orderBy('timestamp', 'desc'), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('Error fetching Firestore download history:', err);
    return [];
  }
}

// 4. Save AI Creation (Veo video, Imagen image, Lyria music)
export async function saveFirestoreCreation(userId: string, creation: { type: 'video' | 'image' | 'music'; prompt: string; url: string; title?: string }) {
  if (!userId) return;
  const col = collection(db, 'users', userId, 'creations');
  await addDoc(col, {
    ...creation,
    createdAt: serverTimestamp()
  });
}

// 5. Fetch User Creations
export async function fetchFirestoreCreations(userId: string) {
  if (!userId) return [];
  try {
    const col = collection(db, 'users', userId, 'creations');
    const q = query(col, orderBy('createdAt', 'desc'), limit(30));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('Error fetching creations:', err);
    return [];
  }
}

// 6. Fetch Daily Visitors Traffic Trends (Live Database Analytics with Firestore Sync)
export interface DailyVisitorData {
  id?: string;
  date: string;
  label: string;
  visitors: number;
  pageViews: number;
  downloads: number;
}

export async function fetchDailyVisitorsFromFirestore(range: 'today' | '7d' | '30d' | 'all' = '7d'): Promise<DailyVisitorData[]> {
  // 1. Fetch live real-time metrics computed directly from database
  try {
    const res = await fetch(`/api/analytics/daily-visitors?range=${range}`);
    if (res.ok) {
      const body = await res.json();
      if (body.success && Array.isArray(body.data)) {
        // Sync real live data to Firestore asynchronously for persistence
        if (body.data.length > 0) {
          syncDailyVisitorsToFirestore(body.data).catch(() => {});
        }
        return body.data;
      }
    }
  } catch (apiErr) {
    console.warn('Notice: falling back to Firestore for daily visitors:', apiErr);
  }

  // 2. Fallback to Firestore cache
  try {
    const colRef = collection(db, 'analytics_daily_visitors');
    const q = query(colRef, orderBy('date', 'asc'), limit(30));
    const snap = await getDocs(q);

    if (!snap.empty) {
      return snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<DailyVisitorData, 'id'>)
      }));
    }
  } catch (err) {
    console.error('Error fetching daily visitors from Firestore:', err);
  }

  return [];
}

async function syncDailyVisitorsToFirestore(data: DailyVisitorData[]) {
  try {
    for (const item of data) {
      if (!item.date) continue;
      const cleanId = item.date.replace(/[^a-zA-Z0-9_-]/g, '_');
      const docRef = doc(db, 'analytics_daily_visitors', cleanId);
      await setDoc(docRef, {
        date: item.date,
        label: item.label,
        visitors: Number(item.visitors) || 0,
        pageViews: Number(item.pageViews) || 0,
        downloads: Number(item.downloads) || 0,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
  } catch {}
}

// 7. Fetch Top Performing Pages Analytics (Live Database Analytics with Firestore Sync)
export interface TopPageData {
  id?: string;
  pagePath: string;
  pageTitle: string;
  views: number;
  downloads: number;
  avgDuration: string;
}

export async function fetchTopPagesFromFirestore(): Promise<TopPageData[]> {
  // 1. Fetch live real-time metrics computed directly from database
  try {
    const res = await fetch('/api/analytics/top-pages');
    if (res.ok) {
      const body = await res.json();
      if (body.success && Array.isArray(body.data)) {
        if (body.data.length > 0) {
          syncTopPagesToFirestore(body.data).catch(() => {});
        }
        return body.data;
      }
    }
  } catch (apiErr) {
    console.warn('Notice: falling back to Firestore for top pages:', apiErr);
  }

  // 2. Fallback to Firestore cache
  try {
    const colRef = collection(db, 'analytics_top_pages');
    const q = query(colRef, orderBy('views', 'desc'), limit(10));
    const snap = await getDocs(q);

    if (!snap.empty) {
      return snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<TopPageData, 'id'>)
      }));
    }
  } catch (err) {
    console.error('Error fetching top pages from Firestore:', err);
  }

  return [];
}

async function syncTopPagesToFirestore(data: TopPageData[]) {
  try {
    for (const item of data) {
      if (!item.pagePath) continue;
      const cleanId = (item.pagePath === '/' ? 'home' : item.pagePath.replace('/', '')).replace(/[^a-zA-Z0-9_-]/g, '_');
      const docRef = doc(db, 'analytics_top_pages', cleanId);
      await setDoc(docRef, {
        pagePath: item.pagePath,
        pageTitle: item.pageTitle,
        views: Number(item.views) || 0,
        downloads: Number(item.downloads) || 0,
        avgDuration: item.avgDuration || '1m 30s',
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
  } catch {}
}

// 8. Fetch Platform Traffic Breakdown (Live Database Analytics with Firestore Sync)
export interface PlatformTrafficData {
  id?: string;
  platform: string;
  share: number;
  downloads: number;
  color: string;
}

export async function fetchPlatformTrafficFromFirestore(): Promise<PlatformTrafficData[]> {
  // 1. Fetch live real-time metrics computed directly from database
  try {
    const res = await fetch('/api/analytics/platform-traffic');
    if (res.ok) {
      const body = await res.json();
      if (body.success && Array.isArray(body.data)) {
        if (body.data.length > 0) {
          syncPlatformTrafficToFirestore(body.data).catch(() => {});
        }
        return body.data;
      }
    }
  } catch (apiErr) {
    console.warn('Notice: falling back to Firestore for platform traffic:', apiErr);
  }

  // 2. Fallback to Firestore cache
  try {
    const colRef = collection(db, 'analytics_platform_traffic');
    const q = query(colRef, orderBy('downloads', 'desc'), limit(10));
    const snap = await getDocs(q);

    if (!snap.empty) {
      return snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<PlatformTrafficData, 'id'>)
      }));
    }
  } catch (err) {
    console.error('Error fetching platform traffic from Firestore:', err);
  }

  return [];
}

async function syncPlatformTrafficToFirestore(data: PlatformTrafficData[]) {
  try {
    for (const item of data) {
      if (!item.platform) continue;
      const cleanId = item.platform.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_');
      const docRef = doc(db, 'analytics_platform_traffic', cleanId);
      await setDoc(docRef, {
        platform: item.platform,
        share: Number(item.share) || 0,
        downloads: Number(item.downloads) || 0,
        color: item.color || '#9333ea',
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
  } catch {}
}

// Helper: Fetch Real Traffic Sources
export async function fetchRealTrafficSources() {
  try {
    const res = await fetch('/api/analytics/traffic-sources');
    if (res.ok) {
      const body = await res.json();
      if (body.success && Array.isArray(body.data)) {
        return body.data;
      }
    }
  } catch (e) {
    console.warn('Notice: fetching traffic sources:', e);
  }
  return [];
}

// Helper: Fetch Real Device & Browser Statistics
export async function fetchRealDeviceStats() {
  try {
    const res = await fetch('/api/analytics/device-stats');
    if (res.ok) {
      const body = await res.json();
      if (body.success) {
        return {
          devices: body.devices,
          browsers: body.browsers,
        };
      }
    }
  } catch (e) {
    console.warn('Notice: fetching device stats:', e);
  }
  return null;
}

// 9. Real Trending Downloads Tracker
export interface RealTrendingItem {
  id: string;
  title: string;
  platform: string;
  platformName: string;
  thumbnail: string;
  url: string;
  duration: string;
  extractionsCount: number;
  views: string;
  likes: string;
  quality: string;
  badge: string;
  lastExtractedAt?: any;
  isRealUserExtraction?: boolean;
}

export async function recordRealExtraction(result: {
  originalUrl: string;
  title: string;
  platform: string;
  platformName: string;
  thumbnail?: string;
  duration?: string;
  formats?: { quality: string }[];
  viewsCount?: string;
  likesCount?: string;
}) {
  if (!result || !result.originalUrl) return;

  try {
    const cleanUrl = result.originalUrl.trim();
    // Safe hash function for doc ID to handle Unicode/Arabic characters without btoa crash
    let hash = 0;
    for (let i = 0; i < cleanUrl.length; i++) {
      hash = (hash << 5) - hash + cleanUrl.charCodeAt(i);
      hash |= 0;
    }
    const safeDocId = 'real_vid_' + Math.abs(hash).toString(36);
    const docRef = doc(db, 'trending_downloads', safeDocId);

    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const currentData = snap.data();
      const newCount = (currentData.extractionsCount || 1) + 1;
      await setDoc(
        docRef,
        {
          extractionsCount: newCount,
          lastExtractedAt: serverTimestamp(),
          title: result.title || currentData.title,
          thumbnail: result.thumbnail || currentData.thumbnail,
          isRealUserExtraction: true,
        },
        { merge: true }
      );
    } else {
      const topQuality = result.formats && result.formats[0] ? result.formats[0].quality : 'HD No Watermark';
      const newItem: RealTrendingItem = {
        id: safeDocId,
        title: result.title || 'فيديو تم استخراجه من الموقع',
        platform: (result.platform || 'video').toLowerCase(),
        platformName: result.platformName || 'Video',
        thumbnail: result.thumbnail || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&auto=format&fit=crop&q=80',
        url: cleanUrl,
        duration: result.duration || '0:45',
        extractionsCount: 1,
        views: result.viewsCount || '1.2K',
        likes: result.likesCount || '350',
        quality: topQuality,
        badge: '🔥 استخراج حي من زائر',
        lastExtractedAt: serverTimestamp(),
        isRealUserExtraction: true,
      };
      await setDoc(docRef, newItem);
    }
  } catch (err) {
    console.error('Error recording real extraction in Firestore:', err);
  }
}

export function subscribeRealTrendingDownloads(
  onUpdate: (items: RealTrendingItem[]) => void
): () => void {
  const colRef = collection(db, 'trending_downloads');
  const q = query(colRef, orderBy('extractionsCount', 'desc'), limit(12));

  const unsubscribe = onSnapshot(
    q,
    async (snap) => {
      if (snap.empty) {
        onUpdate([]);
      } else {
        const items = snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<RealTrendingItem, 'id'>),
        }));
        items.sort((a, b) => (b.extractionsCount || 0) - (a.extractionsCount || 0));
        onUpdate(items);
      }
    },
    (error) => {
      console.warn('Notice: listening to trending_downloads:', error);
      onUpdate([]);
    }
  );

  return unsubscribe;
}

// 10. Fetch & Save Global Settings (AdSense, GA4, Meta Pixel, Header/Footer Scripts, Site Name)
export async function fetchFirestoreGlobalSettings() {
  try {
    const docRef = doc(db, 'global_settings', 'main');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (err) {
    console.error('Error fetching global_settings from Firestore:', err);
  }
  return null;
}

export async function saveFirestoreGlobalSettings(settingsData: Record<string, any>) {
  try {
    const docRef = doc(db, 'global_settings', 'main');
    await setDoc(docRef, { ...settingsData, updatedAt: serverTimestamp() }, { merge: true });
    // Trigger On-Demand Revalidation
    await triggerOnDemandRevalidation(['/']);
    return true;
  } catch (err) {
    console.error('Error saving global_settings to Firestore:', err);
    return false;
  }
}

// 11. Fetch & Save SEO Translations (Language, Platform, Slug, Keywords, Titles)
export async function fetchFirestoreSeoTranslations() {
  try {
    const colRef = collection(db, 'seo_translations');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
  } catch (err) {
    console.error('Error fetching seo_translations from Firestore:', err);
  }
  return [];
}

export async function saveFirestoreSeoTranslation(
  langCode: string,
  platformSlug: string,
  seoData: Record<string, any>
) {
  try {
    const docId = `${langCode}_${platformSlug}`;
    const docRef = doc(db, 'seo_translations', docId);
    await setDoc(
      docRef,
      {
        langCode,
        platformSlug,
        ...seoData,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    // Trigger On-Demand Revalidation
    await triggerOnDemandRevalidation(['/', `/${platformSlug}`]);
    return true;
  } catch (err) {
    console.error('Error saving seo_translation to Firestore:', err);
    return false;
  }
}

// 12. On-Demand Revalidation Trigger API Helper
export async function triggerOnDemandRevalidation(routes: string[] = ['/']) {
  try {
    const res = await fetch('/api/revalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidation-token': 'OMNIFETCH_PRO_ISR_SECRET_2026',
      },
      body: JSON.stringify({ routes }),
    });
    if (res.ok) {
      const data = await res.json();
      console.log('[On-Demand Revalidation] Cache purged & CDN revalidated:', data);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('omnifetch_revalidated', { detail: data }));
      }
      return data;
    }
  } catch (e) {
    console.warn('[On-Demand Revalidation] Notice:', e);
  }
  return null;
}


