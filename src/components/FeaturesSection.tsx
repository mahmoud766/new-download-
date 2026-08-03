import { SupportedLanguage } from '../types';
import { t } from '../i18n/translations';
import { Zap, ShieldCheck, Download, Sparkles, Smartphone, Music } from 'lucide-react';

interface FeaturesProps {
  currentLang: SupportedLanguage;
}

export function FeaturesSection({ currentLang }: FeaturesProps) {
  const features = [
    {
      icon: <Sparkles className="w-6 h-6 text-pink-400" />,
      title: t('noWatermark', currentLang),
      desc: 'Removes all TikTok logos and platform overlays automatically, giving you pristine HD videos.',
    },
    {
      icon: <Zap className="w-6 h-6 text-amber-400" />,
      title: t('highSpeed', currentLang),
      desc: 'High-speed cloud extraction engine fetches video formats in under 2 seconds.',
    },
    {
      icon: <Download className="w-6 h-6 text-indigo-400" />,
      title: t('unlimited', currentLang),
      desc: 'No daily limit on download quantity or video length. Completely free forever.',
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
      title: t('safeSecure', currentLang),
      desc: 'We do not log personal browsing history or store downloaded media files on our servers.',
    },
    {
      icon: <Music className="w-6 h-6 text-rose-400" />,
      title: '320kbps MP3 Extractor',
      desc: 'Easily convert any social media video or reel directly into crystal clear audio MP3 format.',
    },
    {
      icon: <Smartphone className="w-6 h-6 text-sky-400" />,
      title: 'Universal PWA App',
      desc: 'Install OmniFetch Pro as a lightweight app on iOS, Android, Mac, and Windows with 1 click.',
    },
  ];

  return (
    <section className="py-12 sm:py-16 bg-slate-950/80 border-y border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            {t('featuresTitle', currentLang)}
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
            Engineered for speed, privacy, and maximum video quality across all devices.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all space-y-3 shadow-lg"
            >
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 w-fit">
                {feat.icon}
              </div>
              <h3 className="text-lg font-bold text-white">{feat.title}</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
