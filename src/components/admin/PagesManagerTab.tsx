import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, FileText, CheckCircle2, XCircle, ArrowUpDown, Save } from 'lucide-react';
import { ManagedPage, SupportedLanguage } from '../../types';
import { getManagedPages, saveManagedPages, fetchManagedPagesFromDb } from '../../lib/adminStorage';

interface Props {
  currentLang: SupportedLanguage;
  onShowToast: (msg: string) => void;
}

export const PagesManagerTab: React.FC<Props> = ({ currentLang, onShowToast }) => {
  const [pages, setPages] = useState<ManagedPage[]>(getManagedPages());
  const [editingPage, setEditingPage] = useState<ManagedPage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchManagedPagesFromDb().then((p) => {
      if (p && p.length > 0) setPages(p);
    });
  }, []);

  const handleOpenNew = () => {
    setEditingPage({
      id: 'page_' + Date.now(),
      title: '',
      slug: '',
      content: '',
      published: true,
      metaTitle: '',
      metaDescription: '',
      order: pages.length + 1,
      updatedAt: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const handleEdit = (p: ManagedPage) => {
    setEditingPage({ ...p });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const updated = pages.filter((p) => p.id !== id);
    setPages(updated);
    saveManagedPages(updated);
    onShowToast('تم حذف الصفحة بنجاح.');
  };

  const handleSavePage = () => {
    if (!editingPage || !editingPage.title) {
      onShowToast('يرجى كتابة عنوان الصفحة');
      return;
    }
    const cleanSlug = editingPage.slug || editingPage.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const pageToSave: ManagedPage = {
      ...editingPage,
      slug: cleanSlug,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    const exists = pages.some((p) => p.id === pageToSave.id);
    const updated = exists
      ? pages.map((p) => (p.id === pageToSave.id ? pageToSave : p))
      : [...pages, pageToSave];

    setPages(updated);
    saveManagedPages(updated);
    setIsModalOpen(false);
    setEditingPage(null);
    onShowToast('تم حفظ التغييرات على الصفحة بنجاح!');
  };

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white">إدارة الصفحات وصفحات الهبوط (Pages CMS)</h2>
          <p className="text-xs text-slate-400">
            إنشاء، تعديل، ترتيب وتخصيص كافة صفحات الموقع والـ Landing Pages ورابط الصفحة الـ Slug.
          </p>
        </div>
        <button
          onClick={handleOpenNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء صفحة جديدة</span>
        </button>
      </div>

      {/* Pages Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950 text-slate-400">
              <th className="py-3 px-4">عنوان الصفحة</th>
              <th className="py-3 px-4">الرابط (Slug)</th>
              <th className="py-3 px-4">الحالة</th>
              <th className="py-3 px-4">الترتيب</th>
              <th className="py-3 px-4">آخر تحديث</th>
              <th className="py-3 px-4 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-200">
            {pages.map((p) => (
              <tr key={p.id} className="hover:bg-slate-800/40">
                <td className="py-3 px-4 font-bold text-white">{p.title}</td>
                <td className="py-3 px-4 font-mono text-purple-400">/{p.slug}</td>
                <td className="py-3 px-4">
                  {p.published ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> منشور
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400">
                      <XCircle className="w-3 h-3" /> مسودة
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 font-mono">{p.order}</td>
                <td className="py-3 px-4 text-slate-400">{p.updatedAt}</td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleEdit(p)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-400"
                      title="تعديل"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit / Create Page Modal */}
      {isModalOpen && editingPage && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <h3 className="text-lg font-black text-white pb-2 border-b border-slate-800">
              {editingPage.id ? 'تعديل بيانات الصفحة' : 'إنشاء صفحة جديدة'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">عنوان الصفحة</label>
                <input
                  type="text"
                  value={editingPage.title}
                  onChange={(e) => setEditingPage({ ...editingPage, title: e.target.value })}
                  placeholder="مثال: سياسة الخصوصية"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">رابط الصفحة (Slug)</label>
                <input
                  type="text"
                  value={editingPage.slug}
                  onChange={(e) => setEditingPage({ ...editingPage, slug: e.target.value })}
                  placeholder="privacy-policy"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">محتوى الصفحة (HTML / Markdown Supported)</label>
                <textarea
                  rows={6}
                  value={editingPage.content}
                  onChange={(e) => setEditingPage({ ...editingPage, content: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-purple-500 resize-none font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Meta Title للـ SEO</label>
                  <input
                    type="text"
                    value={editingPage.metaTitle || ''}
                    onChange={(e) => setEditingPage({ ...editingPage, metaTitle: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Meta Description للـ SEO</label>
                  <input
                    type="text"
                    value={editingPage.metaDescription || ''}
                    onChange={(e) => setEditingPage({ ...editingPage, metaDescription: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-white">
                  <input
                    type="checkbox"
                    checked={editingPage.published}
                    onChange={(e) => setEditingPage({ ...editingPage, published: e.target.checked })}
                    className="w-4 h-4 accent-purple-600 rounded"
                  />
                  <span>نشر الصفحة فوراً</span>
                </label>
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
                onClick={handleSavePage}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>حفظ الصفحة</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
