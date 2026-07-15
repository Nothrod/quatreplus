export function initThinkOfYou() {
    const thinkBtn = document.getElementById('think-btn');
    const thinkSubtitle = document.getElementById('think-subtitle');
    const myTotalEl = document.getElementById('my-total');
    const myStreakEl = document.getElementById('my-streak');
    const otherThinkNameEl = document.getElementById('other-think-name');
    const otherTotalEl = document.getElementById('other-total');

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
            myTotalEl.textContent = data.myStats.total;
            myStreakEl.textContent = data.myStats.streak;
            if (data.otherName) otherThinkNameEl.textContent = data.otherName;
            otherTotalEl.textContent = data.otherStats.total;

            if (data.canSend) {
                thinkBtn.disabled = false;
                thinkSubtitle.textContent = 'Envoie un petit coucou';
            } else {
                thinkBtn.disabled = true;
                thinkSubtitle.textContent = 'Déjà envoyé aujourd\'hui ✓';
            }
            updateBadges(data.myStats.streak);
        } catch (err) {
            console.error('Erreur chargement thinkofyou:', err);
        }
    }

    thinkBtn.addEventListener('click', async () => {
        if (thinkBtn.disabled) return;
        thinkBtn.disabled = true;
        const originalSubtitle = thinkSubtitle.textContent;
        thinkSubtitle.textContent = 'Envoi en cours...';

        try {
            const res = await fetch('/api/thinkofyou/send', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                myTotalEl.textContent = data.stats.total;
                myStreakEl.textContent = data.stats.streak;
                thinkSubtitle.textContent = 'Envoyé ! 🤍';
                updateBadges(data.stats.streak);
                thinkBtn.style.background = 'linear-gradient(135deg, #FDF4F4 0%, #F8E1E8 100%)';
                setTimeout(() => { thinkSubtitle.textContent = 'Déjà envoyé aujourd\'hui ✓'; }, 2000);
            } else {
                alert(data.error);
                thinkBtn.disabled = false;
                thinkSubtitle.textContent = originalSubtitle;
            }
        } catch (err) {
            alert('Erreur de connexion');
            thinkBtn.disabled = false;
            thinkSubtitle.textContent = originalSubtitle;
        }
    });

    loadThinkOfYou();
	
	    // Bouton de reset pour les tests
    const resetBtn = document.getElementById('reset-think-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', async () => {
            if (!confirm('Réinitialiser le compteur "Je pense à toi" ?')) return;
            
            try {
                const res = await fetch('/api/thinkofyou/reset', { method: 'POST' });
                const data = await res.json();
                
                if (data.success) {
                    alert('✅ Compteur réinitialisé !');
                    loadThinkOfYou(); // Recharger les stats
                }
            } catch (err) {
                alert('Erreur lors du reset');
            }
        });
    }
}