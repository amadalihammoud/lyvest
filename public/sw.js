const CACHE_NAME = 'lyvest-v1';
const RUNTIME_CACHE = 'lyvest-runtime';

// Assets to cache immediately
const PRECACHE_URLS = [
    '/',
    '/offline.html',
    '/logo.svg',
];

// Install
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())
    )
})

// Activate
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME && name !== RUNTIME_CACHE)
                    .map(name => caches.delete(name))
            )
        }).then(() => self.clients.claim())
    )
})

// Fetch Strategy
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip chrome-extension, internal-extension, Analytics, and API inputs
    if (
        url.protocol === 'chrome-extension:' ||
        url.href.includes('analytics') ||
        url.href.includes('gtag') ||
        url.href.includes('/api/') ||
        url.href.includes('clerk.com') // Don't cache auth aggressively
    ) return;

    // Stale-while-revalidate for Next.js static assets and images
    if (
        url.pathname.startsWith('/_next/static/') ||
        url.pathname.startsWith('/images/') ||
        url.pathname.match(/\.(jpg|jpeg|png|webp|avif|svg|ico)$/)
    ) {
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                const fetchPromise = fetch(event.request).then(networkResponse => {
                    caches.open(RUNTIME_CACHE).then(cache => {
                        cache.put(event.request, networkResponse.clone());
                    });
                    return networkResponse;
                });
                return cachedResponse || fetchPromise;
            })
        );
        return;
    }

    // Network First for everything else (HTML pages)
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Cache successful responses
                if (response.status === 200 && response.type === 'basic') {
                    const responseClone = response.clone();
                    caches.open(RUNTIME_CACHE).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                return caches.match(event.request).then(response => {
                    return response || caches.match('/offline.html');
                });
            })
    );
});
