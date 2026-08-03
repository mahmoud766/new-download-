import React, { useState, useRef, useEffect } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Download,
  Sparkles,
  Zap,
  Sliders,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  HardDrive,
  FileCheck,
  ArrowRight,
  Gauge,
  Layers,
  Info,
} from 'lucide-react';
import { SupportedLanguage } from '../../types';

interface Props {
  currentLang: SupportedLanguage;
  onShowToast: (msg: string) => void;
}

interface ImageProcessingResult {
  fileName: string;
  originalSize: number;
  compressedSize: number;
  originalWidth: number;
  originalHeight: number;
  compressedWidth: number;
  compressedHeight: number;
  dataUrl: string;
  savingsPercent: number;
  processingTimeMs: number;
}

export const ImageOptimizerTab: React.FC<Props> = ({ currentLang, onShowToast }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [quality, setQuality] = useState(0.82); // 82% WebP quality
  const [maxWidth, setMaxWidth] = useState(1280);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ImageProcessingResult | null>(null);
  const [copiedDataUrl, setCopiedDataUrl] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Sample Thumbnails for testing
  const sampleThumbnails = [
    {
      name: 'TikTok Video Thumbnail',
      url: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=1200&q=90',
    },
    {
      name: 'YouTube Shorts Cover',
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=90',
    },
    {
      name: 'Instagram Reel Preview',
      url: 'https://images.unsplash.com/photo-1611262588024-d12430b98920?w=1200&q=90',
    },
  ];

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Core Canvas WebP Image Optimization Algorithm
  const processImage = (imageSource: string | File) => {
    setProcessing(true);
    const startTime = performance.now();

    const img = new window.Image();
    img.crossOrigin = 'anonymous';

    const handleImgLoad = () => {
      const canvas = canvasRef.current || document.createElement('canvas');
      let targetW = img.width;
      let targetH = img.height;

      // Scale down proportionally if larger than maxWidth
      if (targetW > maxWidth) {
        targetH = Math.round((targetH * maxWidth) / targetW);
        targetW = maxWidth;
      }

      canvas.width = targetW;
      canvas.height = targetH;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setProcessing(false);
        onShowToast('عذراً، لم نتمكن من الوصول للـ 2D Context الخاص بـ Canvas.');
        return;
      }

      // Smooth canvas rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetW, targetH);

      // Convert to WebP via Browser Canvas API
      const webpDataUrl = canvas.toDataURL('image/webp', quality);

      // Calculate compressed blob size
      const head = 'data:image/webp;base64,';
      const base64Length = webpDataUrl.length - head.length;
      const compressedSizeBytes = Math.round(base64Length * 0.75);

      // Estimated original size or actual file size
      let originalSizeBytes = 1250000; // default 1.25MB estimation for remote URLs
      if (typeof imageSource !== 'string' && imageSource.size) {
        originalSizeBytes = imageSource.size;
      }

      const savings = Math.max(0, Math.round(((originalSizeBytes - compressedSizeBytes) / originalSizeBytes) * 100));
      const elapsedTime = Math.round(performance.now() - startTime);

      const fileName = typeof imageSource === 'string'
        ? 'optimized_thumbnail.webp'
        : imageSource.name.replace(/\.[^/.]+$/, '') + '_compressed.webp';

      setResult({
        fileName,
        originalSize: originalSizeBytes,
        compressedSize: compressedSizeBytes,
        originalWidth: img.width,
        originalHeight: img.height,
        compressedWidth: targetW,
        compressedHeight: targetH,
        dataUrl: webpDataUrl,
        savingsPercent: savings,
        processingTimeMs: elapsedTime,
      });

      setProcessing(false);
      onShowToast(`تم ضغط الصورة وتحويلها بنجاح إلى صيغة WebP بأعلى كفاءة (${savings}% أسرع)!`);
    };

    img.onerror = () => {
      setProcessing(false);
      onShowToast('حدث خطأ أثناء تحميل الصورة. يرجى التأكد من الرابط أو الملف.');
    };

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        }
      };
      reader.readAsDataURL(imageSource);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      processImage(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      processImage(file);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.dataUrl;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onShowToast('تم تنزيل صورة WebP المحسنة بنجاح!');
  };

  const handleCopyDataUrl = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.dataUrl);
    setCopiedDataUrl(true);
    setTimeout(() => setCopiedDataUrl(false), 2000);
    onShowToast('تم نسخ كود Base64 لـ WebP إلى الحافظة!');
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Hidden Canvas Element */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900 p-5 rounded-2xl border border-slate-800 gap-3">
        <div>
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <span>أداة ضغط الصور ومعاينتها بواسطة Canvas API (WebP Optimizer)</span>
            <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-mono border border-purple-500/30 font-bold flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400 fill-amber-400" /> WebP Engine 2.0
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            ضغط وتقليل حجم الصور المصغرة والـ Thumbnails بنسبة تصل إلى 90% دون فقدان الجودة لزيادة سرعة التحميل ورفع تقييم Google PageSpeed.
          </p>
        </div>

        <button
          onClick={() => {
            if (selectedFile) processImage(selectedFile);
            else if (imageUrlInput) processImage(imageUrlInput);
            else processImage(sampleThumbnails[0].url);
          }}
          disabled={processing}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 transition shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${processing ? 'animate-spin' : ''}`} />
          <span>إعادة معالجة وضغط الصورة</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Panel */}
        <div className="lg:col-span-5 bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-5">
          <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4" />
            <span>خيارات الضغط والأبعاد (Canvas Compression Settings)</span>
          </h4>

          {/* Drag & Drop File Upload Box */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-5 text-center transition cursor-pointer relative ${
              dragActive ? 'border-purple-500 bg-purple-500/10' : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
            }`}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
                <Upload className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-white">اسحب صورة المعاينة هنا أو اضغط للاختيار</span>
              <span className="text-[11px] text-slate-500">يدعم صيغ PNG, JPEG, WEBP, AVIF</span>
            </div>
          </div>

          {/* Sample Images Quick Pick */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-bold block">أو اختر صورة نموذجية للضغط الفوري:</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {sampleThumbnails.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedFile(null);
                    setImageUrlInput(item.url);
                    processImage(item.url);
                  }}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 text-[11px] font-bold text-slate-300 hover:text-white transition text-center truncate"
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          {/* URL Input */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-bold block">أو أدخل رابط الصورة (Image URL)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="https://example.com/thumbnail.png"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
              />
              <button
                onClick={() => processImage(imageUrlInput)}
                disabled={!imageUrlInput || processing}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shrink-0 transition"
              >
                تحميل
              </button>
            </div>
          </div>

          {/* Quality Slider */}
          <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-bold">جودة ضغط WebP (Quality):</span>
              <span className="text-amber-400 font-mono font-black">{Math.round(quality * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={quality}
              onChange={(e) => {
                const q = parseFloat(e.target.value);
                setQuality(q);
              }}
              className="w-full accent-purple-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>أصغر حجم (Low 10%)</span>
              <span>موصى به (82%)</span>
              <span>جودة عالية (100%)</span>
            </div>
          </div>

          {/* Max Width Limit */}
          <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-bold">أقصى العرض بالبكسل (Max Width):</span>
              <span className="text-purple-300 font-mono font-black">{maxWidth}px</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[1920, 1280, 800, 480].map((w) => (
                <button
                  key={w}
                  onClick={() => setMaxWidth(w)}
                  className={`py-1.5 rounded-lg text-xs font-mono font-bold border transition ${
                    maxWidth === w
                      ? 'bg-purple-600 text-white border-purple-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {w}px
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results & Preview Panel */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                <span>معاينة النتيجة ومقارنة الأداء (Output WebP Preview)</span>
              </span>
              {result && (
                <span className="text-[11px] font-mono text-emerald-400 font-black">
                  ⚡ تم الضغط في {result.processingTimeMs} ms
                </span>
              )}
            </h4>

            {processing ? (
              <div className="h-72 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center gap-3 text-purple-400">
                <Sparkles className="w-8 h-8 animate-spin" />
                <span className="text-xs font-bold text-slate-300">جاري المعالجة باستخدام Browser Canvas API...</span>
              </div>
            ) : result ? (
              <div className="space-y-4 animate-fadeIn">
                {/* Image Comparison Box */}
                <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center min-h-[260px] p-2">
                  <img
                    src={result.dataUrl}
                    alt="WebP Preview"
                    className="max-h-72 w-auto object-contain rounded-xl shadow-2xl"
                  />
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-xs font-mono font-bold backdrop-blur-md">
                    WebP Format ({result.compressedWidth}x{result.compressedHeight})
                  </div>
                </div>

                {/* Savings & Metrics Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-xs block">الحجم الأصلي</span>
                    <span className="text-sm font-black text-slate-300 font-mono">{formatBytes(result.originalSize)}</span>
                    <span className="text-[10px] text-slate-500 block font-mono">({result.originalWidth}x{result.originalHeight})</span>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-xs block">الحجم المحسن (WebP)</span>
                    <span className="text-sm font-black text-emerald-400 font-mono">{formatBytes(result.compressedSize)}</span>
                    <span className="text-[10px] text-emerald-400/80 block font-mono">({result.compressedWidth}x{result.compressedHeight})</span>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-emerald-500/30 space-y-1">
                    <span className="text-slate-400 text-xs block">توفير المساحة</span>
                    <span className="text-sm font-black text-amber-400 font-mono">-{result.savingsPercent}%</span>
                    <span className="text-[10px] text-slate-400 block font-mono">أسرع للزوار</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={handleDownload}
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>تنزيل صورة WebP المضغوطة</span>
                  </button>

                  <button
                    onClick={handleCopyDataUrl}
                    className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition"
                  >
                    {copiedDataUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedDataUrl ? 'تم النسخ!' : 'نسخ Base64 DataURL'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-72 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center gap-2 text-slate-500 p-4 text-center">
                <ImageIcon className="w-10 h-10 text-slate-700" />
                <span className="text-xs font-bold text-slate-400">قم برفع أو اختيار صورة لبدء الضغط والمعاينة المباشرة</span>
              </div>
            )}
          </div>

          {/* WebP Speed Benefit Card */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-purple-400 font-bold">
              <Gauge className="w-4 h-4" />
              <span>فوائد استخدام WebP في OmniFetch Pro:</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              تضمن صيغة WebP تقليل استهلاك Bnadwidth السيرفر بنسبة تصل إلى 80% مع سرعة استجابة فائقة للغالية في فتح الصور المصغرة بالهواتف المحمولة وتصدر اختبارات الأداء لـ Google Lighthouse.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
