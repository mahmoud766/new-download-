declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

export const GA_MEASUREMENT_ID = 'G-2NBYGQ5V6E';

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
 * Strictly excludes Admin dashboard views and sensitive route parameters.
 */
export function trackPageView(pagePath: string, pageTitle?: string): void {
  try {
    if (!pagePath || pagePath.toLowerCase().includes('/admin')) {
      return;
    }
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_path: pagePath,
        page_title: pageTitle || (typeof document !== 'undefined' ? document.title : 'OmniFetch Pro'),
      });
    }
  } catch (err) {
    // Non-blocking catch
  }
}

/**
 * Safe custom events with non-sensitive aggregate parameters ONLY.
 * NEVER sends URLs, query strings, user emails, IP addresses, or requestIds.
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
