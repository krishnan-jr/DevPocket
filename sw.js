'use strict';

const CACHE_VERSION = 'devpocket-v2';

const LOCAL_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './tools-text.js',
  './tools-encoding.js',
  './tools-json.js',
  './tools-jwt.js',
  './tools-dev.js',
  './tools-web.js',
  './tools-file.js',
  './tools-api.js',
  './manifest.json',
  './icons/icon.svg',
];

const CDN_ASSETS = [
  'https://unpkg.com/lucide@latest/dist/umd/lucide.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/js-yaml/4.1.0/js-yaml.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/marked/9.1.6/marked.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jsdiff/5.1.0/diff.min.js',
];

// ---- Install: pre-cache all assets ----
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache =>
      Promise.allSettled([
        cache.addAll(LOCAL_ASSETS),
        ...CDN_ASSETS.map(url =>
          fetch(url, { mode: 'cors', credentials: 'omit' })
            .then(res => res.ok ? cache.put(url, res.clone()) : null)
            .catch(() => null)
        ),
      ])
    ).then(() => self.skipWaiting())
  );
});

// ---- Activate: delete old caches ----
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ---- Fetch: cache-first for local, stale-while-revalidate for CDN ----
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  const isLocal = url.origin === self.location.origin;
  const isCDN   = CDN_ASSETS.includes(request.url);

  if (isLocal) {
    // Cache-first: serve from cache, fall back to network
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          if (!res || res.status !== 200) return res;
          const clone = res.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(request, clone));
          return res;
        });
      })
    );
  } else if (isCDN) {
    // Stale-while-revalidate: serve cache immediately, update in background
    event.respondWith(
      caches.open(CACHE_VERSION).then(cache =>
        cache.match(request).then(cached => {
          const fetchPromise = fetch(request.url, { mode: 'cors', credentials: 'omit' }).then(res => {
            if (res && res.ok) cache.put(request, res.clone());
            return res;
          }).catch(() => null);
          return cached || fetchPromise.then(res =>
            res || new Response('', { status: 504, statusText: 'CDN unavailable' })
          );
        })
      )
    );
  }
});
