import React, { useState } from 'react';
import { Sparkles, Bot, FileText, Search, HelpCircle, Copy, Check, Loader2 } from 'lucide-react';
import { SupportedLanguage } from '../../types';

interface Props {
  currentLang: SupportedLanguage;
  onShowToast: (msg: string) => void;
}

export const AiSuiteTab: React.FC<Props> = ({ currentLang, onShowToast }) => {
  const [activeTool, setActiveTool] = useState<'meta' | 'article' | 'keywords' | 'faq'>('meta');
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!topic) {
      onShowToast('يرجى إدخال عنوان أو فكرة للمساعد الذكي');
      return;
    }

    setIsGenerating(true);
    setOutput('');

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: activeTool, topic }),
      });

      if (res.ok) {
        const data = await res.json();
        setOutput(data.result || data.text || 'تم توليد النتيجة بنجاح.');
      } else {
        // Fallback local smart generator
        setTimeout(() => {
          if (activeTool === 'meta') {
            setOutput(`Title: ${topic} - تحميل سريع بجودة 4K بدون علامة مائية | OmniFetch\nMeta Description: استمتع بأسرع أداة لتنزيل مقاطع ${topic} مجاناً بأعلى دقة وبدون إعلانات مزعجة.`);
          } else if (activeTool === 'article') {
            setOutput(`# دليل شامل: ${topic}\n\nتعتبر أداة OmniFetch الحل الأمثل لتحميل فيديوهات ${topic} بجودة فائقة...\n\n## المميزات الرئيسية:\n1. بدون علامة مائية\n2. سرعة فائقة في المعالجة\n3. مجانية بالكامل`);
          } else if (activeTool === 'keywords') {
            setOutput(`1. ${topic} بدون علامة مائية\n2. تحميل ${topic} mp4\n3. تنزيل ${topic} hd\n4. طريقة حفظ ${topic}\n5. افضل موقع تحويل ${topic} الى mp3`);
          } else {
            setOutput(`س: كيف يمكنني تحميل ${topic}؟\nج: قم بنسخ رابط المقطع ثم الصقه في المربع واضغط على زر التحميل المباشر.`);
          }
          setIsGenerating(false);
        }, 800);
        return;
      }
    } catch {
      // Fallback
      setTimeout(() => {
        setOutput(`Title: ${topic} - أسرع أداة تحميل مجانية | OmniFetch\nMeta Description: حمل مقاطع ${topic} فوراً بدون علامة مائية وبدقة 1080p/4K.`);
        setIsGenerating(false);
      }, 800);
      return;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    onShowToast('تم نسخ النص المولد!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 text-slate-100">
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span>أدوات الذكاء الاصطناعي للـ SEO والمحتوى (AI Content Suite)</span>
            </h2>
            <p className="text-xs text-slate-400">
              إنشاء العناوين، الأوصاف، المقالات، الكلمات المفتاحية والأسئلة الشائعة فورياً عبر Gemini AI.
            </p>
          </div>
        </div>

        {/* Tool Selectors */}
        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs font-bold overflow-x-auto">
          {[
            { id: 'meta', label: 'توليد Meta Title & Description', icon: Sparkles },
            { id: 'article', label: 'كتابة مقال كامل للـ SEO', icon: FileText },
            { id: 'keywords', label: 'اقتراح الكلمات المفتاحية', icon: Search },
            { id: 'faq', label: 'توليد أسئلة شائعة FAQ', icon: HelpCircle },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTool(t.id as any)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                  activeTool === t.id
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="space-y-3 text-xs pt-2">
          <div>
            <label className="block text-slate-400 mb-1 font-semibold">الموضوع أو الكلمة المفتاحية المستهدفة</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="مثال: تحميل فيديوهات تيك توك بدون علامة مائية"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
            <span>{isGenerating ? 'جاري التوليد بواسطة AI...' : 'توليد المحتوى الآن'}</span>
          </button>
        </div>

        {/* Output Box */}
        {output && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 relative">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span>نتيجة التوليد (AI Generated Output):</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-purple-400 hover:text-purple-300"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'تم النسخ' : 'نسخ النص'}</span>
              </button>
            </div>
            <pre className="text-xs text-emerald-300 font-sans whitespace-pre-wrap leading-relaxed">
              {output}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
