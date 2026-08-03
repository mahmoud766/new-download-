import React, { useState } from 'react';
import {
  DollarSign,
  Save,
  Power,
  Layout,
  Code2,
  Plus,
  Trash2,
  Sparkles,
  Zap,
  Eye,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Image,
  ExternalLink,
  HelpCircle,
  TrendingUp,
  BarChart2,
  Globe,
} from 'lucide-react';
import { AdPlacementConfig, SupportedLanguage } from '../../types';
import { saveAdsConfig } from '../../lib/storage';
import { DEFAULT_ADS_CONFIG } from '../../config/siteConfig';

interface Props {
  ads: AdPlacementConfig[];
  onUpdateAds: (newAds: AdPlacementConfig[]) => void;
  onShowToast: (msg: string) => void;
  currentLang: SupportedLanguage;
}

export const AdManagerTab: React.FC<Props> = ({
  ads,
  onUpdateAds,
  onShowToast,
  currentLang,
}) => {
  const [adList, setAdList] = useState<AdPlacementConfig[]>(ads && ads.length ? ads : DEFAULT_ADS_CONFIG);
  const [activeNetwork, setActiveNetwork] = useState<'adsense' | 'ezoic' | 'mediavine' | 'direct'>('adsense');
  const [previewSlotId, setPreviewSlotId] = useState<string | null>(null);

  // AdSense Generator Modal State
  const [showAdSenseGenerator, setShowAdSenseGenerator] = useState(false);
  const [targetSlotId, setTargetSlotId] = useState<string>('header_banner');
  const [publisherId, setPublisherId] = useState('ca-pub-1234567890123456');
  const [adUnitId, setAdUnitId] = useState('9876543210');
  const [adFormat, setAdFormat] = useState<'auto' | 'fluid' | 'rectangle' | 'horizontal'>('auto');

  // Direct Image Banner Generator State
  const [showImageBannerModal, setShowImageBannerModal] = useState(false);
  const [bannerTargetSlot, setBannerTargetSlot] = useState<string>('footer_banner');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80');
  const [targetUrl, setTargetUrl] = useState('https://omnifetch.com/pro');
  const [bannerAltText, setBannerAltText] = useState('Sponsor Banner');

  // Add Custom Slot Modal State
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [newSlotName, setNewSlotName] = useState('');
  const [newSlotKey, setNewSlotKey] = useState('');
  const [newSlotHeight, setNewSlotHeight] = useState(100);

  // Toggle slot on/off
  const handleToggleSlot = (id: string) => {
    const updated = adList.map((slot) => (slot.id === id ? { ...slot, enabled: !slot.enabled } : slot));
    setAdList(updated);
    onShowToast('تم تغيير حالة تفعيل المساحة الإعلانية!');
  };

  // Code change
  const handleCodeChange = (id: string, code: string) => {
    const updated = adList.map((slot) => (slot.id === id ? { ...slot, code } : slot));
    setAdList(updated);
  };

  // Height change
  const handleHeightChange = (id: string, heightPx: number) => {
    const updated = adList.map((slot) => (slot.id === id ? { ...slot, heightPx } : slot));
    setAdList(updated);
  };

  // Delete custom slot
  const handleDeleteSlot = (id: string) => {
    if (confirm('هل أنت تأكد من حذف هذه المساحة الإعلانية؟')) {
      const updated = adList.filter((s) => s.id !== id);
      setAdList(updated);
      onShowToast('تم حذف المساحة الإعلانية بنجاح.');
    }
  };

  // Save all
  const handleSaveAll = () => {
    saveAdsConfig(adList);
    onUpdateAds(adList);
    onShowToast('تم حفظ جميع المساحات والأكواد الإعلانية بنجاح!');
  };

  // Restore defaults
  const handleRestoreDefaults = () => {
    if (confirm('هل تريد استعادة المساحات الإعلانية الافتراضية؟')) {
      setAdList(DEFAULT_ADS_CONFIG);
      saveAdsConfig(DEFAULT_ADS_CONFIG);
      onUpdateAds(DEFAULT_ADS_CONFIG);
      onShowToast('تمت استعادة المساحات الإعلانية الافتراضية!');
    }
  };

  // Generate AdSense snippet
  const handleInjectAdSenseCode = () => {
    if (!publisherId || !adUnitId) {
      onShowToast('يرجى كتابة Publisher ID و Ad Unit ID بشكل صحيح.');
      return;
    }

    const generatedCode = `<!-- Google AdSense Unit: ${adUnitId} -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}" crossorigin="anonymous"></script>
<ins class="adsbygoogle"
     style="display:block; text-align:center;"
     data-ad-client="${publisherId}"
     data-ad-slot="${adUnitId}"
     data-ad-format="${adFormat}"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>`;

    const updated = adList.map((slot) =>
      slot.id === targetSlotId || slot.slot === targetSlotId ? { ...slot, code: generatedCode, enabled: true } : slot
    );

    setAdList(updated);
    setShowAdSenseGenerator(false);
    onShowToast('تم توليد وإدراج كود Google AdSense بنجاح في المساحة المحددة!');
  };

  // Inject Direct Image Banner
  const handleInjectImageBanner = () => {
    if (!imageUrl) {
      onShowToast('يرجى إدخال رابط الصورة بشكل صحيح.');
      return;
    }

    const generatedCode = `<a href="${targetUrl}" target="_blank" rel="noopener noreferrer" class="block w-full text-center hover:opacity-95 transition">
  <img src="${imageUrl}" alt="${bannerAltText}" class="max-h-32 w-full object-cover rounded-xl border border-slate-800 shadow-md mx-auto" />
</a>`;

    const updated = adList.map((slot) =>
      slot.id === bannerTargetSlot || slot.slot === bannerTargetSlot ? { ...slot, code: generatedCode, enabled: true } : slot
    );

    setAdList(updated);
    setShowImageBannerModal(false);
    onShowToast('تم إدراج إعلان الصورة والرابط المباشر بنجاح!');
  };

  // Create New Custom Slot
  const handleCreateNewSlot = () => {
    if (!newSlotName) {
      onShowToast('يرجى كتابة اسم المساحة الإعلانية الجديدة.');
      return;
    }

    const key = newSlotKey.trim()
      ? newSlotKey.toLowerCase().replace(/\s+/g, '_')
      : 'slot_' + Math.random().toString(36).substring(2, 7);

    const newSlotItem: AdPlacementConfig = {
      id: key,
      slot: key as any,
      name: newSlotName,
      enabled: true,
      code: `<div class="text-center font-mono text-xs text-purple-400 py-3 bg-purple-950/20 rounded-lg border border-dashed border-purple-800/50">${newSlotName} Custom Ad Slot</div>`,
      heightPx: newSlotHeight || 100,
    };

    const updated = [...adList, newSlotItem];
    setAdList(updated);
    setShowAddSlotModal(false);
    setNewSlotName('');
    setNewSlotKey('');
    onShowToast('تم إنشاء المساحة الإعلانية المخصصة بنجاح!');
  };

  const enabledCount = adList.filter((s) => s.enabled).length;

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between bg-slate-900 p-5 rounded-2xl border border-slate-800 gap-4">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <span>مدير الإعلانات والمساحات الذكية (Ad Manager & Custom Slot Injector)</span>
            <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/30 font-bold flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-amber-400" /> Revenue Engine
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            إدارة مساحات العرض في أعلى الصفحة (Header)، أسفل مربع البحث (Mid-Result)، أسفل الشاشة (Footer) وحقن أكواد Google AdSense، Script Tags، أو بنرات الرعاة بدون تعديل الكود.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAdSenseGenerator(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-md transition"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>مولد AdSense Unit</span>
          </button>

          <button
            onClick={() => setShowImageBannerModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition"
          >
            <Image className="w-4 h-4 text-purple-400" />
            <span>إعلان صورة ووصلة</span>
          </button>

          <button
            onClick={() => setShowAddSlotModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>إضافة مساحة جديدة</span>
          </button>

          <button
            onClick={handleSaveAll}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 transition"
          >
            <Save className="w-4 h-4" />
            <span>حفظ جميع المساحات</span>
          </button>
        </div>
      </div>

      {/* Analytics Overview Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>المساحات المفعلة</span>
            <Layout className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400 font-mono">
            {enabledCount} / {adList.length} Slots
          </div>
          <span className="text-[10px] text-slate-500">جاهزة لعرض الإعلانات فورياً</span>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>الشبكة النشطة</span>
            <Globe className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-black text-amber-300 uppercase font-mono">{activeNetwork}</div>
          <span className="text-[10px] text-slate-500">متوافق مع AdSense / Ezoic / Mediavine</span>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>معدل الظهور التقديري (CTR)</span>
            <TrendingUp className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl font-black text-sky-300 font-mono">3.48%</div>
          <span className="text-[10px] text-emerald-400">★ أماكن ممتازة للتفاعل</span>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>استعادة الإعدادات</span>
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </div>
          <button
            onClick={handleRestoreDefaults}
            className="text-xs font-bold text-slate-400 hover:text-red-400 transition underline pt-1 block"
          >
            إعادة تعيين للأماكن الافتراضية
          </button>
        </div>
      </div>

      {/* Network Selector Tabs */}
      <div className="flex items-center justify-between bg-slate-900 p-3 rounded-2xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-bold px-2">مزود الإعلانات:</span>
          {(['adsense', 'ezoic', 'mediavine', 'direct'] as const).map((net) => (
            <button
              key={net}
              onClick={() => setActiveNetwork(net)}
              className={`px-3 py-1.5 rounded-xl font-bold uppercase transition ${
                activeNetwork === net
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              {net}
            </button>
          ))}
        </div>
      </div>

      {/* Ad Slots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {adList.map((slot) => (
          <div
            key={slot.id}
            className={`p-5 rounded-2xl border transition-all space-y-3 relative ${
              slot.enabled
                ? 'bg-slate-900 border-amber-500/40 shadow-lg shadow-amber-500/5'
                : 'bg-slate-900/50 border-slate-800 opacity-80'
            }`}
          >
            {/* Slot Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2.5 rounded-xl ${
                    slot.enabled ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  <Layout className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                    <span>{slot.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 font-mono">
                      slot: {slot.slot || slot.id}
                    </span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">الارتفاع الموصى به: {slot.heightPx || 100}px</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewSlotId(previewSlotId === slot.id ? null : slot.id)}
                  className={`p-2 rounded-xl border transition ${
                    previewSlotId === slot.id
                      ? 'bg-purple-600 text-white border-purple-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                  title="معاينة الشكل"
                >
                  <Eye className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleToggleSlot(slot.id)}
                  className={`p-2 rounded-xl border transition ${
                    slot.enabled
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-500 border-slate-700'
                  }`}
                  title={slot.enabled ? 'المساحة مفعلة' : 'المساحة معطلة'}
                >
                  <Power className="w-4 h-4" />
                </button>

                {/* Delete button if custom slot */}
                {!['header_banner', 'pre_result', 'post_result', 'sidebar', 'footer_banner'].includes(slot.id) && (
                  <button
                    onClick={() => handleDeleteSlot(slot.id)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 transition"
                    title="حذف المساحة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Code Textarea Area */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-400 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>كود HTML / JavaScript / Script Tag الإعلاني:</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">يدعم &lt;script&gt; و &lt;ins&gt; و &lt;iframe&gt;</span>
              </div>
              <textarea
                rows={4}
                value={slot.code}
                onChange={(e) => handleCodeChange(slot.id, e.target.value)}
                placeholder="<!-- Paste Google AdSense script, custom <ins> tag or HTML iframe banner code here -->"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-amber-300 font-mono text-[11px] focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
              />
            </div>

            {/* Live Preview Dropdown if toggled */}
            {previewSlotId === slot.id && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  معاينة مباشرة للمساحة (Live Render Preview):
                </span>
                <div
                  className="w-full min-h-[60px] bg-slate-900 border border-slate-800 rounded-lg p-2 flex items-center justify-center text-xs overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: slot.code }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* AdSense Unit Generator Modal */}
      {showAdSenseGenerator && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-lg w-full space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>مولد كود Google AdSense التلقائي</span>
              </h3>
              <button
                onClick={() => setShowAdSenseGenerator(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                إغلاق ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              أدخل بيانات حسابك في Google AdSense لتوليد الكود البرمجي وحقنه مباشرة في أي مكان تريده بدون تعديل أي سطر برمجي.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">اختر المساحة الإعلانية المستهدفة:</label>
                <select
                  value={targetSlotId}
                  onChange={(e) => setTargetSlotId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                >
                  {adList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.slot || s.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Publisher ID (معرف الناشر):</label>
                <input
                  type="text"
                  value={publisherId}
                  onChange={(e) => setPublisherId(e.target.value)}
                  placeholder="ca-pub-1234567890123456"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-amber-300 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Ad Unit ID (معرف الوحدة الإعلانية):</label>
                <input
                  type="text"
                  value={adUnitId}
                  onChange={(e) => setAdUnitId(e.target.value)}
                  placeholder="9876543210"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-amber-300 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">تنسيق الإعلان (Ad Format):</label>
                <select
                  value={adFormat}
                  onChange={(e) => setAdFormat(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  <option value="auto">تلقائي ومتجاوب (Auto Responsive)</option>
                  <option value="rectangle">مستطيل (Rectangle 300x250)</option>
                  <option value="horizontal">أفقي (Horizontal Leaderboard 728x90)</option>
                  <option value="fluid">انسيابي داخل المقالات (Fluid In-Article)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleInjectAdSenseCode}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl transition"
              >
                توليد وحقن الكود فورياً
              </button>
              <button
                onClick={() => setShowAdSenseGenerator(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Image Banner Modal */}
      {showImageBannerModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-lg w-full space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Image className="w-5 h-5 text-purple-400" />
                <span>إدراج بنر صورة + رابط مباشر (Affiliate / Sponsor Banner)</span>
              </h3>
              <button
                onClick={() => setShowImageBannerModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                إغلاق ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">المساحة المستهدفة:</label>
                <select
                  value={bannerTargetSlot}
                  onChange={(e) => setBannerTargetSlot(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                >
                  {adList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.slot || s.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">رابط صورة البنر (Image URL):</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/banner.png"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">رابط توجيه الزائر عند الضغط (Target Link):</label>
                <input
                  type="text"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://sponsor.com/offer"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">النص الوصفي (Alt Text):</label>
                <input
                  type="text"
                  value={bannerAltText}
                  onChange={(e) => setBannerAltText(e.target.value)}
                  placeholder="Sponsored Offer"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleInjectImageBanner}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs rounded-xl transition"
              >
                إدراج البنر فورياً
              </button>
              <button
                onClick={() => setShowImageBannerModal(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Slot Modal */}
      {showAddSlotModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-lg w-full space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                <span>إضافة مساحة إعلانية جديدة مخصصة</span>
              </h3>
              <button
                onClick={() => setShowAddSlotModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                إغلاق ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم المساحة (Display Name):</label>
                <input
                  type="text"
                  value={newSlotName}
                  onChange={(e) => setNewSlotName(e.target.value)}
                  placeholder="مثال: إعلان أعلى جدول الجودات"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">رمز المساحة (Slot Key ID):</label>
                <input
                  type="text"
                  value={newSlotKey}
                  onChange={(e) => setNewSlotKey(e.target.value)}
                  placeholder="مثال: quality_table_top"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-amber-300 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">الارتفاع الموصى به (Height in px):</label>
                <input
                  type="number"
                  value={newSlotHeight}
                  onChange={(e) => setNewSlotHeight(parseInt(e.target.value) || 100)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleCreateNewSlot}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition"
              >
                إنشاء المساحة الآن
              </button>
              <button
                onClick={() => setShowAddSlotModal(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
