import { SupportedLanguage } from '../types';
import { t } from '../i18n/translations';
import { Copy, Link2, Download, ArrowRight } from 'lucide-react';

interface StepsProps {
  currentLang: SupportedLanguage;
}

export function StepsSection({ currentLang }: StepsProps) {
  const steps = [
    {
      icon: <Copy className="w-7 h-7 text-indigo-400" />,
      title: t('step1Title', currentLang),
      desc: t('step1Desc', currentLang),
      number: '01',
    },
    {
      icon: <Link2 className="w-7 h-7 text-purple-400" />,
      title: t('step2Title', currentLang),
      desc: t('step2Desc', currentLang),
      number: '02',
    },
    {
      icon: <Download className="w-7 h-7 text-pink-400" />,
      title: t('step3Title', currentLang),
      desc: t('step3Desc', currentLang),
      number: '03',
    },
  ];

  return (
    <section className="py-12 sm:py-16 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            {t('stepsTitle', currentLang)}
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
            No software installation required. Follow these 3 simple steps on any phone or desktop browser.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="relative p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4 text-center hover:border-slate-700 transition-all"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner">
                {step.icon}
              </div>

              <span className="absolute top-4 right-6 font-mono font-black text-3xl text-slate-800/80">
                {step.number}
              </span>

              <h3 className="text-lg font-bold text-white">{step.title}</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
