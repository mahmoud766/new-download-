import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { Layers, Loader2, RefreshCw, Database } from 'lucide-react';
import { fetchPlatformTrafficFromFirestore, PlatformTrafficData } from '../../lib/firebase';

interface Props {
  onShowToast?: (msg: string) => void;
}

// Custom Tooltip component for Recharts
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item: PlatformTrafficData = payload[0].payload;
    return (
      <div className="bg-slate-900/95 border border-slate-700 backdrop-blur-md p-3 rounded-xl shadow-2xl text-xs space-y-1 text-slate-100 font-sans">
        <p className="font-black text-white pb-1 border-b border-slate-800 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
          <span>منصة {item.platform}</span>
        </p>
        <div className="pt-1 space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-slate-400 font-semibold">نسبة الحصة:</span>
            <span className="font-extrabold text-purple-300">{item.share}%</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400 font-semibold">إجمالي التنزيلات:</span>
            <span className="font-extrabold text-emerald-400">
              {item.downloads.toLocaleString('ar-EG')}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const PlatformTrafficChart: React.FC<Props> = ({ onShowToast }) => {
  const [traffic, setTraffic] = useState<PlatformTrafficData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTrafficData = async () => {
    setLoading(true);
    try {
      const data = await fetchPlatformTrafficFromFirestore();
      setTraffic(data);
    } catch (err) {
      console.error('Error loading platform traffic:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrafficData();
  }, []);

  return (
    <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-pink-600/20 text-pink-400 border border-pink-500/30">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span>توزيع الحركة حسب المنصة (Platform Traffic Statistics)</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-mono border border-emerald-500/30 flex items-center gap-1">
                <Database className="w-3 h-3" />
                <span>Firestore</span>
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              نسب استخدام منصات التواصل الاجتماعي ومعدل التحميل المنجز.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            loadTrafficData();
            onShowToast?.('تم تحديث إحصائيات المنصات من Firestore!');
          }}
          disabled={loading}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          title="تحديث البيانات"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* PieChart Container */}
      <div className="w-full h-64 relative flex items-center justify-center">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 rounded-xl backdrop-blur-sm z-10 text-pink-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-xs font-bold">جاري تحميل إحصائيات المنصات من Firestore...</span>
          </div>
        ) : null}

        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={traffic}
              dataKey="share"
              nameKey="platform"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={4}
              label={(entry: any) => `${entry.platform || entry.name}: ${entry.share || entry.value}%`}
            >
              {traffic.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) => <span className="text-slate-300 font-semibold text-xs">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
