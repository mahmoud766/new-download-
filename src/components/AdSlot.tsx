import { useEffect, useState, useRef, useMemo } from 'react';
import { AdPlacementConfig } from '../types';
import { getAdsConfig } from '../lib/storage';
import { trackAdImpression, trackAdClick } from '../lib/analytics';

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
  const hasTrackedImpressionRef = useRef<boolean>(false);
  const isHoveringRef = useRef<boolean>(false);

  // Reset impression tracker if slot changes
  useEffect(() => {
    hasTrackedImpressionRef.current = false;
  }, [slot, adConfig?.id]);

  // Track Impression once the ad is LOADED and intersecting
  useEffect(() => {
    if (adStatus === 'LOADED' && !hasTrackedImpressionRef.current && adConfig && adConfig.enabled) {
      hasTrackedImpressionRef.current = true;
      const rawCode = adConfig.code || adConfig.rawCode || '';
      const isMonetag = adConfig.provider === 'monetag' || rawCode.includes('quge5.com') || rawCode.includes('data-zone');
      const provider = isMonetag ? 'monetag' : (adConfig.provider || 'adsense');
      const zoneId = adConfig.monetagZoneId || (rawCode.match(/data-zone="([0-9]+)"/)?.[1]) || '295812';

      trackAdImpression({
        provider,
        slotId: slot,
        format: adConfig.format || 'banner',
        zoneId: isMonetag ? zoneId : undefined,
      });
    }
  }, [adStatus, adConfig, slot]);

  // Track Clicks via Window Blur (industry standard for iframe ad interaction) and hover state
  useEffect(() => {
    const handleBlur = () => {
      if (isHoveringRef.current && adConfig && adConfig.enabled) {
        const rawCode = adConfig.code || adConfig.rawCode || '';
        const isMonetag = adConfig.provider === 'monetag' || rawCode.includes('quge5.com') || rawCode.includes('data-zone');
        const provider = isMonetag ? 'monetag' : (adConfig.provider || 'adsense');
        const zoneId = adConfig.monetagZoneId || (rawCode.match(/data-zone="([0-9]+)"/)?.[1]) || '295812';

        trackAdClick({
          provider,
          slotId: slot,
          format: adConfig.format || 'banner',
          zoneId: isMonetag ? zoneId : undefined,
        });
      }
    };

    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [adConfig, slot]);

  // Direct click handler
  const handleDirectAdClick = () => {
    if (adConfig && adConfig.enabled) {
      const rawCode = adConfig.code || adConfig.rawCode || '';
      const isMonetag = adConfig.provider === 'monetag' || rawCode.includes('quge5.com') || rawCode.includes('data-zone');
      const provider = isMonetag ? 'monetag' : (adConfig.provider || 'adsense');
      const zoneId = adConfig.monetagZoneId || (rawCode.match(/data-zone="([0-9]+)"/)?.[1]) || '295812';

      trackAdClick({
        provider,
        slotId: slot,
        format: adConfig.format || 'banner',
        zoneId: isMonetag ? zoneId : undefined,
      });
    }
  };

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

      // Strategy B: Direct Image Banner (if configured)
      if (adConfig.imageUrl && adConfig.destinationUrl) {
        const link = document.createElement('a');
        link.href = adConfig.destinationUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer sponsored';
        link.className = 'flex items-center justify-center w-full h-full transition-transform hover:scale-[1.01]';

        const img = document.createElement('img');
        img.src = adConfig.imageUrl;
        img.alt = 'Sponsored Ad';
        img.className = 'max-w-full h-auto rounded-lg shadow-sm object-contain';
        img.loading = isHighPriority ? 'eager' : 'lazy';

        link.appendChild(img);
        container.appendChild(link);
        setAdStatus('LOADED');
        return;
      }

      // Strategy C: Monetag Tag & Banner Strategy
      if (provider === 'monetag' || rawCode.includes('quge5.com') || rawCode.includes('data-zone')) {
        const zoneMatch = rawCode.match(/data-zone="([0-9]+)"/);
        const zoneId = adConfig.monetagZoneId || (zoneMatch ? zoneMatch[1] : '295812');
        const isPureOverlayMultiTag = (adConfig.format === 'multitag' || adConfig.format === 'vignette' || adConfig.format === 'onclick') && !rawCode.includes('<div');

        // Ensure global top-level Monetag script exists
        const existingTag = document.querySelector(`script[src*="quge5.com"], script[data-zone="${zoneId}"]`);
        if (!existingTag) {
          const script = document.createElement('script');
          script.src = 'https://quge5.com/88/tag.min.js';
          script.setAttribute('data-zone', zoneId);
          script.setAttribute('data-cfasync', 'false');
          script.async = true;
          document.head.appendChild(script);
        }

        if (isPureOverlayMultiTag) {
          setAdStatus('LOADED');
          return;
        }

        // Visual Monetag Banners (300x250, 728x90, etc.)
        const targetHeight = adConfig.heightPx || (adConfig.format === 'banner_300x250' ? 250 : 90);
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = `${targetHeight}px`;
        iframe.style.border = 'none';
        iframe.style.backgroundColor = 'transparent';
        iframe.setAttribute('scrolling', 'no');
        iframe.setAttribute('frameBorder', '0');
        iframe.setAttribute('allow', 'autoplay; fullscreen; encrypted-media');
        iframe.setAttribute('loading', isHighPriority ? 'eager' : 'lazy');

        container.appendChild(iframe);

        try {
          const iframeDoc = iframe.contentWindow?.document;
          if (iframeDoc) {
            iframeDoc.open();
            iframeDoc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <base href="${typeof window !== 'undefined' ? window.location.origin : 'https://omnifetchpro.com'}/">
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0; padding: 0; background: transparent; text-align: center;
      overflow: hidden; display: flex; justify-content: center; align-items: center;
      width: 100%; height: 100%;
    }
  </style>
</head>
<body>
  ${rawCode || `<script src="https://quge5.com/88/tag.min.js" data-zone="${zoneId}" async data-cfasync="false"></script>`}
</body>
</html>`);
            iframeDoc.close();
          }
          setAdStatus('LOADED');
        } catch {
          setAdStatus('LOADED');
        }
        return;
      }

      // Strategy D: Adsterra & Universal Partner Tag Execution via Friendly Same-Origin Frame
      if (rawCode) {
        // Detect if this is a floating/in-page push or page-level script (e.g. social bar)
        const isPageLevelScript = rawCode.toLowerCase().includes('socialbar') || 
                                  rawCode.toLowerCase().includes('inpagepush') ||
                                  adConfig.format === 'social_bar';

        if (isPageLevelScript) {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = rawCode;
          const scripts = Array.from(tempDiv.querySelectorAll('script'));
          scripts.forEach((oldScript) => {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value));
            if (oldScript.innerHTML) newScript.innerHTML = oldScript.innerHTML;
            document.body.appendChild(newScript);
          });
          setAdStatus('LOADED');
          return;
        }

        // Standard Display Banner (Adsterra atOptions + invoke.js / Iframe banners)
        const targetHeight = adConfig.heightPx || 90;
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = `${targetHeight}px`;
        iframe.style.border = 'none';
        iframe.style.backgroundColor = 'transparent';
        iframe.setAttribute('scrolling', 'no');
        iframe.setAttribute('frameBorder', '0');
        iframe.setAttribute('allow', 'autoplay; fullscreen; encrypted-media');
        iframe.setAttribute('loading', isHighPriority ? 'eager' : 'lazy');

        container.appendChild(iframe);

        try {
          const iframeDoc = iframe.contentWindow?.document;
          if (iframeDoc) {
            iframeDoc.open();
            iframeDoc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <base href="${typeof window !== 'undefined' ? window.location.origin : 'https://omnifetchpro.com'}/">
  <style>
    * { box-sizing: border-box; }
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
</html>`);
            iframeDoc.close();
            setAdStatus('LOADED');
          } else {
            setAdStatus('LOADED');
          }
        } catch (frameErr) {
          console.warn('[AdSlot] Friendly frame notice:', frameErr);
          setAdStatus('LOADED');
        }
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
    slot.includes('TOOLS') ||
    slot.includes('AFTER_HERO');

  const baseHeight = adConfig?.heightPx || (isLargeSlot ? 250 : 90);
  const targetMinHeight = `${baseHeight + 10}px`;

  // Check if this slot is a pure background overlay / MultiTag / OnClick script with no visual banner
  const rawAdCode = (adConfig?.code || '').trim();
  const isPureOverlay =
    Boolean(adConfig?.enabled) &&
    (adConfig?.format === 'multitag' || adConfig?.format === 'vignette' || adConfig?.format === 'onclick' || adConfig?.format === 'social_bar') &&
    !(rawAdCode.includes('<div') || rawAdCode.includes('<img') || adConfig?.imageUrl);

  // If pure background overlay, do not render a blank empty box (Prevents Google "Empty/Valueless Ad Placement" penalty)
  if (isPureOverlay) {
    if (!isDebugActive) return null;
    return (
      <div className="w-full max-w-4xl mx-auto my-2 p-2 bg-indigo-950/60 border border-indigo-500/30 rounded-lg text-[10px] font-mono text-indigo-300 text-center">
        ⚡ Monetag Smart MultiTag Active (Background Overlay Unit - Zone {adConfig?.monetagZoneId || '295812'})
      </div>
    );
  }

  // If ad is disabled and debug mode is not active, return null completely (Zero DOM footprint, Zero CLS, Zero margin)
  if ((!adConfig || !adConfig.enabled) && !isDebugActive) {
    return null;
  }

  return (
    <div
      ref={slotRef}
      role="region"
      aria-label="Sponsored content"
      data-slot={slot}
      className={`w-full my-3 flex-col items-center justify-center transition-all ${deviceClass} ${className}`}
    >
      {/* Label Compliance - Google AdSense & Safe Browsing Standard */}
      {adConfig?.enabled && (
        <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400/80 mb-1 flex items-center gap-1 shrink-0 select-none">
          <span>إعلان (Advertisement)</span>
        </div>
      )}

      {/* Ad Container Box with explicit dimensions for Zero Cumulative Layout Shift (CLS) - No Click Trap */}
      {adConfig?.enabled && (
        <div
          ref={containerRef}
          onMouseEnter={() => {
            isHoveringRef.current = true;
          }}
          onMouseLeave={() => {
            isHoveringRef.current = false;
          }}
          className="w-full max-w-4xl bg-slate-900/30 border border-slate-800/50 rounded-xl p-1 sm:p-1.5 flex items-center justify-center shadow-inner overflow-visible shrink-0"
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

