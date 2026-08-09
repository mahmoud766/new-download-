import { useState, useEffect } from 'react';
import { SupportedLanguage, PlatformSlug } from '../types';
import { PLATFORMS_CONFIG } from '../config/siteConfig';
import { t } from '../i18n/translations';
import { getGlobalSeoConfig, fetchGlobalSeoFromDb } from '../lib/adminStorage';

interface SeoProps {
  platform?: PlatformSlug;
  language: SupportedLanguage;
  pageTitle?: string;
  pageDescription?: string;
  customCanonicalUrl?: string;
}

export function SeoHead({ platform = 'all', language, pageTitle, pageDescription, customCanonicalUrl }: SeoProps) {
  const [globalSeo, setGlobalSeo] = useState(getGlobalSeoConfig());

  useEffect(() => {
    fetchGlobalSeoFromDb().then((seo) => {
      if (seo) setGlobalSeo(seo);
    });

    const handleSeoUpdated = (e: CustomEvent) => {
      if (e.detail) setGlobalSeo(e.detail);
    };

    window.addEventListener('omnifetch_seo_updated', handleSeoUpdated as EventListener);
    return () => {
      window.removeEventListener('omnifetch_seo_updated', handleSeoUpdated as EventListener);
    };
  }, []);

  const platformInfo = PLATFORMS_CONFIG[platform] || PLATFORMS_CONFIG.all;

  const title = pageTitle || (platform === 'all' && globalSeo.metaTitle ? globalSeo.metaTitle : (platformInfo.titleTemplate[language] || t('siteTitle', language)));
  const description = pageDescription || (platform === 'all' && globalSeo.metaDescription ? globalSeo.metaDescription : (platformInfo.subtitle[language] || t('siteSubtitle', language)));
  
  // Enforce canonical domain https://omnifetchpro.com
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const canonicalBase = 'https://omnifetchpro.com';
  const canonicalUrl = customCanonicalUrl || (platform === 'all' ? `${canonicalBase}${currentPath === '/' ? '' : currentPath}` : `${canonicalBase}/${platform}`);

  useEffect(() => {
    // Update Document Title
    document.title = title;

    // Helper function to update/create meta tag
    const setMeta = (attrName: string, attrVal: string, contentVal: string) => {
      if (!contentVal) return;
      let el = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute('content', contentVal);
    };

    setMeta('name', 'description', description);
    if (globalSeo.keywords) {
      setMeta('name', 'keywords', globalSeo.keywords);
    }
    if (globalSeo.robotsDirective) {
      setMeta('name', 'robots', globalSeo.robotsDirective);
    }

    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    if (globalSeo.ogImage) {
      setMeta('property', 'og:image', globalSeo.ogImage);
    }
    setMeta('property', 'og:url', canonicalUrl);

    if (globalSeo.twitterHandle) {
      setMeta('name', 'twitter:site', globalSeo.twitterHandle);
    }

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);
  }, [title, description, canonicalUrl, globalSeo]);

  // Generate WebApplication & GEO Schema JSON-LD
  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'OmniFetch Pro',
    url: 'https://omnifetchpro.com',
    description: 'Universal online video downloader for TikTok, YouTube, Instagram, and Facebook. Download MP4 without watermark and MP3 audio for free.',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'TikTok video downloader no watermark',
      'YouTube to MP3 converter',
      'Instagram Reels downloader',
      'Fast and free',
    ],
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: window.location.origin,
      },
      ...(platform !== 'all'
        ? [
            {
              '@type': 'ListItem',
              position: 2,
              name: platformInfo.name,
              item: canonicalUrl,
            },
          ]
        : []),
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {globalSeo.organizationSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: globalSeo.organizationSchema }} />
      )}
      {globalSeo.websiteSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: globalSeo.websiteSchema }} />
      )}
    </>
  );
}
