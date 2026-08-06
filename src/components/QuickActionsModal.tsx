import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ShieldAlert,
  Settings,
  Layers,
  FileText,
  Palette,
  Shield,
  Sparkles,
  DollarSign,
  BookOpen,
  HelpCircle,
  BarChart3,
  Moon,
  Sun,
  Music,
  Droplet,
  Trash2,
  Download,
  Copy,
  Command,
  X,
  Zap,
  CheckCircle2,
  ChevronRight,
  Globe,
  Sliders,
  Wrench,
  Activity,
  Code,
  Terminal,
  Bug,
} from 'lucide-react';
import { SiteSettings } from '../types';
import { saveSiteSettings, clearDownloadHistory } from '../lib/storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdminTab: (tab: string) => void;
  onToggleTheme: () => void;
  onShowToast: (msg: string) => void;
  siteSettings: SiteSettings;
  theme: 'dark' | 'light';
}

interface ActionItem {
  id: string;
  category: 'maintenance' | 'admin_jump' | 'quick_tools';
  title: string;
  subtitle: string;
  icon: any;
  iconColor: string;
  badge?: string;
  badgeBg?: string;
  shortcut?: string;
  action: () => void;
}

export const QuickActionsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onOpenAdminTab,
  onToggleTheme,
  onShowToast,
  siteSettings,
  theme,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const handleToggleMaintenance = () => {
    const nextState = !siteSettings.maintenanceMode;
    saveSiteSettings({ maintenanceMode: nextState });
    onShowToast(
      nextState
        ? 'تم تفعيل وضع الصيانة العام بنجاح! 🚨 تم تجميد التنزيلات للزوار وتخصيص شريط تنبيه ملون.'
        : 'تم إيقاف وضع الصيانة العام بنجاح! 🟢 عادت خدمة التنزيل للعمل بكامل طاقتها.'
    );
  };

  const handleToggleMp3 = () => {
    const nextState = !siteSettings.allowMp3Conversion;
    saveSiteSettings({ allowMp3Conversion: nextState });
    onShowToast(
      nextState
        ? 'تم تفعيل خدمة استخراج وتحويل MP3 المباشر!'
        : 'تم تعطيل خيار استخراج MP3 الصوت.'
    );
  };

  const handleToggleWatermarkFree = () => {
    const nextState = !siteSettings.watermarkFreeByDefault;
    saveSiteSettings({ watermarkFreeByDefault: nextState });
    onShowToast(
      nextState
        ? 'تم تفعيل نمط التحميل بدون علامة مائية افتراضياً!'
        : 'تم تعطيل النمط الافتراضي للعلامة المائية.'
    );
  };

  const handleClearCache = () => {
    if (window.confirm('هل أنت تأكد من مسح الذاكرة المؤقتة وسجل التنزيل المحلي؟')) {
      clearDownloadHistory();
      onShowToast('تم مسح الذاكرة المؤقتة وسجل التنزيل بنجاح!');
      onClose();
    }
  };

  const handleExportBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(siteSettings, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `omnifetch-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onShowToast('تم تصدير النسخة الاحتياطية للإعدادات بنجاح! 📥');
  };

  const handleCopyDiagnostics = () => {
    const diag = `[OmniFetch Diagnostics Report]
Date: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}
Maintenance Mode: ${siteSettings.maintenanceMode ? 'ACTIVE' : 'INACTIVE'}
Site Name: ${siteSettings.siteName}
Theme: ${theme}
Language: ${document.documentElement.lang}
Screen: ${window.innerWidth}x${window.innerHeight}`;

    navigator.clipboard.writeText(diag);
    onShowToast('تم نسخ تقرير تشخيصات النظام الفنية للحافظة بنجاح! 📋');
  };

  // Build the rich actions list
  const actions: ActionItem[] = [
    {
      id: 'toggle_theme',
      category: 'quick_tools',
      title: theme === 'dark' ? 'التحويل للثيم الفاتح (Light Mode)' : 'التحويل للثيم الداكن (Dark Mode)',
      subtitle: 'تغيير نمط وألوان العرض الفورية للموقع',
      icon: theme === 'dark' ? Sun : Moon,
      iconColor: 'text-amber-300',
      action: () => {
        onToggleTheme();
        onClose();
      },
    },
    {
      id: 'toggle_mp3',
      category: 'quick_tools',
      title: siteSettings.allowMp3Conversion ? 'تعطيل تحويل MP3 الصوتي' : 'تفعيل تحويل MP3 الصوتي',
      subtitle: 'السماح للزوار باستخراج مقاطع الصوت بشكل مباشر',
      icon: Music,
      iconColor: 'text-purple-400',
      badge: siteSettings.allowMp3Conversion ? 'مفعل 🎵' : 'معطل 🔇',
      badgeBg: siteSettings.allowMp3Conversion ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-slate-800 text-slate-500',
      action: () => {
        handleToggleMp3();
      },
    },
    {
      id: 'toggle_watermark',
      category: 'quick_tools',
      title: siteSettings.watermarkFreeByDefault ? 'تعطيل التنزيل بدون علامة مائية' : 'تفعيل التنزيل بدون علامة مائية افتراضياً',
      subtitle: 'تقديم المادة مصفاة ومباشرة بدون شعارات المنصة الأصلية',
      icon: Droplet,
      iconColor: 'text-sky-400',
      badge: siteSettings.watermarkFreeByDefault ? 'مفعل 💧' : 'معطل 🚫',
      badgeBg: siteSettings.watermarkFreeByDefault ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' : 'bg-slate-800 text-slate-500',
      action: () => {
        handleToggleWatermarkFree();
      },
    },
    {
      id: 'clear_cache',
      category: 'quick_tools',
      title: 'تفريغ الذاكرة المؤقتة والسجل (Clear Cache)',
      subtitle: 'مسح سجل التنزيلات المحلي المؤقت بالكامل',
      icon: Trash2,
      iconColor: 'text-rose-400',
      action: () => {
        handleClearCache();
      },
    },
    {
      id: 'export_backup',
      category: 'quick_tools',
      title: 'تصدير نسخة احتياطية من الإعدادات (JSON)',
      subtitle: 'تنزيل ملف إعدادات النظام كاملاً للاحتفاظ به أو نقله',
      icon: Download,
      iconColor: 'text-emerald-400',
      action: () => {
        handleExportBackup();
        onClose();
      },
    },
    {
      id: 'open_debug_logs',
      category: 'quick_tools',
      title: 'فتح سجل التشخيص والأخطاء الخام (Debug Logs Overlay)',
      subtitle: 'عرض الاستجابات الخام للسيرفر وتحليل أسباب فشل روابط الفيسبوك والمنصات',
      icon: Terminal,
      iconColor: 'text-indigo-400',
      badge: 'Dev Tool 🐛',
      badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      shortcut: 'Ctrl+Shift+D',
      action: () => {
        window.dispatchEvent(new CustomEvent('omnifetch_open_debug_modal'));
        onClose();
      },
    },
    {
      id: 'copy_diagnostics',
      category: 'quick_tools',
      title: 'نسخ تقرير تشخيصات النظام الفنية',
      subtitle: 'نسخ مواصفات المتصفح وإحصائيات النظام للحافظة',
      icon: Copy,
      iconColor: 'text-slate-300',
      action: () => {
        handleCopyDiagnostics();
        onClose();
      },
    },
  ];

  const filteredActions = actions.filter(
    (act) =>
      act.title.toLowerCase().includes(query.toLowerCase()) ||
      act.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      act.id.toLowerCase().includes(query.toLowerCase())
  );

  // Handle keyboard navigation inside the list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredActions.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredActions.length) % Math.max(1, filteredActions.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredActions[selectedIndex]) {
        filteredActions[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-start justify-center pt-16 sm:pt-24 px-4 pb-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800/90 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden space-y-0 text-slate-100 flex flex-col max-h-[80vh] relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Top Search Bar Input */}
        <div className="relative p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950/60">
          <Command className="w-5 h-5 text-purple-400 shrink-0 animate-pulse" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="بحث في الإجراءات السريعة (صيانة، SEO، ثيم، كاش، إعدادات...)"
            className="w-full bg-transparent text-white placeholder-slate-500 text-sm font-bold focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            title="إغلاق (Esc)"
          >
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700">
              ESC
            </span>
          </button>
        </div>

        {/* Categories / Actions Items List */}
        <div className="p-3 overflow-y-auto space-y-1 flex-1">
          {filteredActions.length === 0 ? (
            <div className="p-8 text-center text-slate-500 space-y-2">
              <Search className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs font-semibold">لم يتم العثور على إجراء مطابق لـ "{query}"</p>
            </div>
          ) : (
            filteredActions.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full p-3.5 rounded-2xl text-right flex items-center justify-between gap-3 transition-all duration-150 ${
                    isSelected
                      ? 'bg-purple-600/20 border border-purple-500/50 shadow-lg text-white'
                      : 'bg-slate-950/40 hover:bg-slate-800/50 border border-transparent text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl bg-slate-900 border border-slate-800 ${item.iconColor} shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-white">{item.title}</span>
                        {item.badge && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${item.badgeBg}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{item.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.shortcut && (
                      <span className="text-[10px] font-mono px-2 py-1 rounded-md bg-slate-900 text-purple-300 border border-slate-800">
                        {item.shortcut}
                      </span>
                    )}
                    <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${isSelected ? 'translate-x-[-2px] text-purple-400' : ''}`} />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2 font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">↑↓</kbd>
              <span>للتنقل</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">↵ Enter</kbd>
              <span>للتنفيذ</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">ESC</kbd>
              <span>للإغلاق</span>
            </span>
          </div>

          <div className="flex items-center gap-1 text-purple-400 font-bold">
            <Zap className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span>Shortcut: Ctrl+Shift+A</span>
          </div>
        </div>
      </div>
    </div>
  );
};
