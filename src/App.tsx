import { useState, useEffect } from 'react';
import { WifiOff, ShieldAlert, Wrench } from 'lucide-react';
import { SupportedLanguage, PlatformSlug, MediaResult, SiteSettings } from './types';
import { isRTL, detectUserLanguage } from './i18n/translations';
import { getDownloadHistory, getSiteSettings } from './lib/storage';

// Components
import { Navbar } from './components/Navbar';
import { HeroDownloader } from './components/HeroDownloader';
import { ResultCard } from './components/ResultCard';
import { AdBanner } from './components/AdBanner';
import { PlatformCards } from './components/PlatformCards';
import { StepsSection } from './components/StepsSection';
import { FeaturesSection } from './components/FeaturesSection';
import { FAQSection } from './components/FAQSection';
import { ReviewsSection } from './components/ReviewsSection';
import { Footer } from './components/Footer';
import { SeoHead } from './components/SeoHead';
import { DownloadHistoryModal } from './components/DownloadHistoryModal';
import { QrCodeModal } from './components/QrCodeModal';
import { AdminDashboard } from './components/AdminDashboard';
import { BlogSection } from './components/BlogSection';
import { LegalPage } from './components/LegalPage';
import { Toast } from './components/Toast';
import { PwaPrompt } from './components/PwaPrompt';
import { AiStudioModal } from './components/AiStudioModal';
import { QuickActionsModal } from './components/QuickActionsModal';
import { DebugLogsModal } from './components/DebugLogsModal';

export default function App() {
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(() => detectUserLanguage());
  const [currentPlatform, setCurrentPlatform] = useState<PlatformSlug>('all');

  const handleSelectLang = (lang: SupportedLanguage) => {
    setCurrentLang(lang);
    try {
      localStorage.setItem('omnifetch_user_lang', lang);
    } catch (e) {
      console.error('Error saving user language preference:', e);
    }
  };
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Page Routing State
  const [activeView, setActiveView] = useState<'home' | 'blog' | 'admin' | 'legal'>('home');
  const [legalType, setLegalType] = useState<'privacy' | 'terms' | 'dmca' | 'disclaimer' | 'cookies' | 'about' | 'contact'>('privacy');

  // Result & Modals State
  const [currentResult, setCurrentResult] = useState<MediaResult | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [aiStudioOpen, setAiStudioOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [debugLogsOpen, setDebugLogsOpen] = useState(false);
  const [adminInitialTab, setAdminInitialTab] = useState('analytics');
  const [qrModalUrl, setQrModalUrl] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [historyCount, setHistoryCount] = useState(0);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => getSiteSettings());

  // Global Keyboard Shortcuts (Ctrl+Shift+A, Ctrl+Shift+D, Cmd+Shift+D, Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+A or Ctrl+K for Quick Actions
      if (
        (e.ctrlKey || e.metaKey) &&
        ((e.shiftKey && (e.key === 'A' || e.key === 'a')) || e.key === 'k' || e.key === 'K')
      ) {
        e.preventDefault();
        setQuickActionsOpen((prev) => !prev);
      }

      // Ctrl+Shift+D or Cmd+Shift+D for Hidden Debug Logs Overlay
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        (e.key === 'D' || e.key === 'd')
      ) {
        e.preventDefault();
        setDebugLogsOpen((prev) => !prev);
      }
    };

    const handleCustomOpenQuickActions = () => {
      setQuickActionsOpen(true);
    };

    const handleCustomOpenDebugModal = () => {
      setDebugLogsOpen(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('omnifetch_open_quick_actions', handleCustomOpenQuickActions);
    window.addEventListener('omnifetch_open_debug_modal', handleCustomOpenDebugModal);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('omnifetch_open_quick_actions', handleCustomOpenQuickActions);
      window.removeEventListener('omnifetch_open_debug_modal', handleCustomOpenDebugModal);
    };
  }, []);

  useEffect(() => {
    const handleSettingsUpdated = (e: any) => {
      if (e?.detail) {
        setSiteSettings(e.detail);
      } else {
        setSiteSettings(getSiteSettings());
      }
    };

    window.addEventListener('omnifetch_settings_updated', handleSettingsUpdated);
    window.addEventListener('storage', handleSettingsUpdated);
    return () => {
      window.removeEventListener('omnifetch_settings_updated', handleSettingsUpdated);
      window.removeEventListener('storage', handleSettingsUpdated);
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setToastMessage('تم استعادة الاتصال بالإنترنت! (Online Mode)');
    };
    const handleOffline = () => {
      setIsOffline(true);
      setToastMessage('أنت الآن في وضع عدم الاتصال (Offline Cache Mode active)');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync RTL direction & language on document root
  useEffect(() => {
    document.documentElement.dir = isRTL(currentLang) ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
  }, [currentLang]);

  // Sync dark/light theme on document root
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  // Inject Theme Builder settings (Favicon, Custom CSS, Font Family)
  useEffect(() => {
    const siteSettings = getSiteSettings();

    // 1. Update Favicon if custom URL provided
    if (siteSettings.faviconUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'shortcut icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = siteSettings.faviconUrl;
    }

    // 2. Inject Dynamic CSS (Custom CSS + Font Family)
    let styleTag = document.getElementById('omnifetch-custom-theme-styles');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'omnifetch-custom-theme-styles';
      document.head.appendChild(styleTag);
    }

    const fontFamilyCSS = siteSettings.fontFamily ? `body, button, input, select, textarea { font-family: '${siteSettings.fontFamily}', sans-serif !important; }` : '';
    const customCssCode = siteSettings.customCss || '';

    styleTag.textContent = `${fontFamilyCSS}\n${customCssCode}`;
  }, [activeView]);

  useEffect(() => {
    const history = getDownloadHistory();
    setHistoryCount(history.length);
  }, [currentResult, historyOpen]);

  const handleSelectPlatform = (slug: PlatformSlug) => {
    setCurrentPlatform(slug);
    setActiveView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenLegal = (type: 'privacy' | 'terms' | 'dmca' | 'disclaimer' | 'cookies' | 'about' | 'contact') => {
    setLegalType(type);
    setActiveView('legal');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`min-h-screen font-sans antialiased selection:bg-indigo-500 selection:text-white flex flex-col justify-between overflow-x-hidden transition-colors duration-300 ${
      theme === 'light' ? 'bg-slate-900 text-slate-100' : 'bg-slate-950 text-slate-100'
    }`}>
      {/* Dynamic SEO Meta & Schema Injector */}
      <SeoHead platform={currentPlatform} language={currentLang} />

      <div>
        {/* Navigation Bar */}
        <Navbar
          currentLang={currentLang}
          onSelectLang={handleSelectLang}
          currentPlatform={currentPlatform}
          onSelectPlatform={handleSelectPlatform}
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onOpenHistory={() => setHistoryOpen(true)}
          onOpenAdmin={() => setActiveView('admin')}
          onOpenBlog={() => setActiveView('blog')}
          onOpenAiStudio={() => setAiStudioOpen(true)}
          onOpenLegal={handleOpenLegal}
          historyCount={historyCount}
        />

        {/* Site-Wide Maintenance Mode Banner */}
        {siteSettings.maintenanceMode && (
          <div className="bg-gradient-to-r from-rose-600 via-amber-600 to-rose-600 text-white py-2.5 px-4 text-center text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-xl border-b border-rose-400/40 relative z-40 animate-in slide-in-from-top duration-300">
            <ShieldAlert className="w-5 h-5 text-amber-200 animate-bounce shrink-0" />
            <span>تنبيه هامة: وضع الصيانة مفعّل حالياً! يخضع الموقع لتحديثات دورية، وتم تعليق خدمة التنزيل مؤقتاً وسنعود للعمل بكفاءة عالية قريباً.</span>
            {activeView === 'admin' && (
              <span className="px-2.5 py-0.5 text-[10px] bg-black/40 text-emerald-300 rounded-full border border-emerald-400/30 font-mono shrink-0">
                لوحة المشرف نشطة
              </span>
            )}
          </div>
        )}

        {/* Offline Cache Mode Banner */}
        {isOffline && (
          <div className="bg-amber-500/15 border-y border-amber-500/30 py-2 px-4 text-center text-amber-300 text-xs font-bold flex items-center justify-center gap-2 backdrop-blur-md">
            <WifiOff className="w-4 h-4 animate-pulse text-amber-400" />
            <span>أنت حالياً في وضع عدم الاتصال (Offline Cache Mode) — المعالجة والاستخراج المحلي والملفات المخزنة مؤقتاً تعمل بكفاءة!</span>
          </div>
        )}

        {/* Top Header Leaderboard Ad */}
        <div className="max-w-7xl mx-auto px-4 pt-2">
          <AdBanner slot="header_banner" />
        </div>

        {/* MAIN VIEWER ROUTER */}
        <main>
          {activeView === 'home' && (
            <>
              {/* Hero Downloader Zone */}
              <HeroDownloader
                currentLang={currentLang}
                currentPlatform={currentPlatform}
                isMaintenanceMode={siteSettings.maintenanceMode}
                onSelectPlatform={handleSelectPlatform}
                onResultFetched={(res) => {
                  setCurrentResult(res);
                  setToastMessage('Video extracted successfully!');
                }}
                onError={(msg) => setToastMessage(msg)}
                onReset={() => setCurrentResult(null)}
              />

              {/* Mid-Result Pre-Download Ad Slot */}
              <div className="max-w-7xl mx-auto px-4">
                <AdBanner slot="pre_result" />
              </div>

              {/* Fetched Result Presentation Card */}
              {currentResult && (
                <div className="max-w-7xl mx-auto px-4">
                  <ResultCard
                    result={currentResult}
                    currentLang={currentLang}
                    onOpenQrCode={(url) => setQrModalUrl(url)}
                    onClose={() => setCurrentResult(null)}
                    onShowToast={(msg) => setToastMessage(msg)}
                  />
                  <AdBanner slot="post_result" />
                </div>
              )}

              {/* Supported Platforms Grid */}
              <PlatformCards
                currentLang={currentLang}
                onSelectPlatform={handleSelectPlatform}
              />

              {/* How it Works - 3 Steps */}
              <StepsSection currentLang={currentLang} />

              {/* Features List */}
              <FeaturesSection currentLang={currentLang} />

              {/* FAQs with Schema */}
              <FAQSection currentLang={currentLang} platform={currentPlatform} />

              {/* User Testimonials */}
              <ReviewsSection currentLang={currentLang} />
            </>
          )}

          {activeView === 'blog' && (
            <BlogSection currentLang={currentLang} onBack={() => setActiveView('home')} />
          )}

          {activeView === 'legal' && (
            <LegalPage
              type={legalType}
              currentLang={currentLang}
              onBack={() => setActiveView('home')}
              onShowToast={(msg) => setToastMessage(msg)}
            />
          )}
        </main>
      </div>

      {/* Sticky Footer Ad Banner */}
      <div className="max-w-7xl mx-auto px-4 pb-2">
        <AdBanner slot="footer_banner" />
      </div>

      {/* Footer */}
      <Footer
        currentLang={currentLang}
        onSelectLang={setCurrentLang}
        onSelectPlatform={handleSelectPlatform}
        onOpenLegal={handleOpenLegal}
        onOpenBlog={() => setActiveView('blog')}
        onOpenAdmin={() => setActiveView('admin')}
      />

      {/* MODALS & OVERLAYS */}
      <AiStudioModal
        isOpen={aiStudioOpen}
        onClose={() => setAiStudioOpen(false)}
        currentLang={currentLang}
        onShowToast={(msg) => setToastMessage(msg)}
      />

      {historyOpen && (
        <DownloadHistoryModal
          currentLang={currentLang}
          onClose={() => setHistoryOpen(false)}
          onSelectResult={(item) => {
            setCurrentResult(item);
            setActiveView('home');
          }}
        />
      )}

      {qrModalUrl && (
        <QrCodeModal
          url={qrModalUrl}
          currentLang={currentLang}
          onClose={() => setQrModalUrl(null)}
        />
      )}

      {activeView === 'admin' && (
        <AdminDashboard
          currentLang={currentLang}
          initialTab={adminInitialTab}
          onClose={() => setActiveView('home')}
          onShowToast={(msg) => setToastMessage(msg)}
        />
      )}

      {/* Quick Actions Overlay (Shortcut Ctrl+Shift+A) */}
      <QuickActionsModal
        isOpen={quickActionsOpen}
        onClose={() => setQuickActionsOpen(false)}
        onOpenAdminTab={(tab) => {
          setAdminInitialTab(tab);
          setActiveView('admin');
          window.dispatchEvent(new CustomEvent('omnifetch_navigate_admin_tab', { detail: tab }));
        }}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        onShowToast={(msg) => setToastMessage(msg)}
        siteSettings={siteSettings}
        theme={theme}
      />

      {/* Hidden Debug Logs Overlay (Shortcut Ctrl+Shift+D) */}
      <DebugLogsModal
        isOpen={debugLogsOpen}
        onClose={() => setDebugLogsOpen(false)}
        onSelectUrlForRetry={(url) => {
          setActiveView('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Toast Notification Alert */}
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}

      {/* PWA Install Banner */}
      <PwaPrompt currentLang={currentLang} />
    </div>
  );
}
