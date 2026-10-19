/* Dev stub. The production build replaces this file with a precache worker. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('message', (event) => {
  const data = event.data;
  if (data === 'SKIP_WAITING' || data === 'skip-waiting' || (data && data.type === 'SKIP_WAITING')) self.skipWaiting();
});
