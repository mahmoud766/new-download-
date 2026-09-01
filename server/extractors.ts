import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import ytdl from '@distube/ytdl-core';
import { recordTelemetry } from './telemetry';
import { prisma, withDbTimeout } from '../src/lib/prisma';

const execFileAsync = promisify(execFile);

let isDownloadingYtDlp = false;

export async function ensureYtDlpBinary(): Promise<string | null> {
  const targetDir = path.join(process.cwd(), 'bin');
  const targetPath = path.join(targetDir, 'yt-dlp');

  // 1. Check if existing file is valid and executable
  if (fs.existsSync(targetPath)) {
    try {
      const stats = fs.statSync(targetPath);
      if (stats.size > 2 * 1024 * 1024) {
        fs.chmodSync(targetPath, 0o755);
        return targetPath;
      }
    } catch {}
  }

  if (isDownloadingYtDlp) return findYtDlpPath();
  isDownloadingYtDlp = true;

  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    console.log('[YT-DLP_INIT] Downloading official latest yt-dlp binary...');
    const res = await fetch('https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (res.ok) {
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      if (buffer.length > 2 * 1024 * 1024) {
        fs.writeFileSync(targetPath, buffer);
        fs.chmodSync(targetPath, 0o755);
        console.log(`[YT-DLP_INIT] Successfully verified and installed official yt-dlp binary (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
        return targetPath;
      }
    }
  } catch (err: any) {
    console.warn(`[YT-DLP_INIT] Failed to auto-download yt-dlp: ${err?.message || err}`);
  } finally {
    isDownloadingYtDlp = false;
  }

  return findYtDlpPath();
}

function findYtDlpPath(): string | null {
  const possiblePaths = [
    path.join(process.cwd(), 'bin', 'yt-dlp'),
    '/app/applet/bin/yt-dlp',
    '/tmp/yt-dlp',
    '/usr/local/bin/yt-dlp',
    '/usr/bin/yt-dlp',
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const stats = fs.statSync(p);
        if (stats.size > 2 * 1024 * 1024) {
          fs.chmodSync(p, 0o755);
          return p;
        }
      } catch {}
    }
  }

  // Trigger background recovery if not already running
  ensureYtDlpBinary().catch(() => {});

  return 'yt-dlp';
}

export interface ExtractedMediaResult {
  status: 'SUCCESS' | 'FAILED';
  title?: string;
  thumbnail?: string;
  video_url?: string;
  reason?: string;
  httpStatus?: number;
  forceProxy?: boolean;
  formats?: Array<{
    id: string;
    quality: string;
    format: string;
    resolution?: string;
    sizeBytes?: number;
    sizeFormatted?: string;
    url: string;
    directVideoUrl?: string;
    hasAudio?: boolean;
    watermarkFree?: boolean;
    forceProxy?: boolean;
  }>;
}

/**
 * Resilient fetch wrapper with both per-request timeout AND parent abort propagation
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 8000,
  parentSignal?: AbortSignal
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const onParentAbort = () => controller.abort();
  if (parentSignal) {
    if (parentSignal.aborted) {
      clearTimeout(timeoutId);
      controller.abort();
    } else {
      parentSignal.addEventListener('abort', onParentAbort, { once: true });
    }
  }

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timeoutId);
    if (parentSignal) {
      parentSignal.removeEventListener('abort', onParentAbort);
    }
  }
}

const INITIAL_SEED_PROVIDERS = [
  { providerKey: 'yt_dlp_fb', name: 'yt-dlp Facebook Engine', type: 'Node Native Binary', platform: 'Facebook', enabled: true, priority: 1 },
  { providerKey: 'btch_fb', name: 'RapidCDN / FB Decoder', type: 'CDN Conversion', platform: 'Facebook', enabled: true, priority: 2 },
  { providerKey: 'fb_plugin', name: 'FB Plugin Scraper', type: 'Facebook Scraper', platform: 'Facebook', enabled: true, priority: 3 },
  { providerKey: 'cobalt_vkr_fb', name: 'Cobalt / VKR API', type: 'External Engine', platform: 'Facebook', enabled: true, priority: 4 },
  { providerKey: 'tikwm_api', name: 'TikWM API', type: 'Extractor Engine', platform: 'TikTok', enabled: true, priority: 1 },
  { providerKey: 'yt_dlp_tiktok', name: 'yt-dlp TikTok Engine', type: 'Node Native Binary', platform: 'TikTok', enabled: true, priority: 2 },
  { providerKey: 'cobalt_tiktok', name: 'Cobalt TikTok API', type: 'External Engine', platform: 'TikTok', enabled: true, priority: 3 },
  { providerKey: 'yt_dlp_youtube', name: 'yt-dlp YouTube Engine', type: 'Node Native Binary', platform: 'YouTube', enabled: true, priority: 1 },
  { providerKey: 'ytdl_core', name: 'ytdl-core', type: 'Node Native', platform: 'YouTube', enabled: true, priority: 2 },
  { providerKey: 'loader_to', name: 'Loader.to CDN', type: 'CDN Conversion', platform: 'YouTube', enabled: true, priority: 3 },
  { providerKey: 'cobalt_api', name: 'Cobalt API', type: 'External Engine', platform: 'YouTube', enabled: true, priority: 4 },
  { providerKey: 'yt_dlp_instagram', name: 'yt-dlp Instagram Engine', type: 'Node Native Binary', platform: 'Instagram', enabled: true, priority: 1 },
  { providerKey: 'instagram_mirrors', name: 'Instagram Mirrors', type: 'HTML Mirror Scraper', platform: 'Instagram', enabled: true, priority: 2 },
  { providerKey: 'cobalt_instagram', name: 'Cobalt Instagram API', type: 'External Engine', platform: 'Instagram', enabled: true, priority: 3 },
  { providerKey: 'opengraph', name: 'OpenGraph Scraper', type: 'Metadata Scraper', platform: 'General', enabled: true, priority: 1 },
];

let cachedDbProviders: any[] | null = null;
let lastDbProviderCacheTime = 0;
const DB_PROVIDER_CACHE_TTL_MS = 60000; // 60 seconds

/**
 * Authoritative provider configuration lookup with fast in-memory caching
 */
export async function getProviderSettingsFromDb(): Promise<any[]> {
  const now = Date.now();
  if (cachedDbProviders && (now - lastDbProviderCacheTime < DB_PROVIDER_CACHE_TTL_MS)) {
    return cachedDbProviders;
  }

  try {
    const dbProviders = await withDbTimeout(
      prisma.providerSetting.findMany({
        orderBy: { priority: 'asc' },
      }),
      INITIAL_SEED_PROVIDERS,
      300 // Non-blocking 300ms threshold
    );

    if (dbProviders && dbProviders.length > 0) {
      cachedDbProviders = dbProviders;
      lastDbProviderCacheTime = now;
      return dbProviders;
    }

    return INITIAL_SEED_PROVIDERS;
  } catch (err: any) {
    return INITIAL_SEED_PROVIDERS;
  }
}

// Helper to resolve Facebook share/redirect links to canonical URL
async function resolveFacebookUrl(inputUrl: string, signal?: AbortSignal): Promise<string> {
  let fbUrl = inputUrl.trim();
  fbUrl = fbUrl.replace(/(\?|&)(mibextid|share_id|rdid|ref|sfnsn|locale|__cft__\[0\]|__tn__|igsh|utm_[a-zA-Z_]+|fbclid)=[^&#]*/g, '');
  if (fbUrl.endsWith('?') || fbUrl.endsWith('&')) {
    fbUrl = fbUrl.slice(0, -1);
  }

  if (fbUrl.includes('/share/') || fbUrl.includes('fb.watch') || fbUrl.includes('fb.gg') || fbUrl.includes('m.facebook.com')) {
    try {
      const res = await fetchWithTimeout(fbUrl, {
        headers: {
          'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'follow',
      }, 3500, signal);

      if (res.ok) {
        const resolvedRedirectUrl = res.url;
        const html = await res.text();
        const ogUrlMatch = html.match(/<meta[^>]*property=["']og:url["'][^>]*content=["']([^"']+)["']/i)
          || html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);

        if (ogUrlMatch && ogUrlMatch[1] && ogUrlMatch[1].startsWith('http') && !ogUrlMatch[1].includes('/login')) {
          const canonicalUrl = ogUrlMatch[1].replace(/&amp;/g, '&');
          return canonicalUrl;
        }

        if (resolvedRedirectUrl && resolvedRedirectUrl.startsWith('http') && !resolvedRedirectUrl.includes('/login') && !resolvedRedirectUrl.includes('/share/')) {
          return resolvedRedirectUrl;
        }
      }
    } catch {}
  }
  return fbUrl;
}

// Individual Provider Runners
async function runTikWmApi(cleanUrl: string, requestId?: string, signal?: AbortSignal): Promise<ExtractedMediaResult | null> {
  const tkStart = Date.now();
  console.log(`[FETCH_PROVIDER_REQUEST_START] requestId=${requestId} provider="TikWM API" targetUrl=${cleanUrl}`);
  try {
    const tikRes = await fetchWithTimeout(`https://www.tikwm.com/api/?url=${encodeURIComponent(cleanUrl)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
    }, 7000, signal);

    if (tikRes.ok) {
      const json: any = await tikRes.json();
      if (json.code === 0 && json.data) {
        const videoUrl = json.data.hdplay || json.data.play;
        if (videoUrl) {
          const latencyMs = Date.now() - tkStart;
          console.log(`[FETCH_PROVIDER_RESPONSE] requestId=${requestId} provider="TikWM API" success=true latencyMs=${latencyMs}`);
          recordTelemetry({
            requestId,
            provider: 'TikWM API',
            platform: 'TikTok',
            latencyMs,
            success: true,
            targetUrl: cleanUrl,
          });
          return {
            status: 'SUCCESS',
            title: json.data.title || 'TikTok Video',
            thumbnail: json.data.cover || json.data.origin_cover,
            video_url: videoUrl,
          };
        }
      }
    }
    const latencyMs = Date.now() - tkStart;
    console.log(`[FETCH_PROVIDER_RESPONSE] requestId=${requestId} provider="TikWM API" success=false latencyMs=${latencyMs}`);
    recordTelemetry({
      requestId,
      provider: 'TikWM API',
      platform: 'TikTok',
      latencyMs,
      success: false,
      errorMessage: 'TikWM API did not return playable stream',
      targetUrl: cleanUrl,
    });
  } catch (tkErr: any) {
    const latencyMs = Date.now() - tkStart;
    console.warn(`[FETCH_PROVIDER_ERROR] requestId=${requestId} provider="TikWM API" error="${tkErr?.message || tkErr}" latencyMs=${latencyMs}`);
    recordTelemetry({
      requestId,
      provider: 'TikWM API',
      platform: 'TikTok',
      latencyMs,
      success: false,
      errorMessage: tkErr?.message || 'TikWM error',
      targetUrl: cleanUrl,
    });
  }
  return null;
}

async function runCobaltTikTok(cleanUrl: string, requestId?: string, signal?: AbortSignal): Promise<ExtractedMediaResult | null> {
  const cobaltStart = Date.now();
  console.log(`[FETCH_PROVIDER_REQUEST_START] requestId=${requestId} provider="Cobalt TikTok API" targetUrl=${cleanUrl}`);
  const cobaltEndpoints = [
    'https://api.cobalt.tools/api/json',
    'https://co.wuk.sh/api/json',
    'https://cobalt.m3u8.cx/api/json',
  ];

  for (const cobaltUrl of cobaltEndpoints) {
    if (signal?.aborted) break;
    try {
      const cobaltRes = await fetchWithTimeout(cobaltUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: cleanUrl,
          videoQuality: '1080',
        }),
      }, 5000, signal);

      if (cobaltRes.ok) {
        const cobaltData: any = await cobaltRes.json();
        const finalUrl = cobaltData.url || cobaltData.stream || (cobaltData.picker && cobaltData.picker[0]?.url);
        if (finalUrl && typeof finalUrl === 'string' && finalUrl.startsWith('http')) {
          const latencyMs = Date.now() - cobaltStart;
          console.log(`[FETCH_PROVIDER_RESPONSE] requestId=${requestId} provider="Cobalt TikTok API" success=true latencyMs=${latencyMs}`);
          recordTelemetry({
            requestId,
            provider: 'Cobalt TikTok API',
            platform: 'TikTok',
            latencyMs,
            success: true,
            targetUrl: cleanUrl,
          });
          return {
            status: 'SUCCESS',
            title: 'TikTok Video',
            thumbnail: '',
            video_url: finalUrl,
          };
        }
      }
    } catch (e) {}
  }

  const latencyMs = Date.now() - cobaltStart;
  console.log(`[FETCH_PROVIDER_RESPONSE] requestId=${requestId} provider="Cobalt TikTok API" success=false latencyMs=${latencyMs}`);
  recordTelemetry({
    requestId,
    provider: 'Cobalt TikTok API',
    platform: 'TikTok',
    latencyMs,
    success: false,
    errorMessage: 'All Cobalt TikTok instances failed',
    targetUrl: cleanUrl,
  });
  return null;
}

async function runYtdlCore(ytUrl: string, fallbackTitle: string, fallbackThumb: string, requestId?: string, signal?: AbortSignal): Promise<ExtractedMediaResult | null> {
  const ytdlStart = Date.now();
  console.log(`[FETCH_PROVIDER_REQUEST_START] requestId=${requestId} provider="ytdl-core" targetUrl=${ytUrl}`);
  try {
    const infoPromise = ytdl.getInfo(ytUrl);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('YTDL_TIMEOUT')), 8000)
    );
    const abortPromise = new Promise<never>((_, reject) => {
      if (signal?.aborted) reject(new Error('ABORTED'));
      signal?.addEventListener('abort', () => reject(new Error('ABORTED')), { once: true });
    });

    const info: any = await Promise.race([infoPromise, timeoutPromise, abortPromise]);
    const videoFormats = ytdl.filterFormats(info.formats, 'videoandaudio');
    const directUrl = videoFormats[0]?.url || info.formats.find((f: any) => f.url)?.url;
    if (directUrl && typeof directUrl === 'string' && directUrl.startsWith('http')) {
      const latencyMs = Date.now() - ytdlStart;
      console.log(`[FETCH_PROVIDER_RESPONSE] requestId=${requestId} provider="ytdl-core" success=true latencyMs=${latencyMs}`);
      recordTelemetry({
        requestId,
        provider: 'ytdl-core',
        platform: 'YouTube',
        latencyMs,
        success: true,
        targetUrl: ytUrl,
      });
      return {
        status: 'SUCCESS',
        title: info.videoDetails.title || fallbackTitle,
        thumbnail: info.videoDetails.thumbnails?.slice(-1)[0]?.url || fallbackThumb,
        video_url: directUrl,
        forceProxy: true,
      };
    }
    const latencyMs = Date.now() - ytdlStart;
    console.log(`[FETCH_PROVIDER_RESPONSE] requestId=${requestId} provider="ytdl-core" success=false latencyMs=${latencyMs}`);
    recordTelemetry({
      requestId,
      provider: 'ytdl-core',
      platform: 'YouTube',
      latencyMs,
      success: false,
      errorMessage: 'No direct video stream returned',
      targetUrl: ytUrl,
    });
  } catch (ytdlErr: any) {
    const latencyMs = Date.now() - ytdlStart;
    console.warn(`[FETCH_PROVIDER_ERROR] requestId=${requestId} provider="ytdl-core" error="${ytdlErr?.message || ytdlErr}" latencyMs=${latencyMs}`);
    recordTelemetry({
      requestId,
      provider: 'ytdl-core',
      platform: 'YouTube',
      latencyMs,
      success: false,
      errorMessage: ytdlErr?.message || String(ytdlErr),
      targetUrl: ytUrl,
    });
  }
  return null;
}

async function runLoaderTo(ytUrl: string, fallbackTitle: string, fallbackThumb: string, requestId?: string, signal?: AbortSignal): Promise<ExtractedMediaResult | null> {
  const ltoStart = Date.now();
  console.log(`[FETCH_PROVIDER_REQUEST_START] requestId=${requestId} provider="Loader.to CDN" targetUrl=${ytUrl}`);
  try {
    const ltoInit = await fetchWithTimeout(`https://loader.to/ajax/download.php?format=720&url=${encodeURIComponent(ytUrl)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    }, 6000, signal);

    if (ltoInit.ok) {
      const ltoJson: any = await ltoInit.json();
      let directLto = ltoJson?.download_url || ltoJson?.url;
      if (!directLto && ltoJson?.progress_url) {
        // Poll progress_url up to 8 attempts with timeout and signal check
        for (let attempt = 0; attempt < 8; attempt++) {
          if (signal?.aborted) break;
          await new Promise((r) => setTimeout(r, 1000));
          try {
            const pRes = await fetchWithTimeout(ltoJson.progress_url, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              },
            }, 3000, signal);
            if (pRes.ok) {
              const pData: any = await pRes.json();
              const foundUrl = pData?.download_url || pData?.url;
              if (foundUrl && typeof foundUrl === 'string' && foundUrl.startsWith('http')) {
                directLto = foundUrl;
                break;
              }
            }
          } catch {}
        }
      }

      if (directLto && typeof directLto === 'string' && directLto.startsWith('http')) {
        const latencyMs = Date.now() - ltoStart;
        console.log(`[FETCH_PROVIDER_RESPONSE] requestId=${requestId} provider="Loader.to CDN" success=true latencyMs=${latencyMs}`);
        recordTelemetry({
          requestId,
          provider: 'Loader.to CDN',
          platform: 'YouTube',
          latencyMs,
          success: true,
          targetUrl: ytUrl,
        });
        return {
          status: 'SUCCESS',
          title: ltoJson?.info?.title || ltoJson?.title || fallbackTitle,
          thumbnail: ltoJson?.info?.image || ltoJson?.thumbnail_url || fallbackThumb,
          video_url: directLto,
          forceProxy: true,
        };
      }
    }
    const latencyMs = Date.now() - ltoStart;
    console.log(`[FETCH_PROVIDER_RESPONSE] requestId=${requestId} provider="Loader.to CDN" success=false latencyMs=${latencyMs}`);
    recordTelemetry({
      requestId,
      provider: 'Loader.to CDN',
      platform: 'YouTube',
      latencyMs,
      success: false,
      errorMessage: 'Loader.to returned no direct URL',
      targetUrl: ytUrl,
    });
  } catch (ltoErr: any) {
    const latencyMs = Date.now() - ltoStart;
    console.warn(`[FETCH_PROVIDER_ERROR] requestId=${requestId} provider="Loader.to CDN" error="${ltoErr?.message || ltoErr}" latencyMs=${latencyMs}`);
    recordTelemetry({
      requestId,
      provider: 'Loader.to CDN',
      platform: 'YouTube',
      latencyMs,
      success: false,
      errorMessage: ltoErr?.message || 'Loader.to failed',
      targetUrl: ytUrl,
    });
  }
  return null;
}

async function runCobaltApi(ytUrl: string, fallbackTitle: string, fallbackThumb: string, requestId?: string, signal?: AbortSignal): Promise<ExtractedMediaResult | null> {
  const cobaltStart = Date.now();
  console.log(`[FETCH_PROVIDER_REQUEST_START] requestId=${requestId} provider="Cobalt API" targetUrl=${ytUrl}`);
  const cobaltEndpoints = [
    'https://api.cobalt.tools/api/json',
    'https://co.wuk.sh/api/json',
    'https://cobalt.m3u8.cx/api/json',
  ];

  for (const cobaltUrl of cobaltEndpoints) {
    if (signal?.aborted) break;
    try {
      const cobaltRes = await fetchWithTimeout(cobaltUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: ytUrl,
          videoQuality: '1080',
          filenamePattern: 'classic',
        }),
      }, 5000, signal);

      if (cobaltRes.ok) {
        const cobaltData: any = await cobaltRes.json();
        const finalUrl = cobaltData.url || cobaltData.stream || (cobaltData.picker && cobaltData.picker[0]?.url);
        if (finalUrl && typeof finalUrl === 'string' && finalUrl.startsWith('http')) {
          const latencyMs = Date.now() - cobaltStart;
          console.log(`[FETCH_PROVIDER_RESPONSE] requestId=${requestId} provider="Cobalt API" success=true latencyMs=${latencyMs}`);
          recordTelemetry({
            requestId,
            provider: 'Cobalt API',
            platform: 'YouTube',
            latencyMs,
            success: true,
            targetUrl: ytUrl,
          });
          return {
            status: 'SUCCESS',
            title: fallbackTitle,
            thumbnail: fallbackThumb,
            video_url: finalUrl,
            forceProxy: true,
          };
        }
      }
    } catch (e) {}
  }

  const latencyMs = Date.now() - cobaltStart;
  console.log(`[FETCH_PROVIDER_RESPONSE] requestId=${requestId} provider="Cobalt API" success=false latencyMs=${latencyMs}`);
  recordTelemetry({
    requestId,
    provider: 'Cobalt API',
    platform: 'YouTube',
    latencyMs,
    success: false,
    errorMessage: 'All Cobalt API instances failed',
    targetUrl: ytUrl,
  });
  return null;
}

async function runCobaltInstagram(igUrl: string, requestId?: string, signal?: AbortSignal): Promise<ExtractedMediaResult | null> {
  const cobaltStart = Date.now();
  console.log(`[FETCH_PROVIDER_REQUEST_START] requestId=${requestId} provider="Cobalt API (Instagram)" targetUrl=${igUrl}`);
  const cobaltEndpoints = [
    'https://api.cobalt.tools/api/json',
    'https://cobalt.m3u8.cx/api/json',
    'https://co.wuk.sh/api/json',
  ];

  for (const cobaltUrl of cobaltEndpoints) {
    if (signal?.aborted) break;
    try {
      const cobaltRes = await fetchWithTimeout(cobaltUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
        body: JSON.stringify({
          url: igUrl,
          videoQuality: '1080',
          filenamePattern: 'classic',
        }),
      }, 5000, signal);

      if (cobaltRes.ok) {
        const cobaltData: any = await cobaltRes.json();
        const finalUrl = cobaltData.url || cobaltData.stream || (cobaltData.picker && cobaltData.picker[0]?.url);
        if (finalUrl && typeof finalUrl === 'string' && finalUrl.startsWith('http')) {
          const latencyMs = Date.now() - cobaltStart;
          console.log(`[FETCH_PROVIDER_RESPONSE] requestId=${requestId} provider="Cobalt API (Instagram)" success=true latencyMs=${latencyMs}`);
          recordTelemetry({
            requestId,
            provider: 'Cobalt API',
            platform: 'Instagram',
            latencyMs,
            success: true,
            targetUrl: igUrl,
          });
          return {
            status: 'SUCCESS',
            title: 'Instagram Video',
            thumbnail: cobaltData.picker?.[0]?.thumb || '',
            video_url: finalUrl,
            forceProxy: true,
          };
        }
      }
    } catch (e) {}
  }

  const latencyMs = Date.now() - cobaltStart;
  console.log(`[FETCH_PROVIDER_RESPONSE] requestId=${requestId} provider="Cobalt API (Instagram)" success=false latencyMs=${latencyMs}`);
  return null;
}

async function runInstagramMirrors(cleanUrl: string, requestId?: string, signal?: AbortSignal): Promise<ExtractedMediaResult | null> {
  const igStart = Date.now();
  console.log(`[FETCH_PROVIDER_REQUEST_START] requestId=${requestId} provider="Instagram Mirrors" targetUrl=${cleanUrl}`);
  try {
    const igMatch = cleanUrl.match(/(?:instagram\.com|instagr\.am)\/(?:p|reel|reels|tv|stories)\/([a-zA-Z0-9_-]+)/i);
    const shortcode = igMatch ? igMatch[1] : null;

    let igTitle = 'Instagram Reel';
    let igThumb = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&q=80';

    if (shortcode) {
      try {
        const oembedRes = await fetchWithTimeout(`https://www.instagram.com/oembed/?url=https://www.instagram.com/p/${shortcode}/`, {}, 3000, signal);
        if (oembedRes.ok) {
          const json: any = await oembedRes.json();
          if (json.title) igTitle = json.title;
          if (json.thumbnail_url) igThumb = json.thumbnail_url;
          if (json.author_name) igTitle = `${json.author_name} - ${igTitle}`;
        }
      } catch {}

      const mirrorEndpoints = [
        `https://ddinstagram.com/reel/${shortcode}/`,
        `https://vxinstagram.com/reel/${shortcode}/`,
        `https://instafix.app/reel/${shortcode}/`,
        `https://kkinstagram.com/reel/${shortcode}/`,
        `https://ddinstagram.com/p/${shortcode}/`,
      ];

      for (const mirrorUrl of mirrorEndpoints) {
        if (signal?.aborted) break;
        try {
          const mirrorRes = await fetchWithTimeout(mirrorUrl, {
            headers: {
              'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9',
            },
          }, 4000, signal);

          if (mirrorRes.ok) {
            const html = await mirrorRes.text();
            const ogVideoMatch = html.match(/<meta\s+property=["']og:video(?::secure_url|:url|)?["']\s+content=["']([^"']+)["']/i)
              || html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:video(?::secure_url|:url|)?["']/i)
              || html.match(/<meta\s+name=["']twitter:player:stream["']\s+content=["']([^"']+)["']/i)
              || html.match(/<video[^>]*src=["']([^"']+)["']/i);

            let ogVideo = ogVideoMatch ? ogVideoMatch[1] : null;

            if (ogVideo) {
              ogVideo = ogVideo.replace(/&amp;/g, '&').replace(/\\u0026/g, '&').replace(/\\/g, '');
            }

            const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)
              || html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
            const ogImage = ogImageMatch ? ogImageMatch[1] : null;

            const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
            const ogTitle = ogTitleMatch ? ogTitleMatch[1] : null;

            if (ogVideo && (ogVideo.startsWith('http://') || ogVideo.startsWith('https://')) && !ogVideo.includes('instagram.com/reel/') && !ogVideo.includes('instagram.com/p/')) {
              const latencyMs = Date.now() - igStart;
              console.log(`[FETCH_PROVIDER_RESPONSE] requestId=${requestId} provider="Instagram Mirrors" success=true latencyMs=${latencyMs}`);
              recordTelemetry({
                requestId,
                provider: 'Instagram Mirrors',
                platform: 'Instagram',
                latencyMs,
                success: true,
                targetUrl: cleanUrl,
              });
              return {
                status: 'SUCCESS',
                title: ogTitle ? ogTitle.replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim() : igTitle,
                thumbnail: ogImage || igThumb,
                video_url: ogVideo,
              };
            }
          }
        } catch (err) {}
      }
    }

    // VKR Downloader fallback for Instagram
    try {
      const vkrRes = await fetchWithTimeout(`https://api.vkrdown.com/ig/?url=${encodeURIComponent(cleanUrl)}`, {}, 4000, signal);
      if (vkrRes.ok) {
        const vkrData: any = await vkrRes.json();
        const mediaUrl = vkrData.data?.downloads?.[0]?.url || vkrData.data?.videoUrl || vkrData.url;
        if (mediaUrl && typeof mediaUrl === 'string' && mediaUrl.startsWith('http')) {
          const latencyMs = Date.now() - igStart;
          console.log(`[FETCH_PROVIDER_RESPONSE] requestId=${requestId} provider="Instagram Mirrors (VKR)" success=true latencyMs=${latencyMs}`);
          recordTelemetry({
            requestId,
            provider: 'Instagram Mirrors',
            platform: 'Instagram',
            latencyMs,
            success: true,
            targetUrl: cleanUrl,
          });
          return {
            status: 'SUCCESS',
            title: vkrData.data?.title || igTitle,
            thumbnail: vkrData.data?.thumbnail || igThumb,
            video_url: mediaUrl,
            forceProxy: true,
          };
        }
      }
    } catch (e) {}

    const latencyMs = Date.now() - igStart;
    console.log(`[FETCH_PROVIDER_RESPONSE] requestId=${requestId} provider="Instagram Mirrors" success=false latencyMs=${latencyMs}`);
    recordTelemetry({
      requestId,
      provider: 'Instagram Mirrors',
      platform: 'Instagram',
      latencyMs,
      success: false,
      errorMessage: 'Could not extract direct MP4 link from Instagram post',
      targetUrl: cleanUrl,
    });
  } catch (igErr: any) {
    const latencyMs = Date.now() - igStart;
    console.warn(`[FETCH_PROVIDER_ERROR] requestId=${requestId} provider="Instagram Mirrors" error="${igErr?.message || igErr}" latencyMs=${latencyMs}`);
    recordTelemetry({
      requestId,
      provider: 'Instagram Mirrors',
      platform: 'Instagram',
      latencyMs,
      success: false,
      errorMessage: igErr?.message || 'Instagram extraction failure',
      targetUrl: cleanUrl,
    });
  }
  return null;
}

async function runYtDlpExtractor(
  targetUrl: string,
  platform: string,
  requestId?: string,
  signal?: AbortSignal
): Promise<ExtractedMediaResult | null> {
  const ytStart = Date.now();
  console.log(`[FETCH_PROVIDER_REQUEST_START] requestId=${requestId} provider="yt-dlp Engine" targetUrl=${targetUrl}`);

  const binPath = findYtDlpPath();
  if (!binPath) {
    console.warn(`[FETCH_PROVIDER_ERROR] requestId=${requestId} provider="yt-dlp Engine" binary not found`);
    return null;
  }

  const args = [
    '-j',
    '--no-warnings',
    '--no-check-certificates',
    '--prefer-free-formats',
    '--add-header',
    'User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    targetUrl,
  ];

  try {
    if (signal?.aborted) return null;

    let stdout = '';
    try {
      const res = await execFileAsync(binPath, args, {
        timeout: 16000,
        maxBuffer: 10 * 1024 * 1024,
        env: { ...process.env, PATH: process.env.PATH || '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin' },
      });
      stdout = res.stdout;
    } catch (binErr: any) {
      try {
        const pyRes = await execFileAsync('python3', [binPath, ...args], {
          timeout: 16000,
          maxBuffer: 10 * 1024 * 1024,
          env: { ...process.env, PATH: process.env.PATH || '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin' },
        });
        stdout = pyRes.stdout;
      } catch (pyErr: any) {
        throw binErr;
      }
    }

    if (!stdout || !stdout.trim()) return null;

    const trimmed = stdout.trim();
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return null;
    const jsonStr = trimmed.substring(firstBrace, lastBrace + 1);
    const info = JSON.parse(jsonStr);
    const title = info.title || `${platform} Video`;
    const thumbnail = info.thumbnail || '';
    const rawFormats: any[] = Array.isArray(info.formats) ? info.formats : [];

    const parsedFormats: Array<{
      id: string;
      quality: string;
      format: string;
      resolution?: string;
      sizeBytes?: number;
      sizeFormatted?: string;
      url: string;
      directVideoUrl?: string;
      hasAudio?: boolean;
      watermarkFree?: boolean;
      forceProxy?: boolean;
    }> = [];

    // Filter progressive and valid formats
    const progressive = rawFormats.filter((f) => f.url && f.vcodec !== 'none');
    progressive.sort((a, b) => (b.height || 0) - (a.height || 0) || (b.filesize || 0) - (a.filesize || 0));

    for (const f of progressive) {
      const height = f.height || (f.resolution && f.resolution.includes('x') ? parseInt(f.resolution.split('x')[1]) : null);
      const qualityLabel = height ? `${height}p` : f.format_note || (f.format_id === 'hd' ? 'HD 720p' : 'SD 480p');
      const sizeBytes = f.filesize || f.filesize_approx || 0;
      const sizeFormatted = sizeBytes > 0 ? `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB` : undefined;

      parsedFormats.push({
        id: f.format_id || `mp4-${qualityLabel}`,
        quality: qualityLabel,
        format: f.ext || 'mp4',
        resolution: f.resolution || (height ? `${f.width || '1280'}x${height}` : undefined),
        sizeBytes: sizeBytes || undefined,
        sizeFormatted,
        url: f.url,
        directVideoUrl: f.url,
        hasAudio: f.acodec !== 'none',
        watermarkFree: true,
        forceProxy: true,
      });
    }

    if (parsedFormats.length === 0 && info.url) {
      parsedFormats.push({
        id: 'default',
        quality: 'HD',
        format: info.ext || 'mp4',
        url: info.url,
        directVideoUrl: info.url,
        hasAudio: true,
        watermarkFree: true,
        forceProxy: true,
      });
    }

    // Audio format
    const audioStreams = rawFormats.filter((f) => f.url && f.vcodec === 'none' && f.acodec !== 'none');
    if (audioStreams.length > 0) {
      const topAudio = audioStreams[audioStreams.length - 1];
      const audioSize = topAudio.filesize || topAudio.filesize_approx || 0;
      parsedFormats.push({
        id: 'audio-m4a',
        quality: 'Audio MP3/M4A (128kbps)',
        format: 'mp3',
        sizeBytes: audioSize || undefined,
        sizeFormatted: audioSize > 0 ? `${(audioSize / (1024 * 1024)).toFixed(1)} MB` : undefined,
        url: topAudio.url,
        directVideoUrl: topAudio.url,
        hasAudio: true,
        watermarkFree: true,
        forceProxy: true,
      });
    }

    // Prioritize formats with audio and MP4 format
    parsedFormats.sort((a, b) => {
      if (a.format === 'mp3' && b.format !== 'mp3') return 1;
      if (b.format === 'mp3' && a.format !== 'mp3') return -1;
      const aAudio = a.hasAudio ? 1 : 0;
      const bAudio = b.hasAudio ? 1 : 0;
      if (aAudio !== bAudio) return bAudio - aAudio;
      return (b.sizeBytes || 0) - (a.sizeBytes || 0);
    });

    const firstVideo = parsedFormats.find((f) => f.format !== 'mp3' && f.url) || parsedFormats[0];
    const topVideoUrl = firstVideo?.url || info.url || null;

    if (topVideoUrl) {
      const latencyMs = Date.now() - ytStart;
      console.log(`[FETCH_PROVIDER_RESPONSE] requestId=${requestId} provider="yt-dlp Engine" success=true latencyMs=${latencyMs}`);
      recordTelemetry({
        requestId,
        provider: 'yt-dlp Engine',
        platform,
        latencyMs,
        success: true,
        targetUrl,
      });

      return {
        status: 'SUCCESS',
        title,
        thumbnail,
        video_url: topVideoUrl,
        formats: parsedFormats,
        forceProxy: true,
      };
    }
  } catch (err: any) {
    const latencyMs = Date.now() - ytStart;
    console.warn(`[FETCH_PROVIDER_RESPONSE] requestId=${requestId} provider="yt-dlp Engine" success=false error="${err?.message || err}" latencyMs=${latencyMs}`);
    recordTelemetry({
      requestId,
      provider: 'yt-dlp Engine',
      platform,
      latencyMs,
      success: false,
      errorMessage: err?.message || 'yt-dlp execution error',
      targetUrl,
    });
  }

  return null;
}

async function runBtchFbExtractor(
  targetUrl: string,
  requestId?: string,
  signal?: AbortSignal
): Promise<ExtractedMediaResult | null> {
  return null;
}

async function runBtchIgExtractor(
  targetUrl: string,
  requestId?: string,
  signal?: AbortSignal
): Promise<ExtractedMediaResult | null> {
  return null;
}

async function runFbPluginScraper(fbUrl: string, rawUrl: string, cleanUrl: string, requestId?: string, signal?: AbortSignal): Promise<ExtractedMediaResult | null> {
  const fbStart = Date.now();
  console.log(`[FETCH_PROVIDER_REQUEST_START] requestId=${requestId} provider="FB Plugin Scraper" targetUrl=${cleanUrl}`);
  try {
    const pluginVideoUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(fbUrl)}&show_text=false`;
    const mobileFbUrl = fbUrl.replace('www.facebook.com', 'm.facebook.com');

    const scrapeCandidates = [
      pluginVideoUrl,
      mobileFbUrl,
      fbUrl,
    ].filter((u, i, arr) => u && arr.indexOf(u) === i);

    for (const candidateUrl of scrapeCandidates) {
      if (signal?.aborted) break;
      try {
        const fbRes = await fetchWithTimeout(candidateUrl, {
          headers: {
            'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          redirect: 'follow',
        }, 4000, signal);

        if (fbRes.ok) {
          const html = await fbRes.text();
          const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1]
            || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
          const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)?.[1];

          const hdMatch = html.match(/"playable_url_quality_hd":"([^"]+)"/)
            || html.match(/"browser_native_hd_url":"([^"]+)"/)
            || html.match(/"hd_src":"([^"]+)"/)
            || html.match(/"hd_src_no_ratelimit":"([^"]+)"/);
          const sdMatch = html.match(/"playable_url":"([^"]+)"/)
            || html.match(/"browser_native_sd_url":"([^"]+)"/)
            || html.match(/"sd_src":"([^"]+)"/)
            || html.match(/"sd_src_no_ratelimit":"([^"]+)"/);
          const ogVidMatch = html.match(/<meta[^>]*property=["']og:video(?::secure_url|:url|)?["'][^>]*content=["']([^"']+)["']/i)?.[1]
            || html.match(/"video_src":"([^"]+)"/)?.[1]
            || html.match(/"video_url":"([^"]+)"/)?.[1];

          let directUrl: string | null = null;
          if (hdMatch && hdMatch[1]) directUrl = hdMatch[1];
          else if (sdMatch && sdMatch[1]) directUrl = sdMatch[1];
          else if (ogVidMatch && typeof ogVidMatch === 'string' && ogVidMatch.startsWith('http')) directUrl = ogVidMatch;

          if (directUrl) {
            directUrl = directUrl.replace(/\\/g, '').replace(/\\u0026/g, '&').replace(/&amp;/g, '&');
            if (!directUrl.includes('lookaside') && !directUrl.includes('.m3u8') && !directUrl.includes('.mpd')) {
              const latencyMs = Date.now() - fbStart;
              console.log(`[FETCH_PROVIDER_RESPONSE] requestId=${requestId} provider="FB Plugin Scraper" success=true latencyMs=${latencyMs}`);
              recordTelemetry({
                requestId,
                provider: 'FB Plugin Scraper',
                platform: 'Facebook',
                latencyMs,
                success: true,
                targetUrl: cleanUrl,
              });
              return {
                status: 'SUCCESS',
                title: ogTitle ? ogTitle.replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim() : 'Facebook Video',
                thumbnail: ogImage || '',
                video_url: directUrl,
                forceProxy: true,
              };
            }
          }
        }
      } catch (e) {}
    }
    const latencyMs = Date.now() - fbStart;
    console.log(`[FETCH_PROVIDER_RESPONSE] requestId=${requestId} provider="FB Plugin Scraper" success=false latencyMs=${latencyMs}`);
    recordTelemetry({
      requestId,
      provider: 'FB Plugin Scraper',
      platform: 'Facebook',
      latencyMs,
      success: false,
      errorMessage: 'FB Plugin Scraper failed to find playable URL',
      targetUrl: cleanUrl,
    });
  } catch (e: any) {
    const latencyMs = Date.now() - fbStart;
    console.warn(`[FETCH_PROVIDER_ERROR] requestId=${requestId} provider="FB Plugin Scraper" error="${e?.message || e}" latencyMs=${latencyMs}`);
    recordTelemetry({
      requestId,
      provider: 'FB Plugin Scraper',
      platform: 'Facebook',
      latencyMs,
      success: false,
      errorMessage: e?.message || 'FB Plugin Scraper error',
      targetUrl: cleanUrl,
    });
  }
  return null;
}

async function runCobaltVkrFb(fbUrl: string, rawUrl: string, cleanUrl: string, requestId?: string, signal?: AbortSignal): Promise<ExtractedMediaResult | null> {
  const fbStart = Date.now();
  console.log(`[FETCH_PROVIDER_REQUEST_START] requestId=${requestId} provider="Cobalt / VKR API" targetUrl=${cleanUrl}`);
  const cobaltInstances = [
    'https://api.cobalt.tools/api/json',
    'https://cobalt.m3u8.cx/api/json',
    'https://co.wuk.sh/api/json',
  ];

  for (const targetUrl of [fbUrl, rawUrl]) {
    if (signal?.aborted) break;
    for (const cobaltUrl of cobaltInstances) {
      if (signal?.aborted) break;
      try {
        const cobaltRes = await fetchWithTimeout(cobaltUrl, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          },
          body: JSON.stringify({ url: targetUrl }),
        }, 4000, signal);

        if (cobaltRes.ok) {
          const cobaltData: any = await cobaltRes.json();
          const mediaUrl = cobaltData.url || cobaltData.picker?.[0]?.url;

          if (mediaUrl && !mediaUrl.includes('lookaside.fbsbx.com')) {
            const latencyMs = Date.now() - fbStart;
            console.log(`[FETCH_PROVIDER_RESPONSE] requestId=${requestId} provider="Cobalt / VKR API" success=true latencyMs=${latencyMs}`);
            recordTelemetry({
              requestId,
              provider: 'Cobalt / VKR API',
              platform: 'Facebook',
              latencyMs,
              success: true,
              targetUrl: cleanUrl,
            });
            return {
              status: 'SUCCESS',
              title: 'Facebook Media',
              thumbnail: '',
              video_url: mediaUrl,
              forceProxy: true,
            };
          }
        }
      } catch (e) {}
    }

    try {
      const vkrRes = await fetchWithTimeout(`https://api.vkrdown.com/fb/?url=${encodeURIComponent(targetUrl)}`, {}, 4000, signal);
      if (vkrRes.ok) {
        const vkrData: any = await vkrRes.json();
        const mediaUrl = vkrData.data?.downloads?.[0]?.url || vkrData.data?.videoUrl || vkrData.url;
        if (mediaUrl && !mediaUrl.includes('lookaside.fbsbx.com')) {
          const latencyMs = Date.now() - fbStart;
          console.log(`[FETCH_PROVIDER_RESPONSE] requestId=${requestId} provider="Cobalt / VKR API" success=true latencyMs=${latencyMs}`);
          recordTelemetry({
            requestId,
            provider: 'Cobalt / VKR API',
            platform: 'Facebook',
            latencyMs,
            success: true,
            targetUrl: cleanUrl,
          });
          return {
            status: 'SUCCESS',
            title: vkrData.data?.title || 'Facebook Video',
            thumbnail: vkrData.data?.thumbnail || '',
            video_url: mediaUrl,
            forceProxy: true,
          };
        }
      }
    } catch (e) {}
  }

  const latencyMs = Date.now() - fbStart;
  console.log(`[FETCH_PROVIDER_RESPONSE] requestId=${requestId} provider="Cobalt / VKR API" success=false latencyMs=${latencyMs}`);
  recordTelemetry({
    requestId,
    provider: 'Cobalt / VKR API',
    platform: 'Facebook',
    latencyMs,
    success: false,
    errorMessage: 'Cobalt / VKR API failed to extract Facebook media',
    targetUrl: cleanUrl,
  });
  return null;
}

async function runOpenGraphScraper(cleanUrl: string, requestId?: string, signal?: AbortSignal): Promise<ExtractedMediaResult | null> {
  const fallbackStart = Date.now();
  console.log(`[FETCH_PROVIDER_REQUEST_START] requestId=${requestId} provider="OpenGraph Scraper" targetUrl=${cleanUrl}`);
  try {
    const pageRes = await fetchWithTimeout(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    }, 6000, signal);

    if (pageRes.ok) {
      const html = await pageRes.text();
      const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1]
        || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
      const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)?.[1];
      const ogVideo = html.match(/<meta[^>]*property=["']og:video(?::secure_url|:url|)?["'][^>]*content=["']([^"']+)["']/i)?.[1]
        || html.match(/<video[^>]*src=["']([^"']+)["']/i)?.[1];

      if (ogTitle || ogVideo) {
        const latencyMs = Date.now() - fallbackStart;
        console.log(`[FETCH_PROVIDER_RESPONSE] requestId=${requestId} provider="OpenGraph Scraper" success=true latencyMs=${latencyMs}`);
        recordTelemetry({
          requestId,
          provider: 'OpenGraph Scraper',
          platform: 'General',
          latencyMs,
          success: true,
          targetUrl: cleanUrl,
        });
        return {
          status: 'SUCCESS',
          title: ogTitle ? ogTitle.trim() : 'OmniFetch Media',
          thumbnail: ogImage || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&q=80',
          video_url: ogVideo || cleanUrl,
        };
      }
    }
  } catch {}

  const latencyMs = Date.now() - fallbackStart;
  console.log(`[FETCH_PROVIDER_RESPONSE] requestId=${requestId} provider="OpenGraph Scraper" success=false latencyMs=${latencyMs}`);
  recordTelemetry({
    requestId,
    provider: 'OpenGraph Scraper',
    platform: 'General',
    latencyMs,
    success: false,
    errorMessage: 'OpenGraph Scraper direct extraction failed',
    targetUrl: cleanUrl,
  });
  return null;
}

export async function extractMedia(rawUrl: string, requestId?: string, signal?: AbortSignal): Promise<ExtractedMediaResult> {
  const overallStart = Date.now();
  console.log(`[FETCH_START] requestId=${requestId} url=${rawUrl}`);
  try {
    let cleanUrl = rawUrl.trim().replace(/^\/+/, '');
    cleanUrl = cleanUrl.split('?mibextid=')[0].split('?share_id=')[0];
    const lowerUrl = cleanUrl.toLowerCase();

    // 1. Authoritative lookup from Supabase PostgreSQL via Prisma
    const rawDbProviders = await getProviderSettingsFromDb();
    const dbProviders = [...(rawDbProviders || [])];
    for (const seed of INITIAL_SEED_PROVIDERS) {
      if (!dbProviders.some((p) => p.providerKey === seed.providerKey)) {
        dbProviders.push(seed);
      }
    }

    if (!dbProviders) {
      return {
        status: 'FAILED',
        reason: 'PROVIDER_CONFIG_UNAVAILABLE',
        httpStatus: 503,
      };
    }

    // Determine platform
    let platformKey = 'General';
    if (lowerUrl.includes('instagram.com') || lowerUrl.includes('instagr.am')) platformKey = 'Instagram';
    else if (lowerUrl.includes('tiktok.com')) platformKey = 'TikTok';
    else if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) platformKey = 'YouTube';
    else if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.watch') || lowerUrl.includes('fb.gg')) platformKey = 'Facebook';

    // Get active enabled providers for target platform sorted strictly by priority (1 is highest priority)
    let enabledProviders = dbProviders
      .filter((p) => {
        const plat = (p.platform || '').toLowerCase();
        const targetPlat = platformKey.toLowerCase();
        return (plat === targetPlat || plat === 'multi-platform' || (targetPlat === 'general' && plat === 'general')) && Boolean(p.enabled);
      })
      .sort((a, b) => Number(a.priority) - Number(b.priority));

    // If platform has records in DB but ALL were explicitly disabled by admin, return 503
    const hasExplicitPlatformRecords = dbProviders.some((p) => (p.platform || '').toLowerCase() === platformKey.toLowerCase());
    if (hasExplicitPlatformRecords && enabledProviders.length === 0) {
      console.log(`[FETCH_PROVIDER_SELECTED] requestId=${requestId} platform=${platformKey} ALL_PROVIDERS_DISABLED`);
      return {
        status: 'FAILED',
        reason: 'NO_ENABLED_PROVIDERS',
        httpStatus: 503,
      };
    }

    // If no specific providers found in custom DB settings, fallback to initial default seed providers
    if (enabledProviders.length === 0) {
      enabledProviders = INITIAL_SEED_PROVIDERS
        .filter((p) => {
          const plat = (p.platform || '').toLowerCase();
          const targetPlat = platformKey.toLowerCase();
          return (plat === targetPlat || plat === 'multi-platform') && Boolean(p.enabled);
        })
        .sort((a, b) => Number(a.priority) - Number(b.priority));
    }

    console.log(`[FETCH_PROVIDER_SELECTED] requestId=${requestId} platform=${platformKey} enabledProvidersCount=${enabledProviders.length}`);

    // Execute enabled providers in order of priority
    if (platformKey === 'TikTok') {
      for (const p of enabledProviders) {
        if (signal?.aborted) break;
        const key = (p.providerKey || '').toLowerCase();
        if (key.includes('tikwm')) {
          const res = await runTikWmApi(cleanUrl, requestId, signal);
          if (res) {
            console.log(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} platform=TikTok provider=${p.providerKey} status=SUCCESS elapsedMs=${Date.now() - overallStart}`);
            return res;
          }
        } else if (key.includes('yt_dlp') || key.includes('ytdlp')) {
          const res = await runYtDlpExtractor(cleanUrl, 'TikTok', requestId, signal);
          if (res) {
            console.log(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} platform=TikTok provider=${p.providerKey} status=SUCCESS elapsedMs=${Date.now() - overallStart}`);
            return res;
          }
        } else if (key.includes('cobalt')) {
          const res = await runCobaltTikTok(cleanUrl, requestId, signal);
          if (res) {
            console.log(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} platform=TikTok provider=${p.providerKey} status=SUCCESS elapsedMs=${Date.now() - overallStart}`);
            return res;
          }
        } else if (key.includes('opengraph')) {
          const res = await runOpenGraphScraper(cleanUrl, requestId, signal);
          if (res) {
            console.log(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} platform=TikTok provider=${p.providerKey} status=SUCCESS elapsedMs=${Date.now() - overallStart}`);
            return res;
          }
        }
      }

      // Built-in fallback tiers
      const tikwmRes = await runTikWmApi(cleanUrl, requestId, signal);
      if (tikwmRes) return tikwmRes;

      const ytDlpRes = await runYtDlpExtractor(cleanUrl, 'TikTok', requestId, signal);
      if (ytDlpRes) return ytDlpRes;

      const cobaltRes = await runCobaltTikTok(cleanUrl, requestId, signal);
      if (cobaltRes) return cobaltRes;

      const ogRes = await runOpenGraphScraper(cleanUrl, requestId, signal);
      if (ogRes) return ogRes;

      console.log(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} platform=TikTok status=FAILED elapsedMs=${Date.now() - overallStart}`);
      return { status: 'FAILED', reason: 'All enabled TikTok providers failed to extract media.' };
    }

    if (platformKey === 'YouTube') {
      let ytUrl = cleanUrl;
      if (rawUrl.includes('youtube.com/shorts/')) {
        ytUrl = `https://www.youtube.com/watch?v=${rawUrl.split('/shorts/')[1].split('?')[0]}`;
      } else if (cleanUrl.includes('youtu.be/')) {
        ytUrl = `https://www.youtube.com/watch?v=${cleanUrl.split('youtu.be/')[1]}`;
      }

      const videoIdMatch = ytUrl.match(/(?:v=|\/shorts\/|youtu\.be\/|\/embed\/)([a-zA-Z0-9_-]{11})/);
      const videoId = videoIdMatch ? videoIdMatch[1] : null;

      let fallbackTitle = 'YouTube Video';
      let fallbackThumb = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '';

      try {
        const oembedRes = await fetchWithTimeout(`https://www.youtube.com/oembed?url=${encodeURIComponent(ytUrl)}&format=json`, {}, 3000, signal);
        if (oembedRes.ok) {
          const oembedData: any = await oembedRes.json();
          if (oembedData.title) fallbackTitle = oembedData.title;
          if (oembedData.thumbnail_url) fallbackThumb = oembedData.thumbnail_url;
        }
      } catch (e) {}

      for (const p of enabledProviders) {
        if (signal?.aborted) break;
        const key = (p.providerKey || '').toLowerCase();
        if (key.includes('yt_dlp') || key.includes('ytdlp')) {
          const res = await runYtDlpExtractor(ytUrl, 'YouTube', requestId, signal);
          if (res) {
            console.log(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} platform=YouTube provider=${p.providerKey} status=SUCCESS elapsedMs=${Date.now() - overallStart}`);
            return res;
          }
        } else if (key.includes('ytdl') || key.includes('ytdl_core')) {
          const res = await runYtdlCore(ytUrl, fallbackTitle, fallbackThumb, requestId, signal);
          if (res) {
            console.log(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} platform=YouTube provider=${p.providerKey} status=SUCCESS elapsedMs=${Date.now() - overallStart}`);
            return res;
          }
        } else if (key.includes('loader')) {
          const res = await runLoaderTo(ytUrl, fallbackTitle, fallbackThumb, requestId, signal);
          if (res) {
            console.log(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} platform=YouTube provider=${p.providerKey} status=SUCCESS elapsedMs=${Date.now() - overallStart}`);
            return res;
          }
        } else if (key.includes('cobalt')) {
          const res = await runCobaltApi(ytUrl, fallbackTitle, fallbackThumb, requestId, signal);
          if (res) {
            console.log(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} platform=YouTube provider=${p.providerKey} status=SUCCESS elapsedMs=${Date.now() - overallStart}`);
            return res;
          }
        } else if (key.includes('opengraph')) {
          const res = await runOpenGraphScraper(ytUrl, requestId, signal);
          if (res) {
            console.log(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} platform=YouTube provider=${p.providerKey} status=SUCCESS elapsedMs=${Date.now() - overallStart}`);
            return res;
          }
        }
      }

      // Built-in fallback tiers
      const ytDlpRes = await runYtDlpExtractor(ytUrl, 'YouTube', requestId, signal);
      if (ytDlpRes) return ytDlpRes;

      const ytdlRes = await runYtdlCore(ytUrl, fallbackTitle, fallbackThumb, requestId, signal);
      if (ytdlRes) return ytdlRes;

      const cobaltRes = await runCobaltApi(ytUrl, fallbackTitle, fallbackThumb, requestId, signal);
      if (cobaltRes) return cobaltRes;

      const loaderRes = await runLoaderTo(ytUrl, fallbackTitle, fallbackThumb, requestId, signal);
      if (loaderRes) return loaderRes;

      const ogRes = await runOpenGraphScraper(ytUrl, requestId, signal);
      if (ogRes) return ogRes;

      console.log(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} platform=YouTube status=FAILED elapsedMs=${Date.now() - overallStart}`);
      return { status: 'FAILED', reason: 'All enabled YouTube providers failed to extract media.' };
    }

    if (platformKey === 'Facebook') {
      let fbUrl = cleanUrl;
      let resolvedUrl: string | null = null;
      if (fbUrl.includes('/share/') || fbUrl.includes('fb.watch') || fbUrl.includes('fb.gg')) {
        try {
          const resolved = await resolveFacebookUrl(fbUrl, signal);
          if (resolved && resolved.startsWith('http')) {
            resolvedUrl = resolved.split('?')[0].replace(/\/+$/, '');
          }
        } catch (e) {}
      }

      const candidateUrls = [resolvedUrl, fbUrl, cleanUrl, rawUrl].filter((u): u is string => Boolean(u && u.trim().length > 0));
      const uniqueUrls = Array.from(new Set(candidateUrls));

      for (const p of enabledProviders) {
        if (signal?.aborted) break;
        const key = (p.providerKey || '').toLowerCase();
        if (key.includes('yt_dlp') || key.includes('ytdlp')) {
          for (const u of uniqueUrls) {
            if (signal?.aborted) break;
            const res = await runYtDlpExtractor(u, 'Facebook', requestId, signal);
            if (res) {
              console.log(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} platform=Facebook provider=${p.providerKey} status=SUCCESS elapsedMs=${Date.now() - overallStart}`);
              return res;
            }
          }
        } else if (key.includes('btch')) {
          for (const u of uniqueUrls) {
            if (signal?.aborted) break;
            const res = await runBtchFbExtractor(u, requestId, signal);
            if (res) {
              console.log(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} platform=Facebook provider=${p.providerKey} status=SUCCESS elapsedMs=${Date.now() - overallStart}`);
              return res;
            }
          }
        } else if (key.includes('fb_plugin') || key.includes('facebook') || key.includes('scraper')) {
          const res = await runFbPluginScraper(resolvedUrl || fbUrl, rawUrl, cleanUrl, requestId, signal);
          if (res) {
            console.log(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} platform=Facebook provider=${p.providerKey} status=SUCCESS elapsedMs=${Date.now() - overallStart}`);
            return res;
          }
        } else if (key.includes('cobalt') || key.includes('vkr')) {
          const res = await runCobaltVkrFb(resolvedUrl || fbUrl, rawUrl, cleanUrl, requestId, signal);
          if (res) {
            console.log(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} platform=Facebook provider=${p.providerKey} status=SUCCESS elapsedMs=${Date.now() - overallStart}`);
            return res;
          }
        } else if (key.includes('opengraph')) {
          const res = await runOpenGraphScraper(resolvedUrl || fbUrl, requestId, signal);
          if (res) {
            console.log(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} platform=Facebook provider=${p.providerKey} status=SUCCESS elapsedMs=${Date.now() - overallStart}`);
            return res;
          }
        }
      }

      // Built-in resilient fallback tiers for Facebook
      for (const u of uniqueUrls) {
        if (signal?.aborted) break;
        const ytDlpRes = await runYtDlpExtractor(u, 'Facebook', requestId, signal);
        if (ytDlpRes) return ytDlpRes;

        const btchRes = await runBtchFbExtractor(u, requestId, signal);
        if (btchRes) return btchRes;
      }

      const pluginRes = await runFbPluginScraper(resolvedUrl || fbUrl, rawUrl, cleanUrl, requestId, signal);
      if (pluginRes) return pluginRes;

      const cobaltFbRes = await runCobaltVkrFb(resolvedUrl || fbUrl, rawUrl, cleanUrl, requestId, signal);
      if (cobaltFbRes) return cobaltFbRes;

      const ogFbRes = await runOpenGraphScraper(resolvedUrl || fbUrl, requestId, signal);
      if (ogFbRes) return ogFbRes;

      console.log(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} platform=Facebook status=FAILED elapsedMs=${Date.now() - overallStart}`);
      return { status: 'FAILED', reason: 'Facebook aggressively blocked this link or all enabled Facebook providers failed.' };
    }

    if (platformKey === 'Instagram') {
      for (const p of enabledProviders) {
        if (signal?.aborted) break;
        const key = (p.providerKey || '').toLowerCase();
        if (key.includes('mirror') || key.includes('instagram') || key.includes('snapinsta') || key.includes('fastdl') || key.includes('saveig')) {
          const res = await runInstagramMirrors(cleanUrl, requestId, signal);
          if (res) {
            console.log(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} platform=Instagram provider=${p.providerKey} status=SUCCESS elapsedMs=${Date.now() - overallStart}`);
            return res;
          }
        } else if (key.includes('yt_dlp') || key.includes('ytdlp')) {
          const res = await runYtDlpExtractor(cleanUrl, 'Instagram', requestId, signal);
          if (res) {
            console.log(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} platform=Instagram provider=${p.providerKey} status=SUCCESS elapsedMs=${Date.now() - overallStart}`);
            return res;
          }
        } else if (key.includes('btch')) {
          const res = await runBtchIgExtractor(cleanUrl, requestId, signal);
          if (res) {
            console.log(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} platform=Instagram provider=${p.providerKey} status=SUCCESS elapsedMs=${Date.now() - overallStart}`);
            return res;
          }
        } else if (key.includes('cobalt')) {
          const res = await runCobaltInstagram(cleanUrl, requestId, signal);
          if (res) {
            console.log(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} platform=Instagram provider=${p.providerKey} status=SUCCESS elapsedMs=${Date.now() - overallStart}`);
            return res;
          }
        } else if (key.includes('opengraph')) {
          const res = await runOpenGraphScraper(cleanUrl, requestId, signal);
          if (res) {
            console.log(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} platform=Instagram provider=${p.providerKey} status=SUCCESS elapsedMs=${Date.now() - overallStart}`);
            return res;
          }
        }
      }

      // Built-in resilient fallback tiers for Instagram
      const mirrorRes = await runInstagramMirrors(cleanUrl, requestId, signal);
      if (mirrorRes) return mirrorRes;

      const btchIgRes = await runBtchIgExtractor(cleanUrl, requestId, signal);
      if (btchIgRes) return btchIgRes;

      const cobaltIgRes = await runCobaltInstagram(cleanUrl, requestId, signal);
      if (cobaltIgRes) return cobaltIgRes;

      const ytDlpIgRes = await runYtDlpExtractor(cleanUrl, 'Instagram', requestId, signal);
      if (ytDlpIgRes) return ytDlpIgRes;

      const ogIgRes = await runOpenGraphScraper(cleanUrl, requestId, signal);
      if (ogIgRes) return ogIgRes;

      console.log(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} platform=Instagram status=FAILED elapsedMs=${Date.now() - overallStart}`);
      return { status: 'FAILED', reason: 'All enabled Instagram providers failed.' };
    }

    if (platformKey === 'General') {
      for (const p of enabledProviders) {
        if (signal?.aborted) break;
        const key = (p.providerKey || '').toLowerCase();
        if (key.includes('yt_dlp') || key.includes('ytdlp')) {
          const res = await runYtDlpExtractor(cleanUrl, 'General', requestId, signal);
          if (res) {
            console.log(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} platform=General provider=${p.providerKey} status=SUCCESS elapsedMs=${Date.now() - overallStart}`);
            return res;
          }
        } else if (key.includes('opengraph') || key.includes('scraper')) {
          const res = await runOpenGraphScraper(cleanUrl, requestId, signal);
          if (res) {
            console.log(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} platform=General provider=${p.providerKey} status=SUCCESS elapsedMs=${Date.now() - overallStart}`);
            return res;
          }
        }
      }
      const generalYtDlp = await runYtDlpExtractor(cleanUrl, 'General', requestId, signal);
      if (generalYtDlp) return generalYtDlp;

      const generalRes = await runOpenGraphScraper(cleanUrl, requestId, signal);
      if (generalRes) return generalRes;

      console.log(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} platform=General status=FAILED elapsedMs=${Date.now() - overallStart}`);
      return { status: 'FAILED', reason: 'Direct extraction failed.' };
    }

    return { status: 'FAILED', reason: 'Direct extraction failed.' };
  } catch (error: any) {
    console.error(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} error="${error?.message || error}" elapsedMs=${Date.now() - overallStart}`);
    return { status: 'FAILED', reason: error?.message || 'Direct extraction failed.' };
  }
}
