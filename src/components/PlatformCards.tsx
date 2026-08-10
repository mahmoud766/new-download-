import { useState, useEffect } from 'react';
import { SupportedLanguage, PlatformSlug, PlatformConfig } from '../types';
import { PLATFORMS_CONFIG } from '../config/siteConfig';
import { t } from '../i18n/translations';
import { getSiteSettings } from '../lib/storage';
import { getStoredPlatformsConfig, fetchPlatformsConfigFromDb } from '../lib/adminStorage';
import { AdBanner } from './AdBanner';
import { ArrowRight, Sparkles, Video, Globe, Youtube, Instagram, Facebook, Clapperboard, Tv, Ghost, Twitter, Pin, MessageSquare, AtSign, Linkedin } from 'lucide-react';

interface PlatformCardsProps {
  currentLang: SupportedLanguage;
  onSelectPlatform: (slug: PlatformSlug) => void;
}

export function PlatformCards({ currentLang, onSelectPlatform }: PlatformCardsProps) {
  const [platformMap, setPlatformMap] = useState<Record<string, PlatformConfig>>(() => getStoredPlatformsConfig());

  useEffect(() => {
    fetchPlatformsConfigFromDb().then((map) => {
      if (map) setPlatformMap(map);
    });

    const handleUpdated = (e: CustomEvent) => {
      if (e.detail) setPlatformMap(e.detail);
    };

    window.addEventListener('omnifetch_platforms_updated', handleUpdated as EventListener);
    return () => {
      window.removeEventListener('omnifetch_platforms_updated', handleUpdated as EventListener);
    };
  }, []);

  const rawPlatforms = Object.values(PLATFORMS_CONFIG).filter((p) => p.slug !== 'all');
  const platforms = rawPlatforms.filter((p) => {
    const override = platformMap[p.slug];
    if (override && (override.active === false || override.enabled === false)) {
      return false;
    }
    return true;
  });

  const siteSettings = getSiteSettings();
  const customIcons = siteSettings.platformIconsCustom || {};

  const getPlatformIcon = (slug: string) => {
    if (customIcons[slug]) {
      return <img src={customIcons[slug]} alt={slug} className="w-6 h-6 object-contain rounded" />;
    }

    switch (slug) {
      case 'tiktok': return <Video className="w-6 h-6 text-pink-400" />;
      case 'facebook': return <Facebook className="w-6 h-6 text-blue-400" />;
      case 'facebook-reels': return <Clapperboard className="w-6 h-6 text-indigo-400" />;
      case 'instagram': return <Instagram className="w-6 h-6 text-rose-400" />;
      case 'instagram-reels': return <Tv className="w-6 h-6 text-purple-400" />;
      case 'youtube': return <Youtube className="w-6 h-6 text-red-400" />;
      case 'youtube-shorts': return <Youtube className="w-6 h-6 text-rose-500" />;
      case 'snapchat': return <Ghost className="w-6 h-6 text-yellow-400" />;
      case 'twitter': return <Twitter className="w-6 h-6 text-sky-400" />;
      case 'pinterest': return <Pin className="w-6 h-6 text-red-400" />;
      case 'reddit': return <MessageSquare className="w-6 h-6 text-orange-400" />;
      case 'threads': return <AtSign className="w-6 h-6 text-slate-300" />;
      case 'linkedin': return <Linkedin className="w-6 h-6 text-blue-400" />;
      default: return <Globe className="w-6 h-6 text-indigo-400" />;
    }
  };

  const firstChunk = platforms.slice(0, 4);
  const secondChunk = platforms.slice(4, 8);
  const thirdChunk = platforms.slice(8);

  const renderCardGroup = (group: typeof platforms) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {group.map((p) => (
        <a
          key={p.slug}
          href={`/${p.slug}`}
          onClick={(e) => {
            e.preventDefault();
            onSelectPlatform(p.slug);
          }}
          className="group relative p-5 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between overflow-hidden"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 group-hover:scale-110 transition-transform">
                {getPlatformIcon(p.slug)}
              </div>

              {p.popular && (
                <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  POPULAR
                </span>
              )}
            </div>

            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                {p.name} Downloader
              </h3>
              <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                {p.subtitle[currentLang] || p.subtitle.en}
              </p>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-indigo-400 group-hover:text-indigo-300">
            <span>Start Downloading</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </a>
      ))}
    </div>
  );

  return (
    <section className="py-12 bg-slate-950/60 border-y border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-3 mb-6">
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            {t('supportedPlatforms', currentLang)}
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
            Choose any platform below for specialized video downloader features & custom metadata.
          </p>
        </div>

        {/* Group 1 Service Cards */}
        {renderCardGroup(firstChunk)}

        {/* Ad Separator 1 (Responsive Leaderboard 735x90) */}
        <div className="w-full my-6 flex justify-center">
          <AdBanner slot="service_separator_1" className="w-full max-w-4xl" />
        </div>

        {/* Group 2 Service Cards */}
        {secondChunk.length > 0 && renderCardGroup(secondChunk)}

        {/* Ad Separator 2 (Responsive Leaderboard 735x90) */}
        {secondChunk.length > 0 && (
          <div className="w-full my-6 flex justify-center">
            <AdBanner slot="service_separator_2" className="w-full max-w-4xl" />
          </div>
        )}

        {/* Group 3 Service Cards */}
        {thirdChunk.length > 0 && renderCardGroup(thirdChunk)}
      </div>
    </section>
  );
}
