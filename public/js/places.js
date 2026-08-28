// ➕ 1. IMPORT DU SYSTÈME DE NOTIFICATION (Active le polling en arrière-plan)
import { notifSystem } from './notif-bell.js';

// ==========================================
// 1. DONNÉES INITIALES (Seed)
// ==========================================
const initialPlaces = [
    // ... (ton immense tableau de lieux reste exactement pareil, je l'ai raccourci ici pour la lisibilité) ...
    { name: "Grotte des Faux Monnayeurs", lat: 47.02942420732729, lng: 6.288137211049027, type: "grotte" }
];

// ==========================================
// 2. VARIABLES GLOBALES
// ==========================================
let map = null;
let markers = {};
let placesData = [];

// ==========================================
// 3. FONCTIONS UTILITAIRES
// ==========================================
function getEmojiForType(type) {
    const map = {
        'cascade': '🌊', 'chapelle': '⛪', 'chateau': '🏰', 'source': '💧',
        'grotte': '🕳️', 'belvedere': '🔭', 'parc': '🌳', 'saut': '🏞️',
        'cimetiere': '🪦', 'barrage': '🧱', 'labyrinthe': '🌽', 'etang': '🏞️',
        'saline': '⛏️', 'sentier': '🥾', 'cite': '🧚', 'bloc': '🧗',
        'action': '🎯', 'piscine': '🏊', 'ski': '🎿', 'reserve': '🌿',
        'moulin': '🏚️', 'dolmen': '🗿', 'autre': '📍'
    };
    return map[type] || '📍';
}

function createCustomIcon(emoji, isDone) {
    const filter = isDone ? '' : 'grayscale(100%) opacity(0.6)';
    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="font-size: 28px; filter: ${filter}; text-align: center; line-height: 1;">${emoji}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });
}

// ==========================================
// 4. INITIALISATION ET CHARGEMENT
// ==========================================
async function initPlaces() {
    const widgetEntry = document.getElementById('widget-places-entry');
    if (widgetEntry) {
        widgetEntry.addEventListener('click', () => {
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            document.getElementById('tab-places').classList.add('active');
            if (!map) {
                initMap();
            }
            loadPlaces();
        });
    }

    const backBtn = document.getElementById('back-to-home-from-places');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.getElementById('tab-home').classList.add('active');
            document.querySelector('[data-tab="tab-home"]').classList.add('active');
        });
    }

    document.getElementById('add-place-btn')?.addEventListener('click', () => openPlaceModal());
    document.getElementById('close-place-modal')?.addEventListener('click', closePlaceModal);
    document.getElementById('place-form')?.addEventListener('submit', handlePlaceSubmit);
    document.getElementById('delete-place-btn')?.addEventListener('click', handlePlaceDelete);
}

function initMap() {
    map = L.map('places-map').setView([47.2, 6.5], 9);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);
}

async function loadPlaces() {
    try {
        const res = await fetch('/api/places');
        const data = await res.json();

        if (!data.places || data.places.length === 0) {
            for (const place of initialPlaces) {
                await fetch('/api/places', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(place)
                });
            }
            return loadPlaces();
        }

        placesData = data.places;
        renderMap();
        renderChecklist();
    } catch (err) {
        console.error('Erreur chargement lieux:', err);
    }
}

// ==========================================
// 5. RENDU
// ==========================================
function renderMap() {
    Object.values(markers).forEach(m => map.removeLayer(m));
    markers = {};

    const group = new L.featureGroup();

    placesData.forEach(place => {
        const emoji = getEmojiForType(place.type);
        const icon = createCustomIcon(emoji, place.done);

        const marker = L.marker([place.lat, place.lng], { icon }).addTo(map);
        marker.bindPopup(`
        <strong>${place.name}</strong><br>
        <small>${emoji} ${place.type}</small><br>
        ${place.description ? `<p>${place.description}</p>` : ''}
        ${place.photoUrl ? `<img src="${place.photoUrl}" style="width:100%; margin-top:5px; border-radius:4px;">` : ''}
        <br><button onclick="window.editPlace('${place.id}')" style="margin-top:5px; padding:4px 8px;">✏️ Modifier</button>
        `);

        markers[place.id] = marker;
        group.addLayer(marker);
    });

    if (placesData.length > 0) {
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

function renderChecklist() {
    const container = document.getElementById('places-checklist');
    container.innerHTML = '';

    const sorted = [...placesData].sort((a, b) => {
        if (a.done === b.done) return a.name.localeCompare(b.name);
        return a.done ? 1 : -1;
    });

    sorted.forEach(place => {
        const emoji = getEmojiForType(place.type);
        const item = document.createElement('div');
        item.className = `checklist-item ${place.done ? 'done' : 'todo'}`;
        item.innerHTML = `
        <div class="checklist-info" onclick="window.focusPlaceOnMap('${place.id}')">
        <span class="place-emoji ${place.done ? '' : 'grayscale'}">${emoji}</span>
        <div class="place-details">
        <strong>${place.name}</strong>
        <small>${place.type}</small>
        </div>
        </div>
        <input type="checkbox" ${place.done ? 'checked' : ''} onchange="window.togglePlaceDone('${place.id}')">
        <button class="btn-edit" onclick="window.editPlace('${place.id}')">✏️</button>
        `;
        container.appendChild(item);
    });
}

// ==========================================
// 6. ACTIONS (exposées globalement pour le HTML)
// ==========================================
window.focusPlaceOnMap = (id) => {
    const marker = markers[id];
    if (marker && map) {
        map.setView(marker.getLatLng(), 13);
        marker.openPopup();
    }
};

window.togglePlaceDone = async (id) => {
    try {
        await fetch(`/api/places/${id}/toggle`, { method: 'PATCH' });
        loadPlaces();
    } catch (err) {
        console.error('Erreur toggle:', err);
    }
};

window.editPlace = (id) => {
    const place = placesData.find(p => p.id === id);
    if (!place) return;

    document.getElementById('modal-title').textContent = 'Modifier le lieu';
    document.getElementById('place-id').value = place.id;
    document.getElementById('place-name').value = place.name;
    document.getElementById('place-type').value = place.type;
    document.getElementById('place-lat').value = place.lat;
    document.getElementById('place-lng').value = place.lng;
    document.getElementById('place-desc').value = place.description || '';
    document.getElementById('place-photo').value = place.photoUrl || '';
    document.getElementById('delete-place-btn').style.display = 'inline-block';

    document.getElementById('place-modal').classList.add('active');
};

function openPlaceModal() {
    document.getElementById('modal-title').textContent = 'Ajouter un lieu';
    document.getElementById('place-form').reset();
    document.getElementById('place-id').value = '';
    document.getElementById('delete-place-btn').style.display = 'none';
    document.getElementById('place-modal').classList.add('active');
}

function closePlaceModal() {
    document.getElementById('place-modal').classList.remove('active');
}

async function handlePlaceSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('place-id').value;
    const payload = {
        name: document.getElementById('place-name').value,
        type: document.getElementById('place-type').value,
        lat: document.getElementById('place-lat').value,
        lng: document.getElementById('place-lng').value,
        description: document.getElementById('place-desc').value,
        photoUrl: document.getElementById('place-photo').value
    };

    try {
        const url = id ? `/api/places/${id}` : '/api/places';
        const method = id ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        // ✅ SUPPRIMÉ : La notification est maintenant gérée par le serveur (routes/places.js)
        // pour assurer la synchronisation entre Marc et Blandine.

        closePlaceModal();
        loadPlaces();
    } catch (err) {
        console.error('Erreur sauvegarde:', err);
        alert('Erreur lors de la sauvegarde');
    }
}

async function handlePlaceDelete() {
    const id = document.getElementById('place-id').value;
    if (!id || !confirm('Supprimer ce lieu définitivement ?')) return;

    try {
        await fetch(`/api/places/${id}`, { method: 'DELETE' });
        closePlaceModal();
        loadPlaces();
    } catch (err) {
        console.error('Erreur suppression:', err);
    }
}

// ==========================================
// GESTION DU PANNEAU COULISSANT (BOTTOM SHEET)
// ==========================================
function setupBottomSheet() {
    const toggleListBtn = document.getElementById('toggle-places-float-btn');
    const listPanel = document.getElementById('places-list-panel');
    const closePanelBtn = document.getElementById('close-places-panel');

    function toggleListPanel(e) {
        if (e) e.preventDefault();
        if (!listPanel) return;

        const isActive = listPanel.classList.toggle('active');

        if (toggleListBtn) {
            toggleListBtn.style.display = isActive ? 'none' : 'flex';
        }

        setTimeout(() => {
            if (map) map.invalidateSize();
        }, 350);
    }

    if (toggleListBtn) toggleListBtn.addEventListener('click', toggleListPanel);
    if (closePanelBtn) closePanelBtn.addEventListener('click', toggleListPanel);
}

// ==========================================
// INITIALISATION GLOBALE
// ==========================================
initPlaces();
setupBottomSheet();

document.addEventListener('DOMContentLoaded', () => {
    initPlaces();
});
