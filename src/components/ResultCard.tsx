import { useState, useMemo, useEffect } from 'react';
import { SupportedLanguage, MediaResult, MediaFormat } from '../types';
import { t } from '../i18n/translations';
import {
  Download,
  Copy,
  Check,
  QrCode,
  Share2,
  Play,
  Sparkles,
  Music,
  Video,
  Eye,
  Heart,
  Calendar,
  X,
  ExternalLink,
  Loader2,
  PlayCircle,
  CloudUpload,
  HardDrive,
  Clock,
  Zap,
  Gauge,
  Activity,
  Layers,
  ListPlus,
  ChevronDown,
  Sliders,
  FileType,
  Edit3,
  RotateCcw,
  FileText,
  Star,
} from 'lucide-react';
import { BatchDownloadModal } from './BatchDownloadModal';
import { DownloadProgressBar } from './DownloadProgressBar';

interface ResultCardProps {
  result: MediaResult;
  currentLang: SupportedLanguage;
  onOpenQrCode: (url: string) => void;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export interface ContainerOption {
  id: string;
  label: string;
  ext: string;
  type: 'video' | 'audio';
  badge?: string;
  description: string;
  isAudioExtraction?: boolean;
}

export const CONTAINER_OPTIONS: ContainerOption[] = [
  {
    id: 'mp4',
    label: 'MP4 Video Container',
    ext: 'mp4',
    type: 'video',
    badge: 'UNIVERSAL',
    description: 'H.264 / AAC - Compatible with all phones, PCs, TVs & web',
  },
  {
    id: 'webm',
    label: 'WebM Video Container',
    ext: 'webm',
    type: 'video',
    badge: 'HIGH COMPRESSION',
    description: 'VP9 / Opus - Superior compression efficiency for Web',
  },
  {
    id: 'mkv',
    label: 'MKV Video (Matroska)',
    ext: 'mkv',
    type: 'video',
    badge: 'MATROSKA',
    description: 'Preserves high quality video streams, tracks & subtitles',
  },
  {
    id: 'mov',
    label: 'MOV (Apple QuickTime)',
    ext: 'mov',
    type: 'video',
    badge: 'APPLE / PRO',
    description: 'Optimized for Mac, iOS & editing in Final Cut / Premiere Pro',
  },
  {
    id: 'avi',
    label: 'AVI Video Container',
    ext: 'avi',
    type: 'video',
    badge: 'LEGACY PC',
    description: 'Standard Audio Video Interleave format for Windows',
  },
  {
    id: 'mp3',
    label: 'Extract Audio as MP3 (320kbps)',
    ext: 'mp3',
    type: 'audio',
    badge: '320 KBPS AUDIO',
    isAudioExtraction: true,
    description: 'Extract high-fidelity MP3 audio track for all music players',
  },
  {
    id: 'm4a',
    label: 'Extract Audio as M4A / AAC',
    ext: 'm4a',
    type: 'audio',
    badge: 'AAC DIGITAL',
    isAudioExtraction: true,
    description: 'Clean digital audio stream extracted directly from source',
  },
  {
    id: 'wav',
    label: 'Extract Audio as WAV (Lossless)',
    ext: 'wav',
    type: 'audio',
    badge: 'LOSSLESS PCM',
    isAudioExtraction: true,
    description: 'Uncompressed audio output for studio editing',
  },
  {
    id: 'ogg',
    label: 'Extract Audio as OGG Vorbis',
    ext: 'ogg',
    type: 'audio',
    badge: 'OPEN AUDIO',
    isAudioExtraction: true,
    description: 'Open source audio format for Linux & gaming apps',
  },
];

interface DownloadProgressState {
  formatId: string;
  percent: number;
  loadedMb: number;
  totalMb: number;
  speedMbps: number;
  etaSeconds: number;
  statusText: string;
}

function parseSizeToBytes(sizeFormatted?: string): number {
  if (!sizeFormatted) return 20 * 1024 * 1024;
  const match = sizeFormatted.trim().match(/^([\d.]+)\s*([a-zA-Z]+)?$/i);
  if (!match) return 20 * 1024 * 1024;
  const val = parseFloat(match[1]);
  const unit = (match[2] || 'MB').toUpperCase();
  if (unit.startsWith('K')) return Math.round(val * 1024);
  if (unit.startsWith('G')) return Math.round(val * 1024 * 1024 * 1024);
  return Math.round(val * 1024 * 1024);
}

function formatEta(seconds: number): string {
  if (seconds <= 0) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

export function ResultCard({
  result,
  currentLang,
  onOpenQrCode,
  onClose,
  onShowToast,
}: ResultCardProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [downloadingFormatId, setDownloadingFormatId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgressState | null>(null);
  const [cloudExportFormat, setCloudExportFormat] = useState<MediaFormat | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Container & Audio Extraction Selection State
  const [selectedContainers, setSelectedContainers] = useState<Record<string, string>>({});
  const [openContainerDropdownId, setOpenContainerDropdownId] = useState<string | null>(null);
  const [globalContainer, setGlobalContainer] = useState<string>('auto');

  // Custom Filename State
  const [customFilename, setCustomFilename] = useState<string>(() => result.title || '');

  useEffect(() => {
    setCustomFilename(result.title || '');
  }, [result.title]);

  const [autoPlay, setAutoPlay] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('omnifetch_autoplay');
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  });

  const handleToggleAutoPlay = (enabled: boolean) => {
    setAutoPlay(enabled);
    try {
      localStorage.setItem('omnifetch_autoplay', String(enabled));
    } catch (e) {
      console.error('Error saving autoplay preference:', e);
    }
  };

  const previewVideoUrl = useMemo(() => {
    const videoFmt =
      result.formats.find(f => f.format.toLowerCase() !== 'mp3' && (f.directVideoUrl || f.url)) ||
      result.formats.find(f => f.directVideoUrl || f.url) ||
      result.formats[0];

    const raw = videoFmt?.url || videoFmt?.directVideoUrl || 'https://vjs.zencdn.net/v/oceans.mp4';

    if (raw.startsWith('/api/download')) {
      const clean = raw.replace(/([?&])disposition=[^&]*/, '');
      return `${clean}${clean.includes('?') ? '&' : '?'}disposition=inline`;
    }

    const targetUrl = videoFmt?.directVideoUrl || videoFmt?.url || raw;
    if (targetUrl && (targetUrl.startsWith('http://') || targetUrl.startsWith('https://'))) {
      return `/api/download?url=${encodeURIComponent(targetUrl)}&filename=preview.mp4&disposition=inline`;
    }

    return raw;
  }, [result.formats]);

  const youtubeVideoId = useMemo(() => {
    const urlsToTest = [
      result.originalUrl || '',
      previewVideoUrl || '',
      ...(result.formats.map(f => f.directVideoUrl || f.url || '')),
    ];
    for (const u of urlsToTest) {
      const match = u.match(/(?:v=|\/shorts\/|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (match) return match[1];
    }
    return null;
  }, [result.originalUrl, previewVideoUrl, result.formats]);

  const instagramShortcode = useMemo(() => {
    const urlsToTest = [
      result.originalUrl || '',
      previewVideoUrl || '',
      ...(result.formats.map(f => f.directVideoUrl || f.url || '')),
    ];
    for (const u of urlsToTest) {
      const match = u.match(/(?:instagram\.com|instagr\.am)\/(?:p|reel|reels|tv|stories)\/([a-zA-Z0-9_-]+)/i);
      if (match) return match[1];
    }
    return null;
  }, [result.originalUrl, previewVideoUrl, result.formats]);

  const isDirectVideoFile = useMemo(() => {
    if (!previewVideoUrl) return false;
    const lower = previewVideoUrl.toLowerCase();
    return (
      lower.includes('.mp4') ||
      lower.includes('.webm') ||
      lower.includes('.mkv') ||
      lower.includes('.mov') ||
      lower.includes('ddinstagram.com') ||
      lower.includes('vxinstagram.com') ||
      lower.includes('kkinstagram.com') ||
      lower.includes('instafix.app') ||
      lower.includes('tikwm.com') ||
      lower.includes('googlevideo.com') ||
      lower.includes('fbcdn.net') ||
      lower.includes('cdninstagram.com')
    );
  }, [previewVideoUrl]);

  const handleGoogleDriveSave = (fmt: MediaFormat) => {
    const activeContainerId = selectedContainers[fmt.id] || (globalContainer !== 'auto' ? globalContainer : fmt.format) || 'mp4';
    const opt = CONTAINER_OPTIONS.find(o => o.id === activeContainerId) || CONTAINER_OPTIONS[0];
    const videoUrl = fmt.directVideoUrl || fmt.url;
    const baseTitle = customFilename.trim() || result.title;
    const fileName = `${baseTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_${fmt.quality}.${opt.ext}`;
    const gdriveUrl = `https://drive.google.com/save?url=${encodeURIComponent(videoUrl)}&title=${encodeURIComponent(fileName)}`;
    window.open(gdriveUrl, '_blank', 'width=650,height=650');
    onShowToast(t('preparingCloudSave', currentLang));
  };

  const handleDropboxSave = (fmt: MediaFormat) => {
    const activeContainerId = selectedContainers[fmt.id] || (globalContainer !== 'auto' ? globalContainer : fmt.format) || 'mp4';
    const opt = CONTAINER_OPTIONS.find(o => o.id === activeContainerId) || CONTAINER_OPTIONS[0];
    const videoUrl = fmt.directVideoUrl || fmt.url;
    const baseTitle = customFilename.trim() || result.title;
    const fileName = `${baseTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_${fmt.quality}.${opt.ext}`;
    const dropboxUrl = `https://www.dropbox.com/saver?url=${encodeURIComponent(videoUrl)}&name=${encodeURIComponent(fileName)}`;
    window.open(dropboxUrl, '_blank', 'width=650,height=650');
    onShowToast(t('preparingCloudSave', currentLang));
  };

  const handleOneDriveSave = (fmt: MediaFormat) => {
    const videoUrl = fmt.directVideoUrl || fmt.url;
    const onedriveUrl = `https://onedrive.live.com/?gdriveurl=${encodeURIComponent(videoUrl)}`;
    window.open(onedriveUrl, '_blank', 'width=650,height=650');
    onShowToast(t('preparingCloudSave', currentLang));
  };

  const handleCopy = (url: string, index: number) => {
    navigator.clipboard.writeText(url);
    setCopiedIndex(index);
    onShowToast(t('copied', currentLang));
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const formattedShareMessage = useMemo(() => {
    const title = result.title;
    const thumbnail = result.thumbnail;
    const url = result.originalUrl || window.location.href;
    return `🎬 ${title}${thumbnail ? `\n🖼️ Thumbnail: ${thumbnail}` : ''}\n🔗 ${url}`;
  }, [result]);

  const handleShare = (platform: string) => {
    const title = result.title;
    const shareUrl = result.originalUrl || window.location.href;
    const thumbnail = result.thumbnail;

    const encodedTitle = encodeURIComponent(`🎬 ${title}`);
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedMessage = encodeURIComponent(`🎬 ${title}${thumbnail ? `\n🖼️ Thumbnail: ${thumbnail}` : ''}\n\n🔗 ${shareUrl}`);

    let target = '';
    if (platform === 'whatsapp') {
      target = `https://api.whatsapp.com/send?text=${encodedMessage}`;
    } else if (platform === 'telegram') {
      target = `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;
    } else if (platform === 'twitter') {
      target = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
    } else if (platform === 'facebook') {
      target = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    } else if (platform === 'linkedin') {
      target = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    }

    if (target) {
      window.open(target, '_blank', 'width=650,height=650');
      onShowToast(t('shareResult', currentLang));
    }
  };

  const handleNativeShare = async () => {
    const title = result.title;
    const shareUrl = result.originalUrl || window.location.href;
    const thumbnail = result.thumbnail;

    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `🎬 ${title}${thumbnail ? `\nThumbnail: ${thumbnail}` : ''}`,
          url: shareUrl,
        });
        onShowToast(t('shareResult', currentLang));
      } catch (err) {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(formattedShareMessage);
      onShowToast(t('copied', currentLang));
    }
  };

  const handleDownload = async (fmt: MediaFormat) => {
    setDownloadingFormatId(fmt.id);
    const activeContainerId = selectedContainers[fmt.id] || (globalContainer !== 'auto' ? globalContainer : fmt.format) || 'mp4';
    const activeOpt = CONTAINER_OPTIONS.find(o => o.id === activeContainerId) || CONTAINER_OPTIONS[0];

    const isProxyRequired = Boolean(
      fmt.forceProxy ||
      result.platformName === 'YouTube' || result.platform === 'youtube' ||
      result.platformName === 'Facebook' || result.platform === 'facebook' ||
      result.platformName === 'Instagram' || result.platform === 'instagram'
    );
    const targetMediaUrl = fmt.directVideoUrl || fmt.url;
    const baseTitle = customFilename.trim() || result.title;
    const cleanTitle = baseTitle.replace(/[^a-zA-Z0-9_\-]/g, '_');
    const downloadFilename = `${cleanTitle}_${fmt.quality}.${activeOpt.ext}`;

    let proxyUrl = (isProxyRequired || !targetMediaUrl.startsWith('/api/'))
      ? (targetMediaUrl.startsWith('/api/download')
          ? targetMediaUrl
          : `/api/download?url=${encodeURIComponent(targetMediaUrl)}&sourceUrl=${encodeURIComponent(result.originalUrl || '')}&filename=${encodeURIComponent(downloadFilename)}&container=${encodeURIComponent(activeOpt.ext)}&disposition=attachment`)
      : targetMediaUrl;

    if (proxyUrl.startsWith('/api/download')) {
      if (!proxyUrl.includes('sourceUrl=') && result.originalUrl) {
        proxyUrl = `${proxyUrl}${proxyUrl.includes('?') ? '&' : '?'}&sourceUrl=${encodeURIComponent(result.originalUrl)}`;
      }
      const clean = proxyUrl.replace(/([?&])disposition=[^&]*/, '');
      proxyUrl = `${clean}${clean.includes('?') ? '&' : '?'}&container=${encodeURIComponent(activeOpt.ext)}&disposition=attachment`;
    }

    const estimatedTotalBytes = parseSizeToBytes(fmt.sizeFormatted);

    // Track real-time speed calculation metrics
    const startTime = performance.now();
    let lastSampleTime = startTime;
    let lastSampleLoaded = 0;
    let currentSpeedMBs = 0;

    const updateProgressState = (loadedBytes: number, totalBytes: number) => {
      const now = performance.now();
      const elapsedTotalSec = (now - startTime) / 1000;
      const timeDeltaSec = (now - lastSampleTime) / 1000;

      if (timeDeltaSec >= 0.15 || loadedBytes === totalBytes) {
        const bytesDelta = loadedBytes - lastSampleLoaded;
        const instantSpeedBytesPerSec = timeDeltaSec > 0 ? bytesDelta / timeDeltaSec : 0;
        const instantSpeedMBs = instantSpeedBytesPerSec / (1024 * 1024);

        if (currentSpeedMBs === 0) {
          currentSpeedMBs = instantSpeedMBs || (loadedBytes / (1024 * 1024)) / Math.max(0.1, elapsedTotalSec);
        } else if (instantSpeedMBs > 0) {
          currentSpeedMBs = currentSpeedMBs * 0.35 + instantSpeedMBs * 0.65;
        }

        lastSampleTime = now;
        lastSampleLoaded = loadedBytes;
      }

      const totalMB = Math.max(0.1, totalBytes / (1024 * 1024));
      const loadedMB = loadedBytes / (1024 * 1024);
      const percent = Math.min(100, Math.max(1, Math.round((loadedBytes / totalBytes) * 100)));

      const remainingBytes = Math.max(0, totalBytes - loadedBytes);
      const speedBytesPerSec = currentSpeedMBs * 1024 * 1024;
      const etaSeconds = speedBytesPerSec > 0 ? Math.ceil(remainingBytes / speedBytesPerSec) : 0;

      setDownloadProgress({
        formatId: fmt.id,
        percent,
        loadedMb: Number(loadedMB.toFixed(1)),
        totalMb: Number(totalMB.toFixed(1)),
        speedMbps: Number(currentSpeedMBs.toFixed(1)),
        etaSeconds,
        statusText: percent >= 98 ? t('processingVideo', currentLang) : t('downloadingProgress', currentLang),
      });
    };

    updateProgressState(0, estimatedTotalBytes);

    try {
      // Use XMLHttpRequest to monitor progress, validate content type, and create an in-memory blob download
      const xhr = new XMLHttpRequest();
      xhr.open('GET', proxyUrl, true);
      xhr.responseType = 'blob';

      xhr.onprogress = (event) => {
        const total = event.lengthComputable && event.total > 0 ? event.total : estimatedTotalBytes;
        updateProgressState(event.loaded, total);
      };

      await new Promise<void>((resolve, reject) => {
        xhr.onload = async () => {
          if (xhr.status >= 200 && xhr.status < 300 && xhr.response) {
            const blob: Blob = xhr.response;
            const blobType = (blob.type || '').toLowerCase();

            // Strict content type validation
            if (
              blobType.includes('text/') ||
              blobType.includes('json') ||
              blobType.includes('html') ||
              blobType.includes('xml')
            ) {
              const errObj: any = new Error(currentLang === 'ar' ? 'استجاب السيرفر بصفحة ويب بدلاً من ملف فيديو.' : 'Server returned invalid content type (webpage or JSON error).');
              errObj.directUrl = targetMediaUrl;
              reject(errObj);
              return;
            }

            // PHYSICAL LOCKDOWN: Prevent 0-byte or tiny HTML error downloads masquerading as video (< 2KB)
            if (blob.size < 2000) {
              const errObj: any = new Error(currentLang === 'ar' ? 'ملف الفيديو المحمل غير صالح أو محظور من خوادم المصدر.' : 'Downloaded file is corrupted or blocked by CDN.');
              errObj.directUrl = targetMediaUrl;
              reject(errObj);
              return;
            }

            updateProgressState(blob.size, blob.size);

            const blobUrl = URL.createObjectURL(blob);
            const downloadAnchor = document.createElement('a');
            downloadAnchor.href = blobUrl;
            downloadAnchor.download = downloadFilename;
            downloadAnchor.style.display = 'none';
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            document.body.removeChild(downloadAnchor);

            setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
            onShowToast(t('downloadStarted', currentLang));
            setDownloadSuccess(true);
            resolve();
          } else {
            // Read error JSON or message if available
            let errorMsg = `Server returned status ${xhr.status}`;
            let directUrlFromError = '';
            if (xhr.response) {
              try {
                const text = await (xhr.response as Blob).text();
                const json = JSON.parse(text);
                if (json && json.error) errorMsg = json.error;
                if (json && json.directUrl) directUrlFromError = json.directUrl;
              } catch (e) {}
            }
            const errObj: any = new Error(errorMsg);
            if (directUrlFromError) errObj.directUrl = directUrlFromError;
            reject(errObj);
          }
        };

        xhr.onerror = () => {
          const errObj: any = new Error(currentLang === 'ar' ? 'فشل الاتصال بسيرفر التحميل' : 'Network error occurred while fetching video stream.');
          errObj.directUrl = targetMediaUrl;
          reject(errObj);
        };
        xhr.ontimeout = () => {
          const errObj: any = new Error(currentLang === 'ar' ? 'انتهت مهلة استجابة السيرفر' : 'Download stream request timed out.');
          errObj.directUrl = targetMediaUrl;
          reject(errObj);
        };

        xhr.send();
      });
    } catch (error: any) {
      console.error('Download Error:', error);

      // Extract real direct source URL
      let fallbackDirectUrl = (error && error.directUrl) || targetMediaUrl || fmt.directVideoUrl || fmt.url;
      if (fallbackDirectUrl && (fallbackDirectUrl.startsWith('/api/download') || fallbackDirectUrl.includes('url='))) {
        try {
          const parsed = new URL(fallbackDirectUrl, window.location.origin);
          const innerUrl = parsed.searchParams.get('url');
          if (innerUrl) fallbackDirectUrl = innerUrl;
        } catch (e) {}
      }

      // STRICT LOCKDOWN: Never open YouTube watch pages or web links (youtube.com/youtu.be) in a browser tab!
      if (
        fallbackDirectUrl &&
        (fallbackDirectUrl.includes('youtube.com') || fallbackDirectUrl.includes('youtu.be')) &&
        !fallbackDirectUrl.includes('googlevideo.com') &&
        !fallbackDirectUrl.includes('savenow.to')
      ) {
        fallbackDirectUrl = '';
      }

      if (fallbackDirectUrl && fallbackDirectUrl.startsWith('http')) {
        onShowToast(
          currentLang === 'ar'
            ? '⚡ جاري استخدام رابط البث المباشر للتحميل...'
            : '⚡ Launching direct video stream download...'
        );
        setTimeout(() => {
          const link = document.createElement('a');
          link.href = fallbackDirectUrl;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.download = downloadFilename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }, 800);
      } else {
        onShowToast(`❌ ${error.message || (currentLang === 'ar' ? 'تعذر تحميل الفيديو. يرجى إعادة المحاولة' : 'Video download failed. Please retry')}`);
      }
    } finally {
      setDownloadProgress(null);
      setDownloadingFormatId(null);
    }
  };

  return (
    <div className="relative max-w-4xl mx-auto my-8 p-4 sm:p-6 rounded-3xl bg-slate-900 border border-indigo-500/30 shadow-2xl backdrop-blur-2xl animate-fade-in text-left">
      {/* Top Bar with Platform Badge & Close Button */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs sm:text-sm font-bold text-slate-200">
            {result.platformName} Media Ready
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-extrabold border border-indigo-500/30">
            FAST ENGINE
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBatchModal(true)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all active:scale-95"
            title="التنزيل الجماعي المتعدد (Batch Download)"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">التنزيل المتعدد (Batch)</span>
          </button>
          <button
            onClick={() => setShowShareModal(true)}
            className="px-3 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95"
            title={t('share', currentLang)}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{t('share', currentLang)}</span>
          </button>
          <button
            onClick={onClose}
            aria-label="Close result preview"
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Grid: Thumbnail Preview + Download Formats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Col: Native HTML5 Video Player & Creator Info */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative group aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-indigo-500/30 shadow-xl">
            {youtubeVideoId ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}?autoplay=${autoPlay ? 1 : 0}&rel=0`}
                title={result.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0 rounded-2xl"
              />
            ) : (
              <video
                key={`${result.id}-${previewVideoUrl}-${autoPlay}`}
                src={previewVideoUrl}
                poster={result.thumbnail}
                controls
                autoPlay={autoPlay}
                preload="metadata"
                playsInline
                className="w-full h-full object-contain bg-black"
              >
                <source src={previewVideoUrl} type="video/mp4" />
                متصفحك لا يدعم تشغيل هذا الفيديو مباشرة.
              </video>
            )}
            {result.duration && (
              <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-slate-950/80 text-white font-mono text-xs font-bold border border-slate-700 z-10 pointer-events-none">
                {result.duration}
              </span>
            )}
          </div>

          {/* Video Auto-play Toggle Switch */}
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-sm">
            <div className="flex items-center gap-2">
              <PlayCircle className={`w-4 h-4 ${autoPlay ? 'text-indigo-400' : 'text-slate-400'}`} />
              <span className="text-xs font-semibold text-slate-200">
                {t('autoPlayToggle', currentLang)}
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={autoPlay}
              onClick={() => handleToggleAutoPlay(!autoPlay)}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                autoPlay ? 'bg-indigo-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  autoPlay ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Title & Author Info */}
          <div className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-white line-clamp-2 leading-snug">
              {result.title}
            </h2>

            {result.author && (
              <div className="flex items-center gap-2.5 pt-1">
                {result.author.avatar && (
                  <img
                    src={result.author.avatar}
                    alt={result.author.name}
                    width="32"
                    height="32"
                    loading="lazy"
                    decoding="async"
                    className="w-8 h-8 rounded-full border border-slate-700"
                  />
                )}
                <div>
                  <div className="text-xs font-bold text-slate-200">{result.author.name}</div>
                  <div className="text-[11px] text-slate-300">{result.author.username}</div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-300 font-medium border-t border-slate-800/80">
              {result.viewsCount && (
                <div className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{result.viewsCount} views</span>
                </div>
              )}
              {result.likesCount && (
                <div className="flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <span>{result.likesCount}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Download Options List */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Available Qualities & Formats</span>
            </h3>
            <span className="text-xs text-indigo-400 font-bold">100% Free Direct Link</span>
          </div>

          {/* Global Container / Target Format Preset Bar */}
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-950/90 border border-indigo-500/30 shadow-md flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 shrink-0">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Container Preset:</span>
            </div>
            <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar max-w-full">
              <button
                type="button"
                onClick={() => {
                  setGlobalContainer('auto');
                  setSelectedContainers({});
                  onShowToast('Format preset reset to Auto');
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap ${
                  globalContainer === 'auto'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Auto (Default)
              </button>
              {['mp4', 'webm', 'mkv', 'mov', 'mp3', 'm4a'].map((extKey) => {
                const opt = CONTAINER_OPTIONS.find((o) => o.id === extKey)!;
                const isActive = globalContainer === extKey;
                return (
                  <button
                    key={extKey}
                    type="button"
                    onClick={() => {
                      setGlobalContainer(extKey);
                      onShowToast(`All formats preset to ${opt.label}`);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 whitespace-nowrap ${
                      isActive
                        ? opt.type === 'audio'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {opt.type === 'audio' ? (
                      <Music className="w-3 h-3 text-rose-300" />
                    ) : (
                      <Video className="w-3 h-3 text-indigo-300" />
                    )}
                    <span>{opt.ext.toUpperCase()}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {result.formats.map((fmt, idx) => {
              const activeContainerId = selectedContainers[fmt.id] || (globalContainer !== 'auto' ? globalContainer : fmt.format) || 'mp4';
              const activeOpt = CONTAINER_OPTIONS.find((o) => o.id === activeContainerId) || CONTAINER_OPTIONS[0];

              return (
                <div
                  key={fmt.id || idx}
                  className="p-3 sm:p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col gap-3"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {activeOpt.type === 'audio' ? (
                          <Music className="w-4 h-4 text-rose-400 shrink-0" />
                        ) : (
                          <Video className="w-4 h-4 text-indigo-400 shrink-0" />
                        )}
                        <span className="text-sm font-black text-white">{fmt.quality}</span>

                        {fmt.watermarkFree && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            NO WATERMARK
                          </span>
                        )}

                        {activeOpt.isAudioExtraction && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            🎵 AUDIO EXTRACTION ({activeOpt.ext.toUpperCase()})
                          </span>
                        )}
                        {activeOpt.id !== fmt.format && !activeOpt.isAudioExtraction && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {activeOpt.ext.toUpperCase()} CONTAINER
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-3">
                        <span>Size: {fmt.sizeFormatted}</span>
                        <span>
                          Target:{' '}
                          <strong className="text-amber-300 font-mono font-bold">
                            {activeOpt.ext.toUpperCase()}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Actions for this format */}
                    <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
                      {/* Container & Audio Extraction Dropdown Menu */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenContainerDropdownId(openContainerDropdownId === fmt.id ? null : fmt.id);
                          }}
                          className={`px-3 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 border transition-all active:scale-95 shadow-sm ${
                            activeOpt.isAudioExtraction
                              ? 'bg-rose-600/20 text-rose-300 border-rose-500/40 hover:bg-rose-600/30'
                              : 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-600/30'
                          }`}
                          title="Choose Container / Format or Extract Audio"
                        >
                          <FileType className="w-3.5 h-3.5 text-amber-400" />
                          <span className="font-mono">{activeOpt.ext.toUpperCase()}</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${
                              openContainerDropdownId === fmt.id ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        {/* Dropdown Menu Floating Popup */}
                        {openContainerDropdownId === fmt.id && (
                          <>
                            <div
                              className="fixed inset-0 z-30"
                              onClick={() => setOpenContainerDropdownId(null)}
                            />
                            <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-slate-900 border border-indigo-500/40 rounded-2xl shadow-2xl p-2.5 z-40 animate-fadeIn text-left space-y-2.5">
                              <div className="px-2.5 py-1.5 border-b border-slate-800 flex items-center justify-between">
                                <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Container & Audio Options</span>
                                </span>
                                <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded border border-indigo-500/25">
                                  Instant
                                </span>
                              </div>

                              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                                {/* Video Containers Section */}
                                <div className="space-y-1">
                                  <div className="px-2 text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                                    <Video className="w-3 h-3 text-indigo-400" />
                                    <span>Video Containers</span>
                                  </div>
                                  {CONTAINER_OPTIONS.filter((o) => o.type === 'video').map((opt) => {
                                    const isSelected = activeOpt.id === opt.id;
                                    return (
                                      <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => {
                                          setSelectedContainers((prev) => ({ ...prev, [fmt.id]: opt.id }));
                                          setOpenContainerDropdownId(null);
                                          onShowToast(`Container set to ${opt.label}`);
                                        }}
                                        className={`w-full p-2 rounded-xl text-left transition flex items-start justify-between gap-2 border ${
                                          isSelected
                                            ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold'
                                            : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                                        }`}
                                      >
                                        <div className="space-y-0.5">
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-white">{opt.label}</span>
                                            {opt.badge && (
                                              <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                                {opt.badge}
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-[10px] text-slate-400 leading-tight">{opt.description}</p>
                                        </div>
                                        {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Audio Extraction Section */}
                                <div className="space-y-1 pt-1 border-t border-slate-800">
                                  <div className="px-2 text-[10px] font-extrabold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                                    <Music className="w-3 h-3 text-rose-400" />
                                    <span>Extract Audio Track</span>
                                  </div>
                                  {CONTAINER_OPTIONS.filter((o) => o.type === 'audio').map((opt) => {
                                    const isSelected = activeOpt.id === opt.id;
                                    return (
                                      <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => {
                                          setSelectedContainers((prev) => ({ ...prev, [fmt.id]: opt.id }));
                                          setOpenContainerDropdownId(null);
                                          onShowToast(`Audio extraction set to ${opt.label}`);
                                        }}
                                        className={`w-full p-2 rounded-xl text-left transition flex items-start justify-between gap-2 border ${
                                          isSelected
                                            ? 'bg-rose-600/30 border-rose-500 text-white font-bold'
                                            : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                                        }`}
                                      >
                                        <div className="space-y-0.5">
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-white">{opt.label}</span>
                                            {opt.badge && (
                                              <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                                {opt.badge}
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-[10px] text-slate-400 leading-tight">{opt.description}</p>
                                        </div>
                                        {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      <button
                        onClick={() => handleDownload(fmt)}
                        disabled={downloadingFormatId === fmt.id}
                        className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-75 disabled:cursor-wait"
                      >
                        {downloadingFormatId === fmt.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                            <span>{t('downloading', currentLang)}</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5" />
                            <span>Download {activeOpt.ext.toUpperCase()}</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleCopy(fmt.directVideoUrl || fmt.url, idx)}
                        className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition-all"
                        title={t('copyLink', currentLang)}
                      >
                        {copiedIndex === idx ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => {
                          let raw = fmt.directVideoUrl || fmt.url;
                          if (raw && (raw.startsWith('/api/download') || raw.includes('url='))) {
                            try {
                              const parsed = new URL(raw, window.location.origin);
                              const innerUrl = parsed.searchParams.get('url');
                              if (innerUrl) raw = innerUrl;
                            } catch (e) {}
                          }
                          if (raw && (raw.includes('youtube.com') || raw.includes('youtu.be')) && !raw.includes('googlevideo.com') && !raw.includes('savenow.to')) {
                            handleDownload(fmt);
                            return;
                          }
                          onShowToast(currentLang === 'ar' ? '⚡ جاري فتح رابط المصدر المباشر...' : '⚡ Opening direct stream URL...');
                          window.open(raw, '_blank', 'noopener,noreferrer');
                        }}
                        className="p-2.5 rounded-xl bg-slate-800 text-emerald-400 hover:text-white hover:bg-slate-700 border border-slate-700 transition-all"
                        title={currentLang === 'ar' ? 'تحميل مباشر عبر السيرفر' : 'Direct Server Download'}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onOpenQrCode(fmt.directVideoUrl || fmt.url)}
                        className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition-all"
                        title={t('qrCode', currentLang)}
                      >
                        <QrCode className="w-4 h-4 text-amber-400" />
                      </button>

                      <button
                        onClick={() => setCloudExportFormat(fmt)}
                        className="p-2.5 rounded-xl bg-slate-800 text-sky-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition-all hover:border-sky-500/50"
                        title={t('exportToCloud', currentLang)}
                      >
                        <CloudUpload className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                {/* Real-time Download Progress & Speed Bar */}
                {downloadProgress && downloadProgress.formatId === fmt.id && (
                  <div className="w-full pt-2">
                    <DownloadProgressBar
                      percent={downloadProgress.percent}
                      speedMbps={downloadProgress.speedMbps}
                      loadedMb={downloadProgress.loadedMb}
                      totalMb={downloadProgress.totalMb}
                      statusText={downloadProgress.statusText}
                      etaSeconds={downloadProgress.etaSeconds}
                      isCompleted={downloadProgress.percent >= 100}
                      showDetails={true}
                    />
                  </div>
                )}
              </div>
            );
          })}
          </div>

          {/* Social Share Bar */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>{t('shareResult', currentLang)}</span>
            </span>
            <div className="flex items-center flex-wrap gap-1.5">
              <button
                onClick={() => handleShare('whatsapp')}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30 font-bold flex items-center gap-1 transition-all active:scale-95"
                title={t('shareWhatsApp', currentLang)}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>{t('shareWhatsApp', currentLang)}</span>
              </button>
              <button
                onClick={() => handleShare('telegram')}
                className="px-2.5 py-1.5 rounded-lg bg-sky-600/20 text-sky-300 hover:bg-sky-600/30 border border-sky-500/30 font-bold flex items-center gap-1 transition-all active:scale-95"
                title={t('shareTelegram', currentLang)}
              >
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <span>{t('shareTelegram', currentLang)}</span>
              </button>
              <button
                onClick={() => handleShare('twitter')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 font-bold flex items-center gap-1 transition-all active:scale-95"
                title={t('shareTwitter', currentLang)}
              >
                <span className="text-[11px] font-black font-mono">𝕏</span>
                <span>{t('shareTwitter', currentLang)}</span>
              </button>
              <button
                onClick={() => handleShare('facebook')}
                className="px-2.5 py-1.5 rounded-lg bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-500/30 font-bold flex items-center gap-1 transition-all active:scale-95"
                title={t('shareFacebook', currentLang)}
              >
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span>{t('shareFacebook', currentLang)}</span>
              </button>
              <button
                onClick={handleNativeShare}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 font-bold flex items-center gap-1 transition-all active:scale-95"
                title={t('shareNative', currentLang)}
              >
                <Share2 className="w-3 h-3 text-indigo-400" />
                <span>{t('shareNative', currentLang)}</span>
              </button>
            </div>
          </div>

          {/* Trustpilot Review Nudge (Post-Download Success) */}
          {downloadSuccess && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-950/90 border border-emerald-500/40 shadow-lg shadow-emerald-500/10 flex items-center justify-between flex-wrap gap-3 transition-all animate-fade-in">
              <div className="flex items-center gap-2.5 text-xs text-slate-200 font-medium">
                <span className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                </span>
                <span>{t('trustpilotReviewNudge', currentLang)}</span>
              </div>
              <a
                href="https://www.trustpilot.com/evaluate/omnifetchpro.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 shrink-0"
              >
                <span>Review on Trustpilot</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-950" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Video Modal Player */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-sm font-bold text-white line-clamp-1">{result.title}</h4>
              <button
                onClick={() => setShowVideoModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 aspect-video rounded-2xl overflow-hidden bg-black">
              {youtubeVideoId && !isDirectVideoFile ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}?autoplay=1&rel=0`}
                  title={result.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0 rounded-2xl"
                />
              ) : (
                <video
                  key={`modal-${result.id}-${previewVideoUrl}`}
                  poster={result.thumbnail}
                  controls
                  autoPlay
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-contain"
                >
                  <source src={previewVideoUrl} type="video/mp4" />
                  Your browser does not support HTML5 video preview.
                </video>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cloud Export Modal */}
      {cloudExportFormat && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                  <CloudUpload className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">{t('exportCloudModalTitle', currentLang)}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{t('exportCloudModalDesc', currentLang)}</p>
                </div>
              </div>
              <button
                onClick={() => setCloudExportFormat(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selected Format Summary */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
              <img src={result.thumbnail} alt={result.title} className="w-14 h-10 object-cover rounded-lg border border-slate-800 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate">{result.title}</div>
                <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                  <span className="font-semibold text-indigo-400">{cloudExportFormat.quality}</span>
                  <span>•</span>
                  <span>{cloudExportFormat.sizeFormatted}</span>
                  <span>•</span>
                  <span>{cloudExportFormat.format.toUpperCase()}</span>
                </div>
              </div>
            </div>

            {/* Cloud Storage Providers */}
            <div className="space-y-2.5">
              {/* Google Drive */}
              <button
                onClick={() => handleGoogleDriveSave(cloudExportFormat)}
                className="w-full p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/50 flex items-center justify-between gap-3 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-black text-xs">
                    GD
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                      {t('saveToGoogleDrive', currentLang)}
                    </div>
                    <div className="text-[10px] text-slate-400">Save directly to Google Drive storage</div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
              </button>

              {/* Dropbox */}
              <button
                onClick={() => handleDropboxSave(cloudExportFormat)}
                className="w-full p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-sky-500/50 flex items-center justify-between gap-3 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 font-black text-xs">
                    DB
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors">
                      {t('saveToDropbox', currentLang)}
                    </div>
                    <div className="text-[10px] text-slate-400">Import file using Dropbox Saver</div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-sky-400 transition-colors" />
              </button>

              {/* OneDrive */}
              <button
                onClick={() => handleOneDriveSave(cloudExportFormat)}
                className="w-full p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/50 flex items-center justify-between gap-3 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-xs">
                    OD
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {t('saveToOneDrive', currentLang)}
                    </div>
                    <div className="text-[10px] text-slate-400">Remote cloud import link</div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
              </button>
            </div>

            {/* Direct Stream URL for Cloud */}
            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 block">
                {t('copyDirectCloudUrl', currentLang)}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={cloudExportFormat.directVideoUrl || cloudExportFormat.url}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono truncate focus:outline-none"
                />
                <button
                  onClick={() => handleCopy(cloudExportFormat.directVideoUrl || cloudExportFormat.url, 999)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Social Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Share2 className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-white">{t('shareResult', currentLang)}</h4>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Thumbnail Preview */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
              <img src={result.thumbnail} alt={result.title} className="w-16 h-12 object-cover rounded-xl border border-slate-800 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white line-clamp-2">{result.title}</div>
                <div className="text-[11px] text-slate-400 mt-1 font-semibold">{result.platformName} Video</div>
              </div>
            </div>

            {/* Formatted Share Text Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">Pre-formatted Share Message</label>
              <div className="relative">
                <textarea
                  readOnly
                  rows={3}
                  value={formattedShareMessage}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono resize-none focus:outline-none"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(formattedShareMessage);
                    onShowToast(t('copied', currentLang));
                  }}
                  className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1 transition-all active:scale-95"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>
            </div>

            {/* Share Platform Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={() => handleShare('whatsapp')}
                className="p-3 rounded-2xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-2 transition-all active:scale-95"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="truncate">{t('shareWhatsApp', currentLang)}</span>
              </button>

              <button
                onClick={() => handleShare('telegram')}
                className="p-3 rounded-2xl bg-sky-600/15 hover:bg-sky-600/25 border border-sky-500/30 text-sky-300 font-bold text-xs flex items-center gap-2 transition-all active:scale-95"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shrink-0" />
                <span className="truncate">{t('shareTelegram', currentLang)}</span>
              </button>

              <button
                onClick={() => handleShare('twitter')}
                className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 transition-all active:scale-95"
              >
                <span className="text-xs font-black font-mono shrink-0">𝕏</span>
                <span className="truncate">{t('shareTwitter', currentLang)}</span>
              </button>

              <button
                onClick={() => handleShare('facebook')}
                className="p-3 rounded-2xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 font-bold text-xs flex items-center gap-2 transition-all active:scale-95"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0" />
                <span className="truncate">{t('shareFacebook', currentLang)}</span>
              </button>
            </div>

            {/* Native Share / Copy Trigger */}
            <button
              onClick={handleNativeShare}
              className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>{t('shareNative', currentLang)}</span>
            </button>
          </div>
        </div>
      )}

      {/* Batch Download Modal Overlay */}
      <BatchDownloadModal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        currentLang={currentLang}
        initialUrl={result.originalUrl}
        onShowToast={onShowToast}
      />
    </div>
  );
}
