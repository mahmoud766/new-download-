import { useState, useEffect, lazy, Suspense } from 'react';
import { WifiOff, ShieldAlert } from 'lucide-react';
import { SupportedLanguage, PlatformSlug, MediaResult, SiteSettings } from './types';
import { isRTL, detectUserLanguage } from './i18n/translations';
import { getDownloadHistory, fetchSiteSettingsFromDb, initRealtimeSyncLoop } from './lib/storage';
import { DEFAULT_SITE_SETTINGS, PLATFORMS_CONFIG } from './config/siteConfig';
import { trackPageView, initAnalyticsHeartbeat } from './lib/analytics';

// Critical On-Screen Components
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
import { Toast } from './components/Toast';
import { PwaPrompt } from './components/PwaPrompt';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { TrendingDownloadsSection } from './components/TrendingDownloadsSection';
import { PlatformLandingContent } from './components/PlatformLandingContent';

// Lazy Loaded Off-Screen & Heavy Modal Components (Bundle Optimization)
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const AiStudioModal = lazy(() => import('./components/AiStudioModal').then((m) => ({ default: m.AiStudioModal })));
const BlogSection = lazy(() => import('./components/BlogSection').then((m) => ({ default: m.BlogSection })));
const LegalPage = lazy(() => import('./components/LegalPage').then((m) => ({ default: m.LegalPage })));
const DownloadHistoryModal = lazy(() => import('./components/DownloadHistoryModal').then((m) => ({ default: m.DownloadHistoryModal })));
const QrCodeModal = lazy(() => import('./components/QrCodeModal').then((m) => ({ default: m.QrCodeModal })));
const QuickActionsModal = lazy(() => import('./components/QuickActionsModal').then((m) => ({ default: m.QuickActionsModal })));
const DebugLogsModal = lazy(() => import('./components/DebugLogsModal').then((m) => ({ default: m.DebugLogsModal })));
const SecretAdminAccessGateModal = lazy(() => import('./components/SecretAdminAccessGateModal').then((m) => ({ default: m.SecretAdminAccessGateModal })));
const ExtraToolsSection = lazy(() => import('./components/ExtraToolsSection').then((m) => ({ default: m.ExtraToolsSection })));

export default function App() {
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(() => detectUserLanguage());
  const [currentPlatform, setCurrentPlatform] = useState<PlatformSlug>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname.toLowerCase().replace('/', '').split('/')[0];
      if (p && PLATFORMS_CONFIG[p as PlatformSlug]) {
        return p as PlatformSlug;
      }
    }
    return 'all';
  });

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
  const [activeView, setActiveView] = useState<'home' | 'blog' | 'admin' | 'legal'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('/admin') || path.includes('/admin-download') || path.includes('/admin-login')) {
        return 'admin';
      } else if (path.includes('/blog')) {
        return 'blog';
      } else if (path.includes('/legal')) {
        return 'legal';
      }
    }
    return 'home';
  });
  const [legalType, setLegalType] = useState<'privacy' | 'terms' | 'dmca' | 'disclaimer' | 'cookies' | 'about' | 'contact'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('/legal/')) {
        const type = path.replace('/legal/', '').split('/')[0];
        if (['privacy', 'terms', 'dmca', 'disclaimer', 'cookies', 'about', 'contact'].includes(type)) {
          return type as any;
        }
      }
    }
    return 'privacy';
  });

  // Secret Admin Access Security Gate State
  const [showSecretGate, setShowSecretGate] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('/admin') || path.includes('/admin-download') || path.includes('/admin-login')) {
        try {
          const unlocked =
            sessionStorage.getItem('omnifetch_admin_secret_unlocked') === 'true' ||
            localStorage.getItem('omnifetch_admin_secret_unlocked') === 'true' ||
            window.location.search.includes('admin_secret') ||
            window.location.search.includes('secret');
          return !unlocked;
        } catch {}
        return true;
      }
    }
    return false;
  });

  // Listen to URL path changes (popstate)
  useEffect(() => {
    const checkPath = () => {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('/admin') || path.includes('/admin-download') || path.includes('/admin-login')) {
        setActiveView('admin');
        try {
          const unlocked =
            sessionStorage.getItem('omnifetch_admin_secret_unlocked') === 'true' ||
            localStorage.getItem('omnifetch_admin_secret_unlocked') === 'true' ||
            window.location.search.includes('admin_secret') ||
            window.location.search.includes('secret');
          setShowSecretGate(!unlocked);
        } catch {
          setShowSecretGate(true);
        }
      } else if (path.includes('/blog')) {
        setActiveView('blog');
        setShowSecretGate(false);
      } else if (path.includes('/legal')) {
        setActiveView('legal');
        setShowSecretGate(false);
        const type = path.replace('/legal/', '').split('/')[0];
        if (['privacy', 'terms', 'dmca', 'disclaimer', 'cookies', 'about', 'contact'].includes(type)) {
          setLegalType(type as any);
        }
      } else {
        setActiveView('home');
        setShowSecretGate(false);
        const p = path.replace('/', '').split('/')[0];
        if (p && PLATFORMS_CONFIG[p as PlatformSlug]) {
          setCurrentPlatform(p as PlatformSlug);
        } else {
          setCurrentPlatform('all');
        }
      }
    };

    window.addEventListener('popstate', checkPath);
    checkPath();
    return () => window.removeEventListener('popstate', checkPath);
  }, []);

  // Start Live Analytics Heartbeat
  useEffect(() => {
    initAnalyticsHeartbeat();
  }, []);

  // GA4 SPA Page View Tracking (Public website only, strictly excludes admin)
  useEffect(() => {
    if (activeView !== 'admin') {
      const pagePath =
        activeView === 'home'
          ? currentPlatform !== 'all'
            ? `/${currentPlatform}`
            : '/'
          : activeView === 'legal'
          ? `/legal/${legalType}`
          : `/${activeView}`;
      trackPageView(pagePath);
    }
  }, [activeView, currentPlatform, legalType]);

  // Result & Modals State
  const [currentResult, setCurrentResult] = useState<MediaResult | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [aiStudioOpen, setAiStudioOpen] = useState(false);
  const [hostingerInstallerOpen, setHostingerInstallerOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [debugLogsOpen, setDebugLogsOpen] = useState(false);
  const [adminInitialTab, setAdminInitialTab] = useState('analytics');
  const [qrModalUrl, setQrModalUrl] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [historyCount, setHistoryCount] = useState(0);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

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

    const handleCustomOpenHostingerInstaller = () => {
      setHostingerInstallerOpen(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('omnifetch_open_quick_actions', handleCustomOpenQuickActions);
    window.addEventListener('omnifetch_open_debug_modal', handleCustomOpenDebugModal);
    window.addEventListener('open_hostinger_installer', handleCustomOpenHostingerInstaller);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('omnifetch_open_quick_actions', handleCustomOpenQuickActions);
      window.removeEventListener('omnifetch_open_debug_modal', handleCustomOpenDebugModal);
      window.removeEventListener('open_hostinger_installer', handleCustomOpenHostingerInstaller);
    };
  }, []);

  // Auto-scroll to result preview card when video result is extracted
  useEffect(() => {
    if (currentResult) {
      const timer = setTimeout(() => {
        const resultSection = document.getElementById('result-preview-section');
        if (resultSection) {
          resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [currentResult]);

  useEffect(() => {
    initRealtimeSyncLoop();
    fetchSiteSettingsFromDb().then((s) => setSiteSettings(s));

    const handleSettingsUpdated = (e: any) => {
      if (e?.detail) {
        setSiteSettings(e.detail);
      } else {
        fetchSiteSettingsFromDb().then((s) => setSiteSettings(s));
      }
    };

    window.addEventListener('omnifetch_settings_updated', handleSettingsUpdated);
    return () => {
      window.removeEventListener('omnifetch_settings_updated', handleSettingsUpdated);
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

    const primaryColor = siteSettings.primaryColor || '#9333ea';
    const secondaryColor = siteSettings.secondaryColor || '#3b82f6';
    const colorCSS = `
      :root {
        --color-primary: ${primaryColor};
        --color-secondary: ${secondaryColor};
        --primary-color: ${primaryColor};
        --secondary-color: ${secondaryColor};
      }
    `;
    const fontFamilyCSS = siteSettings.fontFamily ? `body, button, input, select, textarea { font-family: '${siteSettings.fontFamily}', sans-serif !important; }` : '';
    const customCssCode = siteSettings.customCss || '';

    styleTag.textContent = `${colorCSS}\n${fontFamilyCSS}\n${customCssCode}`;
  }, [activeView, siteSettings]);

  useEffect(() => {
    const history = getDownloadHistory();
    setHistoryCount(history.length);
  }, [currentResult, historyOpen]);

  const handleSelectPlatform = (slug: PlatformSlug) => {
    setCurrentPlatform(slug);
    setActiveView('home');
    const path = slug === 'all' ? '/' : `/${slug}`;
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenLegal = (type: 'privacy' | 'terms' | 'dmca' | 'disclaimer' | 'cookies' | 'about' | 'contact') => {
    setLegalType(type);
    setActiveView('legal');
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `/legal/${type}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenBlog = () => {
    setActiveView('blog');
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/blog');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAdmin = () => {
    setActiveView('admin');
    const isUnlocked =
      sessionStorage.getItem('omnifetch_admin_secret_unlocked') === 'true' ||
      localStorage.getItem('omnifetch_admin_secret_unlocked') === 'true' ||
      window.location.search.includes('admin_secret') ||
      window.location.search.includes('secret');

    setShowSecretGate(!isUnlocked);
    if (!window.location.pathname.toLowerCase().includes('/admin')) {
      window.history.pushState({}, '', '/admin/login');
    }
  };

  const getSeoProps = () => {
    if (activeView === 'legal') {
      const titles: Record<string, string> = {
        privacy: 'Privacy Policy | OmniFetch Pro',
        terms: 'Terms of Service | OmniFetch Pro',
        dmca: 'DMCA Copyright Policy | OmniFetch Pro',
        disclaimer: 'Legal Disclaimer | OmniFetch Pro',
        cookies: 'Cookie Policy | OmniFetch Pro',
        about: 'About Us | OmniFetch Pro',
        contact: 'Contact Us & Technical Support | OmniFetch Pro',
      };
      const descs: Record<string, string> = {
        privacy: 'Read the official Privacy Policy for OmniFetch Pro. Learn about our data handling, security standards, GDPR compliance, and Google AdSense cookie policies.',
        terms: 'Review the Terms of Service for using OmniFetch Pro online video extraction utility and downloader.',
        dmca: 'OmniFetch Pro DMCA Copyright Policy. Read about our takedown notice procedure, intellectual property standards, and contact details.',
        disclaimer: 'Read the Legal Disclaimer for OmniFetch Pro video downloader utility, trademark notices, and third-party platform disclosures.',
        cookies: 'Learn about how OmniFetch Pro uses essential, analytics, and Google AdSense advertising cookies.',
        about: 'Discover OmniFetch Pro, the premier free online video downloader and media converter utility for social media content.',
        contact: 'Get in touch with the OmniFetch Pro support team for general inquiries, DMCA notices, and technical feedback.',
      };
      return {
        pageTitle: titles[legalType] || 'Legal Document | OmniFetch Pro',
        pageDescription: descs[legalType] || 'Official legal documentation for OmniFetch Pro.',
        customCanonicalUrl: `https://omnifetchpro.com/legal/${legalType}`,
      };
    } else if (activeView === 'blog') {
      return {
        pageTitle: 'Blog & Technical Guides | OmniFetch Pro',
        pageDescription: 'Explore expert guides, video downloading tutorials, MP4/MP3 format explanations, and technical articles on OmniFetch Pro.',
        customCanonicalUrl: 'https://omnifetchpro.com/blog',
      };
    }
    return {};
  };

  return (
    <div className={`min-h-screen font-sans antialiased selection:bg-indigo-500 selection:text-white flex flex-col justify-between overflow-x-hidden transition-colors duration-300 ${
      theme === 'light' ? 'bg-slate-900 text-slate-100' : 'bg-slate-950 text-slate-100'
    }`}>
      {/* Dynamic SEO Meta & Schema Injector */}
      <SeoHead platform={currentPlatform} language={currentLang} {...getSeoProps()} />

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
          onOpenAdmin={handleOpenAdmin}
          onOpenBlog={handleOpenBlog}
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
                  setToastMessage(currentLang === 'ar' ? 'تم استخراج الفيديو بنجاح!' : 'Video extracted successfully!');
                  setTimeout(() => {
                    const el = document.getElementById('result-preview-section');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 100);
                }}
                onError={(msg) => setToastMessage(msg)}
                onReset={() => setCurrentResult(null)}
              />

              {/* Header Leaderboard Ad Slot */}
              <div className="max-w-7xl mx-auto px-4">
                <AdBanner slot="header_banner" />
              </div>

              {/* Mid-Result Pre-Download Ad Slot */}
              <div className="max-w-7xl mx-auto px-4">
                <AdBanner slot="pre_result" />
              </div>

              {/* Fetched Result Presentation Card */}
              {currentResult && (
                <div id="result-preview-section" className="max-w-7xl mx-auto px-4 scroll-mt-24">
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

              {/* Trending Downloads High-Conversion Carousel */}
              <TrendingDownloadsSection
                currentLang={currentLang}
                onExtractUrl={(url) => {
                  window.scrollTo({ top: 300, behavior: 'smooth' });
                }}
              />

              {/* Supported Platforms Grid */}
              <PlatformCards
                currentLang={currentLang}
                onSelectPlatform={handleSelectPlatform}
              />

              {/* Integrated Media Power Tools */}
              <Suspense fallback={null}>
                <ExtraToolsSection
                  currentLang={currentLang}
                  onShowToast={(msg) => setToastMessage(msg)}
                />
              </Suspense>

              {/* How it Works - 3 Steps */}
              <StepsSection currentLang={currentLang} />

              {/* Features List */}
              <FeaturesSection currentLang={currentLang} />

              {/* Service-Specific Deep Landing Guide Content */}
              <PlatformLandingContent
                currentPlatform={currentPlatform}
                currentLang={currentLang}
                onSelectPlatform={handleSelectPlatform}
                onOpenLegal={handleOpenLegal}
                onOpenBlog={() => setActiveView('blog')}
              />

              {/* FAQs with Schema */}
              <FAQSection currentLang={currentLang} platform={currentPlatform} />

              {/* User Testimonials */}
              <ReviewsSection currentLang={currentLang} />
            </>
          )}

          {activeView === 'blog' && (
            <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-indigo-400 font-bold">جاري تحميل المدونة...</div>}>
              <BlogSection currentLang={currentLang} onBack={() => setActiveView('home')} />
            </Suspense>
          )}

          {activeView === 'legal' && (
            <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-indigo-400 font-bold">جاري تحميل الصفحة...</div>}>
              <LegalPage
                type={legalType}
                currentLang={currentLang}
                onBack={() => setActiveView('home')}
                onShowToast={(msg) => setToastMessage(msg)}
              />
            </Suspense>
          )}
        </main>
      </div>

      {/* Sticky Footer Ad Banner */}
      <div className="max-w-7xl mx-auto px-4 my-2">
        <AdBanner slot="footer_banner" />
      </div>

      {/* Footer */}
      <Footer
        currentLang={currentLang}
        onSelectLang={setCurrentLang}
        onSelectPlatform={handleSelectPlatform}
        onOpenLegal={handleOpenLegal}
        onOpenBlog={() => setActiveView('blog')}
        onOpenAdmin={handleOpenAdmin}
      />

      {/* MODALS & OVERLAYS (SUSPENSE LAZY) */}

      <Suspense fallback={null}>
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

        {/* Secret Admin Gate Security Modal */}
        {showSecretGate && (
          <SecretAdminAccessGateModal
            currentLang={currentLang}
            onClose={() => {
              setShowSecretGate(false);
              setActiveView('home');
              if (window.location.pathname.toLowerCase().includes('/admin')) {
                window.history.pushState({}, '', '/');
              }
            }}
            onUnlocked={() => {
              setShowSecretGate(false);
              setActiveView('admin');
              if (!window.location.pathname.toLowerCase().includes('/admin')) {
                window.history.pushState({}, '', '/admin/login');
              }
            }}
            onShowToast={(msg) => setToastMessage(msg)}
          />
        )}

        {activeView === 'admin' && !showSecretGate && (
          <AdminDashboard
            currentLang={currentLang}
            initialTab={adminInitialTab}
            onClose={() => {
              setActiveView('home');
              window.history.pushState({}, '', '/');
            }}
            onShowToast={(msg) => setToastMessage(msg)}
          />
        )}

        {/* Quick Actions Overlay (Shortcut Ctrl+Shift+A) */}
        <QuickActionsModal
          isOpen={quickActionsOpen}
          onClose={() => setQuickActionsOpen(false)}
          onOpenAdminTab={(tab) => {
            setAdminInitialTab(tab);
            handleOpenAdmin();
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
          onSelectUrlForRetry={() => {
            setActiveView('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </Suspense>

      {/* GDPR & AdSense Cookie Consent Banner */}
      <CookieConsentBanner
        currentLang={currentLang}
        onOpenCookiePolicy={() => handleOpenLegal('cookies')}
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
