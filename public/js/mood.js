export function initMood() {
    const otherNameEl = document.getElementById('other-name');
    const otherMoodEmoji = document.getElementById('other-mood-emoji');
    const myMoodText = document.getElementById('my-mood-text');
    const moodButtons = document.querySelectorAll('.mood-btn');

    async function loadMoods() {
        try {
            const res = await fetch('/api/mood');
            const data = await res.json();
            if (data.otherName) otherNameEl.textContent = data.otherName;
            otherMoodEmoji.textContent = (data.otherMood?.emoji) ? data.otherMood.emoji : '💭';
            updateMyMoodUI(data.myMood);
        } catch (err) {
            console.error('Erreur chargement humeur:', err);
        }
    }

    function updateMyMoodUI(mood) {
        moodButtons.forEach(btn => btn.classList.remove('active'));
        if (mood?.emoji) {
            myMoodText.textContent = `Tu es de humeur : ${mood.emoji}`;
            const activeBtn = document.querySelector(`.mood-btn[data-mood="${mood.emoji}"]`);
            if (activeBtn) activeBtn.classList.add('active');
        } else {
            myMoodText.textContent = 'Choisis ton humeur 👇';
        }
    }

    moodButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const emoji = btn.getAttribute('data-mood');
            updateMyMoodUI({ emoji });
            try {
                await fetch('/api/mood/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ emoji })
                });
            } catch (err) {
                console.error('Erreur mise à jour humeur:', err);
            }
        });
    });

    loadMoods();
}