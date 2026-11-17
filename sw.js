/* Service Worker · GymPlan
   PARA PUBLICAR UNA VERSIÓN NUEVA: sube los archivos y cambia VERSION (v5.1.0 -> v5.1.1 ...).
   La app instalada muestra "Hay una versión nueva" y, al tocar Actualizar, se recarga.
   El progreso vive en el almacenamiento del teléfono y no se toca al actualizar. */
const VERSION = 'v5.1.0';
const CACHE = 'gymplan-' + VERSION;
const NUCLEO = ['./', './index.html', './styles.css', './maquinas.js', './plan.js', './pict.js', './core.js', './hoy.js', './vistas.js',
  './manifest.json', './icon-192.png', './icon-512.png', './icon-512-maskable.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(NUCLEO)));
});
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k.startsWith('gymplan-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const mismoOrigen = url.origin === self.location.origin;
  const fuente = url.hostname.endsWith('gstatic.com') || url.hostname.endsWith('googleapis.com');
  if (!mismoOrigen && !fuente) return;

  // Navegación: red primero (para ver cambios) y caché si no hay conexión
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(k => k.put('./index.html', c)); return r; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
  // Archivos de la app y fuentes: caché primero (la versión nueva llega con un VERSION nuevo)
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
      if (r.ok || r.type === 'opaque') { const c = r.clone(); caches.open(CACHE).then(k => k.put(e.request, c)); }
      return r;
    }))
  );
});
