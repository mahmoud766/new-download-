import { useEffect, useState, useRef } from 'react';
import { AdPlacementConfig } from '../types';
import { getAdsConfig } from '../lib/storage';
import { generateAdsterraAdCode } from '../config/siteConfig';

export const DEFAULT_PUBLISHER_ID = 'ca-pub-6708942894533593';

// Ensure Google AdSense script is injected ONCE globally
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
  slot: string; // e.g. HOME_AFTER_HERO, HOME_AFTER_TRENDING, PLATFORM_TOP, header_banner, etc.
  className?: string;
  debug?: boolean;
}

export function AdSlot({ slot, className = '', debug = false }: AdSlotProps) {
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

  const [isIntersecting, setIsIntersecting] = useState<boolean>(false);
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

  // Lazy Loading Intersection Observer
  useEffect(() => {
    if (!slotRef.current) return;
    if (!adConfig || adConfig.lazyLoad === false) {
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsIntersecting(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '200px' }
    );

    observer.observe(slotRef.current);
    return () => observer.disconnect();
  }, [adConfig]);

  // Render & Execute Ad Unit Logic
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!adConfig || !adConfig.enabled) {
      setAdStatus('DISABLED');
      container.innerHTML = '';
      return;
    }

    if (!isIntersecting && adConfig.lazyLoad !== false) {
      return;
    }

    setAdStatus('LOADING');
    container.innerHTML = '';

    const provider = adConfig.provider || 'adsterra';
    const pubId = adConfig.publisherId || DEFAULT_PUBLISHER_ID;
    const slotId = adConfig.slotId || '';
    const rawCode = (adConfig.code || '').trim();

    // Strategy A: Google AdSense Rendering
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

    // Strategy B: Adsterra / Custom Script / Isolated Iframe Rendering
    if (
      provider === 'adsterra' ||
      provider === 'custom_html' ||
      rawCode.includes('<script') ||
      rawCode.includes('<iframe') ||
      rawCode.includes('invoke.js')
    ) {
      let finalCode = rawCode;
      if (!finalCode && provider === 'adsterra') {
        const zoneKey = slotId || 'a1b2c3d4e5f67890';
        finalCode = generateAdsterraAdCode(zoneKey, adConfig.format || 'auto', adConfig.heightPx || 90);
      }

      if (!finalCode) {
        setAdStatus('NO_FILL');
        return;
      }

      const iframe = document.createElement('iframe');
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.style.overflow = 'hidden';
      iframe.style.backgroundColor = 'transparent';
      iframe.setAttribute('scrolling', 'no');
      iframe.setAttribute('frameBorder', '0');

      // Strict Security Sandbox: Allow script execution and forms, but DISALLOW allow-top-navigation
      // This physically prevents third-party ad scripts from redirecting the parent window.
      iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups-to-escape-sandbox');
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
${finalCode}
</body>
</html>`;

      container.appendChild(iframe);
      setAdStatus('LOADED');
      return;
    }

    // Strategy C: Custom Raw HTML or Banner Image Link (Wrapped in Sandboxed Iframe for Safety)
    if (rawCode) {
      const iframe = document.createElement('iframe');
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.style.overflow = 'hidden';
      iframe.style.backgroundColor = 'transparent';
      iframe.setAttribute('scrolling', 'no');
      iframe.setAttribute('frameBorder', '0');
      iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups-to-escape-sandbox');
      iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');

      iframe.srcdoc = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  html, body { margin: 0; padding: 0; background: transparent; text-align: center; }
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

    return () => {
      if (container) container.innerHTML = '';
    };
  }, [adConfig, isIntersecting]);

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

  return (
    <div
      ref={slotRef}
      role="region"
      aria-label="Advertisement Banner"
      data-placement-id={slot}
      className={`w-full my-4 flex-col items-center justify-center transition-all ${deviceClass} ${className}`}
    >
      {/* Label Compliance */}
      {adConfig?.enabled && (
        <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400/80 mb-1 flex items-center gap-1 shrink-0 select-none">
          <span>إعلان (Advertisement)</span>
        </div>
      )}

      {/* Ad Container Box */}
      {adConfig?.enabled && (
        <div
          ref={containerRef}
          className="w-full max-w-4xl bg-slate-900/40 border border-slate-800/60 rounded-xl p-2 flex items-center justify-center shadow-inner overflow-hidden shrink-0 min-h-[90px]"
          style={{ minHeight: targetMinHeight }}
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
              <strong className="text-white">{adConfig?.provider || 'adsense'}</strong>
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
