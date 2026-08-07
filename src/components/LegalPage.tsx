import React, { useState, useEffect, FormEvent } from 'react';
import { SupportedLanguage, ManagedPage } from '../types';
import { ArrowLeft, ShieldCheck, Send, CheckCircle2 } from 'lucide-react';
import { getManagedPages, fetchManagedPagesFromDb } from '../lib/adminStorage';

interface LegalProps {
  type: 'privacy' | 'terms' | 'dmca' | 'disclaimer' | 'cookies' | 'about' | 'contact';
  currentLang: SupportedLanguage;
  onBack: () => void;
  onShowToast: (msg: string) => void;
}

export function LegalPage({ type, currentLang, onBack, onShowToast }: LegalProps) {
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);
  const [pages, setPages] = useState<ManagedPage[]>(getManagedPages());

  useEffect(() => {
    fetchManagedPagesFromDb().then((dbPages) => {
      if (dbPages && dbPages.length > 0) setPages(dbPages);
    });

    const handlePagesUpdated = (e: CustomEvent) => {
      if (e.detail) setPages(e.detail);
    };

    window.addEventListener('omnifetch_pages_updated', handlePagesUpdated as EventListener);
    return () => {
      window.removeEventListener('omnifetch_pages_updated', handlePagesUpdated as EventListener);
    };
  }, []);

  const isRtl = currentLang === 'ar';

  const matchedPage = pages.find((p) => {
    if (type === 'privacy' && (p.slug.includes('privacy') || p.id === 'page_privacy')) return true;
    if (type === 'terms' && (p.slug.includes('terms') || p.id === 'page_terms')) return true;
    if (type === 'dmca' && p.slug.includes('dmca')) return true;
    if (type === 'cookies' && p.slug.includes('cookie')) return true;
    if (type === 'disclaimer' && p.slug.includes('disclaimer')) return true;
    if (type === 'about' && p.slug.includes('about')) return true;
    return p.slug === type;
  });

  const handleSubmitContact = (e: FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;
    setSentSuccess(true);
    onShowToast(isRtl ? 'تم إرسال رسالتك بنجاح إلى فريق الدعم الفني!' : 'Message sent successfully to support team!');
    setContactName('');
    setContactEmail('');
    setContactMessage('');
  };

  const getTitle = () => {
    if (matchedPage?.title) return matchedPage.title;
    switch (type) {
      case 'privacy': return isRtl ? 'سياسة الخصوصية وحماية البيانات (Privacy Policy)' : 'Privacy Policy';
      case 'terms': return isRtl ? 'شروط وأحكام الاستخدام (Terms of Service)' : 'Terms of Service';
      case 'dmca': return isRtl ? 'سياسة حقوق الملكية والنشر (DMCA Disclaimer)' : 'DMCA Copyright Policy';
      case 'disclaimer': return isRtl ? 'إخلاء المسؤولية القانونية (Legal Disclaimer)' : 'Disclaimer';
      case 'cookies': return isRtl ? 'سياسة ملفات تعريف الارتباط (Cookie Policy)' : 'Cookie Policy';
      case 'about': return isRtl ? 'عن موقع أومني دونلودر (About Us)' : 'About Us';
      case 'contact': return isRtl ? 'اتصل بنا والدعم الفني (Contact Us)' : 'Contact Us';
      default: return 'Legal Document';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-6 animate-fade-in text-right rtl:text-right ltr:text-left">
      <button
        onClick={onBack}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all shadow-md"
      >
        <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
        <span>{isRtl ? 'العودة لأداة التحميل' : 'Back to Downloader'}</span>
      </button>

      <div className="p-6 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="p-3 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">{getTitle()}</h1>
            <p className="text-xs text-slate-400">
              {isRtl ? 'آخر تحديث: أغسطس 2026 • متوافق مع معايير الاتحاد الأوروبي (GDPR) وجوجل AdSense' : 'Last updated: August 2026 • EU GDPR & Google AdSense Compliant'}
            </p>
          </div>
        </div>

        {matchedPage && matchedPage.content ? (
          <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
            {matchedPage.content}
          </div>
        ) : (
          <>
            {/* Contact Us Form Page */}
            {type === 'contact' && (
              <div className="space-y-6">
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {isRtl
                    ? 'نحن هنا لمساعدتك! إذا كان لديك أي استفسار أو اقتراح أو بلاغ حول حقوق النشر أو مشكلة تقنية في استخراج الفيديوهات، يرجى ملء النموذج أدناه وسيتم الرد عليك في غضون 24 ساعة.'
                    : 'We are here to help! Send us any inquiry, DMCA notice or technical bug report and our team will respond within 24 hours.'}
                </p>

                {sentSuccess && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>{isRtl ? 'تم استلام رسالتك وسيتم التواصل معك قريباً!' : 'Your message has been received! We will reply shortly.'}</span>
                  </div>
                )}

                <form onSubmit={handleSubmitContact} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">{isRtl ? 'الاسم الكامل' : 'Full Name'}</label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                        placeholder={isRtl ? 'أدخل اسمك الكريم...' : 'Enter your name...'}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">{isRtl ? 'البريد الإلكتروني' : 'Email Address'}</label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                        placeholder="example@domain.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">{isRtl ? 'نص الرسالة أو البلاغ' : 'Your Message'}</label>
                    <textarea
                      rows={5}
                      required
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      placeholder={isRtl ? 'اكتب تفاصيل استفسارك أو طلبك هنا...' : 'Write your details or inquiry here...'}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-6 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-purple-900/40 flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isRtl ? 'إرسال الرسالة الآن' : 'Send Message Now'}</span>
                  </button>
                </form>
              </div>
            )}

            {/* Privacy Policy */}
            {type === 'privacy' && (
              <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">1. مقدمة والتزام بالخصوصية</h2>
                <p>
                  أهلاً بكم في موقعنا. نحن نلتزم بأعلى معايير الحماية والسرية التامة لخصوصية جميع زوارنا ومستخدمينا.
                </p>
              </div>
            )}

            {/* Terms of Service */}
            {type === 'terms' && (
              <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">1. القبول بشروط الخدمة</h2>
                <p>
                  باستخدامك لهذا الموقع، فإنك توافق التزاماً كاملاً وقانونياً بجميع الشروط والأحكام الموضحة في هذه الصفحة.
                </p>
              </div>
            )}

            {/* Cookie Policy */}
            {type === 'cookies' && (
              <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">سياسة ملفات تعريف الارتباط (Cookie Policy)</h2>
                <p>تشرح هذه السياسة كيفية استخدام ملفات تعريف الارتباط.</p>
              </div>
            )}

            {/* About Us */}
            {type === 'about' && (
              <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">عن الموقع</h2>
                <p>أفضل منصة لتحميل مقاطع الفيديو.</p>
              </div>
            )}

            {/* Disclaimer */}
            {type === 'disclaimer' && (
              <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">إخلاء المسؤولية القانونية</h2>
                <p>جميع العلامات التجارية ملك لأصحابها المسجلين.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
