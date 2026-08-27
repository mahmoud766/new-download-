import { useState, useEffect } from 'react';
import { SupportedLanguage, PlatformSlug, SiteSettings, PlatformConfig } from '../types';
import { LANGUAGES, t } from '../i18n/translations';
import { PLATFORMS_CONFIG, DEFAULT_SITE_SETTINGS } from '../config/siteConfig';
import { fetchSiteSettingsFromDb } from '../lib/storage';
import { getStoredPlatformsConfig, fetchPlatformsConfigFromDb } from '../lib/adminStorage';
import { HeaderSearch } from './HeaderSearch';
import { triggerPwaInstall } from './PwaPrompt';
import {
  Globe,
  Sun,
  Moon,
  History,
  LayoutDashboard,
  BookOpen,
  ChevronDown,
  Menu,
  X,
  Sparkles,
  Download,
  ShieldCheck,
  Zap,
  Command,
  Smartphone,
  Database,
} from 'lucide-react';

interface NavbarProps {
  currentLang: SupportedLanguage;
  onSelectLang: (lang: SupportedLanguage) => void;
  currentPlatform: PlatformSlug;
  onSelectPlatform: (platform: PlatformSlug) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenHistory: () => void;
  onOpenAdmin: () => void;
  onOpenBlog: () => void;
  onOpenAiStudio: () => void;
  onOpenLegal?: (type: 'privacy' | 'terms' | 'dmca' | 'disclaimer' | 'cookies' | 'about' | 'contact') => void;
  onOpenBatchModal?: () => void;
  historyCount: number;
}

export function Navbar({
  currentLang,
  onSelectLang,
  currentPlatform,
  onSelectPlatform,
  theme,
  onToggleTheme,
  onOpenHistory,
  onOpenAdmin,
  onOpenBlog,
  onOpenAiStudio,
  onOpenLegal,
  onOpenBatchModal,
  historyCount,
}: NavbarProps) {
  const [platformDropdownOpen, setPlatformDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeLangObj = LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[1];
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [platformMap, setPlatformMap] = useState<Record<string, PlatformConfig>>(() => getStoredPlatformsConfig());

  useEffect(() => {
    // Fetch site name and settings dynamically from Prisma database
    fetchSiteSettingsFromDb().then((dbSettings) => {
      setSiteSettings(dbSettings);
    });

    fetchPlatformsConfigFromDb().then((map) => {
      if (map) setPlatformMap(map);
    });

    const handleSettingsUpdated = (e: any) => {
      if (e?.detail) {
        setSiteSettings(e.detail);
      } else {
        fetchSiteSettingsFromDb().then((dbSettings) => {
          setSiteSettings(dbSettings);
        });
      }
    };

    const handlePlatformsUpdated = (e: any) => {
      if (e?.detail) setPlatformMap(e.detail);
    };

    window.addEventListener('omnifetch_settings_updated', handleSettingsUpdated);
    window.addEventListener('omnifetch_platforms_updated', handlePlatformsUpdated);
    return () => {
      window.removeEventListener('omnifetch_settings_updated', handleSettingsUpdated);
      window.removeEventListener('omnifetch_platforms_updated', handlePlatformsUpdated);
    };
  }, []);

  const rawPlatformsList = Object.values(PLATFORMS_CONFIG);
  const platformsList = rawPlatformsList.filter((p) => {
    if (p.slug === 'all') return true;
    const override = platformMap[p.slug];
    if (override && (override.active === false || override.enabled === false)) {
      return false;
    }
    return true;
  });

  const getHeaderStyleClasses = () => {
    let positionClass = 'sticky top-0 z-50 w-full';
    if (siteSettings.headerStyle === 'fixed') {
      positionClass = 'fixed top-0 left-0 right-0 z-50 w-full';
    } else if (siteSettings.headerStyle === 'static') {
      positionClass = 'relative z-50 w-full';
    } else if (siteSettings.headerStyle === 'floating') {
      positionClass = 'sticky top-3 z-50 max-w-7xl mx-auto px-2 sm:px-4 my-2 rounded-2xl border border-slate-800 shadow-2xl';
    }

    let blurClass = 'backdrop-blur-xl bg-slate-900/80 border-b border-slate-800/80';
    if (siteSettings.headerBlur === 'none') {
      blurClass = 'bg-slate-900 border-b border-slate-800';
    } else if (siteSettings.headerBlur === 'light') {
      blurClass = 'backdrop-blur-sm bg-slate-900/90 border-b border-slate-800';
    } else if (siteSettings.headerBlur === 'medium') {
      blurClass = 'backdrop-blur-md bg-slate-900/80 border-b border-slate-800';
    }

    return `${positionClass} ${blurClass} transition-all duration-300 shadow-lg`;
  };

  return (
    <header className={getHeaderStyleClasses()}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand Name */}
          <a
            href="/"
            className="flex items-center gap-3 cursor-pointer group"
            onClick={(e) => {
              e.preventDefault();
              onSelectPlatform('all');
            }}
          >
            {siteSettings.logoUrl ? (
              <img
                src={siteSettings.logoUrl}
                alt={siteSettings.siteName || 'Logo'}
                style={{ height: `${siteSettings.logoHeightPx || 40}px` }}
                className="object-contain max-h-12 group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Download className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400 group-hover:animate-bounce" />
                </div>
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                  {siteSettings.siteName || 'OmniFetch'}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {siteSettings.shortName || 'PRO'}
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-slate-300 font-medium">
                Universal Video Downloader
              </p>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {/* Platforms Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setPlatformDropdownOpen(!platformDropdownOpen);
                  setLangDropdownOpen(false);
                }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-200 hover:bg-slate-800/80 hover:text-white transition-all border border-transparent hover:border-slate-700/50"
              >
                <Globe className="w-4 h-4 text-indigo-400" />
                <span>{t('supportedPlatforms', currentLang)}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${platformDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {platformDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 grid grid-cols-1 gap-1 backdrop-blur-2xl">
                  <button
                    onClick={() => {
                      onSelectPlatform('all');
                      setPlatformDropdownOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      currentPlatform === 'all'
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                    <span>{t('allPlatforms', currentLang)}</span>
                  </button>
                  <div className="h-px bg-slate-800/80 my-1" />
                  <div className="max-h-72 overflow-y-auto space-y-0.5 pr-1">
                    {platformsList
                      .filter((p) => p.slug !== 'all')
                      .map((p) => (
                        <button
                          key={p.slug}
                          onClick={() => {
                            onSelectPlatform(p.slug);
                            setPlatformDropdownOpen(false);
                          }}
                          className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                            currentPlatform === p.slug
                              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-slate-500" />
                            {p.name}
                          </span>
                          {p.popular && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              HOT
                            </span>
                          )}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Blog Link */}
            <a
              href="/blog"
              onClick={(e) => {
                e.preventDefault();
                onOpenBlog();
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-200 hover:bg-slate-800/80 hover:text-white transition-all"
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>{t('blog', currentLang)}</span>
            </a>

            {/* AI Studio Button */}
            <button
              onClick={onOpenAiStudio}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold text-indigo-300 bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-500/40 shadow-sm transition-all"
            >
              <Sparkles className="w-4 h-4 text-pink-400 animate-pulse" />
              <span>AI Studio</span>
            </button>

          </nav>

          {/* Right Controls: Full-Site Search, Quick Actions, History, Lang, Theme, Admin */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* PWA App Install Button */}
            <button
              onClick={triggerPwaInstall}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600/20 to-teal-600/20 hover:from-emerald-600/30 hover:to-teal-600/30 text-emerald-300 border border-emerald-500/40 transition-all shadow-sm group"
              title={t('installPwa', currentLang)}
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="hidden lg:inline">{t('install', currentLang)}</span>
            </button>

            {/* Quick Actions Overlay Trigger Button */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('omnifetch_open_quick_actions'))}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-purple-600/20 to-indigo-600/20 hover:from-purple-600/30 hover:to-indigo-600/30 text-purple-300 border border-purple-500/40 transition-all shadow-sm group"
              title="إجراءات سريعة فورية (Ctrl+Shift+A)"
            >
              <Zap className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform animate-pulse" />
              <span className="hidden lg:inline">إجراءات سريعة</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-purple-500/30 text-[10px] font-mono text-purple-300">
                ⌘A
              </span>
            </button>

            {/* Full-Site Search Bar (Fuse.js) */}
            <HeaderSearch
              currentLang={currentLang}
              onSelectPlatform={onSelectPlatform}
              onOpenBlog={onOpenBlog}
              onOpenHistory={onOpenHistory}
              onOpenAdmin={onOpenAdmin}
              onOpenAiStudio={onOpenAiStudio}
              onOpenLegal={onOpenLegal}
              onOpenBatchModal={onOpenBatchModal}
            />

            {/* Download History Button */}
            <button
              onClick={onOpenHistory}
              className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700/60 transition-all shadow-sm"
              title={t('downloadHistory', currentLang)}
            >
              <History className="w-4 h-4 text-amber-400" />
              <span>{t('downloadHistory', currentLang)}</span>
              {historyCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px]">
                  {historyCount}
                </span>
              )}
            </button>

            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => {
                  setLangDropdownOpen(!langDropdownOpen);
                  setPlatformDropdownOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700/60 transition-all"
              >
                <span className="text-base">{activeLangObj.flag}</span>
                <span className="uppercase">{activeLangObj.code}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {langDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 z-50 space-y-1 backdrop-blur-xl">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        onSelectLang(lang.code);
                        setLangDropdownOpen(false);
                      }}
                      className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        currentLang === lang.code
                          ? 'bg-indigo-600/20 text-indigo-300 font-bold border border-indigo-500/30'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.nativeName}</span>
                      </span>
                      <span className="uppercase text-[10px] opacity-60">{lang.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-300 hover:text-white border border-slate-700/60 transition-all"
              title="Toggle Light/Dark Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>
          </div>

          {/* Mobile Menu Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            <HeaderSearch
              currentLang={currentLang}
              onSelectPlatform={onSelectPlatform}
              onOpenBlog={onOpenBlog}
              onOpenHistory={onOpenHistory}
              onOpenAdmin={onOpenAdmin}
              onOpenAiStudio={onOpenAiStudio}
              onOpenLegal={onOpenLegal}
              onOpenBatchModal={onOpenBatchModal}
            />
            <button
              onClick={onOpenHistory}
              aria-label="View download history"
              className="relative p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-slate-800 text-amber-400 border border-slate-700"
            >
              <History className="w-5 h-5" />
              {historyCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
                  {historyCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
              className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-slate-800 text-slate-200 border border-slate-700"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950 p-4 space-y-4">
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase text-slate-400 px-2 py-1">
              {t('supportedPlatforms', currentLang)}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => {
                  onSelectPlatform('all');
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${
                  currentPlatform === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-300 border border-slate-800'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{t('allPlatforms', currentLang)}</span>
              </button>
              {platformsList
                .filter((p) => p.slug !== 'all')
                .map((p) => (
                  <button
                    key={p.slug}
                    onClick={() => {
                      onSelectPlatform(p.slug);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${
                      currentPlatform === p.slug
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 text-slate-300 border border-slate-800'
                    }`}
                  >
                    <span>{p.name}</span>
                  </button>
                ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                triggerPwaInstall();
                setMobileMenuOpen(false);
              }}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg border border-purple-400/30 active:scale-95 transition-all"
            >
              <Smartphone className="w-4 h-4 text-amber-300" />
              <span>{t('installPwa', currentLang)}</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                onOpenBlog();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-slate-200 border border-slate-800"
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>{t('blog', currentLang)}</span>
            </button>
          </div>

          {/* Languages selection in mobile */}
          <div className="pt-2 border-t border-slate-800">
            <div className="text-xs font-bold uppercase text-slate-400 px-2 py-1 mb-1">Languages</div>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    onSelectLang(lang.code);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                    currentLang === lang.code
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900 text-slate-300 border border-slate-800'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.nativeName}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
