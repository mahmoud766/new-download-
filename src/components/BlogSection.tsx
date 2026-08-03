import { useState, useEffect } from 'react';
import { SupportedLanguage, BlogPost } from '../types';
import { getBlogsConfig } from '../lib/storage';
import { t } from '../i18n/translations';
import { BookOpen, Search, Clock, Eye, ArrowLeft, Tag, Calendar, User, Sparkles } from 'lucide-react';

interface BlogProps {
  currentLang: SupportedLanguage;
  onBack: () => void;
}

export function BlogSection({ currentLang, onBack }: BlogProps) {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    setBlogs(getBlogsConfig());
  }, []);

  const categories = [
    { id: 'all', name: 'All Topics' },
    { id: 'tutorials', name: 'Tutorials & Guides' },
    { id: 'platform-news', name: 'Platform News' },
    { id: 'tips', name: 'Speed & Quality Tips' },
  ];

  const filteredBlogs = blogs.filter((post) => {
    const titleText = (post.title[currentLang] || post.title.en).toLowerCase();
    const excerptText = (post.excerpt[currentLang] || post.excerpt.en).toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch = titleText.includes(query) || excerptText.includes(query);
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  if (selectedPost) {
    const title = selectedPost.title[currentLang] || selectedPost.title.en;
    const content = selectedPost.content[currentLang] || selectedPost.content.en;

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-6 animate-fade-in text-left">
        <button
          onClick={() => setSelectedPost(null)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 font-bold text-xs transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Articles</span>
        </button>

        <div className="space-y-4 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-indigo-400">
            <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 uppercase">
              {selectedPost.category}
            </span>
            <span>•</span>
            <span className="text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {selectedPost.publishedAt}
            </span>
            <span>•</span>
            <span className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {selectedPost.readTimeMinutes} min read
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">{title}</h1>

          <div className="flex items-center gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
            <User className="w-4 h-4 text-emerald-400" />
            <span>Written by {selectedPost.author}</span>
          </div>

          <div className="aspect-video rounded-2xl overflow-hidden bg-slate-950 my-6">
            <img src={selectedPost.coverImage} alt={title} className="w-full h-full object-cover" />
          </div>

          <div className="prose prose-invert max-w-none text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-wrap pt-4">
            {content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12 space-y-8 animate-fade-in text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 mb-2 text-xs font-bold text-indigo-400 hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Downloader</span>
          </button>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-emerald-400" />
            <span>OmniFetch Knowledge Hub</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Tutorials, watermark removal guides, and video downloading tips.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles..."
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedCategory === cat.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBlogs.map((post) => {
          const titleText = post.title[currentLang] || post.title.en;
          const excerptText = post.excerpt[currentLang] || post.excerpt.en;

          return (
            <div
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className="group cursor-pointer rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 shadow-xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1"
            >
              <div>
                <div className="aspect-video overflow-hidden bg-slate-950">
                  <img
                    src={post.coverImage}
                    alt={titleText}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                <div className="p-5 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                    <span className="uppercase text-indigo-400">{post.category}</span>
                    <span>{post.readTimeMinutes} min read</span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2">
                    {titleText}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                    {excerptText}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0 text-xs font-bold text-indigo-400 flex items-center justify-between">
                <span>Read Full Guide</span>
                <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
