import React, { useState } from 'react';
import {
  Sparkles,
  Save,
  Image as ImageIcon,
  Layout,
  Palette,
  Type,
  Code,
  Eye,
  RefreshCw,
  Sliders,
  Check,
  Video,
  Globe,
  Youtube,
  Instagram,
  Facebook,
  Clapperboard,
  Tv,
  Ghost,
  Twitter,
  Pin,
  MessageSquare,
  AtSign,
  Linkedin,
  Upload,
  Download,
  Link,
  Smartphone,
  Layers,
  Square,
  Circle,
  HelpCircle
} from 'lucide-react';
import { SiteSettings, SupportedLanguage } from '../../types';
import { saveSiteSettings } from '../../lib/storage';
import { PLATFORMS_CONFIG } from '../../config/siteConfig';

interface Props {
  settings: SiteSettings;
  onUpdateSettings: (s: SiteSettings) => void;
  onShowToast: (msg: string) => void;
  currentLang: SupportedLanguage;
}

const PRESET_THEMES = [
  {
    name: 'الرمز الخفي (Cyber Purple)',
    primary: '#9333ea',
    secondary: '#ec4899',
    font: 'Plus Jakarta Sans',
    radius: 'rounded-2xl',
    card: 'glass',
  },
  {
    name: 'الأخضر النيون (Neon Emerald)',
    primary: '#10b981',
    secondary: '#06b6d4',
    font: 'Alexandria',
    radius: 'rounded-xl',
    card: 'neon',
  },
  {
    name: 'المحيط الملكي (Royal Ocean)',
    primary: '#2563eb',
    secondary: '#4f46e5',
    font: 'Tajawal',
    radius: 'rounded-full',
    card: 'glass',
  },
  {
    name: 'الذهبي الدافئ (Sunset Gold)',
    primary: '#f59e0b',
    secondary: '#ef4444',
    font: 'Cairo',
    radius: 'rounded-2xl',
    card: 'bordered',
  },
  {
    name: 'الظلام العميق (Obsidian Minimal)',
    primary: '#6366f1',
    secondary: '#8b5cf6',
    font: 'Inter',
    radius: 'rounded-lg',
    card: 'solid',
  },
];

const PRESET_LOGOS = [
  { name: 'شعار OmniFetch الأصلي', url: '' },
  { name: 'شعار فضائي زجاجي', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80' },
  { name: 'شعار نيون داكن', url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=120&auto=format&fit=crop&q=80' },
  { name: 'شعار شبكي حديث', url: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=120&auto=format&fit=crop&q=80' },
];

export const ThemeBuilderTab: React.FC<Props> = ({
  settings,
  onUpdateSettings,
  onShowToast,
  currentLang,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'brand' | 'header' | 'platforms' | 'design' | 'custom_code'>('brand');

  // Form State
  const [siteName, setSiteName] = useState(settings.siteName || 'OmniFetch Pro');
  const [shortName, setShortName] = useState(settings.shortName || 'OmniFetch');
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '');
  const [faviconUrl, setFaviconUrl] = useState(settings.faviconUrl || '');
  const [logoHeightPx, setLogoHeightPx] = useState(settings.logoHeightPx || 40);

  // Header State
  const [headerStyle, setHeaderStyle] = useState<'sticky' | 'fixed' | 'static' | 'floating'>(settings.headerStyle || 'sticky');
  const [headerBlur, setHeaderBlur] = useState<'none' | 'light' | 'medium' | 'heavy'>(settings.headerBlur || 'heavy');

  // Colors & System State
  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor || '#9333ea');
  const [secondaryColor, setSecondaryColor] = useState(settings.secondaryColor || '#3b82f6');
  const [fontFamily, setFontFamily] = useState(settings.fontFamily || 'Plus Jakarta Sans');
  const [buttonRadius, setButtonRadius] = useState<'rounded-none' | 'rounded-lg' | 'rounded-xl' | 'rounded-2xl' | 'rounded-full'>(settings.buttonRadius || 'rounded-xl');
  const [cardStyle, setCardStyle] = useState<'glass' | 'solid' | 'bordered' | 'neon'>(settings.cardStyle || 'glass');

  // Platform Customization State
  const [platformIconsCustom, setPlatformIconsCustom] = useState<Record<string, string>>(settings.platformIconsCustom || {});
  const [platformColorsCustom, setPlatformColorsCustom] = useState<Record<string, string>>(settings.platformColorsCustom || {});

  // Custom Code State
  const [customCss, setCustomCss] = useState(settings.customCss || '');
  const [customJs, setCustomJs] = useState(settings.customJs || '');

  const handleSaveTheme = () => {
    const updated = saveSiteSettings({
      ...settings,
      siteName,
      shortName,
      logoUrl,
      faviconUrl,
      logoHeightPx,
      headerStyle,
      headerBlur,
      primaryColor,
      secondaryColor,
      fontFamily,
      buttonRadius,
      cardStyle,
      platformIconsCustom,
      platformColorsCustom,
      customCss,
      customJs,
    });
    onUpdateSettings(updated);
    onShowToast('تم حفظ وإطلاق إعدادات الثيم والهوية البصرية بنجاح على جميع صفحات الموقع!');
  };

  const handleApplyPreset = (preset: typeof PRESET_THEMES[0]) => {
    setPrimaryColor(preset.primary);
    setSecondaryColor(preset.secondary);
    setFontFamily(preset.font);
    setButtonRadius(preset.radius as any);
    setCardStyle(preset.card as any);
    onShowToast(`تم تطبيق القالب الجاهز: ${preset.name}`);
  };

  const handleUpdatePlatformIcon = (slug: string, url: string) => {
    setPlatformIconsCustom((prev) => ({
      ...prev,
      [slug]: url,
    }));
  };

  const handleUpdatePlatformColor = (slug: string, color: string) => {
    setPlatformColorsCustom((prev) => ({
      ...prev,
      [slug]: color,
    }));
  };

  const handleResetPlatforms = () => {
    setPlatformIconsCustom({});
    setPlatformColorsCustom({});
    onShowToast('تمت إعادة ضبط أيقونات وألوان المنصات إلى الإعدادات الافتراضية.');
  };

  const platformList = Object.values(PLATFORMS_CONFIG).filter((p) => p.slug !== 'all');

  const getPlatformDefaultIcon = (slug: string) => {
    switch (slug) {
      case 'tiktok': return <Video className="w-5 h-5 text-pink-400" />;
      case 'facebook': return <Facebook className="w-5 h-5 text-blue-400" />;
      case 'facebook-reels': return <Clapperboard className="w-5 h-5 text-indigo-400" />;
      case 'instagram': return <Instagram className="w-5 h-5 text-rose-400" />;
      case 'instagram-reels': return <Tv className="w-5 h-5 text-purple-400" />;
      case 'youtube': return <Youtube className="w-5 h-5 text-red-400" />;
      case 'youtube-shorts': return <Youtube className="w-5 h-5 text-rose-500" />;
      case 'snapchat': return <Ghost className="w-5 h-5 text-yellow-400" />;
      case 'twitter': return <Twitter className="w-5 h-5 text-sky-400" />;
      case 'pinterest': return <Pin className="w-5 h-5 text-red-400" />;
      case 'reddit': return <MessageSquare className="w-5 h-5 text-orange-400" />;
      case 'threads': return <AtSign className="w-5 h-5 text-slate-300" />;
      case 'linkedin': return <Linkedin className="w-5 h-5 text-blue-400" />;
      default: return <Globe className="w-5 h-5 text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-6 text-slate-100 pb-12">
      {/* Top Main Banner & Master Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <span>Theme Builder & Design System</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                  v3.5 PRO
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                لوحة التحكم المتقدمة بالهوية البصرية، الشعار، أيقونة Favicon، أسلوب الهيدر، ألوان المنصات، وأكواد CSS.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveTheme}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-xl shadow-purple-600/30 transition-all hover:scale-105 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>حفظ وتطبيق الثيم على الموقع</span>
          </button>
        </div>
      </div>

      {/* Preset Themes Selector Bar */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-amber-400" />
            <span>قوالب ألوان جاهزة سريعة التطبيق (Quick Theme Presets):</span>
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {PRESET_THEMES.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleApplyPreset(preset)}
              className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 transition-all text-right group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                  {preset.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full border border-slate-700" style={{ backgroundColor: preset.primary }} />
                <div className="w-4 h-4 rounded-full border border-slate-700" style={{ backgroundColor: preset.secondary }} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Sub-Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800">
        <button
          onClick={() => setActiveSubTab('brand')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'brand'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>الشعار واللوجو (Logo & Favicon)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('header')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'header'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Layout className="w-4 h-4" />
          <span>سلوك الهيدر والتصفح (Header Navigation)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('platforms')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'platforms'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>أيقونات وألوان المنصات (Platform Branding)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('design')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'design'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>الألوان، الخطوط، والأزرار (System Colors & UI)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('custom_code')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'custom_code'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>كود CSS مخصص (Custom CSS & Injection)</span>
        </button>
      </div>

      {/* Split Grid: Controls on Left / Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* TAB CONTENT PANEL */}
        <div className="lg:col-span-7 space-y-6">
          {/* TAB 1: LOGO & BRANDING */}
          {activeSubTab === 'brand' && (
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-purple-400" />
                  <span>تخصيص الشعار واللوجو (Site Logo & Favicon Branding)</span>
                </h3>
              </div>

              <div className="space-y-4 text-xs">
                {/* Site Name & Short Badge */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">اسم الموقع الرئيسي (Site Title)</label>
                    <input
                      type="text"
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      placeholder="OmniFetch Pro"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">نص الشارة المختصرة (Badge Label)</label>
                    <input
                      type="text"
                      value={shortName}
                      onChange={(e) => setShortName(e.target.value)}
                      placeholder="PRO"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Custom Logo Image URL */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <label className="block text-slate-300 font-bold flex items-center justify-between">
                    <span>رابط صورة الشعار الخاص (Custom Logo Image URL)</span>
                    <span className="text-[10px] text-slate-500 font-normal">يدعم PNG / SVG / WebP شفاف</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://example.com/logo.png (اتركه فارغاً للاستعاضة باللوجو التجريدي الافتراضي)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:border-purple-500 focus:outline-none"
                    />
                    {logoUrl && (
                      <button
                        onClick={() => setLogoUrl('')}
                        className="px-3 py-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold"
                      >
                        مسح
                      </button>
                    )}
                  </div>
                </div>

                {/* Preset Logo Selection */}
                <div>
                  <span className="block text-slate-400 font-semibold mb-2">أو اختر نماذج شعارات جاهزة للمعاينة:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PRESET_LOGOS.map((pl, i) => (
                      <button
                        key={i}
                        onClick={() => setLogoUrl(pl.url)}
                        className={`p-2 rounded-xl border text-right transition-all flex items-center gap-2 ${
                          logoUrl === pl.url
                            ? 'bg-purple-600/20 border-purple-500 text-purple-300 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        {pl.url ? (
                          <img src={pl.url} alt={pl.name} className="w-6 h-6 rounded-lg object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-[10px] text-white font-black">
                            DEF
                          </div>
                        )}
                        <span className="text-[10px] truncate">{pl.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Logo Height Slider */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-slate-300 font-bold">
                    <span>ارتفاع صورة الشعار في الهيدر (Logo Height):</span>
                    <span className="text-purple-400 font-mono font-black">{logoHeightPx}px</span>
                  </div>
                  <input
                    type="range"
                    min="24"
                    max="72"
                    step="2"
                    value={logoHeightPx}
                    onChange={(e) => setLogoHeightPx(Number(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>

                {/* Custom Favicon URL */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <label className="block text-slate-300 font-bold flex items-center justify-between">
                    <span>رابط أيقونة الموقع (Favicon URL)</span>
                    <span className="text-[10px] text-slate-500 font-normal">أيقونة المتصفح .ico / .png (16x16 or 32x32)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={faviconUrl}
                      onChange={(e) => setFaviconUrl(e.target.value)}
                      placeholder="https://example.com/favicon.ico"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  {faviconUrl && (
                    <div className="flex items-center gap-2 p-2 bg-slate-950 rounded-xl border border-slate-800 w-fit text-[11px] text-slate-400">
                      <span>معاينة Favicon:</span>
                      <img src={faviconUrl} alt="Favicon" className="w-5 h-5 rounded" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HEADER NAVIGATION */}
          {activeSubTab === 'header' && (
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layout className="w-5 h-5 text-indigo-400" />
                  <span>سلوك الهيدر وشريط التصفح العلوي (Header Navigation & Scrolling)</span>
                </h3>
              </div>

              <div className="space-y-6 text-xs">
                {/* Header Positioning */}
                <div>
                  <label className="block text-slate-300 font-bold mb-3">نمط تموضع الهيدر (Header Positioning Mode):</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => setHeaderStyle('sticky')}
                      className={`p-4 rounded-2xl border text-right transition-all flex items-start gap-3 ${
                        headerStyle === 'sticky'
                          ? 'bg-purple-600/20 border-purple-500 text-white shadow-lg shadow-purple-600/10'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-extrabold text-sm text-white">لزج في الأعلى (Sticky Top)</div>
                        <p className="text-[11px] text-slate-400 mt-0.5">يبقى ثابتاً بأعلى الشاشة أثناء تمرير الصفحة (الخيار الأنسب).</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setHeaderStyle('fixed')}
                      className={`p-4 rounded-2xl border text-right transition-all flex items-start gap-3 ${
                        headerStyle === 'fixed'
                          ? 'bg-purple-600/20 border-purple-500 text-white shadow-lg shadow-purple-600/10'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                        <Sliders className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-extrabold text-sm text-white">ثابت مغطي (Fixed Top)</div>
                        <p className="text-[11px] text-slate-400 mt-0.5">مستقر دائماً بالكامل فوق المحتوى.</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setHeaderStyle('static')}
                      className={`p-4 rounded-2xl border text-right transition-all flex items-start gap-3 ${
                        headerStyle === 'static'
                          ? 'bg-purple-600/20 border-purple-500 text-white shadow-lg shadow-purple-600/10'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-slate-500/10 text-slate-400">
                        <Square className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-extrabold text-sm text-white">عادي غير لزج (Normal Scroll)</div>
                        <p className="text-[11px] text-slate-400 mt-0.5">يتمرر ويختفي مع الصفحة للأعلى كالعادة.</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setHeaderStyle('floating')}
                      className={`p-4 rounded-2xl border text-right transition-all flex items-start gap-3 ${
                        headerStyle === 'floating'
                          ? 'bg-purple-600/20 border-purple-500 text-white shadow-lg shadow-purple-600/10'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-extrabold text-sm text-white">عائم كبسولة (Floating Capsule)</div>
                        <p className="text-[11px] text-slate-400 mt-0.5">شريط عائم بزوايا دائرية وهامش علوي أنيق.</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Header Backdrop Blur Strength */}
                <div className="pt-4 border-t border-slate-800">
                  <label className="block text-slate-300 font-bold mb-3">قوة الضبابية الزجاجية (Backdrop Blur Effect):</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: 'none', label: 'بدون (خلفية داكنة صلبة)' },
                      { id: 'light', label: 'ضبابي خفيف (Light Blur)' },
                      { id: 'medium', label: 'زجاجي متوسط (Medium)' },
                      { id: 'heavy', label: 'زجاجي كثيف (Ultra Glass)' },
                    ].map((blur) => (
                      <button
                        key={blur.id}
                        onClick={() => setHeaderBlur(blur.id as any)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          headerBlur === blur.id
                            ? 'bg-purple-600/20 border-purple-500 text-purple-300 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        {blur.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PLATFORM ICONS & COLORS */}
          {activeSubTab === 'platforms' && (
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Globe className="w-5 h-5 text-emerald-400" />
                    <span>تخصيص أيقونات وألوان المنصات (Platform Icons & Colors)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    يمكنك تغيير صور أو أيقونات أي منصة (TikTok, YouTube, Instagram...) أو تخصيص لون الشارة الخاص بها.
                  </p>
                </div>
                <button
                  onClick={handleResetPlatforms}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold border border-slate-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>إعادة الضبط</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
                {platformList.map((p) => {
                  const customIcon = platformIconsCustom[p.slug] || '';
                  const customColor = platformColorsCustom[p.slug] || '';

                  return (
                    <div key={p.slug} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                            {customIcon ? (
                              <img src={customIcon} alt={p.name} className="w-5 h-5 object-contain rounded" />
                            ) : (
                              getPlatformDefaultIcon(p.slug)
                            )}
                          </div>
                          <span className="font-bold text-white text-xs">{p.name}</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-slate-900 text-slate-400 border border-slate-800">
                          {p.slug}
                        </span>
                      </div>

                      <div className="space-y-2 text-[11px]">
                        <div>
                          <label className="block text-slate-400 font-semibold mb-1">رابط صورة/أيقونة مخصصة (URL):</label>
                          <input
                            type="url"
                            value={customIcon}
                            onChange={(e) => handleUpdatePlatformIcon(p.slug, e.target.value)}
                            placeholder="https://example.com/icon.svg"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px] focus:border-purple-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 font-semibold mb-1">لون تمييز المنصة (Accent Color):</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={customColor || '#3b82f6'}
                              onChange={(e) => handleUpdatePlatformColor(p.slug, e.target.value)}
                              className="w-8 h-7 rounded bg-slate-900 border border-slate-800 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={customColor}
                              onChange={(e) => handleUpdatePlatformColor(p.slug, e.target.value)}
                              placeholder="#HEX (افتراضي)"
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white font-mono text-[11px] uppercase"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: SYSTEM COLORS & UI */}
          {activeSubTab === 'design' && (
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-amber-400" />
                  <span>الألوان الرئيسية والخطوط وحواف الأزرار (Design System)</span>
                </h3>
              </div>

              <div className="space-y-5 text-xs">
                {/* Primary & Secondary Color Pickers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-bold mb-2">اللون الأساسي (Primary Accent Color)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-12 h-10 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono uppercase font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-2">اللون الثانوي للتدرجات (Secondary Accent Color)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-12 h-10 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono uppercase font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Font Family Selection */}
                <div>
                  <label className="block text-slate-300 font-bold mb-2">نوع الخط العام لجميع الصفحات (Font Family)</label>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold focus:border-purple-500"
                  >
                    <option value="Plus Jakarta Sans">Plus Jakarta Sans / Cairo (الافتراضي العصري)</option>
                    <option value="Alexandria">Alexandria (خط عربي أنيق ومتناسق)</option>
                    <option value="Tajawal">Tajawal (خط واثق وعالي المقروئية)</option>
                    <option value="Cairo">Cairo (خط عربي قياسي شائع)</option>
                    <option value="Inter">Inter (خط تقني عالمي)</option>
                    <option value="Outfit">Outfit (تصميم ذكي وبارز)</option>
                  </select>
                </div>

                {/* Button Radius Selection */}
                <div>
                  <label className="block text-slate-300 font-bold mb-2">حجم زوايا وحواف الأزرار (Button Border Radius):</label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {[
                      { id: 'rounded-none', label: 'حادة 0px' },
                      { id: 'rounded-lg', label: 'صغيرة 8px' },
                      { id: 'rounded-xl', label: 'متوسطة 12px' },
                      { id: 'rounded-2xl', label: 'كبيرة 16px' },
                      { id: 'rounded-full', label: 'كبسولة Full' },
                    ].map((rad) => (
                      <button
                        key={rad.id}
                        onClick={() => setButtonRadius(rad.id as any)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          buttonRadius === rad.id
                            ? 'bg-purple-600/20 border-purple-500 text-purple-300 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        {rad.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Card Surface Style */}
                <div>
                  <label className="block text-slate-300 font-bold mb-2">نمط البطاقات والأسطح (Card Surface Theme):</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: 'glass', label: 'زجاجي شفاف (Glassmorphic)' },
                      { id: 'solid', label: 'داكن صلب (Solid Slate)' },
                      { id: 'bordered', label: 'إطار نيون (Glow Border)' },
                      { id: 'neon', label: 'مخطط بسيط (Outline Minimal)' },
                    ].map((cs) => (
                      <button
                        key={cs.id}
                        onClick={() => setCardStyle(cs.id as any)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          cardStyle === cs.id
                            ? 'bg-purple-600/20 border-purple-500 text-purple-300 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        {cs.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CUSTOM CODE INJECTOR */}
          {activeSubTab === 'custom_code' && (
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Code className="w-5 h-5 text-sky-400" />
                  <span>محقن أكواد CSS و JavaScript المخصصة (Custom Styling & Injector)</span>
                </h3>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5 flex items-center justify-between">
                    <span>تنسيقات CSS المخصصة (Custom CSS):</span>
                    <span className="text-[10px] text-slate-500 font-normal">يتم تطبيقها فوراً على كل مكونات الموقع</span>
                  </label>
                  <textarea
                    rows={6}
                    value={customCss}
                    onChange={(e) => setCustomCss(e.target.value)}
                    placeholder="/* مثال: */&#10;header { border-bottom-color: #9333ea !important; }&#10;button { transition: all 0.3s ease; }"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-emerald-400 font-mono text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">أكواد Header JavaScript مخصصة (Custom Scripts):</label>
                  <textarea
                    rows={4}
                    value={customJs}
                    onChange={(e) => setCustomJs(e.target.value)}
                    placeholder="// أدخل أي أكواد تتبع أو إحصائيات هنا"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sky-400 font-mono text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* LIVE PREVIEW PANEL (LG:COL-SPAN-5) */}
        <div className="lg:col-span-5 space-y-4 sticky top-6">
          <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">معاينة حية للمكونات (Live Component Preview)</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                تحديث فوري
              </span>
            </div>

            {/* Simulated Canvas Background */}
            <div
              className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-5 overflow-hidden"
              style={{ fontFamily: fontFamily }}
            >
              {/* Simulated Header Navbar */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/90 backdrop-blur-md flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" style={{ height: `${Math.min(logoHeightPx, 32)}px` }} className="object-contain" />
                  ) : (
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                    >
                      O
                    </div>
                  )}
                  <span className="font-extrabold text-white text-xs tracking-tight">{siteName}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-bold text-white" style={{ backgroundColor: primaryColor }}>
                    {shortName}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300">
                  <span className="px-2 py-1 rounded-lg bg-slate-800">الرئيسية</span>
                  <span className="px-2 py-1 rounded-lg bg-slate-800 text-indigo-300">المنصات</span>
                </div>
              </div>

              {/* Simulated Search Hero */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-3">
                <div className="text-center space-y-1">
                  <h4 className="font-black text-white text-xs">أداة تحميل الفيديوهات المتقدمة (Hero)</h4>
                  <p className="text-[10px] text-slate-400">انسخ رابط الفيديو واضغط تحميل بأعلى جودة</p>
                </div>

                <div className="flex gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value="https://tiktok.com/@user/video/123..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-400 font-mono"
                  />
                  <button
                    className={`px-3 py-1.5 text-[11px] font-extrabold text-white shadow-md transition ${buttonRadius}`}
                    style={{ backgroundColor: primaryColor }}
                  >
                    تحميل
                  </button>
                </div>
              </div>

              {/* Simulated Download Result Card Subset */}
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800/90 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                    <Video className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-extrabold text-white truncate block">مقطع فيديو ترفيهي بدقة عالية HD</span>
                    <span className="text-[9px] text-slate-400 block font-mono">24.5 MB • 1080p Full HD</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    className={`flex-1 py-1.5 px-2 text-[10px] font-extrabold text-white rounded-lg shadow-sm flex items-center justify-center gap-1 ${buttonRadius}`}
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Download className="w-3 h-3" />
                    <span>تحميل HD (MP4)</span>
                  </button>
                  <button
                    className={`py-1.5 px-2 text-[10px] font-bold text-slate-200 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center gap-1 ${buttonRadius}`}
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>صوت MP3</span>
                  </button>
                </div>
              </div>

              {/* Simulated Platform Cards */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 block">معاينة أيقونات المنصات المخصصة:</span>
                <div className="grid grid-cols-2 gap-2">
                  {platformList.slice(0, 4).map((p) => {
                    const customIcon = platformIconsCustom[p.slug];
                    const customColor = platformColorsCustom[p.slug];

                    return (
                      <div
                        key={p.slug}
                        className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]"
                      >
                        <div className="flex items-center gap-2">
                          {customIcon ? (
                            <img src={customIcon} alt={p.name} className="w-4 h-4 object-contain rounded" />
                          ) : (
                            getPlatformDefaultIcon(p.slug)
                          )}
                          <span className="font-bold text-white text-[11px]">{p.name}</span>
                        </div>
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: customColor || primaryColor }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Theme Settings Specs Summary */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[10px] text-slate-400 space-y-1 font-mono">
                <div>الخط: {fontFamily}</div>
                <div>اللون الأساسي: {primaryColor}</div>
                <div>أسلوب الهيدر: {headerStyle}</div>
                <div>الحواف: {buttonRadius}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
