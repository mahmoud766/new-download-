import React from 'react';
import { HeroDownloader } from '../../../src/components/HeroDownloader';
import { Navbar } from '../../../src/components/Navbar';
import { Footer } from '../../../src/components/Footer';
import { PlatformCards } from '../../../src/components/PlatformCards';
import { StepsSection } from '../../../src/components/StepsSection';
import { FeaturesSection } from '../../../src/components/FeaturesSection';
import { FAQSection } from '../../../src/components/FAQSection';
import { SupportedLanguage, PlatformSlug } from '../../../src/types';

export const platformsList = [
  'tiktok-no-watermark',
  'facebook-reels-to-mp4',
  'youtube-shorts-to-mp3',
  'instagram-reels-downloader',
  'twitter-video-download',
];

export const localesList = ['en', 'ar', 'es', 'pt', 'hi'];

export async function generateStaticParams() {
  const params: { lang: string; platform: string }[] = [];
  for (const lang of localesList) {
    for (const platform of platformsList) {
      params.push({ lang, platform });
    }
  }
  return params;
}

const seoTitles: Record<string, Record<string, { h1: string; metaTitle: string; metaDesc: string; platformSlug: PlatformSlug }>> = {
  'tiktok-no-watermark': {
    en: {
      h1: 'Free TikTok Video Downloader Without Watermark',
      metaTitle: 'TikTok Downloader - Download TikTok Videos Without Watermark HD',
      metaDesc: 'Fast & free TikTok video downloader. Download TikTok videos without watermark in HD MP4 & MP3.',
      platformSlug: 'tiktok',
    },
    ar: {
      h1: 'تحميل فيديوهات تيك توك بدون علامة مائية HD مجاناً',
      metaTitle: 'تحميل تيك توك بدون علامة مائية - أداة تنزيل فيديوهات TikTok بضغطة زر',
      metaDesc: 'أسرع موقع تحميل تيك توك بدون علامة مائية بجودة عالية MP4 و MP3 مجاناً وبدون تسجيل.',
      platformSlug: 'tiktok',
    },
    es: {
      h1: 'Descargar Vídeos de TikTok Sin Marca de Agua Gratis',
      metaTitle: 'Descargar TikTok Sin Marca de Agua - Descargador de Vídeos HD',
      metaDesc: 'Descarga vídeos de TikTok sin marca de agua en HD MP4 y MP3 de forma rápida y gratuita.',
      platformSlug: 'tiktok',
    },
    pt: {
      h1: 'Baixar Vídeos do TikTok Sem Marca d\'Água Grátis',
      metaTitle: 'Baixar TikTok Sem Marca d\'Água - Downloads em HD MP4',
      metaDesc: 'Baixe vídeos do TikTok sem marca d\'água em HD MP4 e MP3 com rapidez e segurança.',
      platformSlug: 'tiktok',
    },
    hi: {
      h1: 'बिना वाटरमार्क के मुफ़्त TikTok वीडियो डाउनलोडर',
      metaTitle: 'TikTok वीडियो डाउनलोडर - बिना वाटरमार्क के HD MP4 डाउनलोड करें',
      metaDesc: 'TikTok से बिना वाटरमार्क के HD MP4 और MP3 वीडियो तुरंत डाउनलोड करें।',
      platformSlug: 'tiktok',
    },
  },
  'facebook-reels-to-mp4': {
    en: {
      h1: 'Facebook Reels & Video Downloader to MP4 HD',
      metaTitle: 'Facebook Reels Downloader - Download FB Videos to MP4',
      metaDesc: 'Download Facebook Reels and private/public videos in 1080p Full HD MP4 instantly.',
      platformSlug: 'facebook-reels',
    },
    ar: {
      h1: 'تحميل ريلز وفيديوهات فيسبوك بصيغة MP4 بجودة عالية',
      metaTitle: 'تحميل ريلز فيسبوك MP4 - تنزيل مقاطع Facebook Reels HD',
      metaDesc: 'برنامج تحميل ريلز وفيديوهات الفيسبوك بجودة 1080p MP4 و MP3 مجاناً بدون برامج.',
      platformSlug: 'facebook-reels',
    },
    es: {
      h1: 'Descargar Reels y Vídeos de Facebook en MP4 HD',
      metaTitle: 'Descargador de Facebook Reels a MP4 - Alta Calidad 1080p',
      metaDesc: 'Descarga Reels y vídeos de Facebook en MP4 Full HD de forma fácil y sin registro.',
      platformSlug: 'facebook-reels',
    },
    pt: {
      h1: 'Baixar Reels e Vídeos do Facebook em MP4 HD',
      metaTitle: 'Baixar Facebook Reels para MP4 - Alta Qualidade HD',
      metaDesc: 'Baixe Reels e vídeos do Facebook em MP4 Full HD de maneira rápida e ilimitada.',
      platformSlug: 'facebook-reels',
    },
    hi: {
      h1: 'Facebook रील्स और वीडियो MP4 HD में डाउनलोड करें',
      metaTitle: 'Facebook रील्स डाउनलोडर - FB वीडियो MP4 में सेव करें',
      metaDesc: 'Facebook रील्स और वीडियो को तुरंत 1080p Full HD MP4 फॉर्मेट में डाउनलोड करें।',
      platformSlug: 'facebook-reels',
    },
  },
  'youtube-shorts-to-mp3': {
    en: {
      h1: 'Convert YouTube Shorts & Videos to MP3 320kbps',
      metaTitle: 'YouTube Shorts to MP3 Converter - Free Audio Extractor',
      metaDesc: 'Extract high quality 320kbps audio from YouTube Shorts and long videos in 1 click.',
      platformSlug: 'youtube-shorts',
    },
    ar: {
      h1: 'تحويل شورتس وفيديوهات يوتيوب إلى MP3 بجودة 320kbps',
      metaTitle: 'تحميل يوتيوب شورتس MP3 - محول صوتيات يوتيوب سريع',
      metaDesc: 'أسرع محول يوتيوب إلى MP3. استخرج الصوت من مقاطع YouTube Shorts بجودة فائقة 320kbps.',
      platformSlug: 'youtube-shorts',
    },
    es: {
      h1: 'Convertir YouTube Shorts a MP3 en 320kbps Gratis',
      metaTitle: 'Convertidor de YouTube Shorts a MP3 - Descargar Audio HD',
      metaDesc: 'Extrae audio de alta calidad 320kbps de YouTube Shorts y vídeos largos gratis.',
      platformSlug: 'youtube-shorts',
    },
    pt: {
      h1: 'Converter YouTube Shorts para MP3 em 320kbps Grátis',
      metaTitle: 'Conversor de YouTube Shorts para MP3 - Áudio de Alta Qualidade',
      metaDesc: 'Extraia áudio em 320kbps de vídeos e Shorts do YouTube com alta fidelidade.',
      platformSlug: 'youtube-shorts',
    },
    hi: {
      h1: 'YouTube Shorts को MP3 320kbps में कन्वर्ट और डाउनलोड करें',
      metaTitle: 'YouTube Shorts to MP3 कन्वर्टर - मुफ़्त ऑडियो एक्सट्रैक्टर',
      metaDesc: 'YouTube Shorts और वीडियो से उच्च गुणवत्ता वाला 320kbps MP3 ऑडियो डाउनलोड करें।',
      platformSlug: 'youtube-shorts',
    },
  },
  'instagram-reels-downloader': {
    en: {
      h1: 'Instagram Reels & Story Downloader HD MP4',
      metaTitle: 'Instagram Reels Downloader - Save IG Videos & Stories',
      metaDesc: 'Download Instagram Reels, stories, and video posts in original HD quality.',
      platformSlug: 'instagram-reels',
    },
    ar: {
      h1: 'تحميل ريلز واستوري إنستغرام بجودة عالية بدون تطبيق',
      metaTitle: 'تحميل ريلز إنستغرام - أداة تنزيل مقاطع Instagram Reels HD',
      metaDesc: 'قم بتحميل ريلز وفيديوهات وبوستات إنستغرام بجودة عالية وبدون علامة مائية بنقرة واحدة.',
      platformSlug: 'instagram-reels',
    },
    es: {
      h1: 'Descargar Reels e Historias de Instagram en HD MP4',
      metaTitle: 'Descargador de Instagram Reels - Guardar Vídeos de IG',
      metaDesc: 'Descarga Reels, historias y publicaciones de vídeo de Instagram en calidad original HD.',
      platformSlug: 'instagram-reels',
    },
    pt: {
      h1: 'Baixar Reels e Stories do Instagram em HD MP4',
      metaTitle: 'Baixador de Instagram Reels - Salvar Vídeos e Stories',
      metaDesc: 'Baixe Reels, histórias e vídeos do Instagram em qualidade original HD gratuitamente.',
      platformSlug: 'instagram-reels',
    },
    hi: {
      h1: 'Instagram रील्स और स्टोरी डाउनलोडर HD MP4',
      metaTitle: 'Instagram रील्स डाउनलोडर - IG वीडियो और स्टोरी सेव करें',
      metaDesc: 'Instagram रील्स, स्टोरी और वीडियो पोस्ट को ओरिजिनल HD क्वालिटी में डाउनलोड करें।',
      platformSlug: 'instagram-reels',
    },
  },
  'twitter-video-download': {
    en: {
      h1: 'Download Twitter (X) Videos & GIFs to MP4',
      metaTitle: 'Twitter Video Downloader - Save X Videos to MP4 HD',
      metaDesc: 'Download Twitter (X) videos and animated GIFs directly to mobile or desktop.',
      platformSlug: 'twitter',
    },
    ar: {
      h1: 'تحميل فيديوهات وصور تويتر (X) بجودة عالية MP4',
      metaTitle: 'تحميل فيديوهات تويتر - تنزيل مقاطع X Twitter HD',
      metaDesc: 'تحميل مقاطع تويتر (X) والمتحركة GIF بجودة عالية MP4 مباشرة للهاتف والكمبيوتر.',
      platformSlug: 'twitter',
    },
    es: {
      h1: 'Descargar Vídeos y GIFs de Twitter (X) en MP4',
      metaTitle: 'Descargador de Vídeos de Twitter (X) - MP4 HD',
      metaDesc: 'Descarga vídeos y GIFs animados de Twitter (X) directamente a tu dispositivo.',
      platformSlug: 'twitter',
    },
    pt: {
      h1: 'Baixar Vídeos e GIFs do Twitter (X) em MP4',
      metaTitle: 'Baixador de Vídeos do Twitter (X) - Guardar em MP4 HD',
      metaDesc: 'Baixe vídeos e GIFs animados do Twitter (X) diretamente para o seu celular ou PC.',
      platformSlug: 'twitter',
    },
    hi: {
      h1: 'Twitter (X) वीडियो और GIFs MP4 में डाउनलोड करें',
      metaTitle: 'Twitter वीडियो डाउनलोडर - X वीडियो MP4 HD में सेव करें',
      metaDesc: 'Twitter (X) वीडियो और ऐनिमेटेड GIFs सीधे अपने डिवाइस पर डाउनलोड करें।',
      platformSlug: 'twitter',
    },
  },
};

export default function PlatformSeoPage({ params }: { params: { lang: string; platform: string } }) {
  const currentLang = (localesList.includes(params.lang) ? params.lang : 'en') as SupportedLanguage;
  const slugData = seoTitles[params.platform]?.[currentLang] || seoTitles[params.platform]?.['en'] || {
    h1: 'Universal High-Speed Video Downloader',
    metaTitle: 'OmniFetch Pro - Universal Video Downloader',
    metaDesc: 'Download HD videos & MP3 audio from any social media platform.',
    platformSlug: 'all' as PlatformSlug,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <div>
        <Navbar
          currentLang={currentLang}
          onSelectLang={() => {}}
          currentPlatform={slugData.platformSlug}
          onSelectPlatform={() => {}}
          theme="dark"
          onToggleTheme={() => {}}
          onOpenHistory={() => {}}
          onOpenAdmin={() => {}}
          onOpenBlog={() => {}}
          onOpenAiStudio={() => {}}
          onOpenLegal={() => {}}
          historyCount={0}
        />

        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Custom Dynamic Header Injection for Programmatic SEO */}
          <div className="text-center my-6 max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-3 bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
              {slugData.h1}
            </h1>
            <p className="text-slate-300 text-sm sm:text-base font-medium max-w-2xl mx-auto">
              {slugData.metaDesc}
            </p>
          </div>

          {/* Reused HeroDownloader with dynamically bound platform */}
          <HeroDownloader
            currentLang={currentLang}
            currentPlatform={slugData.platformSlug}
            onSelectPlatform={() => {}}
            onResultFetched={() => {}}
            onError={() => {}}
            onReset={() => {}}
          />

          <div className="mt-12">
            <StepsSection currentLang={currentLang} />
            <PlatformCards currentLang={currentLang} onSelectPlatform={() => {}} />
            <FeaturesSection currentLang={currentLang} />
            <FAQSection currentLang={currentLang} platform={slugData.platformSlug} />
          </div>
        </main>
      </div>

      <Footer
        currentLang={currentLang}
        onSelectLang={() => {}}
        onSelectPlatform={() => {}}
        onOpenLegal={() => {}}
        onOpenBlog={() => {}}
        onOpenAdmin={() => {}}
      />
    </div>
  );
}
