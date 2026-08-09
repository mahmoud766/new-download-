import React, { useState } from 'react';
import {
  Plus,
  Edit3,
  Power,
  Globe,
  Layers,
  Save,
  HelpCircle,
  FileText,
  Sparkles,
  Search,
  CheckCircle2,
  X,
  Tag,
  Share2,
  Code,
  Download,
  Info,
  Sliders,
  Eye,
  Zap,
  SlidersHorizontal,
  RefreshCw,
  Copy,
} from 'lucide-react';
import { PlatformConfig, PlatformSlug, SupportedLanguage } from '../../types';
import { getStoredPlatformsConfig, saveStoredPlatformsConfig } from '../../lib/adminStorage';
import { getSafeText, getSafeArray } from '../../lib/safeLang';

interface Props {
  currentLang: SupportedLanguage;
  onShowToast: (msg: string) => void;
}

const PlatformFormCard: React.FC<{
  slug: string;
  p: PlatformConfig;
  onUpdate: (slug: string, metaTitle: string, metaDescription: string, keywordsStr: string) => void;
  onOpenEdit: (slug: string) => void;
  onToggleActive: (slug: string) => void;
}> = ({ slug, p, onUpdate, onOpenEdit, onToggleActive }) => {
  const [metaTitle, setMetaTitle] = useState(getSafeText(p.titleTemplate, 'ar'));
  const [metaDescription, setMetaDescription] = useState(getSafeText(p.description, 'ar'));
  const [keywordsStr, setKeywordsStr] = useState((p.seoKeywords || []).join(', '));

  React.useEffect(() => {
    setMetaTitle(getSafeText(p.titleTemplate, 'ar'));
    setMetaDescription(getSafeText(p.description, 'ar'));
    setKeywordsStr((p.seoKeywords || []).join(', '));
  }, [p]);

  return (
    <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 transition-all duration-300 space-y-4 shadow-xl text-slate-100 flex flex-col justify-between">
      <div className="space-y-3.5">
        {/* Platform Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${p.badgeBg} ${p.badgeText} font-black text-xs uppercase shadow-inner`}>
              {p.name?.[0] || 'P'}
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <span>صفحة {p.name}</span>
                {p.popular && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                    نشطة 🟢
                  </span>
                )}
              </h3>
              <span className="text-[11px] text-purple-400 font-mono">/{slug}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onToggleActive(slug)}
            className={`p-2 rounded-xl border transition ${
              p.popular
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}
            title={p.popular ? 'المنصة مفعلة على الموقع' : 'المنصة معطلة'}
          >
            <Power className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Meta Title Field */}
        <div>
          <label className="block text-[11px] text-slate-300 font-bold mb-1">
            Meta Title (عنوان الصفحة SEO)
          </label>
          <input
            type="text"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            placeholder="أدخل عنوان الصفحة..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-purple-500 transition"
          />
        </div>

        {/* 2. Meta Description Field */}
        <div>
          <label className="block text-[11px] text-slate-300 font-bold mb-1">
            Meta Description (وصف محرك البحث)
          </label>
          <textarea
            rows={2}
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            placeholder="أدخل وصف Meta Description..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 resize-none font-sans"
          />
        </div>

        {/* 3. Keywords Field */}
        <div>
          <label className="block text-[11px] text-slate-300 font-bold mb-1">
            الكلمات المفتاحية Keywords (مفصولة بفاصلة)
          </label>
          <input
            type="text"
            value={keywordsStr}
            onChange={(e) => setKeywordsStr(e.target.value)}
            placeholder="tiktok, downloader, mp4..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-purple-300 font-mono focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* 4. Action Button */}
      <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onOpenEdit(slug)}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition border border-slate-700"
          title="محرر التفاصيل المتقدمة"
        >
          <Edit3 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onUpdate(slug, metaTitle, metaDescription, keywordsStr)}
          className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md shadow-purple-600/30 transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-1.5"
        >
          <Save className="w-3.5 h-3.5" />
          <span>تحديث بيانات المنصة</span>
        </button>
      </div>
    </div>
  );
};

export const PlatformManagerTab: React.FC<Props> = ({ currentLang, onShowToast }) => {
  const [platforms, setPlatforms] = useState<Record<string, PlatformConfig>>(() => getStoredPlatformsConfig());
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [activePlatformData, setActivePlatformData] = useState<PlatformConfig | null>(null);
  const [activeModalSubTab, setActiveModalSubTab] = useState<'metatags' | 'content' | 'faqs' | 'ai_gen' | 'preview'>('metatags');
  const [searchFilter, setSearchFilter] = useState('');
  const [newKeywordInput, setNewKeywordInput] = useState('');

  const handleDirectUpdatePlatform = (
    slug: string,
    metaTitle: string,
    metaDescription: string,
    keywordsStr: string
  ) => {
    setPlatforms((prev) => {
      const current = prev[slug];
      if (!current) return prev;
      const kwArray = keywordsStr
        .split(',')
        .map((k) => k.trim())
        .filter((k) => k.length > 0);

      const updated = {
        ...prev,
        [slug]: {
          ...current,
          titleTemplate: {
            ...current.titleTemplate,
            ar: metaTitle,
            en: current.titleTemplate.en || metaTitle,
          },
          description: {
            ...current.description,
            ar: metaDescription,
            en: current.description.en || metaDescription,
          },
          seoKeywords: kwArray.length > 0 ? kwArray : current.seoKeywords,
        },
      };
      saveStoredPlatformsConfig(updated);
      return updated;
    });
    onShowToast(`تم تحديث بيانات منصة (${platforms[slug]?.name || slug}) بنجاح! 🚀`);
  };

  const handleToggleActive = (slug: string) => {
    setPlatforms((prev) => {
      const current = prev[slug];
      if (!current) return prev;
      const updated = {
        ...prev,
        [slug]: {
          ...current,
          popular: !current.popular,
        },
      };
      saveStoredPlatformsConfig(updated);
      return updated;
    });
    onShowToast(`تم تحديث حالة تفعيل صفحة منصة ${slug} بنجاح!`);
  };

  const handleOpenEdit = (slug: string) => {
    setEditingSlug(slug);
    setActivePlatformData({ ...platforms[slug] });
    setActiveModalSubTab('metatags');
  };

  const handleSavePlatform = () => {
    if (!editingSlug || !activePlatformData) return;
    setPlatforms((prev) => {
      const updated = {
        ...prev,
        [editingSlug]: activePlatformData,
      };
      saveStoredPlatformsConfig(updated);
      return updated;
    });
    setEditingSlug(null);
    setActivePlatformData(null);
    onShowToast('تم حفظ تعديلات صفحة الـ SEO والـ Metatags بنجاح!');
  };

  const handleAddCustomPlatform = () => {
    const newSlug = 'platform_' + Date.now();
    const newPlatform: PlatformConfig = {
      slug: newSlug as any,
      name: 'Custom Downloader',
      iconName: 'Globe',
      color: 'from-purple-600 to-indigo-600',
      badgeBg: 'bg-purple-500/10 border-purple-500/30',
      badgeText: 'text-purple-400',
      placeholderUrl: 'https://example.com/video/12345',
      popular: true,
      seoKeywords: ['online downloader', 'video saver', 'free mp4'],
      supportedFormats: ['1080p HD', 'MP3 Audio'],
      titleTemplate: { ar: 'أداة التحميل المخصصة الجديدة', en: 'Custom Online Video Downloader', fr: '', es: '', de: '', it: '' },
      subtitle: { ar: 'حمل مقاطع الفيديو بجودة عالية وسرعة فائقة بدون علامة مائية.', en: 'Download videos easily in high definition.', fr: '', es: '', de: '', it: '' },
      description: { ar: 'خدمة التحميل المباشرة السريعة والمجانية لجميع الأجهزة.', en: 'Fast direct video downloading service.', fr: '', es: '', de: '', it: '' },
      features: { ar: ['سرعة فائقة', 'جودة HD 1080p', 'بدون علامة مائية'], en: ['Ultra Fast', '1080p HD', 'No Watermark'], fr: [], es: [], de: [], it: [] },
    };
    const updated = { ...platforms, [newSlug]: newPlatform };
    setPlatforms(updated);
    saveStoredPlatformsConfig(updated);
    onShowToast('تم إضافة صفحة تنزيل جديدة للنظام بنجاح!');
  };

  const handleAiAutoGenerate = (slug: string) => {
    if (!activePlatformData) return;
    const name = activePlatformData.name;
    const aiTitleAr = `أداة تحميل فيديوهات ${name} بدون علامة مائية مجاناً - HD & MP3`;
    const aiTitleEn = `${name} Video Downloader Without Watermark (HD MP4 & MP3)`;
    const aiSubAr = `حمل أي فيديو أو مقطع ريلز من ${name} بجودة عالية 4K/1080p مجانا وبأعلى سرعة ممكنة.`;
    const aiDescAr = `أفضل خدمة عربية مجانية لاستخراج وتنزيل مقاطع ${name} بدون علامة مائية وبدون إعلانات مزعجة. تدعم الأيفون والأندرويد والكمبيوتر.`;
    const aiKeywords = [`${name.toLowerCase()} downloader`, `download ${name.toLowerCase()} video`, `ssstik ${name.toLowerCase()}`, `save ${name.toLowerCase()} mp3`, `no watermark ${name.toLowerCase()}`];

    setActivePlatformData({
      ...activePlatformData,
      titleTemplate: { ...activePlatformData.titleTemplate, ar: aiTitleAr, en: aiTitleEn },
      subtitle: { ...activePlatformData.subtitle, ar: aiSubAr },
      description: { ...activePlatformData.description, ar: aiDescAr },
      seoKeywords: aiKeywords,
      features: {
        ...activePlatformData.features,
        ar: [`تحميل مجاني من ${name} بدون علامة مائية`, 'دعم دقة Full HD & 4K', 'تحويل الصوت إلى MP3 بضغطة واحدة', 'توافق كامل مع كافة الهواتف والكمبيوتر'],
      },
    });
    onShowToast(`تم توليد نصوص الـ SEO والـ Metatags لـ ${name} بالذكاء الاصطناعي بنجاح! ⭐`);
  };

  const handleExportSeoJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(platforms, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `omnifetch-platforms-seo-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onShowToast('تم تصدير ملف SEO المنصات الثابتة بنجاح!');
  };

  const handleAddKeyword = () => {
    if (!newKeywordInput.trim() || !activePlatformData) return;
    if (!activePlatformData.seoKeywords.includes(newKeywordInput.trim())) {
      setActivePlatformData({
        ...activePlatformData,
        seoKeywords: [...activePlatformData.seoKeywords, newKeywordInput.trim()],
      });
    }
    setNewKeywordInput('');
  };

  const handleRemoveKeyword = (kwToRemove: string) => {
    if (!activePlatformData) return;
    setActivePlatformData({
      ...activePlatformData,
      seoKeywords: activePlatformData.seoKeywords.filter((k) => k !== kwToRemove),
    });
  };

  const filteredPlatforms = Object.entries(platforms).filter(([slug, p]) =>
    p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    slug.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between bg-slate-900/90 backdrop-blur-xl p-5 rounded-3xl border border-slate-800 gap-4 shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <span>صفحات الـ SEO الثابتة (TikTok, FB, YT, IG, Snapchat)</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-extrabold border border-purple-500/30">
                  SEO CMS Center
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                تعديل المحتوى والـ Metatags والعناوين والـ Schemas المخصصة لكل منصة تنزيل ثابتة بشكل مستقل.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportSeoJson}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition border border-slate-700"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>تصدير SEO المنصات (JSON)</span>
          </button>

          <button
            onClick={handleAddCustomPlatform}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة منصة تنزيل جديدة</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between bg-slate-900 p-3 rounded-2xl border border-slate-800 gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="بحث في المنصات الصفحات الثابتة (TikTok, Facebook, YouTube...)"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
          />
        </div>
        <span className="text-xs font-mono text-slate-400 px-2">
          إجمالي المنصات: <strong className="text-purple-400">{filteredPlatforms.length}</strong>
        </span>
      </div>

      {/* Platform Category Quick Tabs (TikTok, FB, YT, IG, Snapchat, All) */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-900/80 rounded-2xl border border-slate-800">
        {[
          { id: '', label: 'جميع المنصات (All)', icon: Globe },
          { id: 'tiktok', label: 'تيك توك (TikTok)', icon: Sparkles },
          { id: 'facebook', label: 'فيسبوك (FB)', icon: Share2 },
          { id: 'youtube', label: 'يوتيوب (YT)', icon: Zap },
          { id: 'instagram', label: 'إنستغرام (Instagram)', icon: Layers },
          { id: 'snapchat', label: 'سناب شات (Snapchat)', icon: Tag },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = searchFilter.toLowerCase() === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSearchFilter(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-purple-400" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Grid of Platform Cards with Full Form Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPlatforms.map(([slug, platformData]) => (
          <PlatformFormCard
            key={slug}
            slug={slug}
            p={platformData as PlatformConfig}
            onUpdate={handleDirectUpdatePlatform}
            onOpenEdit={handleOpenEdit}
            onToggleActive={handleToggleActive}
          />
        ))}
      </div>

      {/* Edit Platform Modal */}
      {editingSlug && activePlatformData && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl my-auto p-6 space-y-5 shadow-2xl text-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl ${activePlatformData.badgeBg} ${activePlatformData.badgeText} font-black text-sm`}>
                  {activePlatformData.name}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    تعديل الـ SEO والـ Metatags لصفحة: {activePlatformData.name}
                  </h3>
                  <span className="text-xs font-mono text-purple-400">الرابط الثابت: /{editingSlug}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setEditingSlug(null);
                  setActivePlatformData(null);
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Sub-Tabs */}
            <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
              {[
                { id: 'metatags', label: 'العناوين والـ Metatags', icon: FileText },
                { id: 'content', label: 'المحتوى والخصائص', icon: Layers },
                { id: 'ai_gen', label: 'توليد SEO بالذكاء الاصطناعي', icon: Sparkles },
                { id: 'preview', label: 'معاينة Google SERP والـ Schema', icon: Eye },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeModalSubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveModalSubTab(tab.id as any)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* SubTab Content 1: METATAGS */}
            {activeModalSubTab === 'metatags' && (
              <div className="space-y-4 text-xs animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">اسم المنصة (Platform Name)</label>
                    <input
                      type="text"
                      value={activePlatformData.name}
                      onChange={(e) => setActivePlatformData({ ...activePlatformData, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-semibold focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">عنوان H1 بالعربية (Meta Page Title)</label>
                    <input
                      type="text"
                      value={getSafeText(activePlatformData.titleTemplate, 'ar')}
                      onChange={(e) => {
                        const prevTT = typeof activePlatformData.titleTemplate === 'object' && activePlatformData.titleTemplate ? activePlatformData.titleTemplate : { en: '' };
                        setActivePlatformData({
                          ...activePlatformData,
                          titleTemplate: { en: prevTT.en || e.target.value, ...prevTT, ar: e.target.value },
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-semibold focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">الوصف الفرعي (Meta Subtitle Tagline)</label>
                  <textarea
                    rows={2}
                    value={getSafeText(activePlatformData.subtitle, 'ar')}
                    onChange={(e) => {
                      const prevSub = typeof activePlatformData.subtitle === 'object' && activePlatformData.subtitle ? activePlatformData.subtitle : { en: '' };
                      setActivePlatformData({
                        ...activePlatformData,
                        subtitle: { en: prevSub.en || e.target.value, ...prevSub, ar: e.target.value },
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-purple-500 resize-none font-sans"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">الوصف الكامل للـ Meta Description</label>
                  <textarea
                    rows={3}
                    value={getSafeText(activePlatformData.description, 'ar')}
                    onChange={(e) => {
                      const prevDesc = typeof activePlatformData.description === 'object' && activePlatformData.description ? activePlatformData.description : { en: '' };
                      setActivePlatformData({
                        ...activePlatformData,
                        description: { en: prevDesc.en || e.target.value, ...prevDesc, ar: e.target.value },
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-purple-500 resize-none font-sans"
                  />
                </div>

                {/* Keywords Interactive Tag Manager */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">إدارة الكلمات المفتاحية (SEO Keywords)</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newKeywordInput}
                      onChange={(e) => setNewKeywordInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                      placeholder="أضف كلمة مفتاحية واضغط Enter..."
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddKeyword}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold"
                    >
                      إضافة
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 p-3 bg-slate-950 rounded-2xl border border-slate-800/80 min-h-[50px]">
                    {activePlatformData.seoKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-600/20 text-purple-300 border border-purple-500/30 font-mono text-[11px]"
                      >
                        <span>#{kw}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyword(kw)}
                          className="hover:text-rose-400 transition"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SubTab Content 2: LANDING CONTENT */}
            {activeModalSubTab === 'content' && (
              <div className="space-y-4 text-xs animate-in fade-in duration-200">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">مميزات الخدمة لهذه المنصة (Key Features List)</label>
                  <div className="space-y-2">
                    {getSafeArray(activePlatformData.features, 'ar').map((feat, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="text"
                          value={feat}
                          onChange={(e) => {
                            const newFeats = [...getSafeArray(activePlatformData.features, 'ar')];
                            newFeats[idx] = e.target.value;
                            const prevFeatObj = typeof activePlatformData.features === 'object' && activePlatformData.features ? activePlatformData.features : { en: [] };
                            setActivePlatformData({
                              ...activePlatformData,
                              features: { en: prevFeatObj.en || newFeats, ...prevFeatObj, ar: newFeats },
                            });
                          }}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newFeats = getSafeArray(activePlatformData.features, 'ar').filter((_, i) => i !== idx);
                            const prevFeatObj = typeof activePlatformData.features === 'object' && activePlatformData.features ? activePlatformData.features : { en: [] };
                            setActivePlatformData({
                              ...activePlatformData,
                              features: { en: prevFeatObj.en || newFeats, ...prevFeatObj, ar: newFeats },
                            });
                          }}
                          className="px-3 py-2 bg-slate-800 hover:bg-rose-600/20 text-rose-400 rounded-xl font-bold"
                        >
                          حذف
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const newFeats = [...getSafeArray(activePlatformData.features, 'ar'), 'ميزة جديدة'];
                        const prevFeatObj = typeof activePlatformData.features === 'object' && activePlatformData.features ? activePlatformData.features : { en: [] };
                        setActivePlatformData({
                          ...activePlatformData,
                          features: { en: prevFeatObj.en || newFeats, ...prevFeatObj, ar: newFeats },
                        });
                      }}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold rounded-xl"
                    >
                      + إضافة ميزة جديدة
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">الصيغ والجودات المدعومة (Supported Formats)</label>
                  <input
                    type="text"
                    value={(activePlatformData.supportedFormats || []).join(', ')}
                    onChange={(e) =>
                      setActivePlatformData({
                        ...activePlatformData,
                        supportedFormats: e.target.value.split(',').map((s) => s.trim()),
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono"
                  />
                </div>
              </div>
            )}

            {/* SubTab Content 3: AI AUTO GENERATOR */}
            {activeModalSubTab === 'ai_gen' && (
              <div className="p-6 bg-slate-950 rounded-3xl border border-purple-500/30 text-center space-y-4 animate-in fade-in duration-200">
                <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center mx-auto border border-purple-500/30">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white">توليد نصوص SEO وصفحة التنزيل بالذكاء الاصطناعي</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    سيقوم النظام بتوليد عناوين H1 احترافية، Meta Description، كلمات مفتاحية عالية الترتيب وقائمة الميزات لـ {activePlatformData.name} فوراً.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAiAutoGenerate(editingSlug)}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs shadow-xl shadow-purple-600/30 transition-all hover:scale-105"
                >
                  ⚡ توليد وتعبئة نصوص الـ SEO الآن
                </button>
              </div>
            )}

            {/* SubTab Content 4: LIVE PREVIEW & SCHEMA */}
            {activeModalSubTab === 'preview' && (
              <div className="space-y-4 text-xs animate-in fade-in duration-200">
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-[10px] text-emerald-400 font-mono">https://omnifetch.com/{editingSlug}</span>
                  <h5 className="text-sm font-bold text-sky-400">
                    {getSafeText(activePlatformData.titleTemplate, 'ar', activePlatformData.name)}
                  </h5>
                  <p className="text-slate-400 line-clamp-2">
                    {getSafeText(activePlatformData.description, 'ar', getSafeText(activePlatformData.subtitle, 'ar'))}
                  </p>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-mono">JSON-LD Schema.org Data:</label>
                  <pre className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-[10px] text-emerald-400 font-mono overflow-x-auto">
{JSON.stringify(
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: activePlatformData.name + ' Downloader',
    url: `https://omnifetch.com/${editingSlug}`,
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'All',
  },
  null,
  2
)}
                  </pre>
                </div>
              </div>
            )}

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setEditingSlug(null);
                  setActivePlatformData(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleSavePlatform}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-purple-600/30"
              >
                <Save className="w-4 h-4" />
                <span>حفظ تغييرات صفحة الـ SEO</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
