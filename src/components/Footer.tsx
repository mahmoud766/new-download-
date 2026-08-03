import { SupportedLanguage, PlatformSlug } from '../types';
import { LANGUAGES, t } from '../i18n/translations';
import { PLATFORMS_CONFIG } from '../config/siteConfig';
import { AdBanner } from './AdBanner';
import { Download, Globe, Heart, ShieldCheck, Sparkles } from 'lucide-react';

interface FooterProps {
  currentLang: SupportedLanguage;
  onSelectLang: (lang: SupportedLanguage) => void;
  onSelectPlatform: (slug: PlatformSlug) => void;
  onOpenLegal: (type: 'privacy' | 'terms' | 'dmca' | 'disclaimer' | 'cookies' | 'about' | 'contact') => void;
  onOpenBlog: () => void;
  onOpenAdmin: () => void;
}

export function Footer({
  currentLang,
  onSelectLang,
  onSelectPlatform,
  onOpenLegal,
  onOpenBlog,
  onOpenAdmin,
}: FooterProps) {
  const platforms = Object.values(PLATFORMS_CONFIG).filter((p) => p.slug !== 'all');

  return (
    <footer className="w-full bg-slate-950 border-t border-slate-800/80 pt-12 pb-8 text-slate-400 text-xs text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Footer Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2 space-y-3">
            <div
              className="flex items-center gap-2 cursor-pointer w-fit"
              onClick={() => onSelectPlatform('all')}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-pink-500 text-white font-bold">
                <Download className="w-4 h-4" />
              </div>
              <span className="text-xl font-black text-white tracking-tight">OmniFetch Pro</span>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              {t('siteSubtitle', currentLang)}
            </p>

            {/* Language Switcher */}
            <div className="pt-2 flex flex-wrap gap-1.5">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => onSelectLang(lang.code)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 border transition-all ${
                    currentLang === lang.code
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.nativeName}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Col 2: Supported Platforms */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              {t('supportedPlatforms', currentLang)}
            </h4>
            <ul className="space-y-1.5 text-xs">
              {platforms.slice(0, 6).map((p) => (
                <li key={p.slug}>
                  <button
                    onClick={() => onSelectPlatform(p.slug)}
                    className="hover:text-indigo-400 transition-colors"
                  >
                    {p.name} Downloader
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: More Platforms */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Shorts & Reels</h4>
            <ul className="space-y-1.5 text-xs">
              {platforms.slice(6).map((p) => (
                <li key={p.slug}>
                  <button
                    onClick={() => onSelectPlatform(p.slug)}
                    className="hover:text-indigo-400 transition-colors"
                  >
                    {p.name} Downloader
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Legal & Contact */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Legal & Support</h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button onClick={() => onOpenLegal('privacy')} className="hover:text-indigo-400">
                  {t('privacyPolicy', currentLang)}
                </button>
              </li>
              <li>
                <button onClick={() => onOpenLegal('terms')} className="hover:text-indigo-400">
                  {t('termsOfService', currentLang)}
                </button>
              </li>
              <li>
                <button onClick={() => onOpenLegal('dmca')} className="hover:text-indigo-400">
                  {t('dmca', currentLang)}
                </button>
              </li>
              <li>
                <button onClick={() => onOpenLegal('cookies')} className="hover:text-indigo-400">
                  {t('cookiePolicy', currentLang)}
                </button>
              </li>
              <li>
                <button onClick={() => onOpenLegal('contact')} className="hover:text-indigo-400">
                  {t('contactUs', currentLang)}
                </button>
              </li>
              <li>
                <button onClick={onOpenBlog} className="hover:text-indigo-400 text-emerald-400 font-bold">
                  {t('blog', currentLang)}
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom Sticky Ad Placement */}
        <AdBanner slot="footer_banner" />

        {/* Bottom Copyright */}
        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div>{t('footerRights', currentLang)}</div>

          <div className="flex items-center gap-4">
            <button onClick={onOpenAdmin} className="hover:text-slate-300 transition-colors">
              {t('adminDashboard', currentLang)}
            </button>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Safe & Clean</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
