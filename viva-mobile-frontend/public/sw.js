self.addEventListener('install', event => {
  self.skipWaiting();
});
self.addEventListener('fetch', event => {
  // Simples: responde com cache ou rede
  event.respondWith(
    caches.open('viva-cache').then(cache =>
      cache.match(event.request).then(response =>
        response || fetch(event.request)
      )
    )
  );
});