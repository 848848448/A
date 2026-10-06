// Service worker for the Music Directory PWA.
// Static assets are cached (cache-first); pages always go to the network
// (network-only), so logged-in / dynamic content is never served stale.

const CACHE = 'muzik-v1';
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
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
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
  // Offline, show a minimal message.
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
