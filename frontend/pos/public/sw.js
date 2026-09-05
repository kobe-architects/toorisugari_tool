/* とおりすがりの和紅茶 POS — Service Worker
 * 方針:
 *  - ナビゲーション: network-first(オフライン時はキャッシュ済み index.html)
 *  - 同一スコープの静的アセット(ハッシュ付きJS/CSS等): cache-first
 *  - /api・/storage(動的データ・商品画像)はキャッシュしない
 */
const VERSION = 'pos-v1';
const SCOPE_PATH = new URL(self.registration.scope).pathname; // 例: /toorisugari_tool/pos/
const INDEX_URL = SCOPE_PATH; // SPAシェル

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll([INDEX_URL])).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // 動的データ・画像はSWを素通し(常にネットワーク)
  if (url.pathname.startsWith('/api') || url.pathname.includes('/storage/')) return;

  // SPAナビゲーション: network-first、失敗時はキャッシュのシェル
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((cache) => cache.put(INDEX_URL, copy));
          return res;
        })
        .catch(() => caches.match(INDEX_URL))
    );
    return;
  }

  // スコープ内の静的アセット: cache-first
  if (url.pathname.startsWith(SCOPE_PATH)) {
    event.respondWith(
      caches.match(req).then((hit) => {
        if (hit) return hit;
        return fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((cache) => cache.put(req, copy));
          }
          return res;
        });
      })
    );
  }
});
