import { useEffect, useState, useRef, useMemo } from 'react';
import { AdPlacementConfig } from '../types';
import { getAdsConfig } from '../lib/storage';

export const DEFAULT_PUBLISHER_ID = 'ca-pub-6708942894533593';

// Known above-the-fold ad placements that should start loading immediately on page open
export const ABOVE_THE_FOLD_SLOTS = new Set([
  'HOME_TOP',
  'header_banner',
  'pre_result',
  'PLATFORM_TOP',
  'BLOG_TOP',
]);

// Ensure Google AdSense script is injected ONCE globally if needed
function ensureAdSenseScriptLoaded(publisherId: string = DEFAULT_PUBLISHER_ID) {
  if (typeof window === 'undefined') return;
  const scriptId = 'omnifetch-adsense-script';
  if (document.getElementById(scriptId)) return;

  const script = document.createElement('script');
  script.id = scriptId;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
  script.async = true;
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
}

export interface AdSlotProps {
  slot: string; // e.g. HOME_TOP, HOME_AFTER_HERO, PLATFORM_TOP, header_banner, etc.
  className?: string;
  debug?: boolean;
  priority?: 'high' | 'normal' | 'low';
  aboveTheFold?: boolean;
}

export function AdSlot({
  slot,
  className = '',
  debug = false,
  priority,
  aboveTheFold,
}: AdSlotProps) {
  // Determine if this ad slot is above the fold or requested as high priority
  const isHighPriority = useMemo(() => {
    if (priority === 'high' || aboveTheFold === true) return true;
    if (priority === 'low' || aboveTheFold === false) return false;
    return ABOVE_THE_FOLD_SLOTS.has(slot);
  }, [slot, priority, aboveTheFold]);

  // Synchronous config retrieval from local memory/localStorage cache
  const [adConfig, setAdConfig] = useState<AdPlacementConfig | null>(() => {
    try {
      const ads = getAdsConfig();
      return ads.find((a) => a.slot === slot || a.id === slot) || null;
    } catch {
      return null;
    }
  });

  const [isDebugActive, setIsDebugActive] = useState<boolean>(() => {
    if (debug) return true;
    if (typeof window !== 'undefined') {
      return (
        window.location.search.includes('ad_debug=1') ||
        localStorage.getItem('omnifetch_ad_debug') === 'true'
      );
    }
    return false;
  });

  // For high-priority / above-the-fold slots, start as intersecting immediately without waiting
  const [isIntersecting, setIsIntersecting] = useState<boolean>(() => isHighPriority);
  const [adStatus, setAdStatus] = useState<'IDLE' | 'LOADING' | 'LOADED' | 'NO_FILL' | 'DISABLED'>('IDLE');
  const containerRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);

  // Sync config from storage / window events
  useEffect(() => {
    const updateAd = () => {
      const ads = getAdsConfig();
      const found = ads.find((a) => a.slot === slot || a.id === slot);
      if (found) {
        setAdConfig(found);
      }
    };

    updateAd();
    window.addEventListener('omnifetch_ads_updated', updateAd);
    return () => {
      window.removeEventListener('omnifetch_ads_updated', updateAd);
    };
  }, [slot]);

  // Listen for Debug Mode Toggle events
  useEffect(() => {
    const checkDebug = () => {
      setIsDebugActive(
        debug ||
        window.location.search.includes('ad_debug=1') ||
        localStorage.getItem('omnifetch_ad_debug') === 'true'
      );
    };
    window.addEventListener('omnifetch_toggle_ad_debug', checkDebug);
    return () => window.removeEventListener('omnifetch_toggle_ad_debug', checkDebug);
  }, [debug]);

  // Lazy Loading Intersection Observer for below-the-fold ads with generous 400px margin
  useEffect(() => {
    if (isHighPriority || adConfig?.lazyLoad === false) {
      setIsIntersecting(true);
      return;
    }

    if (!slotRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsIntersecting(true);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin: '400px' }
    );

    observer.observe(slotRef.current);
    return () => observer.disconnect();
  }, [adConfig, isHighPriority]);

  // Render & Execute Ad Unit Logic as early as possible
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!adConfig || !adConfig.enabled) {
      setAdStatus('DISABLED');
      container.innerHTML = '';
      return;
    }

    if (!isIntersecting && !isHighPriority && adConfig.lazyLoad !== false) {
      return;
    }

    setAdStatus('LOADING');
    container.innerHTML = '';

    const provider = adConfig.provider || 'custom_html';
    const pubId = adConfig.publisherId || DEFAULT_PUBLISHER_ID;
    const slotId = adConfig.slotId || '';
    const rawCode = (adConfig.code || '').trim();

    try {
      // Strategy A: Google AdSense / GAM Tag Rendering
      if (provider === 'adsense' || rawCode.includes('adsbygoogle')) {
        ensureAdSenseScriptLoaded(pubId);

        if (rawCode.includes('adsbygoogle')) {
          container.innerHTML = rawCode;
          const scriptElements = Array.from(container.querySelectorAll('script')) as HTMLScriptElement[];
          scriptElements.forEach((oldScript) => {
            if (!oldScript.src && (oldScript.innerHTML.includes('adsbygoogle') || oldScript.innerHTML.includes('push'))) {
              oldScript.remove();
              return;
            }
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value));
            if (oldScript.innerHTML) newScript.innerHTML = oldScript.innerHTML;
            oldScript.parentNode?.replaceChild(newScript, oldScript);
          });
        } else if (slotId || pubId) {
          // Structured AdSense unit creation
          const ins = document.createElement('ins');
          ins.className = 'adsbygoogle';
          ins.style.display = 'block';
          ins.style.width = '100%';
          ins.style.minWidth = '250px';
          ins.setAttribute('data-ad-client', pubId);
          if (slotId) ins.setAttribute('data-ad-slot', slotId);
          ins.setAttribute('data-ad-format', adConfig.format || 'auto');
          if (adConfig.responsive !== false) ins.setAttribute('data-full-width-responsive', 'true');
          container.appendChild(ins);
        }

        const insEl = container.querySelector<HTMLElement>('ins.adsbygoogle');
        if (insEl && !insEl.hasAttribute('data-pushed')) {
          insEl.setAttribute('data-pushed', 'true');
          try {
            ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
            setAdStatus('LOADED');
          } catch (e) {
            console.warn('[AdSlot] AdSense push notice:', e);
            setAdStatus('LOADED');
          }
        } else {
          setAdStatus('LOADED');
        }
        return;
      }

      // Strategy B: Provider-Neutral Sandboxed Iframe (For Custom HTML / GAM / Partner tags)
      if (rawCode) {
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.style.overflow = 'hidden';
        iframe.style.backgroundColor = 'transparent';
        iframe.setAttribute('scrolling', 'no');
        iframe.setAttribute('frameBorder', '0');
        iframe.setAttribute('loading', isHighPriority ? 'eager' : 'lazy');

        // Sandbox: Allow scripts, same-origin, forms, popups on explicit user activation
        iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation');
        iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');

        iframe.srcdoc = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    text-align: center;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
  }
  img { max-width: 100%; height: auto; }
</style>
</head>
<body>
${rawCode}
</body>
</html>`;

        container.appendChild(iframe);
        setAdStatus('LOADED');
      } else {
        setAdStatus('NO_FILL');
      }
    } catch (err) {
      console.warn('[AdSlot] Non-fatal ad rendering notice:', err);
      setAdStatus('NO_FILL');
    }

    return () => {
      if (container) container.innerHTML = '';
    };
  }, [adConfig, isIntersecting, isHighPriority]);

  if (!adConfig || !adConfig.enabled) {
    if (!isDebugActive) return null;
  }

  // Check device visibility constraints
  const desktopEnabled = adConfig?.desktopEnabled ?? true;
  const mobileEnabled = adConfig?.mobileEnabled ?? true;

  const deviceClass =
    !desktopEnabled && mobileEnabled
      ? 'sm:hidden'
      : desktopEnabled && !mobileEnabled
      ? 'hidden sm:flex'
      : 'flex';

  const isLargeSlot =
    slot === 'post_result' ||
    slot === 'sidebar' ||
    slot.includes('MIDDLE') ||
    slot.includes('TOOLS');

  const targetMinHeight = adConfig?.heightPx ? `${adConfig.heightPx}px` : isLargeSlot ? '250px' : '90px';

  // If ad is disabled and debug mode is not active, return null completely (Zero DOM footprint, Zero CLS, Zero margin)
  if ((!adConfig || !adConfig.enabled) && !isDebugActive) {
    return null;
  }

  return (
    <div
      ref={slotRef}
      role="region"
      aria-label="Advertisement Banner"
      data-placement-id={slot}
      className={`w-full my-3 flex-col items-center justify-center transition-all ${deviceClass} ${className}`}
    >
      {/* Label Compliance */}
      {adConfig?.enabled && (
        <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400/80 mb-1 flex items-center gap-1 shrink-0 select-none">
          <span>إعلان (Advertisement)</span>
        </div>
      )}

      {/* Ad Container Box with explicit dimensions for Zero Cumulative Layout Shift (CLS) */}
      {adConfig?.enabled && (
        <div
          ref={containerRef}
          className="w-full max-w-4xl bg-slate-900/40 border border-slate-800/60 rounded-xl p-2 flex items-center justify-center shadow-inner overflow-hidden shrink-0"
          style={{
            minHeight: targetMinHeight,
            containIntrinsicSize: `auto ${targetMinHeight}`,
          }}
        />
      )}

      {/* Admin AD DEBUG MODE Panel (Only visible in Debug Mode) */}
      {isDebugActive && (
        <div className="w-full max-w-4xl mt-2 p-2.5 rounded-lg bg-indigo-950/80 border border-indigo-500/40 font-mono text-[11px] text-indigo-200 shadow-xl backdrop-blur-md shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-800/50 pb-1.5 mb-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-300 font-bold">
                AD DEBUG
              </span>
              <span className="font-extrabold text-white">[{slot}]</span>
              <span className="text-slate-300">({adConfig?.name || 'Unconfigured Slot'})</span>
              {isHighPriority && (
                <span className="px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-300 text-[9px] font-bold">
                  ABOVE THE FOLD
                </span>
              )}
            </div>
            <span
              className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                adConfig?.enabled
                  ? adStatus === 'LOADED'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              STATUS: {adConfig?.enabled ? adStatus : 'DISABLED'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-indigo-300/90">
            <div>
              <span className="text-slate-400">Provider:</span>{' '}
              <strong className="text-white">{adConfig?.provider || 'custom_html'}</strong>
            </div>
            <div>
              <span className="text-slate-400">Pub ID:</span>{' '}
              <strong className="text-white">{adConfig?.publisherId || DEFAULT_PUBLISHER_ID}</strong>
            </div>
            <div>
              <span className="text-slate-400">Slot ID:</span>{' '}
              <strong className="text-white">{adConfig?.slotId || (adConfig?.code ? 'HTML Code' : 'None')}</strong>
            </div>
            <div>
              <span className="text-slate-400">Format/MinH:</span>{' '}
              <strong className="text-white">{adConfig?.format || 'auto'} / {targetMinHeight}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export AdBanner as alias for AdSlot
export const AdBanner = AdSlot;

