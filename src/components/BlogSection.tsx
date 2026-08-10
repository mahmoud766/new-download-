import { useState, useEffect } from 'react';
import { SupportedLanguage, BlogPost } from '../types';
import { getBlogsConfig } from '../lib/storage';
import { getSafeText } from '../lib/safeLang';
import { SEO_ARTICLES_CATALOG } from '../config/seoArticlesData';
import { SeoHead } from './SeoHead';
import {
  BookOpen,
  Search,
  Clock,
  Eye,
  ArrowLeft,
  Tag,
  Calendar,
  User,
  Sparkles,
  Flame,
  ChevronRight,
  ChevronLeft,
  Download,
  Share2,
} from 'lucide-react';

interface BlogProps {
  currentLang: SupportedLanguage;
  onBack: () => void;
}

export function BlogSection({ currentLang, onBack }: BlogProps) {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 12;

  const isRtl = currentLang === 'ar';

  useEffect(() => {
    const customBlogs = getBlogsConfig();
    // Combine custom stored blogs with 100 SEO articles catalog
    const merged = [...customBlogs, ...SEO_ARTICLES_CATALOG];
    setBlogs(merged);

    // Parse URL slug if visiting /blog/:slug directly
    const path = window.location.pathname.toLowerCase();
    if (path.startsWith('/blog/') && path.length > 6) {
      const slug = path.replace('/blog/', '').replace(/\/$/, '');
      const match = merged.find((p) => p.slug === slug || p.id === slug);
      if (match) {
        setSelectedPost(match);
      }
    }
  }, []);

  const handleSelectPost = (post: BlogPost) => {
    setSelectedPost(post);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `/blog/${post.slug}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBackToList = () => {
    setSelectedPost(null);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/blog');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const categories = [
    { id: 'all', name: isRtl ? 'جميع المقالات (100+)' : 'All Articles (100+)' },
    { id: 'tutorials', name: isRtl ? 'الشروحات والأدلة' : 'Tutorials & Guides' },
    { id: 'tips', name: isRtl ? 'نصائح السرعة والجودة' : 'Speed & Quality Tips' },
    { id: 'platform-news', name: isRtl ? 'أخبار المنصات' : 'Platform News' },
    { id: 'tech', name: isRtl ? 'المواصفات التقنية' : 'Tech Specifications' },
  ];

  const filteredBlogs = blogs.filter((post) => {
    const titleText = getSafeText(post?.title, currentLang).toLowerCase();
    const excerptText = getSafeText(post?.excerpt, currentLang).toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch = titleText.includes(query) || excerptText.includes(query) || post.tags?.some(t => t.toLowerCase().includes(query));
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredBlogs.length / postsPerPage);
  const currentPosts = filteredBlogs.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage);

  if (selectedPost) {
    const title = getSafeText(selectedPost?.title, currentLang);
    const content = getSafeText(selectedPost?.content, currentLang);
    const excerpt = getSafeText(selectedPost?.excerpt, currentLang);
    const canonicalUrl = `https://omnifetchpro.com/blog/${selectedPost.slug}`;

    const blogPostingSchema = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: title,
      description: excerpt,
      image: selectedPost.coverImage,
      datePublished: selectedPost.publishedAt,
      author: {
        '@type': 'Organization',
        name: selectedPost.author || 'OmniFetch Pro',
      },
      publisher: {
        '@type': 'Organization',
        name: 'OmniFetch Pro',
        url: 'https://omnifetchpro.com',
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': canonicalUrl,
      },
    };

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-6 animate-fade-in text-right rtl:text-right ltr:text-left">
        <SeoHead
          language={currentLang}
          pageTitle={`${title} | OmniFetch Pro`}
          pageDescription={excerpt}
          customCanonicalUrl={canonicalUrl}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }} />

        <button
          onClick={handleBackToList}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 font-bold text-xs transition-all shadow-md"
        >
          <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
          <span>{isRtl ? 'العودة لقائمة المقالات' : 'Back to Articles'}</span>
        </button>

        <article className="space-y-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl">
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-purple-400">
            <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 uppercase">
              {selectedPost.category}
            </span>
            <span>•</span>
            <span className="text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              {selectedPost.publishedAt}
            </span>
            <span>•</span>
            <span className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-pink-400" />
              {selectedPost.readTimeMinutes} {isRtl ? 'دقائق قراءة' : 'min read'}
            </span>
            <span>•</span>
            <span className="text-slate-400 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-indigo-400" />
              {selectedPost.views.toLocaleString()} {isRtl ? 'مشاهدة' : 'views'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">{title}</h1>

          <div className="flex items-center justify-between border-y border-slate-800/80 py-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-slate-200">{selectedPost.author}</span>
            </div>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title, url: window.location.href });
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors font-bold"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{isRtl ? 'مشاركة المقال' : 'Share Article'}</span>
            </button>
          </div>

          <div className="aspect-video rounded-2xl overflow-hidden bg-slate-950 my-6 border border-slate-800 shadow-xl">
            <img src={selectedPost.coverImage} alt={title} className="w-full h-full object-cover" />
          </div>

          {/* Article Body */}
          <div className="prose prose-invert max-w-none text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-wrap pt-2">
            {content}
          </div>

          {/* Bottom Quick Download CTA */}
          <div className="p-6 bg-gradient-to-r from-purple-900/60 via-slate-900 to-indigo-900/60 border border-purple-500/30 rounded-2xl space-y-3 mt-8">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-purple-400" />
              <span>{isRtl ? 'جاهز لتنزيل فيديوهاتك المفضل الآن؟' : 'Ready to Download Your Videos Now?'}</span>
            </h2>
            <p className="text-xs text-slate-300">
              {isRtl
                ? 'جرب أداة OmniFetch Pro الاستثنائية مجاناً بدون علامة مائية وبأعلى جودة 4K.'
                : 'Try OmniFetch Pro for free with zero watermark and maximum 4K speed.'}
            </p>
            <button
              onClick={onBack}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-purple-900/40 transition-all"
            >
              {isRtl ? 'الانتقال لأداة التحميل الرئيسية' : 'Go to Main Downloader'}
            </button>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12 space-y-8 animate-fade-in text-right rtl:text-right ltr:text-left">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 mb-2 text-xs font-bold text-purple-400 hover:underline"
          >
            <ArrowLeft className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
            <span>{isRtl ? 'العودة للواجهة الرئيسية' : 'Back to Downloader'}</span>
          </button>
          <h1 className="text-2xl sm:text-4xl font-black text-white flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-purple-500" />
            <span>{isRtl ? 'دليل ومقالات أومني فيتش برو الشامل (100 مقال SEO)' : 'OmniFetch Pro SEO Knowledge Hub'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {isRtl
              ? 'مكتبة المقالات والشروحات التقنية المتخصصة لتنزيل الفيديوهات من كافة المنصات بأعلى جودة وبدون علامات مائية.'
              : 'Explore 100+ comprehensive SEO articles & tutorials on downloading HD videos from all social platforms.'}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder={isRtl ? 'ابحث في 100 مقال...' : 'Search 100 articles...'}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategory(cat.id);
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              selectedCategory === cat.id
                ? 'bg-purple-600 text-white border-purple-400/50 shadow-lg shadow-purple-900/40'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentPosts.map((post) => {
          const postTitle = getSafeText(post?.title, currentLang);
          const postExcerpt = getSafeText(post?.excerpt, currentLang);

          return (
            <div
              key={post.id}
              onClick={() => handleSelectPost(post)}
              className="group bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-purple-950/40 transition-all duration-300 flex flex-col justify-between cursor-pointer"
            >
              <div className="aspect-video overflow-hidden bg-slate-950 relative">
                <img
                  src={post.coverImage}
                  alt={postTitle}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-slate-950/80 backdrop-blur-md text-purple-300 border border-purple-500/30 rounded-lg text-[10px] font-bold">
                  {post.category}
                </span>
              </div>

              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-2">
                    <Calendar className="w-3 h-3 text-purple-400" />
                    <span>{post.publishedAt}</span>
                    <span>•</span>
                    <Clock className="w-3 h-3 text-pink-400" />
                    <span>{post.readTimeMinutes} min</span>
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-2 leading-snug">
                    {postTitle}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-3 mt-2 leading-relaxed">
                    {postExcerpt}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-purple-400">
                  <span>{isRtl ? 'اقرأ المقال الكامل' : 'Read Full Article'}</span>
                  <ChevronRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-6">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 disabled:opacity-40 hover:bg-slate-800"
          >
            <ChevronLeft className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
          </button>

          <span className="text-xs font-bold text-slate-300">
            {isRtl
              ? `صفحة ${currentPage} من ${totalPages}`
              : `Page ${currentPage} of ${totalPages}`}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 disabled:opacity-40 hover:bg-slate-800"
          >
            <ChevronRight className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
          </button>
        </div>
      )}
    </div>
  );
}
