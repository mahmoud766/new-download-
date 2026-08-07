import React, { useEffect, useState } from 'react';
import {
  Download,
  Flame,
  Eye,
  Heart,
  Sparkles,
  Zap,
} from 'lucide-react';
import { SupportedLanguage } from '../types';

export interface TrendingItem {
  id: string;
  url: string;
  title: string;
  platform: string;
  platformName?: string;
  thumbnail: string;
  duration?: string;
  quality?: string;
  downloadCount: number;
  views?: string;
  likes?: string;
}

interface Props {
  currentLang: SupportedLanguage;
  onExtractUrl: (url: string) => void;
}

export const TrendingDownloadsSection: React.FC<Props> = ({ currentLang, onExtractUrl }) => {
  const isRtl = currentLang === 'ar';
  const [trendingList, setTrendingList] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrendingData = async () => {
    try {
      const res = await fetch('/api/trending');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.items)) {
          setTrendingList(data.items);
        }
      }
    } catch (err) {
      console.warn('Error fetching trending items from PostgreSQL API:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingData();
  }, []);

  const handleExtractCard = async (item: TrendingItem) => {
    // Record / increment extraction in PostgreSQL Supabase
    try {
      await fetch('/api/trending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: item.url,
          title: item.title,
          platform: item.platform,
          thumbnail: item.thumbnail,
          quality: item.quality || 'HD No Watermark',
        }),
      });
      // Refresh list to update counts
      fetchTrendingData();
    } catch (e) {
      console.warn('Failed to record trending download:', e);
    }

    // Trigger URL extraction in main hero search bar
    onExtractUrl(item.url);
  };

  return (
    <section className="py-12 bg-slate-950/40 border-y border-purple-500/10 relative overflow-hidden">
      {/* Background Accent Gradients */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-pink-600/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 relative z-10 space-y-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-500/30 text-amber-300 rounded-full text-xs font-black uppercase tracking-wider">
              <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>{isRtl ? 'الأكثر تحميلاً وتداولاً اليوم (PostgreSQL)' : 'Top Trending Downloads Today'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {isRtl ? 'الفيديوهات الأكثر استخراجاً وحفظاً' : 'Most Popular Videos Extracted Right Now'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              {isRtl
                ? 'قائمة حية ومحدثة تلقائياً من قاعدة البيانات بناءً على عدد التنزيلات الحقيقية للمستخدمين.'
                : 'Live feed of trending videos ordered by real download counts in PostgreSQL Supabase.'}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isRtl ? 'مزامنة حية مع Supabase PostgreSQL' : 'PostgreSQL Database Live'}</span>
          </div>
        </div>

        {/* Trending Cards Grid */}
        {trendingList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {trendingList.map((item) => (
              <div
                key={item.id}
                className="group relative bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-purple-950/50 transition-all duration-300 flex flex-col justify-between"
              >
                {/* Thumbnail Container */}
                <div className="relative aspect-video overflow-hidden bg-slate-950">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent"></div>

                  {/* Top Badge */}
                  <span className="absolute top-2.5 left-2.5 px-2.5 py-1 bg-slate-950/80 backdrop-blur-md text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-black shadow-md flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                    {item.downloadCount} {isRtl ? 'تحميل' : 'downloads'}
                  </span>

                  {/* Duration Badge */}
                  {item.duration && (
                    <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-black/80 text-white rounded text-[10px] font-mono font-bold">
                      {item.duration}
                    </span>
                  )}

                  {/* Platform Badge */}
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-purple-600/90 text-white rounded-md text-[10px] font-bold shadow capitalize">
                    {item.platformName || item.platform}
                  </span>
                </div>

                {/* Content Details */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-purple-300 transition-colors">
                      {item.title}
                    </h3>

                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                      {item.views && (
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3 text-indigo-400" />
                          {item.views}
                        </span>
                      )}
                      {item.likes && (
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3 text-pink-400" />
                          {item.likes}
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[9px] font-mono">
                        {item.quality || 'HD No Watermark'}
                      </span>
                    </div>
                  </div>

                  {/* Quick Extract Action Button */}
                  <button
                    onClick={() => handleExtractCard(item)}
                    className="w-full py-2.5 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30 transition-all active:scale-95 border border-purple-400/30 mt-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'تحميل واستخراج الآن' : 'Extract & Download Now'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : !loading ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 bg-slate-900/40 border border-slate-800/80 rounded-3xl text-center space-y-3">
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-purple-400">
              <Flame className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black text-white">
              {isRtl ? 'لا توجد تنزيلات مسجلة حتى الآن' : 'No Download Logs Recorded Yet'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md">
              {isRtl
                ? 'استخدم صندوق البحث أعلاه لاستخراج وتحميل أي فيديو، وستظهر مقاطعك الأكثر شيوعاً وتداولا هنا تلقائياً!'
                : 'Use the hero search box above to download any video, and trending items will automatically appear here!'}
            </p>
          </div>
        ) : null}

      </div>
    </section>
  );
};
