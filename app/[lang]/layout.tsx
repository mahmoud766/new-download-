import React from 'react';
import Script from 'next/script';
import { prisma } from '@/lib/prisma';

export async function generateStaticParams() {
  return [
    { lang: 'en' },
    { lang: 'ar' },
    { lang: 'es' },
    { lang: 'pt' },
    { lang: 'hi' },
  ];
}

async function getGlobalSettings() {
  try {
    const settings = await prisma.globalSettings.findUnique({
      where: { id: 'default' },
    });
    return (
      settings || {
        adsenseClientId: 'ca-pub-1234567890000000',
        googleAnalyticsId: 'G-XXXXXXXXXX',
        trustpilotUrl: 'https://www.trustpilot.com/review/omnifetchpro.com',
      }
    );
  } catch {
    return {
      adsenseClientId: 'ca-pub-1234567890000000',
      googleAnalyticsId: 'G-XXXXXXXXXX',
      trustpilotUrl: 'https://www.trustpilot.com/review/omnifetchpro.com',
    };
  }
}

export const revalidate = 86400;

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  const isRtl = params.lang === 'ar';
  const settings = await getGlobalSettings();

  return (
    <html lang={params.lang} dir={isRtl ? 'rtl' : 'ltr'}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4f46e5" />
      </head>
      <body className="bg-slate-950 text-slate-100 antialiased font-sans selection:bg-indigo-500 selection:text-white min-h-screen">
        {children}

        {/* Google AdSense Script - Injected Lazily for SSG/ISR */}
        {settings.adsenseClientId && (
          <Script
            id={`adsense-init-${params.lang}`}
            strategy="lazyOnload"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${settings.adsenseClientId}`}
            crossOrigin="anonymous"
          />
        )}

        {/* Google Analytics GA4 Script - Injected Lazily for SSG/ISR */}
        {settings.googleAnalyticsId && (
          <>
            <Script
              id={`ga-gtag-src-${params.lang}`}
              strategy="lazyOnload"
              src={`https://www.googletagmanager.com/gtag/js?id=${settings.googleAnalyticsId}`}
            />
            <Script id={`ga-gtag-inline-${params.lang}`} strategy="lazyOnload">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${settings.googleAnalyticsId}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}

