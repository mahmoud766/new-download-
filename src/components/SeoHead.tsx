import { useEffect } from 'react';
import { SupportedLanguage, PlatformSlug } from '../types';
import { PLATFORMS_CONFIG } from '../config/siteConfig';
import { t } from '../i18n/translations';
import { getGlobalSeoConfig } from '../lib/adminStorage';

interface SeoProps {
  platform?: PlatformSlug;
  language: SupportedLanguage;
  pageTitle?: string;
  pageDescription?: string;
}

export function SeoHead({ platform = 'all', language, pageTitle, pageDescription }: SeoProps) {
  const globalSeo = getGlobalSeoConfig();
  const platformInfo = PLATFORMS_CONFIG[platform] || PLATFORMS_CONFIG.all;

  const title = pageTitle || (platform === 'all' && globalSeo.metaTitle ? globalSeo.metaTitle : (platformInfo.titleTemplate[language] || t('siteTitle', language)));
  const description = pageDescription || (platform === 'all' && globalSeo.metaDescription ? globalSeo.metaDescription : (platformInfo.subtitle[language] || t('siteSubtitle', language)));
  const canonicalUrl = platform === 'all' && globalSeo.canonicalUrl ? globalSeo.canonicalUrl : `${window.location.origin}${platform === 'all' ? '' : '/' + platform}`;

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

  // Generate WebApplication & FAQ Schema JSON-LD
  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: title,
    url: canonicalUrl,
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Windows, macOS, Android, iOS, Linux',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
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
    </>
  );
}
