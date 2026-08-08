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
              <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed">
                <section className="space-y-2">
                  <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">
                    {isRtl ? '1. التزامنا بحماية الخصوصية والبيانات' : '1. Our Privacy Commitment'}
                  </h2>
                  <p>
                    {isRtl
                      ? 'تعتبر خصوصية زوار ومستخدمي OmniFetch Pro ذات أهمية قصوى بالنسبة لنا. تشرح هذه وثيقة سياسة الخصوصية أنواع المعلومات الشخصية التي يتلقاها ويجمعها الموقع وكيفية استخدامها وحمايتها وفقًا للائحة العامة لحماية البيانات (GDPR) وقوانين الخصوصية العالمية.'
                      : 'At OmniFetch Pro, the privacy of our visitors is of paramount importance. This Privacy Policy outlines the types of personal and technical information received and collected by our service and how it is used and protected under GDPR and international privacy standards.'}
                  </p>
                </section>

                <section className="space-y-2">
                  <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">
                    {isRtl ? '2. عدم جمع روابط الفيديو الشخصية' : '2. No Logging of Personal Video Content'}
                  </h2>
                  <p>
                    {isRtl
                      ? 'نحن لا نطلب إنشاء حساب لاستخدام أداة التحميل الأساسية. جميع الفيديوهات المحملة يتم معالجتها مباشرة عبر السيرفرات دون تخزين محتوى الفيديو أو الاحتفاظ بسجل الروابط الخاصة بالزائر بشكل يرتبط بهويته الشخصية.'
                      : 'OmniFetch Pro does not require user account registration for basic downloads. Video extraction requests are processed dynamically in real-time. We do not store or mirror downloaded video files or associate extracted URLs with user identities.'}
                  </p>
                </section>

                <section className="space-y-2">
                  <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">
                    {isRtl ? '3. ملفات تعريف الارتباط وإعلانات Google AdSense' : '3. Cookies & Google AdSense Advertising'}
                  </h2>
                  <p>
                    {isRtl
                      ? 'يستخدم هذا الموقع إعلانات Google AdSense وشبكات إعلانية معتمدة من قبل طرف ثالث. تستخدم Google ملفات تعريف الارتباط (مثل ملف تعريف الارتباط DART) لعرض الإعلانات للمستخدمين بناءً على زيارتهم لموقعنا والمواقع الأخرى على الإنترنت. يمكن للمستخدمين اختيار عدم استخدام ملف تعريف الارتباط DART بزيارة سياسة الخصوصية الخاصة بشبكة Google للإعلانات والمحتوى.'
                      : 'OmniFetch Pro uses Google AdSense and authorized third-party ad networks. Google uses cookies (including DART cookies) to serve ads based on a user’s prior visits to our website or other websites. Users may opt out of personalized advertising by visiting Google Ads Settings or www.aboutads.info.'}
                  </p>
                </section>

                <section className="space-y-2">
                  <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">
                    {isRtl ? '4. تحليلات الموقع (Google Analytics 4)' : '4. Website Analytics (Google Analytics 4)'}
                  </h2>
                  <p>
                    {isRtl
                      ? 'نستخدم Google Analytics 4 لجمع إحصائيات عامة ومجهولة الهوية حول أداء الموقع وعدد الزيارات دون تتبع هويات المستخدمين أو عناوين IP الكاملة أو البيانات الحساسة.'
                      : 'We use Google Analytics 4 to analyze aggregated website performance and user traffic trends. Google Analytics collects anonymized interaction metrics without storing sensitive user identities or private inputs.'}
                  </p>
                </section>

                <section className="space-y-2">
                  <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">
                    {isRtl ? '5. حقوق المستخدم والاتصال' : '5. User Rights & Contact'}
                  </h2>
                  <p>
                    {isRtl
                      ? 'يحق لجميع الزوار طلب الاطلاع على بياناتهم أو تعديل تفضيلات الكوكيز في أي وقت. لأي استفسارات تتعلق بالخصوصية، يمكنكم التواصل معنا عبر صفحة اتصل بنا أو البريد الإلكتروني support@omnifetchpro.com.'
                      : 'Users maintain full rights to manage cookie consents or request privacy inquiries at any time. For privacy inquiries, please reach out via our Contact page or support@omnifetchpro.com.'}
                  </p>
                </section>
              </div>
            )}

            {/* Terms of Service */}
            {type === 'terms' && (
              <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed">
                <section className="space-y-2">
                  <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">
                    {isRtl ? '1. القبول بشروط الاستخدام' : '1. Acceptance of Terms'}
                  </h2>
                  <p>
                    {isRtl
                      ? 'باستخدامك لموقع OmniFetch Pro، فإنك توافق على الالتزام الكامل بشروط وأحكام الخدمة هذه وكافة القوانين واللوائح المعمول بها.'
                      : 'By accessing or using OmniFetch Pro, you agree to be bound by these Terms of Service and all applicable local and international laws.'}
                  </p>
                </section>

                <section className="space-y-2">
                  <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">
                    {isRtl ? '2. الاستخدام المقبول وحقوق الملكية' : '2. Acceptable Use & Intellectual Property'}
                  </h2>
                  <p>
                    {isRtl
                      ? 'تم تصميم OmniFetch Pro ليكون أداة مساعدة للاستخدام الشخصي والتعليمي والاحتفاظ بنسخ احتياطية من المحتوى المملوك للمستخدم. يتحمل المستخدم المسؤولية القانونية الكاملة للتحقق من امتلاكه حقوق النشر أو إذن من صاحب المحتوى قبل تحميل أي فيديو.'
                      : 'OmniFetch Pro is provided solely for personal, educational, and fair-use archiving purposes. Users are strictly responsible for obtaining proper permission or license from content owners before downloading copyrighted materials.'}
                  </p>
                </section>

                <section className="space-y-2">
                  <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">
                    {isRtl ? '3. حدود المسؤولية والضمانات' : '3. Limitation of Liability'}
                  </h2>
                  <p>
                    {isRtl
                      ? 'تُقدم الخدمة "كما هي" دون أي ضمانات صريحة أو ضمنية باستمرار توفر التنزيلات من المنصات الخارجية، حيث تخضع الخدمة للتحديثات والتغييرات التقنية الخاصة بتلك المنصات.'
                      : 'The service is provided on an "AS IS" and "AS AVAILABLE" basis. OmniFetch Pro makes no warranties regarding uninterrupted availability, as third-party video platform APIs may undergo changes beyond our control.'}
                  </p>
                </section>
              </div>
            )}

            {/* DMCA Copyright Policy */}
            {type === 'dmca' && (
              <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed">
                <section className="space-y-2">
                  <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">
                    {isRtl ? '1. سياسة احترام حقوق الملكية الفكرية (DMCA)' : '1. DMCA Copyright Compliance'}
                  </h2>
                  <p>
                    {isRtl
                      ? 'يحترم OmniFetch Pro حقوق الملكية الفكرية للآخرين ويلتزم بقانون حقوق المؤلف للحلف الرقمي (DMCA). نحن لا نستضيف أي فيديوهات على سيرفراتنا، بل نعمل كأداة تحويل واستخراج مباشرة.'
                      : 'OmniFetch Pro respects the intellectual property rights of creators and complies with the Digital Millennium Copyright Act (DMCA). We do not store or host copyrighted media files on our infrastructure.'}
                  </p>
                </section>

                <section className="space-y-2">
                  <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">
                    {isRtl ? '2. تقديم بلاغات الانتهاك' : '2. Filing a Notice of Infringement'}
                  </h2>
                  <p>
                    {isRtl
                      ? 'إذا كنت صاحب حق نشر وترغب في تقديم بلاغ عن أي رابط أو استخدام غير مصرح به، يرجى مراسلتنا عبر النموذج أو البريد support@omnifetchpro.com مع تضمين إثبات الملكية والرابط المعني.'
                      : 'If you are a copyright holder and believe material available via our conversion tool infringes your rights, please submit a written notice to support@omnifetchpro.com including proof of ownership and specific URLs.'}
                  </p>
                </section>

                <section className="space-y-2">
                  <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">
                    {isRtl ? '3. إخلاء مسؤولية العلامات التجارية' : '3. Trademark Disclaimer'}
                  </h2>
                  <p>
                    {isRtl
                      ? 'جميع أسماء المنصات والعلامات التجارية مثل (TikTok, YouTube, Facebook, Instagram, Snapchat, X, Pinterest) هي ملك لأصحابها المسجلين. OmniFetch Pro موقع مستقل تماماً ولا يتبع لأي من هذه الشركات.'
                      : 'All platform names, logos, and trademarks (including TikTok, YouTube, Facebook, Instagram, Snapchat, X, Pinterest) belong to their respective registered owners. OmniFetch Pro is an independent third-party utility and is not affiliated with, authorized, or endorsed by any of these entities.'}
                  </p>
                </section>
              </div>
            )}

            {/* Cookie Policy */}
            {type === 'cookies' && (
              <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed">
                <section className="space-y-2">
                  <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">
                    {isRtl ? '1. ما هي ملفات تعريف الارتباط؟' : '1. What Are Cookies?'}
                  </h2>
                  <p>
                    {isRtl
                      ? 'ملفات تعريف الارتباط هي ملفات نصية صغيرة يتم حفظها على جهازك عند زيارة الموقع للمساعدة في تذكر تفضيلاتك وتوفير أداء أسرع وإعلانات ملائمة.'
                      : 'Cookies are small text files stored on your device when visiting websites to help personalize settings, streamline navigation, and serve relevant advertisements.'}
                  </p>
                </section>

                <section className="space-y-2">
                  <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">
                    {isRtl ? '2. أنواع الكوكيز المستخدمة' : '2. Categories of Cookies Used'}
                  </h2>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    <li>
                      <strong>{isRtl ? 'الكوكيز الضرورية:' : 'Essential Cookies:'}</strong> {isRtl ? 'لحفظ إعدادات الجلسة واللغة.' : 'Required for core website functionality and session stability.'}
                    </li>
                    <li>
                      <strong>{isRtl ? 'كوكيز الإعلانات (Google AdSense):' : 'Advertising Cookies (Google AdSense):'}</strong> {isRtl ? 'لعرض إعلانات غير مزعجة تناسب الزائر وتغطي تكاليف السيرفرات.' : 'Used to deliver non-intrusive ads and prevent ad fraud.'}
                    </li>
                    <li>
                      <strong>{isRtl ? 'كوكيز التحليل:' : 'Analytics Cookies:'}</strong> {isRtl ? 'لقياس سرعة الموقع وإحصائيات الزيارات العامة.' : 'Used to measure site latency and aggregate traffic trends.'}
                    </li>
                  </ul>
                </section>
              </div>
            )}

            {/* About Us */}
            {type === 'about' && (
              <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed">
                <section className="space-y-2">
                  <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">
                    {isRtl ? 'عن أومني فيتش برو (OmniFetch Pro)' : 'About OmniFetch Pro'}
                  </h2>
                  <p>
                    {isRtl
                      ? 'OmniFetch Pro هي منصة ويب مجانية متخصصة في توفير أدوات استخراج وتحميل مقاطع الفيديو والريلز عالية الدقة (HD / 4K) وتحويل الصوتيات بصيغة MP3 من مختلف منصات التواصل الاجتماعي الرئيسية.'
                      : 'OmniFetch Pro is a free online media extraction utility designed to help users download HD/4K videos, reels, and audio tracks from popular social networks with high speed and zero intrusive popups.'}
                  </p>
                </section>

                <section className="space-y-2">
                  <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">
                    {isRtl ? 'رؤيتنا ومبادئنا' : 'Our Mission & Values'}
                  </h2>
                  <p>
                    {isRtl
                      ? 'نهدف إلى تقديم تجربة أداء سريعة، آمنة، ونظيفة 100% للزوار مع الالتزام الكامل بمعايير الخصوصية وشفافية الإعلانات وقوانين حماية حقوق المؤلف.'
                      : 'We aim to deliver a fast, clean, and 100% transparent user experience while maintaining strict compliance with user privacy, advertising standards, and copyright regulations.'}
                  </p>
                </section>
              </div>
            )}

            {/* Disclaimer */}
            {type === 'disclaimer' && (
              <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed">
                <section className="space-y-2">
                  <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">
                    {isRtl ? 'إخلاء المسؤولية القانونية' : 'Legal Disclaimer'}
                  </h2>
                  <p>
                    {isRtl
                      ? 'جميع المحتويات والعلامات التجارية وشعارات المنصات المذكورة في هذا الموقع هي ملك حصري لأصحابها المسجلين. يقدم موقع OmniFetch Pro خدمات استخراج الوسائط للأغراض الشخصية والتعليمية فقط. يلتزم المستخدم بكافة القوانين المنظمة لاستخدام وتداول المحتوى.'
                      : 'All product names, logos, and brands mentioned on this website belong to their respective trademark holders. OmniFetch Pro is provided strictly for personal archiving and educational use. Users are responsible for complying with applicable copyright laws.'}
                  </p>
                </section>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
