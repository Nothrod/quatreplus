// public/js/mood.js

export function initMood() {
    const moodSelector = document.getElementById('mood-selector');
    const myMoodText = document.getElementById('my-mood-text');
    const otherMoodEmoji = document.getElementById('other-mood-emoji');
    const otherNameEl = document.getElementById('other-name');

    // Fonction utilitaire pour extraire l'emoji/texte, que ce soit une chaîne ou un objet
    function extractMoodDisplay(moodData) {
        if (!moodData) return '💭';
        if (typeof moodData === 'string') return moodData;
        if (typeof moodData === 'object') {
            // Si c'est un objet, on cherche la propriété qui contient l'emoji ou le texte
            return moodData.emoji || moodData.text || moodData.mood || '💭';
        }
        return '💭';
    }

    async function loadMoods() {
        try {
            const res = await fetch('/api/mood');
            const data = await res.json();

            // 1. Afficher le nom de l'autre
            if (otherNameEl && data.otherName) {
                otherNameEl.textContent = data.otherName === 'marc' ? 'Marc' : 'Blandine';
            }

            // 2. Afficher l'humeur de l'autre (✅ CORRECTION ICI)
            if (otherMoodEmoji) {
                const moodDisplay = extractMoodDisplay(data.otherMood);
                otherMoodEmoji.textContent = moodDisplay;
            }

            // 3. Afficher ma propre humeur
            if (myMoodText && data.myMood) {
                const myMoodDisplay = extractMoodDisplay(data.myMood);
                myMoodText.textContent = `Ton humeur actuelle : ${myMoodDisplay}`;

                // Mettre en surbrillance le bouton sélectionné
                if (moodSelector) {
                    const buttons = moodSelector.querySelectorAll('.mood-btn');
                    buttons.forEach(btn => {
                        btn.classList.remove('active');
                        // On compare l'emoji du bouton avec l'emoji de l'humeur actuelle
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

    // Gestion du clic sur un emoji d'humeur
    if (moodSelector) {
        moodSelector.addEventListener('click', async (e) => {
            const btn = e.target.closest('.mood-btn');
            if (!btn) return;

            const mood = btn.dataset.mood;

            // Mise à jour visuelle immédiate
            const buttons = moodSelector.querySelectorAll('.mood-btn');
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (myMoodText) myMoodText.textContent = `Ton humeur actuelle : ${mood}`;

            try {
                await fetch('/api/mood', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mood }) // On envoie juste la chaîne (l'emoji)
                });
            } catch (err) {
                console.error('Erreur sauvegarde humeur:', err);
            }
        });
    }

    // Lancement au chargement
    loadMoods();
}
