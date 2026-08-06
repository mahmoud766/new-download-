import React, { useState } from 'react';
import {
  Save,
  Globe,
  Palette,
  Code,
  ShieldAlert,
  Sliders,
  Layout,
  Mail,
  Phone,
  MapPin,
  Upload,
  Download,
  RotateCcw,
  Sparkles,
  Share2,
  CheckCircle2,
  Info,
  Eye,
  SlidersHorizontal,
  Link as LinkIcon,
  Search,
  MessageSquare,
  X,
  FileCode,
  Smartphone,
  Tv,
} from 'lucide-react';
import { SiteSettings, SupportedLanguage } from '../../types';
import { saveSiteSettings } from '../../lib/storage';
import { DEFAULT_SITE_SETTINGS } from '../../config/siteConfig';
import { saveFirestoreGlobalSettings } from '../../lib/firebase';

interface Props {
  settings: SiteSettings;
  onUpdateSettings: (newSettings: SiteSettings) => void;
  onShowToast: (msg: string) => void;
  currentLang: SupportedLanguage;
}

export const SiteSettingsTab: React.FC<Props> = ({
  settings,
  onUpdateSettings,
  onShowToast,
  currentLang,
}) => {
  const [formData, setFormData] = useState<SiteSettings>(settings);
  const [activeSubTab, setActiveSubTab] = useState<
    'branding' | 'header_meta' | 'integrations' | 'contact_social' | 'custom_code' | 'maintenance'
  >('branding');

  const handleChange = (field: keyof SiteSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNestedSocialChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: {
        ...(prev.socialLinks || {}),
        [key]: value,
      },
    }));
  };

  const handleSave = async () => {
    const updated = saveSiteSettings(formData);
    onUpdateSettings(updated);
    
    // Save directly to live Firestore DB & trigger On-Demand Revalidation
    await saveFirestoreGlobalSettings(formData);

    onShowToast('تم حفظ إعدادات الموقع والربط وتنفيذ إعادة التنشيط الفوري (On-Demand Revalidation ⚡) بنجاح!');
  };

  const handleResetDefaults = () => {
    if (window.confirm('هل أنت تأكد من إرجاع كافة إعدادات الموقع للقيم الافتراضية الأصلية؟')) {
      setFormData(DEFAULT_SITE_SETTINGS);
      const updated = saveSiteSettings(DEFAULT_SITE_SETTINGS);
      onUpdateSettings(updated);
      onShowToast('تم استعادة الإعدادات الافتراضية للموقع بنجاح.');
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(formData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `omnifetch-settings-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onShowToast('تم تصدير ملف إعدادات الموقع (JSON) بنجاح!');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          if (imported && typeof imported === 'object') {
            const merged = { ...DEFAULT_SITE_SETTINGS, ...imported };
            setFormData(merged);
            const updated = saveSiteSettings(merged);
            onUpdateSettings(updated);
            onShowToast('تم استيراد الإعدادات وتطبيقها على اللوحة بنجاح!');
          }
        } catch (err) {
          onShowToast('خطأ في تنسيق ملف JSON المستورد! يرجى التأكد من صحة الملف.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        onShowToast('حجم الشعار كبير! اختر صورة بحجم أقل من 2 ميجابايت.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          handleChange('logoUrl', ev.target.result as string);
          onShowToast('تم رفع ومعاينة الشعار الجديد بنجاح!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          handleChange('faviconUrl', ev.target.result as string);
          onShowToast('تم رفع ومعاينة أيقونة Favicon بنجاح!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const subTabs = [
    { id: 'branding', label: 'الهوية والشعار', icon: Globe },
    { id: 'header_meta', label: 'الهيدر والـ Meta', icon: Layout },
    { id: 'integrations', label: 'الربط والتكامل', icon: Code },
    { id: 'contact_social', label: 'التواصل وسوشيال', icon: Mail },
    { id: 'custom_code', label: 'أكواد CSS/JS', icon: FileCode },
    { id: 'maintenance', label: 'الصيانة وضوابط الخدمة', icon: ShieldAlert },
  ];

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      {/* Top Main Action Header */}
      <div className="flex flex-wrap items-center justify-between bg-slate-900/90 backdrop-blur-xl p-5 rounded-3xl border border-slate-800 gap-4 shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <span>الإعدادات العامة والربط (النظام والمحتوى)</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold border border-emerald-500/30">
                  Live Synced
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                إدارة كافة بيانات اسم الموقع، العبارة الترحيبية، الشعار، الألوان، الربط الإحصائي والـ Metadata الرئيسية.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition border border-slate-700">
            <Upload className="w-3.5 h-3.5 text-blue-400" />
            <span>استيراد JSON</span>
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>

          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition border border-slate-700"
            title="تصدير نسخة من الإعدادات"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>تصدير JSON</span>
          </button>

          <button
            onClick={handleResetDefaults}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition"
            title="استعادة الإعدادات الافتراضية"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>حفظ جميع التغييرات</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab Navigation Pills */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-900/80 rounded-2xl border border-slate-800/80">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Interactive Settings Panel (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* TAB 1: BRANDING & IDENTITY */}
          {activeSubTab === 'branding' && (
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-5 shadow-xl animate-in fade-in duration-300">
              <h3 className="text-sm font-black text-white flex items-center gap-2 pb-3 border-b border-slate-800">
                <Globe className="w-4 h-4 text-purple-400" />
                <span>بيانات الهوية التجارية والشعار الرسمية</span>
              </h3>

              <div className="space-y-4 text-xs">
                {/* General Settings Quick Form Card */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-850">
                    <span className="font-extrabold text-sm text-purple-300 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-purple-400" />
                      <span>نموذج الإعدادات العامة والربط الرئيسية</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleSave}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>حفظ الإعدادات (Save Settings)</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1.5">اسم الموقع (Site Name)</label>
                      <input
                        type="text"
                        value={formData.siteName}
                        onChange={(e) => handleChange('siteName', e.target.value)}
                        placeholder="OmniFetch Pro"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-semibold focus:outline-none focus:border-purple-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1.5">العبارة الترحيبية (Tagline)</label>
                      <input
                        type="text"
                        value={formData.tagline || ''}
                        onChange={(e) => handleChange('tagline', e.target.value)}
                        placeholder="أفضل وأسرع أداة مجانية لتحميل الفيديوهات بدون علامة مائية"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-semibold focus:outline-none focus:border-purple-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">الوصف والعبارة الشاملة للموقع (Site Description)</label>
                    <textarea
                      rows={2}
                      value={formData.siteDescription || ''}
                      onChange={(e) => handleChange('siteDescription', e.target.value)}
                      placeholder="أفضل وأسرع أداة مجانية لتحميل فيديوهات تيك توك، يوتيوب شورتس، فيسبوك ريلز وإنستغرام بدقة HD وبدون علامات مائية..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-purple-500 resize-none font-sans leading-relaxed"
                    />
                  </div>

                  {/* Maintenance Mode Interactive Toggle Switch */}
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl border ${formData.maintenanceMode ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}`}>
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">وضع الصيانة العام (Maintenance Mode)</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${formData.maintenanceMode ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'}`}>
                            {formData.maintenanceMode ? 'مفعّل الآن 🚨' : 'متوقف - يعمل بشكل طبيعي 🟢'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">تجميد طلبات التنزيل للزوار وإظهار شريط تنبيه الصيانة الفورية</p>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => handleChange('maintenanceMode', !formData.maintenanceMode)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        formData.maintenanceMode ? 'bg-rose-600' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          formData.maintenanceMode ? 'translate-x-0' : 'translate-x-5'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Logo & Favicon Custom File Upload & URL Picker */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Logo Box */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-purple-400" />
                        <span>شعار الموقع (Main Logo)</span>
                      </span>
                      {formData.logoUrl && (
                        <button
                          type="button"
                          onClick={() => handleChange('logoUrl', '')}
                          className="text-[10px] text-rose-400 hover:underline"
                        >
                          إزالة
                        </button>
                      )}
                    </div>

                    {formData.logoUrl ? (
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center min-h-[70px]">
                        <img src={formData.logoUrl} alt="Logo Preview" style={{ height: `${formData.logoHeightPx || 40}px` }} className="object-contain" />
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-900/50 rounded-xl border border-dashed border-slate-800 text-center text-[11px] text-slate-500">
                        لا يوجد شعار مرفوع حالياً
                      </div>
                    )}

                    <div className="space-y-2">
                      <input
                        type="text"
                        value={formData.logoUrl || ''}
                        onChange={(e) => handleChange('logoUrl', e.target.value)}
                        placeholder="رابط الشعار أو رفع صورة..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-purple-500"
                      />
                      <label className="block w-full text-center px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 font-bold text-[11px] cursor-pointer transition">
                        رفع صورة الشعار من الجهاز
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      </label>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>ارتفاع الشعار (PX):</span>
                        <span className="font-mono font-bold text-purple-400">{formData.logoHeightPx || 40}px</span>
                      </div>
                      <input
                        type="range"
                        min={20}
                        max={80}
                        value={formData.logoHeightPx || 40}
                        onChange={(e) => handleChange('logoHeightPx', parseInt(e.target.value))}
                        className="w-full accent-purple-600 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Favicon Box */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-emerald-400" />
                        <span>أيقونة الـ Favicon</span>
                      </span>
                      {formData.faviconUrl && (
                        <button
                          type="button"
                          onClick={() => handleChange('faviconUrl', '')}
                          className="text-[10px] text-rose-400 hover:underline"
                        >
                          إزالة
                        </button>
                      )}
                    </div>

                    {formData.faviconUrl ? (
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center min-h-[70px]">
                        <img src={formData.faviconUrl} alt="Favicon Preview" className="w-8 h-8 object-contain" />
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-900/50 rounded-xl border border-dashed border-slate-800 text-center text-[11px] text-slate-500">
                        استخدام الأيقونة الافتراضية
                      </div>
                    )}

                    <div className="space-y-2">
                      <input
                        type="text"
                        value={formData.faviconUrl || ''}
                        onChange={(e) => handleChange('faviconUrl', e.target.value)}
                        placeholder="رابط الأيقونة (/favicon.ico)..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-purple-500"
                      />
                      <label className="block w-full text-center px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-bold text-[11px] cursor-pointer transition">
                        رفع أيقونة Favicon جديدة
                        <input type="file" accept="image/*" onChange={handleFaviconUpload} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HEADER & MAIN METADATA */}
          {activeSubTab === 'header_meta' && (
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-5 shadow-xl animate-in fade-in duration-300">
              <h3 className="text-sm font-black text-white flex items-center gap-2 pb-3 border-b border-slate-800">
                <Layout className="w-4 h-4 text-sky-400" />
                <span>تخصيص سلوك الهيدر والـ Metadata الرئيسية للبحث</span>
              </h3>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">نمط تثبيت الهيدر (Header Navigation Style)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: 'sticky', title: 'مثبت (Sticky)', desc: 'يثبت أعلى الشاشة مع التمرير' },
                      { id: 'fixed', title: 'ثابت (Fixed)', desc: 'شريط شفاف يتراكب مع المحتوى' },
                      { id: 'static', title: 'عادي (Static)', desc: 'يتحرك طبيعياً مع الصفحة' },
                      { id: 'floating', title: 'كبسولة عائمة (Floating)', desc: 'كبسولة أنيقة بحواف دائرية' },
                    ].map((st) => (
                      <button
                        type="button"
                        key={st.id}
                        onClick={() => handleChange('headerStyle', st.id)}
                        className={`p-3 rounded-2xl border text-right transition-all ${
                          formData.headerStyle === st.id
                            ? 'bg-purple-600/20 border-purple-500 text-white font-bold'
                            : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <span className="block text-xs font-black mb-0.5">{st.title}</span>
                        <span className="block text-[10px] text-slate-400">{st.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">عنوان الصفحة الرئيسية (Primary Meta Title)</label>
                    <input
                      type="text"
                      value={formData.siteName}
                      onChange={(e) => handleChange('siteName', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-semibold focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">الرابط الرسمي الكانونيكال (Canonical Base URL)</label>
                    <input
                      type="text"
                      value="https://omnifetch.com"
                      readOnly
                      className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-slate-400 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">وصف محركات البحث الرئيسي (Main Meta Description)</label>
                  <textarea
                    rows={3}
                    value={formData.siteDescription || ''}
                    onChange={(e) => handleChange('siteDescription', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-slate-200 focus:outline-none focus:border-purple-500 resize-none font-sans"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INTEGRATIONS & KEYS */}
          {activeSubTab === 'integrations' && (
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-5 shadow-xl animate-in fade-in duration-300">
              <h3 className="text-sm font-black text-white flex items-center gap-2 pb-3 border-b border-slate-800">
                <Code className="w-4 h-4 text-emerald-400" />
                <span>مفاتيح التحليلات والتتبع الإحصائي والإعلاني</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Google Analytics 4 (GA4 ID)</label>
                  <input
                    type="text"
                    value={formData.ga4Id || ''}
                    onChange={(e) => handleChange('ga4Id', e.target.value)}
                    placeholder="G-OMNIFETCH2026"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-emerald-400 font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Google Tag Manager (GTM ID)</label>
                  <input
                    type="text"
                    value={formData.gtmId || ''}
                    onChange={(e) => handleChange('gtmId', e.target.value)}
                    placeholder="GTM-OMNIFETCH"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sky-400 font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Facebook Pixel ID</label>
                  <input
                    type="text"
                    value={formData.fbPixelId || ''}
                    onChange={(e) => handleChange('fbPixelId', e.target.value)}
                    placeholder="123456789012345"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-blue-400 font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Google AdSense Publisher ID</label>
                  <input
                    type="text"
                    value={formData.adsenseClientId || ''}
                    onChange={(e) => handleChange('adsenseClientId', e.target.value)}
                    placeholder="ca-pub-1234567890000000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-amber-400 font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-bold mb-1">Microsoft Clarity Project ID</label>
                  <input
                    type="text"
                    value={formData.clarityId || ''}
                    onChange={(e) => handleChange('clarityId', e.target.value)}
                    placeholder="clarity_omnifetch"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-purple-400 font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CONTACT & SOCIAL */}
          {activeSubTab === 'contact_social' && (
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-5 shadow-xl animate-in fade-in duration-300">
              <h3 className="text-sm font-black text-white flex items-center gap-2 pb-3 border-b border-slate-800">
                <Mail className="w-4 h-4 text-indigo-400" />
                <span>بيانات التواصل الرسمية وروابط وسائل التواصل</span>
              </h3>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">البريد الإلكتروني لللدعم (Contact Email)</label>
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => handleChange('contactEmail', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">رقم الهاتف الرسمي (Phone Number)</label>
                    <input
                      type="text"
                      value={formData.contactPhone || ''}
                      onChange={(e) => handleChange('contactPhone', e.target.value)}
                      placeholder="+1 (800) 555-0199"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-slate-400 mb-1">صفحة Facebook</label>
                    <input
                      type="text"
                      value={formData.socialLinks?.facebook || ''}
                      onChange={(e) => handleNestedSocialChange('facebook', e.target.value)}
                      placeholder="https://facebook.com/omnifetch"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500 font-mono text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">حساب Twitter / X</label>
                    <input
                      type="text"
                      value={formData.socialLinks?.twitter || ''}
                      onChange={(e) => handleNestedSocialChange('twitter', e.target.value)}
                      placeholder="https://x.com/omnifetch"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500 font-mono text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">حساب Instagram</label>
                    <input
                      type="text"
                      value={formData.socialLinks?.instagram || ''}
                      onChange={(e) => handleNestedSocialChange('instagram', e.target.value)}
                      placeholder="https://instagram.com/omnifetch"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500 font-mono text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">قناة Telegram الرسمية</label>
                    <input
                      type="text"
                      value={formData.socialLinks?.telegram || ''}
                      onChange={(e) => handleNestedSocialChange('telegram', e.target.value)}
                      placeholder="https://t.me/omnifetch"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500 font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CUSTOM CODE INJECTION */}
          {activeSubTab === 'custom_code' && (
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-5 shadow-xl animate-in fade-in duration-300">
              <h3 className="text-sm font-black text-white flex items-center gap-2 pb-3 border-b border-slate-800">
                <FileCode className="w-4 h-4 text-purple-400" />
                <span>حقن أكواد CSS المخصصة وسكريبتات الـ JavaScript</span>
              </h3>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">كود CSS مخصص (Global Custom Styles)</label>
                  <textarea
                    rows={6}
                    value={formData.customCss || ''}
                    onChange={(e) => handleChange('customCss', e.target.value)}
                    placeholder="/* Custom CSS Rules */&#10;.custom-btn { border-radius: 9999px; background: linear-gradient(...); }"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-emerald-300 font-mono text-[11px] focus:outline-none focus:border-purple-500 leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">كود JavaScript مخصص (Header / Footer Injection Scripts)</label>
                  <textarea
                    rows={6}
                    value={formData.customJs || ''}
                    onChange={(e) => handleChange('customJs', e.target.value)}
                    placeholder="// Custom Script Injection&#10;console.log('OmniFetch Custom Script Active');"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-purple-300 font-mono text-[11px] focus:outline-none focus:border-purple-500 leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: MAINTENANCE & SYSTEM TOGGLES */}
          {activeSubTab === 'maintenance' && (
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-5 shadow-xl animate-in fade-in duration-300">
              <h3 className="text-sm font-black text-white flex items-center gap-2 pb-3 border-b border-slate-800">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>وضعية الصيانة العامة وضوابط الخدمة الحساسة</span>
              </h3>

              <div className="space-y-4 text-xs">
                {/* Maintenance Mode Card */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-white text-sm block">وضع الصيانة العام (Maintenance Mode)</span>
                    <span className="text-slate-400 text-[11px]">تفعيل شريط تنبيه ملون وتجميد التنزيلات للزوار مع إبقاء الأدمين مفعلاً</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.maintenanceMode}
                    onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                    className="w-6 h-6 accent-rose-600 rounded cursor-pointer shrink-0"
                  />
                </div>

                {/* MP3 Toggle */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-white text-sm block">السماح بتحويل MP3 الصوتي</span>
                    <span className="text-slate-400 text-[11px]">متاحة لكافة الزوار لاستخراج المقطع الصوتي</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.allowMp3Conversion}
                    onChange={(e) => handleChange('allowMp3Conversion', e.target.checked)}
                    className="w-6 h-6 accent-purple-600 rounded cursor-pointer shrink-0"
                  />
                </div>

                {/* Watermark Free Toggle */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-white text-sm block">بدون علامة مائية افتراضياً</span>
                    <span className="text-slate-400 text-[11px]">تقديم روابط مباشرة بدون شعار بدون أية خطوة إضافية</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.watermarkFreeByDefault}
                    onChange={(e) => handleChange('watermarkFreeByDefault', e.target.checked)}
                    className="w-6 h-6 accent-purple-600 rounded cursor-pointer shrink-0"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Live Preview Column (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Live Simulated Navbar Header Box */}
          <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-3 shadow-xl">
            <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span>معاينة الهيدر والشعار المباشر</span>
            </h4>

            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  {formData.logoUrl ? (
                    <img src={formData.logoUrl} alt="Logo" style={{ height: `${formData.logoHeightPx || 32}px` }} className="object-contain" />
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center font-black text-white text-xs">
                      {formData.shortName?.[0] || 'O'}
                    </div>
                  )}
                  <span className="font-extrabold text-sm text-white">{formData.siteName}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 font-mono text-[10px]">
                  {formData.headerStyle || 'sticky'}
                </span>
              </div>

              <p className="text-[11px] text-slate-400 line-clamp-2">
                {formData.siteDescription || 'الوصف الرسمي للموقع الذي يظهر للزوار ولمحركات البحث.'}
              </p>
            </div>
          </div>

          {/* Live Google Search Results Snippet */}
          <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-3 shadow-xl">
            <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
              <Search className="w-4 h-4" />
              <span>معاينة نتيجة محرك البحث Google</span>
            </h4>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-1.5 font-sans">
              <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-mono">
                <span>https://omnifetch.com</span>
                <span className="text-slate-600">›</span>
              </div>

              <h5 className="text-sm font-bold text-sky-400 hover:underline cursor-pointer line-clamp-1">
                {formData.siteName} - أداة التحميل الشاملة
              </h5>

              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                {formData.siteDescription || 'وصف نتائج البحث الرسمي لخدمة التنزيل المباشر.'}
              </p>
            </div>
          </div>

          {/* Integration Status Badges */}
          <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-3 shadow-xl">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>حالة الخدمات المرتبطة</span>
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-300 font-semibold">Google Analytics (GA4)</span>
                {formData.ga4Id ? (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">مرتبط</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-500 font-mono text-[10px]">غير مفعل</span>
                )}
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-300 font-semibold">Facebook Pixel</span>
                {formData.fbPixelId ? (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">مرتبط</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-500 font-mono text-[10px]">غير مفعل</span>
                )}
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-300 font-semibold">Google AdSense</span>
                {formData.adsenseClientId ? (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">جاهز</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-500 font-mono text-[10px]">غير مفعل</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
