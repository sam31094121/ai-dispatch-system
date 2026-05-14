/* Service Worker — 手機靜態資源快取 */
const CACHE = 'dispatch-mobile-v20260515-v1';
const ASSETS = [
  '/mobile.html',
  '/mobile.css',
  '/cyber-tech.css',
  '/mobile.js',
  '/utils.js',
  '/sync-client.js',
  '/mobile-standard.js'
];

/* 安裝：預先快取所有靜態資源 */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* 啟動：刪除舊版快取 */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* 攔截請求 */
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  /* API / SSE：永遠走網路，不快取 */
  if (url.pathname.startsWith('/api/')) return;

  /* 靜態資源：Cache-First（快取有就用，沒有才抓網路並存入快取）*/
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(cached => {
      if (cached) {
        /* 背景更新（stale-while-revalidate）*/
        fetch(e.request).then(res => {
          if (res && res.ok) {
            caches.open(CACHE).then(c => c.put(e.request, res));
          }
        }).catch(() => {});
        return cached;
      }
      /* 快取沒有：從網路抓，成功就存入快取 */
      return fetch(e.request).then(res => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('/mobile.html'));
    })
  );
});
