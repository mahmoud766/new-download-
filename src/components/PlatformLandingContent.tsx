import React from 'react';
import { SupportedLanguage, PlatformSlug } from '../types';
import { PLATFORMS_CONFIG } from '../config/siteConfig';
import { CheckCircle2, ShieldCheck, Zap, HelpCircle, AlertCircle, FileText, Smartphone, Laptop, Lock, ArrowRight } from 'lucide-react';
import { AdBanner } from './AdBanner';

interface PlatformLandingContentProps {
  currentPlatform: PlatformSlug;
  currentLang: SupportedLanguage;
  onSelectPlatform: (slug: PlatformSlug) => void;
  onOpenLegal: (type: 'privacy' | 'terms' | 'dmca' | 'disclaimer' | 'cookies' | 'about' | 'contact') => void;
  onOpenBlog: () => void;
}

export function PlatformLandingContent({
  currentPlatform,
  currentLang,
  onSelectPlatform,
  onOpenLegal,
  onOpenBlog,
}: PlatformLandingContentProps) {
  const isAr = currentLang === 'ar';
  const platform = PLATFORMS_CONFIG[currentPlatform] || PLATFORMS_CONFIG.all;
  const platformName = platform.name;

  if (currentPlatform === 'all') {
    return (
      <section className="py-12 sm:py-16 bg-slate-900/60 border-t border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12">
          {/* Section Header */}
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {isAr ? 'أسرع منصة شاملة لتحميل مقاطع الفيديو والصوتيات لعام 2026' : 'The Ultimate Universal Online Media Downloader & Extraction Suite'}
            </h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
              {isAr
                ? 'نوفر لك خدمة مجانية متكاملة وبسرعة فائقة لحفظ الفيديوهات والمقاطع الصوتية بجودة عالية HD و 4K وبدون علامة مائية من كافة شبكات التواصل الاجتماعي الرئيسية.'
                : 'OmniFetch Pro provides high-speed, secure, and 100% free media extraction across all major social networks with zero popups and zero registration required.'}
            </p>
          </div>

          {/* Detailed Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center gap-3 text-indigo-400 font-bold text-base">
                <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                <span>{isAr ? 'حماية الخصوصية وبدون تسجيل دخول' : 'No Account Needed & Privacy First'}</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {isAr
                  ? 'لا نطلب إنشاء حساب أو إدخال أي بيانات شخصية أو إذن وصول لحساباتك. يتم استخراج روابط البث المباشرة ومعالجتها بشكل آمن تماماً عبر سيرفرات سحابية مشفرة.'
                  : 'Enjoy seamless downloads without creating accounts or revealing personal data. Requests are processed in real-time through secure cloud infrastructure without logging user identities.'}
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center gap-3 text-indigo-400 font-bold text-base">
                <Zap className="w-6 h-6 text-amber-400 shrink-0" />
                <span>{isAr ? 'تقنية الاستخراج الفائق واستخراج MP3' : 'Ultra-Fast Cloud Extraction & MP3 Audio'}</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {isAr
                  ? 'تعتمد الأداة على محرك سيرفرات متعدد المسارات يتيح استخراج صيغ MP4 بأعلى دقة متوفرة (4K, 1080p, 720p) مع إمكانية فصل الصوت فورياً بصيغة MP3 عالي النقاء 320kbps.'
                  : 'Multi-threaded cloud servers parse direct video streams instantly, allowing crisp MP4 video downloads and high-fidelity 320kbps MP3 audio separation in under a second.'}
              </p>
            </div>
          </div>

          {/* Platform Quick Links */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-4">
            <h3 className="text-lg font-bold text-white">
              {isAr ? 'اختر المنصة لبدء التحميل المخصص:' : 'Select a Platform for Dedicated Downloader & Guide:'}
            </h3>
            <div className="flex flex-wrap justify-center gap-2.5">
              {Object.values(PLATFORMS_CONFIG)
                .filter((p) => p.slug !== 'all')
                .map((p) => (
                  <button
                    key={p.slug}
                    onClick={() => onSelectPlatform(p.slug)}
                    className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-indigo-600/20 text-slate-200 hover:text-white border border-slate-800 hover:border-indigo-500/40 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                  >
                    <span>{p.name} Downloader</span>
                  </button>
                ))}
            </div>
          </div>

          {/* Home After Facebook/Platform Guide Ad Slot */}
          <AdBanner slot="HOME_AFTER_FACEBOOK_GUIDE" />
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16 bg-slate-900/60 border-t border-slate-800/80">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12">
        {/* Platform Page Top Ad Slot */}
        <AdBanner slot="PLATFORM_TOP" />

        {/* Dynamic Service Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
            <span>{isAr ? `دليل أداة تحميل فيديوهات ${platformName} الشامل 2026` : `Official ${platformName} Video Downloader & Converter Guide`}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            {isAr
              ? `كيفية تحميل فيديوهات وريلز ${platformName} بجودة HD وبدون علامة مائية`
              : `How to Download ${platformName} Videos & Reels in Full HD With Zero Watermark`}
          </h2>

          <p className="text-sm sm:text-base text-slate-300 max-w-3xl mx-auto leading-relaxed">
            {isAr
              ? `تتيح لك أداة OmniFetch Pro المخصصة لمنصة ${platformName} استخراج المقاطع والريلز والموسيقى بصيغة MP4 و MP3 مجاناً وبأعلى جودة. تعمل الأداة مباشرة بدون الحاجة لتثبيت برامج أو إنشاء حساب.`
              : `OmniFetch Pro provides an optimized extraction engine specifically built for ${platformName}. Download public posts, reels, shorts, and audio files directly in original HD quality without apps or user registration.`}
          </p>
        </div>

        {/* Platform After Tool Ad Slot */}
        <AdBanner slot="PLATFORM_AFTER_TOOL" />

        {/* Step-by-Step Instructions */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-950 border border-slate-800 space-y-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Smartphone className="w-5 h-5 text-indigo-400" />
            <span>{isAr ? `خطوات تنزيل فيديوهات ${platformName} على الأندرويد والآيفون والكومبيوتر` : `Step-by-Step Instructions for ${platformName}`}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">1</div>
              <h4 className="font-bold text-white text-sm">{isAr ? 'نسخ رابط الفيديو' : '1. Copy Video URL'}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isAr
                  ? `افتح تطبيق ${platformName}، توجه إلى الفيديو المطلوب، واضغط على زر المشاركة (Share) ثم اختر "نسخ الرابط" (Copy Link).`
                  : `Open the ${platformName} app or web browser, navigate to the desired post or video, click Share and tap "Copy Link".`}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">2</div>
              <h4 className="font-bold text-white text-sm">{isAr ? 'لصق الرابط واستخراجه' : '2. Paste & Process'}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isAr
                  ? 'قم بلصق الرابط في حقل البحث أعلاه، ثم انقر على زر التحميل الملون لبدء الفحص والاستخراج السريع.'
                  : 'Paste the link into our search input above and click the Extract button. Our cloud engine parses the direct stream instantly.'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">3</div>
              <h4 className="font-bold text-white text-sm">{isAr ? 'حفظ الفيديو على الجهاز' : '3. Save Media'}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isAr
                  ? 'اختر الجودة المطلوبة (4K, 1080p, MP3) واضغط على تنزيل لحفظ الفيديو مباشرة في استوديو الهاتف أو مجلد التنزيلات.'
                  : 'Choose your preferred quality (4K, 1080p, or MP3 audio) and click Download to save the media file directly to your camera roll or device folder.'}
              </p>
            </div>
          </div>
        </div>

        {/* Formats and Technical Specifications */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span>{isAr ? `الصيغ والجودات المدعومة لـ ${platformName}` : `Supported Formats & Resolution Options`}</span>
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span><strong>MP4 HD (1080p / 720p):</strong> {isAr ? 'فيديو عالي الوضوح متوافق مع كافة الشاشات' : 'Crisp high-definition video compatible with all devices.'}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                <span><strong>MP4 No Watermark:</strong> {isAr ? 'إزالة العلامة المائية والشعار بشكل آلي تماماً' : 'Automated watermark removal for clean video archives.'}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                <span><strong>MP3 Studio Audio (320kbps):</strong> {isAr ? 'استخراج مقاطع الصوت والموسيقى بنقاء استوديو' : 'High-fidelity audio extraction for offline music playback.'}</span>
              </li>
            </ul>
          </div>

          <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? 'الأمان والخصوصية والاستخدام العادل' : 'Privacy, Security & Acceptable Use'}</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {isAr
                ? `نحن نلتزم بأعلى معايير حماية البيانات والخصوصية. لا نقوم بتخزين أي فيديوهات خاصة بـ ${platformName} على سيرفراتنا ولا تحتفظ الأداة بسجلات بروابط المستخدمين. يتم الاستخراج بغرض الأرشفة والاستخدام الشخصي فقط.`
                : `OmniFetch Pro operates as a stateless proxy utility. We do not host or store copyrighted ${platformName} video files on our infrastructure. Users must ensure they have permission or legal fair-use rights prior to archiving third-party content.`}
            </p>
          </div>
        </div>

        {/* Platform After Description Ad Slot */}
        <AdBanner slot="PLATFORM_AFTER_DESCRIPTION" />

        {/* Troubleshooting & FAQ */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <HelpCircle className="w-5 h-5 text-indigo-400" />
            <span>{isAr ? `أسئلة شائعة وإصلاح المشاكل لـ ${platformName}` : `Troubleshooting & FAQ for ${platformName}`}</span>
          </h3>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <h4 className="font-bold text-white">{isAr ? `لماذا يفشل تحميل فيديو ${platformName} أحياناً؟` : `Why does a ${platformName} download request fail?`}</h4>
              <p className="text-slate-300 leading-relaxed">
                {isAr
                  ? `تأكد من أن الحساب صاحب الفيديو ليس حساباً خاصاً (Private Account)، وأن رابط الفيديو مباشر وليس رابط صفحة شخصية. الفيديوهات الخاصة تتطلب إذن صاحب الحساب ولا يمكن استخراجها عبر الأدوات العامة.`
                  : `Ensure the ${platformName} post is from a public account and that you pasted a direct media URL. Videos from private accounts or age-restricted posts cannot be parsed without authentication.`}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <h4 className="font-bold text-white">{isAr ? 'هل الخدمة مجانية وهل توجد حدود يومية؟' : 'Is this service completely free with unlimited downloads?'}</h4>
              <p className="text-slate-300 leading-relaxed">
                {isAr
                  ? 'نعم، الخدمة مجانية 100% ولا توجد أي قيود على عدد الفيديوهات أو طول المقطع الذي يمكنك تحويله وتحميله.'
                  : 'Yes, OmniFetch Pro is completely free without limits on daily conversion volume or file duration.'}
              </p>
            </div>
          </div>
        </div>

        {/* Platform After FAQ Ad Slot */}
        <AdBanner slot="PLATFORM_AFTER_FAQ" />

        {/* Internal Cross Navigation & Links */}
        <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-bold">{isAr ? 'روابط هامة:' : 'Quick References:'}</span>
            <button onClick={() => onOpenLegal('privacy')} className="text-indigo-400 hover:underline">
              {isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}
            </button>
            <span className="text-slate-700">•</span>
            <button onClick={() => onOpenLegal('terms')} className="text-indigo-400 hover:underline">
              {isAr ? 'شروط الخدمة' : 'Terms of Service'}
            </button>
            <span className="text-slate-700">•</span>
            <button onClick={() => onOpenLegal('dmca')} className="text-indigo-400 hover:underline">
              {isAr ? 'حقوق الملكية DMCA' : 'DMCA Policy'}
            </button>
            <span className="text-slate-700">•</span>
            <button onClick={onOpenBlog} className="text-emerald-400 hover:underline font-bold">
              {isAr ? 'المدونة والدلائل' : 'Guides & Blog'}
            </button>
          </div>

          <button
            onClick={() => onSelectPlatform('all')}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>{isAr ? 'عرض جميع المنصات' : 'View All Supported Platforms'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Platform Bottom Ad Slot */}
        <AdBanner slot="PLATFORM_BOTTOM" />
      </div>
    </section>
  );
}
