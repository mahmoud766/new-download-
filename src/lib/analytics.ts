declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

export const GA_MEASUREMENT_ID = 'G-2NBYGQ5V6E';

/**
 * Get or create persistent anonymous visitor ID in localStorage
 */
export function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return 'server_id';
  try {
    let vid = localStorage.getItem('omni_visitor_id');
    if (!vid) {
      vid = 'vid_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      localStorage.setItem('omni_visitor_id', vid);
    }
    return vid;
  } catch {
    return 'temp_vid_' + Date.now();
  }
}

/**
 * Safely invoke GA4 gtag function.
 * Guaranteed to never throw or break application logic if GA script is blocked or unavailable.
 */
export function trackGaEvent(eventName: string, params?: Record<string, any>): void {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', eventName, params);
    }
  } catch (err) {
    // Non-blocking error safety
  }
}

/**
 * Get client device and browser information
 */
export function getClientEnvironmentInfo() {
  if (typeof window === 'undefined') {
    return {
      deviceType: 'Desktop',
      browser: 'Unknown',
      referrer: '',
      language: 'ar',
      screenWidth: 1920,
    };
  }

  const ua = navigator.userAgent || '';
  let deviceType = 'Desktop';
  if (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    deviceType = 'Mobile';
  } else if (/iPad|Tablet/i.test(ua) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /Macintosh/.test(ua))) {
    deviceType = 'Tablet';
  }

  let browser = 'Chrome';
  if (ua.includes('Firefox/')) {
    browser = 'Firefox';
  } else if (ua.includes('Edg/')) {
    browser = 'Edge';
  } else if (ua.includes('Safari/') && !ua.includes('Chrome/')) {
    browser = 'Safari';
  } else if (ua.includes('OPR/') || ua.includes('Opera/')) {
    browser = 'Opera';
  }

  let referrer = '';
  try {
    referrer = document.referrer ? new URL(document.referrer).hostname : 'Direct';
  } catch {
    referrer = document.referrer || 'Direct';
  }

  return {
    deviceType,
    browser,
    referrer: referrer || 'Direct',
    language: navigator.language || 'ar',
    screenWidth: window.innerWidth || screen.width || 1200,
  };
}

/**
 * Track SPA route changes for public website views.
 * Sends event to GA4 gtag if available AND posts live pageview telemetry to local server.
 */
export function trackPageView(pagePath: string, pageTitle?: string): void {
  try {
    if (!pagePath || pagePath.toLowerCase().includes('/admin')) {
      return;
    }
    const resolvedTitle = pageTitle || (typeof document !== 'undefined' ? document.title : 'OmniFetch Pro');
    const vid = getOrCreateVisitorId();
    const envInfo = getClientEnvironmentInfo();

    // 1. Google Analytics Client Tag
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_path: pagePath,
        page_title: resolvedTitle,
      });
    }

    // 2. Real-time Local Server Telemetry with real user details
    if (typeof window !== 'undefined') {
      fetch('/api/telemetry/pageview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId: vid,
          pagePath,
          pageTitle: resolvedTitle,
          referrer: envInfo.referrer,
          deviceType: envInfo.deviceType,
          browser: envInfo.browser,
          screenWidth: envInfo.screenWidth,
          language: envInfo.language,
        }),
      }).catch(() => {});
    }
  } catch (err) {
    // Non-blocking catch
  }
}

let heartbeatInitialized = false;

/**
 * Initialize 20-second live visitor heartbeat ping to maintain real active session metrics
 */
export function initAnalyticsHeartbeat(): void {
  if (typeof window === 'undefined' || heartbeatInitialized) return;
  heartbeatInitialized = true;

  const sendHeartbeat = () => {
    try {
      const pagePath = window.location.pathname;
      if (pagePath.toLowerCase().includes('/admin')) return;
      const vid = getOrCreateVisitorId();
      const envInfo = getClientEnvironmentInfo();
      fetch('/api/telemetry/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId: vid,
          pagePath,
          deviceType: envInfo.deviceType,
          browser: envInfo.browser,
        }),
      }).catch(() => {});
    } catch {}
  };

  sendHeartbeat();
  setInterval(sendHeartbeat, 20000);
}

/**
 * Safe custom events with non-sensitive aggregate parameters ONLY.
 */
export function trackDownloadAttempt(platform?: string): void {
  trackGaEvent('video_download_attempt', {
    platform: (platform || 'unknown').toLowerCase(),
  });
}

export function trackDownloadSuccess(platform?: string, provider?: string): void {
  trackGaEvent('video_download_success', {
    platform: (platform || 'unknown').toLowerCase(),
    provider: (provider || 'default').toLowerCase(),
  });
}

export function trackDownloadFailure(platform?: string): void {
  trackGaEvent('video_download_failure', {
    platform: (platform || 'unknown').toLowerCase(),
  });
}

