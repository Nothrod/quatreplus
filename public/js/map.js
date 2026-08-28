// ➕ 1. IMPORT DU SYSTÈME DE NOTIFICATION (Nécessaire pour que le moteur de polling s'active)
import { notifSystem } from './notif-bell.js';

export function initMap() {
    console.log('🗺️ Module Carte chargé');

    const mapContainer = document.getElementById('map-container');
    const addBtn = document.getElementById('add-memory-btn');
    const modal = document.getElementById('memory-modal');
    const closeBtn = document.getElementById('memory-modal-close');
    const form = document.getElementById('memory-form');
    const deleteBtn = document.getElementById('delete-memory-btn');
    const modalTitle = document.getElementById('memory-modal-title');

    const addressInput = document.getElementById('memory-address');
    const suggestionsList = document.getElementById('address-suggestions');
    let searchTimeout = null;

    const toggleListBtn = document.getElementById('toggle-places-list-btn');
    const bottomSheet = document.getElementById('places-bottom-sheet');
    const closeSheetBtn = document.getElementById('close-bottom-sheet');
    const listContainer = document.getElementById('places-list-container');

    if (!mapContainer) return;

    let map = null;
    let markers = [];
    let memoriesData = [];
    let isInitialized = false;

    const DEFAULT_LAT = 47.1536;
    const DEFAULT_LNG = 6.5553;

    function ensureMapIsReady() {
        if (!isInitialized) {
            isInitialized = true;
            map = L.map('map-container', { zoomControl: false }).setView([DEFAULT_LAT, DEFAULT_LNG], 13);
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap', maxZoom: 19
            }).addTo(map);

            if (memoriesData.length > 0) {
                memoriesData.forEach(addMarkerToMap);
                const group = new L.featureGroup(markers);
                map.fitBounds(group.getBounds().pad(0.3));
            }
        } else {
            setTimeout(() => { if (map) map.invalidateSize(); }, 100);
        }
    }

    function createCustomIcon() {
        return L.divIcon({
            className: 'custom-pin',
            html: `<div style="background-color: #E6B8B8; width: 24px; height: 24px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.2);"></div>`,
                         iconSize: [24, 24],
                         iconAnchor: [12, 24],
                         popupAnchor: [0, -24]
        });
    }

    function addMarkerToMap(memory) {
        if (!map) return;
        const marker = L.marker([memory.lat, memory.lng], { icon: createCustomIcon() }).addTo(map);

        const popupContent = `
        <div style="text-align: center; padding: 5px;">
        <strong style="font-size: 1rem; color: #333;">${escapeHtml(memory.title)}</strong><br>
        <small style="color: #555; display: block; margin: 5px 0;">${escapeHtml(memory.desc)}</small>
        <small style="color: #888; font-size: 0.8rem;">📅 ${new Date(memory.date).toLocaleDateString('fr-FR')}</small>
        </div>
        `;
        marker.memoryId = String(memory.id);
        marker.bindPopup(popupContent, { maxWidth: 220 });
        markers.push(marker);
    }

    if (addressInput && suggestionsList) {
        addressInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();

            if (query.length < 3) {
                suggestionsList.style.display = 'none';
                return;
            }

            searchTimeout = setTimeout(async () => {
                try {
                    const r = await fetch(`/api/map/search-address?q=${encodeURIComponent(query)}`);
                    const results = await r.json();

                    if (results.length === 0) {
                        suggestionsList.style.display = 'none';
                        return;
                    }

                    suggestionsList.innerHTML = results.map(res => `
                    <div data-lat="${res.lat}" data-lng="${res.lon}">
                    ${escapeHtml(res.display_name)}
                    </div>
                    `).join('');
                    suggestionsList.style.display = 'block';

                    suggestionsList.querySelectorAll('div').forEach(div => {
                        div.addEventListener('click', () => {
                            document.getElementById('memory-lat').value = parseFloat(div.dataset.lat);
                            document.getElementById('memory-lng').value = parseFloat(div.dataset.lng);
                            addressInput.value = div.textContent.trim();
                            suggestionsList.style.display = 'none';
                        });
                    });

                } catch (e) {
                    console.error('Erreur recherche adresse:', e);
                }
            }, 500);
        });

        document.addEventListener('click', (e) => {
            if (!addressInput.contains(e.target) && !suggestionsList.contains(e.target)) {
                suggestionsList.style.display = 'none';
            }
        });
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    window.renderMemoryList = function() {
        if (!listContainer) return;
        if (memoriesData.length === 0) {
            listContainer.innerHTML = '<p style="text-align: center; color: #a0aec0; padding: 20px;">Aucun lieu pour le moment.</p>';
            return;
        }

        const sorted = [...memoriesData].sort((a, b) => new Date(b.date) - new Date(a.date));
        listContainer.innerHTML = sorted.map(memory => `
        <div class="place-list-item">
        <div class="place-item-clickable" onclick="window.flyToMemory('${memory.lat}', '${memory.lng}', '${memory.id}')">
        <div class="place-item-icon">📍</div>
        <div class="place-item-content">
        <div class="place-item-title">${escapeHtml(memory.title)}</div>
        <div class="place-item-desc">${escapeHtml(memory.desc)}</div>
        <div class="place-item-date">📅 ${new Date(memory.date).toLocaleDateString('fr-FR')}</div>
        </div>
        </div>
        <button class="btn-edit-memory" onclick="window.editMemory('${memory.id}')" title="Modifier">✏️</button>
        </div>
        `).join('');
    };

    window.flyToMemory = function(lat, lng, id) {
        closeBottomSheet();
        if (map) {
            map.flyTo([parseFloat(lat), parseFloat(lng)], 16, { duration: 1.2 });
            setTimeout(() => {
                const target = markers.find(m => m.memoryId === String(id));
                if (target) target.openPopup();
            }, 1200);
        }
    };

    window.editMemory = function(id) {
        const memory = memoriesData.find(m => String(m.id) === String(id));
        if (!memory) return;

        modalTitle.textContent = 'Modifier le souvenir';
        document.getElementById('memory-id').value = memory.id;
        document.getElementById('memory-title').value = memory.title;
        document.getElementById('memory-address').value = '';
        document.getElementById('memory-lat').value = memory.lat;
        document.getElementById('memory-lng').value = memory.lng;
        document.getElementById('memory-desc').value = memory.desc;
        document.getElementById('memory-date').value = memory.date;
        deleteBtn.style.display = 'block';

        modal.classList.add('active');
    }

    function openModalForAdd() {
        modalTitle.textContent = 'Ajouter un souvenir';
        form.reset();
        document.getElementById('memory-id').value = '';
        document.getElementById('memory-date').valueAsDate = new Date();
        deleteBtn.style.display = 'none';
        if (suggestionsList) suggestionsList.style.display = 'none';
        modal.classList.add('active');
    }

    function closeModal() {
        modal.classList.remove('active');
        form.reset();
        document.getElementById('memory-id').value = '';
        deleteBtn.style.display = 'none';
        if (suggestionsList) suggestionsList.style.display = 'none';
    }

    if (addBtn) {
        addBtn.addEventListener('click', () => {
            ensureMapIsReady();
            openModalForAdd();
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('memory-id').value;
            const payload = {
                title: document.getElementById('memory-title').value,
                              desc: document.getElementById('memory-desc').value,
                              date: document.getElementById('memory-date').value,
                              lat: parseFloat(document.getElementById('memory-lat').value),
                              lng: parseFloat(document.getElementById('memory-lng').value)
            };

            try {
                const url = id ? `/api/map/memories/${id}` : '/api/map/memories';
                const method = id ? 'PUT' : 'POST';

                const res = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();

                if (data.success) {
                    if (id) {
                        const index = memoriesData.findIndex(m => String(m.id) === String(id));
                        memoriesData[index] = { ...memoriesData[index], ...payload };

                        const marker = markers.find(m => m.memoryId === String(id));
                        if (marker) {
                            marker.setLatLng([payload.lat, payload.lng]);
                            marker.getPopup().setContent(`
                            <div style="text-align: center; padding: 5px;">
                            <strong style="font-size: 1rem; color: #333;">${escapeHtml(payload.title)}</strong><br>
                            <small style="color: #555; display: block; margin: 5px 0;">${escapeHtml(payload.desc)}</small>
                            <small style="color: #888; font-size: 0.8rem;">📅 ${new Date(payload.date).toLocaleDateString('fr-FR')}</small>
                            </div>
                            `);
                        }
                    } else {
                        memoriesData.push(data.memory);
                        addMarkerToMap(data.memory);

                        // ✅ SUPPRIMÉ : La notification est maintenant gérée par le serveur (routes/map.js)
                        // pour assurer la synchronisation entre Marc et Blandine.
                    }

                    window.renderMemoryList();
                    closeModal();

                    if (map) map.setView([payload.lat, payload.lng], 15);
                }
            } catch (err) {
                console.error(err);
                alert('Erreur lors de la sauvegarde');
            }
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            const id = document.getElementById('memory-id').value;
            if (!id || !confirm('Supprimer ce souvenir définitivement ?')) return;

            try {
                const res = await fetch(`/api/map/memories/${id}`, { method: 'DELETE' });
                const data = await res.json();
                if (data.success) {
                    memoriesData = memoriesData.filter(m => String(m.id) !== String(id));
                    const marker = markers.find(m => m.memoryId === String(id));
                    if (marker) {
                        map.removeLayer(marker);
                        markers = markers.filter(m => m.memoryId !== String(id));
                    }
                    window.renderMemoryList();
                    closeModal();
                }
            } catch (err) {
                console.error(err);
                alert('Erreur lors de la suppression');
            }
        });
    }

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    function openBottomSheet() {
        window.renderMemoryList();
        bottomSheet.classList.add('active');
    }

    function closeBottomSheet() {
        bottomSheet.classList.remove('active');
    }

    if (toggleListBtn) toggleListBtn.addEventListener('click', openBottomSheet);
    if (closeSheetBtn) closeSheetBtn.addEventListener('click', closeBottomSheet);

    async function loadMemories() {
        try {
            const res = await fetch('/api/map/memories');
            const data = await res.json();
            memoriesData = data.memories || [];
            if (isInitialized && memoriesData.length > 0) {
                memoriesData.forEach(addMarkerToMap);
                const group = new L.featureGroup(markers);
                map.fitBounds(group.getBounds().pad(0.3));
            }
            window.renderMemoryList();
        } catch (err) {
            console.error('Erreur chargement carte:', err);
        }
    }

    const backToHomeBtn = document.getElementById('back-to-home-from-map');
    if (backToHomeBtn) {
        backToHomeBtn.addEventListener('click', () => {
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            document.getElementById('tab-home').classList.add('active');
            document.querySelector('[data-tab="tab-home"]').classList.add('active');
        });
    }

    const mapTabBtn = document.querySelector('.nav-btn[data-tab="tab-map"]');
    if (mapTabBtn) {
        mapTabBtn.addEventListener('click', () => {
            ensureMapIsReady();
        });
    }

    loadMemories();
}
