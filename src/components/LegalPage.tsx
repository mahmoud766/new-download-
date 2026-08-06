import React, { useState, FormEvent } from 'react';
import { SupportedLanguage } from '../types';
import { ArrowLeft, ShieldCheck, Mail, Send, CheckCircle2, FileText, Lock, Copyright, Cookie, Info } from 'lucide-react';

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

  const isRtl = currentLang === 'ar';

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
                    placeholder={isRtl ? 'example@domain.com' : 'example@domain.com'}
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
              أهلاً بكم في موقع **OmniDownloader**. نحن نلتزم بأعلى معايير الحماية والسرية التامة لخصوصية جميع زوارنا ومستخدمينا. يوضح هذا المستند الشامل كيفية تعاملنا مع البيانات والمعلومات الرقمية وفقاً للائحة العامة لحماية البيانات في الاتحاد الأوروبي (GDPR)، وقانون خصوصية المستهلك في كاليفورنيا (CCPA)، وسياسات برنامج Google AdSense الشاملة.
            </p>

            <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">2. عدم جمع البيانات الشخصية المباشرة</h2>
            <p>
              تعتمد خدمة OmniDownloader على مبدأ الخصوصية أولاً (Privacy-First). نحن لا نطلب من المستخدمين إنشاء حساب شخصي، ولا نجمع أسماء أو عناوين بريدية أو أرقام هواتف لتشغيل خدمة التنزيل. جميع عمليات استخراج الفيديوهات تتم برمجياً عبر تحويل بروتوكولات الفيديو بشكل مجهول تماماً.
            </p>

            <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">3. ملفات تعريف الارتباط (Cookies) وإعلانات Google AdSense</h2>
            <p>
              يستخدم موقعنا ملفات تعريف الارتباط (Cookies) لتحسين سرعة التصفح وتذكر الإعدادات المفضلة. كما يعتمد الموقع على شريك الإعلانات المعتمد Google AdSense لعرض إعلانات ملائمة. تحث جوجل مستخدميها على معرفة أن بائعي أدوات الطرف الثالث يستخدمون كوكيز DART لعرض الإعلانات بناءً على زيارات المستخدم للموقع. يمكن للمستخدم إيقاف استخدام كوكيز DART من خلال زيارة سياسة الخصوصية الخاصة بإعلانات Google وشبكة المحتوى.
            </p>

            <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">4. سجلات السيرفر وحقوق المستخدم في GDPR</h2>
            <p>
              تحتفظ سيرفراتنا بسجلات تشغيل مؤقتة (Server Access Logs) تحتفظ بالعنوان البروتوكولي IP بشكل مجهول الأجزاء الأخير لغرض الحماية من هجمات Denial of Service (DDoS) والحد من استهلاك النطاق الترددي. يحق لكل مستخدم بموجب قوانين GDPR طلب معرفة وتعديل وحذف تفضيلاته في أي وقت.
            </p>
          </div>
        )}

        {/* Terms of Service */}
        {type === 'terms' && (
          <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
            <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">1. القبول بشروط الخدمة</h2>
            <p>
              باستخدامك لموقع **OmniDownloader**، فإنك توافق التزاماً كاملاً وقانونياً بجميع الشروط والأحكام الموضحة في هذه الصفحة. إذا كنت لا توافق على أي جزء من هذه الشروط، يرجى عدم استخدام الخدمة.
            </p>

            <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">2. الاستخدام العادل وحقوق الملكية الفكرية</h2>
            <p>
              تم تصميم هذه الأداة لأغراض الاستخدام الشخصي والتعليمي فقط والتنزيل للنسخ الاحتياطي والمشاهدة في وضع عدم الاتصال (Offline Fair Use). يتحمل المستخدم وحده كافة المسؤوليات القانونية المتعلقة باحترام حقوق الملكية الفكرية لمنشئي المحتوى الأصليين على منصات تيك توك، يوتيوب، إنستغرام، وفيسبوك. يُمنع منعاً باتاً إعادة إنتشار أو بيع المقاطع المحملة لأغراض تجارية دون إذن كتابي صريح من مالك الحقوق.
            </p>

            <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">3. إخلاء المسؤولية عن الضمانات</h2>
            <p>
              تُقدم الخدمة "كما هي" (As-Is) دون أي ضمانات صريحة أو ضمنية بشأن استمرارية الخدمة أو خلوها التام من الأخطاء الناتجة عن تحديثات خوادم المنصات الخارجية.
            </p>
          </div>
        )}

        {/* DMCA Policy */}
        {type === 'dmca' && (
          <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
            <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">سياسة حقوق النشر والطبع الرقمية (DMCA Notice)</h2>
            <p>
              يحترم موقع **OmniDownloader** حقوق الملكية الفكرية للآخرين ويتوافق تماماً مع قانون أسطول حقوق النشر الرقمية (Digital Millennium Copyright Act - DMCA).
            </p>
            <p>
              نود أن نوضح أن موقعنا **لا يستضيف أو يخزن أي ملفات فيديو أو مواد محمية بحقوق الطبع والنشر على سيرفراته الخاصة**. جميع الفيديوهات التي يتم استخراجها واستعراضها تُستجلب مباشرة من السيرفرات الرسمية العامة للمنصات (مثل TikTok, YouTube, Instagram, Facebook).
            </p>

            <h3 className="text-sm font-bold text-white pt-2">إجراءات تقديم بلاغ الانتهاك (Takedown Request):</h3>
            <p>
              إذا كنت مالكاً لحقوق ملكية فكرية أو وكيلاً معتمداً وتعتقد أن هناك رابطاً ينتهك حقوقك، يرجى التواصل معنا عبر صفحة **اتصل بنا** وتزويدنا بالمعلومات التالية:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-300 pr-4">
              <li>توقيع إلكتروني أو فعلي للشخص المصرح له بالعمل نيابة عن مالك الحقوق.</li>
              <li>وصف تفصيلي للعمل المحمي بحقوق النشر الذي تدعي أنه تم انتهكه.</li>
              <li>رابط URL المباشر للرابط المعني على منصتنا.</li>
              <li>بيانات الاتصال الخاصة بك (البريد الإلكتروني ورقم الهاتف).</li>
            </ul>
          </div>
        )}

        {/* Cookie Policy */}
        {type === 'cookies' && (
          <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
            <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">سياسة ملفات تعريف الارتباط (Cookie Policy)</h2>
            <p>
              تشرح هذه السياسة ماهية ملفات تعريف الارتباط (Cookies) وكيفية استخدامها في موقع **OmniDownloader** للالتزام بتوجيهات ePrivacy واللائحة العامة لحماية البيانات (GDPR) الصادرة عن الاتحاد الأوروبي.
            </p>

            <h3 className="text-sm font-bold text-white">أنواع الكوكيز التي نستخدمها:</h3>
            <div className="space-y-2">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <strong className="text-white">1. الكوكيز الضرورية (Essential Cookies):</strong> خفيفة الوزن ومطلوبة لضمان حفظ الجلسة واستخراج روابط الفيديو بسلاسة.
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <strong className="text-white">2. كوكيز الإعلانات (Google AdSense Cookies):</strong> تتيح لشركائنا عرض إعلانات مخصصة تناسب اهتماماتك لدعم استمرارية الموقع مجاناً.
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <strong className="text-white">3. كوكيز التفضيلات واللغات (Preference Cookies):</strong> تُحفظ محلياً لتذكر لغتك المحددة (عربي، إنجليزي...) والمظهر المفضل (داكن/فاتح).
              </div>
            </div>
          </div>
        )}

        {/* About Us */}
        {type === 'about' && (
          <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
            <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">عن موقع أومني دونلودر (OmniDownloader)</h2>
            <p>
              مشروع **OmniDownloader** هو المنصة السحابية المتقدمة الأولى المخصصة لاستخراج وتحميل الفيديوهات والريلز والصوتيات من مختلف شبكات التواصل الاجتماعي بجودة عالية تصل إلى 4K وبدون علامة مائية.
            </p>
            <p>
              تم تطوير المحرك باستخدام أحدث تقنيات TypeScript، Node.js، وVite مع خوارزميات الذكاء الاصطناعي لفحص السيرفرات وتقديم تجربة تنزيل فورية وآمنة مجاناً لجميع المستخدمين عبر العالم.
            </p>
          </div>
        )}

        {/* Disclaimer */}
        {type === 'disclaimer' && (
          <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
            <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">إخلاء المسؤولية القانونية (Legal Disclaimer)</h2>
            <p>
              جميع العلامات التجارية والشعارات وأسماء المنصات المذكورة في هذا الموقع (بما في ذلك TikTok, YouTube, Instagram, Facebook, Twitter, Snapchat وغيرها) هي ملك لأصحابها المسجلين.
            </p>
            <p>
              موقع **OmniDownloader** غير تابع أو معتمد أو راسم من قبل أي من هذه المنصات، وإنما يقدم أداة مستقلة للربط التقني المباشر واستخراج الوسائط العامة المتاحة للمستخدمين.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
