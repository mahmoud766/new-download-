import { useState, useEffect } from 'react';
import { SupportedLanguage } from '../types';
import { t } from '../i18n/translations';
import { Download, Smartphone, X, Sparkles } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PwaProps {
  currentLang?: SupportedLanguage;
}

let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;

export async function triggerPwaInstall() {
  if (globalDeferredPrompt) {
    try {
      await globalDeferredPrompt.prompt();
      const choice = await globalDeferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        globalDeferredPrompt = null;
        window.dispatchEvent(new CustomEvent('omnifetch_pwa_installed'));
      }
    } catch (err) {
      console.error('PWA prompt execution error:', err);
    }
  } else {
    window.dispatchEvent(new CustomEvent('omnifetch_trigger_pwa_install'));
  }
}

export function PwaPrompt({ currentLang = 'en' }: PwaProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(globalDeferredPrompt);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent default browser install banner
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      globalDeferredPrompt = event;
      setDeferredPrompt(event);
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      globalDeferredPrompt = null;
      setDeferredPrompt(null);
      setIsVisible(false);
    };

    const handleCustomTrigger = async () => {
      if (globalDeferredPrompt) {
        handleInstallClick();
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('omnifetch_trigger_pwa_install', handleCustomTrigger);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('omnifetch_trigger_pwa_install', handleCustomTrigger);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || globalDeferredPrompt;
    if (!promptEvent) return;

    try {
      // Execute native browser prompt
      await promptEvent.prompt();
      // Wait for user choice
      const choice = await promptEvent.userChoice;
      if (choice.outcome === 'accepted') {
        globalDeferredPrompt = null;
        setDeferredPrompt(null);
        setIsVisible(false);
      }
    } catch (err) {
      console.error('Failed to trigger native PWA prompt:', err);
    }
  };

  // ONLY visible if the beforeinstallprompt event is captured and prompt is available
  if (!deferredPrompt || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 z-50 max-w-md p-4 rounded-3xl bg-slate-900/95 border border-indigo-500/40 shadow-2xl backdrop-blur-2xl flex items-center gap-3 animate-fade-in">
      <div className="p-3 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg flex-shrink-0">
        <Smartphone className="w-6 h-6" />
      </div>

      <div className="flex-1 space-y-0.5">
        <h3 className="text-xs font-bold text-white flex items-center gap-1">
          <span>{t('installPwa', currentLang)}</span>
          <Sparkles className="w-3 h-3 text-amber-400" />
        </h3>
        <p className="text-[11px] text-slate-300 leading-tight">
          {t('pwaDesc', currentLang)}
        </p>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={handleInstallClick}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs hover:scale-105 transition-all shadow-md flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{t('install', currentLang)}</span>
        </button>
        <button
          onClick={() => setIsVisible(false)}
          className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

