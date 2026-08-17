import React, { useState, useEffect } from 'react';
import {
  Layout,
  LayoutDashboard,
  BarChart3,
  Settings,
  FileText,
  Layers,
  Search,
  Globe,
  DollarSign,
  BookOpen,
  HelpCircle,
  Users,
  Shield,
  Activity,
  HardDrive,
  Palette,
  Sparkles,
  History,
  X,
  ChevronRight,
  ChevronLeft,
  Search as SearchIcon,
  LogOut,
  Loader2,
  UserCheck,
  Image as ImageIcon,
  Mail,
  Command,
  Upload,
  Save,
  Check,
  RefreshCw,
  Eye,
  Video,
  Download,
  ShieldAlert,
  Wrench,
  Lock,
  Zap,
} from 'lucide-react';
import { SupportedLanguage, SiteSettings, AdPlacementConfig, FAQItem, BlogPost } from '../types';
import {
  getSiteSettings,
  saveSiteSettings,
  fetchSiteSettingsFromDb,
  getAdsConfig,
  fetchAdsConfigFromDb,
  getFaqsConfig,
  getBlogsConfig,
  fetchFaqsConfigFromDb,
  fetchBlogsConfigFromDb,
} from '../lib/storage';
import { auth, onAuthStateChanged, signOut, User, saveFirestoreGlobalSettings, fetchFirestoreGlobalSettings } from '../lib/firebase';

// Tab Components
import { AdminAnalyticsTab } from './admin/AdminAnalyticsTab';
import { SiteSettingsTab } from './admin/SiteSettingsTab';
import { PagesManagerTab } from './admin/PagesManagerTab';
import { PlatformManagerTab } from './admin/PlatformManagerTab';
import { SeoCenterTab, SeoManager } from './admin/SeoCenterTab';
import { GoogleCenterTab } from './admin/GoogleCenterTab';
import { AdManagerTab } from './admin/AdManagerTab';
import { BlogManagerTab } from './admin/BlogManagerTab';
import { FaqManagerTab } from './admin/FaqManagerTab';
import { UsersSecurityTab } from './admin/UsersSecurityTab';
import { ApiPerformanceTab } from './admin/ApiPerformanceTab';
import { FileManagerBackupTab } from './admin/FileManagerBackupTab';
import { ThemeBuilderTab } from './admin/ThemeBuilderTab';
import { AiSuiteTab } from './admin/AiSuiteTab';
import { SeoToolkitLogsTab } from './admin/SeoToolkitLogsTab';
import { ProxyStatusIndicator } from './admin/ProxyStatusIndicator';
import { ImageOptimizerTab } from './admin/ImageOptimizerTab';
import { EmailNotificationsTab } from './admin/EmailNotificationsTab';
import { QuickSearchModal } from './admin/QuickSearchModal';
import { DownloadLogsTab } from './admin/DownloadLogsTab';
import { AdminErrorBoundary } from './admin/AdminErrorBoundary';

interface AdminProps {
  currentLang: SupportedLanguage;
  onClose: () => void;
  onShowToast: (msg: string) => void;
  initialTab?: string;
}

export function AdminDashboard({ currentLang, onClose, onShowToast, initialTab }: AdminProps) {
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  const [activeTab, setActiveTab] = useState<
    | 'analytics'
    | 'download_logs'
    | 'site_settings'
    | 'pages'
    | 'platforms'
    | 'seo'
    | 'google'
    | 'ads'
    | 'blog'
    | 'faqs'
    | 'users_security'
    | 'email_alerts'
    | 'api_perf'
    | 'files'
    | 'image_opt'
    | 'theme'
    | 'ai_suite'
    | 'toolkit_logs'
  >(() => (initialTab as any) || 'analytics');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab as any);
    }
  }, [initialTab]);

  useEffect(() => {
    const handleNavigateTab = (e: any) => {
      if (e?.detail) {
        setActiveTab(e.detail);
      }
    };
    window.addEventListener('omnifetch_navigate_admin_tab', handleNavigateTab);
    return () => {
      window.removeEventListener('omnifetch_navigate_admin_tab', handleNavigateTab);
    };
  }, []);

  const [searchTabQuery, setSearchTabQuery] = useState('');
  const [showQuickSearch, setShowQuickSearch] = useState(false);
  const [showQuickBrandModal, setShowQuickBrandModal] = useState(false);

  // State loaded from storage
  const [settings, setSettings] = useState<SiteSettings>(getSiteSettings());
  const [ads, setAds] = useState<AdPlacementConfig[]>(getAdsConfig());
  const [faqs, setFaqs] = useState<FAQItem[]>(getFaqsConfig());
  const [blogs, setBlogs] = useState<BlogPost[]>(getBlogsConfig());

  // Quick Logo & Favicon Modal form state
  const [tempLogoUrl, setTempLogoUrl] = useState(settings.logoUrl || '');
  const [tempFaviconUrl, setTempFaviconUrl] = useState(settings.faviconUrl || '');
  const [tempSiteName, setTempSiteName] = useState(settings.siteName || 'OmniFetch Pro');
  const [tempShortName, setTempShortName] = useState(settings.shortName || 'PRO');
  const [tempHeaderStyle, setTempHeaderStyle] = useState<'sticky' | 'fixed' | 'static' | 'floating'>(settings.headerStyle || 'sticky');
  const [tempMaintenanceMode, setTempMaintenanceMode] = useState<boolean>(!!settings.maintenanceMode);

  // Sync remote settings from PostgreSQL & Firestore on mount
  useEffect(() => {
    let isMounted = true;
    async function syncRemoteSettings() {
      try {
        const [remoteSettings, remoteAds, remoteFaqs, remoteBlogs] = await Promise.all([
          fetchSiteSettingsFromDb(),
          fetchAdsConfigFromDb(),
          fetchFaqsConfigFromDb(),
          fetchBlogsConfigFromDb(),
        ]);
        if (isMounted) {
          if (remoteSettings) setSettings(remoteSettings);
          if (remoteAds && remoteAds.length > 0) setAds(remoteAds);
          if (remoteFaqs && remoteFaqs.length > 0) setFaqs(remoteFaqs);
          if (remoteBlogs && remoteBlogs.length > 0) setBlogs(remoteBlogs);
        }

        const remote = await fetchFirestoreGlobalSettings();
        if (remote && isMounted) {
          if (remote.siteSettings) {
            setSettings((prev) => ({ ...prev, ...remote.siteSettings }));
          }
          if (remote.adsConfig && Array.isArray(remote.adsConfig) && remote.adsConfig.length > 0) {
            setAds(remote.adsConfig);
          }
          if (remote.faqsConfig && remote.faqsConfig.length > 0) {
            setFaqs(remote.faqsConfig);
          }
          if (remote.blogsConfig && remote.blogsConfig.length > 0) {
            setBlogs(remote.blogsConfig);
          }
        }
      } catch (err) {
        console.warn('Notice: Remote settings fetch:', err);
      }
    }
    syncRemoteSettings();

    const handleSettingsUpdated = (e: CustomEvent) => {
      if (e.detail && typeof e.detail === 'object') setSettings(e.detail);
    };
    const handleAdsUpdated = (e: CustomEvent) => {
      if (e.detail && Array.isArray(e.detail)) setAds(e.detail);
    };
    const handleFaqsUpdated = (e: CustomEvent) => {
      if (e.detail && Array.isArray(e.detail)) setFaqs(e.detail);
    };
    const handleBlogsUpdated = (e: CustomEvent) => {
      if (e.detail && Array.isArray(e.detail)) setBlogs(e.detail);
    };

    window.addEventListener('omnifetch_settings_updated' as any, handleSettingsUpdated);
    window.addEventListener('omnifetch_ads_updated' as any, handleAdsUpdated);
    window.addEventListener('omnifetch_faqs_updated' as any, handleFaqsUpdated);
    window.addEventListener('omnifetch_blogs_updated' as any, handleBlogsUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener('omnifetch_settings_updated' as any, handleSettingsUpdated);
      window.removeEventListener('omnifetch_ads_updated' as any, handleAdsUpdated);
      window.removeEventListener('omnifetch_faqs_updated' as any, handleFaqsUpdated);
      window.removeEventListener('omnifetch_blogs_updated' as any, handleBlogsUpdated);
    };
  }, []);

  // Sync temp values when settings change
  useEffect(() => {
    setTempLogoUrl(settings.logoUrl || '');
    setTempFaviconUrl(settings.faviconUrl || '');
    setTempSiteName(settings.siteName || 'OmniFetch Pro');
    setTempShortName(settings.shortName || 'PRO');
    setTempHeaderStyle(settings.headerStyle || 'sticky');
    setTempMaintenanceMode(!!settings.maintenanceMode);
  }, [settings]);

  // Apply settings to document headers immediately upon load or change
  useEffect(() => {
    // 1. Update Document Title
    if (settings.siteName) {
      document.title = `${settings.siteName} - ${settings.siteDescription || 'أفضل منصة لتحميل المقاطع'}`;
    }

    // 2. Update Favicon in document head
    if (settings.faviconUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = settings.faviconUrl;
    }

    // 3. Inject dynamic font & custom CSS
    let styleTag = document.getElementById('omnifetch-applied-theme-headers');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'omnifetch-applied-theme-headers';
      document.head.appendChild(styleTag);
    }

    const fontCSS = settings.fontFamily ? `body, button, input, select, textarea { font-family: '${settings.fontFamily}', sans-serif !important; }` : '';
    const customCssCode = settings.customCss || '';
    styleTag.textContent = `${fontCSS}\n${customCssCode}`;
  }, [settings]);

  // Global Cmd+K / Ctrl+K keyboard shortcut to launch Quick Search Command Palette
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setShowQuickSearch((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAdminUser(user);
      setAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      await signOut(auth);
      onShowToast('تم تسجيل الخروج بنجاح من لوحة التحكم.');
      window.location.href = '/admin-download/login';
    } catch (err) {
      console.error('Logout error:', err);
      window.location.href = '/admin-download/login';
    }
  };

  const handleSaveQuickBrand = async () => {
    const updatedSettings = {
      ...settings,
      logoUrl: tempLogoUrl,
      faviconUrl: tempFaviconUrl,
      siteName: tempSiteName,
      shortName: tempShortName,
      headerStyle: tempHeaderStyle,
      maintenanceMode: tempMaintenanceMode,
    };
    const updated = saveSiteSettings(updatedSettings);
    setSettings(updated);
    await saveFirestoreGlobalSettings(updatedSettings);
    setShowQuickBrandModal(false);
    onShowToast(
      tempMaintenanceMode
        ? 'تم حفظ الإعدادات وتفعيل وضع الصيانة المباشر وإعادة التنشيط الفوري (On-Demand Revalidated ⚡)!'
        : 'تم حفظ الإعدادات وإعادة التنشيط الفوري (On-Demand Revalidated ⚡) بنجاح!'
    );
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        onShowToast('حجم الملف كبير جداً! يفضل استخدام صورة أقل من 2 ميجابايت.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setTempLogoUrl(event.target.result as string);
          onShowToast('تم رفع ومعاينة الشعار بنجاح!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
        onShowToast('حجم الملف كبير! يفضل اختيار أيقونة صغيرة (PNG أو ICO).');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setTempFaviconUrl(event.target.result as string);
          onShowToast('تم رفع ومعاينة أيقونة Favicon بنجاح!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Categorized Nav Groups
  const navGroups = [
    {
      title: 'الرئيسية والتحليلات',
      items: [
        { id: 'analytics', label: 'لوحة التحليلات المباشرة', icon: BarChart3 },
        { id: 'download_logs', label: 'سجل التنزيلات والتحميلات المباشرة (PostgreSQL)', icon: Download },
      ],
    },
    {
      title: 'إدارة المحتوى والصفحات',
      items: [
        { id: 'site_settings', label: 'الإعدادات العامة والربط (النظام والمحتوى)', icon: Settings },
        { id: 'platforms', label: 'صفحات الـ SEO الثابتة (النظام والمحتوى)', icon: Layers },
        { id: 'pages', label: 'إدارة الصفحات والهبوط (Pages CMS)', icon: FileText },
        { id: 'blog', label: 'إدارة المدونة والمقالات', icon: BookOpen },
        { id: 'faqs', label: 'إدارة الأسئلة الشائعة', icon: HelpCircle },
      ],
    },
    {
      title: 'محركات البحث الـ SEO وGoogle',
      items: [
        { id: 'seo', label: 'مركز الـ SEO و Schemas', icon: Search },
        { id: 'google', label: 'خدمات Google والتكامل', icon: Globe },
        { id: 'ads', label: 'إدارة الإعلانات والأرباح', icon: DollarSign },
      ],
    },
    {
      title: 'الذكاء الاصطناعي والتخصيص',
      items: [
        { id: 'ai_suite', label: 'أدوات الذكاء الاصطناعي', icon: Sparkles },
        { id: 'theme', label: 'Theme Builder والتصميم', icon: Palette },
      ],
    },
    {
      title: 'الأمان والنظام والملفات',
      items: [
        { id: 'users_security', label: 'المستخدمون والأمان', icon: Users },
        { id: 'email_alerts', label: 'تنبيهات البريد و SMTP', icon: Mail },
        { id: 'api_perf', label: 'الأداء والـ APIs', icon: Activity },
        { id: 'files', label: 'الملفات والنسخ الاحتياطي', icon: HardDrive },
        { id: 'image_opt', label: 'تحسين الصور WebP Canvas', icon: ImageIcon },
        { id: 'toolkit_logs', label: 'فحص SEO وسجل التعديلات', icon: History },
      ],
    },
  ];

  if (authChecking) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-purple-400">
          <Loader2 className="w-10 h-10 animate-spin" />
          <span className="text-xs font-bold text-slate-400">جاري التحقق من أذونات الأمان والـ Firebase Auth...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-2 sm:p-4 overflow-hidden text-slate-100 font-sans">
      <div className="relative w-full max-w-7xl h-[94vh] bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between p-4 bg-slate-900 border-b border-slate-800 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white flex items-center gap-2">
                <span>لوحة التحكم الاحترافية (OmniFetch Control Center)</span>
              </h1>
              <p className="text-xs text-slate-400">
                إدارة المحتوى، الإعلانات، الـ SEO، الأمان، التحليلات وأدوات AI بدون لمس الكود.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Hostinger DB Web Installer Button */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open_hostinger_installer'))}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all shadow-sm"
              title="ربط/إعداد قاعدة بيانات Hostinger MySQL"
            >
              <HardDrive className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">قاعدة بيانات Hostinger</span>
            </button>

            {/* Quick Maintenance Mode Toggle Button */}
            <button
              onClick={() => {
                const newMode = !settings.maintenanceMode;
                const updated = saveSiteSettings({ ...settings, maintenanceMode: newMode });
                setSettings(updated);
                onShowToast(
                  newMode
                    ? 'تم تفعيل وضع الصيانة 🔴 - إظهار الشريط وتجميد التنزيلات'
                    : 'تم إيقاف وضع الصيانة 🟢 - استئناف خدمة التنزيل بنجاح'
                );
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-xs shadow-sm font-bold transition ${
                settings.maintenanceMode
                  ? 'bg-rose-600/30 hover:bg-rose-600/40 border-rose-500/60 text-rose-300'
                  : 'bg-emerald-600/20 hover:bg-emerald-600/30 border-emerald-500/40 text-emerald-300'
              }`}
              title="تفعيل/تعطيل وضع الصيانة السريع"
            >
              <ShieldAlert className={`w-3.5 h-3.5 ${settings.maintenanceMode ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`} />
              <span className="hidden sm:inline">
                {settings.maintenanceMode ? 'الصيانة: مفعّلة 🔴' : 'الصيانة: موقوفة 🟢'}
              </span>
            </button>

            {/* Quick Logo & Favicon Modal Trigger Button */}
            <button
              onClick={() => setShowQuickBrandModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 hover:text-white transition group text-xs shadow-sm font-bold"
              title="تعديل الشعار وأيقونة Favicon فوراً"
            >
              <ImageIcon className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">الشعار والأيقونة</span>
            </button>

            {/* Quick Actions Global Command Overlay Button */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('omnifetch_open_quick_actions'))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-purple-600/30 hover:bg-purple-600/40 border border-purple-500/50 text-purple-200 hover:text-white transition group text-xs shadow-sm font-bold"
              title="أوامر وإجراءات سريعة (Ctrl+Shift+A)"
            >
              <Zap className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform animate-pulse" />
              <span className="hidden sm:inline">أوامر سريعة</span>
              <span className="px-1 py-0.2 rounded bg-slate-900 text-[10px] font-mono text-purple-300 border border-purple-500/30">
                Ctrl+Shift+A
              </span>
            </button>

            {/* Quick Search Command Palette Trigger Button */}
            <button
              onClick={() => setShowQuickSearch(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-slate-400 hover:text-white transition group text-xs shadow-inner"
              title="البحث السريع والتنقل بين الوحدات (Cmd+K)"
            >
              <Search className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline font-medium text-slate-300">بحث سريع وتنقل...</span>
              <span className="px-1.5 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-mono text-purple-300 font-bold flex items-center gap-0.5 shadow-sm">
                <Command className="w-3 h-3" /> K
              </span>
            </button>

            {/* Real-time Backend Proxy Health Indicator */}
            <div className="hidden lg:block">
              <ProxyStatusIndicator compact={true} onShowToast={onShowToast} />
            </div>

            {/* Authenticated Admin Status Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300 font-medium max-w-[150px] truncate" title={adminUser?.email || 'Admin'}>
                {adminUser?.email || adminUser?.displayName || 'المشرف'}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-mono">
                Firebase Verified
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleSignOut}
              className="px-3 py-2 rounded-2xl bg-slate-800 hover:bg-rose-600/20 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition"
              title="تسجيل الخروج من حساب المشرف"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">تسجيل الخروج</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              title="إغلاق اللوحة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Body - Sidebar + Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Navigation */}
          <div className="w-64 bg-slate-900/80 border-l border-slate-800/80 flex flex-col p-3 gap-4 overflow-y-auto shrink-0 hidden md:flex">
            {/* Filter Search */}
            <div className="relative">
              <SearchIcon className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="تصفية القوائم..."
                value={searchTabQuery}
                onChange={(e) => setSearchTabQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-4 flex-1">
              {navGroups.map((group, idx) => {
                const filteredItems = group.items.filter((item) =>
                  item.label.toLowerCase().includes(searchTabQuery.toLowerCase())
                );
                if (filteredItems.length === 0) return null;

                return (
                  <div key={idx} className="space-y-1">
                    <span className="px-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                      {group.title}
                    </span>
                    {filteredItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id as any)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-right ${
                            isActive
                              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main Display Container */}
          <div className="flex-1 bg-slate-950 p-4 sm:p-6 overflow-y-auto">
            <AdminErrorBoundary key={activeTab} tabTitle={activeTab}>
              {/* Comprehensive Tab Mapping - Supports All Aliases */}
              {(['analytics', 'overview'].includes(activeTab)) && (
                <AdminAnalyticsTab currentLang={currentLang} onShowToast={onShowToast} />
              )}

              {(['download_logs', 'logs', 'downloads'].includes(activeTab)) && (
                <DownloadLogsTab currentLang={currentLang} onShowToast={onShowToast} />
              )}

              {(['site_settings', 'general', 'settings'].includes(activeTab)) && (
                <SiteSettingsTab
                  settings={settings}
                  onUpdateSettings={(s) => setSettings(s)}
                  onShowToast={onShowToast}
                  currentLang={currentLang}
                />
              )}

              {(['pages', 'cms', 'pages_cms'].includes(activeTab)) && (
                <PagesManagerTab currentLang={currentLang} onShowToast={onShowToast} />
              )}

              {(['platforms', 'seo_pages', 'platform_pages'].includes(activeTab)) && (
                <PlatformManagerTab currentLang={currentLang} onShowToast={onShowToast} />
              )}

              {(['seo', 'seo_center', 'seo_manager'].includes(activeTab)) && (
                <SeoManager currentLang={currentLang} onShowToast={onShowToast} />
              )}

              {(['google', 'google_suite', 'google_center'].includes(activeTab)) && (
                <GoogleCenterTab
                  settings={settings}
                  onUpdateSettings={(s) => setSettings(s)}
                  onShowToast={onShowToast}
                  currentLang={currentLang}
                />
              )}

              {(['ads', 'monetization', 'ad_manager'].includes(activeTab)) && (
                <AdManagerTab
                  ads={ads}
                  onUpdateAds={(a) => setAds(a)}
                  onShowToast={onShowToast}
                  currentLang={currentLang}
                />
              )}

              {(['blog', 'blogs', 'blog_manager'].includes(activeTab)) && (
                <BlogManagerTab
                  blogs={blogs}
                  onUpdateBlogs={(b) => setBlogs(b)}
                  onShowToast={onShowToast}
                  currentLang={currentLang}
                />
              )}

              {(['faqs', 'faq', 'faq_manager'].includes(activeTab)) && (
                <FaqManagerTab
                  faqs={faqs}
                  onUpdateFaqs={(f) => setFaqs(f)}
                  onShowToast={onShowToast}
                  currentLang={currentLang}
                />
              )}

              {(['users_security', 'users', 'security'].includes(activeTab)) && (
                <UsersSecurityTab currentLang={currentLang} onShowToast={onShowToast} />
              )}

              {(['email_alerts', 'email', 'smtp'].includes(activeTab)) && (
                <EmailNotificationsTab currentLang={currentLang} onShowToast={onShowToast} />
              )}

              {(['api_perf', 'performance', 'api'].includes(activeTab)) && (
                <ApiPerformanceTab currentLang={currentLang} onShowToast={onShowToast} />
              )}

              {(['files', 'backups', 'file_manager'].includes(activeTab)) && (
                <FileManagerBackupTab currentLang={currentLang} onShowToast={onShowToast} />
              )}

              {(['image_opt', 'image_optimizer'].includes(activeTab)) && (
                <ImageOptimizerTab currentLang={currentLang} onShowToast={onShowToast} />
              )}

              {(['theme', 'theme_builder'].includes(activeTab)) && (
                <ThemeBuilderTab
                  settings={settings}
                  onUpdateSettings={(s) => setSettings(s)}
                  onShowToast={onShowToast}
                  currentLang={currentLang}
                />
              )}

              {(['ai_suite', 'ai'].includes(activeTab)) && (
                <AiSuiteTab currentLang={currentLang} onShowToast={onShowToast} />
              )}

              {(['toolkit_logs', 'audit_logs'].includes(activeTab)) && (
                <SeoToolkitLogsTab currentLang={currentLang} onShowToast={onShowToast} />
              )}

              {/* Fallback rendering for any unknown tab string: render SiteSettingsTab or AdminAnalyticsTab gracefully */}
              {!['analytics', 'overview', 'download_logs', 'logs', 'downloads', 'site_settings', 'general', 'settings', 'pages', 'cms', 'pages_cms', 'platforms', 'seo_pages', 'platform_pages', 'seo', 'seo_center', 'seo_manager', 'google', 'google_suite', 'google_center', 'ads', 'monetization', 'ad_manager', 'blog', 'blogs', 'blog_manager', 'faqs', 'faq', 'faq_manager', 'users_security', 'users', 'security', 'email_alerts', 'email', 'smtp', 'api_perf', 'performance', 'api', 'files', 'backups', 'file_manager', 'image_opt', 'image_optimizer', 'theme', 'theme_builder', 'ai_suite', 'ai', 'toolkit_logs', 'audit_logs'].includes(activeTab) && (
                <SiteSettingsTab
                  settings={settings}
                  onUpdateSettings={(s) => setSettings(s)}
                  onShowToast={onShowToast}
                  currentLang={currentLang}
                />
              )}
            </AdminErrorBoundary>
          </div>
        </div>
      </div>

      {/* Quick Search & Navigation Command Palette Overlay Modal */}
      <QuickSearchModal
        isOpen={showQuickSearch}
        onClose={() => setShowQuickSearch(false)}
        onSelectTab={(tabId) => setActiveTab(tabId as any)}
        onShowToast={onShowToast}
      />

      {/* Quick Logo & Favicon Settings Modal */}
      {showQuickBrandModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">تعديل الشعار وأيقونة Favicon المباشر</h3>
                  <p className="text-xs text-slate-400">تحديث الصور وتطبيقها فوراً على جميع صفحات وهيدر المستند</p>
                </div>
              </div>
              <button
                onClick={() => setShowQuickBrandModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Site Name & Short Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">اسم الموقع الرئيسي</label>
                  <input
                    type="text"
                    value={tempSiteName}
                    onChange={(e) => setTempSiteName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">الوسم المختصر</label>
                  <input
                    type="text"
                    value={tempShortName}
                    onChange={(e) => setTempShortName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500 font-bold"
                  />
                </div>
              </div>

              {/* Logo Upload & URL */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-purple-400" />
                    <span>شعار الموقع الرئيسي (Site Logo)</span>
                  </span>
                  {tempLogoUrl && (
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">محدد ✓</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {tempLogoUrl ? (
                    <img src={tempLogoUrl} alt="Logo Preview" className="w-12 h-12 object-contain rounded-xl bg-slate-900 border border-slate-800 p-1" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 font-bold text-xs">
                      لا يوجد
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <input
                      type="url"
                      value={tempLogoUrl}
                      onChange={(e) => setTempLogoUrl(e.target.value)}
                      placeholder="رابط صورة الشعار https://example.com/logo.png"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                    />

                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-[11px] font-bold border border-purple-500/30 cursor-pointer transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>رفع صورة الشعار من جهازك</span>
                      <input type="file" accept="image/*" onChange={handleLogoFileUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Favicon Upload & URL */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-indigo-400" />
                    <span>أيقونة الموقع بالمتصفح (Favicon .ico/.png)</span>
                  </span>
                  {tempFaviconUrl && (
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">محدد ✓</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {tempFaviconUrl ? (
                    <img src={tempFaviconUrl} alt="Favicon Preview" className="w-8 h-8 object-contain rounded-lg bg-slate-900 border border-slate-800 p-1" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 font-bold text-[10px]">
                      ICO
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <input
                      type="url"
                      value={tempFaviconUrl}
                      onChange={(e) => setTempFaviconUrl(e.target.value)}
                      placeholder="رابط الأيقونة https://example.com/favicon.ico"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                    />

                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-[11px] font-bold border border-indigo-500/30 cursor-pointer transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>رفع ملف Favicon من جهازك</span>
                      <input type="file" accept="image/*" onChange={handleFaviconFileUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Header Stickiness Toggle */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="block text-slate-300 font-bold flex items-center gap-1.5">
                  <Layout className="w-4 h-4 text-pink-400" />
                  <span>نمط ثبات وسلوك الهيدر أثناء التمرير (Header Stickiness Mode):</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'sticky', label: 'لزج تثبيت (Sticky)' },
                    { id: 'fixed', label: 'ثابت غطاء (Fixed)' },
                    { id: 'static', label: 'مخفي عادي (Static)' },
                    { id: 'floating', label: 'عائم كبسولة (Floating)' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setTempHeaderStyle(mode.id as any)}
                      className={`py-2 px-2.5 rounded-xl text-[11px] font-bold border transition text-center ${
                        tempHeaderStyle === mode.id
                          ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Maintenance Toggle Card */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-white font-bold flex items-center gap-2">
                    <ShieldAlert className={`w-4 h-4 ${tempMaintenanceMode ? 'text-rose-400' : 'text-slate-400'}`} />
                    <span>وضع الصيانة العام (Site-wide Maintenance Mode)</span>
                  </label>
                  <p className="text-slate-400 text-[11px]">
                    عند التفعيل، يظهر شريط تنبيه ملون أعلى الموقع وتتوقف التنزيلات للزوار بينما تظل اللوحة متاحة للآدمن.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTempMaintenanceMode(!tempMaintenanceMode)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    tempMaintenanceMode ? 'bg-rose-600' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      tempMaintenanceMode ? '-translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Live Theme Preview Container */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-purple-500/30 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-extrabold text-white text-xs flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-purple-400 animate-pulse" />
                    <span>معاينة الثيم المباشرة (Live Theme Preview)</span>
                  </span>
                  <span className="text-[10px] text-purple-300 font-mono px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/30">
                    تحديث لحظي
                  </span>
                </div>

                {/* Simulated Navbar Header */}
                <div className={`p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-sm`}>
                  <div className="flex items-center gap-2">
                    {tempLogoUrl ? (
                      <img src={tempLogoUrl} alt="Logo" className="h-6 object-contain" />
                    ) : (
                      <div className="w-6 h-6 rounded bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white text-[10px] font-black">
                        O
                      </div>
                    )}
                    <span className="font-black text-white text-xs">{tempSiteName || 'OmniFetch'}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-purple-600 text-white">
                      {tempShortName || 'PRO'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">الهيدر: {tempHeaderStyle}</span>
                </div>

                {/* Simulated Hero & Result Card Subset */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                      <Video className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-extrabold text-white truncate block">معاينة أداء واجهة التحميل</span>
                      <span className="text-[9px] text-slate-400 block font-mono">1080p MP4 • جاهز للتحميل</span>
                    </div>
                  </div>
                  <button className="w-full py-1.5 text-[10px] font-extrabold text-white bg-purple-600 hover:bg-purple-500 rounded-lg flex items-center justify-center gap-1 shadow">
                    <Download className="w-3 h-3" />
                    <span>تجربة زر التحميل</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowQuickBrandModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                إلغاء
              </button>

              <button
                onClick={handleSaveQuickBrand}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-purple-600/30 transition hover:scale-105 active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>حفظ وتطبيق فوراً</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
