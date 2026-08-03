import { SupportedLanguage, MediaResult } from '../types';
import { getDownloadHistory, clearDownloadHistory } from '../lib/storage';
import { t } from '../i18n/translations';
import { History, Download, Trash2, X, ExternalLink, Video } from 'lucide-react';

interface HistoryProps {
  currentLang: SupportedLanguage;
  onClose: () => void;
  onSelectResult: (item: MediaResult) => void;
}

export function DownloadHistoryModal({ currentLang, onClose, onSelectResult }: HistoryProps) {
  const history = getDownloadHistory();

  const handleClear = () => {
    clearDownloadHistory();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">{t('recentDownloads', currentLang)}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono font-bold">
              {history.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* History List */}
        {history.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <Video className="w-10 h-10 mx-auto text-slate-700" />
            <p className="text-sm">{t('noHistory', currentLang)}</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {history.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-14 h-10 rounded-xl object-cover flex-shrink-0 border border-slate-800"
                  />
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-bold text-white line-clamp-1">{item.title}</h4>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="font-semibold text-indigo-400">{item.platformName}</span>
                      <span>•</span>
                      <span>{new Date(item.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      onSelectResult(item);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-300 font-bold text-xs border border-indigo-500/30 hover:bg-indigo-600/30 flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {history.length > 0 && (
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={handleClear}
              className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/30 font-bold text-xs hover:bg-rose-500/20 flex items-center gap-1.5 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('clearHistory', currentLang)}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold"
            >
              {t('close', currentLang)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
