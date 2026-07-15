// public/js/map.js
export function initMap() {
    console.log('🗺️ Module Carte chargé (en attente d\'affichage)');

    let map = null;
    let markers = [];
    let tempMarker = null;
    let selectedLat = null;
    let selectedLng = null;
    let isInitialized = false;
    let memoriesData = []; // Stocke les données en mémoire

    const DEFAULT_LAT = 47.1536;
    const DEFAULT_LNG = 6.5553;
    const DEFAULT_ZOOM = 13;

    // 1️⃣ Fonction pour initialiser ou "réveiller" la carte
    function ensureMapIsReady() {
        if (!isInitialized) {
            console.log('📍 Initialisation de la carte Leaflet');
            isInitialized = true;

            map = L.map('map-container', {
                zoomControl: false,
                tap: true // Force l'activation du tactile sur mobile
            }).setView([DEFAULT_LAT, DEFAULT_LNG], DEFAULT_ZOOM);

            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap',
                maxZoom: 19
            }).addTo(map);

            // Ajouter les marqueurs déjà chargés en mémoire
            memoriesData.forEach(addMarkerToMap);

            // Gestion du clic sur la carte pour ajouter un point
            map.on('click', function(e) {
                // 1️⃣ Fermer tout popup ouvert pour éviter les conflits de clic
                map.closePopup();

                // 2️⃣ Ignorer si on clique sur un marqueur existant
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
            // 2️⃣ CRUCIAL : Si la carte existe déjà, on la force à recalculer sa taille
            // C'est ce qui répare le bug quand on change d'onglet (display: none -> block)
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

    // Charger les données en arrière-plan dès le début
    async function loadMemories() {
        try {
            const res = await fetch('/api/map/memories');
            const data = await res.json();
            memoriesData = data.memories;

            // Si la carte est déjà visible, on affiche les points tout de suite
            if (isInitialized && map) {
                memoriesData.forEach(addMarkerToMap);
                if (memoriesData.length > 0) {
                    const group = new L.featureGroup(markers);
                    map.fitBounds(group.getBounds().pad(0.3));
                }
            }
        } catch (err) {
            console.error('Erreur chargement carte:', err);
        }
    }

    // 3️⃣ Déclencher l'initialisation QUAND on clique sur l'onglet Carte
    const mapTabBtn = document.querySelector('.nav-btn[data-tab="tab-map"]');
    if (mapTabBtn) {
        mapTabBtn.addEventListener('click', () => {
            ensureMapIsReady();
        });
    }

    // Gestion de la Modal
    const modal = document.getElementById('memory-modal');
    const addBtn = document.getElementById('add-memory-btn');
    const closeBtn = document.querySelector('.modal-close');
    const form = document.getElementById('memory-form');

    function openModal() {
        document.getElementById('memory-date').valueAsDate = new Date();
        modal.classList.add('active');
    }

    addBtn.addEventListener('click', () => {
        ensureMapIsReady(); // S'assurer que la carte est prête avant de demander un clic
        alert("📍 Cliquez maintenant n'importe où sur la carte pour placer votre épingle !");
    });

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

    function resetAddButton() {
        addBtn.innerHTML = '<span>📍</span><span>Ajouter un souvenir</span>';
        addBtn.disabled = false;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!selectedLat || !selectedLng) {
            alert("Veuillez d'abord cliquer sur la carte pour placer le lieu.");
            return;
        }

        const title = document.getElementById('memory-title').value;
        const desc = document.getElementById('memory-desc').value;
        const date = document.getElementById('memory-date').value;

        addBtn.innerHTML = '<span>⏳</span><span>Enregistrement...</span>';
        addBtn.disabled = true;

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
                modal.classList.remove('active');
                form.reset();

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

    // Lancer le chargement des données en arrière-plan
    loadMemories();
}
