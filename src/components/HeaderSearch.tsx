import React, { useState, useEffect, useRef, useMemo } from 'react';
import Fuse from 'fuse.js';
import {
  Search,
  X,
  Globe,
  HelpCircle,
  BookOpen,
  Sparkles,
  LayoutDashboard,
  History,
  Shield,
  Layers,
  FileText,
  CornerDownLeft,
  ArrowRight,
  Flame,
  CheckCircle2,
  Video,
  Zap,
} from 'lucide-react';
import { SupportedLanguage, PlatformSlug } from '../types';
import { t } from '../i18n/translations';
import { PLATFORMS_CONFIG } from '../config/siteConfig';
import { getFaqsConfig, getBlogsConfig } from '../lib/storage';
import { DEFAULT_PAGES } from '../lib/adminStorage';
import { getSafeText } from '../lib/safeLang';

export interface SearchResultItem {
  id: string;
  type: 'platform' | 'faq' | 'blog' | 'page' | 'tool';
  title: string;
  description: string;
  keywords: string;
  category: string;
  badge?: string;
  iconType: string;
  data?: any;
  action: () => void;
}

interface HeaderSearchProps {
  currentLang: SupportedLanguage;
  onSelectPlatform: (platform: PlatformSlug) => void;
  onOpenBlog: () => void;
  onOpenHistory: () => void;
  onOpenAdmin: () => void;
  onOpenAiStudio: () => void;
  onOpenLegal?: (type: 'privacy' | 'terms' | 'dmca' | 'disclaimer' | 'cookies' | 'about' | 'contact') => void;
  onOpenBatchModal?: () => void;
}

export const HeaderSearch: React.FC<HeaderSearchProps> = ({
  currentLang,
  onSelectPlatform,
  onOpenBlog,
  onOpenHistory,
  onOpenAdmin,
  onOpenAiStudio,
  onOpenLegal,
  onOpenBatchModal,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');
  const inputRef = useRef<HTMLInputElement>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);

  // Build the unified search index dynamically
  const searchIndex: SearchResultItem[] = useMemo(() => {
    const items: SearchResultItem[] = [];

    // 1. Platforms
    Object.values(PLATFORMS_CONFIG).forEach((plat) => {
      const title =
        plat.titleTemplate[currentLang] || plat.titleTemplate.en || plat.name;
      const desc =
        plat.subtitle[currentLang] || plat.subtitle.en || plat.name;
      const keywords = (plat.seoKeywords || []).join(' ');

      items.push({
        id: `platform-${plat.slug}`,
        type: 'platform',
        title: `${plat.name} Downloader - ${title}`,
        description: desc,
        keywords: `${plat.name} ${plat.slug} ${keywords} تحميل تنزيل`,
        category: 'المنصات المدعومة',
        badge: plat.popular ? 'HOT' : undefined,
        iconType: 'Globe',
        data: plat,
        action: () => {
          onSelectPlatform(plat.slug);
          setIsOpen(false);
        },
      });
    });

    // 2. FAQs & Help Topics
    const faqs = getFaqsConfig();
    faqs.forEach((faq) => {
      const qText = getSafeText(faq?.question, currentLang);
      const aText = getSafeText(faq?.answer, currentLang);

      items.push({
        id: `faq-${faq.id}`,
        type: 'faq',
        title: qText,
        description: aText,
        keywords: `${faq.platform} سؤال جواب كيف طريقة حل اسئلة شائعة`,
        category: 'الأسئلة الشائعة والتعليمات',
        iconType: 'HelpCircle',
        data: faq,
        action: () => {
          setIsOpen(false);
          const el = document.getElementById('faq-section');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        },
      });
    });

    // 3. Blog Articles
    const blogs = getBlogsConfig();
    blogs.forEach((post) => {
      const titleText = getSafeText(post?.title, currentLang);
      const excerptText = getSafeText(post?.excerpt, currentLang);

      items.push({
        id: `blog-${post.id}`,
        type: 'blog',
        title: titleText,
        description: excerptText,
        keywords: `${post.tags.join(' ')} مقال شروحات مدونة اخبار`,
        category: 'المقالات والشروحات',
        iconType: 'BookOpen',
        data: post,
        action: () => {
          onOpenBlog();
          setIsOpen(false);
        },
      });
    });

    // 4. Managed Pages / Legal
    DEFAULT_PAGES.forEach((pg) => {
      items.push({
        id: `page-${pg.slug}`,
        type: 'page',
        title: pg.title,
        description: pg.metaDescription,
        keywords: `${pg.slug} سياسة شروط خصوصية اتفاقية حقوق اتصل بنا`,
        category: 'الصفحات القانونية والمعلومات',
        iconType: 'FileText',
        data: pg,
        action: () => {
          if (onOpenLegal) {
            let type: any = 'privacy';
            if (pg.slug.includes('terms')) type = 'terms';
            if (pg.slug.includes('dmca')) type = 'dmca';
            if (pg.slug.includes('about')) type = 'about';
            if (pg.slug.includes('contact')) type = 'contact';
            onOpenLegal(type);
          }
          setIsOpen(false);
        },
      });
    });

    // 5. Quick Tools & App Capabilities
    items.push(
      {
        id: 'tool-batch',
        type: 'tool',
        title: 'أداة التنزيل الجماعي المتعدد (Batch Multi-Downloader)',
        description: 'استخرج وحمّل روابط فيديوهات متعددة من تيك توك، يوتيوب وفيسبوك دفعة واحدة.',
        keywords: 'دفعة تنزيل متعدد روابط قائمة batch queue bulk download',
        category: 'الأدوات والميزات السريعة',
        badge: 'PRO',
        iconType: 'Layers',
        action: () => {
          if (onOpenBatchModal) onOpenBatchModal();
          setIsOpen(false);
        },
      },
      {
        id: 'tool-aistudio',
        type: 'tool',
        title: 'استوديو الذكاء الاصطناعي (AI Studio Assistant)',
        description: 'مولد الشروحات وتلخيص المقاطع وكتابة الهاشتاجات الذكية بـ Gemini 2.5.',
        keywords: 'ذكاء اصطناعي ai studio gemini summary hashtag generator',
        category: 'الأدوات والميزات السريعة',
        badge: 'AI',
        iconType: 'Sparkles',
        action: () => {
          onOpenAiStudio();
          setIsOpen(false);
        },
      },
      {
        id: 'tool-history',
        type: 'tool',
        title: 'سجل التحميلات والمفضلة (Download History)',
        description: 'عرض جميع الفيديوهات والملفات الصوتية التي قمت بتحميلها مؤخراً.',
        keywords: 'سجل تاريخ سابق تنزيلات مفضلة history saved videos',
        category: 'الأدوات والميزات السريعة',
        iconType: 'History',
        action: () => {
          onOpenHistory();
          setIsOpen(false);
        },
      }
    );

    return items;
  }, [currentLang, onSelectPlatform, onOpenBlog, onOpenHistory, onOpenAiStudio, onOpenLegal, onOpenBatchModal]);

  // Configure Fuse.js search engine
  const fuseEngine = useMemo(() => {
    return new Fuse(searchIndex, {
      keys: [
        { name: 'title', weight: 0.4 },
        { name: 'description', weight: 0.3 },
        { name: 'keywords', weight: 0.2 },
        { name: 'category', weight: 0.1 },
      ],
      threshold: 0.35,
      ignoreLocation: true,
      minMatchCharLength: 1,
    });
  }, [searchIndex]);

  // Perform fuzzy search
  const searchResults = useMemo(() => {
    if (!query.trim()) {
      // Return top recommended items when search is empty
      const recommended = searchIndex.filter(
        (i) => i.badge === 'HOT' || i.badge === 'PRO' || i.type === 'tool' || i.id.startsWith('platform-tiktok')
      );
      if (activeCategoryFilter !== 'ALL') {
        return recommended.filter((i) => i.type === activeCategoryFilter);
      }
      return recommended.slice(0, 8);
    }

    const rawResults = fuseEngine.search(query.trim()).map((res) => res.item);

    if (activeCategoryFilter !== 'ALL') {
      return rawResults.filter((i) => i.type === activeCategoryFilter);
    }

    return rawResults;
  }, [query, fuseEngine, searchIndex, activeCategoryFilter]);

  // Shortcut Keybindings listener (Ctrl+K or Cmd+K or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setIsOpen(true);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Auto focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setSelectedIndex(0);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Keyboard navigation within search results
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults[selectedIndex]) {
        searchResults[selectedIndex].action();
      }
    }
  };

  const getIcon = (typeStr: string) => {
    switch (typeStr) {
      case 'Globe':
        return <Globe className="w-4 h-4 text-blue-400" />;
      case 'HelpCircle':
        return <HelpCircle className="w-4 h-4 text-amber-400" />;
      case 'BookOpen':
        return <BookOpen className="w-4 h-4 text-emerald-400" />;
      case 'Layers':
        return <Layers className="w-4 h-4 text-indigo-400" />;
      case 'Sparkles':
        return <Sparkles className="w-4 h-4 text-pink-400" />;
      case 'History':
        return <History className="w-4 h-4 text-amber-400" />;
      case 'LayoutDashboard':
        return <LayoutDashboard className="w-4 h-4 text-purple-400" />;
      case 'FileText':
        return <FileText className="w-4 h-4 text-slate-400" />;
      default:
        return <Search className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="relative">
      {/* Header Search Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 hover:text-white border border-slate-700/70 transition-all shadow-sm text-xs group"
        title="البحث الشامل في كل الموقع (Ctrl+K)"
      >
        <Search className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
        <span className="hidden sm:inline font-medium text-slate-400 group-hover:text-slate-200">
          بحث شامل...
        </span>
        <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700/80 text-[10px] font-mono text-indigo-300 font-bold">
          ⌘K
        </kbd>
      </button>

      {/* Global Full-Site Search Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4 animate-fadeIn">
          {/* Backdrop Click to Close */}
          <div className="fixed inset-0" onClick={() => setIsOpen(false)} />

          {/* Search Box Box */}
          <div
            ref={modalContainerRef}
            className="relative w-full max-w-2xl bg-slate-900 border border-indigo-500/30 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh] animate-scaleUp"
          >
            {/* Search Input Bar */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center gap-3">
              <Search className="w-5 h-5 text-indigo-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleInputKeyDown}
                placeholder="ابحث عن المنصات، الأسئلة الشائعة، الشروحات والأدوات (Fuse.js Fuzzy Search)..."
                className="w-full bg-transparent text-white placeholder-slate-500 text-sm font-semibold focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="px-2 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs font-mono border border-slate-700"
              >
                ESC
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 p-2.5 bg-slate-900/90 border-b border-slate-800/80 overflow-x-auto text-[11px] font-bold">
              {[
                { id: 'ALL', label: 'الكل' },
                { id: 'platform', label: '🚀 المنصات' },
                { id: 'faq', label: '❓ الأسئلة الشائعة' },
                { id: 'blog', label: '📝 الشروحات' },
                { id: 'tool', label: '⚡ الأدوات السريعة' },
                { id: 'page', label: '⚖️ الصفحات' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategoryFilter(cat.id);
                    setSelectedIndex(0);
                  }}
                  className={`px-3 py-1 rounded-xl transition whitespace-nowrap ${
                    activeCategoryFilter === cat.id
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 font-extrabold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Results List Area */}
            <div className="p-3 overflow-y-auto space-y-1.5 flex-1">
              {!query.trim() && (
                <div className="px-3 py-2 text-[11px] font-bold text-slate-400 flex items-center justify-between">
                  <span>مقترحات سريعة وميزات شائعة</span>
                  <span className="text-indigo-400 flex items-center gap-1">
                    <Flame className="w-3 h-3 fill-indigo-400" />
                    <span>Popular</span>
                  </span>
                </div>
              )}

              {searchResults.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <Search className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-400">لا توجد نتائج تطابق "{query}"</p>
                  <p className="text-[11px] text-slate-500">جرب البحث بكلمات مفتاحية أعم مثل "تيك توك"، "MP3"، "مجاني"، أو "خصوصية"</p>
                </div>
              ) : (
                searchResults.map((item, index) => {
                  const isSelected = index === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => item.action()}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`p-3 rounded-2xl cursor-pointer transition-all flex items-start justify-between gap-3 border ${
                        isSelected
                          ? 'bg-gradient-to-r from-indigo-950/80 to-purple-950/60 border-indigo-500/50 shadow-lg text-white'
                          : 'bg-slate-950/60 hover:bg-slate-800/60 border-slate-800/80 text-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2.5 rounded-xl mt-0.5 border shrink-0 ${
                            isSelected
                              ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}
                        >
                          {getIcon(item.iconType)}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-extrabold text-white line-clamp-1">
                              {item.title}
                            </h4>
                            {item.badge && (
                              <span className="px-1.5 py-0.2 rounded font-mono text-[9px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                          <span className="inline-block text-[10px] font-semibold text-slate-500 pt-0.5">
                            {item.category}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1 self-center">
                        {isSelected ? (
                          <span className="p-1.5 rounded-lg bg-indigo-600 text-white shadow">
                            <CornerDownLeft className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <ArrowRight className="w-4 h-4 text-slate-600 rotate-180" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Footer Info */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <div className="flex items-center gap-3">
                <span>تصفح بالأسم: ↑ ↓</span>
                <span>اختر: Enter</span>
                <span>إغلاق: ESC</span>
              </div>
              <span className="text-indigo-400 font-bold">Fuse.js Fuzzy Search Indexing</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
