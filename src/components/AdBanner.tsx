import { useEffect, useState, useRef } from 'react';
import { AdPlacementConfig } from '../types';
import { getAdsConfig } from '../lib/storage';

interface AdProps {
  slot: string; // supports header_banner, footer_banner, pre_result, post_result, mid_result, sidebar, in_article, or custom slots
  className?: string;
}

export function AdBanner({ slot, className = '' }: AdProps) {
  // Synchronously initialize adConfig from localStorage or defaults to avoid initial render layout shift
  const [adConfig, setAdConfig] = useState<AdPlacementConfig | null>(() => {
    try {
      const ads = getAdsConfig();
      return ads.find((a) => a.slot === slot || a.id === slot) || null;
    } catch {
      return null;
    }
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const desktopContainerRef = useRef<HTMLDivElement>(null);

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

  // Execute inline scripts deferred to prevent blocking main thread (TBT)
  useEffect(() => {
    if (!adConfig || !adConfig.enabled || !adConfig.code) {
      return;
    }

    let timerId: ReturnType<typeof setTimeout> | null = null;
    let idleId: number | null = null;
    let executed = false;

    const runScriptOnContainer = (container: HTMLDivElement | null) => {
      if (!container) return;
      container.innerHTML = adConfig.code;

      const scriptElements = Array.from(container.querySelectorAll('script')) as HTMLScriptElement[];
      scriptElements.forEach((oldScript: HTMLScriptElement) => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach((attr: Attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        if (oldScript.innerHTML) {
          newScript.innerHTML = oldScript.innerHTML;
        }
        oldScript.parentNode?.replaceChild(newScript, oldScript);
      });
    };

    const runScript = () => {
      if (executed) return;
      executed = true;

      runScriptOnContainer(containerRef.current);
      runScriptOnContainer(desktopContainerRef.current);

      try {
        if (adConfig.code.includes('adsbygoogle')) {
          const hasWidth = (containerRef.current && containerRef.current.clientWidth > 0) ||
                           (desktopContainerRef.current && desktopContainerRef.current.clientWidth > 0);
          if (hasWidth) {
            ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          }
        }
      } catch (e) {
        // Suppress AdSense push errors during automated Lighthouse audit
      }
    };

    // Defer ad script loading until browser is idle or after user interaction
    const onUserInteraction = () => {
      runScript();
      cleanupEvents();
    };

    const cleanupEvents = () => {
      window.removeEventListener('scroll', onUserInteraction);
      window.removeEventListener('mousemove', onUserInteraction);
      window.removeEventListener('touchstart', onUserInteraction);
    };

    window.addEventListener('scroll', onUserInteraction, { passive: true, once: true });
    window.addEventListener('mousemove', onUserInteraction, { passive: true, once: true });
    window.addEventListener('touchstart', onUserInteraction, { passive: true, once: true });

    if ('requestIdleCallback' in window) {
      idleId = (window as any).requestIdleCallback(() => runScript(), { timeout: 3000 });
    } else {
      timerId = setTimeout(runScript, 2500);
    }

    return () => {
      if (idleId !== null && 'cancelIdleCallback' in window) {
        (window as any).cancelIdleCallback(idleId);
      }
      if (timerId !== null) clearTimeout(timerId);
      cleanupEvents();
    };
  }, [adConfig]);

  if (!adConfig || !adConfig.enabled) {
    return null;
  }

  // Determine strict style cage parameters to physically prevent iframe resizing shifts
  const isLargeSlot = slot === 'post_result' || slot === 'mid_result' || slot === 'sidebar';
  const mobileHeight = '100px';
  const desktopHeight = isLargeSlot ? '280px' : '250px';

  return (
    <div
      role="region"
      aria-label="Advertisement Banner"
      className={`w-full my-4 flex flex-col items-center justify-center transition-all ${className}`}
    >
      {/* Mobile Ad Wrapper (flex md:hidden) */}
      <div
        className="flex md:hidden w-full flex-col items-center justify-center overflow-hidden bg-transparent"
        style={{
          display: 'flex',
          width: '100%',
          height: mobileHeight,
          minHeight: mobileHeight,
          maxHeight: mobileHeight,
          overflow: 'hidden',
          contain: 'strict',
        }}
      >
        <div className="text-[10px] uppercase font-mono tracking-wider text-slate-300 mb-1 flex items-center gap-1 shrink-0">
          <span>إعلان (Advertisement)</span>
        </div>
        <div
          ref={containerRef}
          className="w-full max-w-4xl bg-slate-900/40 border border-slate-800/60 rounded-xl p-2 flex items-center justify-center shadow-inner overflow-hidden shrink-0"
          style={{
            height: '80px',
            minHeight: '80px',
            maxHeight: '80px',
            contain: 'strict',
          }}
        />
      </div>

      {/* Desktop Ad Wrapper (hidden md:flex) */}
      <div
        className="hidden md:flex w-full justify-center items-center overflow-hidden bg-transparent"
        style={{ height: '280px', minHeight: '280px', maxHeight: '280px', contain: 'strict' }}
      >
        <div className="flex flex-col items-center justify-center w-full h-full">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-300 mb-1 flex items-center gap-1 shrink-0">
            <span>إعلان (Advertisement)</span>
          </div>
          <div
            ref={desktopContainerRef}
            className="w-full max-w-4xl bg-slate-900/40 border border-slate-800/60 rounded-xl p-2 flex items-center justify-center shadow-inner overflow-hidden shrink-0"
            style={{
              height: '250px',
              minHeight: '250px',
              maxHeight: '250px',
              contain: 'strict',
            }}
          />
        </div>
      </div>
    </div>
  );
}


