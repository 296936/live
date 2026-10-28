const instance = new URL(self.location.href).searchParams.get('inst');
const cacheName = `vcard:${encodeURIComponent(instance)}:media-v1`;
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || !/\/usr\/(?:list_[^/]+\/.*\.mp3|texts\/[^/]+\.json)$/i.test(url.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(url.href);
    if (!cached?.ok || cached.status !== 200) return fetch(request);
    const range = request.headers.get('Range');
    if (!range) return cached;
    const match = /^bytes=(\d*)-(\d*)$/i.exec(range);
    if (!match || (!match[1] && !match[2])) return fetch(request);
    const blob = await cached.blob();
    const size = blob.size;
    const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
    const end = match[1] ? (match[2] ? Math.min(Number(match[2]), size - 1) : size - 1) : size - 1;
    if (start >= size || start > end) return new Response(null, {status:416, headers:{'Content-Range':`bytes */${size}`}});
    return new Response(blob.slice(start, end + 1), {status:206, headers:{
      'Content-Type':cached.headers.get('Content-Type') || 'audio/mpeg',
      'Content-Range':`bytes ${start}-${end}/${size}`, 'Content-Length':String(end - start + 1), 'Accept-Ranges':'bytes',
    }});
  })().catch(() => fetch(request)));
});
