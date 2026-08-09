import React, { useState } from 'react';
import { Plus, Edit2, Trash2, BookOpen, Save, Eye, Search, Calendar, Tag } from 'lucide-react';
import { BlogPost, SupportedLanguage } from '../../types';
import { saveBlogsConfig } from '../../lib/storage';
import { getSafeText } from '../../lib/safeLang';

interface Props {
  blogs: BlogPost[];
  onUpdateBlogs: (blogs: BlogPost[]) => void;
  onShowToast: (msg: string) => void;
  currentLang: SupportedLanguage;
}

export const BlogManagerTab: React.FC<Props> = ({
  blogs,
  onUpdateBlogs,
  onShowToast,
  currentLang,
}) => {
  const [blogList, setBlogList] = useState<BlogPost[]>(blogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenNew = () => {
    setEditingPost({
      id: 'blog_' + Date.now(),
      slug: '',
      title: { ar: '', en: '', fr: '', es: '', de: '', it: '' },
      excerpt: { ar: '', en: '', fr: '', es: '', de: '', it: '' },
      content: { ar: '', en: '', fr: '', es: '', de: '', it: '' },
      category: 'tutorials',
      author: 'Admin Team',
      publishedAt: new Date().toISOString().split('T')[0],
      readTimeMinutes: 4,
      coverImage: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&q=80',
      views: 1,
      tags: ['Guide', 'OmniFetch', 'SEO'],
    });
    setIsModalOpen(true);
  };

  const handleEdit = (p: BlogPost) => {
    setEditingPost({ ...p });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const updated = blogList.filter((b) => b.id !== id);
    setBlogList(updated);
    saveBlogsConfig(updated);
    onUpdateBlogs(updated);
    onShowToast('تم حذف المقال.');
  };

  const handleSavePost = () => {
    const currentTitle = getSafeText(editingPost?.title, 'ar');
    if (!editingPost || !currentTitle) {
      onShowToast('يرجى إدخال عنوان المقال بالعربية');
      return;
    }
    const slug = editingPost.slug || currentTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const postToSave = { ...editingPost, slug };

    const exists = blogList.some((b) => b.id === postToSave.id);
    const updated = exists
      ? blogList.map((b) => (b.id === postToSave.id ? postToSave : b))
      : [postToSave, ...blogList];

    setBlogList(updated);
    saveBlogsConfig(updated);
    onUpdateBlogs(updated);
    setIsModalOpen(false);
    setEditingPost(null);
    onShowToast('تم نشر / حفظ المقال بنجاح!');
  };

  const filteredBlogs = blogList.filter((b) =>
    getSafeText(b.title, currentLang || 'ar').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white">إدارة المدونة والمقالات (Blog CMS)</h2>
          <p className="text-xs text-slate-400">
            كتابة ونشر مقالات موجهة للـ SEO، تصنيفات، وسوم، وجدولة النشر التلقائي.
          </p>
        </div>
        <button
          onClick={handleOpenNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>كتابة مقال جديد</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ابحث في المقالات برقم المقال أو العنوان..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Blog Cards Grid */}
      {filteredBlogs.length === 0 ? (
        <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 text-slate-400 text-xs">
          لا توجد مقالات مطابقة للبحث حالياً.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBlogs.map((post) => (
            <div
              key={post.id}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition space-y-3 relative flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="h-32 rounded-xl overflow-hidden bg-slate-950 relative">
                  <img src={post.coverImage} alt={getSafeText(post.title, 'ar')} className="w-full h-full object-cover" />
                  <span className="absolute top-2 right-2 px-2.5 py-1 rounded-md bg-slate-950/80 text-purple-300 text-[10px] font-bold border border-purple-500/30 uppercase">
                    {post.category}
                  </span>
                </div>

                <h3 className="font-extrabold text-sm text-white line-clamp-2">{getSafeText(post.title, currentLang || 'ar')}</h3>
                <p className="text-xs text-slate-400 line-clamp-2">{getSafeText(post.excerpt, currentLang || 'ar')}</p>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {post.publishedAt}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(post)}
                    className="p-1.5 rounded-lg bg-slate-800 text-purple-400 hover:bg-slate-700"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:bg-slate-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Blog Editor Modal */}
      {isModalOpen && editingPost && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <h3 className="text-lg font-black text-white pb-2 border-b border-slate-800">
              {editingPost.id ? 'محرر المقالات - تعديل مقال' : 'كتابة مقال جديد'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">عنوان المقال (بالعربية)</label>
                <input
                  type="text"
                  value={getSafeText(editingPost.title, 'ar')}
                  onChange={(e) => {
                    const prevTitle = typeof editingPost.title === 'object' && editingPost.title ? editingPost.title : {};
                    setEditingPost({
                      ...editingPost,
                      title: { ...prevTitle, ar: e.target.value, en: e.target.value },
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">التصنيف (Category)</label>
                  <select
                    value={editingPost.category}
                    onChange={(e) => setEditingPost({ ...editingPost, category: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="tutorials">Tutorials (شروحات)</option>
                    <option value="tips">Tips & Tricks (نصائح)</option>
                    <option value="platform-news">Platform News (أخبار)</option>
                    <option value="tech">Tech & Security (تقنية)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">رابط صورة الغلاف (Cover Image)</label>
                  <input
                    type="text"
                    value={editingPost.coverImage}
                    onChange={(e) => setEditingPost({ ...editingPost, coverImage: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">الملخص (Excerpt)</label>
                <textarea
                  rows={2}
                  value={getSafeText(editingPost.excerpt, 'ar')}
                  onChange={(e) => {
                    const prevExcerpt = typeof editingPost.excerpt === 'object' && editingPost.excerpt ? editingPost.excerpt : {};
                    setEditingPost({
                      ...editingPost,
                      excerpt: { ...prevExcerpt, ar: e.target.value, en: e.target.value },
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">محتوى المقال بالكامل</label>
                <textarea
                  rows={6}
                  value={getSafeText(editingPost.content, 'ar')}
                  onChange={(e) => {
                    const prevContent = typeof editingPost.content === 'object' && editingPost.content ? editingPost.content : {};
                    setEditingPost({
                      ...editingPost,
                      content: { ...prevContent, ar: e.target.value, en: e.target.value },
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                onClick={handleSavePost}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>نشر / حفظ المقال</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
