const express = require('express');
const router = express.Router();
const { users, saveStore } = require('../data/store');

// Récupérer tous les lieux
router.get('/', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Non connecté' });
    res.json({ places: users.marc.placesToVisit || [] });
});

// Ajouter un lieu
router.post('/', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Non connecté' });

    const { name, lat, lng, type, description, photoUrl } = req.body;
    const currentUser = req.session.user;
    const otherUser = currentUser === 'marc' ? 'blandine' : 'marc';
    const displayName = currentUser === 'marc' ? 'Marc' : 'Blandine';

    const newPlace = {
        id: Date.now().toString(),
            name,
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            type: type || 'autre',
            description: description || '',
            photoUrl: photoUrl || '',
            done: false,
            addedBy: currentUser
    };

    if (!users.marc.placesToVisit) users.marc.placesToVisit = [];
    users.marc.placesToVisit.push(newPlace);
    users.blandine.placesToVisit = [...users.marc.placesToVisit]; // Synchronisation

    // ➕ NOUVEAU : Ajouter une notification en attente pour l'autre personne
    if (!users[otherUser].pendingNotifications) {
        users[otherUser].pendingNotifications = [];
    }

    users[otherUser].pendingNotifications.push({
        id: Date.now().toString(),
                                               type: 'visiter',
                                               text: `${displayName} a ajouté "${name}" à la carte des lieux à visiter.`,
                                               link: '/', // Redirige vers l'accueil ou l'onglet des lieux selon ta structure
                                               createdAt: Date.now()
    });

    saveStore(users);

    res.json({ success: true, place: newPlace });
});

// Modifier un lieu
router.put('/:id', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Non connecté' });
    const place = users.marc.placesToVisit.find(p => p.id === req.params.id);
    if (place) {
        Object.assign(place, req.body);
        users.blandine.placesToVisit = [...users.marc.placesToVisit];
        saveStore(users);
        res.json({ success: true, place });
    } else {
        res.status(404).json({ error: 'Lieu non trouvé' });
    }
});

// Basculer l'état "fait"
router.patch('/:id/toggle', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Non connecté' });
    const place = users.marc.placesToVisit.find(p => p.id === req.params.id);
    if (place) {
        place.done = !place.done;
        users.blandine.placesToVisit = [...users.marc.placesToVisit];
        saveStore(users);
        res.json({ success: true, place });
    } else {
        res.status(404).json({ error: 'Lieu non trouvé' });
    }
});

// Supprimer un lieu
router.delete('/:id', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Non connecté' });
    users.marc.placesToVisit = users.marc.placesToVisit.filter(p => p.id !== req.params.id);
    users.blandine.placesToVisit = [...users.marc.placesToVisit];
    saveStore(users);
    res.json({ success: true });
});

module.exports = router;
