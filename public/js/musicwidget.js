// public/js/musicwidget.js

export function initMusicWidget() {
    console.log("🚀 initMusicWidget() a été appelé !");

    // === 1. Récupération des éléments HTML (avec vérification) ===
    const musicTitle = document.getElementById('music-title');
    const musicArtist = document.getElementById('music-artist');
    const musicLink = document.getElementById('music-link');
    const musicAuthor = document.getElementById('music-author');

    const titleInput = document.getElementById('music-title-input');
    const artistInput = document.getElementById('music-artist-input');
    const urlInput = document.getElementById('music-url-input');
    const musicCurrentDisplay = document.getElementById('music-current-display');
    const musicCurrentAuthor = document.getElementById('music-current-author');
    const musicSaveBtn = document.getElementById('music-save-btn');

    if (!musicTitle || !musicArtist) {
        console.error("❌ ERREUR : Les éléments HTML du widget musique sont introuvables ! Vérifie les IDs dans index.html");
        return; // On arrête tout pour éviter un plantage
    }

    // === 2. Charger la musique de L'AUTRE (Accueil) ===
    async function loadOtherMusic() {
        try {
            console.log("📡 Appel API : /api/music");
            const res = await fetch('/api/music');
            const data = await res.json();
            console.log("📦 Réponse API (autre) :", data);

            if (data.title && data.artist) {
                musicTitle.textContent = data.title;
                musicArtist.textContent = data.artist;

                if (data.url) {
                    musicLink.href = data.url;
                    musicLink.style.display = 'inline-flex';
                } else {
                    musicLink.style.display = 'none';
                }
                musicAuthor.textContent = data.updatedBy ? `Ajouté par ${data.updatedBy}` : '';
            } else {
                console.log("ℹ️ Aucune musique de l'autre à afficher.");
            }
        } catch (err) {
            console.error("❌ Erreur chargement musique autre:", err);
        }
    }

    // === 3. Charger MA musique (Onglet Moi) ===
    async function loadMyMusic() {
        try {
            console.log("📡 Appel API : /api/music/mine");
            const res = await fetch('/api/music/mine');
            const data = await res.json();
            console.log("📦 Réponse API (moi) :", data);

            if (data.title && data.artist) {
                if (titleInput) titleInput.value = data.title;
                if (artistInput) artistInput.value = data.artist;
                if (urlInput) urlInput.value = data.url || '';

                if (musicCurrentDisplay) musicCurrentDisplay.textContent = `${data.title} — ${data.artist}`;
                if (musicCurrentAuthor) {
                    musicCurrentAuthor.textContent = data.updatedAt
                    ? `Modifié le ${new Date(data.updatedAt).toLocaleDateString('fr-FR')}`
                    : '';
                }
            }
        } catch (err) {
            console.error("❌ Erreur chargement ma musique:", err);
        }
    }

    // === 4. Sauvegarder MA musique ===
    if (musicSaveBtn) {
        musicSaveBtn.addEventListener('click', async () => {
            const title = titleInput.value.trim();
            const artist = artistInput.value.trim();
            const url = urlInput.value.trim();

            if (!title || !artist) {
                alert('Merci de remplir le titre et l\'artiste');
                return;
            }

            try {
                const res = await fetch('/api/music', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, artist, url })
                });

                const data = await res.json();

                if (data.success) {
                    musicSaveBtn.textContent = '✅ Sauvegardé !';
                    musicSaveBtn.style.background = 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)';
                    setTimeout(() => {
                        musicSaveBtn.textContent = '💾 Sauvegarder';
                        musicSaveBtn.style.background = '';
                    }, 2000);

                    loadMyMusic();
                    loadOtherMusic();
                } else {
                    alert(data.error || 'Erreur lors de la sauvegarde');
                }
            } catch (err) {
                alert('Erreur de connexion');
                console.error(err);
            }
        });
    }

    // === 5. Lancement au chargement ===
    loadOtherMusic();
    loadMyMusic();
}
