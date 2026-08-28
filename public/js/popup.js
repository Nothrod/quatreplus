// ==========================================
// SYSTÈME DE POPUPS (Je pense à toi + Niveau d'amitié)
// ==========================================

export function initPopup() {
    console.log('🎯 Initialisation des popups...');

    // ==========================================
    // 1. POPUP "JE PENSE À TOI"
    // ==========================================
    const thinkPopup = document.getElementById('think-popup');
    const thinkPopupClose = document.getElementById('popup-close');
    const thinkPopupCloseBtn = document.getElementById('think-popup-close-btn');

    // ✅ Écoute l'événement déclenché par notif-bell.js (pas de polling ici pour éviter les conflits)
    window.addEventListener('thinkOfYouReceived', (event) => {
        console.log(`💌 Popup déclenché : ${event.detail.count} "Je pense à toi" reçu(s) !`);
        if (thinkPopup) {
            thinkPopup.classList.add('active');
        }
    });

    // Fermeture via la croix
    if (thinkPopupClose) {
        thinkPopupClose.addEventListener('click', () => {
            thinkPopup.classList.remove('active');
        });
    }

    // Fermeture via le bouton "Merci !"
    if (thinkPopupCloseBtn) {
        thinkPopupCloseBtn.addEventListener('click', () => {
            thinkPopup.classList.remove('active');
        });
    }

    // ==========================================
    // 2. POPUP "NIVEAU D'AMITIÉ" (3.5, 3.6, 3.7, etc.)
    // ==========================================
    const friendshipPopup = document.getElementById('friendship-validation-popup');
    const friendshipPopupText = document.getElementById('popup-text');
    const friendshipAcceptBtn = document.getElementById('popup-accept-btn');
    const friendshipRejectBtn = document.getElementById('popup-reject-btn');

    async function checkFriendshipProposal() {
        try {
            const res = await fetch('/api/friendship/pending');
            if (!res.ok) return;

            const data = await res.json();
            if (data.hasPending && friendshipPopup) {
                const proposerName = data.proposedBy === 'marc' ? 'Marc' : 'Blandine';
                friendshipPopupText.textContent = `${proposerName} propose de passer votre amitié à ${data.proposedLevel}+`;
                friendshipPopup.classList.add('active');
            }
        } catch (err) {
            console.error('Erreur vérification proposition amitié:', err);
        }
    }

    if (friendshipAcceptBtn) {
        friendshipAcceptBtn.addEventListener('click', async () => {
            try {
                const res = await fetch('/api/friendship/accept', { method: 'POST' });
                const data = await res.json();
                if (data.success) {
                    friendshipPopup.classList.remove('active');
                    // Déclenche un événement pour que le widget se mette à jour si besoin
                    window.dispatchEvent(new Event('friendship-level-updated'));
                    console.log('✅ Niveau d\'amitié validé !');
                }
            } catch (err) {
                console.error('Erreur lors de l\'acceptation:', err);
                alert('Erreur de connexion');
            }
        });
    }

    if (friendshipRejectBtn) {
        friendshipRejectBtn.addEventListener('click', () => {
            friendshipPopup.classList.remove('active');
        });
    }

    // ==========================================
    // 3. POLLING (Uniquement pour la proposition d'amitié)
    // ==========================================
    // On vérifie immédiatement, puis toutes les 30 secondes s'il y a une nouvelle proposition de niveau
    checkFriendshipProposal();
    const friendshipPollingInterval = setInterval(() => {
        checkFriendshipProposal();
    }, 30000);
}
