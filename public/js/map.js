// public/js/map.js
export function initMap() {
    console.log('🗺️ Module Carte chargé');

    const mapContainer = document.getElementById('map-container');
    const addBtn = document.getElementById('add-memory-btn');
    const modal = document.getElementById('memory-modal');
    const closeBtn = modal ? modal.querySelector('.modal-close') : null;
    const form = document.getElementById('memory-form');
    const dateInput = document.getElementById('memory-date');

    // Éléments du Bottom Sheet
    const toggleListBtn = document.getElementById('toggle-places-list-btn');
    const bottomSheet = document.getElementById('places-bottom-sheet');
    const closeSheetBtn = document.getElementById('close-bottom-sheet');
    const listContainer = document.getElementById('places-list-container');

    if (!mapContainer) {
        console.warn('⚠️ #map-container introuvable.');
        return;
    }

    let map = null;
    let markers = [];
    let tempMarker = null;
    let selectedLat = null;
    let selectedLng = null;
    let isInitialized = false;
    let memoriesData = [];

    const DEFAULT_LAT = 47.1536;
    const DEFAULT_LNG = 6.5553;
    const DEFAULT_ZOOM = 13;

    function ensureMapIsReady() {
        if (!isInitialized) {
            console.log('📍 Initialisation de la carte Leaflet');
            isInitialized = true;

            map = L.map('map-container', { zoomControl: false, tap: true })
            .setView([DEFAULT_LAT, DEFAULT_LNG], DEFAULT_ZOOM);

            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap',
                maxZoom: 19
            }).addTo(map);

            memoriesData.forEach(addMarkerToMap);

            map.on('click', function(e) {
                map.closePopup();
                if (e.originalEvent.target.closest('.leaflet-marker-icon')) return;

                selectedLat = e.latlng.lat;
                selectedLng = e.latlng.lng;

                if (tempMarker) map.removeLayer(tempMarker);
                tempMarker = L.marker([selectedLat, selectedLng], { icon: createCustomIcon() }).addTo(map);
                openModal();
            });
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
        <div class="memory-popup-content">
        <div class="memory-popup-title">${memory.title}</div>
        <div class="memory-popup-desc">${memory.desc}</div>
        <div class="memory-popup-date">📅 ${new Date(memory.date).toLocaleDateString('fr-FR')}</div>
        <button class="memory-delete-btn" data-id="${memory.id}">🗑️ Supprimer</button>
        </div>
        `;

        marker.memoryId = memory.id;
        marker.bindPopup(popupContent, { closeButton: true, closeOnClick: true, autoClose: true, maxWidth: 250 });
        markers.push(marker);

        marker.on('popupopen', function() {
            setTimeout(() => {
                const deleteBtn = document.querySelector(`.memory-delete-btn[data-id="${memory.id}"]`);
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteMemory(memory.id, marker);
                    }, { once: true });
                }
            }, 50);
        });
    }

    // ✨ NOUVEAU : Générer la liste dans le bottom sheet
    function renderPlacesList() {
        if (!listContainer) return;

        if (memoriesData.length === 0) {
            listContainer.innerHTML = '<p style="text-align: center; color: #a0aec0; padding: 20px;">Aucun lieu pour le moment.</p>';
            return;
        }

        // Trier par date décroissante (plus récent en premier)
        const sortedMemories = [...memoriesData].sort((a, b) => new Date(b.date) - new Date(a.date));

        listContainer.innerHTML = sortedMemories.map(memory => {
            const dateStr = new Date(memory.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
            return `
            <div class="place-list-item" data-id="${memory.id}" data-lat="${memory.lat}" data-lng="${memory.lng}">
            <div class="place-item-icon">📍</div>
            <div class="place-item-content">
            <div class="place-item-title">${memory.title}</div>
            <div class="place-item-desc">${memory.desc}</div>
            <div class="place-item-date">📅 ${dateStr}</div>
            </div>
            <div class="place-item-arrow">›</div>
            </div>
            `;
        }).join('');

        // Ajouter les écouteurs de clic sur chaque élément de la liste
        document.querySelectorAll('.place-list-item').forEach(item => {
            item.addEventListener('click', () => {
                const lat = parseFloat(item.dataset.lat);
                const lng = parseFloat(item.dataset.lng);
                const id = parseInt(item.dataset.id);

                closeBottomSheet(); // Fermer le panneau

                if (map) {
                    // Animation fluide vers le lieu
                    map.flyTo([lat, lng], 16, { duration: 1.2 });

                    // Ouvrir le popup une fois l'animation terminée
                    setTimeout(() => {
                        const targetMarker = markers.find(m => m.memoryId === id);
                        if (targetMarker) targetMarker.openPopup();
                    }, 1200);
                }
            });
        });
    }

    function openBottomSheet() {
        if (bottomSheet) {
            renderPlacesList();
            bottomSheet.classList.add('active');
        }
    }

    function closeBottomSheet() {
        if (bottomSheet) bottomSheet.classList.remove('active');
    }

    async function deleteMemory(memoryId, marker) {
        if (!confirm('Supprimer ce souvenir ?')) return;
        try {
            const res = await fetch(`/api/map/memories/${memoryId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                map.closePopup();
                map.removeLayer(marker);
                markers = markers.filter(m => m.memoryId !== memoryId);
                memoriesData = memoriesData.filter(m => m.id !== memoryId);
                renderPlacesList(); // Mettre à jour la liste après suppression
            }
        } catch (err) {
            console.error('Erreur suppression:', err);
            alert('Erreur lors de la suppression');
        }
    }

    async function loadMemories() {
        try {
            const res = await fetch('/api/map/memories');
            const data = await res.json();
            memoriesData = data.memories || [];

            if (isInitialized && map && memoriesData.length > 0) {
                memoriesData.forEach(addMarkerToMap);
                const group = new L.featureGroup(markers);
                map.fitBounds(group.getBounds().pad(0.3));
            }
            renderPlacesList(); // Pré-remplir la liste
        } catch (err) {
            console.error('Erreur chargement carte:', err);
        }
    }

    function openModal() {
        if (dateInput) dateInput.valueAsDate = new Date();
        if (modal) modal.classList.add('active');
    }

    function resetAddButton() {
        if (addBtn) {
            addBtn.innerHTML = '<span>📍</span><span>Ajouter un souvenir</span>';
            addBtn.disabled = false;
        }
    }

    // Écouteurs d'événements
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            ensureMapIsReady();
            alert("📍 Cliquez maintenant n'importe où sur la carte pour placer votre épingle !");
        });
    }

    if (closeBtn && modal && form) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            form.reset();
            if (tempMarker && map) { map.removeLayer(tempMarker); tempMarker = null; }
            selectedLat = null; selectedLng = null;
            resetAddButton();
        });
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                if (form) form.reset();
                if (tempMarker && map) { map.removeLayer(tempMarker); tempMarker = null; }
                selectedLat = null; selectedLng = null;
                resetAddButton();
            }
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!selectedLat || !selectedLng) {
                alert("Veuillez d'abord cliquer sur la carte pour placer le lieu.");
                return;
            }

            const title = document.getElementById('memory-title')?.value || '';
            const desc = document.getElementById('memory-desc')?.value || '';
            const date = document.getElementById('memory-date')?.value || '';

            if (addBtn) {
                addBtn.innerHTML = '<span>⏳</span><span>Enregistrement...</span>';
                addBtn.disabled = true;
            }

            try {
                const res = await fetch('/api/map/memories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, desc, date, lat: selectedLat, lng: selectedLng })
                });

                const data = await res.json();
                if (data.success) {
                    memoriesData.push(data.memory);
                    addMarkerToMap(data.memory);
                    renderPlacesList(); // Mettre à jour la liste

                    if (modal) modal.classList.remove('active');
                              if (form) form.reset();
                              if (tempMarker && map) { map.removeLayer(tempMarker); tempMarker = null; }
                              selectedLat = null; selectedLng = null;

                    if (map) {
                        map.setView([data.memory.lat, data.memory.lng], 15);
                        setTimeout(() => {
                            const lastMarker = markers[markers.length - 1];
                            if (lastMarker) lastMarker.openPopup();
                        }, 300);
                    }
                }
            } catch (err) {
                console.error(err);
                alert('Erreur lors de l\'ajout');
            } finally {
                resetAddButton();
            }
        });
    }

    // ✨ Écouteurs pour le Bottom Sheet
    if (toggleListBtn) toggleListBtn.addEventListener('click', openBottomSheet);
    if (closeSheetBtn) closeSheetBtn.addEventListener('click', closeBottomSheet);

    // Fermer le sheet si on clique en dehors (sur la carte)
    if (mapContainer) {
        mapContainer.addEventListener('click', () => {
            // Petit délai pour éviter que le clic d'ouverture ne le referme immédiatement
            setTimeout(closeBottomSheet, 100);
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
