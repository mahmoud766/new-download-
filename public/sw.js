// OmniFetch Pro - Offline Service Worker Engine
const CACHE_NAME = 'omnifetch-pwa-v1';
const MEDIA_CACHE_NAME = 'omnifetch-media-v1';

// Essential static assets to cache for offline app shell
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install Event - Pre-cache App Shell & Static Assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching offline app shell');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Pre-cache warning:', err);
      });
    })
  );
});

// Activate Event - Clean up stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME && cache !== MEDIA_CACHE_NAME) {
              console.log('[SW] Deleting legacy cache:', cache);
              return caches.delete(cache);
            }
          })
        );
      }),
    ])
  );
});

// Helper to check if request is an API or video stream/download
function isApiOrMediaRequest(url) {
  return (
    url.includes('/api/') ||
    url.endsWith('.mp4') ||
    url.endsWith('.mp3') ||
    url.includes('w3.org') ||
    url.includes('zencdn.net') ||
    url.includes('unsplash.com')
  );
}

// Fetch Event - Smart Caching Strategy
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = request.url;

  // Ignore non-GET requests (or POST /api/fetch which we handle specially if offline)
  if (request.method === 'POST' && url.includes('/api/fetch')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Cache successful API fetch responses for offline re-use
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request.url, responseClone));
          return networkResponse;
        })
        .catch(async () => {
          // Network failed (Offline) - Return offline error response
          return new Response(
            JSON.stringify({
              success: false,
              isOfflineMode: true,
              error: 'أنت غير متصل بالإنترنت حالياً. يلزم الاتصال بالشبكة لاستخراج وتنزيل المقاطع المباشرة.',
            }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
    );
    return;
  }

  if (request.method !== 'GET') return;

  // Handle Navigation / HTML requests: Network First with Cache Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, resClone));
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedRes) => {
            return cachedRes || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // Handle Video / Media Stream requests & API downloads: Cache First or Stale-While-Revalidate
  if (isApiOrMediaRequest(url)) {
    event.respondWith(
      caches.open(MEDIA_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => cachedResponse);

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Handle Static Assets (JS, CSS, Images, Fonts): Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
          }
          return networkResponse;
        })
        .catch((err) => {
          console.warn('[SW] Offline asset fetch failed:', err);
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});
