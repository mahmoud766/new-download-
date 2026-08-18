import fs from 'fs';
import path from 'path';
import ytdl from '@distube/ytdl-core';
import { recordTelemetry } from './telemetry';
import { prisma } from '../src/lib/prisma';

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
  { providerKey: 'tikwm_api', name: 'TikWM API', type: 'Extractor Engine', platform: 'TikTok', enabled: true, priority: 1 },
  { providerKey: 'cobalt_tiktok', name: 'Cobalt TikTok API', type: 'External Engine', platform: 'TikTok', enabled: true, priority: 2 },
  { providerKey: 'ytdl_core', name: 'ytdl-core', type: 'Node Native', platform: 'YouTube', enabled: true, priority: 1 },
  { providerKey: 'loader_to', name: 'Loader.to CDN', type: 'CDN Conversion', platform: 'YouTube', enabled: true, priority: 2 },
  { providerKey: 'cobalt_api', name: 'Cobalt API', type: 'External Engine', platform: 'YouTube', enabled: true, priority: 3 },
  { providerKey: 'instagram_mirrors', name: 'Instagram Mirrors', type: 'HTML Mirror Scraper', platform: 'Instagram', enabled: true, priority: 1 },
  { providerKey: 'fb_plugin', name: 'FB Plugin Scraper', type: 'Facebook Scraper', platform: 'Facebook', enabled: true, priority: 1 },
  { providerKey: 'cobalt_vkr_fb', name: 'Cobalt / VKR API', type: 'External Engine', platform: 'Facebook', enabled: true, priority: 2 },
  { providerKey: 'opengraph', name: 'OpenGraph Scraper', type: 'Metadata Scraper', platform: 'General', enabled: true, priority: 1 },
];

/**
 * Authoritative provider configuration lookup from Supabase PostgreSQL.
 * Case 1: Database available + ProviderSetting records exist -> return database providers.
 * Case 2: Database available + table empty -> use INITIAL_SEED_PROVIDERS as operational fallback (no mutation on read).
 * Case 3: Database unavailable -> use INITIAL_SEED_PROVIDERS as temporary resilience fallback with a clear warning (no mutation, no suppression).
 */
export async function getProviderSettingsFromDb(): Promise<any[]> {
  try {
    const dbProviders = await prisma.providerSetting.findMany({
      orderBy: { priority: 'asc' },
    });

    if (dbProviders && dbProviders.length > 0) {
      return dbProviders;
    }

    // Table is empty in database -> operational fallback without mutating database
    return INITIAL_SEED_PROVIDERS;
  } catch (err: any) {
    console.warn('[Provider DB Warning] Database query failed for ProviderSetting lookup, utilizing operational provider config for extraction resilience:', err?.message || err);
    return INITIAL_SEED_PROVIDERS;
  }
}

// Helper to resolve Facebook share/redirect links to canonical URL
async function resolveFacebookUrl(inputUrl: string, signal?: AbortSignal): Promise<string> {
  let fbUrl = inputUrl;
  if (fbUrl.includes('?mibextid=')) fbUrl = fbUrl.split('?mibextid=')[0];
  if (fbUrl.includes('?share_id=')) fbUrl = fbUrl.split('?share_id=')[0];
  if (fbUrl.includes('&mibextid=')) fbUrl = fbUrl.split('&mibextid=')[0];
  if (fbUrl.includes('?rdid=')) fbUrl = fbUrl.split('?rdid=')[0];

  if (fbUrl.includes('/share/') || fbUrl.includes('fb.watch') || fbUrl.includes('fb.gg') || fbUrl.includes('m.facebook.com')) {
    try {
      const res = await fetchWithTimeout(fbUrl, {
        headers: {
          'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'follow',
      }, 5000, signal);

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
    const dbProviders = await getProviderSettingsFromDb();

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
    const enabledProviders = dbProviders
      .filter((p) => p.platform.toLowerCase() === platformKey.toLowerCase() && Boolean(p.enabled))
      .sort((a, b) => Number(a.priority) - Number(b.priority));

    console.log(`[FETCH_PROVIDER_SELECTED] requestId=${requestId} platform=${platformKey} enabledProvidersCount=${enabledProviders.length}`);

    if (enabledProviders.length === 0) {
      return {
        status: 'FAILED',
        reason: 'NO_ENABLED_PROVIDERS',
        httpStatus: 503,
      };
    }

    // Execute enabled providers in order of priority
    if (platformKey === 'TikTok') {
      for (const p of enabledProviders) {
        if (signal?.aborted) break;
        if (p.providerKey === 'tikwm_api') {
          const res = await runTikWmApi(cleanUrl, requestId, signal);
          if (res) {
            console.log(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} platform=TikTok provider=${p.providerKey} status=SUCCESS elapsedMs=${Date.now() - overallStart}`);
            return res;
          }
        } else if (p.providerKey === 'cobalt_tiktok') {
          const res = await runCobaltTikTok(cleanUrl, requestId, signal);
          if (res) {
            console.log(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} platform=TikTok provider=${p.providerKey} status=SUCCESS elapsedMs=${Date.now() - overallStart}`);
            return res;
          }
        } else if (p.providerKey === 'opengraph') {
          const res = await runOpenGraphScraper(cleanUrl, requestId, signal);
          if (res) {
            console.log(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} platform=TikTok provider=${p.providerKey} status=SUCCESS elapsedMs=${Date.now() - overallStart}`);
            return res;
          }
        }
      }
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
        if (p.providerKey === 'ytdl_core') {
          const res = await runYtdlCore(ytUrl, fallbackTitle, fallbackThumb, requestId, signal);
          if (res) {
            console.log(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} platform=YouTube provider=${p.providerKey} status=SUCCESS elapsedMs=${Date.now() - overallStart}`);
            return res;
          }
        } else if (p.providerKey === 'loader_to') {
          const res = await runLoaderTo(ytUrl, fallbackTitle, fallbackThumb, requestId, signal);
          if (res) {
            console.log(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} platform=YouTube provider=${p.providerKey} status=SUCCESS elapsedMs=${Date.now() - overallStart}`);
            return res;
          }
        } else if (p.providerKey === 'cobalt_api') {
          const res = await runCobaltApi(ytUrl, fallbackTitle, fallbackThumb, requestId, signal);
          if (res) {
            console.log(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} platform=YouTube provider=${p.providerKey} status=SUCCESS elapsedMs=${Date.now() - overallStart}`);
            return res;
          }
        } else if (p.providerKey === 'opengraph') {
          const res = await runOpenGraphScraper(ytUrl, requestId, signal);
          if (res) {
            console.log(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} platform=YouTube provider=${p.providerKey} status=SUCCESS elapsedMs=${Date.now() - overallStart}`);
            return res;
          }
        }
      }
      console.log(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} platform=YouTube status=FAILED elapsedMs=${Date.now() - overallStart}`);
      return { status: 'FAILED', reason: 'All enabled YouTube providers failed to extract media.' };
    }

    if (platformKey === 'Facebook') {
      let fbUrl = cleanUrl;
      if (fbUrl.includes('/share/') || fbUrl.includes('fb.watch') || fbUrl.includes('fb.gg')) {
        try {
          fbUrl = await resolveFacebookUrl(fbUrl, signal);
          fbUrl = fbUrl.split('?')[0];
        } catch (e) {}
      }

      for (const p of enabledProviders) {
        if (signal?.aborted) break;
        if (p.providerKey === 'fb_plugin') {
          const res = await runFbPluginScraper(fbUrl, rawUrl, cleanUrl, requestId, signal);
          if (res) {
            console.log(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} platform=Facebook provider=${p.providerKey} status=SUCCESS elapsedMs=${Date.now() - overallStart}`);
            return res;
          }
        } else if (p.providerKey === 'cobalt_vkr_fb') {
          const res = await runCobaltVkrFb(fbUrl, rawUrl, cleanUrl, requestId, signal);
          if (res) {
            console.log(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} platform=Facebook provider=${p.providerKey} status=SUCCESS elapsedMs=${Date.now() - overallStart}`);
            return res;
          }
        } else if (p.providerKey === 'opengraph') {
          const res = await runOpenGraphScraper(fbUrl, requestId, signal);
          if (res) {
            console.log(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} platform=Facebook provider=${p.providerKey} status=SUCCESS elapsedMs=${Date.now() - overallStart}`);
            return res;
          }
        }
      }
      console.log(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} platform=Facebook status=FAILED elapsedMs=${Date.now() - overallStart}`);
      return { status: 'FAILED', reason: 'Facebook aggressively blocked this link or all enabled Facebook providers failed.' };
    }

    if (platformKey === 'Instagram') {
      for (const p of enabledProviders) {
        if (signal?.aborted) break;
        if (p.providerKey === 'instagram_mirrors') {
          const res = await runInstagramMirrors(cleanUrl, requestId, signal);
          if (res) {
            console.log(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} platform=Instagram provider=${p.providerKey} status=SUCCESS elapsedMs=${Date.now() - overallStart}`);
            return res;
          }
        } else if (p.providerKey === 'opengraph') {
          const res = await runOpenGraphScraper(cleanUrl, requestId, signal);
          if (res) {
            console.log(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} platform=Instagram provider=${p.providerKey} status=SUCCESS elapsedMs=${Date.now() - overallStart}`);
            return res;
          }
        }
      }
      console.log(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} platform=Instagram status=FAILED elapsedMs=${Date.now() - overallStart}`);
      return { status: 'FAILED', reason: 'All enabled Instagram providers failed.' };
    }

    if (platformKey === 'General') {
      for (const p of enabledProviders) {
        if (signal?.aborted) break;
        if (p.providerKey === 'opengraph') {
          const res = await runOpenGraphScraper(cleanUrl, requestId, signal);
          if (res) {
            console.log(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} platform=General provider=${p.providerKey} status=SUCCESS elapsedMs=${Date.now() - overallStart}`);
            return res;
          }
        }
      }
      console.log(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} platform=General status=FAILED elapsedMs=${Date.now() - overallStart}`);
      return { status: 'FAILED', reason: 'Direct extraction failed.' };
    }

    return { status: 'FAILED', reason: 'Direct extraction failed.' };
  } catch (error: any) {
    console.error(`[FETCH_EXTRACTION_COMPLETE] requestId=${requestId} error="${error?.message || error}" elapsedMs=${Date.now() - overallStart}`);
    return { status: 'FAILED', reason: error?.message || 'Direct extraction failed.' };
  }
}
