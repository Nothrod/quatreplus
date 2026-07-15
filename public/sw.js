// public/sw.js
// Service Worker pour les notifications push

// Installation du service worker
self.addEventListener('install', (event) => {
    console.log('Service Worker installé');
    self.skipWaiting(); // Activation immédiate
});

// Activation
self.addEventListener('activate', (event) => {
    console.log('Service Worker activé');
    event.waitUntil(clients.claim()); // Prend le contrôle immédiatement
});

// Réception des notifications push
self.addEventListener('push', (event) => {
    if (!event.data) return;
    
    const data = event.data.json();
    
    const options = {
        body: data.body,
        icon: data.icon || '/images/icon-192.png',
        badge: '/images/badge-72.png',
        vibrate: [200, 100, 200],
        data: {
            url: data.url || '/'
        },
        actions: data.actions || []
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Clic sur la notification
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    const urlToOpen = event.notification.data.url || '/';
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Si une fenêtre est déjà ouverte, on la focus
            for (let client of windowClients) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // Sinon on en ouvre une nouvelle
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});