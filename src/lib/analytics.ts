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

    // 1. Google Analytics Client Tag
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_path: pagePath,
        page_title: resolvedTitle,
      });
    }

    // 2. Real-time Local Server Telemetry
    if (typeof window !== 'undefined') {
      fetch('/api/telemetry/pageview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId: vid,
          pagePath,
          pageTitle: resolvedTitle,
        }),
      }).catch(() => {});
    }
  } catch (err) {
    // Non-blocking catch
  }
}

let heartbeatInitialized = false;

/**
 * Initialize 30-second live visitor heartbeat ping to maintain real active session metrics
 */
export function initAnalyticsHeartbeat(): void {
  if (typeof window === 'undefined' || heartbeatInitialized) return;
  heartbeatInitialized = true;

  const sendHeartbeat = () => {
    try {
      const pagePath = window.location.pathname;
      if (pagePath.toLowerCase().includes('/admin')) return;
      const vid = getOrCreateVisitorId();
      fetch('/api/telemetry/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId: vid,
          pagePath,
        }),
      }).catch(() => {});
    } catch {}
  };

  sendHeartbeat();
  setInterval(sendHeartbeat, 30000);
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

export interface AdTelemetryParams {
  provider: string; // e.g. 'monetag', 'adsterra', 'adsense'
  slotId: string;
  format?: string;
  zoneId?: string;
  pagePath?: string;
}

/**
 * Tracks an ad impression event in GA4 and the local PostgreSQL telemetry engine
 */
export function trackAdImpression(params: AdTelemetryParams): void {
  try {
    if (typeof window === 'undefined') return;
    const provider = (params.provider || 'monetag').toLowerCase();
    const slotId = params.slotId || 'unknown_slot';
    const format = params.format || 'multitag';
    const zoneId = params.zoneId || '295812';
    const pagePath = params.pagePath || window.location.pathname;
    const vid = getOrCreateVisitorId();

    // 1. Google Analytics Event
    trackGaEvent(`${provider}_ad_impression`, {
      ad_provider: provider,
      ad_slot: slotId,
      ad_format: format,
      ad_zone: zoneId,
      page_path: pagePath,
    });

    // 2. Local Telemetry Engine
    fetch('/api/telemetry/ad-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'IMPRESSION',
        provider,
        slotId,
        format,
        zoneId,
        pagePath,
        visitorId: vid,
      }),
    }).catch(() => {});
  } catch (err) {
    // Non-blocking catch
  }
}

/**
 * Tracks an ad click or CTA interaction event in GA4 and the local telemetry engine
 */
export function trackAdClick(params: AdTelemetryParams): void {
  try {
    if (typeof window === 'undefined') return;
    const provider = (params.provider || 'monetag').toLowerCase();
    const slotId = params.slotId || 'unknown_slot';
    const format = params.format || 'multitag';
    const zoneId = params.zoneId || '295812';
    const pagePath = params.pagePath || window.location.pathname;
    const vid = getOrCreateVisitorId();

    // 1. Google Analytics Event
    trackGaEvent(`${provider}_ad_click`, {
      ad_provider: provider,
      ad_slot: slotId,
      ad_format: format,
      ad_zone: zoneId,
      page_path: pagePath,
    });

    // 2. Local Telemetry Engine
    fetch('/api/telemetry/ad-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'CLICK',
        provider,
        slotId,
        format,
        zoneId,
        pagePath,
        visitorId: vid,
      }),
    }).catch(() => {});
  } catch (err) {
    // Non-blocking catch
  }
}

