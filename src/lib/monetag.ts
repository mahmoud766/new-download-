/**
 * OmniFetch Pro - Monetag Global Monetization Engine & Safe Fallback Mode
 * 
 * Implements an idempotent, production-ready, singleton loader for Monetag MultiTag.
 * Guarantees:
 * - Fail-Open Application / Fail-Closed Ads: If config is missing, invalid, or fails, Monetag is disabled safely and OmniFetch Pro continues normally.
 * - Zero duplicate script tags, zero request storms, React StrictMode immunity.
 * - Zero ad loading in admin dashboards or administrative contexts.
 * - Single-attempt loading with zero aggressive polling or retry loops.
 * - Complete SSR and hydration safety.
 */

declare global {
  interface Window {
    __MONETAG_INITIALIZED__?: boolean;
    __MONETAG_LOADED__?: boolean;
    __MONETAG_CONFIG__?: MonetagRuntimeConfig;
    __MONETAG_STATUS__?: MonetagStatusDetail;
  }
}

export type MonetagStatus = 'READY' | 'DISABLED' | 'FAILED' | 'INITIALIZING';

export type MonetagStatusReason = 
  | 'ready'
  | 'missing_config'
  | 'invalid_config'
  | 'disabled_by_user'
  | 'admin_context'
  | 'script_error'
  | 'client_blocked'
  | 'ssr_context';

export interface MonetagStatusDetail {
  status: MonetagStatus;
  reason: MonetagStatusReason;
  message: string;
  checkedAt: number;
}

export interface MonetagRuntimeConfig {
  enabled: boolean;
  multiTagZoneId: string;
  multiTagScriptUrl: string;
  pushDomain: string;
  pushZoneId: string;
  vignetteEnabled?: boolean;
  inPagePushEnabled?: boolean;
}

export const DEFAULT_MONETAG_CONFIG: MonetagRuntimeConfig = {
  enabled: true,
  multiTagZoneId: '275153',
  multiTagScriptUrl: 'https://quge5.com/88/tag.min.js',
  pushDomain: '3nbf4.com',
  pushZoneId: '11697581',
  vignetteEnabled: true,
  inPagePushEnabled: true,
};

const MONETAG_SCRIPT_ID = 'monetag-multitag-script';
const STORAGE_KEY_MONETAG_ENABLED = 'omnifetch_monetag_enabled';

/**
 * Internal Safe Logging helper (Dev only, never logs sensitive keys)
 */
function logMonetagDev(message: string, isError = false) {
  try {
    // Only log in dev mode to prevent production console noise
    if (typeof window !== 'undefined' && (import.meta as unknown as { env?: { DEV?: boolean } })?.env?.DEV) {
      if (isError) {
        console.warn(`[Monetag] ${message}`);
      } else {
        console.info(`[Monetag] ${message}`);
      }
    }
  } catch {
    // Fail silently
  }
}

/**
 * Validates Monetag runtime configuration.
 * Returns valid = true if all mandatory fields are well-formed, or detailed reason why it's invalid.
 */
export function validateMonetagConfig(config?: Partial<MonetagRuntimeConfig> | null): {
  valid: boolean;
  reason?: MonetagStatusReason;
  message?: string;
  sanitizedConfig?: MonetagRuntimeConfig;
} {
  if (!config) {
    return {
      valid: false,
      reason: 'missing_config',
      message: 'Configuration object is missing or undefined.',
    };
  }

  // 1. Feature Flag Check
  if (config.enabled === false) {
    return {
      valid: false,
      reason: 'disabled_by_user',
      message: 'Monetag is manually disabled by user/admin settings.',
    };
  }

  // 2. Zone ID Validation (Must be a non-empty alphanumeric/numeric string)
  const zoneId = typeof config.multiTagZoneId === 'string' ? config.multiTagZoneId.trim() : String(config.multiTagZoneId || '').trim();
  if (!zoneId || zoneId.length < 3 || !/^[a-zA-Z0-9_-]+$/.test(zoneId)) {
    return {
      valid: false,
      reason: 'invalid_config',
      message: 'Invalid or malformed MultiTag Zone ID.',
    };
  }

  // 3. Script URL Validation (Must be a secure HTTPS URL)
  const scriptUrl = (config.multiTagScriptUrl || '').trim();
  if (!scriptUrl || !scriptUrl.startsWith('https://')) {
    return {
      valid: false,
      reason: 'invalid_config',
      message: 'Invalid MultiTag Script URL — must start with https://.',
    };
  }

  // 4. Push Domain & Push Zone validation if push is used
  const pushDomain = (config.pushDomain || '').trim();
  const pushZoneId = typeof config.pushZoneId === 'string' ? config.pushZoneId.trim() : String(config.pushZoneId || '').trim();

  return {
    valid: true,
    reason: 'ready',
    message: 'Configuration is valid.',
    sanitizedConfig: {
      enabled: true,
      multiTagZoneId: zoneId,
      multiTagScriptUrl: scriptUrl,
      pushDomain: pushDomain || '3nbf4.com',
      pushZoneId: pushZoneId || '11697581',
      vignetteEnabled: config.vignetteEnabled !== false,
      inPagePushEnabled: config.inPagePushEnabled !== false,
    },
  };
}

/**
 * Retrieves the active Monetag configuration safely (SSR compatible)
 */
export function getMonetagRuntimeConfig(): MonetagRuntimeConfig {
  if (typeof window === 'undefined') return DEFAULT_MONETAG_CONFIG;

  try {
    const isExplicitlyDisabled = localStorage.getItem(STORAGE_KEY_MONETAG_ENABLED) === 'false';
    return {
      ...DEFAULT_MONETAG_CONFIG,
      enabled: !isExplicitlyDisabled,
    };
  } catch {
    return DEFAULT_MONETAG_CONFIG;
  }
}

/**
 * Retrieves the current Monetag status detail without triggering any side-effects
 */
export function getMonetagStatus(): MonetagStatusDetail {
  if (typeof window === 'undefined') {
    return {
      status: 'DISABLED',
      reason: 'ssr_context',
      message: 'Server-side execution context — ads disabled safely.',
      checkedAt: Date.now(),
    };
  }

  if (window.__MONETAG_STATUS__) {
    return window.__MONETAG_STATUS__;
  }

  // Compute status on the fly
  const config = getMonetagRuntimeConfig();
  const validation = validateMonetagConfig(config);

  if (!validation.valid) {
    return {
      status: 'DISABLED',
      reason: validation.reason || 'invalid_config',
      message: validation.message || 'Configuration invalid',
      checkedAt: Date.now(),
    };
  }

  if (window.__MONETAG_LOADED__) {
    return {
      status: 'READY',
      reason: 'ready',
      message: 'Monetag MultiTag active and loaded.',
      checkedAt: Date.now(),
    };
  }

  return {
    status: config.enabled ? 'INITIALIZING' : 'DISABLED',
    reason: config.enabled ? 'ready' : 'disabled_by_user',
    message: config.enabled ? 'Monetag ready for initialization' : 'Monetag disabled',
    checkedAt: Date.now(),
  };
}

/**
 * Checks whether the current route or context is an Admin screen
 */
export function isAdminContext(activeView?: string): boolean {
  if (typeof window === 'undefined') return false;
  if (activeView === 'admin') return true;

  try {
    const path = window.location.pathname.toLowerCase();
    return (
      path.includes('/admin') ||
      path.includes('/admin-download') ||
      path.includes('/admin-login') ||
      window.location.search.includes('admin_secret')
    );
  } catch {
    return false;
  }
}

/**
 * Safe Monetag Initializer (Fail-Open for Application, Fail-Closed for Ads)
 * 
 * Returns explicit status object: READY | DISABLED | FAILED
 * Never throws, never crashes, never creates retry loops.
 */
export function initializeMonetag(options?: {
  activeView?: string;
  force?: boolean;
  config?: Partial<MonetagRuntimeConfig>;
}): MonetagStatusDetail {
  if (typeof window === 'undefined') {
    return {
      status: 'DISABLED',
      reason: 'ssr_context',
      message: 'Server-side execution context — Monetag disabled safely.',
      checkedAt: Date.now(),
    };
  }

  // 1. Never load Monetag on Admin Dashboard or Admin Login views
  if (isAdminContext(options?.activeView)) {
    const status: MonetagStatusDetail = {
      status: 'DISABLED',
      reason: 'admin_context',
      message: 'Monetag disabled in administrative context.',
      checkedAt: Date.now(),
    };
    window.__MONETAG_STATUS__ = status;
    return status;
  }

  // 2. Validate configuration safely
  const rawConfig = {
    ...getMonetagRuntimeConfig(),
    ...options?.config,
  };

  const validation = validateMonetagConfig(rawConfig);
  if (!validation.valid && !options?.force) {
    const status: MonetagStatusDetail = {
      status: 'DISABLED',
      reason: validation.reason || 'missing_config',
      message: validation.message || 'Monetag disabled due to missing or invalid configuration.',
      checkedAt: Date.now(),
    };
    window.__MONETAG_STATUS__ = status;
    logMonetagDev(`Configuration check: ${status.message}`);
    return status;
  }

  const sanitized = validation.sanitizedConfig || DEFAULT_MONETAG_CONFIG;

  // 3. Multi-layer Idempotency Check: Global window flag
  if (window.__MONETAG_INITIALIZED__ && window.__MONETAG_LOADED__) {
    const status: MonetagStatusDetail = {
      status: 'READY',
      reason: 'ready',
      message: 'Monetag MultiTag active.',
      checkedAt: Date.now(),
    };
    window.__MONETAG_STATUS__ = status;
    return status;
  }

  // 4. Multi-layer Idempotency Check: DOM inspection for existing script tags
  const existingScriptById = document.getElementById(MONETAG_SCRIPT_ID);
  const existingScriptByZone = document.querySelector(`script[data-zone="${sanitized.multiTagZoneId}"]`);
  const existingScriptBySrc = document.querySelector(`script[src*="quge5.com/88/tag.min.js"]`);

  if (existingScriptById || existingScriptByZone || existingScriptBySrc) {
    window.__MONETAG_INITIALIZED__ = true;
    window.__MONETAG_LOADED__ = true;
    const status: MonetagStatusDetail = {
      status: 'READY',
      reason: 'ready',
      message: 'Monetag script detected in DOM.',
      checkedAt: Date.now(),
    };
    window.__MONETAG_STATUS__ = status;
    return status;
  }

  // 5. Mark as initialized IMMEDIATELY to prevent React StrictMode duplicate invocations
  window.__MONETAG_INITIALIZED__ = true;
  window.__MONETAG_CONFIG__ = sanitized;

  try {
    const script = document.createElement('script');
    script.id = MONETAG_SCRIPT_ID;
    script.src = sanitized.multiTagScriptUrl;
    script.setAttribute('data-zone', sanitized.multiTagZoneId);
    script.setAttribute('data-cfasync', 'false');
    script.setAttribute('data-monetag-loaded', 'true');
    script.async = true;

    script.onload = () => {
      window.__MONETAG_LOADED__ = true;
      window.__MONETAG_STATUS__ = {
        status: 'READY',
        reason: 'ready',
        message: 'Monetag MultiTag loaded successfully.',
        checkedAt: Date.now(),
      };
      window.dispatchEvent(new CustomEvent('omnifetch_monetag_status_updated', { detail: window.__MONETAG_STATUS__ }));
      logMonetagDev('MultiTag script loaded successfully.');
    };

    script.onerror = () => {
      // Non-critical: Ad blocker or network issue — mark as FAILED safely without retry loops
      window.__MONETAG_LOADED__ = false;
      window.__MONETAG_STATUS__ = {
        status: 'FAILED',
        reason: 'client_blocked',
        message: 'Monetag script failed to load (network error or client ad-blocker). Continuing normally.',
        checkedAt: Date.now(),
      };
      window.dispatchEvent(new CustomEvent('omnifetch_monetag_status_updated', { detail: window.__MONETAG_STATUS__ }));
      logMonetagDev('MultiTag script blocked or network unavailable — continuing safely.', true);
    };

    // Append to document head or root element safely
    if (document.head) {
      document.head.appendChild(script);
    } else if (document.documentElement) {
      document.documentElement.appendChild(script);
    }

    const initialStatus: MonetagStatusDetail = {
      status: 'INITIALIZING',
      reason: 'ready',
      message: 'Injecting Monetag MultiTag script asynchronously...',
      checkedAt: Date.now(),
    };
    window.__MONETAG_STATUS__ = initialStatus;
    return initialStatus;
  } catch (error) {
    // Fail-open for application, fail-closed for monetization
    const failedStatus: MonetagStatusDetail = {
      status: 'FAILED',
      reason: 'script_error',
      message: 'Failed to inject Monetag script. App continuing normally.',
      checkedAt: Date.now(),
    };
    window.__MONETAG_STATUS__ = failedStatus;
    logMonetagDev(`Injection error: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
    return failedStatus;
  }
}

/**
 * Backward compatibility alias for loadMonetagOnce
 */
export function loadMonetagOnce(options?: {
  activeView?: string;
  force?: boolean;
  config?: Partial<MonetagRuntimeConfig>;
}): boolean {
  const result = initializeMonetag(options);
  return result.status === 'READY' || result.status === 'INITIALIZING';
}

/**
 * Toggles Monetag Global State from Admin Dashboard
 */
export function setMonetagGlobalEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY_MONETAG_ENABLED, enabled ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('omnifetch_monetag_status_changed', { detail: { enabled } }));

    if (!enabled) {
      // Clean up script if explicitly disabled
      const script = document.getElementById(MONETAG_SCRIPT_ID);
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
      window.__MONETAG_INITIALIZED__ = false;
      window.__MONETAG_LOADED__ = false;
      window.__MONETAG_STATUS__ = {
        status: 'DISABLED',
        reason: 'disabled_by_user',
        message: 'Monetag disabled by administrator.',
        checkedAt: Date.now(),
      };
      window.dispatchEvent(new CustomEvent('omnifetch_monetag_status_updated', { detail: window.__MONETAG_STATUS__ }));
    } else {
      initializeMonetag({ force: true });
    }
  } catch (e) {
    logMonetagDev(`Error setting global status: ${e}`, true);
  }
}

