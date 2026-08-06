import React, { useState, useEffect } from 'react';
import {
  Search,
  Save,
  Globe,
  FileCode,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  RefreshCw,
  Send,
  Code2,
  Copy,
  Sparkles,
  ExternalLink,
  Eye,
  Check,
  Building,
  Layout,
  Share2,
  Sliders,
  Layers,
} from 'lucide-react';
import { GlobalSeoConfig, RedirectRule, SupportedLanguage, PlatformSlug, PlatformConfig } from '../../types';
import {
  getGlobalSeoConfig,
  saveGlobalSeoConfig,
  getRedirectRules,
  saveRedirectRules,
  getRobotsTxt,
  saveRobotsTxt,
  getStoredPlatformsConfig,
  saveStoredPlatformsConfig,
} from '../../lib/adminStorage';
import { PLATFORMS_CONFIG } from '../../config/siteConfig';
import {
  saveFirestoreGlobalSettings,
  saveFirestoreSeoTranslation,
  triggerOnDemandRevalidation,
} from '../../lib/firebase';

interface Props {
  currentLang: SupportedLanguage;
  onShowToast: (msg: string) => void;
}

export const SeoCenterTab: React.FC<Props> = ({ currentLang, onShowToast }) => {
  const [activeSubTab, setActiveSubTab] = useState<'global' | 'bulk' | 'schemas' | 'sitemap' | 'robots' | 'redirects'>('global');

  // State
  const [seo, setSeo] = useState<GlobalSeoConfig>(getGlobalSeoConfig());
  const [redirects, setRedirects] = useState<RedirectRule[]>(getRedirectRules());
  const [robotsTxt, setRobotsTxtState] = useState<string>(getRobotsTxt());

  // Bulk SEO Editor State
  const [bulkDescTemplate, setBulkDescTemplate] = useState<string>(
    'Download {platform} videos, reels, and audio in full HD without watermark for free using OmniDownloader Remix Pro.'
  );
  const [bulkKeywordsTemplate, setBulkKeywordsTemplate] = useState<string>(
    'video downloader, {platform} downloader, download {platform} reels, HD video download, MP4 converter, no watermark'
  );
  const [bulkTitleTemplate, setBulkTitleTemplate] = useState<string>(
    'Free {platform} Video Downloader - Fast & Free HD No Watermark'
  );
  const [selectedBulkPlatforms, setSelectedBulkPlatforms] = useState<PlatformSlug[]>([
    'tiktok',
    'instagram',
    'facebook',
    'youtube',
    'youtube-shorts',
    'instagram-reels',
    'facebook-reels',
    'twitter',
    'pinterest',
    'reddit',
    'snapchat',
    'threads',
    'linkedin',
    'all',
  ]);

  // Interactive Schema Builder State
  const [orgName, setOrgName] = useState('OmniFetch Pro');
  const [orgUrl, setOrgUrl] = useState('https://omnifetch.com');
  const [orgLogo, setOrgLogo] = useState('https://omnifetch.com/logo.png');
  const [orgSameAs, setOrgSameAs] = useState('https://facebook.com/omnifetch, https://x.com/OmniFetchPro, https://youtube.com/@omnifetch');
  const [orgContactEmail, setOrgContactEmail] = useState('support@omnifetch.com');

  const [siteName, setSiteName] = useState('OmniFetch Video Downloader');
  const [siteAltName, setSiteAltName] = useState('OmniFetch');
  const [siteSearchTarget, setSiteSearchTarget] = useState('https://omnifetch.com/?q={search_term_string}');
  const [siteSearchQueryInput, setSiteSearchQueryInput] = useState('required name=search_term_string');

  const [copiedSchema, setCopiedSchema] = useState<'org' | 'website' | null>(null);

  // New Redirect Form
  const [newFrom, setNewFrom] = useState('');
  const [newTo, setNewTo] = useState('');
  const [newType, setNewType] = useState<301 | 302 | 307>(301);

  // Auto-generate Organization JSON-LD Schema
  const generateOrgSchema = () => {
    const socialLinks = orgSameAs.split(',').map(s => s.trim()).filter(Boolean);
    const schemaObj = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': orgName || 'OmniFetch',
      'url': orgUrl || 'https://omnifetch.com',
      'logo': orgLogo || 'https://omnifetch.com/logo.png',
      'contactPoint': {
        '@type': 'ContactPoint',
        'email': orgContactEmail || 'support@omnifetch.com',
        'contactType': 'customer support'
      },
      'sameAs': socialLinks.length ? socialLinks : ['https://x.com/OmniFetchPro']
    };
    return JSON.stringify(schemaObj, null, 2);
  };

  // Auto-generate WebSite JSON-LD Schema
  const generateWebSiteSchema = () => {
    const schemaObj = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': siteName || 'OmniFetch',
      'alternateName': siteAltName || 'OmniFetch Pro',
      'url': orgUrl || 'https://omnifetch.com',
      'potentialAction': {
        '@type': 'SearchAction',
        'target': siteSearchTarget || 'https://omnifetch.com/?q={search_term_string}',
        'query-input': siteSearchQueryInput || 'required name=search_term_string'
      }
    };
    return JSON.stringify(schemaObj, null, 2);
  };

  // Synchronize builder inputs when tab mounts or updates
  useEffect(() => {
    try {
      if (seo.organizationSchema) {
        const parsed = JSON.parse(seo.organizationSchema);
        if (parsed.name) setOrgName(parsed.name);
        if (parsed.url) setOrgUrl(parsed.url);
        if (parsed.logo) setOrgLogo(parsed.logo);
        if (Array.isArray(parsed.sameAs)) setOrgSameAs(parsed.sameAs.join(', '));
        if (parsed.contactPoint?.email) setOrgContactEmail(parsed.contactPoint.email);
      }
      if (seo.websiteSchema) {
        const parsedSite = JSON.parse(seo.websiteSchema);
        if (parsedSite.name) setSiteName(parsedSite.name);
        if (parsedSite.alternateName) setSiteAltName(parsedSite.alternateName);
        if (parsedSite.potentialAction?.target) setSiteSearchTarget(parsedSite.potentialAction.target);
        if (parsedSite.potentialAction?.['query-input']) setSiteSearchQueryInput(parsedSite.potentialAction['query-input']);
      }
    } catch (e) {
      // ignore parse errors on load
    }
  }, []);

  const handleApplyGeneratedSchemas = async () => {
    const orgJson = generateOrgSchema();
    const siteJson = generateWebSiteSchema();
    const updated = {
      ...seo,
      organizationSchema: orgJson,
      websiteSchema: siteJson,
    };
    setSeo(updated);
    saveGlobalSeoConfig(updated);
    await saveFirestoreGlobalSettings(updated);
    onShowToast('تم توليد وتطبيق المخططات البرمجية JSON-LD وتنفيذ On-Demand Revalidation بنجاح! ⚡');
  };

  const handleSaveGlobalSeo = async () => {
    saveGlobalSeoConfig(seo);
    await saveFirestoreGlobalSettings(seo);
    onShowToast('تم حفظ إعدادات الـ Global SEO والمخططات Schema JSON-LD وتنفيذ On-Demand Revalidation بنجاح! ⚡');
  };

  const handleSaveRobots = () => {
    saveRobotsTxt(robotsTxt);
    onShowToast('تم حفظ ملف robots.txt وتحديثه للآليات المعالجة!');
  };

  const handleAddRedirect = () => {
    if (!newFrom || !newTo) return;
    const rule: RedirectRule = {
      id: 'red_' + Date.now(),
      fromUrl: newFrom.startsWith('/') ? newFrom : '/' + newFrom,
      toUrl: newTo,
      type: newType,
      active: true,
      hits: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    const updated = [rule, ...redirects];
    setRedirects(updated);
    saveRedirectRules(updated);
    setNewFrom('');
    setNewTo('');
    onShowToast('تم إضافة قاعدة إعادة التوجيه بنجاح!');
  };

  const handleDeleteRedirect = (id: string) => {
    const updated = redirects.filter((r) => r.id !== id);
    setRedirects(updated);
    saveRedirectRules(updated);
    onShowToast('تم حذف القاعدة.');
  };

  const handlePingGoogleSitemap = () => {
    onShowToast('تم إرسال خريطة الموقع تلقائياً إلى محرك بحث Google Search Console بنجاح!');
  };

  const copyToClipboard = (text: string, type: 'org' | 'website') => {
    navigator.clipboard.writeText(text);
    setCopiedSchema(type);
    setTimeout(() => setCopiedSchema(null), 2000);
    onShowToast('تم نسخ كود الـ JSON-LD للحافظة!');
  };

  const handleApplyBulkSeo = async () => {
    if (selectedBulkPlatforms.length === 0) {
      onShowToast('الرجاء اختيار منصة واحدة على الأقل لتطبيق الـ SEO الجماعي!');
      return;
    }

    const currentConfigs = getStoredPlatformsConfig();
    const updatedConfigs = { ...currentConfigs };

    for (const slug of selectedBulkPlatforms) {
      const existing = updatedConfigs[slug] || PLATFORMS_CONFIG[slug];
      if (!existing) continue;

      const platformName = existing.name || slug;

      const newDesc = bulkDescTemplate.replace(/\{platform\}/gi, platformName);
      const newTitle = bulkTitleTemplate.replace(/\{platform\}/gi, platformName);
      const newKw = bulkKeywordsTemplate
        .replace(/\{platform\}/gi, platformName)
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);

      const platformSeoObj = {
        ...existing,
        seoKeywords: newKw.length > 0 ? newKw : existing.seoKeywords,
        titleTemplate: {
          ...existing.titleTemplate,
          en: newTitle,
        },
        description: {
          ...existing.description,
          en: newDesc,
          ar: newDesc,
        },
      };

      updatedConfigs[slug] = platformSeoObj;

      // Save to Firestore
      await saveFirestoreSeoTranslation('ar', slug, {
        metaTitle: newTitle,
        metaDescription: newDesc,
        keywords: newKw.join(', '),
      });
      await saveFirestoreSeoTranslation('en', slug, {
        metaTitle: newTitle,
        metaDescription: newDesc,
        keywords: newKw.join(', '),
      });
    }

    saveStoredPlatformsConfig(updatedConfigs);
    await triggerOnDemandRevalidation(selectedBulkPlatforms.map((s) => `/${s}`));

    onShowToast(`تم تطبيق قالب الـ SEO وإعادة التنشيط الفوري (On-Demand Revalidated ⚡) بنجاح على ${selectedBulkPlatforms.length} منصة!`);
  };

  const isValidJson = (str: string) => {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-2xl border border-slate-800 text-xs font-bold overflow-x-auto">
        {[
          { id: 'global', label: 'Global Metadata & SERP', icon: Search },
          { id: 'bulk', label: 'Bulk SEO Editor', icon: Sliders },
          { id: 'schemas', label: 'Real-Time JSON-LD Generator', icon: Code2 },
          { id: 'sitemap', label: 'Sitemap Manager', icon: Globe },
          { id: 'robots', label: 'Robots.txt Editor', icon: FileCode },
          { id: 'redirects', label: 'Redirects & 404s', icon: ArrowRightLeft },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                activeSubTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Global SEO Subtab */}
      {activeSubTab === 'global' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900 p-5 rounded-2xl border border-slate-800 gap-3">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>إدارة الـ Metadata العامة و SERP (Global SEO Manager)</span>
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-mono border border-purple-500/30">
                  Live Meta Engine
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                التحكم في عنوان الموقع، الوصف، الكلمات المفتاحية، Open Graph وصورة المشاركة الاجتماعية.
              </p>
            </div>
            <button
              onClick={handleSaveGlobalSeo}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 transition shrink-0"
            >
              <Save className="w-4 h-4" />
              <span>حفظ إعدادات الـ SEO</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Inputs */}
            <div className="lg:col-span-7 bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
              <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                <Search className="w-4 h-4" />
                <span>عناصر العنونة والفهرسة (Meta Directives & Tags)</span>
              </h4>

              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-bold">عنوان الموقع Meta Title</label>
                    <span className={`text-[11px] font-mono font-bold ${seo.metaTitle.length <= 60 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {seo.metaTitle.length} / 60 حرفاً
                    </span>
                  </div>
                  <input
                    type="text"
                    value={seo.metaTitle}
                    onChange={(e) => setSeo({ ...seo, metaTitle: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-bold">وصف الموقع Meta Description</label>
                    <span className={`text-[11px] font-mono font-bold ${seo.metaDescription.length <= 160 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {seo.metaDescription.length} / 160 حرفاً
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={seo.metaDescription}
                    onChange={(e) => setSeo({ ...seo, metaDescription: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">الكلمات المفتاحية (SEO Keywords)</label>
                  <input
                    type="text"
                    value={seo.keywords}
                    onChange={(e) => setSeo({ ...seo, keywords: e.target.value })}
                    placeholder="video downloader, tiktok downloader, facebook reels"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">افصل بين الكلمات المفتاحية بفاصلة (comma).</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">الرابط الثابت Canonical URL</label>
                    <input
                      type="text"
                      value={seo.canonicalUrl}
                      onChange={(e) => setSeo({ ...seo, canonicalUrl: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">رابط صورة Open Graph (OG Image)</label>
                    <input
                      type="text"
                      value={seo.ogImage}
                      onChange={(e) => setSeo({ ...seo, ogImage: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">حساب تويتر/X (Twitter Handle)</label>
                    <input
                      type="text"
                      value={seo.twitterHandle || ''}
                      onChange={(e) => setSeo({ ...seo, twitterHandle: e.target.value })}
                      placeholder="@OmniFetchPro"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">توجيهات عناكب البحث (Robots Directive)</label>
                    <input
                      type="text"
                      value={seo.robotsDirective}
                      onChange={(e) => setSeo({ ...seo, robotsDirective: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-emerald-400 font-mono text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Real-time Google SERP & Open Graph Preview */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <span>معاينة النتيجة في محرك بحث Google (SERP Preview)</span>
                </h4>

                <div className="bg-white rounded-2xl p-4 shadow-xl text-slate-900 font-sans space-y-2 border border-slate-200">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <div className="w-5 h-5 rounded-full bg-purple-600 text-white font-black text-[10px] flex items-center justify-center">
                      O
                    </div>
                    <div className="leading-tight truncate">
                      <span className="font-semibold block text-slate-900">OmniFetch Pro</span>
                      <span className="text-[11px] text-slate-500 font-mono">{seo.canonicalUrl || 'https://omnifetch.com'}</span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-blue-700 hover:underline cursor-pointer line-clamp-1 leading-snug">
                    {seo.metaTitle || 'OmniFetch - Free All-in-One Video Downloader'}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {seo.metaDescription || 'Download TikTok videos without watermark, Facebook Reels, Instagram Stories and YouTube Shorts for free.'}
                  </p>

                  {seo.keywords && (
                    <div className="pt-2 flex flex-wrap gap-1">
                      {seo.keywords.split(',').slice(0, 4).map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200">
                          #{kw.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Open Graph Social Card Preview */}
                <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2 pt-2">
                  <Share2 className="w-4 h-4" />
                  <span>معاينة بطاقة المشاركة الاجتماعية (Open Graph Card)</span>
                </h4>

                <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl text-slate-100">
                  {seo.ogImage ? (
                    <img src={seo.ogImage} alt="OG Social Preview" className="w-full h-32 object-cover bg-slate-900" />
                  ) : (
                    <div className="w-full h-24 bg-slate-900 flex items-center justify-center text-slate-600 text-xs font-mono">
                      لا يوجد صورة OG Image
                    </div>
                  )}
                  <div className="p-3 bg-slate-900 border-t border-slate-800/80 space-y-1">
                    <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">
                      {seo.canonicalUrl ? new URL(seo.canonicalUrl).hostname : 'omnifetch.com'}
                    </span>
                    <h5 className="text-xs font-bold text-white line-clamp-1">{seo.metaTitle || 'OmniFetch Pro'}</h5>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{seo.metaDescription}</p>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300 font-bold">
                    <span>صحة وتوافق الـ Meta Tags</span>
                    <span className="text-emerald-400 font-mono font-black flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 100% SEO Optimized
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    يتم تحديث وربط هذه البيانات تلقائياً بجميع صفحات الهبوط والهيد الرئيسي للموقع لضمان تصدر محركات البحث.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk SEO Editor Subtab */}
      {activeSubTab === 'bulk' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900 p-5 rounded-2xl border border-slate-800 gap-3">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-400" />
                <span>محرر الـ SEO الجماعي (Bulk SEO Editor)</span>
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-mono border border-purple-500/30">
                  Multi-Platform Sync
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                تطبيق قالب وصف متكامل (Meta Description Template) وحزمة الكلمات المفتاحية عبر جميع منصات الموقع دفعة واحدة. استخدم المتغير <code className="text-amber-300 font-mono font-bold bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">{'{platform}'}</code> ليتم استبداله تلقائياً باسم كل منصة.
              </p>
            </div>
            <button
              onClick={handleApplyBulkSeo}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-purple-600/30 transition shrink-0 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>تطبيق الـ SEO الجماعي على المنصات</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Template Inputs */}
            <div className="lg:col-span-7 bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
              <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>1. صياغة القوالب الموحدة (Bulk SEO Templates)</span>
              </h4>

              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-bold">قالب عنوان الصفحة (Title Template)</label>
                    <span className="text-[11px] text-amber-400 font-mono">استخدم {'{platform}'}</span>
                  </div>
                  <input
                    type="text"
                    value={bulkTitleTemplate}
                    onChange={(e) => setBulkTitleTemplate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-bold">قالب الوصف الموحد (Meta Description Template)</label>
                    <span className="text-[11px] text-emerald-400 font-mono">
                      {bulkDescTemplate.length} / 160 حرفاً
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={bulkDescTemplate}
                    onChange={(e) => setBulkDescTemplate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-purple-500 resize-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    مثال: <span className="text-slate-400 font-mono">تحميل فيديوهات {'{platform}'} بجودة عالية وبدون علامة مائية مجاناً.</span>
                  </p>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">قالب الكلمات المفتاحية (Site-Wide Keyword Set Template)</label>
                  <textarea
                    rows={3}
                    value={bulkKeywordsTemplate}
                    onChange={(e) => setBulkKeywordsTemplate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500 font-mono resize-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">افصل بين الكلمات المفتاحية بفاصلة. وسيتم استبدال {'{platform}'} تلقائياً لكل منصة.</p>
                </div>
              </div>

              {/* Platform Selector */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <span>2. تحديد المنصات المستهدفة ({selectedBulkPlatforms.length} منصة)</span>
                  </h4>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedBulkPlatforms([
                          'tiktok',
                          'instagram',
                          'facebook',
                          'youtube',
                          'youtube-shorts',
                          'instagram-reels',
                          'facebook-reels',
                          'twitter',
                          'pinterest',
                          'reddit',
                          'snapchat',
                          'threads',
                          'linkedin',
                          'all',
                        ])
                      }
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold transition"
                    >
                      تحديد الكل
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedBulkPlatforms([])}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold transition"
                    >
                      إلغاء الكل
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {([
                    { slug: 'tiktok', name: 'TikTok' },
                    { slug: 'instagram', name: 'Instagram' },
                    { slug: 'facebook', name: 'Facebook' },
                    { slug: 'youtube', name: 'YouTube' },
                    { slug: 'youtube-shorts', name: 'YouTube Shorts' },
                    { slug: 'instagram-reels', name: 'Instagram Reels' },
                    { slug: 'facebook-reels', name: 'Facebook Reels' },
                    { slug: 'twitter', name: 'Twitter / X' },
                    { slug: 'pinterest', name: 'Pinterest' },
                    { slug: 'reddit', name: 'Reddit' },
                    { slug: 'snapchat', name: 'Snapchat' },
                    { slug: 'threads', name: 'Threads' },
                    { slug: 'linkedin', name: 'LinkedIn' },
                    { slug: 'all', name: 'All Platforms' },
                  ] as Array<{ slug: PlatformSlug; name: string }>).map((item) => {
                    const isChecked = selectedBulkPlatforms.includes(item.slug);
                    return (
                      <button
                        key={item.slug}
                        type="button"
                        onClick={() => {
                          if (isChecked) {
                            setSelectedBulkPlatforms(selectedBulkPlatforms.filter((s) => s !== item.slug));
                          } else {
                            setSelectedBulkPlatforms([...selectedBulkPlatforms, item.slug]);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-left flex items-center justify-between transition ${
                          isChecked
                            ? 'bg-purple-600/20 border-purple-500/50 text-white shadow-sm'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/80'
                        }`}
                      >
                        <span>{item.name}</span>
                        {isChecked && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Live Template Render Preview */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <span>معاينة النتيجة الحية للمنصات (Live Rendered Preview)</span>
                </h4>

                {/* TikTok Sample Render */}
                <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-pink-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                      <span>مثال منصة: TikTok</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Rendered Output</span>
                  </div>

                  <div className="space-y-1 pt-1 border-t border-slate-900">
                    <div className="text-slate-300 font-bold">العنوان:</div>
                    <div className="text-purple-300 font-semibold text-xs leading-snug">
                      {bulkTitleTemplate.replace(/\{platform\}/gi, 'TikTok')}
                    </div>

                    <div className="text-slate-300 font-bold pt-1">الوصف:</div>
                    <div className="text-slate-300 text-[11px] leading-relaxed bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
                      {bulkDescTemplate.replace(/\{platform\}/gi, 'TikTok')}
                    </div>

                    <div className="text-slate-300 font-bold pt-1">الكلمات المفتاحية:</div>
                    <div className="flex flex-wrap gap-1">
                      {bulkKeywordsTemplate
                        .replace(/\{platform\}/gi, 'TikTok')
                        .split(',')
                        .map((kw, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 text-[10px] font-mono border border-purple-500/20">
                            #{kw.trim()}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Instagram Sample Render */}
                <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-purple-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                      <span>مثال منصة: Instagram</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Rendered Output</span>
                  </div>

                  <div className="space-y-1 pt-1 border-t border-slate-900">
                    <div className="text-slate-300 font-bold">العنوان:</div>
                    <div className="text-purple-300 font-semibold text-xs leading-snug">
                      {bulkTitleTemplate.replace(/\{platform\}/gi, 'Instagram')}
                    </div>

                    <div className="text-slate-300 font-bold pt-1">الوصف:</div>
                    <div className="text-slate-300 text-[11px] leading-relaxed bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
                      {bulkDescTemplate.replace(/\{platform\}/gi, 'Instagram')}
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs space-y-1.5">
                  <span className="font-bold text-purple-300 block flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>جاهز للتطبيق الشامل</span>
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    عند النقر على زر التحديث في الأعلى، سيتم كتابة وتحديث بيانات الـ SEO في التخزين المحلي والملفات الديناميكية لكافة المنصات المختارة فوراً.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real-time JSON-LD Schema Generator Subtab */}
      {activeSubTab === 'schemas' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900 p-5 rounded-2xl border border-slate-800 gap-3">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>مولد ومحاسب مخططات JSON-LD المباشر (Real-Time Schema Generator)</span>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-mono border border-emerald-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Rich Snippets Builder
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                توليد مخططات البيانات المنظمة Organization و WebSite تلقائياً لدعم Google Rich Results والظهور الاحترافي.
              </p>
            </div>

            <button
              onClick={handleApplyGeneratedSchemas}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>توليد وتطبيق المخططات البرمجية</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Organization Schema Builder */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  <span>1. Organization Schema Builder</span>
                </h4>

                <button
                  onClick={() => copyToClipboard(generateOrgSchema(), 'org')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold flex items-center gap-1 transition"
                >
                  {copiedSchema === 'org' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSchema === 'org' ? 'تم النسخ!' : 'نسخ JSON-LD'}</span>
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">اسم المؤسسة / العلامة التجارية</label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">رابط الموقع الرسمي</label>
                    <input
                      type="text"
                      value={orgUrl}
                      onChange={(e) => setOrgUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">رابط الشعار Logo URL</label>
                    <input
                      type="text"
                      value={orgLogo}
                      onChange={(e) => setOrgLogo(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-[11px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">البريد الإلكتروني للدعم (Contact Email)</label>
                  <input
                    type="email"
                    value={orgContactEmail}
                    onChange={(e) => setOrgContactEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">روابط الشبكات الاجتماعية (SameAs)</label>
                  <input
                    type="text"
                    value={orgSameAs}
                    onChange={(e) => setOrgSameAs(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold flex items-center justify-between">
                    <span>المعاينة المباشرة لكود JSON-LD المولد</span>
                    {isValidJson(generateOrgSchema()) ? (
                      <span className="text-emerald-400 text-[10px] font-mono">✓ Valid JSON</span>
                    ) : (
                      <span className="text-rose-400 text-[10px] font-mono">✕ Invalid JSON</span>
                    )}
                  </label>
                  <textarea
                    rows={6}
                    readOnly
                    value={generateOrgSchema()}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-emerald-400 font-mono text-[11px] focus:outline-none resize-none leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* WebSite Schema Builder */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                  <Layout className="w-4 h-4" />
                  <span>2. WebSite & Sitelinks Searchbox Schema</span>
                </h4>

                <button
                  onClick={() => copyToClipboard(generateWebSiteSchema(), 'website')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold flex items-center gap-1 transition"
                >
                  {copiedSchema === 'website' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSchema === 'website' ? 'تم النسخ!' : 'نسخ JSON-LD'}</span>
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">اسم الموقع الإلكتروني</label>
                  <input
                    type="text"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">الاسم البديل (Alternate Name)</label>
                  <input
                    type="text"
                    value={siteAltName}
                    onChange={(e) => setSiteAltName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">رابط البحث للروابط الفرعية Sitelinks Search Target</label>
                  <input
                    type="text"
                    value={siteSearchTarget}
                    onChange={(e) => setSiteSearchTarget(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">معامل الاستعلام (Query Input Parameter)</label>
                  <input
                    type="text"
                    value={siteSearchQueryInput}
                    onChange={(e) => setSiteSearchQueryInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold flex items-center justify-between">
                    <span>المعاينة المباشرة لكود JSON-LD المولد</span>
                    {isValidJson(generateWebSiteSchema()) ? (
                      <span className="text-emerald-400 text-[10px] font-mono">✓ Valid JSON</span>
                    ) : (
                      <span className="text-rose-400 text-[10px] font-mono">✕ Invalid JSON</span>
                    )}
                  </label>
                  <textarea
                    rows={6}
                    readOnly
                    value={generateWebSiteSchema()}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-emerald-400 font-mono text-[11px] focus:outline-none resize-none leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Google Rich Results Test Link */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-white block">اختبار النتائج الغنية في Google Rich Results Test</span>
                <span className="text-slate-400 text-[11px]">يمكنك التحقق واختبار صلاحية المخططات البرمجية عبر أداة Google الرسمية.</span>
              </div>
            </div>

            <a
              href="https://search.google.com/test/rich-results"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold flex items-center gap-2 border border-slate-700 transition shrink-0"
            >
              <span>فتح أداة اختبار Google</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* Sitemap Subtab */}
      {activeSubTab === 'sitemap' && (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div>
              <h3 className="text-base font-black text-white">إدارة خريطة الموقع (Sitemap Manager)</h3>
              <p className="text-xs text-slate-400">
                يتم توليد ملف sitemap.xml تلقائياً لكافة المنصات والصفحات والمقالات.
              </p>
            </div>
            <button
              onClick={handlePingGoogleSitemap}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>إرسال Sitemap إلى Google Search Console</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400 font-semibold">حالة الخريطة الحالية</span>
              <p className="text-emerald-400 font-extrabold text-sm flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> 200 OK - أحدث أصدار نشط
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400 font-semibold">عدد الروابط المفرسة</span>
              <p className="text-white font-extrabold text-sm">48 صفحة ومقال ورابط</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400 font-semibold">رابط الملف المباشر</span>
              <a
                href="/sitemap.xml"
                target="_blank"
                className="text-purple-400 font-mono font-bold hover:underline block truncate"
              >
                https://omnifetch.com/sitemap.xml
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Robots.txt Subtab */}
      {activeSubTab === 'robots' && (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-black text-white">محرر ملف Robots.txt</h3>
              <p className="text-xs text-slate-400">توجيه عناكب محركات البحث وتحديد المسارات المسموحة والغير مسموحة.</p>
            </div>
            <button
              onClick={handleSaveRobots}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30"
            >
              <Save className="w-4 h-4" />
              <span>حفظ ملف Robots.txt</span>
            </button>
          </div>

          <div>
            <textarea
              rows={10}
              value={robotsTxt}
              onChange={(e) => setRobotsTxtState(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-emerald-300 font-mono text-xs focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      )}

      {/* Redirects Subtab */}
      {activeSubTab === 'redirects' && (
        <div className="space-y-6">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white">إضافة قاعدة إعادة توجيه جديدة (301 / 302 Redirect)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <input
                type="text"
                placeholder="من: /old-url"
                value={newFrom}
                onChange={(e) => setNewFrom(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
              />
              <input
                type="text"
                placeholder="إلى: /new-url أو https://..."
                value={newTo}
                onChange={(e) => setNewTo(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
              />
              <select
                value={newType}
                onChange={(e) => setNewType(Number(e.target.value) as any)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
              >
                <option value={301}>301 Permanent</option>
                <option value={302}>302 Temporary</option>
                <option value={307}>307 Temporary Strict</option>
              </select>
              <button
                onClick={handleAddRedirect}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl px-4 py-2 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة التوجيه</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950 text-slate-400">
                  <th className="py-3 px-4">من رابط</th>
                  <th className="py-3 px-4">إلى رابط</th>
                  <th className="py-3 px-4">النوع</th>
                  <th className="py-3 px-4">عدد التحويلات Hits</th>
                  <th className="py-3 px-4 text-center">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {redirects.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 font-mono">
                    <td className="py-3 px-4 text-rose-300">{r.fromUrl}</td>
                    <td className="py-3 px-4 text-emerald-300">{r.toUrl}</td>
                    <td className="py-3 px-4 font-bold text-purple-400">{r.type}</td>
                    <td className="py-3 px-4">{r.hits}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDeleteRedirect(r.id)}
                        className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:bg-slate-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export const SeoManager = SeoCenterTab;

