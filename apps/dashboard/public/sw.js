// Service Worker for Vision Analytics Push Notifications
const ICON = '/android-chrome-192x192.png';
const BADGE = '/favicon-32x32.png';

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'Sigma', body: event.data ? event.data.text() : 'New notification' };
  }

  const title = data.title || 'Vision Analytics';
  const options = {
    body: data.body || data.message || 'You have a new notification.',
    icon: data.icon && data.icon.startsWith('http') ? data.icon : ICON,
    badge: BADGE,
    tag: data.tag || 'sigma-notification',
    renotify: true,
    data: {
      url: data.url || '/',
      notificationId: data.notificationId || null,
    },
    actions: [
      { action: 'open', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const urlToOpen = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus an existing tab if possible
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open a new tab
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      }),
  );
});

// Keep service worker alive
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
