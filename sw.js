// perrito BPM — cacheo offline.
// La primera apertura (con internet) guarda la app; después, sin conexión, abre desde el caché.
const CACHE = 'perrito-bpm-c5fc6152';
const FILES = ['./', './index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Red primero: con internet siempre abre la última versión y actualiza la copia guardada.
// Sin red (o si tarda más de 3 s, como en una cabina con mala señal), abre la copia guardada (ignorando ?v=N).
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const cached = () => caches.match(e.request, { ignoreSearch: true })
    .then(hit => hit || caches.match('./index.html'))
    .then(hit => hit || Promise.reject(new Error('sin red y sin copia guardada')));
  const net = fetch(e.request).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request.url.split('?')[0], copy)); }
    return res;
  });
  e.respondWith(Promise.race([net, new Promise((_, no) => setTimeout(no, 3000))]).catch(() => cached().catch(() => net)));
});
