// public/js/thinkofyou.js

export function initThinkOfYou() {
    const thinkBtn = document.getElementById('think-btn');
    const thinkSubtitle = document.getElementById('think-subtitle');
    const myTotalEl = document.getElementById('my-total');
    const myStreakEl = document.getElementById('my-streak');
    const otherThinkNameEl = document.getElementById('other-think-name');
    const otherTotalEl = document.getElementById('other-total');
    const resetBtn = document.getElementById('reset-think-btn');

    function updateBadges(streak) {
        const badges = [
            { id: 'badge-7', threshold: 7 }, { id: 'badge-30', threshold: 30 },
            { id: 'badge-100', threshold: 100 }, { id: 'badge-365', threshold: 365 }
        ];
        badges.forEach(badge => {
            const el = document.getElementById(badge.id);
            if (el) {
                if (streak >= badge.threshold) {
                    el.classList.remove('locked');
                    el.classList.add('unlocked');
                } else {
                    el.classList.remove('unlocked');
                    el.classList.add('locked');
                }
            }
        });
    }

    async function loadThinkOfYou() {
        try {
            const res = await fetch('/api/thinkofyou');
            const data = await res.json();

            if (myTotalEl) myTotalEl.textContent = data.myStats.total;
            if (myStreakEl) myStreakEl.textContent = data.myStats.streak;
            if (otherThinkNameEl && data.otherName) otherThinkNameEl.textContent = data.otherName;
            if (otherTotalEl) otherTotalEl.textContent = data.otherStats.total;

            if (thinkBtn) {
                if (data.canSend) {
                    thinkBtn.disabled = false;
                    if (thinkSubtitle) thinkSubtitle.textContent = 'Envoie un petit coucou';
                    thinkBtn.classList.remove('sent');
                } else {
                    thinkBtn.disabled = true;
                    if (thinkSubtitle) thinkSubtitle.textContent = 'Déjà envoyé aujourd\'hui ✓';
                    thinkBtn.classList.add('sent');
                }
            }
            updateBadges(data.myStats.streak);
        } catch (err) {
            console.error('Erreur chargement thinkofyou:', err);
        }
    }

    // ✅ SÉCURITÉ : On vérifie que le bouton existe avant d'ajouter l'écouteur
    if (thinkBtn) {
        thinkBtn.addEventListener('click', async () => {
            if (thinkBtn.disabled) return;
            thinkBtn.disabled = true;
            const originalSubtitle = thinkSubtitle ? thinkSubtitle.textContent : '';
            if (thinkSubtitle) thinkSubtitle.textContent = 'Envoi en cours...';

            try {
                const res = await fetch('/api/thinkofyou/send', { method: 'POST' });
                const data = await res.json();
                if (data.success) {
                    if (myTotalEl) myTotalEl.textContent = data.stats.total;
                    if (myStreakEl) myStreakEl.textContent = data.stats.streak;
                    if (thinkSubtitle) thinkSubtitle.textContent = 'Envoyé ! 🤍';
                    updateBadges(data.stats.streak);

                    thinkBtn.classList.add('sent'); // Masque le cœur via CSS

                    setTimeout(() => {
                        if (thinkSubtitle) thinkSubtitle.textContent = 'Déjà envoyé aujourd\'hui ✓';
                    }, 2000);
                } else {
                    alert(data.error);
                    thinkBtn.disabled = false;
                    if (thinkSubtitle) thinkSubtitle.textContent = originalSubtitle;
                }
            } catch (err) {
                alert('Erreur de connexion');
                thinkBtn.disabled = false;
                if (thinkSubtitle) thinkSubtitle.textContent = originalSubtitle;
            }
        });
    }

    // ✅ SÉCURITÉ : On vérifie que le bouton reset existe
    if (resetBtn) {
        resetBtn.addEventListener('click', async () => {
            if (!confirm('Réinitialiser le compteur "Je pense à toi" ?')) return;

            try {
                const res = await fetch('/api/thinkofyou/reset', { method: 'POST' });
                const data = await res.json();

                if (data.success) {
                    alert('✅ Compteur réinitialisé !');
                    loadThinkOfYou();
                }
            } catch (err) {
                alert('Erreur lors du reset');
            }
        });
    }

    loadThinkOfYou();
}
