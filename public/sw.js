// Cache version — increment on breaking cache changes. O bump invalida os caches antigos
// no 'activate' (deleta tudo que não casa com os nomes atuais).
const CACHE_VERSION = 'v3';
const CACHE_NAME = `lyvest-${CACHE_VERSION}`;
const RUNTIME_CACHE = `lyvest-runtime-${CACHE_VERSION}`;

// Assets to cache immediately (shell only — no JS chunks, they update on every build)
const PRECACHE_URLS = [
    '/',
    '/offline.html',
];

// Install
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())
    )
})

// Activate — delete ALL caches that don't belong to this version
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

    // Skip chrome-extension, Analytics, API, and auth endpoints
    if (
        url.protocol === 'chrome-extension:' ||
        url.href.includes('analytics') ||
        url.href.includes('gtag') ||
        url.href.includes('/api/') ||
        url.href.includes('clerk.com')
    ) return;

    // ── Network-first for JS/CSS chunks ─────────────────────────────────────────
    // _next/static/chunks and _next/static/css change on every build.
    // Using stale-while-revalidate here can serve outdated chunks with wrong
    // MIME types after a deploy, causing "Refused to execute script" console errors.
    // Network-first guarantees fresh chunks; cached copy is a fallback only.
    if (
        url.pathname.startsWith('/_next/static/chunks/') ||
        url.pathname.startsWith('/_next/static/css/')
    ) {
        event.respondWith(
            fetch(event.request)
                .then(networkResponse => {
                    // Only cache successful, same-origin responses
                    if (networkResponse.ok && networkResponse.type === 'basic') {
                        caches.open(RUNTIME_CACHE).then(cache => {
                            cache.put(event.request, networkResponse.clone());
                        });
                    }
                    return networkResponse;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // ── Stale-while-revalidate for immutable static assets (media, fonts, images) ──
    // These assets use content-hashed URLs and never change once deployed.
    if (
        url.pathname.startsWith('/_next/static/media/') ||
        url.pathname.startsWith('/images/') ||
        url.pathname.match(/\.(jpg|jpeg|png|webp|avif|svg|ico|woff2|woff|ttf)$/)
    ) {
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                const fetchPromise = fetch(event.request).then(networkResponse => {
                    if (networkResponse.ok) {
                        caches.open(RUNTIME_CACHE).then(cache => {
                            cache.put(event.request, networkResponse.clone());
                        });
                    }
                    return networkResponse;
                });
                return cachedResponse || fetchPromise;
            })
        );
        return;
    }

    // ── Network-first for navigational pages (HTML) ─────────────────────────────
    // NUNCA servir HTML do cache com a rede disponível: o HTML referencia chunks com
    // hash de build. Servir HTML antigo após um deploy faz o cliente pedir chunks que
    // não existem mais → ChunkLoadError ("Loading chunk N failed"). O cache é usado
    // apenas como fallback offline.
    if (
        url.pathname.startsWith('/categoria/') ||
        url.pathname.startsWith('/produto/') ||
        url.pathname === '/'
    ) {
        event.respondWith(
            fetch(event.request).then(networkResponse => {
                if (networkResponse.status === 200 && networkResponse.type === 'basic') {
                    caches.open(RUNTIME_CACHE).then(cache => {
                        cache.put(event.request, networkResponse.clone());
                    });
                }
                return networkResponse;
            }).catch(() =>
                caches.match(event.request).then(cached => cached || caches.match('/offline.html'))
            )
        );
        return;
    }

    // ── Network-first for everything else (checkout, dashboard, auth) ────────────
    event.respondWith(
        fetch(event.request)
            .then(response => {
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
