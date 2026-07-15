// public/js/notifications.js
export function initNotifications() {
    // Vérifier si le navigateur supporte les notifications
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Les notifications push ne sont pas supportées');
        return;
    }

    // Enregistrer le service worker
    async function registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker enregistré', registration);
            return registration;
        } catch (err) {
            console.error('Erreur enregistrement Service Worker:', err);
            return null;
        }
    }

    // Demander la permission et s'abonner
    async function subscribeToPush(registration) {
        try {
            // Récupérer la clé publique VAPID
            const res = await fetch('/api/notifications/vapidPublicKey');
            const data = await res.json();
            const publicKey = data.publicKey;

            // Convertir la clé en format Uint8Array
            const applicationServerKey = urlBase64ToUint8Array(publicKey);

            // S'abonner aux notifications push
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey
            });

            // Envoyer la subscription au serveur
            await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription)
            });

            console.log('Abonné aux notifications push');
        } catch (err) {
            console.error('Erreur subscription push:', err);
        }
    }

    // Convertir une clé base64 en Uint8Array
    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    // Initialiser
    (async () => {
        const registration = await registerServiceWorker();
        if (registration) {
            // Demander la permission
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                await subscribeToPush(registration);
            }
        }
    })();
}