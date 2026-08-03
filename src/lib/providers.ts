import { MediaResult, MediaFormat, PlatformSlug } from '../types';
import { PLATFORMS_CONFIG } from '../config/siteConfig';
import { addDebugLog } from './debugLogger';

export function detectPlatform(url: string): PlatformSlug {
  const cleanUrl = url.trim().toLowerCase();

  if (cleanUrl.includes('tiktok.com') || cleanUrl.includes('vt.tiktok') || cleanUrl.includes('vm.tiktok')) {
    return 'tiktok';
  }
  if (cleanUrl.includes('facebook.com/reel') || cleanUrl.includes('fb.watch/reel')) {
    return 'facebook-reels';
  }
  if (cleanUrl.includes('facebook.com') || cleanUrl.includes('fb.watch') || cleanUrl.includes('fb.com')) {
    return 'facebook';
  }
  if (cleanUrl.includes('instagram.com/reel')) {
    return 'instagram-reels';
  }
  if (cleanUrl.includes('instagram.com') || cleanUrl.includes('instagr.am')) {
    return 'instagram';
  }
  if (cleanUrl.includes('youtube.com/shorts') || cleanUrl.includes('youtu.be/shorts')) {
    return 'youtube-shorts';
  }
  if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
    return 'youtube';
  }
  if (cleanUrl.includes('snapchat.com') || cleanUrl.includes('story.snapchat')) {
    return 'snapchat';
  }
  if (cleanUrl.includes('twitter.com') || cleanUrl.includes('x.com')) {
    return 'twitter';
  }
  if (cleanUrl.includes('pinterest.com') || cleanUrl.includes('pin.it')) {
    return 'pinterest';
  }
  if (cleanUrl.includes('reddit.com') || cleanUrl.includes('v.redd.it')) {
    return 'reddit';
  }
  if (cleanUrl.includes('threads.net')) {
    return 'threads';
  }
  if (cleanUrl.includes('linkedin.com')) {
    return 'linkedin';
  }

  return 'all';
}

export function validateVideoUrl(url: string): { isValid: boolean; platform: PlatformSlug; error?: string } {
  if (!url || typeof url !== 'string') {
    return { isValid: false, platform: 'all', error: 'Please enter a video URL' };
  }

  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { isValid: false, platform: 'all', error: 'URL must start with http:// or https://' };
    }
  } catch {
    return { isValid: false, platform: 'all', error: 'Invalid URL format' };
  }

  const platform = detectPlatform(trimmed);
  return { isValid: true, platform };
}

export async function processVideoFetch(rawUrl: string): Promise<MediaResult> {
  const urlValidation = validateVideoUrl(rawUrl);
  if (!urlValidation.isValid) {
    const errorMsg = urlValidation.error || 'الرابط غير صحيح';
    addDebugLog({
      url: rawUrl,
      platform: 'unknown',
      httpStatus: 400,
      success: false,
      durationMs: 0,
      error: errorMsg,
      debugDetails: { stage: 'client_validation_failed' },
    });
    throw new Error(errorMsg);
  }

  const platform = urlValidation.platform;
  const startTime = Date.now();

  try {
    const response = await fetch('/api/fetch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: rawUrl }),
    });

    const durationMs = Date.now() - startTime;
    const resData = await response.json();

    if (!response.ok || !resData.success || !resData.data) {
      const errMsg = resData.error || 'تعذر استخراج الفيديو من هذا الرابط';
      addDebugLog({
        url: rawUrl,
        platform,
        httpStatus: response.status,
        success: false,
        durationMs,
        error: errMsg,
        debugDetails: resData.debug || resData,
        rawResponse: resData,
        requestHeaders: { 'Content-Type': 'application/json' },
      });
      throw new Error(errMsg);
    }

    addDebugLog({
      url: rawUrl,
      platform,
      httpStatus: response.status,
      success: true,
      durationMs,
      debugDetails: resData.debug || { status: 'SUCCESS', formatsCount: resData.data.formats?.length || 0 },
      rawResponse: resData,
      requestHeaders: { 'Content-Type': 'application/json' },
    });

    return resData.data;
  } catch (err: any) {
    // If error was thrown above, addDebugLog was already called. But if it was a network error:
    if (!err.message?.includes('تعذر استخراج') && err.name === 'TypeError') {
      const durationMs = Date.now() - startTime;
      addDebugLog({
        url: rawUrl,
        platform,
        httpStatus: 0,
        success: false,
        durationMs,
        error: err.message || 'Network error fetching backend API',
        debugDetails: { stage: 'network_fetch_exception' },
      });
    }
    throw err;
  }
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function extractTitleFromUrl(url: string, platformName: string): string {
  try {
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/').filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1] || 'video';

    if (lastSegment.length > 5 && !lastSegment.includes('.')) {
      const formatted = lastSegment.replace(/[-_]/g, ' ');
      return `${platformName} Trending Video: ${formatted.substring(0, 45)}`;
    }
  } catch {
    // fallback
  }
  return `${platformName} Viral Video ${new Date().toLocaleDateString()}`;
}

function cleanFilename(title: string): string {
  return title.replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '_').toLowerCase();
}
