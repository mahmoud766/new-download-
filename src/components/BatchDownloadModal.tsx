import React, { useState, useEffect } from 'react';
import {
  Download,
  Layers,
  Plus,
  Trash2,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  FileVideo,
  Music,
  Zap,
  Gauge,
  Clock,
  ArrowRight,
  ListPlus,
  Database,
} from 'lucide-react';
import { SupportedLanguage, MediaResult, MediaFormat } from '../types';
import { t } from '../i18n/translations';
import { processVideoFetch } from '../lib/providers';

export interface BatchQueueItem {
  id: string;
  url: string;
  status: 'PENDING' | 'EXTRACTING' | 'READY' | 'DOWNLOADING' | 'COMPLETED' | 'ERROR';
  result?: MediaResult;
  selectedFormatId?: string;
  progress: number;
  loadedMb: number;
  totalMb: number;
  speedMbps: number;
  etaSeconds: number;
  errorMessage?: string;
}

interface BatchDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: SupportedLanguage;
  initialUrl?: string;
  onShowToast: (msg: string) => void;
}

const SAMPLE_DEMO_URLS = [
  'https://www.tiktok.com/@tiktok/video/7123456789101112131',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://www.facebook.com/watch/?v=10158329381711234',
  'https://www.instagram.com/reel/Cx123456789/',
];

function parseSizeMb(sizeFormatted?: string): number {
  if (!sizeFormatted) return 25;
  const match = sizeFormatted.trim().match(/^([\d.]+)\s*([a-zA-Z]+)?$/i);
  if (!match) return 25;
  const val = parseFloat(match[1]);
  const unit = (match[2] || 'MB').toUpperCase();
  if (unit.startsWith('K')) return Number((val / 1024).toFixed(1));
  if (unit.startsWith('G')) return Number((val * 1024).toFixed(1));
  return Number(val.toFixed(1));
}

export const BatchDownloadModal: React.FC<BatchDownloadModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  initialUrl,
  onShowToast,
}) => {
  const [urlsInput, setUrlsInput] = useState('');
  const [queue, setQueue] = useState<BatchQueueItem[]>([]);
  const [globalFormatPreference, setGlobalFormatPreference] = useState<'hd' | 'sd' | 'mp3'>('hd');
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [activeTab, setActiveTab] = useState<'input' | 'tracker'>('tracker');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');

  // Pre-seed with initial URL if provided
  useEffect(() => {
    if (isOpen && initialUrl && !queue.some((q) => q.url === initialUrl)) {
      setUrlsInput(initialUrl);
      // Auto-extract initial URL if queue is empty
      if (queue.length === 0) {
        handleExtractUrls(initialUrl);
      }
    }
  }, [isOpen, initialUrl]);

  if (!isOpen) return null;

  // Extract batch URLs
  const handleExtractUrls = async (rawInputText?: string) => {
    const textToProcess = rawInputText !== undefined ? rawInputText : urlsInput;
    const lines = textToProcess
      .split(/[\n,;\s]+/)
      .map((l) => l.trim())
      .filter((l) => l.length > 5 && (l.startsWith('http://') || l.startsWith('https://')));

    if (lines.length === 0) {
      onShowToast(t('errorInvalidUrl', currentLang) || 'الرجاء إدخال روابط صالحة');
      return;
    }

    // Filter out URLs already in queue
    const existingUrls = new Set(queue.map((q) => q.url));
    const newLines = lines.filter((url) => !existingUrls.has(url));

    if (newLines.length === 0) {
      onShowToast('جميع الروابط المدخلة موجودة بالفعل في قائمة الانتظار');
      setActiveTab('tracker');
      return;
    }

    const newItems: BatchQueueItem[] = newLines.map((url, idx) => ({
      id: `batch-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
      url,
      status: 'PENDING',
      progress: 0,
      loadedMb: 0,
      totalMb: 0,
      speedMbps: 0,
      etaSeconds: 0,
    }));

    setQueue((prev) => [...prev, ...newItems]);
    setUrlsInput('');
    setActiveTab('tracker');
    onShowToast(`تمت إضافة ${newItems.length} رابط لقائمة التحميل الجماعي!`);

    // Trigger extraction for new items
    processBatchExtraction(newItems);
  };

  const processBatchExtraction = async (itemsToExtract: BatchQueueItem[]) => {
    setIsProcessingBatch(true);

    for (const item of itemsToExtract) {
      // Set state to EXTRACTING
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'EXTRACTING' } : q))
      );

      try {
        const result = await processVideoFetch(item.url);

        // Auto select format based on preference
        let selectedFmt: MediaFormat | undefined;
        if (globalFormatPreference === 'mp3') {
          selectedFmt = result.formats.find((f) => f.format === 'mp3');
        } else if (globalFormatPreference === 'hd') {
          selectedFmt =
            result.formats.find((f) => f.quality.includes('1080') || f.quality.includes('HD')) ||
            result.formats[0];
        } else {
          selectedFmt = result.formats[0];
        }

        if (!selectedFmt && result.formats.length > 0) {
          selectedFmt = result.formats[0];
        }

        const estMb = parseSizeMb(selectedFmt?.sizeFormatted);

        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  status: 'READY',
                  result,
                  selectedFormatId: selectedFmt?.id,
                  totalMb: estMb,
                }
              : q
          )
        );
      } catch (err: any) {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  status: 'ERROR',
                  errorMessage: err.message || 'فشل استخراج بيانات الفيديو',
                }
              : q
          )
        );
      }
    }

    setIsProcessingBatch(false);
  };

  // Trigger download for a single queued item
  const handleDownloadItem = async (itemId: string) => {
    const item = queue.find((q) => q.id === itemId);
    if (!item || !item.result) return;

    const selectedFmt =
      item.result.formats.find((f) => f.id === item.selectedFormatId) ||
      item.result.formats[0];

    if (!selectedFmt) return;

    // Set DOWNLOADING status
    setQueue((prev) =>
      prev.map((q) => (q.id === itemId ? { ...q, status: 'DOWNLOADING', progress: 5 } : q))
    );

    const rawUrl = selectedFmt.directVideoUrl || selectedFmt.url;
    const downloadFilename =
      selectedFmt.filename ||
      `${item.result.title.replace(/[^a-zA-Z0-9_\-]/g, '_')}_${selectedFmt.quality}.${selectedFmt.format}`;

    const isProxyRequired = Boolean(selectedFmt.forceProxy || item.result.platformName === 'YouTube' || item.result.platform === 'youtube');
    let proxyUrl =
      (!isProxyRequired && (rawUrl.startsWith('/api/') || rawUrl.startsWith('blob:')))
        ? rawUrl
        : (rawUrl.startsWith('/api/download')
            ? rawUrl
            : `/api/download?url=${encodeURIComponent(rawUrl)}&sourceUrl=${encodeURIComponent(item.result.originalUrl || '')}&filename=${encodeURIComponent(downloadFilename)}&disposition=attachment`);

    if (proxyUrl.startsWith('/api/download')) {
      const clean = proxyUrl.replace(/([?&])disposition=[^&]*/, '');
      proxyUrl = `${clean}${clean.includes('?') ? '&' : '?'}disposition=attachment`;
    }

    const totalSizeMb = parseSizeMb(selectedFmt.sizeFormatted);
    const totalSizeBytes = totalSizeMb * 1024 * 1024;

    const startTime = performance.now();

    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', proxyUrl, true);
      xhr.responseType = 'blob';

      xhr.onprogress = (event) => {
        const loadedBytes = event.loaded;
        const totalBytes =
          event.lengthComputable && event.total > 0 ? event.total : totalSizeBytes;
        const elapsedSec = (performance.now() - startTime) / 1000;
        const speedMBs = elapsedSec > 0 ? loadedBytes / (1024 * 1024) / elapsedSec : 5.2;
        const loadedMb = Number((loadedBytes / (1024 * 1024)).toFixed(1));
        const totalMb = Number((totalBytes / (1024 * 1024)).toFixed(1));
        const progress = Math.min(
          99,
          Math.max(5, Math.round((loadedBytes / totalBytes) * 100))
        );
        const remainingMb = Math.max(0, totalMb - loadedMb);
        const etaSeconds = speedMBs > 0 ? Math.ceil(remainingMb / speedMBs) : 0;

        setQueue((prev) =>
          prev.map((q) =>
            q.id === itemId
              ? {
                  ...q,
                  progress,
                  loadedMb,
                  totalMb,
                  speedMbps: Number(speedMBs.toFixed(1)),
                  etaSeconds,
                }
              : q
          )
        );
      };

      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300 && xhr.response) {
            const blobType = xhr.response.type || '';
            if (
              blobType.includes('text') ||
              blobType.includes('json') ||
              blobType.includes('mpegurl') ||
              blobType.includes('html') ||
              blobType.includes('xml')
            ) {
              reject(new Error('Upstream CDN returned blocked HTML error page (403 Anti-Bot)'));
              return;
            }

            const blobUrl = URL.createObjectURL(xhr.response);
            const anchor = document.createElement('a');
            anchor.href = blobUrl;
            anchor.download = downloadFilename;
            anchor.style.display = 'none';
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);

            setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

            setQueue((prev) =>
              prev.map((q) =>
                q.id === itemId
                  ? {
                      ...q,
                      status: 'COMPLETED',
                      progress: 100,
                      loadedMb: q.totalMb,
                    }
                  : q
              )
            );
            resolve();
          } else {
            reject(new Error(`Upstream CDN Error HTTP ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error connecting to proxy stream'));
        xhr.ontimeout = () => reject(new Error('Timeout connecting to proxy stream'));
        xhr.send();
      });
    } catch (err: any) {
      console.error('Batch item download failed:', err);
      setQueue((prev) =>
        prev.map((q) =>
          q.id === itemId
            ? {
                ...q,
                status: 'ERROR',
                progress: 0,
                errorMessage: err.message || 'فشل تحميل الملف من السيرفر المستضيف',
              }
            : q
        )
      );
    }
  };

  // Start Downloading All Ready Items in Queue
  const handleDownloadAll = async () => {
    const readyItems = queue.filter((q) => q.status === 'READY' || q.status === 'ERROR');

    if (readyItems.length === 0) {
      onShowToast('لا يوجد مقاطع جاهزة للتحميل في القائمة حالياً');
      return;
    }

    onShowToast(`بدء التحميل الجماعي لـ ${readyItems.length} مقطع...`);

    for (const item of readyItems) {
      await handleDownloadItem(item.id);
    }

    onShowToast('اكتمل التنزيل الجماعي لجميع مقاطع القائمة بنجاح!');
  };

  const handleRemoveItem = (id: string) => {
    setQueue((prev) => prev.filter((q) => q.id !== id));
  };

  const handleClearCompleted = () => {
    setQueue((prev) => prev.filter((q) => q.status !== 'COMPLETED'));
    onShowToast('تم مسح المقاطع المكتملة من قائمة الانتظار');
  };

  const filteredQueue = queue.filter((item) => {
    if (filterStatus === 'ACTIVE') return item.status === 'DOWNLOADING' || item.status === 'EXTRACTING' || item.status === 'PENDING' || item.status === 'READY';
    if (filterStatus === 'COMPLETED') return item.status === 'COMPLETED';
    return true;
  });

  // Calculate Overall Batch Stats
  const totalCount = queue.length;
  const readyCount = queue.filter((q) => q.status === 'READY').length;
  const completedCount = queue.filter((q) => q.status === 'COMPLETED').length;
  const downloadingCount = queue.filter((q) => q.status === 'DOWNLOADING').length;
  const totalLoadedMb = Number(queue.reduce((acc, q) => acc + q.loadedMb, 0).toFixed(1));
  const totalMbSum = Number(queue.reduce((acc, q) => acc + q.totalMb, 0).toFixed(1));
  const overallPercent = totalMbSum > 0 ? Math.min(100, Math.round((totalLoadedMb / totalMbSum) * 100)) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-slate-900 border border-indigo-500/30 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  أداة التنزيل الجماعي المتعدد (Batch Download & Bulk Queue Tracker)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono border border-indigo-500/30 font-bold">
                  PRO BULK
                </span>
              </div>
              <p className="text-xs text-slate-400">
                استخرج وحمّل مقاطع فيديو متعددة من مختلف المنصات دفعة واحدة بنقرة زر.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation: Add URLs vs Queue Tracker */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs font-bold">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('tracker')}
              className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'tracker'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ListPlus className="w-4 h-4" />
              <span>قائمة الانتظار والتنزيل ({totalCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('input')}
              className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'input'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>إضافة روابط جديدة</span>
            </button>
          </div>

          {/* Global Quality Preference Selector */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[11px] text-slate-400">الجودة المفضلة للدفعة:</span>
            <select
              value={globalFormatPreference}
              onChange={(e) => setGlobalFormatPreference(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-purple-300 font-bold text-xs rounded-xl px-2.5 py-1 focus:outline-none focus:border-indigo-500"
            >
              <option value="hd">أعلى جودة HD (1080p MP4)</option>
              <option value="sd">جودة قياسية MP4 (720p)</option>
              <option value="mp3">صوت فقط MP3 (320kbps)</option>
            </select>
          </div>
        </div>

        {/* Content Body Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'input' ? (
            /* Multi-URL Input Form */
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span>الصق روابط الفيديوهات (رابط واحد في كل سطر أو مفصولة بفواصل):</span>
                  <button
                    onClick={() => {
                      setUrlsInput(SAMPLE_DEMO_URLS.join('\n'));
                      onShowToast('تمت إضافة الروابط التجريبية بنجاح!');
                    }}
                    className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>إضافة روابط تجريبية للتجربة</span>
                  </button>
                </label>
                <textarea
                  rows={6}
                  value={urlsInput}
                  onChange={(e) => setUrlsInput(e.target.value)}
                  placeholder={`https://www.tiktok.com/@user/video/123456\nhttps://www.youtube.com/watch?v=xyz123\nhttps://www.facebook.com/watch/?v=987654\nhttps://www.instagram.com/reel/abc123/`}
                  className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-[11px] text-slate-400">
                  تدعم الأداة الاستخراج المتزامن من تيك توك، يوتيوب، فيسبوك، إنستغرام وسناب شات.
                </p>
                <button
                  onClick={() => handleExtractUrls()}
                  disabled={!urlsInput.trim() || isProcessingBatch}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition disabled:opacity-50"
                >
                  {isProcessingBatch ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري الاستخراج...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>استخراج وجدولة الفيديوهات</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Queue Tracker Section */
            <div className="space-y-5">
              {/* Overall Batch Progress & Statistics Panel */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">إجمالي المقاطع</span>
                  <div className="text-lg font-black text-white">{totalCount} مقطع</div>
                </div>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">جاهزة للتحميل</span>
                  <div className="text-lg font-black text-emerald-400">{readyCount} مقطع</div>
                </div>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">المكتملة</span>
                  <div className="text-lg font-black text-indigo-400">{completedCount} مقطع</div>
                </div>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">الحجم الكلي المحمّل</span>
                  <div className="text-lg font-black text-amber-300">
                    {totalLoadedMb} / {totalMbSum} MB
                  </div>
                </div>
              </div>

              {/* Overall Batch Progress Bar */}
              {totalMbSum > 0 && (
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-xs font-extrabold text-slate-300">
                    <span>نسبة الإنجاز الكلية للدفعة (Total Batch Progress)</span>
                    <span className="text-indigo-400">{overallPercent}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-300"
                      style={{ width: `${overallPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Toolbar & Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <button
                    onClick={() => setFilterStatus('ALL')}
                    className={`px-3 py-1 rounded-xl transition ${
                      filterStatus === 'ALL'
                        ? 'bg-slate-800 text-white border border-slate-700'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    الكل ({totalCount})
                  </button>
                  <button
                    onClick={() => setFilterStatus('ACTIVE')}
                    className={`px-3 py-1 rounded-xl transition ${
                      filterStatus === 'ACTIVE'
                        ? 'bg-slate-800 text-white border border-slate-700'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    النشطة / الجاهزة ({readyCount + downloadingCount})
                  </button>
                  <button
                    onClick={() => setFilterStatus('COMPLETED')}
                    className={`px-3 py-1 rounded-xl transition ${
                      filterStatus === 'COMPLETED'
                        ? 'bg-slate-800 text-white border border-slate-700'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    المكتملة ({completedCount})
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {completedCount > 0 && (
                    <button
                      onClick={handleClearCompleted}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>مسح المكتملة</span>
                    </button>
                  )}

                  <button
                    onClick={handleDownloadAll}
                    disabled={readyCount === 0 || downloadingCount > 0}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold transition shadow-md shadow-indigo-600/20 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تنزيل الدفعة بنقرة واحدة ({readyCount})</span>
                  </button>
                </div>
              </div>

              {/* Items Queue List */}
              <div className="space-y-3">
                {filteredQueue.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 space-y-3 bg-slate-950/50 rounded-2xl border border-slate-800/80">
                    <Layers className="w-10 h-10 text-slate-600 mx-auto" />
                    <p className="text-xs font-bold text-slate-400">قائمة التنزيل الجماعي فارغة حالياً</p>
                    <button
                      onClick={() => setActiveTab('input')}
                      className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                    >
                      + إضافة روابط جديدة للتنزيل
                    </button>
                  </div>
                ) : (
                  filteredQueue.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {item.result?.thumbnail ? (
                            <img
                              src={item.result.thumbnail}
                              alt={item.result.title}
                              className="w-14 h-14 rounded-xl object-cover bg-slate-900 border border-slate-800 shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 shrink-0">
                              <FileVideo className="w-6 h-6" />
                            </div>
                          )}

                          <div className="space-y-1 max-w-md">
                            <h4 className="text-xs font-extrabold text-white line-clamp-1">
                              {item.result?.title || item.url}
                            </h4>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                              <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 font-bold text-indigo-400">
                                {item.result?.platformName || 'Media Link'}
                              </span>
                              <span>{item.url}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge & Actions */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          {item.status === 'PENDING' && (
                            <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-400 text-[11px] font-bold">
                              بانتظار الاستخراج
                            </span>
                          )}

                          {item.status === 'EXTRACTING' && (
                            <span className="px-2.5 py-1 rounded-xl bg-purple-500/20 text-purple-300 text-[11px] font-bold flex items-center gap-1.5 border border-purple-500/30">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>جاري الاستخراج...</span>
                            </span>
                          )}

                          {item.status === 'READY' && (
                            <div className="flex items-center gap-2">
                              {item.result?.formats && item.result.formats.length > 0 && (
                                <select
                                  value={item.selectedFormatId}
                                  onChange={(e) =>
                                    setQueue((prev) =>
                                      prev.map((q) =>
                                        q.id === item.id ? { ...q, selectedFormatId: e.target.value } : q
                                      )
                                    )
                                  }
                                  className="bg-slate-900 border border-slate-800 text-slate-200 text-xs font-bold rounded-xl px-2 py-1"
                                >
                                  {item.result.formats.map((f) => (
                                    <option key={f.id} value={f.id}>
                                      {f.quality} ({f.format.toUpperCase()}) - {f.sizeFormatted}
                                    </option>
                                  ))}
                                </select>
                              )}

                              <button
                                onClick={() => handleDownloadItem(item.id)}
                                className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>تحميل</span>
                              </button>
                            </div>
                          )}

                          {item.status === 'DOWNLOADING' && (
                            <span className="px-2.5 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 text-[11px] font-bold flex items-center gap-1.5 border border-indigo-500/30 animate-pulse">
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                              <span>جاري التنزيل ({item.progress}%)</span>
                            </span>
                          )}

                          {item.status === 'COMPLETED' && (
                            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 text-[11px] font-bold flex items-center gap-1 border border-emerald-500/30">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>مكتمل</span>
                            </span>
                          )}

                          {item.status === 'ERROR' && (
                            <span className="px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 text-[11px] font-bold flex items-center gap-1 border border-rose-500/30">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                              <span>خطأ</span>
                            </span>
                          )}

                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition"
                            title="حذف من القائمة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Downloading Detailed Progress Indicator */}
                      {item.status === 'DOWNLOADING' && (
                        <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                            <span className="flex items-center gap-2">
                              <span className="text-indigo-400 font-bold">{item.speedMbps} MB/s</span>
                              <span className="text-slate-500">•</span>
                              <span className="text-amber-300">متبقي {item.etaSeconds} ثانية</span>
                            </span>
                            <span className="font-bold text-white">
                              {item.loadedMb} / {item.totalMb} MB
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 transition-all duration-200"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>OmniFetch Multi-Threaded Video Engine v2.5</span>
          <span className="text-indigo-400 font-bold">100% Free & Unlimited</span>
        </div>
      </div>
    </div>
  );
};
