/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/api/download',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
        ],
      },
    ];
  },
};

// PWA configuration using @ducanh2912/next-pwa
// Bypasses /api/download endpoints to prevent caching massive video streams
let withPWA;
try {
  withPWA = require('@ducanh2912/next-pwa').default({
    dest: 'public',
    cacheOnFrontEndNav: true,
    reloadOnOnline: true,
    swcMinify: true,
    disable: process.env.NODE_ENV === 'development',
    workboxOptions: {
      disableDevLogs: true,
      runtimeCaching: [
        {
          urlPattern: /^\/api\/download.*/i,
          handler: 'NetworkOnly', // Exclude video stream proxy from service worker cache
        },
        {
          urlPattern: /^\/api\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            expiration: {
              maxEntries: 32,
              maxAgeSeconds: 86400,
            },
          },
        },
        {
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?)$/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'static-media-cache',
            expiration: {
              maxEntries: 128,
              maxAgeSeconds: 2592000,
            },
          },
        },
      ],
    },
  });
} catch (e) {
  withPWA = (config) => config;
}

module.exports = withPWA(nextConfig);
