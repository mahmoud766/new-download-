import React, { useState, useEffect } from 'react';
import {
  Download,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  ExternalLink,
  Zap,
  Globe,
  Clock,
  CheckCircle2,
  HardDrive,
  Copy,
  Check,
  Video,
} from 'lucide-react';
import { SupportedLanguage } from '../../types';

interface LogItem {
  id: string;
  url: string;
  title: string;
  platform: string;
  thumbnail?: string;
  quality?: string;
  ipAddress?: string;
  downloadCount: number;
  createdAt: string;
}

interface Props {
  currentLang: SupportedLanguage;
  onShowToast: (msg: string) => void;
}

export const DownloadLogsTab: React.FC<Props> = ({ currentLang, onShowToast }) => {
  const isRtl = currentLang === 'ar';
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/download-logs');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.logs)) {
          setLogs(data.logs);
        }
      }
    } catch (err) {
      console.error('Error fetching download logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleCopyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    onShowToast(isRtl ? 'تم نسخ الرابط الحافظة!' : 'URL copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearLogs = async () => {
    if (!window.confirm(isRtl ? 'هل أنت تأكد من مسح جميع سجلات التنزيلات من قاعدة البيانات؟' : 'Are you sure you want to clear all download logs?')) {
      return;
    }
    try {
      const res = await fetch('/api/download-logs', { method: 'DELETE' });
      if (res.ok) {
        setLogs([]);
        onShowToast(isRtl ? 'تم تفريغ جميع سجلات التنزيلات من قاعدة البيانات بنجاح!' : 'All download logs cleared successfully!');
      }
    } catch (e) {
      onShowToast(isRtl ? 'حدث خطأ أثناء مسح السجلات' : 'Failed to clear logs');
    }
  };

  // Filter logs based on search & platform
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.platform.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform = selectedPlatform === 'all' || log.platform.toLowerCase() === selectedPlatform.toLowerCase();
    return matchesSearch && matchesPlatform;
  });

  // Calculate top stats
  const totalDownloads = logs.reduce((acc, curr) => acc + (curr.downloadCount || 1), 0);
  const totalUniqueLinks = logs.length;
  const platformCounts: Record<string, number> = {};
  logs.forEach((log) => {
    const p = log.platform || 'General';
    platformCounts[p] = (platformCounts[p] || 0) + (log.downloadCount || 1);
  });

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-purple-400" />
            <span>{isRtl ? 'سجل التنزيلات والتحميلات المباشرة (MySQL Database)' : 'Live Download Logs & Analytics'}</span>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isRtl
              ? 'متابعة لحظية وتزامن مباشر مع قاعدة بيانات MySQL لكل عمليات استخراج وتحميل الفيديو.'
              : 'Real-time synchronization with MySQL database for all video extractions.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{isRtl ? 'تحديث السجلات' : 'Refresh Logs'}</span>
          </button>

          {logs.length > 0 && (
            <button
              onClick={handleClearLogs}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>{isRtl ? 'تفريغ السجل' : 'Clear Logs'}</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/30">
          <span className="text-xs text-purple-400 font-bold uppercase tracking-wider">{isRtl ? 'إجمالي التحميلات' : 'Total Download Count'}</span>
          <div className="text-2xl font-black text-white mt-1">{totalDownloads.toLocaleString()}</div>
          <p className="text-[11px] text-purple-300/80 mt-1 flex items-center gap-1">
            <Zap className="w-3 h-3 text-purple-400" />
            <span>{isRtl ? 'مسجلة في قاعدة البيانات المباشرة' : 'Tracked in PostgreSQL'}</span>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{isRtl ? 'عناوين الفيديو الفريدة' : 'Unique Videos Saved'}</span>
          <div className="text-2xl font-black text-white mt-1">{totalUniqueLinks.toLocaleString()}</div>
          <p className="text-[11px] text-slate-400 mt-1">{isRtl ? 'مستخرجة عبر المنصات' : 'Across all supported platforms'}</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider">{isRtl ? 'المنصة الأكثر استخراجاً' : 'Top Platform'}</span>
          <div className="text-xl font-black text-white mt-1 capitalize">
            {Object.keys(platformCounts).sort((a, b) => platformCounts[b] - platformCounts[a])[0] || 'TikTok'}
          </div>
          <p className="text-[11px] text-indigo-300 mt-1">{isRtl ? 'أعلى منصة في التحميلات' : 'Highest volume extracted'}</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">{isRtl ? 'حالة قاعدة البيانات' : 'Database Status'}</span>
          <div className="text-xl font-black text-emerald-400 mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Connected</span>
          </div>
          <p className="text-[11px] text-emerald-300/80 mt-1">{isRtl ? 'قاعدة بيانات متزامنة (Prisma ORM)' : 'Prisma MySQL Connection'}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRtl ? 'بحث في العنوان، الرابط أو المنصة...' : 'Search by title, URL or platform...'}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['all', 'tiktok', 'youtube', 'facebook', 'instagram', 'twitter', 'reddit'].map((plat) => (
            <button
              key={plat}
              onClick={() => setSelectedPlatform(plat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all shrink-0 ${
                selectedPlatform === plat
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {plat === 'all' ? (isRtl ? 'الكل' : 'All') : plat}
            </button>
          ))}
        </div>
      </div>

      {/* Table of Download Logs */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">{isRtl ? 'الفيديو والمنصة' : 'Video & Platform'}</th>
                <th className="py-3.5 px-4">{isRtl ? 'رابط الفيديو' : 'Original URL'}</th>
                <th className="py-3.5 px-4">{isRtl ? 'الجودة/الصيغة' : 'Quality'}</th>
                <th className="py-3.5 px-4">{isRtl ? 'عدد مرات التنزيل' : 'Download Count'}</th>
                <th className="py-3.5 px-4">{isRtl ? 'التاريخ والوقت' : 'Timestamp'}</th>
                <th className="py-3.5 px-4 text-right">{isRtl ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium text-slate-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    {loading ? (
                      <div className="flex items-center justify-center gap-2 text-purple-400">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{isRtl ? 'جاري تحميل سجلات التنزيلات من PostgreSQL...' : 'Loading logs from PostgreSQL...'}</span>
                      </div>
                    ) : (
                      <span>{isRtl ? 'لا توجد سجلات تنزيل تطابق البحث' : 'No download logs found in database'}</span>
                    )}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3 min-w-[200px]">
                        {item.thumbnail ? (
                          <img src={item.thumbnail} alt="" className="w-10 h-10 object-cover rounded-lg border border-slate-800 bg-slate-950 shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 text-purple-400">
                            <Video className="w-5 h-5" />
                          </div>
                        )}
                        <div className="truncate max-w-xs">
                          <p className="font-bold text-white text-xs truncate" title={item.title}>
                            {item.title}
                          </p>
                          <span className="inline-block px-2 py-0.5 mt-1 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[10px] font-bold capitalize">
                            {item.platform}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 max-w-xs truncate">
                      <span className="font-mono text-slate-400 text-[11px] truncate block" title={item.url}>
                        {item.url}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px] font-bold">
                        {item.quality || 'HD No Watermark'}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-white text-xs">
                      <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700">
                        {item.downloadCount} {isRtl ? 'تنزيل' : 'downloads'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(item.createdAt).toLocaleString(isRtl ? 'ar-EG' : 'en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleCopyUrl(item.id, item.url)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        title={isRtl ? 'نسخ الرابط' : 'Copy URL'}
                      >
                        {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
