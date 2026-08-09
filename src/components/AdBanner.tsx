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

  useEffect(() => {
    if (!adConfig || !adConfig.enabled || !adConfig.code) {
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    let resizeObserver: ResizeObserver | null = null;

    // Set HTML content
    container.innerHTML = adConfig.code;

    // Execute non-push script elements (e.g. loading adsbygoogle.js library)
    const scriptElements = Array.from(container.querySelectorAll('script')) as HTMLScriptElement[];
    scriptElements.forEach((oldScript: HTMLScriptElement) => {
      // If inline script contains adsbygoogle.push, remove it so we don't trigger duplicate push
      if (!oldScript.src && (oldScript.innerHTML.includes('adsbygoogle') || oldScript.innerHTML.includes('push'))) {
        oldScript.remove();
        return;
      }

      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach((attr: Attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      if (oldScript.innerHTML) {
        newScript.innerHTML = oldScript.innerHTML;
      }
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });

    // Handle AdSense push safely
    const triggerPush = (targetIns: HTMLElement) => {
      if (targetIns.hasAttribute('data-adsbygoogle-status') || targetIns.getAttribute('data-pushed') === 'true') {
        return;
      }
      const insWidth = Math.max(
        targetIns.offsetWidth || 0,
        targetIns.clientWidth || 0,
        container.offsetWidth || 0,
        container.clientWidth || 0
      );
      if (insWidth < 250) {
        return;
      }
      targetIns.setAttribute('data-pushed', 'true');
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch {
        // Quietly catch any AdSense push errors
      }
    };

    const insEl = container.querySelector<HTMLElement>('ins.adsbygoogle');
    if (insEl) {
      if (!insEl.style.display || insEl.style.display === 'none') {
        insEl.style.display = 'block';
      }
      insEl.style.minWidth = '250px';
      insEl.style.width = '100%';

      const checkAndPush = () => {
        if (!container || !insEl) return;
        const currentWidth = Math.max(
          container.clientWidth || 0,
          container.offsetWidth || 0,
          insEl.clientWidth || 0,
          insEl.offsetWidth || 0
        );
        if (currentWidth >= 250) {
          triggerPush(insEl);
        }
      };

      checkAndPush();

      if (typeof ResizeObserver !== 'undefined' && !insEl.getAttribute('data-pushed')) {
        resizeObserver = new ResizeObserver(() => {
          checkAndPush();
        });
        resizeObserver.observe(container);
        try {
          resizeObserver.observe(insEl);
        } catch {
          // ignore if element observation fails
        }
      }
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [adConfig]);

  if (!adConfig || !adConfig.enabled) {
    return null;
  }

  const isLargeSlot = slot === 'post_result' || slot === 'mid_result' || slot === 'sidebar';

  return (
    <div
      role="region"
      aria-label="Advertisement Banner"
      className={`w-full my-4 flex flex-col items-center justify-center transition-all ${className}`}
    >
      <div className="text-[10px] uppercase font-mono tracking-wider text-slate-300 mb-1 flex items-center gap-1 shrink-0">
        <span>إعلان (Advertisement)</span>
      </div>

      <div
        ref={containerRef}
        className="w-full max-w-4xl bg-slate-900/40 border border-slate-800/60 rounded-xl p-2 flex items-center justify-center shadow-inner overflow-hidden shrink-0"
        style={{
          minHeight: isLargeSlot ? '250px' : '90px',
        }}
      />
    </div>
  );
}
