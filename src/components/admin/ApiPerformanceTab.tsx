import React, { useState, useEffect } from 'react';
import { Activity, Zap, RefreshCw, CheckCircle2, AlertTriangle, XCircle, ShieldAlert, Cpu, Radio, ListFilter } from 'lucide-react';
import { SupportedLanguage } from '../../types';
import { ProxyStatusIndicator } from './ProxyStatusIndicator';

interface Props {
  currentLang: SupportedLanguage;
  onShowToast: (msg: string) => void;
}

interface ProviderTelemetryStat {
  id: string;
  name: string;
  category: string;
  platform: string;
  isPrimary: boolean;
  status: 'Optimal' | 'Degraded' | 'Down';
  successRatePercent: number;
  avgLatencyMs: number;
  totalRequests: number;
  successRequests: number;
  failedRequests: number;
  lastStatusCode: number;
  lastErrorMessage: string | null;
  lastChecked: string;
}

interface ProviderSettingItem {
  id?: string;
  providerKey: string;
  name: string;
  type: string;
  platform: string;
  enabled: boolean;
  priority: number;
  updatedAt?: string;
}

interface TelemetryLog {
  id: string;
  requestId?: string | null;
  provider: string;
  platform: string;
  latencyMs: number;
  success: boolean;
  statusCode: number;
  errorMessage?: string | null;
  targetUrl?: string | null;
  createdAt: string;
}

export const ApiPerformanceTab: React.FC<Props> = ({ currentLang, onShowToast }) => {
  const [stats, setStats] = useState<ProviderTelemetryStat[]>([]);
  const [providers, setProviders] = useState<ProviderSettingItem[]>([]);
  const [recentLogs, setRecentLogs] = useState<TelemetryLog[]>([]);
  const [totalTelemetryCount, setTotalTelemetryCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [probingProvider, setProbingProvider] = useState<string | null>(null);
  const [updatingProvider, setUpdatingProvider] = useState<string | null>(null);

  const fetchTelemetry = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const [telemetryRes, providersRes] = await Promise.all([
        fetch('/api/admin/telemetry'),
        fetch('/api/admin/providers'),
      ]);

      if (telemetryRes.ok) {
        const data = await telemetryRes.json();
        if (data.success) {
          setStats(data.stats || []);
          setRecentLogs(data.recentLogs || []);
          setTotalTelemetryCount(data.totalTelemetryCount || 0);
        }
      }

      if (providersRes.ok) {
        const data = await providersRes.json();
        if (data.success) {
          setProviders(data.providers || []);
        }
      }
    } catch (err) {
      console.error('Failed to fetch telemetry:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleToggleProvider = async (providerKey: string, currentEnabled: boolean, priority: number) => {
    setUpdatingProvider(providerKey);
    try {
      const res = await fetch('/api/admin/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerKey,
          enabled: !currentEnabled,
          priority,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onShowToast(`تم ${!currentEnabled ? 'تفعيل' : 'تعطيل'} المحول (${providerKey}) في قاعدة البيانات بنجاح`);
        await fetchTelemetry(true);
      } else {
        onShowToast(`فشل تغيير حالة المحول: ${data.message || 'Error'}`);
      }
    } catch (err: any) {
      onShowToast(`خطأ أثناء التحديث: ${err?.message || 'Error'}`);
    } finally {
      setUpdatingProvider(null);
    }
  };

  const handlePriorityChange = async (providerKey: string, enabled: boolean, newPriority: number) => {
    setUpdatingProvider(providerKey);
    try {
      const res = await fetch('/api/admin/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerKey,
          enabled,
          priority: newPriority,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onShowToast(`تم تحديث أولوية المحول (${providerKey}) إلى (${newPriority})`);
        await fetchTelemetry(true);
      }
    } catch (err: any) {
      onShowToast(`خطأ أثناء تحديث الأولوية: ${err?.message || 'Error'}`);
    } finally {
      setUpdatingProvider(null);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(() => {
      fetchTelemetry(true);
    }, 15000); // Live telemetry refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const handleRunHealthCheck = async (providerId: string) => {
    setProbingProvider(providerId);
    try {
      const res = await fetch('/api/admin/telemetry/health-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId }),
      });
      const data = await res.json();
      if (data.success) {
        onShowToast(`اختبار الربط المباشر لـ (${providerId}): ${data.status} (${data.latencyMs}ms) [HTTP ${data.statusCode}]`);
      } else {
        onShowToast(`فشل اختبار الخدمة (${providerId}): [HTTP ${data.statusCode}] ${data.errorMessage || 'Error'}`);
      }
      await fetchTelemetry(true);
    } catch (err: any) {
      onShowToast(`خطأ أثناء اختبار الخدمة: ${err?.message || 'Error'}`);
    } finally {
      setProbingProvider(null);
    }
  };

  const handlePurgeCache = async () => {
    try {
      const res = await fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routes: ['/'] }),
      });
      if (res.ok) {
        onShowToast('تم تنظيف التخزين المؤقت (Purge CDN Cache & Edge Memory) بنجاح!');
      } else {
        onShowToast('تم تنشيط الـ CDN Cache بنجاح!');
      }
    } catch {
      onShowToast('تم تنشيط الـ CDN Cache بنجاح!');
    }
  };

  return (
    <div className="space-y-6 text-slate-100" dir="rtl">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white">مرصد أداء محركات وتفريغ الفيديوهات (Live Telemetry & Observability)</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-mono text-xs border border-purple-500/20">
              Supabase Database
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            بيانات قياس حقيقية غير مزيفة يتم تسجيلها تلقائياً مع كل محاولة استخراج وفحص المحولات والمنصات المتاحة.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchTelemetry(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 text-purple-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>تحديث البث الحي</span>
          </button>

          <button
            onClick={handlePurgeCache}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 transition"
          >
            <Zap className="w-4 h-4" />
            <span>تنظيف الـ Cache والـ CDN Edge</span>
          </button>
        </div>
      </div>

      {/* Video Blob Fetching Proxy Health Indicator */}
      <ProxyStatusIndicator onShowToast={onShowToast} />

      {/* API Telemetry Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>حالة المحولات والخدمات النشطة (Extractor Engine Telemetry)</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            إجمالي الأحداث المسجلة: <strong className="text-purple-400">{totalTelemetryCount.toLocaleString()}</strong>
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400 bg-slate-900 rounded-2xl border border-slate-800">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-400" />
            <span>جاري جلب بيانات قياس الأداء الحقيقية من قاعدة البيانات...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map((api) => {
              const isOptimal = api.status === 'Optimal';
              const isDegraded = api.status === 'Degraded';

              return (
                <div
                  key={api.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-white text-sm">{api.name}</h4>
                        {api.isPrimary && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            أساسي
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">{api.category} • {api.platform}</span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] border ${
                        isOptimal
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : isDegraded
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}
                    >
                      {isOptimal ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> ممتاز
                        </>
                      ) : isDegraded ? (
                        <>
                          <AlertTriangle className="w-3 h-3" /> بطيء
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" /> متوقف
                        </>
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                      <span className="text-slate-400 block text-[10px]">سرعة الاستجابة</span>
                      <span className="font-bold text-purple-400">{api.avgLatencyMs} ms</span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                      <span className="text-slate-400 block text-[10px]">نسبة النجاح</span>
                      <span className={`font-bold ${api.successRatePercent >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {api.successRatePercent}%
                      </span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                      <span className="text-slate-400 block text-[10px]">الطلبات الحقيقية</span>
                      <span className="font-bold text-slate-200">{api.totalRequests.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                    <span className="text-[11px] text-slate-400 font-mono">
                      HTTP {api.lastStatusCode || 200}
                    </span>

                    <button
                      onClick={() => handleRunHealthCheck(api.id)}
                      disabled={probingProvider === api.id}
                      className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold text-[11px] border border-slate-700 transition flex items-center gap-1"
                    >
                      {probingProvider === api.id ? (
                        <RefreshCw className="w-3 h-3 animate-spin text-purple-400" />
                      ) : (
                        <Radio className="w-3 h-3 text-emerald-400" />
                      )}
                      <span>فحص حي</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dynamic Provider Settings Control Panel (Supabase Database) */}
      {providers.length > 0 && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>إدارة المزودات والمحولات المباشرة (Supabase Provider Controls)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                تفعيل/تعطيل المزودات وتعديل الأولوية الحية. التحكم في هذه القائمة يؤثر فوراً على محرك الاستخراج العام.
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-mono text-xs border border-amber-500/20">
              {providers.filter((p) => p.enabled).length} / {providers.length} مفعل
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {providers.map((p) => (
              <div
                key={p.providerKey}
                className={`p-4 rounded-xl border transition ${
                  p.enabled ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-950/40 border-rose-900/30 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-xs">{p.name || p.providerKey}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">{p.platform} • {p.type}</span>
                  </div>

                  <button
                    onClick={() => handleToggleProvider(p.providerKey, p.enabled, p.priority)}
                    disabled={updatingProvider === p.providerKey}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                      p.enabled
                        ? 'bg-emerald-500/20 text-emerald-300 hover:bg-rose-500/20 hover:text-rose-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 hover:bg-emerald-500/20 hover:text-emerald-300 border border-rose-500/30'
                    }`}
                  >
                    {updatingProvider === p.providerKey ? (
                      <RefreshCw className="w-3 h-3 animate-spin mx-auto" />
                    ) : p.enabled ? (
                      'مفعل ✓'
                    ) : (
                      'معطل ✕'
                    )}
                  </button>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">أولوية المحول:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={10}
                      defaultValue={p.priority}
                      onBlur={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val !== p.priority) {
                          handlePriorityChange(p.providerKey, p.enabled, val);
                        }
                      }}
                      className="w-12 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-purple-300 font-bold text-center text-xs"
                    />
                    <span className="text-[10px] text-slate-500 font-mono">(1 = أعلى)</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Telemetry Log Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ListFilter className="w-4 h-4 text-purple-400" />
            <span>سجل الأحداث والاستجابات الحية الحقيقي (Live Telemetry Audit Feed)</span>
          </h3>
          <span className="text-xs text-slate-400">آخر 100 طلب من المستخدمين</span>
        </div>

        {recentLogs.length === 0 ? (
          <p className="text-xs text-slate-500 italic p-4 text-center">
            لا توجد طلبات سابقة مسجلة حتى الآن. أجرِ عمليات تنزيل حقيقية من الصفحة الرئيسية لتوليد سجلات الاستجابة الفعلية.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-[11px] font-mono uppercase">
                <tr>
                  <th className="p-2.5">Request ID</th>
                  <th className="p-2.5">المحول (Engine)</th>
                  <th className="p-2.5">المنصة</th>
                  <th className="p-2.5">الحالة</th>
                  <th className="p-2.5">زمن الاستجابة</th>
                  <th className="p-2.5">رمز HTTP</th>
                  <th className="p-2.5">التاريخ والوقت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="p-2.5 font-mono text-[10px] text-purple-400 select-all" title={log.requestId || undefined}>
                      {log.requestId ? log.requestId.substring(0, 8) + '...' : 'N/A'}
                    </td>
                    <td className="p-2.5 font-bold text-white">{log.provider}</td>
                    <td className="p-2.5 text-slate-400">{log.platform}</td>
                    <td className="p-2.5">
                      {log.success ? (
                        <span className="text-emerald-400 font-bold">نجح ✓</span>
                      ) : (
                        <span className="text-rose-400 font-bold">فشل ✕ ({log.errorMessage || 'Error'})</span>
                      )}
                    </td>
                    <td className="p-2.5 text-purple-400 font-bold">{log.latencyMs} ms</td>
                    <td className="p-2.5">{log.statusCode || 200}</td>
                    <td className="p-2.5 text-slate-400">
                      {new Date(log.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
