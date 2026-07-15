// public/js/popup.js
export function initPopup() {
    let pollInterval = null;

    // Vérifier les nouvelles notifications toutes les 10 secondes
    function startPolling() {
        checkNotifications();
        pollInterval = setInterval(checkNotifications, 10000);
    }

    function stopPolling() {
        if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
        }
    }

    async function checkNotifications() {
        try {
            const res = await fetch('/api/thinkofyou/check');
            const data = await res.json();

            if (data.notifications && data.notifications.length > 0) {
                // Afficher la première notification non lue
                showNotification(data.notifications[0]);
            }
        } catch (err) {
            console.error('Erreur vérification notifications:', err);
        }
    }

    function showNotification(notif) {
        // Créer le pop-up
        const popup = document.createElement('div');
        popup.className = 'think-popup';
        popup.innerHTML = `
        <button class="popup-close">✕</button>
        <div class="popup-heart">💗</div>
        <h3 class="popup-title">${notif.fromName} pense à toi !</h3>
        <p class="popup-streak">
        <span class="streak-number">${notif.streak}</span>
        <span class="streak-text">jour${notif.streak > 1 ? 's' : ''} consécutif${notif.streak > 1 ? 's' : ''} 🔥</span>
        </p>
        <button class="popup-respond-btn">Renvoyer 💗</button>
        `;

        document.body.appendChild(popup);

        // Animation d'apparition
        setTimeout(() => popup.classList.add('active'), 10);

        // Gestion du clic sur la croix
        popup.querySelector('.popup-close').addEventListener('click', () => {
            closePopup(popup, notif.timestamp);
        });

        // Gestion du clic sur "Renvoyer"
        popup.querySelector('.popup-respond-btn').addEventListener('click', async () => {
            closePopup(popup, notif.timestamp);

            // Déclencher l'envoi d'un "Je pense à toi"
            const thinkBtn = document.getElementById('think-btn');
            if (thinkBtn && !thinkBtn.disabled) {
                thinkBtn.click();
            }
        });

        // Marquer comme lue après 5 secondes si pas fermée
        setTimeout(() => {
            if (popup.classList.contains('active')) {
                markAsRead(notif.timestamp);
            }
        }, 5000);
    }

    function closePopup(popup, timestamp) {
        popup.classList.remove('active');
        setTimeout(() => popup.remove(), 300);
        markAsRead(timestamp);
    }

    async function markAsRead(timestamp) {
        try {
            await fetch('/api/thinkofyou/mark-read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ timestamp })
            });
        } catch (err) {
            console.error('Erreur mark-read:', err);
        }
    }

    // Démarrer le polling
    startPolling();

    // Arrêter le polling quand on quitte la page
    window.addEventListener('beforeunload', stopPolling);
}
