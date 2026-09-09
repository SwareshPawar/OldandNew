self.addEventListener('install', event => {
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    // Drop any caches from earlier versions and take control of open tabs/webclips immediately.
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.map(key => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

const CORE_ASSET_PATTERN = /\.(?:js|css|html)$/i;

self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    const isSameOrigin = url.origin === self.location.origin;
    if (!isSameOrigin || !CORE_ASSET_PATTERN.test(url.pathname)) return;

    // Always go to the network for app code/styles/markup so every device and
    // installed webclip runs the latest version without needing a manual cache clear.
    event.respondWith(fetch(request, { cache: 'no-store' }));
});
