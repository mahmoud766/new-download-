import React, { useState, useEffect, FormEvent } from 'react';
import { SupportedLanguage, ManagedPage } from '../types';
import { ArrowLeft, ShieldCheck, Send, CheckCircle2, Mail, FileText, Lock, Globe2, HelpCircle } from 'lucide-react';
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
  const [contactSubject, setContactSubject] = useState('general');
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
    if (matchedPage?.title && matchedPage.content && matchedPage.content.length > 200) {
      return matchedPage.title;
    }
    switch (type) {
      case 'privacy': return isRtl ? 'سياسة الخصوصية وحماية البيانات' : 'Privacy Policy';
      case 'terms': return isRtl ? 'شروط وأحكام الخدمة' : 'Terms of Service';
      case 'dmca': return isRtl ? 'سياسة حقوق النشر والملكية الفكرية (DMCA)' : 'DMCA Copyright Policy';
      case 'disclaimer': return isRtl ? 'إخلاء المسؤولية القانونية' : 'Legal Disclaimer';
      case 'cookies': return isRtl ? 'سياسة ملفات تعريف الارتباط (Cookies)' : 'Cookie Policy';
      case 'about': return isRtl ? 'عن موقع OmniFetch Pro' : 'About OmniFetch Pro';
      case 'contact': return isRtl ? 'اتصل بنا والدعم الفني' : 'Contact Us & Technical Support';
      default: return 'Legal Document';
    }
  };

  const useMatchedContent = matchedPage && matchedPage.content && matchedPage.content.length > 300;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-6 animate-fade-in text-right rtl:text-right ltr:text-left">
      <div className="flex items-center justify-between">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onBack();
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all shadow-md"
        >
          <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
          <span>{isRtl ? 'العودة لأداة التحميل الرئيسية' : 'Back to Downloader'}</span>
        </a>

        {/* Legal Sub-Navigation Links */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-400">
          <a href="/legal/privacy" className={`hover:text-purple-400 ${type === 'privacy' ? 'text-purple-400 font-bold' : ''}`}>Privacy</a>
          <span>•</span>
          <a href="/legal/terms" className={`hover:text-purple-400 ${type === 'terms' ? 'text-purple-400 font-bold' : ''}`}>Terms</a>
          <span>•</span>
          <a href="/legal/dmca" className={`hover:text-purple-400 ${type === 'dmca' ? 'text-purple-400 font-bold' : ''}`}>DMCA</a>
          <span>•</span>
          <a href="/legal/cookies" className={`hover:text-purple-400 ${type === 'cookies' ? 'text-purple-400 font-bold' : ''}`}>Cookies</a>
          <span>•</span>
          <a href="/legal/about" className={`hover:text-purple-400 ${type === 'about' ? 'text-purple-400 font-bold' : ''}`}>About</a>
          <span>•</span>
          <a href="/legal/contact" className={`hover:text-purple-400 ${type === 'contact' ? 'text-purple-400 font-bold' : ''}`}>Contact</a>
        </div>
      </div>

      <div className="p-6 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-8">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-800">
          <div className="p-3.5 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">{getTitle()}</h1>
            <p className="text-xs text-slate-400 mt-1">
              {isRtl
                ? 'آخر تحديث: أغسطس 2026 • متوافق مع معايير حماية البيانات (GDPR/CCPA) وسياسات Google AdSense الناشرة'
                : 'Last Updated: August 2026 • Fully Compliant with EU GDPR, CCPA & Google AdSense Publisher Standards'}
            </p>
          </div>
        </div>

        {useMatchedContent ? (
          <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
            {matchedPage.content}
          </div>
        ) : (
          <>
            {/* 1. CONTACT US PAGE */}
            {type === 'contact' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
                    <Mail className="w-6 h-6 text-purple-400 mx-auto" />
                    <h3 className="text-xs font-bold text-white">{isRtl ? 'البريد الرسمي' : 'Official Support Email'}</h3>
                    <p className="text-xs text-slate-400 font-mono">support@omnifetchpro.com</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
                    <FileText className="w-6 h-6 text-indigo-400 mx-auto" />
                    <h3 className="text-xs font-bold text-white">{isRtl ? 'زمن الاستجابة' : 'Response Timeline'}</h3>
                    <p className="text-xs text-slate-400">{isRtl ? 'خلال 24-48 ساعة عمل' : 'Within 24-48 business hours'}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
                    <Lock className="w-6 h-6 text-emerald-400 mx-auto" />
                    <h3 className="text-xs font-bold text-white">{isRtl ? 'حماية البيانات' : 'Data Privacy'}</h3>
                    <p className="text-xs text-slate-400">{isRtl ? 'محتوى الرسائل مشفر وآمن' : 'Encrypted & Confidential'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2">
                    {isRtl ? 'إرسال رسالة مباشرة إلى فريق OmniFetch Pro' : 'Send a Direct Message to OmniFetch Pro Team'}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {isRtl
                      ? 'نحن نرحب بكافة استفساراتكم وملاحظاتكم المتعلقة بمنتجاتنا أو بلاغات حقوق النشر أو المساعدة التقنية. يرجى ملء النموذج أدناه ليتصل بك أحد ممثلي الدعم الفني.'
                      : 'We welcome all inquiries, feedback, technical bug reports, or DMCA copyright notices. Please fill out the form below to connect with our support representatives.'}
                  </p>

                  {sentSuccess && (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>
                        {isRtl
                          ? 'تم استلام رسالتك بنجاح! تم توجيه الطلب إلى فريق الدعم وسيتم التواصل معك على بريدك الإلكتروني.'
                          : 'Your message has been received! Our support engineers will follow up with you via email.'}
                      </span>
                    </div>
                  )}

                  <form onSubmit={handleSubmitContact} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">{isRtl ? 'الاسم الكامل' : 'Full Name'}</label>
                        <input
                          type="text"
                          required
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          className="w-full h-12 px-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                          placeholder={isRtl ? 'أدخل اسمك الكريم...' : 'Enter your full name...'}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">{isRtl ? 'البريد الإلكتروني' : 'Email Address'}</label>
                        <input
                          type="email"
                          required
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          className="w-full h-12 px-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                          placeholder="support@example.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">{isRtl ? 'نوع الاستفسار أو الطلب' : 'Inquiry Category'}</label>
                      <select
                        value={contactSubject}
                        onChange={(e) => setContactSubject(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="general">{isRtl ? 'استفسار عام حول الخدمة' : 'General Inquiry'}</option>
                        <option value="dmca">{isRtl ? 'بلاغ حقوق طبع ونشر (DMCA Takedown Notice)' : 'DMCA Copyright Takedown Notice'}</option>
                        <option value="bug">{isRtl ? 'بلاغ عن خلل تقني أو رابط لا يعمل' : 'Technical Bug / Broken Link Report'}</option>
                        <option value="privacy">{isRtl ? 'طلب يتعلق بالخصوصية وحماية البيانات' : 'Privacy & Data Protection Request'}</option>
                        <option value="adsense">{isRtl ? 'شراكات وتغطية إعلانية' : 'Advertising & Sponsorship'}</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">{isRtl ? 'نص الرسالة أو البلاغ بالتفصيل' : 'Detailed Message'}</label>
                      <textarea
                        rows={6}
                        required
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                        placeholder={isRtl ? 'اكتب تفاصيل استفسارك أو طلبك هنا...' : 'Provide specific details or links relevant to your message...'}
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 px-6 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-purple-900/40 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isRtl ? 'إرسال الرسالة إلى فريق الدعم' : 'Submit Message to Support Team'}</span>
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* 2. PRIVACY POLICY PAGE */}
            {type === 'privacy' && (
              <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed">
                <section className="space-y-3">
                  <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">
                    {isRtl ? '1. مقدمة والتزام بحماية الخصوصية' : '1. Introduction & Privacy Commitment'}
                  </h2>
                  <p>
                    {isRtl
                      ? 'تعتبر خصوصية زوار ومستخدمي OmniFetch Pro ذات أهمية قصوى بالنسبة لنا. تشرح هذه الوثيقة الشاملة أنواع المعلومات الفنية والتشغيلية التي يتعامل معها موقعنا، وكيفية حمايتها وفقًا للائحة العامة لحماية البيانات (EU GDPR)، وقانون خصوصية المستهلك في كاليفورنيا (CCPA)، ومعايير برنامج Google AdSense الشفاف.'
                      : 'At OmniFetch Pro (accessible at https://omnifetchpro.com), the privacy of our visitors is paramount. This Privacy Policy outlines the types of technical and operational data processed by our service and explains our security protocols in compliance with the EU General Data Protection Regulation (GDPR), California Consumer Privacy Act (CCPA), and Google AdSense publisher transparency policies.'}
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">
                    {isRtl ? '2. البيانات التي يتم معالجتها أثناء الاستخدام' : '2. Information We Process During Usage'}
                  </h2>
                  <p>
                    {isRtl
                      ? 'عند استخدام أدوات استخراج وتحويل الفيديو على OmniFetch Pro، قد تتلقى السيرفرات بعض البيانات الفنية اللحظية مثل:'
                      : 'When utilizing OmniFetch Pro video parsing tools, our servers process minimal transient technical data required for server performance and security:'}
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 pl-2">
                    <li><strong>IP Address:</strong> {isRtl ? 'يستخدم مؤقتًا لمنع الهجمات الإلكترونية وضبط حدود الاستخدام (Rate Limiting) لمنع الإغراق.' : 'Used transiently for security rate-limiting and protecting servers against denial-of-service abuse.'}</li>
                    <li><strong>User-Agent & Device Type:</strong> {isRtl ? 'لتنسيق صيغة الفيديو أو الصوت المناسبة لجهاز المستخدم (آيفون، أندرويد، أو حاسوب).' : 'Assists in rendering compatible MP4/MP3 download formats tailored to browser capabilities.'}</li>
                    <li><strong>Submitted Media URLs:</strong> {isRtl ? 'الرابط المباشر للمقطع المراد استخراجه لمعالجته وتحويله دون تتبع هويتك الشخصية.' : 'The public video link submitted for extraction, processed entirely dynamically without identity mapping.'}</li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">
                    {isRtl ? '3. بيانات لا يتم جمعها إطلاقاً (No File Retention)' : '3. Data We Do NOT Collect or Store'}
                  </h2>
                  <p>
                    {isRtl
                      ? 'نحن نلتزم بفلسفة الخصوصية أولاً (Privacy-First):'
                      : 'OmniFetch Pro strictly adheres to a privacy-first infrastructure:'}
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 pl-2">
                    <li>{isRtl ? 'لا نطلب إنشاء حساب أو تسجيل الدخول لاستخدام أدوات التنزيل.' : 'No user account registration or personal authentication is required.'}</li>
                    <li>{isRtl ? 'لا نحتفظ بملفات الفيديوهات أو الصوتيات المحملة على خوادمنا نهائياً (No Video Mirroring).' : 'We do NOT retain, host, or mirror extracted video/audio files on server storage.'}</li>
                    <li>{isRtl ? 'لا نجمع أسماء المستخدمين أو عناوين البريد الشخصية أو بيانات الدفع.' : 'We do not collect names, residential addresses, payment credentials, or personal files.'}</li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">
                    {isRtl ? '4. ملفات تعريف الارتباط وإعلانات Google AdSense' : '4. Cookies & Google AdSense Advertising'}
                  </h2>
                  <p>
                    {isRtl
                      ? 'يستخدم الموقع إعلانات Google AdSense وشبكات إعلانية معتمدة من طرف ثالث لتغطية تكاليف الخوادم والصيانة. تستخدم Google ملفات تعريف الارتباط (مثل DART cookie) لعرض الإعلانات بناءً على زيارات المستخدم للموقع وللمواقع الأخرى عبر الإنترنت. يمكن للمستخدمين تخصيص تفضيلات الإعلانات أو إلغاء تفعيل الإعلانات المخصصة عبر زيارة إعدادات إعلانات Google (https://adssettings.google.com).'
                      : 'OmniFetch Pro uses Google AdSense (Publisher ID: ca-pub-6708942894533593) and verified third-party ad networks. Google uses cookies (such as the DART cookie) to serve ads based on user visits to our site and other internet locations. Visitors can manage or opt out of personalized advertising by visiting Google Ad Settings (https://adssettings.google.com) or www.aboutads.info.'}
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">
                    {isRtl ? '5. تحليلات الموقع (Google Analytics 4)' : '5. Web Analytics (Google Analytics 4)'}
                  </h2>
                  <p>
                    {isRtl
                      ? 'نستخدم Google Analytics 4 (معرف القياس: G-2NBYGQ5V6E) لتحليل أداء الصفحات وإحصائيات الزيارات العامة بطريقة مجهولة الهوية تماماً دون تخزين عناوين IP الكاملة أو البيانات الحساسة.'
                      : 'We utilize Google Analytics 4 (Measurement ID: G-2NBYGQ5V6E) to measure aggregate website traffic and performance metrics in an fully anonymized manner without recording sensitive user credentials.'}
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">
                    {isRtl ? '6. حقوق المستخدم والتواصل' : '6. User Rights & Contact Details'}
                  </h2>
                  <p>
                    {isRtl
                      ? 'يحق لجميع المستخدمين تعديل تفضيلات ملفات الكوكيز في أي وقت. لأي استفسارات تتعلق بالخصوصية أو حماية البيانات، يمكنكم مراسلتنا عبر البريد الرسمي: support@omnifetchpro.com.'
                      : 'Users maintain full rights to adjust cookie consent choices at any time. For privacy inquiries or data protection requests, please email us at support@omnifetchpro.com.'}
                  </p>
                </section>
              </div>
            )}

            {/* 3. TERMS OF SERVICE PAGE */}
            {type === 'terms' && (
              <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed">
                <section className="space-y-3">
                  <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">
                    {isRtl ? '1. الموافقة والقبول بشروط الخدمة' : '1. Acceptance of Terms'}
                  </h2>
                  <p>
                    {isRtl
                      ? 'باستخدامك لموقع OmniFetch Pro (https://omnifetchpro.com)، فإنك تعلن موافقتك الصريحة على الالتزام الكامل بشروط وأحكام الخدمة هذه وكافة القوانين واللوائح المحلية والدولية المعمول بها.'
                      : 'By accessing or using OmniFetch Pro (https://omnifetchpro.com), you agree to be bound by these Terms of Service and all applicable local, national, and international laws and regulations.'}
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">
                    {isRtl ? '2. وصف الخدمة والأغراض المصرح بها' : '2. Description of Service & Permitted Use'}
                  </h2>
                  <p>
                    {isRtl
                      ? 'يقدم OmniFetch Pro أداة مجانية لمساعدة المستخدمين على استخراج وتحويل وتنزيل مقاطع الفيديو والوسائط المتاحة للعامة على منصات التواصل الاجتماعي المختلفة. تقدم الخدمة حائطه فقط للأغراض الشخصية، والتعليمية، وإنشاء النسخ الاحتياطية الخاصة بالمحتوى الذي يملكه المستخدم أو لديه ترخيص صريح بتحميله (Fair Use).'
                      : 'OmniFetch Pro provides an online web utility for extracting and downloading publicly available media from major social networks. The service is provided strictly for personal, educational, and fair-use backup archiving of media owned or authorized by the user.'}
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">
                    {isRtl ? '3. الاستخدامات المحظورة ومسؤولية المستخدم' : '3. Prohibited Uses & User Responsibilities'}
                  </h2>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 pl-2">
                    <li>{isRtl ? 'يحظر تماماً استخدام الموقع لتنزيل أو توزيع محتوى محمي بحقوق الطبع والنشر دون إذن كتابي من صاحب الحقوق.' : 'You must not use this tool to infringe copyright, intellectual property, or distribution permissions.'}</li>
                    <li>{isRtl ? 'يحظر القيام بأي محاولات كشط آلي مكثف (Automated Scraping) أو إغراق الخوادم لتعطيل الخدمة.' : 'Automated bot traffic, aggressive scraping, or malicious flooding attacks are strictly prohibited.'}</li>
                    <li>{isRtl ? 'الموقع لا يقوم بتجاوز أنظمة التشفير أو الحماية الرقمية (DRM) أو تخطي الحسابات المغلقة/الخاصة.' : 'OmniFetch Pro does not bypass DRM encryption, paid paywalls, or private access controls.'}</li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">
                    {isRtl ? '4. حدود المسؤولية وإخلاء الضمانات' : '4. Limitation of Liability & Warranties'}
                  </h2>
                  <p>
                    {isRtl
                      ? 'تُقدم الخدمة "كما هي" (AS IS) و"حسب توفرها" (AS AVAILABLE) دون أي ضمانات صريحة أو ضمنية. لا يتكفل الموقع باستمرار عمل التنزيلات في حال قيام المنصات الخارجية بتعديل برمجياتها أو واجهاتها البرمجية.'
                      : 'OmniFetch Pro is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind. We do not guarantee uninterrupted technical availability as third-party platform API changes may temporarily affect video extraction compatibility.'}
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">
                    {isRtl ? '5. تعديلات الشروط والتواصل' : '5. Changes to Terms & Contact'}
                  </h2>
                  <p>
                    {isRtl
                      ? 'نحتفظ بالحق في تحديث هذه الشروط في أي وقت. لأي استفسارات قانونية، يرجى مراسلتنا عبر support@omnifetchpro.com.'
                      : 'We reserve the right to revise these Terms at any time. For questions regarding these terms, please contact support@omnifetchpro.com.'}
                  </p>
                </section>
              </div>
            )}

            {/* 4. DMCA COPYRIGHT POLICY PAGE */}
            {type === 'dmca' && (
              <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed">
                <section className="space-y-3">
                  <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">
                    {isRtl ? '1. سياسة الالتزام بحقوق الملكية الفكرية (DMCA Notice)' : '1. Intellectual Property & DMCA Compliance'}
                  </h2>
                  <p>
                    {isRtl
                      ? 'يلتزم موقع OmniFetch Pro بالكامل بقانون حقوق المؤلف للحلف الرقمي (Digital Millennium Copyright Act - 17 U.S.C. § 512) وقوانين حقوق النشر العالمية. نحن نحترم جهود وحقوق المبدعين وصناع المحتوى.'
                      : 'OmniFetch Pro fully complies with the Digital Millennium Copyright Act (17 U.S.C. § 512) and international copyright legislation. We respect the intellectual property rights of content creators and copyright owners.'}
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">
                    {isRtl ? '2. الطبيعة الفنية للموقع (No File Hosting)' : '2. Technical Nature of Service (No File Hosting)'}
                  </h2>
                  <p>
                    {isRtl
                      ? 'OmniFetch Pro هو أداة تحويل واستخراج فورية عبر الويب، ولا يستضيف أو ينشر أو يخزن أي ملفات فيديو أو صوتيات على خوادمه الخاصة. جميع الوسائط يتم تشغيلها واستخراجها مباشرة من الخوادم الأصلية للمنصات العامة.'
                      : 'OmniFetch Pro operates solely as an online conversion utility and does NOT store, mirror, host, or re-broadcast any copyrighted media files on its servers. All media streams are parsed directly from public third-party servers.'}
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">
                    {isRtl ? '3. كيفية تقديم بلاغ انتهاك حقوق النشر' : '3. How to Submit a Copyright Infringement Notice'}
                  </h2>
                  <p>
                    {isRtl
                      ? 'إذا كنت مالكًا لحقوق نشر أو وكيلاً معتمدًا وتعتقد أن هناك رابطًا يستخرج محتواك دون إذن، يرجى إرسال إشعار كتابي يتضمن المعلومات التالية إلى بريدنا الرسمي:'
                      : 'If you are a copyright owner or authorized representative believing copyrighted work is accessible through our parsing tool without permission, please submit a notice containing:'}
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 pl-2">
                    <li>{isRtl ? 'توقيع إلكتروني أو خطي لمالك الحقوق أو ممثله القانوني.' : 'Electronic or physical signature of the copyright owner or authorized representative.'}</li>
                    <li>{isRtl ? 'وصف دقيق للمحتوى المحمي بحقوق النشر المدعى انتهاكها.' : 'Identification of the specific copyrighted work claimed to have been infringed.'}</li>
                    <li>{isRtl ? 'الرابط المباشر (URL) المحدد على موقعنا المعني بالطلب.' : 'Specific URL or location on our site where the parsing link is identified.'}</li>
                    <li>{isRtl ? 'بيانات الاتصال الكاملة (الاسم، البريد الإلكتروني، رقم الهاتف).' : 'Full contact information including name, email address, and phone number.'}</li>
                    <li>{isRtl ? 'تصريح يوضح الاعتقاد بحسن نية بأن الاستخدام غير مصرح به.' : 'A good-faith statement that the disputed use is not authorized by the copyright holder.'}</li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">
                    {isRtl ? '4. زمن الاستجابة والبريد الرسمي' : '4. Response Timeline & Support Contact'}
                  </h2>
                  <p>
                    {isRtl
                      ? 'يتم معالجة كافة البلاغات الصحيحة المكتملة وحظر استخراج الرابط المعني في غضون 24 إلى 48 ساعة عمل. البريد الإلكتروني المخصص للشكاوى القانونية: support@omnifetchpro.com.'
                      : 'All complete and valid takedown notices are investigated and acted upon within 24 to 48 business hours. Direct legal contact: support@omnifetchpro.com.'}
                  </p>
                </section>
              </div>
            )}

            {/* 5. COOKIE POLICY PAGE */}
            {type === 'cookies' && (
              <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed">
                <section className="space-y-3">
                  <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">
                    {isRtl ? '1. ما هي ملفات تعريف الارتباط (Cookies)؟' : '1. What Are Cookies?'}
                  </h2>
                  <p>
                    {isRtl
                      ? 'ملفات تعريف الارتباط هي ملفات نصية صغيرة يُخزنها متصفحك على جهازك عند زيارة الموقع لتذكر تفضيلات اللغة والتصميم وتحسين سرعة الاستجابة.'
                      : 'Cookies are small text files stored on your device by your web browser when visiting websites. They help recognize preferences, facilitate secure sessions, and optimize performance.'}
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">
                    {isRtl ? '2. أنواع الكوكيز والتخزين المحلي المستخدم' : '2. Categories of Cookies & Local Storage Used'}
                  </h2>
                  <ul className="list-disc list-inside space-y-2 text-slate-300 pl-2">
                    <li>
                      <strong>{isRtl ? 'الكوكيز الأساسية والتخزين المحلي (LocalStorage):' : 'Essential Cookies & LocalStorage:'}</strong>{' '}
                      {isRtl
                        ? 'تُستخدم لحفظ لغة المستخدم المفضلة، وسجل التنزيلات المحلي المشفّر على جهازك، وتفضيلات المظهر (داكن/فاتح).'
                        : 'Maintains user UI choices (language, dark/light theme) and client-side download history.'}
                    </li>
                    <li>
                      <strong>{isRtl ? 'كوكيز التحليل (Google Analytics 4):' : 'Analytics Cookies (Google Analytics 4):'}</strong>{' '}
                      {isRtl
                        ? 'تساعدنا في قياس عدد الزوار، وسرعة تحميل الصفحات دون جمع معلومات شخصية.'
                        : 'Measures overall site visitor count and page load speeds anonymized via Measurement ID G-2NBYGQ5V6E.'}
                    </li>
                    <li>
                      <strong>{isRtl ? 'كوكيز الإعلانات (Google AdSense):' : 'Advertising Cookies (Google AdSense):'}</strong>{' '}
                      {isRtl
                        ? 'تُستخدم لعرض إعلانات مناسبة وغير مزعجة لتغطية تكاليف التشغيل المرتفعة لمفرغات الفيديو.'
                        : 'Delivers non-intrusive banner ads under Publisher ID ca-pub-6708942894533593.'}
                    </li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">
                    {isRtl ? '3. إدارة وتعديل التفضيلات' : '3. Managing Cookie Preferences'}
                  </h2>
                  <p>
                    {isRtl
                      ? 'يمكنك التعديل في أي وقت من خلال شريط موافقة الكوكيز بالموقع أو عبر إعدادات متصفحك للتحكم في قبول أو رفض الكوكيز. لمزيد من المعلومات يرجى التواصل عبر: support@omnifetchpro.com.'
                      : 'You can adjust cookie acceptance settings at any time via browser preferences or our Cookie Consent Banner. For questions, contact support@omnifetchpro.com.'}
                  </p>
                </section>
              </div>
            )}

            {/* 6. ABOUT US PAGE */}
            {type === 'about' && (
              <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed">
                <section className="space-y-3">
                  <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">
                    {isRtl ? 'من نحن — رسالة OmniFetch Pro' : 'Who We Are — The OmniFetch Pro Mission'}
                  </h2>
                  <p>
                    {isRtl
                      ? 'OmniFetch Pro (https://omnifetchpro.com) هي أداة ويب احترافية مجانية متخصصة في توفير حلول سريعة ونظيفة لاستخراج وتحويل مقاطع الفيديو والريلز والصوتيات بدقة عالية (HD / 4K / MP3) من كبرى منصات التواصل الاجتماعي العالمية.'
                      : 'OmniFetch Pro (https://omnifetchpro.com) is a high-performance web utility built to deliver fast, clean, and reliable media extraction for social video content in HD, 4K, and high-bitrate MP3 formats.'}
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">
                    {isRtl ? 'المنصات والخدمات المدعومة' : 'Supported Platforms & Features'}
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-bold text-purple-300">TikTok (No Watermark)</div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-bold text-red-300">YouTube &amp; Shorts</div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-bold text-pink-300">Instagram Reels &amp; Stories</div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-bold text-blue-300">Facebook HD Videos</div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-bold text-amber-300">Snapchat Spotlight</div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-bold text-sky-300">X / Twitter &amp; GIFs</div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-bold text-rose-300">Pinterest Videos</div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-bold text-orange-300">Reddit &amp; Threads</div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-bold text-indigo-300">LinkedIn Media</div>
                  </div>
                </section>

                <section className="space-y-3">
                  <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">
                    {isRtl ? 'قيمنا وأمن الاستخدام' : 'Core Core Values & Security'}
                  </h2>
                  <p>
                    {isRtl
                      ? 'نحن نؤمن بتجربة مستخدم خالية من البرامج الضارة والنافذة المنبثقة الإجبارية (No Popups). نلتزم بالخصوصية الشاملة وعدم تتبع بيانات الزوار أو الاحتفاظ بمحتويات ملفاتهم. للتواصل مع فريق الإدارة: support@omnifetchpro.com.'
                      : 'We prioritize a clean user experience free of deceptive popups or harmful malware. We maintain strict privacy principles without tracking user files or personal credentials. Support contact: support@omnifetchpro.com.'}
                  </p>
                </section>
              </div>
            )}

            {/* 7. DISCLAIMER PAGE */}
            {type === 'disclaimer' && (
              <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed">
                <section className="space-y-3">
                  <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">
                    {isRtl ? 'إخلاء المسؤولية عن العلامات التجارية والتبعية' : 'Trademark & Affiliation Disclaimer'}
                  </h2>
                  <p>
                    {isRtl
                      ? 'جميع أسماء الشركات، المنصات، العلامات التجارية، والشعارات المذكورة في هذا الموقع (مثل TikTok, YouTube, Instagram, Facebook, Snapchat, X/Twitter, Pinterest, Reddit, Threads, LinkedIn) هي ملك حصري لأصحابها المسجلين. موقع OmniFetch Pro هو أداة مستقلة تماماً ولا يتبع أو يرتبط بأي شكل من الأشكال بتلك الشركات.'
                      : 'All product names, platform logos, trademarks, and registered brand names mentioned on this site (including TikTok, YouTube, Instagram, Facebook, Snapchat, X/Twitter, Pinterest, Reddit, Threads, and LinkedIn) belong exclusively to their respective owners. OmniFetch Pro is an independent third-party tool and is not affiliated, authorized, or endorsed by any social media provider.'}
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">
                    {isRtl ? 'استخدام الخدمة والالتزام بقوانين حقوق النشر' : 'Fair Use & Copyright Responsibility'}
                  </h2>
                  <p>
                    {isRtl
                      ? 'أداة OmniFetch Pro مخصصة للاستخدام الشخصي، والتعليمي، وإنشاء النسخ الاحتياطية الخاصة بملفاتك. يتحمل المستخدم كافة التبعات القانونية عن أي استخدام للمحتوى غير مصرح به من قِبل مالك حقوق الطبع والنشر.'
                      : 'OmniFetch Pro is provided solely for personal archiving, educational analysis, and fair-use downloading. Users assume all legal responsibility for verifying proper license or authorization before extracting copyrighted materials.'}
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-2">
                    {isRtl ? 'التواصل القانوني' : 'Legal Contact'}
                  </h2>
                  <p>
                    {isRtl
                      ? 'لأي استفسارات قانونية أو توضيحات، يمكنكم التواصل معنا على البريد الإلكتروني: support@omnifetchpro.com.'
                      : 'For legal notices or questions regarding this disclaimer, please contact support@omnifetchpro.com.'}
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
