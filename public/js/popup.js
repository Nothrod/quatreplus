// public/js/popup.js

export function initPopup() {
    // ==========================================
    // 1. POPUP "JE PENSE À TOI"
    // ==========================================
    const thinkPopup = document.getElementById('think-popup');
    const thinkPopupClose = document.getElementById('popup-close');
    const thinkPopupCloseBtn = document.getElementById('think-popup-close-btn'); // Nouveau bouton

    async function checkThinkOfYou() {
        try {
            const res = await fetch('/api/thinkofyou/check');
            if (!res.ok) return;

            const data = await res.json();
            if (data.success && data.count > 0) {
                console.log(`🔔 ${data.count} nouvelle(s) notification(s) "Je pense à toi" !`);
                if (thinkPopup) {
                    thinkPopup.classList.add('active');
                }
            }
        } catch (err) {
            console.error('Erreur vérification notifications:', err);
        }
    }

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
    // 2. POPUP "NIVEAU D'AMITIÉ"
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
    // 3. LANCEMENT ET POLLING
    // ==========================================
    checkThinkOfYou();
    checkFriendshipProposal();

    const pollingInterval = setInterval(() => {
        checkThinkOfYou();
        checkFriendshipProposal();
    }, 30000);

    return () => clearInterval(pollingInterval);
}
