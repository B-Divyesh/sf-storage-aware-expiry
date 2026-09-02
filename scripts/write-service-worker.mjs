import { readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const outputDir = join(process.cwd(), 'dist');
const assetDir = join(outputDir, 'assets');
const generatedAssets = (await readdir(assetDir))
  .filter(name => /^index-[a-zA-Z0-9_-]+\.(?:js|css)$/.test(name))
  .map(name => `/assets/${name}`)
  .sort();

if (!generatedAssets.some(name => /\.js$/.test(name)) || !generatedAssets.some(name => /\.css$/.test(name))) {
  throw new Error('Expected fingerprinted JavaScript and CSS assets before creating the service worker.');
}

const shell = [
  '/',
  '/demo',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/assets/fallback.css',
  '/assets/favicon.svg',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  '/assets/icon-maskable-512.png',
  '/assets/storage-panel-640.webp',
  '/assets/storage-panel-960.webp',
  ...generatedAssets
];

const cacheName = `storage-aware-expiry-shell-${generatedAssets.join('|')}`;
const source = `const CACHE = ${JSON.stringify(cacheName)};
const SHELL = ${JSON.stringify(shell, null, 2)};

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => Promise.all(SHELL.map(async url => {
    const response = await fetch(new Request(url, { cache: 'reload' }));
    if (!response.ok) throw new Error(\`Could not cache \${url}\`);
    await cache.put(url, response);
  }))));
});

self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))),
    self.clients.claim()
  ]));
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put('/index.html', copy));
      return response;
    }).catch(async () => (await caches.match('/index.html', { ignoreVary: true })) || (await caches.match('/offline.html', { ignoreVary: true }))));
    return;
  }
  event.respondWith(caches.match(request, { ignoreVary: true }).then(cached => cached || fetch(request).then(response => {
    if (response.ok) caches.open(CACHE).then(cache => cache.put(request, response.clone()));
    return response;
  })));
});
`;

await writeFile(join(outputDir, 'sw.js'), source);
