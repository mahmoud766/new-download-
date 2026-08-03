import { useState, useEffect } from 'react';
import { SupportedLanguage } from '../types';
import { t } from '../i18n/translations';
import { Download, Smartphone, X, Sparkles } from 'lucide-react';

interface PwaProps {
  currentLang: SupportedLanguage;
}

export function PwaPrompt({ currentLang }: PwaProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      alert('To install OmniFetch Pro: Tap your browser menu (⋮ or Share) and select "Add to Home Screen".');
    }
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 z-40 max-w-md p-4 rounded-3xl bg-slate-900 border border-indigo-500/40 shadow-2xl backdrop-blur-2xl flex items-center gap-3 animate-fade-in">
      <div className="p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex-shrink-0">
        <Smartphone className="w-6 h-6" />
      </div>

      <div className="flex-1 space-y-0.5">
        <h4 className="text-xs font-bold text-white flex items-center gap-1">
          <span>{t('installPwa', currentLang)}</span>
          <Sparkles className="w-3 h-3 text-amber-400" />
        </h4>
        <p className="text-[11px] text-slate-400 leading-tight">
          {t('pwaDesc', currentLang)}
        </p>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={handleInstall}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-xs hover:scale-105 transition-all shadow-md"
        >
          {t('install', currentLang)}
        </button>
        <button
          onClick={() => setShowBanner(false)}
          className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
