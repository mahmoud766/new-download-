import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Command,
  ArrowRight,
  Sparkles,
  Settings,
  FileText,
  HelpCircle,
  Globe,
  DollarSign,
  Palette,
  Users,
  Mail,
  Activity,
  HardDrive,
  ImageIcon,
  History,
  X,
  CheckCircle2,
} from 'lucide-react';

export interface CommandModuleItem {
  id: string;
  label: string;
  description: string;
  category: string;
  icon: React.ElementType;
  keywords: string[];
}

export const ALL_ADMIN_MODULES: CommandModuleItem[] = [
  {
    id: 'general',
    label: 'الإعدادات العامة والربط',
    description: 'إعدادات اسم الموقع، العبارة الترحيبية، والـ Metadata الرئيسية',
    category: 'النظام والمحتوى',
    icon: Settings,
    keywords: ['general', 'settings', 'site', 'title', 'brand', 'إعدادات', 'موقع'],
  },
  {
    id: 'seo_pages',
    label: 'صفحات الـ SEO الثابتة',
    description: 'تعديل المحتوى والـ Metatags لصفحات التنزيل لكل منصة (TikTok, FB, YT)',
    category: 'النظام والمحتوى',
    icon: FileText,
    keywords: ['seo', 'pages', 'tiktok', 'facebook', 'youtube', 'instagram', 'صفحات'],
  },
  {
    id: 'faqs',
    label: 'إدارة الأسئلة الشائعة (FAQ)',
    description: 'إضافة وتعديل الأسئلة والأجوبة الشائعة لدعم الـ Schema Markup',
    category: 'النظام والمحتوى',
    icon: HelpCircle,
    keywords: ['faq', 'questions', 'answers', 'أسئلة', 'شائعة', 'سؤال'],
  },
  {
    id: 'seo',
    label: 'مركز الـ SEO والـ Schemas',
    description: 'إدارة الـ Structured Data (JSON-LD), OpenGraph, وعناوين الـ Meta',
    category: 'محركات البحث الـ SEO',
    icon: Search,
    keywords: ['seo', 'schema', 'json-ld', 'opengraph', 'meta', 'title', 'description', 'ملاحظات'],
  },
  {
    id: 'google',
    label: 'خدمات Google والتكامل',
    description: 'ربط Google Search Console, Google Analytics, و Sitemap.xml',
    category: 'محركات البحث الـ SEO',
    icon: Globe,
    keywords: ['google', 'analytics', 'search console', 'sitemap', 'robots', 'جوجل'],
  },
  {
    id: 'ads',
    label: 'إدارة الإعلانات والمساحات الذكية',
    description: 'حقن أكواد Google AdSense, Ezoic, Mediavine, وبنرات الرعاة',
    category: 'محركات البحث الـ SEO',
    icon: DollarSign,
    keywords: ['ads', 'adsense', 'revenue', 'banner', 'ezoic', 'mediavine', 'إعلانات', 'أرباح', 'بنر'],
  },
  {
    id: 'ai_suite',
    label: 'أدوات الذكاء الاصطناعي (AI Suite)',
    description: 'توليد المقالات التلقائية، تحسين الـ Meta descriptions بـ Gemini API',
    category: 'الذكاء الاصطناعي والتخصيص',
    icon: Sparkles,
    keywords: ['ai', 'gemini', 'writer', 'generate', 'content', 'ذكاء', 'اصطناعي', 'مقالات'],
  },
  {
    id: 'theme',
    label: 'Theme Builder والتصميم',
    description: 'تعديل ألوان الموقع، الثيم الليلي والنهاري، والـ Gradients',
    category: 'الذكاء الاصطناعي والتخصيص',
    icon: Palette,
    keywords: ['theme', 'color', 'dark', 'light', 'design', 'تصميم', 'ألوان', 'ثيم'],
  },
  {
    id: 'users_security',
    label: 'المستخدمون والأمان',
    description: 'إدارة صلاحيات المشرفين، الـ Firebase Auth، والـ Rate Limiting',
    category: 'الأمان والنظام والملفات',
    icon: Users,
    keywords: ['users', 'security', 'firebase', 'auth', 'admin', 'passwords', 'أمان', 'مستخدمين'],
  },
  {
    id: 'email_alerts',
    label: 'تنبيهات البريد و SMTP',
    description: 'إعدادات خادم SMTP، التنبيهات الفورية لأخطاء النظام وانقطاع الـ DB',
    category: 'الأمان والنظام والملفات',
    icon: Mail,
    keywords: ['email', 'smtp', 'alerts', 'mailgun', 'sendgrid', 'notifications', 'تنبيهات', 'بريد'],
  },
  {
    id: 'api_perf',
    label: 'الأداء والـ APIs',
    description: 'مراقبة سرعة الاستجابة، حالة الـ Proxies، ومعدل نجاح التنزيل',
    category: 'الأمان والنظام والملفات',
    icon: Activity,
    keywords: ['api', 'performance', 'speed', 'proxy', 'health', 'latency', 'أداء', 'سيرفر'],
  },
  {
    id: 'files',
    label: 'الملفات والنسخ الاحتياطي',
    description: 'إدارة ملفات النظام، تصدير واسترجاع النسخ الاحتياطية (Backups)',
    category: 'الأمان والنظام والملفات',
    icon: HardDrive,
    keywords: ['files', 'backup', 'export', 'import', 'json', 'ملفات', 'نسخة', 'احتياطية'],
  },
  {
    id: 'image_opt',
    label: 'تحسين الصور WebP Canvas',
    description: 'ضغط وتحويل الصور إلى صيغة WebP فائقة السرعة للـ SEO',
    category: 'الأمان والنظام والملفات',
    icon: ImageIcon,
    keywords: ['image', 'webp', 'compress', 'optimize', 'canvas', 'صور', 'ضغط'],
  },
  {
    id: 'toolkit_logs',
    label: 'فحص SEO وسجل التعديلات',
    description: 'سجل التغييرات الكامل للوحة وفحص نقاط الـ Audit للـ SEO',
    category: 'الأمان والنظام والملفات',
    icon: History,
    keywords: ['logs', 'audit', 'history', 'seo audit', 'سجل', 'تعديلات', 'فحص'],
  },
];

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tabId: string) => void;
  onShowToast?: (msg: string) => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onShowToast,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Filter modules based on query
  const filteredModules = ALL_ADMIN_MODULES.filter((module) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    return (
      module.label.toLowerCase().includes(q) ||
      module.description.toLowerCase().includes(q) ||
      module.category.toLowerCase().includes(q) ||
      module.keywords.some((k) => k.toLowerCase().includes(q))
    );
  });

  // Handle Keyboard navigation inside modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredModules.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredModules.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredModules[selectedIndex]) {
          const selected = filteredModules[selectedIndex];
          onSelectTab(selected.id);
          onClose();
          onShowToast?.(`الانتقال الفوري إلى: ${selected.label}`);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredModules, selectedIndex, onSelectTab, onClose, onShowToast]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-start justify-center pt-16 sm:pt-24 px-4 pb-6 overflow-y-auto animate-fadeIn">
      {/* Backdrop click to close */}
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 space-y-0">
        {/* Top Search Bar Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 bg-slate-950 border-b border-slate-800">
          <Search className="w-5 h-5 text-purple-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="ابحث عن أي وحدة للوصول السريع (SEO, Ads, SMTP, Files, AI...)"
            className="w-full bg-transparent text-white font-medium text-sm placeholder:text-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-500 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400 font-bold shrink-0">
            <Command className="w-3 h-3 text-purple-400" /> K
          </span>
        </div>

        {/* Search Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1">
          {filteredModules.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Search className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs">لم يتم العثور على أي وحدة تطابق: "{query}"</p>
              <span className="text-[10px] text-slate-600 block">جرب البحث عن: ads, seo, smtp, backup, theme, ai</span>
            </div>
          ) : (
            filteredModules.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onClose();
                    onShowToast?.(`الانتقال الفوري إلى: ${item.label}`);
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl text-right transition-all group ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                      : 'hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl transition ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-800 text-purple-400 group-hover:bg-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-white">{item.label}</span>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-mono ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-950 text-slate-400 border border-slate-800'
                          }`}
                        >
                          {item.category}
                        </span>
                      </div>
                      <p
                        className={`text-[11px] mt-0.5 line-clamp-1 ${
                          isSelected ? 'text-purple-100' : 'text-slate-400'
                        }`}
                      >
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
                    <span className="text-[10px] font-mono hidden sm:inline">فتح</span>
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Tips */}
        <div className="p-3 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-[10px]">↑↓</kbd> للتنقل
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-[10px]">↵</kbd> للاختيار
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-[10px]">ESC</kbd> للإغلاق
            </span>
          </div>

          <span className="text-purple-400 font-bold hidden sm:inline">OmniFetch QuickNav ⌘K</span>
        </div>
      </div>
    </div>
  );
};
