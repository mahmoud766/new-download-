import React, { useState } from 'react';
import { Activity, Zap, RefreshCw, CheckCircle2, ShieldAlert, Cpu, HardDrive } from 'lucide-react';
import { ApiHealthStatus, SupportedLanguage } from '../../types';
import { getApiHealthList, saveApiHealthList } from '../../lib/adminStorage';
import { ProxyStatusIndicator } from './ProxyStatusIndicator';

interface Props {
  currentLang: SupportedLanguage;
  onShowToast: (msg: string) => void;
}

export const ApiPerformanceTab: React.FC<Props> = ({ currentLang, onShowToast }) => {
  const [apiList, setApiList] = useState<ApiHealthStatus[]>(getApiHealthList());

  const handleToggleFailover = (id: string) => {
    const updated = apiList.map((a) => (a.id === id ? { ...a, autoFailover: !a.autoFailover } : a));
    setApiList(updated);
    saveApiHealthList(updated);
    onShowToast('تم تحديث وضع التبديل التلقائي (Auto Failover)');
  };

  const handlePurgeCache = () => {
    onShowToast('تم تنظيف التخزين المؤقت (Purge CDN Cache & Edge Memory) بنجاح!');
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white">إدارة الـ APIs والأداء والتخزين المؤقت (APIs & CDN Performance)</h2>
          <p className="text-xs text-slate-400">
            مراقبة صحة المحولات، سرعة الاستجابة، التبديل التلقائي عند الأعطال وتنظيف الـ Cache بنقرة واحدة.
          </p>
        </div>
        <button
          onClick={handlePurgeCache}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30"
        >
          <Zap className="w-4 h-4" />
          <span>تنظيف الـ Cache وإعادة بناء الأداء</span>
        </button>
      </div>

      {/* Video Blob Fetching Proxy Health Indicator */}
      <ProxyStatusIndicator onShowToast={onShowToast} />

      {/* API Health Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>حالة واستجابة واجهات الـ APIs الخارجية</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {apiList.map((api) => (
            <div
              key={api.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-white text-sm">{api.name}</h4>
                  <span className="text-[11px] text-slate-400 font-mono">{api.type}</span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-[10px] border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" /> {api.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px]">الزمن الاستجابة</span>
                  <span className="font-bold text-purple-400">{api.latencyMs} ms</span>
                </div>
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px]">معدل الخطأ</span>
                  <span className="font-bold text-emerald-400">{api.errorRatePercent}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <span className="text-slate-400">الطلبات اليومية: <strong className="text-white">{api.dailyRequests.toLocaleString()}</strong></span>
                <button
                  onClick={() => handleToggleFailover(api.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                    api.autoFailover
                      ? 'bg-purple-600/20 text-purple-300 border-purple-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  Failover: {api.autoFailover ? 'مفعل' : 'معطل'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
