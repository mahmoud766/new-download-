import { useEffect, useState, useRef } from 'react';
import { AdPlacementConfig } from '../types';
import { getAdsConfig } from '../lib/storage';

interface AdProps {
  slot: string; // supports header_banner, footer_banner, pre_result, post_result, mid_result, sidebar, in_article, or custom slots
  className?: string;
}

export function AdBanner({ slot, className = '' }: AdProps) {
  const [adConfig, setAdConfig] = useState<AdPlacementConfig | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ads = getAdsConfig();
    const found = ads.find((a) => a.slot === slot || a.id === slot);
    if (found) {
      setAdConfig(found);
    }
  }, [slot]);

  // Execute inline scripts when ad code contains <script> tags
  useEffect(() => {
    if (!adConfig || !adConfig.enabled || !adConfig.code || !containerRef.current) {
      return;
    }

    const container = containerRef.current;
    container.innerHTML = adConfig.code;

    // Extract all script elements and re-inject them to trigger execution in browser
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

    // Trigger AdSense push if Google AdSense slot is detected
    try {
      if (adConfig.code.includes('adsbygoogle')) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch (e) {
      // ignore adsense push error if missing client
    }
  }, [adConfig]);

  if (!adConfig || !adConfig.enabled) {
    return null;
  }

  return (
    <div className={`w-full my-4 flex flex-col items-center justify-center overflow-hidden transition-all ${className}`}>
      <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-1 flex items-center gap-1">
        <span>إعلان (Advertisement)</span>
      </div>
      <div
        ref={containerRef}
        className="w-full max-w-4xl min-h-[60px] bg-slate-900/40 border border-slate-800/60 rounded-xl p-2 flex items-center justify-center shadow-inner"
      />
    </div>
  );
}
