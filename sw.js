var CACHE = 'ungal-aasiriyar-v5';
var SHELL = 'student-v3.html';

var ASSETS = [
  '/student-v3.html',
  '/app.js',
  '/manifest.json',
  '/20260315_085358.png',
  '/sw.js'
];

// Install — cache all assets
self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(ASSETS);
    }).catch(function(err) {
      console.warn('SW install cache error:', err);
    })
  );
});

// Activate — remove old caches
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch — serve from cache, fallback to network
// KEY FIX: navigate requests always return student-v3.html (SPA routing)
self.addEventListener('fetch', function(e) {
  var req = e.request;

  // Navigation request (app open / page reload) → serve shell
  if (req.mode === 'navigate') {
    e.respondWith(
      caches.match('/student-v3.html').then(function(cached) {
        return cached || fetch('/student-v3.html');
      })
    );
    return;
  }

  // Assets — cache first, then network
  e.respondWith(
    caches.match(req).then(function(cached) {
      if (cached) return cached;
      return fetch(req).then(function(res) {
        if (res && res.status === 200 && !req.url.includes('firebasejs')) {
          var clone = res.clone();
          caches.open(CACHE).then(function(c) {
            c.put(req, clone);
          });
        }
        return res;
      }).catch(function() {
        if (req.destination === 'document') {
          return caches.match('/student-v3.html');
        }
      });
    })
  );
});
