import React, { useState, FormEvent } from 'react';
import { SupportedLanguage } from '../types';
import { t } from '../i18n/translations';
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

  const handleSubmitContact = (e: FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;
    setSentSuccess(true);
    onShowToast(t('msgSentSuccess', currentLang));
    setContactName('');
    setContactEmail('');
    setContactMessage('');
  };

  const getTitle = () => {
    switch (type) {
      case 'privacy': return t('privacyPolicy', currentLang);
      case 'terms': return t('termsOfService', currentLang);
      case 'dmca': return t('dmca', currentLang);
      case 'disclaimer': return t('disclaimer', currentLang);
      case 'cookies': return t('cookiePolicy', currentLang);
      case 'about': return t('aboutUs', currentLang);
      case 'contact': return t('contactUs', currentLang);
      default: return 'Legal Document';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-6 animate-fade-in text-left">
      <button
        onClick={onBack}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Downloader</span>
      </button>

      <div className="p-6 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">{getTitle()}</h1>
            <p className="text-xs text-slate-400">Last updated: January 2026 • OmniFetch Compliance</p>
          </div>
        </div>

        {/* Contact Form Special View */}
        {type === 'contact' ? (
          <div className="space-y-6">
            <p className="text-sm text-slate-300 leading-relaxed">
              {t('contactDesc', currentLang)}
            </p>

            {sentSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>{t('msgSentSuccess', currentLang)}</span>
              </div>
            )}

            <form onSubmit={handleSubmitContact} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">{t('nameLabel', currentLang)}</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">{t('emailLabel', currentLang)}</label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('messageLabel', currentLang)}</label>
                <textarea
                  rows={5}
                  required
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                <Send className="w-4 h-4" />
                <span>{t('sendMsg', currentLang)}</span>
              </button>
            </form>
          </div>
        ) : (
          /* Standard Legal Documents Content */
          <div className="prose prose-invert max-w-none text-slate-300 text-xs sm:text-sm leading-relaxed space-y-4">
            <h3 className="text-base font-bold text-white">1. Overview and Commitment</h3>
            <p>
              OmniFetch Pro is committed to protecting the privacy and rights of all users. Our online video downloader tool operates entirely in compliance with global standards, including the Digital Millennium Copyright Act (DMCA) and GDPR requirements.
            </p>

            <h3 className="text-base font-bold text-white">2. No File Hosting Policy</h3>
            <p>
              OmniFetch Pro does NOT store, host, or archive any user-downloaded video or audio files on our servers. All media items are processed directly via stream proxies from their respective source platforms (e.g. TikTok, YouTube, Instagram, Facebook).
            </p>

            <h3 className="text-base font-bold text-white">3. Intellectual Property & DMCA</h3>
            <p>
              We respect the intellectual property rights of content creators. Users are solely responsible for ensuring they have appropriate rights to download and use media for personal or educational purposes. If you believe your copyrighted material is being linked improperly, contact us immediately for prompt review.
            </p>

            <h3 className="text-base font-bold text-white">4. Cookies and Advertising</h3>
            <p>
              We use standard session cookies and third-party advertising services like Google AdSense to serve non-intrusive advertisements. You can customize cookie preferences directly through your browser settings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
