self.addEventListener('install', () => {
  // Activar inmediatamente la nueva versión del service worker
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Tomar control de las pestañas abiertas
  event.waitUntil(self.clients.claim());
});
