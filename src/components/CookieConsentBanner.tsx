import React, { useState, useEffect } from 'react';
import { Cookie, Shield, Check, X, Settings, Info } from 'lucide-react';
import { SupportedLanguage } from '../types';

interface Props {
  currentLang: SupportedLanguage;
  onOpenCookiePolicy: () => void;
}

export const CookieConsentBanner: React.FC<Props> = ({ currentLang, onOpenCookiePolicy }) => {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);

  const [essential, setEssential] = useState(true);
  const [analytics, setAnalytics] = useState(true);
  const [advertising, setAdvertising] = useState(true);
  const [functional, setFunctional] = useState(true);

  const isRtl = currentLang === 'ar';

  useEffect(() => {
    try {
      const consent = localStorage.getItem('omnifetch_cookie_consent_v1');
      if (!consent) {
        setShowBanner(true);
      }
    } catch {
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = () => {
    try {
      const preferences = {
        essential: true,
        analytics: true,
        advertising: true,
        functional: true,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem('omnifetch_cookie_consent_v1', JSON.stringify(preferences));
    } catch (e) {
      console.error('Error saving cookie preferences:', e);
    }
    setShowBanner(false);
    setShowPreferencesModal(false);
  };

  const handleRejectNonEssential = () => {
    try {
      const preferences = {
        essential: true,
        analytics: false,
        advertising: false,
        functional: false,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem('omnifetch_cookie_consent_v1', JSON.stringify(preferences));
    } catch (e) {
      console.error('Error saving cookie preferences:', e);
    }
    setShowBanner(false);
    setShowPreferencesModal(false);
  };

  const handleSavePreferences = () => {
    try {
      const preferences = {
        essential: true,
        analytics,
        advertising,
        functional,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem('omnifetch_cookie_consent_v1', JSON.stringify(preferences));
    } catch (e) {
      console.error('Error saving custom cookie preferences:', e);
    }
    setShowBanner(false);
    setShowPreferencesModal(false);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Fixed Sticky Bottom Consent Banner */}
      <div className="fixed bottom-0 inset-x-0 z-50 p-4 md:p-6 bg-slate-950/95 border-t border-purple-500/30 backdrop-blur-2xl text-slate-100 shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-2xl shrink-0 mt-0.5">
              <Cookie className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{isRtl ? 'إشعار ملفات تعريف الارتباط (Cookies & Privacy Notice)' : 'Cookie & Privacy Consent'}</span>
                <span className="px-2 py-0.5 text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full font-mono">
                  EU GDPR & CCPA
                </span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
                {isRtl
                  ? 'نستخدم ملفات تعريف الارتباط (Cookies) لتحسين تجربتك، وحفظ تفضيلاتك، وتحليل حركة المرور، وعرض إعلانات مخصصة. يمكنك تخصيص الخيارات أو الاطلاع على سياسة الكوكيز الكاملة.'
                  : 'We use essential and analytics cookies to optimize your download experience, remember preferences, and personalize AdSense ads in compliance with GDPR.'}
                {' '}
                <button
                  onClick={onOpenCookiePolicy}
                  className="text-purple-400 hover:text-purple-300 underline font-semibold ml-1"
                >
                  {isRtl ? 'اقرأ سياسة ملفات الكوكيز الكاملة' : 'Read Cookie Policy'}
                </button>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full md:w-auto justify-end">
            <button
              onClick={() => setShowPreferencesModal(true)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5 text-purple-400" />
              <span>{isRtl ? 'تخصيص الخيارات' : 'Preferences'}</span>
            </button>

            <button
              onClick={handleRejectNonEssential}
              className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/80 rounded-xl text-xs font-bold transition-all"
            >
              <span>{isRtl ? 'رفض غير الضروري' : 'Reject Non-Essential'}</span>
            </button>

            <button
              onClick={handleAcceptAll}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black rounded-xl text-xs shadow-lg shadow-purple-900/40 transition-all active:scale-95 border border-purple-400/30 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isRtl ? 'قبول جميع الكوكيز' : 'Accept All Cookies'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Preferences Customization Modal */}
      {showPreferencesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-slate-900 border border-purple-500/30 rounded-3xl shadow-2xl p-6 text-slate-100 space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isRtl ? 'إعدادات وتخصيص ملفات تعريف الارتباط' : 'Cookie Preference Settings'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isRtl ? 'يمكنك اختيار أنواع الكوكيز التي تجيز للموقع استخدامها' : 'Customize which cookies you want to permit'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPreferencesModal(false)}
                aria-label="Close preferences modal"
                className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Essential */}
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>{isRtl ? 'الملفات الضرورية للتشغيل (Essential Cookies)' : 'Essential Cookies'}</span>
                    <span className="px-2 py-0.5 text-[9px] bg-emerald-500/20 text-emerald-300 rounded font-bold">
                      {isRtl ? 'مطلوبة دائماً' : 'Always Required'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {isRtl ? 'ضرورية لضمان أمان الموقع وتنزيل الفيديوهات وحفظ الجلسة.' : 'Necessary for security, basic navigation, and stream video fetching.'}
                  </p>
                </div>
                <input type="checkbox" checked disabled className="w-4 h-4 accent-purple-500" />
              </div>

              {/* Analytics */}
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-white">
                    {isRtl ? 'ملفات التحليل والأداء (Analytics Cookies)' : 'Analytics Cookies'}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {isRtl ? 'تساعدنا على فهم كيفية استخدام الموقع وتطوير سرعة السيرفرات.' : 'Helps us measure download speed performance and usage trends.'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="w-4 h-4 accent-purple-500 cursor-pointer"
                />
              </div>

              {/* Advertising */}
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-white">
                    {isRtl ? 'ملفات الإعلانات التسويقية (Google AdSense Cookies)' : 'Advertising & Marketing Cookies'}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {isRtl ? 'تُستخدم لعرض إعلانات ملائمة تغطي تكاليف الاستضافة المجانية.' : 'Used by Google AdSense to serve relevant ads that keep the app free.'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={advertising}
                  onChange={(e) => setAdvertising(e.target.checked)}
                  className="w-4 h-4 accent-purple-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                onClick={() => setShowPreferencesModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleSavePreferences}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-900/40"
              >
                {isRtl ? 'حفظ التفضيلات المختارة' : 'Save Selected Preferences'}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
