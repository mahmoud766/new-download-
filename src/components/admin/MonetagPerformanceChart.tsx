import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Eye,
  MousePointerClick,
  Percent,
  DollarSign,
  Zap,
  TrendingUp,
  RefreshCw,
  Sparkles,
  Layers,
  Activity,
  ShieldCheck,
  ExternalLink,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { SupportedLanguage } from '../../types';
import { triggerMonetagDownloadAction, runMonetagDiagnostics } from '../../lib/monetag';

interface MonetagSummary {
  zoneId: string;
  status: string;
  impressions: number;
  clicks: number;
  ctr: number;
  estimatedEarnings: number;
  averageCpm: number;
  range: string;
}

interface DailyTrendItem {
  date: string;
  label: string;
  impressions: number;
  clicks: number;
  ctr: number;
  estimatedEarnings: number;
}

interface SlotPerformanceItem {
  slotId: string;
  name: string;
  format: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

interface FormatPerformanceItem {
  format: string;
  label: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

interface RecentEventItem {
  id: string;
  timestamp: string;
  eventType: 'IMPRESSION' | 'CLICK';
  provider: string;
  slotId: string;
  format: string;
  zoneId: string;
  pagePath: string;
}

interface Props {
  currentLang?: SupportedLanguage;
  onShowToast?: (msg: string) => void;
  onNavigateToAds?: () => void;
}

export const MonetagPerformanceChart: React.FC<Props> = ({
  currentLang = 'ar',
  onShowToast,
  onNavigateToAds,
}) => {
  const isRtl = currentLang === 'ar';
  const [range, setRange] = useState<'today' | '7d' | '30d' | 'all'>('7d');
  const [loading, setLoading] = useState<boolean>(false);
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [isTesting, setIsTesting] = useState<boolean>(false);

  const [summary, setSummary] = useState<MonetagSummary>({
    zoneId: '295812',
    status: 'ACTIVE',
    impressions: 0,
    clicks: 0,
    ctr: 0,
    estimatedEarnings: 0,
    averageCpm: 2.1,
    range: '7d',
  });

  const [dailyTrend, setDailyTrend] = useState<DailyTrendItem[]>([]);
  const [slotPerformance, setSlotPerformance] = useState<SlotPerformanceItem[]>([]);
  const [formatPerformance, setFormatPerformance] = useState<FormatPerformanceItem[]>([]);
  const [recentEvents, setRecentEvents] = useState<RecentEventItem[]>([]);

  const fetchMonetagData = async (selectedRange = range) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/monetag?range=${selectedRange}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSummary(data.summary || {});
          setDailyTrend(data.dailyTrend || []);
          setSlotPerformance(data.slotPerformance || []);
          setFormatPerformance(data.formatPerformance || []);
          setRecentEvents(data.recentEvents || []);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch Monetag analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonetagData(range);
    const timer = setInterval(() => fetchMonetagData(range), 15000);
    return () => clearInterval(timer);
  }, [range]);

  const handleTestClick = async () => {
    setIsTesting(true);
    try {
      const success = triggerMonetagDownloadAction('295812');
      if (success) {
        onShowToast?.(
          isRtl
            ? 'تم تشغيل حدث تفاعل Monetag وتسجيله في لوحة التحليلات بنجاح! 🎯'
            : 'Monetag interaction event triggered and recorded in analytics! 🎯'
        );
        setTimeout(() => fetchMonetagData(range), 800);
      } else {
        onShowToast?.(
          isRtl
            ? 'تم تسجيل الحدث (فترة التهدئة التلقائية 60 ثانية نشطة للمستخدم)'
            : 'Event recorded (60s user cooldown active)'
        );
      }
    } finally {
      setIsTesting(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 border border-slate-700/80 backdrop-blur-md rounded-xl p-3 shadow-2xl text-xs space-y-2 text-slate-100 font-sans z-50">
          <p className="font-black text-amber-300 pb-1 border-b border-slate-800 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{isRtl ? `التاريخ: ${label}` : `Date: ${label}`}</span>
          </p>
          {payload.map((entry: any, index: number) => {
            const labelMap: Record<string, string> = {
              impressions: isRtl ? 'مرات الظهور (Impressions)' : 'Impressions',
              clicks: isRtl ? 'النقرات والتفاعلات (Clicks)' : 'Clicks',
              estimatedEarnings: isRtl ? 'العائد التقديري ($)' : 'Est. Earnings ($)',
            };
            return (
              <div key={`item-${index}`} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 font-medium" style={{ color: entry.color }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  {labelMap[entry.dataKey] || entry.name}:
                </span>
                <span className="font-extrabold font-mono text-white">
                  {entry.dataKey === 'estimatedEarnings'
                    ? `$${Number(entry.value).toFixed(2)}`
                    : Number(entry.value).toLocaleString('ar-EG')}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 p-5 rounded-2xl border border-amber-500/30 shadow-xl space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white">
                {isRtl ? 'تحليلات أداء إعلانات Monetag الشاملة' : 'Monetag Ad Performance & Analytics'}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                Zone 295812 ⚡
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {isRtl
                ? 'تتبع مرات الظهور المباشرة، النقرات، معدل النقر CTR، والعائد التقديري لـ Monetag MultiTag'
                : 'Real-time telemetry tracking impressions, clicks, CTR, and estimated earnings'}
            </p>
          </div>
        </div>

        {/* Range and Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Range Selector */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex text-xs font-semibold">
            {(['today', '7d', '30d', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  range === r
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {r === 'today'
                  ? isRtl ? 'اليوم' : 'Today'
                  : r === '7d'
                  ? isRtl ? '7 أيام' : '7 Days'
                  : r === '30d'
                  ? isRtl ? '30 يوم' : '30 Days'
                  : isRtl ? 'الكل' : 'All'}
              </button>
            ))}
          </div>

          {/* Test Trigger Button */}
          <button
            onClick={handleTestClick}
            disabled={isTesting}
            className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1.5"
            title="تجربة تفاعل Monetag وملاحظة الزيادة المباشرة في العداد"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isRtl ? 'تجربة نقرة تجريبية' : 'Test Ad Click'}</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => {
              fetchMonetagData(range);
              onShowToast?.(isRtl ? 'تم تحديث بيانات Monetag المباشرة!' : 'Monetag data refreshed!');
            }}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 Main Monetag KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Impressions */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              <span>{isRtl ? 'مرات الظهور (Impressions)' : 'Total Impressions'}</span>
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300 font-mono">
              Live
            </span>
          </div>
          <div className="text-2xl font-black text-white">
            {summary.impressions.toLocaleString('ar-EG')}
          </div>
          <p className="text-[11px] text-blue-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{isRtl ? 'عرض نشط عبر AdSlot والـ MultiTag' : 'Active across AdSlot & MultiTag'}</span>
          </p>
        </div>

        {/* Clicks */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <MousePointerClick className="w-3.5 h-3.5 text-amber-400" />
              <span>{isRtl ? 'النقرات والتفاعلات (Clicks)' : 'Ad Clicks & CTAs'}</span>
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-mono">
              Interactions
            </span>
          </div>
          <div className="text-2xl font-black text-white">
            {summary.clicks.toLocaleString('ar-EG')}
          </div>
          <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isRtl ? 'تفاعل المستخدمين مع إعلانات Monetag' : 'Direct user engagement'}</span>
          </p>
        </div>

        {/* CTR */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isRtl ? 'معدل النقر (CTR)' : 'Click-Through Rate'}</span>
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
              Performance
            </span>
          </div>
          <div className="text-2xl font-black text-white">
            {summary.ctr.toFixed(2)}%
          </div>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isRtl ? 'أداء ممتاز لموقع تحميل الفيديوهات' : 'Healthy conversion rate'}</span>
          </p>
        </div>

        {/* Est. Revenue */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-950/30 to-slate-950 border border-amber-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              <span>{isRtl ? 'العائد التقديري (Est. Earnings)' : 'Est. Monetag Revenue'}</span>
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-mono">
              CPM ~$2.10
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            ${summary.estimatedEarnings.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {isRtl ? 'حساب تقديري مستند على معايير Monetag' : 'Calculated via CPM + CPC benchmarks'}
          </p>
        </div>
      </div>

      {/* Recharts Trend Chart for Monetag */}
      <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            <span>{isRtl ? 'المنحنى الزمني للظهور والنقر (Daily Performance Trend)' : 'Daily Monetag Performance'}</span>
          </h4>
          <div className="flex items-center gap-1 text-[11px] bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setChartType('area')}
              className={`px-2 py-0.5 rounded ${chartType === 'area' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'}`}
            >
              {isRtl ? 'منحنى' : 'Area'}
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-2 py-0.5 rounded ${chartType === 'bar' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'}`}
            >
              {isRtl ? 'أعمدة' : 'Bar'}
            </button>
          </div>
        </div>

        <div className="h-64 w-full">
          {dailyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart data={dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="monetagImps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="monetagClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                    formatter={(value) =>
                      value === 'impressions'
                        ? isRtl ? 'مرات الظهور' : 'Impressions'
                        : isRtl ? 'النقرات' : 'Clicks'
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="impressions"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#monetagImps)"
                  />
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#monetagClicks)"
                  />
                </AreaChart>
              ) : (
                <BarChart data={dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                    formatter={(value) =>
                      value === 'impressions'
                        ? isRtl ? 'مرات الظهور' : 'Impressions'
                        : isRtl ? 'النقرات' : 'Clicks'
                    }
                  />
                  <Bar dataKey="impressions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="clicks" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
              {isRtl ? 'جاري استقبال بيانات التتبع المباشر لـ Monetag...' : 'Collecting live Monetag telemetry...'}
            </div>
          )}
        </div>
      </div>

      {/* Slot Performance Table & Format Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Slot Breakdown */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>{isRtl ? 'أداء أماكن توزيع إعلانات Monetag (By Placement)' : 'Placement Breakdown'}</span>
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="py-2 px-2 font-semibold">{isRtl ? 'المكان' : 'Placement'}</th>
                  <th className="py-2 px-2 font-semibold text-center">{isRtl ? 'الظهور' : 'Impr.'}</th>
                  <th className="py-2 px-2 font-semibold text-center">{isRtl ? 'النقرات' : 'Clicks'}</th>
                  <th className="py-2 px-2 font-semibold text-left">{isRtl ? 'CTR %' : 'CTR %'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {slotPerformance.map((slot) => (
                  <tr key={slot.slotId} className="hover:bg-slate-900/40">
                    <td className="py-2 px-2">
                      <div className="font-semibold text-white">{slot.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{slot.slotId}</div>
                    </td>
                    <td className="py-2 px-2 text-center font-mono text-blue-300">
                      {slot.impressions.toLocaleString('ar-EG')}
                    </td>
                    <td className="py-2 px-2 text-center font-mono text-amber-300">
                      {slot.clicks.toLocaleString('ar-EG')}
                    </td>
                    <td className="py-2 px-2 text-left font-mono font-bold text-emerald-400">
                      {slot.ctr.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Format Breakdown */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{isRtl ? 'توزيع الأنماط الإعلانية لـ Monetag (By Format)' : 'Ad Formats Breakdown'}</span>
          </h4>
          <div className="space-y-3">
            {formatPerformance.map((f) => {
              const totalActive = summary.impressions + summary.clicks;
              const percent = totalActive > 0 ? Math.round(((f.impressions + f.clicks) / totalActive) * 100) : 20;
              return (
                <div key={f.format} className="space-y-1 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-200">{f.label}</span>
                    <span className="text-slate-400 font-mono">
                      {f.impressions} {isRtl ? 'ظهور' : 'impr'} • {f.clicks} {isRtl ? 'نقرة' : 'click'}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, percent)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live Recent Events Feed */}
      <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <span>{isRtl ? 'سجل النشاط اللحظي لأحداث Monetag (Live Telemetry Stream)' : 'Live Telemetry Stream'}</span>
          </h4>
          <span className="text-[10px] text-slate-500 font-mono">
            {isRtl ? 'آخر 25 تفاعل مسجل' : 'Last 25 recorded events'}
          </span>
        </div>

        <div className="overflow-x-auto max-h-48 overflow-y-auto">
          {recentEvents.length > 0 ? (
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px]">
                  <th className="py-1.5 px-2 font-semibold">{isRtl ? 'الوقت' : 'Time'}</th>
                  <th className="py-1.5 px-2 font-semibold text-center">{isRtl ? 'النوع' : 'Event'}</th>
                  <th className="py-1.5 px-2 font-semibold">{isRtl ? 'المكان' : 'Slot'}</th>
                  <th className="py-1.5 px-2 font-semibold text-left">{isRtl ? 'الصفحة' : 'Path'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-300 font-mono text-[11px]">
                {recentEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-900/30">
                    <td className="py-1.5 px-2 text-slate-500 text-[10px]">
                      {new Date(evt.timestamp).toLocaleTimeString('ar-EG')}
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          evt.eventType === 'CLICK'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {evt.eventType === 'CLICK'
                          ? isRtl ? 'نقرة 🎯' : 'CLICK'
                          : isRtl ? 'ظهور 👁️' : 'IMPRESSION'}
                      </span>
                    </td>
                    <td className="py-1.5 px-2 text-slate-300 truncate max-w-[150px]">
                      {evt.slotId}
                    </td>
                    <td className="py-1.5 px-2 text-left text-slate-400 truncate max-w-[120px]">
                      {evt.pagePath}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-6 text-center text-slate-500 text-xs">
              {isRtl
                ? 'لا توجد أحداث جديدة في السجل بعد. قم بزيارة الموقع أو النقر لتسجيل الأحداث المباشرة.'
                : 'No recent events yet. Browse the site or click ads to populate real-time telemetry.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
