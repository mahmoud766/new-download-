import React, { useState } from 'react';
import { Plus, Trash2, HelpCircle, Save, Layers } from 'lucide-react';
import { FAQItem, SupportedLanguage } from '../../types';
import { saveFaqsConfig } from '../../lib/storage';
import { getSafeText } from '../../lib/safeLang';

interface Props {
  faqs: FAQItem[];
  onUpdateFaqs: (faqs: FAQItem[]) => void;
  onShowToast: (msg: string) => void;
  currentLang: SupportedLanguage;
}

export const FaqManagerTab: React.FC<Props> = ({
  faqs,
  onUpdateFaqs,
  onShowToast,
  currentLang,
}) => {
  const [faqList, setFaqList] = useState<FAQItem[]>(faqs);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [platform, setPlatform] = useState<string>('general');

  const handleAddFaq = () => {
    if (!question || !answer) {
      onShowToast('يرجى إدخال السؤال والجواب');
      return;
    }
    const item: FAQItem = {
      id: 'faq_' + Date.now(),
      platform: platform as any,
      order: faqList.length + 1,
      question: { ar: question, en: question, fr: question, es: question, de: question, it: question },
      answer: { ar: answer, en: answer, fr: answer, es: answer, de: answer, it: answer },
    };
    const updated = [...faqList, item];
    setFaqList(updated);
    saveFaqsConfig(updated);
    onUpdateFaqs(updated);
    setQuestion('');
    setAnswer('');
    onShowToast('تم إضافة السؤال الشائع وتفعيل FAQ Schema تلقائياً!');
  };

  const handleDeleteFaq = (id: string) => {
    const updated = faqList.filter((f) => f.id !== id);
    setFaqList(updated);
    saveFaqsConfig(updated);
    onUpdateFaqs(updated);
    onShowToast('تم حذف السؤال الشائع.');
  };

  return (
    <div className="space-y-6 text-slate-100">
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-lg font-black text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-purple-400" />
          <span>إضافة سؤال شائع جديد (FAQ & FAQ Schema Generator)</span>
        </h2>

        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-400 mb-1 font-semibold">السؤال (Question)</label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="كيف يمكنني تحميل فيديو تيك توك بدون علامة مائية؟"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">تخصيص للمنصة</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none font-semibold"
              >
                <option value="general">عام للكل (General)</option>
                <option value="tiktok">TikTok</option>
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="youtube">YouTube</option>
                <option value="snapchat">Snapchat</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">الإجابة التفصيلية (Answer)</label>
            <textarea
              rows={3}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="قم بنسخ رابط الفيديو ووضعه في مربع البحث أعلى الموقع ثم اضغط تحميل..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          <button
            onClick={handleAddFaq}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة السؤال وتوليد FAQ Schema</span>
          </button>
        </div>
      </div>

      {/* List of Existing FAQs */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white">الأسئلة الشائعة الحالية ({faqList.length})</h3>
        <div className="space-y-3">
          {faqList.map((faq) => (
            <div
              key={faq.id}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-4"
            >
              <div className="space-y-1 text-xs">
                <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 font-mono font-bold text-[10px] uppercase border border-purple-500/20">
                  {faq.platform}
                </span>
                <h4 className="font-extrabold text-white text-sm pt-1">
                  {getSafeText(faq.question, currentLang || 'ar')}
                </h4>
                <p className="text-slate-400">{getSafeText(faq.answer, currentLang || 'ar')}</p>
              </div>
              <button
                onClick={() => handleDeleteFaq(faq.id)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
