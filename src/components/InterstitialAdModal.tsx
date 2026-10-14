import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Sparkles, AlertCircle } from 'lucide-react';
import { AdPlacementConfig } from '../types';
import { getAdsConfig } from '../lib/storage';
import { trackAdImpression, trackAdClick } from '../lib/analytics';

interface InterstitialAdModalProps {
  currentLang?: string;
  previewConfig?: AdPlacementConfig | null;
  onClosePreview?: () => void;
}

let isGlobalInterstitialActive = false;

export const InterstitialAdModal: React.FC<InterstitialAdModalProps> = ({
  currentLang = 'ar',
  previewConfig = null,
  onClosePreview,
}) => {
  const [adConfig, setAdConfig] = useState<AdPlacementConfig | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isPreview, setIsPreview] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(3);
  const [canClose, setCanClose] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const displayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const originalBodyOverflow = useRef<string>('');

  const isRtl = currentLang === 'ar';

  // Helper to check frequency storage
  const checkFrequencyAllowed = useCallback((config: AdPlacementConfig): boolean => {
    if (typeof window === 'undefined') return false;

    const freq = config.frequencyControl || 'session';
    const now = Date.now();

    try {
      if (freq === 'always') {
        return true;
      }

      if (freq === 'session') {
        const seen = sessionStorage.getItem('omnifetch_interstitial_seen');
        return !seen;
      }

      const lastSeenStr = localStorage.getItem('omnifetch_interstitial_last_seen');
      if (!lastSeenStr) return true;

      const lastSeen = parseInt(lastSeenStr, 10);
      if (isNaN(lastSeen)) return true;

      let intervalMs = 24 * 60 * 60 * 1000; // default 24h
      if (freq === 'minutes_15' || freq === '15m') intervalMs = 15 * 60 * 1000;
      else if (freq === 'minutes_30' || freq === '30m') intervalMs = 30 * 60 * 1000;
      else if (freq === 'hours_1' || freq === '1h') intervalMs = 60 * 60 * 1000;
      else if (freq === 'hours_6' || freq === '6h') intervalMs = 6 * 60 * 60 * 1000;
      else if (freq === 'hours_24' || freq === '24h') intervalMs = 24 * 60 * 60 * 1000;

      return now - lastSeen >= intervalMs;
    } catch {
      return true;
    }
  }, []);

  // Helper to record impression in client storage & analytics
  const recordImpression = useCallback((config: AdPlacementConfig) => {
    if (typeof window === 'undefined') return;
    const freq = config.frequencyControl || 'session';
    const now = Date.now().toString();

    try {
      if (freq === 'session') {
        sessionStorage.setItem('omnifetch_interstitial_seen', now);
      } else if (freq !== 'always') {
        localStorage.setItem('omnifetch_interstitial_last_seen', now);
      }
    } catch {
      // Ignore storage errors (private browsing, quotas)
    }

    try {
      const rawCode = config.code || config.rawCode || '';
      const isMonetag = config.provider === 'monetag' || rawCode.includes('quge5.com') || rawCode.includes('data-zone');
      const provider = isMonetag ? 'monetag' : (config.provider || 'custom');
      const zoneId = config.monetagZoneId || (rawCode.match(/data-zone="([0-9]+)"/)?.[1]) || '295812';

      trackAdImpression({
        provider,
        slotId: 'INTERSTITIAL_MODAL',
        format: 'interstitial',
        zoneId: isMonetag ? zoneId : undefined,
      });
    } catch {}
  }, []);

  const handleCreativeClick = useCallback(() => {
    if (!adConfig) return;
    try {
      const rawCode = adConfig.code || adConfig.rawCode || '';
      const isMonetag = adConfig.provider === 'monetag' || rawCode.includes('quge5.com') || rawCode.includes('data-zone');
      const provider = isMonetag ? 'monetag' : (adConfig.provider || 'custom');
      const zoneId = adConfig.monetagZoneId || (rawCode.match(/data-zone="([0-9]+)"/)?.[1]) || '295812';

      trackAdClick({
        provider,
        slotId: 'INTERSTITIAL_MODAL',
        format: 'interstitial',
        zoneId: isMonetag ? zoneId : undefined,
      });
    } catch {}
  }, [adConfig]);

  // Sync config from local state or global storage
  const updateConfigFromStorage = useCallback(() => {
    if (previewConfig) {
      setAdConfig(previewConfig);
      setIsPreview(true);
      return;
    }

    const allAds = getAdsConfig();
    const found = allAds.find(
      (a) => a.slot === 'interstitial' || a.id === 'ad-interstitial' || a.format === 'interstitial'
    );

    if (found) {
      setAdConfig(found);
    }
  }, [previewConfig]);

  // Initial load and event subscriptions
  useEffect(() => {
    updateConfigFromStorage();

    const handleAdsUpdated = () => {
      updateConfigFromStorage();
    };

    const handleCustomPreview = (e: any) => {
      const customCfg = e.detail as AdPlacementConfig;
      if (customCfg) {
        setAdConfig(customCfg);
        setIsPreview(true);
        startModalFlow(customCfg, true);
      }
    };

    window.addEventListener('omnifetch_ads_updated', handleAdsUpdated);
    window.addEventListener('omnifetch_preview_interstitial', handleCustomPreview);

    return () => {
      window.removeEventListener('omnifetch_ads_updated', handleAdsUpdated);
      window.removeEventListener('omnifetch_preview_interstitial', handleCustomPreview);
    };
  }, [updateConfigFromStorage]);

  // Start display timer flow
  const startModalFlow = useCallback(
    (config: AdPlacementConfig, forcePreview: boolean = false) => {
      if (isGlobalInterstitialActive && !forcePreview) return;

      // Device checks
      const isMobile = typeof window !== 'undefined' && window.innerWidth <= 767;
      if (!forcePreview) {
        if (typeof window !== 'undefined' && (window.location.pathname.includes('/admin') || window.location.hash.includes('admin'))) {
          return;
        }
        if (!config.enabled) return;
        if (isMobile && config.mobileEnabled === false) return;
        if (!isMobile && config.desktopEnabled === false) return;
        if (!checkFrequencyAllowed(config)) return;

        // Skip if there's no creative to display
        const hasCode = typeof config.code === 'string' && config.code.trim().length > 0;
        const hasImage = typeof config.imageUrl === 'string' && config.imageUrl.trim().length > 0;
        if (!hasCode && !hasImage) return;
      }

      const delayMs = forcePreview ? 100 : config.displayDelayMs !== undefined ? config.displayDelayMs : 500;
      const initialCloseDelay = config.closeDelaySec !== undefined ? config.closeDelaySec : 3;

      if (displayTimerRef.current) clearTimeout(displayTimerRef.current);

      displayTimerRef.current = setTimeout(() => {
        isGlobalInterstitialActive = true;
        setIsOpen(true);
        setCountdown(initialCloseDelay);
        setCanClose(initialCloseDelay <= 0);

        if (!forcePreview) {
          recordImpression(config);
        }

        // Lock body scroll
        if (typeof document !== 'undefined') {
          originalBodyOverflow.current = document.body.style.overflow;
          document.body.style.overflow = 'hidden';
        }

        // Dispatch open telemetry event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('omnifetch_interstitial_opened', {
              detail: { slot: 'interstitial', isPreview: forcePreview },
            })
          );
        }
      }, delayMs);
    },
    [checkFrequencyAllowed, recordImpression]
  );

  // Trigger when adConfig is loaded or preview changes
  useEffect(() => {
    if (previewConfig) {
      setAdConfig(previewConfig);
      setIsPreview(true);
      startModalFlow(previewConfig, true);
    } else if (adConfig && !isOpen && !isGlobalInterstitialActive) {
      startModalFlow(adConfig, false);
    }
  }, [adConfig, previewConfig, startModalFlow, isOpen]);

  // Handle countdown interval when open
  useEffect(() => {
    if (!isOpen) return;

    if (countdown > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            setCanClose(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setCanClose(true);
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [isOpen, countdown]);

  // Focus close button once closeable
  useEffect(() => {
    if (canClose && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [canClose]);

  // Handle Close
  const handleClose = useCallback(() => {
    if (!canClose && !isPreview) return;

    setIsOpen(false);
    isGlobalInterstitialActive = false;

    // Restore body scroll
    if (typeof document !== 'undefined') {
      document.body.style.overflow = originalBodyOverflow.current || '';
    }

    // Clear timers
    if (displayTimerRef.current) clearTimeout(displayTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    if (isPreview && onClosePreview) {
      onClosePreview();
    }

    // Dispatch close telemetry event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('omnifetch_interstitial_closed', {
          detail: { slot: 'interstitial', isPreview },
        })
      );
    }
  }, [canClose, isPreview, onClosePreview]);

  // Escape key handler on desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (canClose || isPreview) {
          handleClose();
        }
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, canClose, isPreview, handleClose]);

  // Safe script injector inside ad container
  useEffect(() => {
    if (!isOpen || !containerRef.current || !adConfig) return;

    const container = containerRef.current;
    const rawCode = adConfig.code || '';

    // If there is custom code, inject and execute any scripts safely
    if (rawCode.trim()) {
      container.innerHTML = rawCode;

      const scripts = Array.from(container.querySelectorAll('script'));
      scripts.forEach((oldScript) => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        newScript.textContent = oldScript.textContent;

        newScript.onerror = () => {
          console.warn('[Interstitial] Script failed to load safely');
          setHasError(true);
        };

        if (oldScript.parentNode) {
          oldScript.parentNode.replaceChild(newScript, oldScript);
        }
      });
    }

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [isOpen, adConfig]);

  // If not open, don't render DOM
  if (!isOpen || !adConfig) {
    return null;
  }

  const hasImageBanner = Boolean(adConfig.imageUrl && adConfig.imageUrl.trim());
  const hasCodeContent = Boolean(adConfig.code && adConfig.code.trim());

  return (
    <div
      id="omnifetch-interstitial-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="interstitial-title"
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-xl transition-opacity duration-300 select-none overflow-x-hidden overflow-y-auto pt-[max(1rem,env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))]"
      style={{ minHeight: '100dvh', height: '100vh', width: '100vw' }}
    >
      {/* Top Bar / Header with Close & Countdown Controls */}
      <div className="w-full max-w-2xl px-4 py-2 flex items-center justify-between z-20">
        {/* Left Side: Badge / Preview Indicator */}
        <div className="flex items-center gap-2">
          {isPreview ? (
            <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black rounded-full flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isRtl ? 'معاينة تجريبية للإعلان (Preview Mode)' : 'Ad Preview Mode'}</span>
            </span>
          ) : (
            <span className="px-2.5 py-0.5 bg-slate-800/80 border border-slate-700 text-slate-400 text-[11px] font-mono rounded-md">
              {isRtl ? 'إعلان مميز' : 'Sponsored Ad'}
            </span>
          )}
        </div>

        {/* Right Side: Accessible Close Button & Countdown */}
        <div className="flex items-center gap-2">
          {adConfig.closeButtonEnabled !== false && (
            <>
              {!canClose && countdown > 0 && !isPreview ? (
                <div
                  id="interstitial-countdown-badge"
                  className="px-3.5 py-1.5 bg-slate-900 border border-slate-700 text-slate-300 text-xs font-bold rounded-xl flex items-center gap-2 shadow-md animate-pulse"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>
                    {isRtl ? `يمكنك الإغلاق بعد ${countdown}ث` : `Close in ${countdown}s`}
                  </span>
                </div>
              ) : (
                <button
                  id="interstitial-close-button"
                  ref={closeButtonRef}
                  onClick={handleClose}
                  aria-label={isRtl ? 'إغلاق الإعلان والمتابعة إلى الموقع' : 'Close advertisement and continue'}
                  className="min-w-[44px] min-h-[44px] px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400"
                >
                  <X className="w-4 h-4" />
                  <span>{isRtl ? 'إغلاق الإعلان ✕' : 'Close Ad ✕'}</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Centered Ad Creative Container */}
      <div className="flex-1 w-full max-w-2xl px-4 py-2 flex flex-col items-center justify-center z-10 my-auto">
        <div className="w-full bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
          <span id="interstitial-title" className="sr-only">
            {isRtl ? 'إعلان شاشة كاملة' : 'Full-Screen Interstitial Advertisement'}
          </span>

          {/* Direct Image Banner (if configured) */}
          {hasImageBanner && (
            <div className="w-full flex justify-center mb-4">
              {adConfig.destinationUrl ? (
                <a
                  href={adConfig.destinationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(
                        new CustomEvent('omnifetch_interstitial_clicked', { detail: adConfig })
                      );
                    }
                    handleCreativeClick();
                  }}
                  className="block w-full max-w-lg hover:opacity-95 transition-opacity"
                >
                  <img
                    src={adConfig.imageUrl}
                    alt={adConfig.name || 'Sponsored Interstitial Ad'}
                    className="w-full max-h-[60vh] object-contain rounded-xl border border-slate-800 shadow-md mx-auto"
                    onError={() => setHasError(true)}
                  />
                </a>
              ) : (
                <img
                  src={adConfig.imageUrl}
                  alt={adConfig.name || 'Sponsored Interstitial Ad'}
                  onClick={handleCreativeClick}
                  className="w-full max-h-[60vh] object-contain rounded-xl border border-slate-800 shadow-md mx-auto cursor-pointer"
                  onError={() => setHasError(true)}
                />
              )}
            </div>
          )}

          {/* HTML / JavaScript Ad Creative Container */}
          {hasCodeContent && (
            <div
              ref={containerRef}
              id="interstitial-ad-creative-slot"
              onClick={handleCreativeClick}
              className="w-full min-h-[120px] max-h-[65vh] flex items-center justify-center overflow-auto text-slate-100 font-sans cursor-pointer"
            />
          )}

          {/* Fallback Display if ad code is empty or has loading issue */}
          {!hasImageBanner && !hasCodeContent && !hasError && (
            <div className="py-12 px-6 text-center space-y-3">
              <div className="p-3 bg-purple-500/20 text-purple-400 rounded-2xl inline-block border border-purple-500/30">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-white">OmniFetch Pro</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                {isRtl
                  ? 'أسرع منصة لتحميل الفيديوهات والموسيقى بجودة فائقة وبدون علامة مائية.'
                  : 'The fastest tool to download videos and audio in ultra-high quality.'}
              </p>
            </div>
          )}

          {/* Error Notice (failsafe & allows dismiss) */}
          {hasError && (
            <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>
                {isRtl
                  ? 'تعذر تحميل الإعلان الخارجي. يمكنك الاستمرار بتصفح الموقع.'
                  : 'External ad could not be loaded. You may continue browsing.'}
              </span>
            </div>
          )}
        </div>

        {/* Bottom Helper / Dismiss Hint */}
        <div className="mt-3 text-center">
          <p className="text-[11px] text-slate-500 font-mono">
            {isRtl
              ? 'بالنقر على إغلاق ستنتقل مباشرة إلى أدوات التحميل المجانية'
              : 'Click close to continue to the free video download tools'}
          </p>
        </div>
      </div>
    </div>
  );
};
