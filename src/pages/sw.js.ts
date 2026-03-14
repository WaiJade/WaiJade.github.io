export const prerender = true;

const buildVersion = (
  process.env.CF_PAGES_COMMIT_SHA ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  new Date().toISOString()
).replace(/[^a-zA-Z0-9]+/g, "-");

const serviceWorkerSource = `
const CACHE_VERSION = "waijade-blog-${buildVersion}";
const PRECACHE = CACHE_VERSION + "-precache";
const RUNTIME = CACHE_VERSION + "-runtime";
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
    caches.open(PRECACHE).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
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
          .filter((key) => ![PRECACHE, RUNTIME].includes(key))
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

  // Avoid poisoning Astro/Vite local development assets if a localhost preview
  // service worker leaks into a later dev session on the same port.
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
              caches.open(RUNTIME).then((cache) => cache.put(request, responseClone))
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
      caches.match(request).then((cachedResponse) => {
        const networkResponse = fetch(request)
          .then((response) => {
            if (response.ok) {
              const responseClone = response.clone();
              event.waitUntil(
                caches.open(RUNTIME).then((cache) => cache.put(request, responseClone))
              );
            }

            return response;
          })
          .catch(() => cachedResponse);

        return cachedResponse || networkResponse;
      })
    );
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
