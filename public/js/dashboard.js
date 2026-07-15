export function initDashboard(userData) {
    const dashboardPhoto = document.getElementById('dashboard-photo');
    const sharedPhoto = document.getElementById('shared-photo');
    const photoFallback = document.getElementById('photo-fallback');
    const photoUpload = document.getElementById('photo-upload');
    const photoAuthorText = document.getElementById('photo-author');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.getElementById('lightbox-close');

    async function loadSharedPhoto() {
        try {
            const res = await fetch('/api/shared/photo');
            const data = await res.json();
            if (data.photoUrl) {
                sharedPhoto.src = data.photoUrl;
                sharedPhoto.style.display = 'block';
                photoFallback.style.display = 'none';
            } else {
                sharedPhoto.style.display = 'none';
                photoFallback.style.display = 'flex';
            }
            if (data.author) {
                const authorName = data.author === 'marc' ? 'Marc' : 'Blandine';
                photoAuthorText.textContent = `📸 ${authorName}`;
            } else {
                photoAuthorText.textContent = '';
            }
        } catch (err) {
            console.error('Erreur chargement photo:', err);
        }
    }

    photoUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('photo', file);
        try {
            const res = await fetch('/api/shared/photo', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success) {
                sharedPhoto.src = data.photoUrl;
                sharedPhoto.style.display = 'block';
                photoFallback.style.display = 'none';
            }
        } catch (err) {
            alert('Erreur serveur');
        } finally {
            photoUpload.value = '';
        }
    });

    // Lightbox
    dashboardPhoto.addEventListener('click', (e) => {
        if (e.target.closest('.photo-overlay-mini')) return;
        if (sharedPhoto.src && sharedPhoto.style.display !== 'none') {
            lightboxImg.src = sharedPhoto.src;
            lightbox.classList.add('active');
        }
    });
    const closeLightbox = () => { lightbox.classList.remove('active'); lightboxImg.src = ''; };
    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) closeLightbox();
    });

    // Compteur de jours
    const counterEl = document.getElementById('days-counter');
    if (userData?.myProfile?.startDate) {
        const diffDays = Math.floor(Math.abs(new Date() - new Date(userData.myProfile.startDate)) / (1000 * 60 * 60 * 24));
        counterEl.textContent = diffDays;
    } else {
        counterEl.textContent = '—';
    }

    loadSharedPhoto();
}