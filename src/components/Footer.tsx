import React, { useState, useEffect } from 'react';
import { SupportedLanguage, PlatformSlug, SiteSettings } from '../types';
import { LANGUAGES, t } from '../i18n/translations';
import { PLATFORMS_CONFIG, DEFAULT_SITE_SETTINGS } from '../config/siteConfig';
import { getSiteSettings, fetchSiteSettingsFromDb } from '../lib/storage';
import { AdBanner } from './AdBanner';
import { triggerPwaInstall } from './PwaPrompt';
import {
  Download,
  Globe,
  Heart,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  Send,
  Github,
  Linkedin,
} from 'lucide-react';

interface FooterProps {
  currentLang: SupportedLanguage;
  onSelectLang: (lang: SupportedLanguage) => void;
  onSelectPlatform: (slug: PlatformSlug) => void;
  onOpenLegal: (type: 'privacy' | 'terms' | 'dmca' | 'disclaimer' | 'cookies' | 'about' | 'contact') => void;
  onOpenBlog: () => void;
  onOpenAdmin: () => void;
  siteSettings?: SiteSettings;
}

export function Footer({
  currentLang,
  onSelectLang,
  onSelectPlatform,
  onOpenLegal,
  onOpenBlog,
  onOpenAdmin,
  siteSettings: initialSettings,
}: FooterProps) {
  const [settings, setSettings] = useState<SiteSettings>(initialSettings || getSiteSettings() || DEFAULT_SITE_SETTINGS);
  const platforms = Object.values(PLATFORMS_CONFIG).filter((p) => p.slug !== 'all');

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  useEffect(() => {
    fetchSiteSettingsFromDb().then((s) => {
      if (s) setSettings(s);
    });

    const handleUpdate = (e: CustomEvent) => {
      if (e.detail && typeof e.detail === 'object') {
        setSettings(e.detail);
      }
    };
    window.addEventListener('omnifetch_settings_updated' as any, handleUpdate);
    return () => {
      window.removeEventListener('omnifetch_settings_updated' as any, handleUpdate);
    };
  }, []);

  const socials = settings?.socialLinks || {};

  return (
    <footer className="w-full bg-slate-950 border-t border-slate-800/80 pt-12 pb-8 text-slate-300 text-xs text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Footer Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div
              className="flex items-center gap-3 cursor-pointer w-fit"
              onClick={() => onSelectPlatform('all')}
            >
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.siteName || 'OmniFetch Pro'}
                  style={{ height: `${Math.min(settings.logoHeightPx || 36, 44)}px` }}
                  className="object-contain max-h-11"
                />
              ) : (
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-pink-500 text-white font-bold shadow-lg shadow-indigo-500/20">
                  <Download className="w-4 h-4" />
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black text-white tracking-tight">
                  {settings.siteName || 'OmniFetch Pro'}
                </span>
                {settings.shortName && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {settings.shortName}
                  </span>
                )}
              </div>
            </div>

            <p className="text-slate-300 text-xs leading-relaxed max-w-sm">
              {settings.siteDescription || settings.tagline || t('siteSubtitle', currentLang)}
            </p>

            {/* Social Media Links */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              {socials.twitter && (
                <a
                  href={socials.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter / X"
                  className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-sky-500/50 hover:bg-sky-500/10 transition"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              )}
              {socials.facebook && (
                <a
                  href={socials.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-blue-500/50 hover:bg-blue-500/10 transition"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {socials.instagram && (
                <a
                  href={socials.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-pink-500/50 hover:bg-pink-500/10 transition"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {socials.youtube && (
                <a
                  href={socials.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-red-500/50 hover:bg-red-500/10 transition"
                >
                  <Youtube className="w-4 h-4" />
                </a>
              )}
              {socials.telegram && (
                <a
                  href={socials.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Telegram"
                  className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-sky-400/50 hover:bg-sky-400/10 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                </a>
              )}
              {socials.github && (
                <a
                  href={socials.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-purple-500/50 hover:bg-purple-500/10 transition"
                >
                  <Github className="w-4 h-4" />
                </a>
              )}
              {socials.linkedin && (
                <a
                  href={socials.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-blue-600/50 hover:bg-blue-600/10 transition"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              )}
            </div>

            {/* Language Switcher */}
            <div className="pt-2 flex flex-wrap gap-1.5">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => onSelectLang(lang.code)}
                  className={`px-3 py-2 min-h-[44px] rounded-lg text-[11px] font-bold flex items-center gap-1 border transition-all ${
                    currentLang === lang.code
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
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
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {t('supportedPlatforms', currentLang)}
            </h3>
            <ul className="space-y-1.5 text-xs">
              {platforms.slice(0, 6).map((p) => (
                <li key={p.slug}>
                  <a
                    href={`/${p.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onSelectPlatform(p.slug);
                    }}
                    className="hover:text-indigo-400 py-1 transition-colors min-h-[44px] flex items-center"
                  >
                    {p.name} Downloader
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: More Platforms */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Shorts & Reels</h3>
            <ul className="space-y-1.5 text-xs">
              {platforms.slice(6).map((p) => (
                <li key={p.slug}>
                  <a
                    href={`/${p.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onSelectPlatform(p.slug);
                    }}
                    className="hover:text-indigo-400 py-1 transition-colors min-h-[44px] flex items-center"
                  >
                    {p.name} Downloader
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Legal & Contact */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Legal & Support</h3>
            <ul className="space-y-1.5 text-xs">
              <li>
                <a
                  href="/legal/about"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenLegal('about');
                  }}
                  className="hover:text-indigo-400 py-1 min-h-[44px] flex items-center"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="/legal/privacy"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenLegal('privacy');
                  }}
                  className="hover:text-indigo-400 py-1 min-h-[44px] flex items-center"
                >
                  {t('privacyPolicy', currentLang)}
                </a>
              </li>
              <li>
                <a
                  href="/legal/terms"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenLegal('terms');
                  }}
                  className="hover:text-indigo-400 py-1 min-h-[44px] flex items-center"
                >
                  {t('termsOfService', currentLang)}
                </a>
              </li>
              <li>
                <a
                  href="/legal/dmca"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenLegal('dmca');
                  }}
                  className="hover:text-indigo-400 py-1 min-h-[44px] flex items-center"
                >
                  {t('dmca', currentLang)}
                </a>
              </li>
              <li>
                <a
                  href="/legal/cookies"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenLegal('cookies');
                  }}
                  className="hover:text-indigo-400 py-1 min-h-[44px] flex items-center"
                >
                  {t('cookiePolicy', currentLang)}
                </a>
              </li>
              <li>
                <a
                  href="/legal/disclaimer"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenLegal('disclaimer');
                  }}
                  className="hover:text-indigo-400 py-1 min-h-[44px] flex items-center"
                >
                  Disclaimer
                </a>
              </li>
              <li>
                <a
                  href="/legal/contact"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenLegal('contact');
                  }}
                  className="hover:text-indigo-400 py-1 min-h-[44px] flex items-center"
                >
                  {t('contactUs', currentLang)}
                </a>
              </li>
              <li>
                <a
                  href="/blog"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenBlog();
                  }}
                  className="hover:text-indigo-400 text-emerald-400 font-bold py-1 min-h-[44px] flex items-center"
                >
                  {t('blog', currentLang)}
                </a>
              </li>
              <li>
                <button onClick={triggerPwaInstall} className="hover:text-purple-300 text-purple-400 font-bold py-1 min-h-[44px] flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                  <span>{t('installPwa', currentLang)}</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom Sticky Ad Placement */}
        <AdBanner slot="footer_banner" />

        {/* Bottom Copyright */}
        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-300">
          <div>
            {settings.copyrightText || settings.footerText || t('footerRights', currentLang)}
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Safe & Clean</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
