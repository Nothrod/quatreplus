// ==========================================
// 1. DONNÉES INITIALES (Seed)
// ==========================================
const initialPlaces = [
    { name: "Cascade du rognon", lat: 47.294452900374885, lng: 6.229482551035063, type: "cascade" },
{ name: "Chapelle de Châtey", lat: 47.374223744997586, lng: 6.772145589115969, type: "chapelle" },
{ name: "Saut du Day", lat: 46.71912916611881, lng: 6.407666372953908, type: "saut" },
{ name: "Chapelle du Mont, Chaffois", lat: 46.91548851568348, lng: 6.276130800283766, type: "chapelle" },
{ name: "Les jardins aquatiques d'Acorus", lat: 47.36866695006819, lng: 5.8072144284244445, type: "parc" },
{ name: "Acorus", lat: 47.36750386830083, lng: 5.807739527194405, type: "autre" },
{ name: "Cimetière de Baume-les-Dames", lat: 47.35516298662556, lng: 6.362689827229252, type: "cimetiere" },
{ name: "Grotte Sarrasine", lat: 46.96571881121311, lng: 6.008039597917281, type: "grotte" },
{ name: "Cascade du Moulin de Vermondans", lat: 47.19263009711683, lng: 6.556620586675736, type: "cascade" },
{ name: "Parc de la Panse", lat: 47.4602796081827, lng: 6.8659797622505145, type: "parc" },
{ name: "Combe du Pilouvi", lat: 47.07032066059798, lng: 7.080479255253439, type: "autre" },
{ name: "Fontaine", lat: 47.45148441382756, lng: 6.577947122621999, type: "source" },
{ name: "Cascade du verneau", lat: 46.979073786556526, lng: 6.004926743484157, type: "cascade" },
{ name: "Château de Bermont", lat: 47.37746505502776, lng: 6.603284677062039, type: "chateau" },
{ name: "Nans", lat: 47.476424524211254, lng: 6.412602075953949, type: "autre" },
{ name: "Tour Jürgensen", lat: 47.06345694476963, lng: 6.708252673883496, type: "autre" },
{ name: "Belvédère des Taillards Villers le Lac", lat: 47.08233001505581, lng: 6.700280141729943, type: "belvedere" },
{ name: "Barrage du Chatelôt", lat: 47.10128419605144, lng: 6.74413847974406, type: "barrage" },
{ name: "LABYRINTHE DE MAÏS DE LA FERME DES ACACIAS", lat: 47.54703701271558, lng: 6.508777231821788, type: "labyrinthe" },
{ name: "Parking Du Saut Du Doubs", lat: 47.08578441601347, lng: 6.702791408422862, type: "autre" },
{ name: "Étang des Belles Seignes", lat: 47.118002580845754, lng: 6.6638643137306195, type: "etang" },
{ name: "Cimetière Ancien de Mélecey", lat: 47.52042310613573, lng: 6.486440275806641, type: "cimetiere" },
{ name: "Aquaparc Isis", lat: 47.072636700755744, lng: 5.486275023283862, type: "piscine" },
{ name: "Panorama Canyons du Doubs", lat: 47.084032277411225, lng: 6.707092072046078, type: "belvedere" },
{ name: "Les Roches de Moron", lat: 47.100994003466596, lng: 6.75275896430055, type: "dolmen" },
{ name: "Mouthier-Haute-Pierre", lat: 47.04052534482987, lng: 6.274875747163834, type: "autre" },
{ name: "Saline Royale d'Arc-et-Senans", lat: 47.033421788717376, lng: 5.777599191661973, type: "saline" },
{ name: "Sentier Karstique du Grand Bois", lat: 47.16108702040756, lng: 6.061692248606115, type: "sentier" },
{ name: "Château de Fontenoy-le-Château", lat: 47.973391892468435, lng: 6.200142919291171, type: "chateau" },
{ name: "Gorges du Taubenloch", lat: 47.16349036993203, lng: 7.259689215252549, type: "saut" },
{ name: "Cuves de Bléfond", lat: 47.32518741348959, lng: 6.344774755758522, type: "grotte" },
{ name: "Voie romaine", lat: 47.206532167383585, lng: 6.009053320493995, type: "sentier" },
{ name: "Cascade de la Pisseure", lat: 47.20368739955123, lng: 6.008479501299906, type: "cascade" },
{ name: "Grotte d'Osselle", lat: 47.138577542392696, lng: 5.836784574108611, type: "grotte" },
{ name: "Grotte du Château de la Roche", lat: 47.33131028774256, lng: 6.846784541818656, type: "grotte" },
{ name: "Cité des nains", lat: 47.29342074394264, lng: 6.610514319114301, type: "cite" },
{ name: "Cascade Roche les Blamonts", lat: 47.41163970622559, lng: 6.8571688354065525, type: "cascade" },
{ name: "Le Salbert", lat: 47.66010235443365, lng: 6.813185121591279, type: "autre" },
{ name: "Belvédère de la Roche de Hautepierre", lat: 47.04968691657177, lng: 6.279633213493286, type: "belvedere" },
{ name: "Bloc Session Belfort", lat: 47.61562376100251, lng: 6.853661665845788, type: "bloc" },
{ name: "Rush Action game Belfort", lat: 47.61574843749023, lng: 6.850676443559074, type: "action" },
{ name: "L'Arrosoir Rougemont le chateau", lat: 47.73343372728927, lng: 6.969541834489407, type: "chateau" },
{ name: "Gouffre de Pourpevelle", lat: 47.45947273639951, lng: 6.484016932771534, type: "grotte" },
{ name: "La Motte - Vesoul", lat: 47.629482994032344, lng: 6.152257804837349, type: "autre" },
{ name: "La Ferme Aventure", lat: 48.005396941137214, lng: 6.313810035368897, type: "labyrinthe" },
{ name: "Étang de la Véronne", lat: 47.68856404672866, lng: 6.810727627104889, type: "etang" },
{ name: "Cascade Montperreux", lat: 46.70510999863629, lng: 6.209271256682332, type: "cascade" },
{ name: "Source du Doubs", lat: 46.70510999863629, lng: 6.209271256682332, type: "source" },
{ name: "Source du Pontet", lat: 47.02869612547308, lng: 6.2884423125982725, type: "source" },
{ name: "Source du Cusancin", lat: 47.32221478220644, lng: 6.43719619872642, type: "source" },
{ name: "Source d'Arcier", lat: 47.26687350661351, lng: 6.1203860428082555, type: "source" },
{ name: "La Piscine - Munster", lat: 48.04140507152075, lng: 7.145399213444186, type: "piscine" },
{ name: "Château de Joux", lat: 46.872035177580585, lng: 6.372033693342598, type: "chateau" },
{ name: "Fort Mahler", lat: 46.87609435878439, lng: 6.378017219912322, type: "chateau" },
{ name: "Bouverans", lat: 46.85540029517927, lng: 6.2095464964614395, type: "autre" },
{ name: "Gorges de Nouailles", lat: 47.02382119873141, lng: 6.2926898149755495, type: "saut" },
{ name: "JURASSICA Sentier didactique", lat: 47.402861688181076, lng: 7.020486540682744, type: "sentier" },
{ name: "Les Péquignots - Passavant", lat: 47.2795192876851, lng: 6.3750041384736305, type: "autre" },
{ name: "Parc Miniatures", lat: 47.96202790408475, lng: 6.453114710805606, type: "parc" },
{ name: "Parc des Miches", lat: 47.512322987445025, lng: 6.791282883354717, type: "parc" },
{ name: "les étangs des princes", lat: 47.52821880944884, lng: 6.711182191347108, type: "etang" },
{ name: "Fente de Babre", lat: 47.34534849111093, lng: 6.3790955949742045, type: "autre" },
{ name: "Tour des Bois", lat: 47.369941472824905, lng: 6.215775180064781, type: "autre" },
{ name: "Parc de Wesserling - Écomusée Textile", lat: 47.8863517813815, lng: 6.997805345541565, type: "parc" },
{ name: "Parc des Cèdres", lat: 47.487749617279995, lng: 6.9162310688816975, type: "parc" },
{ name: "Pont les moulins", lat: 47.32123404980341, lng: 6.36414058810253, type: "autre" },
{ name: "Base de Loisirs & Nautique de la Saline", lat: 47.66330534310024, lng: 6.503261169222162, type: "saline" },
{ name: "La Chassignole", lat: 47.32806891864704, lng: 6.322718249879411, type: "autre" },
{ name: "Grotte de Malatiere", lat: 47.476468741992726, lng: 6.484115700352268, type: "grotte" },
{ name: "Téléski Schlumpf", lat: 47.793514786219816, lng: 6.922575496692345, type: "ski" },
{ name: "Station de La Planche des Belles Filles", lat: 47.77257178392703, lng: 6.777626257946219, type: "ski" },
{ name: "Domaine skiable Alpin du Ballon d'Alsace", lat: 47.801349799137455, lng: 6.848647904516049, type: "ski" },
{ name: "Piste de Luge du Sommet", lat: 47.82166638199923, lng: 6.837173072757613, type: "ski" },
{ name: "Station de Métabief Montagnes du Jura", lat: 46.768485763079205, lng: 6.356925976221967, type: "ski" },
{ name: "Fournets-Luisans", lat: 47.0955853962957, lng: 6.556034174842105, type: "autre" },
{ name: "Réserve Naturelle des Tourbières de Frasne", lat: 46.834778242307706, lng: 6.15675901267713, type: "reserve" },
{ name: "Belvédère de Vandoncourt", lat: 47.461406291177106, lng: 6.912041103975412, type: "belvedere" },
{ name: "Le Pont Sarrazin", lat: 47.456828052663546, lng: 6.914942161514882, type: "autre" },
{ name: "Moulin De La Doue", lat: 47.40771796913636, lng: 6.9159003994052055, type: "moulin" },
{ name: "Grottes et Préhisto-Parc", lat: 47.35905102085958, lng: 6.914351693546548, type: "grotte" },
{ name: "Source bleue - Cusance", lat: 47.3266704698681, lng: 6.439828730747692, type: "source" },
{ name: "Belvedere de Mandeure", lat: 47.43097908151317, lng: 6.79571111589677, type: "belvedere" },
{ name: "Ile Art Malans", lat: 47.26759245010876, lng: 5.587836971205718, type: "autre" },
{ name: "Saut de l'Ognon", lat: 47.80888958973636, lng: 6.676626272720449, type: "saut" },
{ name: "Château de Montby", lat: 47.43888690034549, lng: 6.443616796263008, type: "chateau" },
{ name: "Dolmen de Santoche", lat: 47.416049409726575, lng: 6.495762577804309, type: "dolmen" },
{ name: "Château de Wildenstein", lat: 47.94915317972569, lng: 6.959326411699101, type: "chateau" },
{ name: "Sentier des Faînes et Forêt Enchantée", lat: 47.49836887046061, lng: 7.023418035455044, type: "sentier" },
{ name: "Sentier ludique de le Côte Roux", lat: 47.467649826273664, lng: 6.782157504869944, type: "sentier" },
{ name: "La Doue", lat: 47.40260773008301, lng: 6.902446124672682, type: "autre" },
{ name: "Batterie des Roches", lat: 47.373910513359974, lng: 6.779729433058791, type: "dolmen" },
{ name: "Noirefontaine", lat: 47.352443887424, lng: 6.76109898493187, type: "autre" },
{ name: "L'œil de Bœuf", lat: 47.34436073326869, lng: 6.771499369837678, type: "autre" },
{ name: "Château de Belvoir", lat: 47.31825878198488, lng: 6.603141786285326, type: "chateau" },
{ name: "Chapelle d'Aigremont", lat: 47.30784436026948, lng: 6.226275729261414, type: "chapelle" },
{ name: "Vestiges du Château de Vaite Doubs", lat: 47.293900173748725, lng: 6.236789778612857, type: "chateau" },
{ name: "Rocher du Bourbet", lat: 47.28223581594502, lng: 6.784451036882455, type: "dolmen" },
{ name: "Cascade de Waroly", lat: 47.26333796861799, lng: 6.764898297718251, type: "cascade" },
{ name: "Cascades de l'Audeux", lat: 47.251898504895486, lng: 6.362527934218534, type: "cascade" },
{ name: "Cascade du Val", lat: 47.21207601767065, lng: 6.551487699148563, type: "cascade" },
{ name: "Lac d'Alfeld", lat: 47.81749765761314, lng: 6.8717117302961475, type: "etang" },
{ name: "Puits de la Brême", lat: 47.11966669173775, lng: 6.119840812655911, type: "autre" },
{ name: "Ornans", lat: 47.10688881760508, lng: 6.1408240795258076, type: "autre" },
{ name: "Grand Saut", lat: 47.01766521555128, lng: 6.293518519019497, type: "saut" },
{ name: "Percée de Thoraise", lat: 47.170105628163114, lng: 5.906245684636798, type: "saut" },
{ name: "Saut du Doubs", lat: 47.087534987279966, lng: 6.7140552306208185, type: "saut" },
{ name: "Akila Gorges de la Loue", lat: 47.10433673629566, lng: 6.162764250424917, type: "saut" },
{ name: "Source de la Loue", lat: 47.011417971749445, lng: 6.299470770265159, type: "source" },
{ name: "Cascade de la Peusse", lat: 47.065689924195915, lng: 6.171859443803958, type: "cascade" },
{ name: "Source du Lison", lat: 46.96565559353046, lng: 6.011453569600887, type: "source" },
{ name: "Mont d'Or", lat: 46.7313824473455, lng: 6.35656690083543, type: "autre" },
{ name: "Cirque de Consolation", lat: 47.15611174555526, lng: 6.605985094995715, type: "saut" },
{ name: "Cascade du Lançot", lat: 47.15011216783022, lng: 6.609882195672966, type: "cascade" },
{ name: "Roche du Prêtre", lat: 47.14966177424905, lng: 6.606866131558204, type: "dolmen" },
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
    // Gestion de l'ouverture via le Widget 7
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

    // Bouton retour
    const backBtn = document.getElementById('back-to-home-from-places');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.getElementById('tab-home').classList.add('active');
            document.querySelector('[data-tab="tab-home"]').classList.add('active');
        });
    }

    // Bouton ajouter
    document.getElementById('add-place-btn')?.addEventListener('click', () => openPlaceModal());
    document.getElementById('close-place-modal')?.addEventListener('click', closePlaceModal);
    document.getElementById('place-form')?.addEventListener('submit', handlePlaceSubmit);
    document.getElementById('delete-place-btn')?.addEventListener('click', handlePlaceDelete);
}

function initMap() {
    map = L.map('places-map').setView([47.2, 6.5], 9); // Centré sur le Doubs/Jura
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);
}

async function loadPlaces() {
    try {
        const res = await fetch('/api/places');
        const data = await res.json();

        // Seed automatique si vide
        if (!data.places || data.places.length === 0) {
            for (const place of initialPlaces) {
                await fetch('/api/places', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(place)
                });
            }
            return loadPlaces(); // Recharger après seed
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
    // Effacer les anciens marqueurs
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

    // Trier : non faits en premier, puis par nom
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
        loadPlaces(); // Recharger pour mettre à jour l'UI
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

        await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

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
    // On utilise le nouvel ID unique
    const toggleListBtn = document.getElementById('toggle-places-float-btn');
    const listPanel = document.getElementById('places-list-panel');
    const closePanelBtn = document.getElementById('close-places-panel');

    console.log("🔍 Débogage : Bouton flottant trouvé ?", toggleListBtn);
    console.log("🔍 Débogage : Panneau trouvé ?", listPanel);

    function toggleListPanel(e) {
        if (e) e.preventDefault();
        if (!listPanel) {
            console.error("❌ Le panneau n'a pas été trouvé dans le HTML !");
            return;
        }

        const isActive = listPanel.classList.toggle('active');
        console.log("✅ État du panneau changé. Actif ?", isActive);

        if (toggleListBtn) {
            toggleListBtn.style.display = isActive ? 'none' : 'flex';
        }

        // Recalculer la taille de la carte après l'animation CSS
        setTimeout(() => {
            if (map) {
                map.invalidateSize();
            }
        }, 350);
    }

    if (toggleListBtn) {
        toggleListBtn.addEventListener('click', toggleListPanel);
    } else {
        console.error("❌ Le bouton toggle-places-float-btn n'a pas été trouvé !");
    }

    if (closePanelBtn) {
        closePanelBtn.addEventListener('click', toggleListPanel);
    }
}

// ==========================================
// INITIALISATION GLOBALE
// ==========================================
// Comme le script est un module chargé en bas de page, le DOM est déjà prêt.
// On appelle les fonctions directement.
initPlaces();
setupBottomSheet();

// Lancer l'initialisation dès que le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    initPlaces();
});
