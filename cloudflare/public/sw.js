// Service worker for the Music Directory PWA.
// Static assets are cached (cache-first); pages always go to the network
// (network-only), so logged-in / dynamic content is never served stale.
// The VERSION is replaced with the build id at deploy time, so every deploy
// is detected as an update and the app can offer "tap to refresh".

const VERSION = '__BUILD_VERSION__';
const CACHE = 'muzik-' + VERSION;
const ASSETS = [
  '/css/styles.css',
  '/css/fonts.css',
  '/js/main.js',
  '/fonts/material-symbols-subset.woff2',
  '/fonts/rubik-latin.woff2',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/manifest.webmanifest',
];

self.addEventListener('install', (e) => {
  // Do NOT skipWaiting here: let the page tell us when to apply the update.
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).catch(() => {}));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// The page posts this when the user taps "update now".
self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // Static assets → cache-first (fast, offline-friendly).
  if (/\.(?:css|js|woff2|png|svg|ico|webmanifest)$/.test(url.pathname) || url.pathname.startsWith('/icons/')) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return resp;
      }))
    );
    return;
  }

  // Pages / API → network only (never cache dynamic or logged-in content).
  e.respondWith(
    fetch(req).catch(() =>
      new Response(
        '<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">' +
        '<div style="font-family:system-ui;padding:40px;text-align:center;color:#444">' +
        '<h2>You\'re offline</h2><p>Reconnect to the internet and try again.</p></div>',
        { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 503 }
      )
    )
  );
});
