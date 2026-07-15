// public/js/friendshiplevel.js

export function initFriendshipLevel(userData) {
    // Récupération du nom d'utilisateur actuel (ex: 'marc' ou 'blandine')
    const currentUser = userData?.user?.toLowerCase() || 'marc';
    const otherUserName = currentUser === 'marc' ? 'Blandine' : 'Marc';

    // === Éléments du Dashboard (Accueil) ===
    const friendshipWidget = document.getElementById('friendship-widget');
    const levelLabelEl = document.getElementById('friendship-level-label');
    const levelNumberEl = document.getElementById('friendship-level');
    const levelUnitEl = document.getElementById('friendship-level-unit');
    const progressBarEl = document.getElementById('friendship-progress-bar');
    const statusEl = document.getElementById('friendship-status');

    // === Éléments de l'onglet "Moi" (Paramètres) ===
    const currentDisplayEl = document.getElementById('friendship-current-display');
    const currentAuthorEl = document.getElementById('friendship-current-author');
    const levelButtons = document.querySelectorAll('.level-btn');
    const proposeBtn = document.getElementById('friendship-propose-btn');
    const pendingInfoEl = document.getElementById('friendship-pending-info');
    const pendingDisplayEl = document.getElementById('friendship-pending-display');
    const pendingAuthorEl = document.getElementById('friendship-pending-author');

    let selectedLevel = null;

    // ==========================================
    // 1. CHARGER ET AFFICHER LE NIVEAU (DASHBOARD)
    // ==========================================
    async function loadDashboard() {
        try {
            const res = await fetch('/api/friendship');
            const data = await res.json();

            if (!friendshipWidget) return;

            if (data.isMaxLevel) {
                // ✅ MODE 4+ : On affiche le nombre de jours (sans écraser le HTML, on met juste à jour)
                friendshipWidget.classList.add('is-max-level');

                let days = 0;
                if (data.reached4PlusAt) {
                    const diffMs = Math.abs(new Date() - new Date(data.reached4PlusAt));
                    days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                }

                if (levelLabelEl) levelLabelEl.textContent = 'Amitié 4+ depuis';
                if (levelNumberEl) levelNumberEl.textContent = days;
                if (levelUnitEl) levelUnitEl.textContent = 'jours 👑';
                if (progressBarEl) progressBarEl.style.width = '100%';

                // Style doré pour le statut (l'humeur reste visible en dessous grâce à la structure HTML)
                if (statusEl) {
                    statusEl.style.background = 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)';
                    statusEl.querySelector('.status-text').style.color = 'white';
                    statusEl.querySelector('.status-text').style.fontWeight = '700';
                    statusEl.querySelector('.status-text').textContent = 'Niveau Maximum Atteint !';
                }
            } else {
                // ✅ MODE PROGRESSION (3.5 à 3.9)
                friendshipWidget.classList.remove('is-max-level');

                if (levelLabelEl) levelLabelEl.textContent = 'Niveau d\'amitié';
                if (levelNumberEl) levelNumberEl.textContent = data.currentLevel.toFixed(1);
                if (levelUnitEl) levelUnitEl.textContent = '+';

                // Calcul de la barre de progression (3.5 = 0%, 4.0 = 100%)
                const progress = ((data.currentLevel - 3.5) / 0.5) * 100;
                if (progressBarEl) progressBarEl.style.width = `${progress}%`;

                // On remet le style normal du statut (mood.js gérera l'affichage de l'humeur ici)
                if (statusEl) {
                    statusEl.style.background = '';
                    statusEl.querySelector('.status-text').style.color = '';
                    statusEl.querySelector('.status-text').style.fontWeight = '';
                    // Note : On ne touche pas au .textContent ici, car mood.js le gère !
                }
            }
        } catch (err) {
            console.error('Erreur chargement niveau amitié:', err);
        }
    }

    // ==========================================
    // 2. CHARGER LE PROFIL (ONGLET "MOI")
    // ==========================================
    async function loadProfile() {
        try {
            const resLevel = await fetch('/api/friendship');
            const dataLevel = await resLevel.json();

            // Mise à jour des infos
            if (currentDisplayEl) currentDisplayEl.textContent = `${dataLevel.currentLevel.toFixed(1)}+`;

            const authorName = dataLevel.updatedBy ? (dataLevel.updatedBy === 'marc' ? 'Marc' : 'Blandine') : '';
            if (currentAuthorEl) {
                currentAuthorEl.textContent = authorName ? `Validé par ${authorName}` : '';
            }

            // Mise à jour visuelle des boutons sélectionnés
            if (levelButtons) {
                levelButtons.forEach(btn => {
                    btn.classList.remove('selected');
                    if (parseFloat(btn.dataset.level) === dataLevel.currentLevel) {
                        btn.classList.add('selected');
                        selectedLevel = dataLevel.currentLevel;
                    }
                });
            }

            // ✅ GESTION DE L'ÉTAT "EN ATTENTE" (Corrigée avec currentUser)
            if (pendingInfoEl && proposeBtn) {
                if (dataLevel.amIWaiting && dataLevel.myPendingProposal) {
                    pendingInfoEl.style.display = 'block';
                    if (pendingDisplayEl) pendingDisplayEl.textContent = `${dataLevel.myPendingProposal.level.toFixed(1)}+`;
                    if (pendingAuthorEl) pendingAuthorEl.textContent = `En attente de validation par ${otherUserName}...`;

                    proposeBtn.disabled = true;
                    proposeBtn.textContent = '⏳ En attente de validation...';
                } else {
                    pendingInfoEl.style.display = 'none';
                    proposeBtn.disabled = false;
                    proposeBtn.textContent = '💌 Proposer ce niveau';
                }
            }
        } catch (err) {
            console.error('Erreur chargement profil amitié:', err);
        }
    }

    // ==========================================
    // 3. GESTION DES CLICS SUR LES BOUTONS DE NIVEAU (Une seule fois)
    // ==========================================
    if (levelButtons) {
        levelButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                levelButtons.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedLevel = parseFloat(btn.dataset.level);
            });
        });
    }

    // ==========================================
    // 4. PROPOSER UN NOUVEAU NIVEAU
    // ==========================================
    if (proposeBtn) {
        proposeBtn.addEventListener('click', async () => {
            if (!selectedLevel) {
                alert('Veuillez sélectionner un niveau ci-dessus.');
                return;
            }

            try {
                proposeBtn.disabled = true;
                proposeBtn.textContent = 'Envoi en cours...';

                const res = await fetch('/api/friendship/propose', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ level: selectedLevel })
                });

                const data = await res.json();

                if (data.success) {
                    proposeBtn.textContent = '✅ Proposition envoyée !';
                    setTimeout(() => {
                        loadProfile(); // Recharger pour afficher l'état "En attente"
                    }, 1000);
                } else {
                    alert(data.error || 'Erreur lors de la proposition');
                    proposeBtn.disabled = false;
                    proposeBtn.textContent = '💌 Proposer ce niveau';
                }
            } catch (err) {
                console.error(err);
                alert('Erreur de connexion');
                proposeBtn.disabled = false;
                proposeBtn.textContent = '💌 Proposer ce';
            }
        });
    }

    // ==========================================
    // 5. ÉCOUTER LES MISES À JOUR EN TEMPS RÉEL
    // ==========================================
    window.addEventListener('friendship-level-updated', () => {
        console.log('🔄 Mise à jour du niveau d\'amitié détectée !');
        loadDashboard();
        loadProfile();
    });

    // Lancement initial
    loadDashboard();
    loadProfile();
}
