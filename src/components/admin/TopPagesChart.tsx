import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { FileText, Loader2, RefreshCw, Eye, Download, Database } from 'lucide-react';
import { fetchTopPagesFromFirestore, TopPageData } from '../../lib/firebase';

interface Props {
  onShowToast?: (msg: string) => void;
}

// Custom Tooltip component for Recharts
const CustomTooltip = ({ active, payload, label, pages }: any) => {
  if (active && payload && payload.length) {
    const item = pages.find((p: any) => p.pagePath === label || p.pageTitle === label);
    return (
      <div className="bg-slate-900/95 border border-slate-700 backdrop-blur-md p-3 rounded-xl shadow-2xl text-xs space-y-1 text-slate-100 font-sans">
        <p className="font-extrabold text-purple-300 pb-1 border-b border-slate-800">
          {item?.pageTitle || label}
        </p>
        <p className="text-[10px] font-mono text-slate-400">{item?.pagePath}</p>
        <div className="pt-1 space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-purple-400 font-semibold">المشاهدات:</span>
            <span className="font-extrabold text-white">
              {payload[0]?.value?.toLocaleString('ar-EG')}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-emerald-400 font-semibold">التحميلات الناجحة:</span>
            <span className="font-extrabold text-white">
              {payload[1]?.value?.toLocaleString('ar-EG')}
            </span>
          </div>
          {item?.avgDuration && (
            <div className="flex justify-between gap-4 pt-1 border-t border-slate-800 text-[11px]">
              <span className="text-slate-400">متوسط مدة البقاء:</span>
              <span className="font-bold text-amber-300">{item.avgDuration}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const TopPagesChart: React.FC<Props> = ({ onShowToast }) => {
  const [pages, setPages] = useState<TopPageData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTopPages = async () => {
    setLoading(true);
    try {
      const data = await fetchTopPagesFromFirestore();
      setPages(data);
    } catch (err) {
      console.error('Error loading top pages analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopPages();
  }, []);

  return (
    <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span>الصفحات الأكثر أداءً والتحميلات (Top Performing Pages)</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-mono border border-emerald-500/30 flex items-center gap-1">
                <Database className="w-3 h-3" />
                <span>Firestore</span>
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              مقارنة بين عدد مشاهدات الصفحات وعمليات التحميل المحققة لكل أداة تنزيل.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            loadTopPages();
            onShowToast?.('تم تحديث قائمة الصفحات الأفضل أداءً من Firestore!');
          }}
          disabled={loading}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition self-start sm:self-auto"
          title="تحديث البيانات"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* BarChart Container */}
      <div className="w-full h-72 pt-2 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 rounded-xl backdrop-blur-sm z-10 text-purple-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-xs font-bold">جاري تحميل تحليلات الصفحات من Firestore...</span>
          </div>
        ) : null}

        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={pages} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="pagePath"
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
            />
            <Tooltip content={<CustomTooltip pages={pages} />} />
            <Legend
              wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
              formatter={(value) => {
                const labels: Record<string, string> = {
                  views: 'المشاهدات (Pageviews)',
                  downloads: 'التحميلات (Downloads)',
                };
                return <span className="text-slate-300 font-semibold">{labels[value] || value}</span>;
              }}
            />
            <Bar dataKey="views" name="views" fill="#a855f7" radius={[6, 6, 0, 0]} barSize={24} />
            <Bar dataKey="downloads" name="downloads" fill="#10b981" radius={[6, 6, 0, 0]} barSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
