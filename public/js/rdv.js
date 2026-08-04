export function initRdv() {
    const countdownEl = document.getElementById('rdv-countdown');
    const labelEl = document.getElementById('rdv-label');
    const badgeEl = document.getElementById('rdv-total-badge');
    const openManagerBtn = document.getElementById('open-rdv-manager-btn');

    const managerModal = document.getElementById('rdv-manager-modal');
    const managerCloseBtn = document.getElementById('rdv-manager-close');
    const listContainer = document.getElementById('rdv-list-container-modal');
    const addNewBtn = document.getElementById('add-new-rdv-btn');

    const formModal = document.getElementById('rdv-form-modal');
    const formCloseBtn = document.getElementById('rdv-form-close');
    const formTitle = document.getElementById('rdv-form-title');
    const rdvForm = document.getElementById('rdv-form');
    const deleteBtn = document.getElementById('delete-rdv-btn');

    let allRdvs = [];

    // 1. Charger les RDV
    async function fetchRdvs() {
        try {
            const res = await fetch('/api/rdv');
            allRdvs = await res.json();
            updateWidget();
            renderRdvList();
        } catch (err) {
            console.error("Erreur chargement RDV:", err);
        }
    }

    // 2. Mettre à jour le Widget (Compte à rebours sur le PROCHAIN RDV)
    function updateWidget() {
        const now = new Date();
        const upcomingRdvs = allRdvs.filter(r => new Date(r.date) > now);

        if (upcomingRdvs.length === 0) {
            countdownEl.textContent = '—';
            labelEl.textContent = 'Aucun RDV à venir';
            badgeEl.style.display = 'none';
            return;
        }

        const nextRdv = upcomingRdvs[0];
        const rdvDate = new Date(nextRdv.date);
        const diff = rdvDate - now;

        if (diff > 0) {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            countdownEl.textContent = `${days}j ${hours}h`;
            labelEl.textContent = nextRdv.title || 'Prochain RDV';
        } else {
            countdownEl.textContent = '🎉';
            labelEl.textContent = 'C\'est maintenant !';
        }

        badgeEl.textContent = `${upcomingRdvs.length} RDV${upcomingRdvs.length > 1 ? 's' : ''}`;
        badgeEl.style.display = 'inline-block';
    }

    // 3. Générer le lien Google Calendar pour un RDV
    function getGoogleCalendarLink(rdv) {
        const start = new Date(rdv.date);
        const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // +2h par défaut
        const formatGcal = (d) => d.toISOString().replace(/-|:|\.\d+/g, "");

        const text = encodeURIComponent(rdv.title || 'RDV');
        const location = encodeURIComponent(rdv.location || '');
        const details = encodeURIComponent('RDV prévu via notre application Quatre+ 🤍');

        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${formatGcal(start)}/${formatGcal(end)}&details=${details}&location=${location}`;
    }

    // 4. Afficher la liste dans le Popup
    function renderRdvList() {
        if (!listContainer) return;

        const upcoming = allRdvs.filter(r => new Date(r.date) > new Date());

        if (upcoming.length === 0) {
            listContainer.innerHTML = '<p style="text-align: center; color: #9ca3af; padding: 30px;">Aucun RDV à venir pour le moment 🎉</p>';
            return;
        }

        listContainer.innerHTML = upcoming.map(rdv => {
            const dateObj = new Date(rdv.date);
            const dateStr = dateObj.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
            const timeStr = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            const gcalLink = getGoogleCalendarLink(rdv);

            return `
            <div class="rdv-list-item">
            <div class="rdv-item-info">
            <div class="rdv-item-title">${rdv.title}</div>
            <div class="rdv-item-desc">${rdv.location || 'Lieu non précisé'}</div>
            <div class="rdv-item-date">📅 ${dateStr} à ${timeStr}</div>
            </div>
            <div class="rdv-item-actions">
            <a href="${gcalLink}" target="_blank" class="btn-gcal" title="Ajouter à Google Agenda">📅</a>
            <button class="btn-edit-rdv" onclick="window.editRdv('${rdv.id}')" title="Modifier">✏️</button>
            <button class="btn-delete-rdv" onclick="window.deleteRdv('${rdv.id}')" title="Supprimer">🗑️</button>
            </div>
            </div>
            `;
        }).join('');
    }

    // 5. Gestion des Modales
    window.openRdvManager = function() {
        renderRdvList();
        managerModal.classList.add('active');
    };

    window.closeRdvManager = function() {
        managerModal.classList.remove('active');
    };

    window.openRdvForm = function(rdv = null) {
        if (rdv) {
            formTitle.textContent = 'Modifier le RDV';
            document.getElementById('rdv-id').value = rdv.id;
            document.getElementById('rdv-title-input').value = rdv.title;
            document.getElementById('rdv-date-input').value = rdv.date;
            document.getElementById('rdv-location-input').value = rdv.location || '';
            deleteBtn.style.display = 'block';
        } else {
            formTitle.textContent = 'Ajouter un RDV';
            rdvForm.reset();
            document.getElementById('rdv-id').value = '';
            deleteBtn.style.display = 'none';
        }
        formModal.classList.add('active');
    };

    window.closeRdvForm = function() {
        formModal.classList.remove('active');
        rdvForm.reset();
    };

    // Exposer les fonctions pour les boutons onclick dans le HTML généré
    window.editRdv = function(id) {
        const rdv = allRdvs.find(r => r.id === id);
        if (rdv) {
            window.closeRdvManager(); // Ferme la liste
            window.openRdvForm(rdv);  // Ouvre le formulaire
        }
    };

    window.deleteRdv = async function(id) {
        if (!confirm('Supprimer ce RDV définitivement ?')) return;
        try {
            await fetch(`/api/rdv/${id}`, { method: 'DELETE' });
            window.closeRdvForm();
            fetchRdvs();
        } catch (err) {
            console.error(err);
            alert('Erreur lors de la suppression');
        }
    };

    // 6. Écouteurs d'événements
    openManagerBtn.addEventListener('click', window.openRdvManager);
    managerCloseBtn.addEventListener('click', window.closeRdvManager);
    managerModal.addEventListener('click', (e) => { if (e.target === managerModal) window.closeRdvManager(); });

    addNewBtn.addEventListener('click', () => {
        window.closeRdvManager();
        window.openRdvForm();
    });

    formCloseBtn.addEventListener('click', window.closeRdvForm);
    formModal.addEventListener('click', (e) => { if (e.target === formModal) window.closeRdvForm(); });

    // Soumission du formulaire
    rdvForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('rdv-id').value;
        const payload = {
            title: document.getElementById('rdv-title-input').value,
                             date: document.getElementById('rdv-date-input').value,
                             location: document.getElementById('rdv-location-input').value
        };

        try {
            const url = id ? `/api/rdv/${id}` : '/api/rdv';
            const method = id ? 'PUT' : 'POST';

            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            window.closeRdvForm();
            fetchRdvs();
        } catch (err) {
            console.error(err);
            alert('Erreur lors de la sauvegarde');
        }
    });

    // Lancement initial et mise à jour du countdown chaque minute
    fetchRdvs();
    setInterval(updateWidget, 60000);
}
