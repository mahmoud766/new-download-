// OmniFetch Pro
import React from 'react';
import Script from 'next/script';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DEFAULT_SETTINGS = {
  adsenseClientId: 'ca-pub-1234567890000000',
  googleAnalyticsId: 'G-XXXXXXXXXX',
  trustpilotUrl: 'https://www.trustpilot.com/review/omnifetchpro.com',
};

async function getGlobalSettings() {
  try {
    const settings = await prisma.globalSettings.findUnique({
      where: { id: 'default' },
    });
    if (settings) {
      return settings;
    }
  } catch (err) {
    console.warn('[Layout] Failed to load settings from Prisma, using fallback defaults:', err);
  }
  return DEFAULT_SETTINGS;
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getGlobalSettings();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4f46e5" />
      </head>
      <body className="bg-slate-950 text-slate-100 antialiased font-sans selection:bg-indigo-500 selection:text-white min-h-screen">
        {children}

        {/* Google AdSense Script */}
        {settings.adsenseClientId && (
          <Script
            id="adsense-init"
            strategy="lazyOnload"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${settings.adsenseClientId}`}
            crossOrigin="anonymous"
          />
        )}

        {/* Google Analytics GA4 Script */}
        {settings.googleAnalyticsId && (
          <>
            <Script
              id="ga-gtag-src"
              strategy="lazyOnload"
              src={`https://www.googletagmanager.com/gtag/js?id=${settings.googleAnalyticsId}`}
            />
            <Script id="ga-gtag-inline" strategy="lazyOnload">
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

