// public/js/mood.js

// ➕ 1. IMPORT DU SYSTÈME DE NOTIFICATION (Nécessaire pour que le moteur de polling s'active)
import { notifSystem } from './notif-bell.js';

export function initMood() {
    const moodSelector = document.getElementById('mood-selector');
    const myMoodText = document.getElementById('my-mood-text');
    const otherMoodEmoji = document.getElementById('other-mood-emoji');
    const otherNameEl = document.getElementById('other-name');

    let currentMood = '💭';

    function extractMoodDisplay(moodData) {
        if (!moodData) return '💭';
        if (typeof moodData === 'string') return moodData;
        if (typeof moodData === 'object') {
            return moodData.emoji || moodData.text || moodData.mood || '💭';
        }
        return '💭';
    }

    async function loadMoods() {
        try {
            const res = await fetch('/api/mood');
            const data = await res.json();

            if (otherNameEl && data.otherName) {
                otherNameEl.textContent = data.otherName === 'marc' ? 'Marc' : 'Blandine';
            }

            if (otherMoodEmoji) {
                const moodDisplay = extractMoodDisplay(data.otherMood);
                otherMoodEmoji.textContent = moodDisplay;
            }

            if (myMoodText && data.myMood) {
                const myMoodDisplay = extractMoodDisplay(data.myMood);
                currentMood = myMoodDisplay;
                myMoodText.textContent = `Ton humeur actuelle : ${myMoodDisplay}`;

                if (moodSelector) {
                    const buttons = moodSelector.querySelectorAll('.mood-btn');
                    buttons.forEach(btn => {
                        btn.classList.remove('active');
                        if (btn.dataset.mood === (typeof data.myMood === 'string' ? data.myMood : data.myMood.emoji)) {
                            btn.classList.add('active');
                        }
                    });
                }
            }
        } catch (err) {
            console.error('Erreur chargement humeur:', err);
        }
    }

    if (moodSelector) {
        moodSelector.addEventListener('click', async (e) => {
            const btn = e.target.closest('.mood-btn');
            if (!btn) return;

            const newMood = btn.dataset.mood;

            if (newMood === currentMood) return;

            const buttons = moodSelector.querySelectorAll('.mood-btn');
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (myMoodText) myMoodText.textContent = `Ton humeur actuelle : ${newMood}`;

            try {
                const res = await fetch('/api/mood', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mood: newMood })
                });

                // ✅ SUPPRIMÉ : La notification est maintenant gérée par le serveur (routes/mood.js)
                // pour assurer la synchronisation entre Marc et Blandine.

                if (res.ok) {
                    currentMood = newMood; // On met à jour la mémoire pour la prochaine fois
                }
            } catch (err) {
                console.error('Erreur sauvegarde humeur:', err);
            }
        });
    }

    loadMoods();
}
