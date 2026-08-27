import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Users,
  Eye,
  Download,
  Calendar,
  Loader2,
  RefreshCw,
  Database,
  CheckCircle2,
} from 'lucide-react';
import { fetchDailyVisitorsFromFirestore, DailyVisitorData } from '../../lib/firebase';

interface Props {
  onShowToast?: (msg: string) => void;
}

// Custom Tooltip component for Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 border border-slate-700/80 backdrop-blur-md rounded-xl p-3 shadow-2xl text-xs space-y-1.5 text-slate-100 font-sans">
        <p className="font-black text-purple-300 pb-1 border-b border-slate-800 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-purple-400" />
          <span>التاريخ: {label}</span>
        </p>
        {payload.map((entry: any, index: number) => {
          const nameMap: Record<string, string> = {
            visitors: 'الزوار الفريدون',
            pageViews: 'مشاهدات الصفحات',
            downloads: 'عمليات التحميل',
          };
          return (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 font-medium" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {nameMap[entry.dataKey] || entry.name}:
              </span>
              <span className="font-extrabold font-mono text-white">
                {Number(entry.value).toLocaleString('ar-EG')}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

export const VisitorsTrendChart: React.FC<Props> = ({ onShowToast }) => {
  const [data, setData] = useState<DailyVisitorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMetric, setActiveMetric] = useState<'all' | 'visitors' | 'pageViews' | 'downloads'>('visitors');

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await fetchDailyVisitorsFromFirestore();
      setData(result);
    } catch (err) {
      console.error('Error loading Firestore traffic trends:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute stats
  const totalVisitors = data.reduce((acc, curr) => acc + (curr.visitors || 0), 0);
  const avgVisitors = data.length ? Math.round(totalVisitors / data.length) : 0;
  const peakDay = data.reduce(
    (max, curr) => (curr.visitors > (max?.visitors || 0) ? curr : max),
    data[0] || null
  );

  return (
    <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span>مخطط الزوار وحركة المرور (Visitors Trend Chart)</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-mono border border-emerald-500/30 flex items-center gap-1">
                <Database className="w-3 h-3 text-emerald-400" />
                <span>Firestore Database</span>
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              تحليل اتجاهات الحركة المباشرة يومياً وتوزيع الزيارات باستخدام Recharts.
            </p>
          </div>
        </div>

        {/* Action & Filter Controls */}
        <div className="flex items-center gap-2">
          {/* Metric Selector */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex text-xs font-bold">
            <button
              onClick={() => setActiveMetric('visitors')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeMetric === 'visitors'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              الزوار
            </button>
            <button
              onClick={() => setActiveMetric('pageViews')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeMetric === 'pageViews'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              المشاهدات
            </button>
            <button
              onClick={() => setActiveMetric('downloads')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeMetric === 'downloads'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              التحميلات
            </button>
            <button
              onClick={() => setActiveMetric('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeMetric === 'all'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              الكل
            </button>
          </div>

          <button
            onClick={() => {
              loadData();
              if (onShowToast) onShowToast('تم إعادة جلب بيانات حركة المرور من Firestore!');
            }}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition disabled:opacity-50"
            title="إعادة التحديث من Firestore"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-3 gap-3 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">إجمالي الزوار</span>
            <span className="font-extrabold text-white text-sm">
              {totalVisitors.toLocaleString('ar-EG')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">معدل الزوار اليومي</span>
            <span className="font-extrabold text-blue-300 text-sm">
              {avgVisitors.toLocaleString('ar-EG')} / يوم
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">ذروة الزيارات ({peakDay?.label})</span>
            <span className="font-extrabold text-emerald-400 text-sm">
              {peakDay?.visitors?.toLocaleString('ar-EG') || 0} زائر
            </span>
          </div>
        </div>
      </div>

      {/* Recharts Container */}
      <div className="w-full h-72 sm:h-80 pt-2 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 rounded-xl backdrop-blur-sm z-10 text-purple-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-xs font-bold">جاري تحميل بيانات الزوار من Firestore...</span>
          </div>
        ) : !loading && data.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 rounded-xl backdrop-blur-sm z-10 text-slate-400 gap-2 p-4 text-center">
            <TrendingUp className="w-8 h-8 text-slate-600 mb-1" />
            <p className="text-sm font-bold text-slate-300">لا توجد بيانات كافية بعد</p>
            <p className="text-xs text-slate-500 max-w-sm">
              لم يتم تسجيل حركة زوار في قاعدة بيانات Firestore بعد. سيتم بناء الرسم البياني تلقائياً فور تلقي زيارات حقيقية.
            </p>
          </div>
        ) : null}

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="visitorsGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="pageViewsGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="downloadsGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

            <XAxis
              dataKey="label"
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

            <Tooltip content={<CustomTooltip />} />

            <Legend
              wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
              formatter={(value) => {
                const map: Record<string, string> = {
                  visitors: 'الزوار (Visitors)',
                  pageViews: 'مشاهدات الصفحات (Page Views)',
                  downloads: 'التحميلات (Downloads)',
                };
                return <span className="text-slate-300 font-semibold">{map[value] || value}</span>;
              }}
            />

            {(activeMetric === 'all' || activeMetric === 'visitors') && (
              <Area
                type="monotone"
                dataKey="visitors"
                name="visitors"
                stroke="#a855f7"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#visitorsGlow)"
                activeDot={{ r: 6, stroke: '#c084fc', strokeWidth: 2, fill: '#1e1b4b' }}
              />
            )}

            {(activeMetric === 'all' || activeMetric === 'pageViews') && (
              <Area
                type="monotone"
                dataKey="pageViews"
                name="pageViews"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#pageViewsGlow)"
                activeDot={{ r: 5, stroke: '#60a5fa', strokeWidth: 2, fill: '#172554' }}
              />
            )}

            {(activeMetric === 'all' || activeMetric === 'downloads') && (
              <Area
                type="monotone"
                dataKey="downloads"
                name="downloads"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#downloadsGlow)"
                activeDot={{ r: 5, stroke: '#34d399', strokeWidth: 2, fill: '#064e3b' }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
