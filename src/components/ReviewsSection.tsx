import { SupportedLanguage } from '../types';
import { t } from '../i18n/translations';
import { Star, ShieldCheck, UserCheck } from 'lucide-react';

interface ReviewsProps {
  currentLang: SupportedLanguage;
}

export function ReviewsSection({ currentLang }: ReviewsProps) {
  const reviews = [
    {
      name: 'Ahmed K.',
      country: '🇸🇦 Saudi Arabia',
      rating: 5,
      date: '2 hours ago',
      comment: 'أسرع موقع لتحميل فيديوهات تيك توك بدون علامة مائية! الجودة رائعة للغاية وبدون أي إعلانات مزعجة.',
    },
    {
      name: 'Sarah M.',
      country: '🇺🇸 United States',
      rating: 5,
      date: '5 hours ago',
      comment: 'Saved my favorite 4K YouTube videos in seconds on my Mac. The MP3 audio converter is super crisp!',
    },
    {
      name: 'Jean-Luc D.',
      country: '🇫🇷 France',
      rating: 5,
      date: '1 day ago',
      comment: 'Téléchargement de Reels Instagram super rapide. Le QR Code mobile est une idée géniale !',
    },
  ];

  return (
    <section className="py-12 sm:py-16 bg-slate-950/90 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-10">
          <div className="flex items-center justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            {t('reviewsTitle', currentLang)}
          </h2>
          <p className="text-sm text-slate-400">
            Rated 4.9/5 stars by over 500,000 satisfied users worldwide.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((rev, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold text-xs flex items-center justify-center">
                      {rev.name[0]}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1">
                        <span>{rev.name}</span>
                        <UserCheck className="w-3 h-3 text-sky-400" />
                      </div>
                      <div className="text-[10px] text-slate-400">{rev.country}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500">{rev.date}</span>
                </div>

                <div className="flex items-center gap-0.5">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed pt-1">
                  "{rev.comment}"
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified OmniFetch User</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
