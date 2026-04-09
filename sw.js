const CACHE_NAME = 'devadecor-v13';
const NETWORK_FIRST = ['/js/products.json'];
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/products/',
  '/shop/',
  '/journal/',
  '/journal-post/',
  '/journal-bookshelf/',
  '/journal-spring-trends/',
  '/journal-rug-guide/',
  '/journal-lighting-guide/',
  '/journal-small-spaces/',
  '/room-living/',
  '/room-bedroom/',
  '/room-dining/',
  '/contact/',
  '/privacy/',
  '/404/',
  '/css/styles.css',
  '/css/pages/product.css',
  '/css/pages/shop.css',
  '/css/pages/journal.css',
  '/css/pages/contact.css',
  '/js/app.js',
  '/js/product.js',
  '/js/products.json',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isNetworkFirst = NETWORK_FIRST.some(p => url.pathname.endsWith(p));

  if (isNetworkFirst) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
