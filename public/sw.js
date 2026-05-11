const CACHE_PREFIX = 'financehub';
const CACHE_VERSION = '2026-05-11';
const SHELL_CACHE = `${CACHE_PREFIX}-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `${CACHE_PREFIX}-runtime-${CACHE_VERSION}`;
const NETWORK_TIMEOUT_MS = 10000;
const scopePath = new URL(self.registration.scope).pathname;

const withScope = (path) => new URL(path, self.registration.scope).toString();

const APP_SHELL = [
  '',
  'index.html',
  'manifest.webmanifest',
  'offline.html',
  'logo-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/maskable-192.png',
  'icons/maskable-512.png',
].map(withScope);

async function fetchWithTimeout(request) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS);

  try {
    return await fetch(request, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function cacheAppShell() {
  const cache = await caches.open(SHELL_CACHE);
  await cache.addAll(APP_SHELL.map((url) => new Request(url, { cache: 'reload' })));
}

self.addEventListener('install', (event) => {
  event.waitUntil(cacheAppShell().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && ![SHELL_CACHE, RUNTIME_CACHE].includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isNavigationRequest(request) {
  return request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html');
}

function isCacheableAsset(url) {
  return (
    url.pathname.startsWith(`${scopePath}assets/`) ||
    url.pathname.startsWith(`${scopePath}icons/`) ||
    /\.(?:css|js|mjs|png|jpg|jpeg|webp|gif|svg|ico|webmanifest)$/i.test(url.pathname)
  );
}

async function handleNavigation(request) {
  const shellCache = await caches.open(SHELL_CACHE);

  try {
    const response = await fetchWithTimeout(request);
    if (response.ok) {
      await shellCache.put(withScope('index.html'), response.clone());
    }
    return response;
  } catch {
    return (
      (await shellCache.match(request)) ||
      (await shellCache.match(withScope('index.html'))) ||
      (await shellCache.match(withScope('offline.html'))) ||
      new Response('FinanceHub is offline.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    );
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);

  const fetchAndCache = fetchWithTimeout(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone()).catch((error) => {
          console.warn('FinanceHub runtime cache update failed.', error);
        });
      }
      return response;
    })
    .catch(
      () =>
        cached ||
        new Response('', {
          status: 504,
          statusText: 'Gateway Timeout',
        })
    );

  if (cached) {
    fetchAndCache.catch((error) => {
      console.warn('FinanceHub runtime refresh failed.', error);
    });
    return cached;
  }

  return fetchAndCache;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(scopePath)) {
    return;
  }

  if (isNavigationRequest(request)) {
    event.respondWith(handleNavigation(request));
    return;
  }

  if (isCacheableAsset(url)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
