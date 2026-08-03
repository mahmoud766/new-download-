import { useState, useEffect } from 'react';
import { SupportedLanguage, FAQItem, PlatformSlug } from '../types';
import { getFaqsConfig } from '../lib/storage';
import { t } from '../i18n/translations';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FAQProps {
  currentLang: SupportedLanguage;
  platform?: PlatformSlug | 'general';
}

export function FAQSection({ currentLang, platform = 'general' }: FAQProps) {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    const allFaqs = getFaqsConfig();
    const filtered = allFaqs.filter((f) => f.platform === 'general' || f.platform === platform);
    setFaqs(filtered.length > 0 ? filtered : allFaqs);
  }, [platform]);

  // Schema.org FAQPage payload
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question[currentLang] || f.question.en,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer[currentLang] || f.answer.en,
      },
    })),
  };

  return (
    <section className="py-12 sm:py-16 relative">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-bold border border-indigo-500/20">
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            {t('faqTitle', currentLang)}
          </h2>
          <p className="text-sm text-slate-400">
            Find quick answers to common questions about downloading social media videos.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            const questionText = faq.question[currentLang] || faq.question.en;
            const answerText = faq.answer[currentLang] || faq.answer.en;

            return (
              <div
                key={faq.id || idx}
                className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden transition-all shadow-md"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full px-5 py-4 text-left font-bold text-sm sm:text-base text-white hover:text-indigo-300 flex items-center justify-between gap-4"
                >
                  <span>{questionText}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-indigo-400 flex-shrink-0 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/80 pt-3">
                    {answerText}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
