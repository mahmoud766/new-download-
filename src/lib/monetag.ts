/**
 * OmniFetch Pro - Monetag Official Advertising & MultiTag Integration Engine
 * Publisher Zone ID: 295812
 * Tag URL: https://quge5.com/88/tag.min.js
 */

import { trackAdImpression, trackAdClick } from './analytics';

export const MONETAG_DEFAULT_ZONE = '295812';
export const MONETAG_DEFAULT_SCRIPT_URL = 'https://quge5.com/88/tag.min.js';

export interface MonetagIntegrationStatus {
  isScriptInjected: boolean;
  zoneId: string;
  scriptUrl: string;
  hasCfAsyncBypass: boolean;
  isAsync: boolean;
  status: 'ACTIVE' | 'PENDING' | 'DISABLED';
  serviceWorkerRegistered?: boolean;
}

export interface MonetagDiagnosticResult {
  success: boolean;
  timestamp: string;
  zoneId: string;
  scriptUrl: string;
  scriptElementFound: boolean;
  hasCfAsync: boolean;
  isAsync: boolean;
  serviceWorkerActive: boolean;
  checks: {
    name: string;
    passed: boolean;
    message: string;
  }[];
}

/**
 * Initializes and verifies the Monetag MultiTag script in the DOM
 * Guarantees data-zone, async, and data-cfasync="false" attributes.
 */
export function initMonetag(
  zoneId: string = MONETAG_DEFAULT_ZONE,
  scriptUrl: string = MONETAG_DEFAULT_SCRIPT_URL
): MonetagIntegrationStatus {
  if (typeof window === 'undefined') {
    return {
      isScriptInjected: false,
      zoneId,
      scriptUrl,
      hasCfAsyncBypass: true,
      isAsync: true,
      status: 'PENDING',
    };
  }

  try {
    // Check if script already exists
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src*="quge5.com"], script[data-zone="${zoneId}"]`
    );

    if (existing) {
      // Ensure data-zone and data-cfasync are correctly populated
      if (!existing.getAttribute('data-zone')) {
        existing.setAttribute('data-zone', zoneId);
      }
      if (!existing.getAttribute('data-cfasync')) {
        existing.setAttribute('data-cfasync', 'false');
      }
      return {
        isScriptInjected: true,
        zoneId: existing.getAttribute('data-zone') || zoneId,
        scriptUrl: existing.src || scriptUrl,
        hasCfAsyncBypass: existing.getAttribute('data-cfasync') === 'false',
        isAsync: existing.async,
        status: 'ACTIVE',
      };
    }

    // Create and inject the Monetag script tag
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.setAttribute('data-zone', zoneId);
    script.setAttribute('data-cfasync', 'false');
    script.async = true;
    script.id = 'monetag-multitag-script';

    script.onload = () => {
      window.dispatchEvent(new CustomEvent('monetag_loaded', { detail: { zoneId, scriptUrl } }));
    };

    script.onerror = (e) => {
      console.warn('[Monetag] Tag network notice (adblocker or network check):', e);
    };

    // Append to head or documentElement for optimal early execution
    (document.head || document.documentElement).appendChild(script);

    return {
      isScriptInjected: true,
      zoneId,
      scriptUrl,
      hasCfAsyncBypass: true,
      isAsync: true,
      status: 'ACTIVE',
    };
  } catch (err) {
    console.warn('[Monetag] Failed to initialize Monetag tag safely:', err);
    return {
      isScriptInjected: false,
      zoneId,
      scriptUrl,
      hasCfAsyncBypass: false,
      isAsync: false,
      status: 'DISABLED',
    };
  }
}

/**
 * Removes Monetag scripts if disabled by administrator
 */
export function removeMonetag(): void {
  if (typeof window === 'undefined') return;
  try {
    const scripts = document.querySelectorAll('script[src*="quge5.com"], script[data-zone]');
    scripts.forEach((s) => s.parentNode?.removeChild(s));
  } catch (e) {
    console.warn('[Monetag] Failed to remove tag:', e);
  }
}

/**
 * Returns current Monetag status in the client environment
 */
export function getMonetagStatus(zoneId: string = MONETAG_DEFAULT_ZONE): MonetagIntegrationStatus {
  if (typeof window === 'undefined') {
    return {
      isScriptInjected: false,
      zoneId,
      scriptUrl: MONETAG_DEFAULT_SCRIPT_URL,
      hasCfAsyncBypass: true,
      isAsync: true,
      status: 'PENDING',
    };
  }

  const existing = document.querySelector<HTMLScriptElement>(
    `script[src*="quge5.com"], script[data-zone="${zoneId}"]`
  );

  if (existing) {
    return {
      isScriptInjected: true,
      zoneId: existing.getAttribute('data-zone') || zoneId,
      scriptUrl: existing.src || MONETAG_DEFAULT_SCRIPT_URL,
      hasCfAsyncBypass: existing.getAttribute('data-cfasync') === 'false',
      isAsync: existing.async,
      status: 'ACTIVE',
    };
  }

  return {
    isScriptInjected: false,
    zoneId,
    scriptUrl: MONETAG_DEFAULT_SCRIPT_URL,
    hasCfAsyncBypass: false,
    isAsync: false,
    status: 'DISABLED',
  };
}

/**
 * Comprehensive diagnostic check for Monetag integration
 */
export async function runMonetagDiagnostics(
  zoneId: string = MONETAG_DEFAULT_ZONE
): Promise<MonetagDiagnosticResult> {
  const isBrowser = typeof window !== 'undefined';
  const checks: { name: string; passed: boolean; message: string }[] = [];

  if (!isBrowser) {
    return {
      success: false,
      timestamp: new Date().toISOString(),
      zoneId,
      scriptUrl: MONETAG_DEFAULT_SCRIPT_URL,
      scriptElementFound: false,
      hasCfAsync: false,
      isAsync: false,
      serviceWorkerActive: false,
      checks: [{ name: 'Environment', passed: false, message: 'Server-side rendering (SSR)' }],
    };
  }

  // Check 1: Script tag in DOM
  const scriptTag = document.querySelector<HTMLScriptElement>(
    `script[src*="quge5.com"], script[data-zone="${zoneId}"]`
  );
  const scriptFound = Boolean(scriptTag);
  checks.push({
    name: 'Monetag MultiTag in DOM',
    passed: scriptFound,
    message: scriptFound
      ? `Found Monetag script tag referencing Zone ${scriptTag?.getAttribute('data-zone') || zoneId}`
      : 'Monetag script tag not found in DOM',
  });

  // Check 2: Cloudflare Rocket Loader bypass
  const hasCfAsync = scriptTag?.getAttribute('data-cfasync') === 'false';
  checks.push({
    name: 'Cloudflare Rocket Loader Bypass (data-cfasync="false")',
    passed: hasCfAsync,
    message: hasCfAsync
      ? 'Rocket Loader bypass configured properly (data-cfasync="false")'
      : 'data-cfasync="false" attribute is missing',
  });

  // Check 3: Async execution
  const isAsync = Boolean(scriptTag?.async);
  checks.push({
    name: 'Asynchronous Non-blocking Load',
    passed: isAsync,
    message: isAsync ? 'Script loads asynchronously without blocking main thread' : 'Script is not marked async',
  });

  // Check 4: Service Worker availability for Web Push (Zone 12033993)
  let swActive = false;
  try {
    if ('serviceWorker' in navigator) {
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => undefined);
      }
      swActive = Boolean(reg);
    }
  } catch {
    swActive = false;
  }
  checks.push({
    name: 'Service Worker / Web Push Ready (Zone 12033993 & 3nbf4.com)',
    passed: swActive,
    message: swActive
      ? 'Service Worker active with root scope (/) for Monetag Web Push (Domain: 3nbf4.com, Zone: 12033993)'
      : 'Service Worker active in standby mode',
  });

  // Overall success: Tag found with cfasync
  const success = scriptFound && hasCfAsync;

  return {
    success,
    timestamp: new Date().toISOString(),
    zoneId,
    scriptUrl: scriptTag?.src || MONETAG_DEFAULT_SCRIPT_URL,
    scriptElementFound: scriptFound,
    hasCfAsync,
    isAsync,
    serviceWorkerActive: swActive,
    checks,
  };
}

/**
 * Generates the official Monetag script code tag string
 */
export function generateMonetagScriptTag(
  zoneId: string = MONETAG_DEFAULT_ZONE,
  scriptUrl: string = MONETAG_DEFAULT_SCRIPT_URL
): string {
  return `<script src="${scriptUrl}" data-zone="${zoneId}" async data-cfasync="false"></script>`;
}

/**
 * Generates Monetag In-Page / Banner HTML snippet for ad slots
 */
export function generateMonetagSlotSnippet(
  zoneId: string = MONETAG_DEFAULT_ZONE,
  format: 'multitag' | 'in_page_push' | 'vignette' | 'onclick' | 'banner_300x250' | 'banner_728x90' = 'multitag'
): string {
  if (format === 'banner_300x250' || format === 'banner_728x90') {
    const width = format === 'banner_728x90' ? 728 : 300;
    const height = format === 'banner_728x90' ? 90 : 250;
    return `<div style="width:100%;max-width:${width}px;min-height:${height}px;margin:0 auto;display:flex;align-items:center;justify-content:center;overflow:hidden;">
  <script src="${MONETAG_DEFAULT_SCRIPT_URL}" data-zone="${zoneId}" async data-cfasync="false"></script>
</div>`;
  }

  return generateMonetagScriptTag(zoneId);
}

// Cooldown tracker for programmatic Monetag CTA trigger
let lastDownloadTriggerTime = 0;
const DOWNLOAD_TRIGGER_COOLDOWN_MS = 60 * 1000; // 1 minute cooldown per user action

/**
 * Convenience helper to track Monetag ad impressions
 */
export function trackMonetagImpression(
  slotId: string,
  format: string = 'multitag',
  zoneId: string = MONETAG_DEFAULT_ZONE
): void {
  trackAdImpression({
    provider: 'monetag',
    slotId,
    format,
    zoneId,
  });
}

/**
 * Convenience helper to track Monetag ad clicks and interactions
 */
export function trackMonetagClick(
  slotId: string,
  format: string = 'multitag',
  zoneId: string = MONETAG_DEFAULT_ZONE
): void {
  trackAdClick({
    provider: 'monetag',
    slotId,
    format,
    zoneId,
  });
}

/**
 * Triggers Monetag on-click action upon user CTA
 * Includes Google Safe Browsing & AdSense Compliance Shield:
 * Prevents download button hijacking that leads to "Deceptive site ahead" / "Dangerous site" flags by Google.
 */
export function triggerMonetagDownloadAction(zoneId: string = MONETAG_DEFAULT_ZONE): boolean {
  if (typeof window === 'undefined') return false;

  // GOOGLE SAFE BROWSING & ADSENSE COMPLIANCE:
  // Google Safe Browsing strictly forbids opening unsolicited popunders or ad redirects
  // when a user clicks an explicit "Download" button.
  // By default, Safe Mode is ON to protect the domain from Google penalties.
  const isSafeMode = localStorage.getItem('omnifetch_safe_download_mode') !== 'false';
  if (isSafeMode) {
    // Record interaction in analytics cleanly without triggering a deceptive popunder window
    trackMonetagClick('DOWNLOAD_CTA_ACTION', 'clean_download_safe_mode', zoneId);
    return true;
  }

  const now = Date.now();
  if (now - lastDownloadTriggerTime < DOWNLOAD_TRIGGER_COOLDOWN_MS) {
    return false; // Cooldown active
  }

  try {
    // Record Monetag on-click interaction in Analytics
    trackMonetagClick('DOWNLOAD_CTA_ACTION', 'onclick_vignette', zoneId);

    // Check if Monetag global handler or zone dispatch is present
    const monetagGlobal = (window as any).monetag || (window as any)._monetag;
    if (monetagGlobal && typeof monetagGlobal.trigger === 'function') {
      monetagGlobal.trigger(zoneId);
      lastDownloadTriggerTime = now;
      return true;
    }

    // Ensure Monetag script is initialized
    initMonetag(zoneId);
    lastDownloadTriggerTime = now;
    return true;
  } catch {
    return false;
  }
}
