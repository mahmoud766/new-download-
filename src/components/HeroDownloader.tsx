import React, { useState, useRef, FormEvent, DragEvent } from 'react';
import { SupportedLanguage, PlatformSlug, MediaResult } from '../types';
import { PLATFORMS_CONFIG } from '../config/siteConfig';
import { t } from '../i18n/translations';
import { processVideoFetch } from '../lib/providers';
import { saveToHistory } from '../lib/storage';
import { recordRealExtraction } from '../lib/firebase';
import { trackDownloadAttempt, trackDownloadSuccess, trackDownloadFailure } from '../lib/analytics';
import {
  Download,
  Clipboard,
  X,
  Loader2,
  AlertCircle,
  Sparkles,
  Zap,
  ShieldCheck,
  CheckCircle2,
  UploadCloud,
  Layers,
  ShieldAlert,
  Lock,
  ListPlus,
  Trash2,
  Play,
  RotateCcw,
} from 'lucide-react';
import { BatchDownloadModal } from './BatchDownloadModal';

// Pre-extraction URL validation regex matching supported platforms (TikTok, Instagram, Facebook, YouTube, Twitter/X, Snapchat, Pinterest, Reddit, Threads, LinkedIn)
const SUPPORTED_URL_REGEX = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)*(tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com|instagram\.com|instagr\.am|facebook\.com|fb\.watch|fb\.gg|fb\.me|m\.facebook\.com|youtube\.com|youtu\.be|twitter\.com|x\.com|snapchat\.com|pinterest\.com|pin\.it|reddit\.com|threads\.net|linkedin\.com)\/.+/i;

interface HeroDownloaderProps {
  currentLang: SupportedLanguage;
  currentPlatform: PlatformSlug;
  isMaintenanceMode?: boolean;
  onSelectPlatform: (p: PlatformSlug) => void;
  onResultFetched: (result: MediaResult) => void;
  onError: (msg: string) => void;
  onReset?: () => void;
}

const SAMPLE_BATCH_LINKS = [
  'https://www.tiktok.com/@tiktok/video/7123456789101112131',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://www.facebook.com/watch/?v=10158329381711234',
  'https://www.instagram.com/reel/Cx123456789/',
].join('\n');

export function HeroDownloader({
  currentLang,
  currentPlatform,
  isMaintenanceMode = false,
  onSelectPlatform,
  onResultFetched,
  onError,
  onReset,
}: HeroDownloaderProps) {
  const [downloadMode, setDownloadMode] = useState<'single' | 'batch'>('single');
  const [urlInput, setUrlInput] = useState('');
  const [batchText, setBatchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchModalPayload, setBatchModalPayload] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const activePlatform = PLATFORMS_CONFIG[currentPlatform] || PLATFORMS_CONFIG.all;
  const platformsPills = Object.values(PLATFORMS_CONFIG);

  // Parse valid URLs in batch mode
  const parsedBatchUrls = batchText
    .split(/[\n,;\s]+/)
    .map((u) => u.trim())
    .filter((u) => u.length > 5 && (u.startsWith('http://') || u.startsWith('https://')));

  const handlePasteSingle = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          checkAndSetInputText(text.trim());
        }
      }
    } catch {
      // Ignore permission denied
    }
  };

  const handlePasteBatch = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setBatchText((prev) => (prev ? `${prev}\n${text.trim()}` : text.trim()));
        }
      }
    } catch {
      // Ignore permission denied
    }
  };

  const checkAndSetInputText = (text: string) => {
    // Detect if pasted text contains multiple URLs or multiple lines
    const httpMatches = text.match(/https?:\/\/[^\s]+/g);
    if (httpMatches && httpMatches.length > 1) {
      setDownloadMode('batch');
      setBatchText(text);
      if (errorMsg) setErrorMsg(null);
    } else {
      setUrlInput(text);
      if (errorMsg) setErrorMsg(null);
    }
  };

  const handleFetchMedia = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (isMaintenanceMode) {
      const msg = 'الموقع يخضع للصيانة الدورية حالياً. تم تعليق خدمة استخراج وتحميل المقاطع مؤقتاً.';
      setErrorMsg(msg);
      onError(msg);
      return;
    }

    if (downloadMode === 'batch') {
      if (parsedBatchUrls.length === 0) {
        const msg = t('errorInvalidUrl', currentLang) || 'الرجاء إدخال روابط صالحة للتنزيل الجماعي';
        setErrorMsg(msg);
        return;
      }
      setErrorMsg(null);
      setBatchModalPayload(batchText);
      setShowBatchModal(true);
      return;
    }

    const cleanedUrl = urlInput.trim();
    if (!cleanedUrl) {
      const msg = t('errorInvalidUrl', currentLang);
      setErrorMsg(msg);
      onError(msg);
      return;
    }

    if (!SUPPORTED_URL_REGEX.test(cleanedUrl)) {
      const msg = t('errorInvalidUrl', currentLang) || 'الرابط المدخل غير مدعوم أو غير صالِح. يرجى التأكد من إدخال رابط فيديو مباشر من TikTok, Instagram, Facebook أو منصات مدعومة.';
      setErrorMsg(msg);
      onError(msg);
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    onReset?.();
    trackDownloadAttempt(currentPlatform);

    try {
      const result = await processVideoFetch(urlInput);

      // Check forceProxy flag returned from backend (especially for YouTube) to avoid IP mismatch errors
      if (result && Array.isArray(result.formats)) {
        const isYouTube =
          result.platform === 'youtube' ||
          result.platform === 'youtube-shorts' ||
          result.platformName === 'YouTube';

        result.formats = result.formats.map((fmt) => {
          const isProxyRequired = Boolean(
            fmt.forceProxy ||
            isYouTube ||
            result.platform === 'facebook' ||
            result.platformName === 'Facebook' ||
            result.platform === 'instagram' ||
            result.platformName === 'Instagram'
          );
          if (isProxyRequired) {
            const filename =
              fmt.filename ||
              `${result.title.replace(/[^a-zA-Z0-9_\-]/g, '_')}_${fmt.quality}.${fmt.format}`;
            const rawUrl = fmt.url;
            const downloadUrl = rawUrl.startsWith('/api/download')
              ? rawUrl
              : `/api/download?url=${encodeURIComponent(rawUrl)}&filename=${encodeURIComponent(filename)}&disposition=attachment`;

            return {
              ...fmt,
              forceProxy: true,
              url: downloadUrl,
            };
          }
          return fmt;
        });
      }

      saveToHistory(result);
      recordRealExtraction(result);
      onResultFetched(result);
      trackDownloadSuccess(result.platformName || result.platform);
    } catch (err: any) {
      trackDownloadFailure(currentPlatform);
      const msg = err.message || t('errorFetchFailed', currentLang);
      setErrorMsg(msg);
      onError(msg);
      onReset?.();
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedText = e.dataTransfer.getData('text');
    if (droppedText) {
      checkAndSetInputText(droppedText.trim());
    }
  };

  const handleLaunchBatchModal = (initialData?: string) => {
    setBatchModalPayload(initialData || batchText || urlInput);
    setShowBatchModal(true);
  };

  return (
    <section className="relative pt-8 pb-12 sm:pt-12 sm:pb-16 overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-pink-500/10 blur-[120px] pointer-events-none -z-10 rounded-full" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
        {/* Badge Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/90 border border-slate-700/80 text-xs sm:text-sm font-bold shadow-xl">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
            {activePlatform.titleTemplate[currentLang] || activePlatform.name}
          </span>
          <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-indigo-400" />
          <span className="hidden sm:inline-block text-slate-300 font-normal">v2026.1</span>
        </div>

        {/* Main Hero Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
          {activePlatform.titleTemplate[currentLang] || t('heroTitle', currentLang)}
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
          {activePlatform.subtitle[currentLang] || t('heroTagline', currentLang)}
        </p>

        {/* Downloader Form Card */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`relative max-w-3xl mx-auto p-3.5 sm:p-5 rounded-3xl backdrop-blur-2xl bg-slate-900/90 border transition-all duration-300 shadow-2xl ${
            isMaintenanceMode
              ? 'border-rose-500/50 shadow-rose-500/10'
              : isDragOver
              ? 'border-indigo-500 scale-[1.02] shadow-indigo-500/30'
              : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          {isMaintenanceMode && (
            <div className="mb-3.5 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs font-bold flex items-center justify-center gap-2 backdrop-blur-md">
              <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse shrink-0" />
              <span>وضع الصيانة مفعّل حالياً: التنزيل معلق مؤقتاً للتحديثات وسنعود قريباً!</span>
            </div>
          )}

          {/* Download Mode Switcher Tabs */}
          <div className="mb-4 flex items-center justify-between gap-2 p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800/80" role="tablist" aria-label="Download modes">
            <button
              type="button"
              role="tab"
              aria-selected={downloadMode === 'single'}
              aria-label="Single URL download mode"
              onClick={() => {
                setDownloadMode('single');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 ${
                downloadMode === 'single'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-200 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>تحميل رابط واحد (Single URL)</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={downloadMode === 'batch'}
              aria-label="Batch URL download mode"
              onClick={() => {
                setDownloadMode('batch');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 relative ${
                downloadMode === 'batch'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-200 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Layers className="w-4 h-4 text-purple-300" />
              <span>تنزيل جماعي متعدد (Batch Mode)</span>
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-mono">
                Multi
              </span>
            </button>
          </div>

          <form onSubmit={handleFetchMedia} className="space-y-3">
            {downloadMode === 'single' ? (
              /* Single Link Input Field */
              <div className="relative flex flex-col sm:flex-row items-center gap-2">
                <div className="relative w-full flex items-center">
                  <label htmlFor="video-url-input" className="sr-only">
                    Video URL to download
                  </label>
                  <input
                    id="video-url-input"
                    ref={inputRef}
                    type="url"
                    aria-label="Video URL to download"
                    disabled={isMaintenanceMode}
                    value={urlInput}
                    onChange={(e) => checkAndSetInputText(e.target.value)}
                    placeholder={
                      isMaintenanceMode
                        ? 'الخدمة في وضع الصيانة المؤقتة...'
                        : activePlatform.placeholderUrl
                        ? `Paste ${activePlatform.name} URL (${activePlatform.placeholderUrl})...`
                        : t('inputPlaceholder', currentLang)
                    }
                    className="w-full h-14 sm:h-16 pl-4 pr-24 sm:pr-28 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-white placeholder-slate-400 font-medium text-sm sm:text-base focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner disabled:opacity-60 disabled:cursor-not-allowed"
                  />

                  {/* Paste & Clear buttons inside input */}
                  <div className="absolute right-3 flex items-center gap-1.5">
                    {urlInput ? (
                      <button
                        type="button"
                        onClick={() => setUrlInput('')}
                        aria-label="Clear URL input"
                        className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                        title="Clear"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isMaintenanceMode}
                        onClick={handlePasteSingle}
                        aria-label="Paste URL from clipboard"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold hover:bg-indigo-500/20 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Clipboard className="w-3.5 h-3.5" />
                        <span>{t('pasteBtn', currentLang)}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Submit Download Button */}
                <button
                  type="submit"
                  disabled={loading || isMaintenanceMode}
                  aria-label="Download media video"
                  className={`w-full sm:w-auto h-14 sm:h-16 px-8 rounded-2xl text-white font-black text-base sm:text-lg shadow-xl transition-all flex items-center justify-center gap-2.5 whitespace-nowrap ${
                    isMaintenanceMode
                      ? 'bg-rose-900/80 border border-rose-600/50 cursor-not-allowed text-rose-200'
                      : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed'
                  }`}
                >
                  {isMaintenanceMode ? (
                    <>
                      <Lock className="w-5 h-5 text-rose-300" />
                      <span>موقوف للصيانة</span>
                    </>
                  ) : loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{t('processing', currentLang)}</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 animate-pulse" />
                      <span>{t('downloadBtn', currentLang)}</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Batch Download Textarea Box */
              <div className="space-y-3 text-left">
                <div className="relative">
                  <label htmlFor="batch-urls-textarea" className="sr-only">
                    Batch Video URLs list
                  </label>
                  <textarea
                    id="batch-urls-textarea"
                    rows={4}
                    disabled={isMaintenanceMode}
                    value={batchText}
                    aria-label="Batch Video URLs list to download"
                    onChange={(e) => {
                      setBatchText(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder={`ضع مجموعة روابط صالحة هنا (رابط في كل سطر أو مفصولة بفاصلة):\n\nhttps://www.tiktok.com/@user/video/12345678\nhttps://www.youtube.com/watch?v=dQw4w9WgXcQ\nhttps://www.instagram.com/reel/Cx123456789/`}
                    className="w-full p-4 rounded-2xl bg-slate-950/90 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs sm:text-sm font-mono leading-relaxed focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition resize-y min-h-[120px]"
                  />

                  {/* Batch Action Bar inside Textarea */}
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isMaintenanceMode}
                        onClick={handlePasteBatch}
                        className="px-3 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold hover:bg-purple-500/25 transition flex items-center gap-1.5"
                      >
                        <Clipboard className="w-3.5 h-3.5" />
                        <span>لصق القائمة (Paste)</span>
                      </button>

                      <button
                        type="button"
                        disabled={isMaintenanceMode}
                        onClick={() => setBatchText(SAMPLE_BATCH_LINKS)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>روابط تجريبية (Demo)</span>
                      </button>

                      {batchText && (
                        <button
                          type="button"
                          onClick={() => setBatchText('')}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold transition flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>مسح</span>
                        </button>
                      )}
                    </div>

                    {/* Valid Link Counter Badge */}
                    <div className="text-xs font-bold px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1.5">
                      <ListPlus className="w-4 h-4 text-indigo-400" />
                      <span>
                        تم التعرف على <strong className="text-purple-400 font-mono text-sm">{parsedBatchUrls.length}</strong> روابط
                      </span>
                    </div>
                  </div>
                </div>

                {/* Queue & Process Batch Button */}
                <button
                  type="submit"
                  disabled={isMaintenanceMode || parsedBatchUrls.length === 0}
                  className={`w-full py-4 rounded-2xl text-white font-black text-base sm:text-lg shadow-xl transition-all flex items-center justify-center gap-2.5 ${
                    isMaintenanceMode || parsedBatchUrls.length === 0
                      ? 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-600/30 hover:scale-[1.01] active:scale-95'
                  }`}
                >
                  <Play className="w-5 h-5 fill-current text-white" />
                  <span>بدء معالجة وتحميل القائمة ({parsedBatchUrls.length} مقاطع)</span>
                </button>
              </div>
            )}
          </form>

          {/* Drag and Drop helper & Batch Download Launch Trigger */}
          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <UploadCloud className="w-3.5 h-3.5 text-slate-300" />
              <span>{t('dropZoneText', currentLang)}</span>
            </div>

            <button
              type="button"
              onClick={() => handleLaunchBatchModal()}
              className="px-3 py-1 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-extrabold text-xs border border-indigo-500/30 flex items-center gap-1.5 transition shadow-sm"
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>فتح نافذة المعالجة الجماعية (Batch Tracker)</span>
            </button>
          </div>

          {/* Error Message Alert with Retry */}
          {errorMsg && (
            <div className="mt-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm font-semibold flex flex-wrap items-center justify-between gap-2.5 text-left animate-shake">
              <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
                <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                <div className="flex-1">{errorMsg}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    onReset?.();
                    if (urlInput.trim()) {
                      handleFetchMedia();
                    } else if (inputRef.current) {
                      inputRef.current.focus();
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-100 border border-rose-500/40 text-xs font-bold transition flex items-center gap-1.5 shrink-0 active:scale-95 shadow-sm cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-300" />
                  <span>إعادة المحاولة (Retry)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    onReset?.();
                  }}
                  className="text-rose-400 hover:text-white p-1 transition"
                  title="Clear error"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

          {/* Platform Selector Pills */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
          {platformsPills.map((p) => (
            <button
              key={p.slug}
              onClick={() => onSelectPlatform(p.slug)}
              className={`flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs font-bold transition-all border ${
                currentPlatform === p.slug
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20 scale-105'
                  : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              <span>{p.name}</span>
            </button>
          ))}
        </div>

        {/* Quick Trust Badges */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-300 font-semibold">
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>{t('highSpeed', currentLang)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{t('noWatermark', currentLang)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-sky-400" />
            <span>{t('unlimited', currentLang)}</span>
          </div>
        </div>
      </div>

      {/* Batch Download Modal Overlay */}
      <BatchDownloadModal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        currentLang={currentLang}
        initialUrl={batchModalPayload}
        onShowToast={(msg) => {
          if (onError) onError(msg);
        }}
      />
    </section>
  );
}
