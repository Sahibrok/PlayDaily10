/* PlayDaily10 offline service worker (v3).
   Pages: network-first, so new deploys appear immediately when online.
   Assets: stale-while-revalidate, so repeat visits are instant.
   Challenge URLs contain query strings, so page cache keys are normalized
   without the query; the document still keeps its original URL in the tab. */
const CACHE = "playdaily10-v3";
const CACHE_PREFIX = "playdaily10-";
const ASSETS = [
  "./", "./index.html", "./404.html", "./manifest.webmanifest",
  "./assets/style.css", "./assets/engine.js",
  "./assets/icon-192.png", "./assets/icon-512.png", "./assets/icon-maskable-512.png",
  "./games/blockfit.html", "./games/mergemelon.html", "./games/perfect-circle.html",
  "./games/colorsort.html", "./games/tapfly.html", "./games/stackup.html",
  "./games/match3.html", "./games/snake.html", "./games/stop5000.html",
  "./games/mini-sudoku.html"
];

function cleanPageUrl(request) {
  const url = new URL(request.url);
  url.search = "";
  url.hash = "";
  return url.href;
}

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      // Cache what we can; one failed file must not block installability.
      .then(cache => Promise.allSettled(ASSETS.map(url => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      // Only remove this app's old caches; other apps may share this origin.
      .then(keys => Promise.all(keys.filter(k => k.startsWith(CACHE_PREFIX) && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  const isPage = request.mode === "navigate" || (request.headers.get("accept") || "").includes("text/html");
  if (isPage) {
    const cacheKey = cleanPageUrl(request);
    event.respondWith(
      fetch(request)
        .then(response => {
          // Do not store redirected navigation responses; serving one from
          // cache later can be rejected by the browser's redirect handling.
          if (response.ok && !response.redirected) {
            const copy = response.clone();
            event.waitUntil(caches.open(CACHE).then(cache => cache.put(cacheKey, copy)));
          }
          return response;
        })
        .catch(async () => (await caches.match(cacheKey)) || caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(hit => {
      const network = fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, copy)));
          }
          return response;
        })
        .catch(() => hit);
      return hit || network;
    })
  );
});
