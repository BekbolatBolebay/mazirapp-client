importScripts('https://www.gstatic.com/firebasejs/9.1.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.1.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDHrnmjl7MJC0dz-SDHXDAgFoD2Dl8p60k",
  authDomain: "mazirapp.firebaseapp.com",
  projectId: "mazirapp",
  storageBucket: "mazirapp.firebasestorage.app",
  messagingSenderId: "1018433182095",
  appId: "1:1018433182095:web:6aa27626b3ec44bf1953fa"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message', payload);

  const data = payload.data || {};
  const type = data.type || 'order';
  const isBooking = type === 'booking';

  // Determine URL: bookings are shown in /orders tab in admin
  const url = data.url || '/orders';

  const notificationTitle = payload.notification?.title
    || (isBooking ? '🗓 Жаңа брондау!' : '🔔 Жаңа тапсырыс!');

  const notificationBody = payload.notification?.body || '';

  const notificationOptions = {
    body: notificationBody,
    icon: '/icon-192x192.png',
    badge: '/icon-light-32x32.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: isBooking ? 'new-booking' : 'new-order',
    requireInteraction: true,
    data: { url },
    actions: [
      { action: 'open', title: isBooking ? 'Брондауды ашу' : 'Тапсырысты ашу' },
      { action: 'close', title: 'Жабу' }
    ]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const urlToOpen = event.notification.data?.url || '/orders';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if ('focus' in client) {
          client.focus();
          if (client.navigate) client.navigate(urlToOpen);
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
