// This is a very basic service worker for PWA installation purposes.
// It does not include any caching logic.

self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  // Skip waiting to activate the new service worker immediately.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  // Take control of all pages under its scope immediately.
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // This service worker doesn't intercept any fetch requests.
  // It just lets the browser handle them as it normally would.
  // console.log('Fetching:', event.request.url);
  return;
});
