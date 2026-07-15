export function initDashboard(userData) {
    // Récupération des éléments avec vérification de sécurité
    const dashboardPhoto = document.getElementById('dashboard-photo');
    const sharedPhoto = document.getElementById('shared-photo');
    const photoFallback = document.getElementById('photo-fallback');
    const photoUpload = document.getElementById('photo-upload');
    const photoAuthorText = document.getElementById('photo-author'); // Peut être null si absent du HTML
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.getElementById('lightbox-close');
    const counterEl = document.getElementById('days-counter');

    async function loadSharedPhoto() {
        try {
            const res = await fetch('/api/shared/photo');
            const data = await res.json();

            if (data.photoUrl) {
                if (sharedPhoto) {
                    sharedPhoto.src = data.photoUrl;
                    sharedPhoto.style.display = 'block';
                }
                if (photoFallback) {
                    photoFallback.style.display = 'none';
                }
            } else {
                if (sharedPhoto) sharedPhoto.style.display = 'none';
                if (photoFallback) photoFallback.style.display = 'flex';
            }

            // ✅ SÉCURITÉ : On ne touche à textContent que si l'élément existe
            if (photoAuthorText) {
                if (data.author) {
                    const authorName = data.author.toLowerCase() === 'marc' ? 'Marc' : 'Blandine';
                    photoAuthorText.textContent = `📸 ${authorName}`;
                } else {
                    photoAuthorText.textContent = '';
                }
            }
        } catch (err) {
            console.error('Erreur chargement photo:', err);
        }
    }

    // ✅ SÉCURITÉ : L'écouteur d'événement n'est ajouté que si le bouton existe
    if (photoUpload) {
        photoUpload.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('photo', file);

            try {
                const res = await fetch('/api/shared/photo', { method: 'POST', body: formData });
                const data = await res.json();

                if (data.success) {
                    if (sharedPhoto) {
                        sharedPhoto.src = data.photoUrl;
                        sharedPhoto.style.display = 'block';
                    }
                    if (photoFallback) {
                        photoFallback.style.display = 'none';
                    }
                }
            } catch (err) {
                console.error('Erreur upload photo:', err);
                alert('Erreur serveur lors de l\'upload');
            } finally {
                photoUpload.value = ''; // Reset pour permettre de réuploader la même image
            }
        });
    }

    // Lightbox (avec vérifications)
    if (dashboardPhoto && lightbox && lightboxImg && lightboxClose) {
        dashboardPhoto.addEventListener('click', (e) => {
            // Ignorer le clic si on clique sur le bouton d'upload (l'overlay)
            if (e.target.closest('.photo-overlay')) return;

            if (sharedPhoto && sharedPhoto.src && sharedPhoto.style.display !== 'none') {
                lightboxImg.src = sharedPhoto.src;
                lightbox.classList.add('active');
            }
        });

        const closeLightbox = () => {
            lightbox.classList.remove('active');
            lightboxImg.src = '';
        };

        lightboxClose.addEventListener('click', closeLightbox);

        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) closeLightbox();
        });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && lightbox.classList.contains('active')) {
                    closeLightbox();
                }
            });
    }

    // Compteur de jours (avec vérification)
    if (counterEl) {
        if (userData?.myProfile?.startDate) {
            const diffDays = Math.floor(Math.abs(new Date() - new Date(userData.myProfile.startDate)) / (1000 * 60 * 60 * 24));
            counterEl.textContent = diffDays;
        } else {
            counterEl.textContent = '—';
        }
    }

    // Lancement du chargement
    loadSharedPhoto();
}
