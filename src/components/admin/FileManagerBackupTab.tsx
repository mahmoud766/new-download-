import React, { useState } from 'react';
import { HardDrive, Upload, Trash2, FolderPlus, Download, Database, CheckCircle2, FileText, Search } from 'lucide-react';
import { SupportedLanguage } from '../../types';

interface Props {
  currentLang: SupportedLanguage;
  onShowToast: (msg: string) => void;
}

export const FileManagerBackupTab: React.FC<Props> = ({ currentLang, onShowToast }) => {
  const [activeSubTab, setActiveSubTab] = useState<'files' | 'backups'>('files');
  const [files, setFiles] = useState([
    { name: 'logo.png', size: '124 KB', mime: 'image/png', date: '2026-07-20' },
    { name: 'favicon.ico', size: '32 KB', mime: 'image/x-icon', date: '2026-07-20' },
    { name: 'sitemap.xml', size: '18 KB', mime: 'text/xml', date: '2026-07-28' },
    { name: 'robots.txt', size: '2 KB', mime: 'text/plain', date: '2026-07-28' },
  ]);

  const handleUploadFile = () => {
    onShowToast('تم رفع الملف وحفظه بنجاح!');
  };

  const handleDeleteFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
    onShowToast('تم حذف الملف.');
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Subtab Navigation */}
      <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-2xl border border-slate-800 text-xs font-bold">
        {[
          { id: 'files', label: 'مدير الملفات (File Manager)', icon: HardDrive },
          { id: 'backups', label: 'إدارة النسخ الاحتياطية (Backups)', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
                activeSubTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeSubTab === 'files' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-base font-black text-white">مدير الملفات والشعارات (File Manager)</h3>
              <p className="text-xs text-slate-400">استعراض، رفع، ضغط وحذف الصور والملفات الخاصة بالموقع.</p>
            </div>
            <button
              onClick={handleUploadFile}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30"
            >
              <Upload className="w-4 h-4" />
              <span>رفع ملف جديد</span>
            </button>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950 text-slate-400">
                  <th className="py-3 px-4">اسم الملف</th>
                  <th className="py-3 px-4">الحجم</th>
                  <th className="py-3 px-4">النوع</th>
                  <th className="py-3 px-4">تاريخ الرفع</th>
                  <th className="py-3 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200 font-mono">
                {files.map((file) => (
                  <tr key={file.name} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 text-purple-300 font-bold">{file.name}</td>
                    <td className="py-3 px-4">{file.size}</td>
                    <td className="py-3 px-4 text-slate-400">{file.mime}</td>
                    <td className="py-3 px-4 text-slate-400">{file.date}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDeleteFile(file.name)}
                        className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:bg-slate-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'backups' && (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-base font-black text-white">النسخ الاحتياطي التلقائي واليدوي</h3>
          <p className="text-xs text-slate-400">حفظ وحماية كافة الإعدادات والمقالات وقواعد بيانات التحميل.</p>
          <button
            onClick={() => onShowToast('تم تنزيل النسخة الاحتياطية بصيغة JSON/SQL!')}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>تنزيل النسخة الاحتياطية</span>
          </button>
        </div>
      )}
    </div>
  );
};
