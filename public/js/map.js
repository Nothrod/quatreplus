// public/js/map.js
export function initMap() {
    console.log('🗺️ Module Carte chargé');

    // 1️⃣ SÉLECTION SÉCURISÉE DES ÉLÉMENTS DU DOM
    const mapContainer = document.getElementById('map-container');
    const addBtn = document.getElementById('add-memory-btn');
    const modal = document.getElementById('memory-modal');
    const closeBtn = modal ? modal.querySelector('.modal-close') : null;
    const form = document.getElementById('memory-form');
    const dateInput = document.getElementById('memory-date');

    // Si le conteneur de la carte n'existe pas, on arrête tout proprement sans faire planter l'app
    if (!mapContainer) {
        console.warn('⚠️ #map-container introuvable. Initialisation de la carte annulée pour le moment.');
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

    // 2️⃣ Fonction pour initialiser ou "réveiller" la carte
    function ensureMapIsReady() {
        if (!isInitialized) {
            console.log('📍 Initialisation de la carte Leaflet');
            isInitialized = true;

            map = L.map('map-container', {
                zoomControl: false,
                tap: true
            }).setView([DEFAULT_LAT, DEFAULT_LNG], DEFAULT_ZOOM);

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

                tempMarker = L.marker([selectedLat, selectedLng], {
                    icon: createCustomIcon()
                }).addTo(map);

                openModal();
            });
        } else {
            setTimeout(() => {
                if (map) map.invalidateSize();
            }, 100);
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

        const marker = L.marker([memory.lat, memory.lng], {
            icon: createCustomIcon()
        }).addTo(map);

        const popupContent = `
        <div class="memory-popup-content">
        <div class="memory-popup-title">${memory.title}</div>
        <div class="memory-popup-desc">${memory.desc}</div>
        <div class="memory-popup-date">📅 ${new Date(memory.date).toLocaleDateString('fr-FR')}</div>
        <button class="memory-delete-btn" data-id="${memory.id}">🗑️ Supprimer</button>
        </div>
        `;

        marker.memoryId = memory.id;
        marker.bindPopup(popupContent, {
            closeButton: true,
            closeOnClick: true,
            autoClose: true,
            maxWidth: 250
        });

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

    async function deleteMemory(memoryId, marker) {
        if (!confirm('Supprimer ce souvenir ? Cette action est définitive.')) return;

        try {
            const res = await fetch(`/api/map/memories/${memoryId}`, { method: 'DELETE' });
            const data = await res.json();

            if (data.success) {
                map.closePopup();
                map.removeLayer(marker);
                markers = markers.filter(m => m.memoryId !== memoryId);
                memoriesData = memoriesData.filter(m => m.id !== memoryId);
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
        } catch (err) {
            console.error('Erreur chargement carte:', err);
        }
    }

    // 3️⃣ FONCTIONS ET ÉCOUTEURS D'ÉVÉNEMENTS SÉCURISÉS

    function openModal() {
        // ✅ CORRECTION : On vérifie que le champ date existe avant de lui assigner une valeur
        if (dateInput) {
            dateInput.valueAsDate = new Date();
        }
        if (modal) {
            modal.classList.add('active');
        }
    }

    function resetAddButton() {
        if (addBtn) {
            addBtn.innerHTML = '<span>📍</span><span>Ajouter un souvenir</span>';
            addBtn.disabled = false;
        }
    }

    // ✅ CORRECTION : On n'attache l'événement que si le bouton existe
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            ensureMapIsReady();
            alert("📍 Cliquez maintenant n'importe où sur la carte pour placer votre épingle !");
        });
    }

    // ✅ CORRECTION : On vérifie que closeBtn et form existent
    if (closeBtn && modal && form) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            form.reset();
            if (tempMarker && map) {
                map.removeLayer(tempMarker);
                tempMarker = null;
            }
            selectedLat = null;
            selectedLng = null;
            resetAddButton();
        });
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                if (form) form.reset();
                if (tempMarker && map) {
                    map.removeLayer(tempMarker);
                    tempMarker = null;
                }
                selectedLat = null;
                selectedLng = null;
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

                    if (modal) modal.classList.remove('active');
                              if (form) form.reset();

                              if (tempMarker && map) {
                                  map.removeLayer(tempMarker);
                                  tempMarker = null;
                              }
                              selectedLat = null;
                    selectedLng = null;

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

    // Écouteur sur l'onglet de navigation
    const mapTabBtn = document.querySelector('.nav-btn[data-tab="tab-map"]');
    if (mapTabBtn) {
        mapTabBtn.addEventListener('click', () => {
            ensureMapIsReady();
        });
    }

    // Lancer le chargement des données en arrière-plan
    loadMemories();
}
