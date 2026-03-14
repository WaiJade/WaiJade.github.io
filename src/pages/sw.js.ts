export const prerender = true;

import { buildMeta } from "../lib/build";

const shellVersion = buildMeta.shellVersion;

const serviceWorkerSource = `
const SHELL_VERSION = "${shellVersion}";
const PRECACHE = "waijade-blog-precache-" + SHELL_VERSION;
const ASSETS = "waijade-blog-assets-" + SHELL_VERSION;
const PAGES = "waijade-blog-pages";
const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = [
  "/",
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/favicon.png",
  "/pwa-192.png",
  "/pwa-512.png"
];

function isNavigationRequest(request) {
  return request.mode === "navigate" || (
    request.method === "GET" &&
    (request.headers.get("accept") || "").includes("text/html")
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PRECACHE)
      .then((cache) =>
        cache.addAll(PRECACHE_URLS.map((url) => new Request(url, { cache: "reload" })))
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    event.waitUntil(self.skipWaiting());
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) =>
            key.startsWith("waijade-blog-precache-") || key.startsWith("waijade-blog-assets-")
          )
          .filter((key) => ![PRECACHE, ASSETS].includes(key))
          .map((key) => caches.delete(key))
      )
    ).then(async () => {
      if ("navigationPreload" in self.registration) {
        await self.registration.navigationPreload.enable();
      }

      await self.clients.claim();
    })
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (
    url.pathname.startsWith("/src/") ||
    url.pathname.startsWith("/node_modules/") ||
    url.pathname.startsWith("/@") ||
    url.pathname.startsWith("/__vite")
  ) {
    return;
  }

  if (isNavigationRequest(request)) {
    event.respondWith(
      Promise.resolve(event.preloadResponse)
        .then((preloadResponse) => preloadResponse || fetch(request))
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            event.waitUntil(
              caches.open(PAGES).then((cache) => cache.put(request, responseClone))
            );
          }

          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          return cachedResponse || caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  if (["style", "script", "worker", "image", "font", "manifest"].includes(request.destination)) {
    event.respondWith(
      caches.open(ASSETS).then((cache) =>
        cache.match(request).then((cachedResponse) => {
          const networkResponse = fetch(request)
            .then((response) => {
              if (response.ok) {
                const responseClone = response.clone();
                event.waitUntil(cache.put(request, responseClone));
              }

              return response;
            })
            .catch(() => cachedResponse);

          if (cachedResponse) {
            event.waitUntil(
              fetch(request)
                .then((response) => {
                  if (response.ok) {
                    return cache.put(request, response.clone());
                  }

                  return undefined;
                })
                .catch(() => undefined)
            );

            return cachedResponse;
          }

          return networkResponse;
        })
      )
    );
    return;
  }

  if (request.destination === "" || url.pathname.endsWith(".json") || url.pathname.endsWith(".xml")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            event.waitUntil(
              caches.open(PAGES).then((cache) => cache.put(request, responseClone))
            );
          }

          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }
});
`;

export async function GET() {
  return new Response(serviceWorkerSource.trim(), {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
