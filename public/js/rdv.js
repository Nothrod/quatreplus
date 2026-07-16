// public/js/rdv.js
export function initRdv() {
    const countdownEl = document.getElementById('rdv-countdown');
    const labelEl = document.getElementById('rdv-label');
    const editBtn = document.getElementById('edit-rdv-btn');
    const gcalLink = document.getElementById('google-calendar-link');
    const rdvModal = document.getElementById('rdv-modal');
    const rdvModalClose = document.getElementById('rdv-modal-close');
    const rdvForm = document.getElementById('rdv-form');

    // 1. Charger le RDV au démarrage
    async function fetchRdv() {
        try {
            const res = await fetch('/api/rdv', { credentials: 'include' });
            const rdv = await res.json();
            updateDisplay(rdv);
        } catch (err) {
            console.error("Erreur chargement RDV:", err);
        }
    }

    // 2. Mettre à jour l'affichage et le lien Google
    function updateDisplay(rdv) {
        if (!rdv || !rdv.date) {
            countdownEl.textContent = '—';
            labelEl.textContent = 'Aucun RDV prévu';
            gcalLink.style.display = 'none';
            return;
        }

        const rdvDate = new Date(rdv.date);
        const now = new Date();
        const diff = rdvDate - now;

        if (diff > 0) {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            countdownEl.textContent = `${days}j ${hours}h`;
            labelEl.textContent = rdv.title || 'Prochain RDV';
        } else {
            countdownEl.textContent = '🎉';
            labelEl.textContent = 'C\'est maintenant !';
        }

        // Générer le lien Google Calendar pré-rempli
        // Format requis par Google : YYYYMMDDTHHMMSSZ (UTC)
        const start = rdvDate.toISOString().replace(/-|:|\.\d+/g, "");
        const end = new Date(rdvDate.getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/-|:|\.\d+/g, ""); // +2h par défaut
        const title = encodeURIComponent(rdv.title || 'RDV Quatre+');
        const location = encodeURIComponent(rdv.location || '');
        const details = encodeURIComponent('RDV prévu via notre application Quatre+ 🤍');

        gcalLink.href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
        gcalLink.style.display = 'block';
    }

    // 3. Gestion du Modal
    editBtn.addEventListener('click', () => {
        rdvModal.classList.add('active');
    });

    rdvModalClose.addEventListener('click', () => {
        rdvModal.classList.remove('active');
    });

    // Fermer le modal en cliquant en dehors
    rdvModal.addEventListener('click', (e) => {
        if (e.target === rdvModal) rdvModal.classList.remove('active');
    });

        // 4. Sauvegarde du formulaire
        rdvForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('rdv-title-input').value;
            const date = document.getElementById('rdv-date-input').value;
            const location = document.getElementById('rdv-location-input').value;

            await fetch('/api/rdv', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ title, date, location })
            });

            rdvModal.classList.remove('active');
            rdvForm.reset();
            fetchRdv(); // Rafraîchir l'affichage
        });

        // Lancement initial
        fetchRdv();

        // Mise à jour du compte à rebours toutes les minutes
        setInterval(fetchRdv, 60000);
}
