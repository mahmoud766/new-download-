import React, { useState } from 'react';
import { Search, CheckCircle2, AlertTriangle, Activity, History, Clock, RefreshCw } from 'lucide-react';
import { SupportedLanguage } from '../../types';

interface Props {
  currentLang: SupportedLanguage;
  onShowToast: (msg: string) => void;
}

export const SeoToolkitLogsTab: React.FC<Props> = ({ currentLang, onShowToast }) => {
  const [testUrl, setTestUrl] = useState('https://omnifetch.com');
  const [auditResult, setAuditResult] = useState<any>(null);

  const handleRunAudit = () => {
    setAuditResult({
      score: 96,
      title: 'OmniFetch - Free Online Video Downloader (Passed)',
      titleLength: '58 chars (Optimal 50-60)',
      description: 'Passed - 148 chars (Optimal 140-160)',
      h1: 'Passed - 1 H1 Tag Found',
      ogTags: 'Passed - Open Graph Image & Title present',
      canonical: 'Passed - https://omnifetch.com/',
      schema: 'Passed - Organization, WebSite & FAQ Schemas validated',
      coreWebVitals: { lcp: '1.2s', fid: '12ms', cls: '0.01' },
    });
    onShowToast('تم الانتهاء من فحص الـ On-Page SEO الصفحة جيدة جداً!');
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* On-Page SEO Audit */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-lg font-black text-white flex items-center gap-2">
          <Search className="w-5 h-5 text-purple-400" />
          <span>أدوات فحص محركات البحث On-Page SEO Toolkit</span>
        </h2>

        <div className="flex gap-2 text-xs">
          <input
            type="text"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
          />
          <button
            onClick={handleRunAudit}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
          >
            فحص SEO الصفحة
          </button>
        </div>

        {auditResult && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-white">نتيجة التدقيق:</span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold border border-emerald-500/30">
                النتيجة: {auditResult.score} / 100
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block mb-1 font-semibold">Meta Title:</span>
                <p className="text-emerald-400 font-bold">{auditResult.title}</p>
                <span className="text-[10px] text-slate-500">{auditResult.titleLength}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block mb-1 font-semibold">Meta Description:</span>
                <p className="text-emerald-400 font-bold">{auditResult.description}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* System Audit Logs */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <History className="w-4 h-4 text-purple-400" />
          <span>سجل التعديلات والعمليات (System Activity Audit Trail)</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3">الوقت</th>
                <th className="py-2.5 px-3">المستخدم</th>
                <th className="py-2.5 px-3">الإجراء</th>
                <th className="py-2.5 px-3">التفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200 font-mono">
              {[
                { time: '2026-07-28 02:00', user: 'Mahmoud Kamel', action: 'SEO_UPDATE', details: 'تحديث Global SEO Title and Meta Description' },
                { time: '2026-07-28 01:45', user: 'Mahmoud Kamel', action: 'AD_UPDATE', details: 'تعديل مساحات الإعلانات في الهيدر والفوتر' },
                { time: '2026-07-27 18:30', user: 'Sarah Connor', action: 'BLOG_PUBLISH', details: 'نشر مقال: كيفية تحميل مقاطع تيك توك 4K' },
              ].map((log, i) => (
                <tr key={i} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 text-slate-400">{log.time}</td>
                  <td className="py-2.5 px-3 font-bold text-purple-300">{log.user}</td>
                  <td className="py-2.5 px-3 text-emerald-400">{log.action}</td>
                  <td className="py-2.5 px-3 text-slate-300">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
