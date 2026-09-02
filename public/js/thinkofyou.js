// public/js/thinkofyou.js

// ➕ 1. IMPORT DU SYSTÈME DE NOTIFICATION (Active le polling en arrière-plan pour les notifs de l'autre)
import { notifSystem } from './notif-bell.js';

export function initThinkOfYou() {
    const thinkBtn = document.getElementById('think-btn');
    const thinkSubtitle = document.getElementById('think-subtitle');
    const myTotalEl = document.getElementById('my-total');
    const myStreakEl = document.getElementById('my-streak');
    const otherThinkNameEl = document.getElementById('other-think-name');
    const otherTotalEl = document.getElementById('other-total');
    const resetBtn = document.getElementById('reset-think-btn');

    let previousStreak = 0;
    const badgeThresholds = [7, 30, 100, 365];

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

            previousStreak = data.myStats.streak;

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
                    thinkBtn.classList.add('sent');

                    // ➕ DÉTECTION LOCALE DU DÉBLOCAGE DE BADGE
                    const newStreak = data.stats.streak;
                    const unlockedThreshold = badgeThresholds.find(t => previousStreak < t && newStreak >= t);
                    if (unlockedThreshold) {
                        notifSystem.badgeDebloque(`Je pense à toi (${unlockedThreshold} jours)`);
                    }
                    previousStreak = newStreak;

                    // 🌱 MISE À JOUR DE LA PLANTE TAMAGOTCHI (Logique "Je pense à toi")
                    try {
                        // On utilise le username renvoyé par le backend pour être 100% sûr
                        await fetch('/api/plant/action/think-of-you', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ user: data.username })
                        });

                        // Rafraîchir l'affichage de la plante instantanément
                        if (typeof window.plantTamagotchi !== 'undefined' && window.plantTamagotchi) {
                            await window.plantTamagotchi.loadState();
                            window.plantTamagotchi.render();
                        }
                    } catch (plantErr) {
                        console.error('Erreur mise à jour plante (think of you):', plantErr);
                        // On ne bloque pas l'expérience utilisateur si la plante échoue
                    }

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
