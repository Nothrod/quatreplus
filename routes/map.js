const express = require('express');
const router = express.Router();
const { users, saveStore } = require('../data/store');

// Récupérer tous les souvenirs
router.get('/memories', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Non connecté' });
    res.json({ memories: users.marc.memories || [] });
});

// Ajouter un souvenir
router.post('/memories', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Non connecté' });
    const { title, desc, date, lat, lng } = req.body;

    const newMemory = {
        id: Date.now().toString(), // String pour cohérence avec places.js
            title, desc, date,
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            addedBy: req.session.user
    };

    if (!users.marc.memories) users.marc.memories = [];
    users.marc.memories.push(newMemory);
    users.blandine.memories = [...users.marc.memories];
    saveStore(users);

    res.json({ success: true, memory: newMemory });
});

// ✅ NOUVEAU : Modifier un souvenir
router.put('/memories/:id', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Non connecté' });

    const memory = users.marc.memories.find(m => m.id === req.params.id);
    if (memory) {
        Object.assign(memory, {
            title: req.body.title,
            desc: req.body.desc,
            date: req.body.date,
            lat: parseFloat(req.body.lat),
                      lng: parseFloat(req.body.lng)
        });
        users.blandine.memories = [...users.marc.memories];
        saveStore(users);
        res.json({ success: true, memory });
    } else {
        res.status(404).json({ error: 'Souvenir non trouvé' });
    }
});

// Supprimer un souvenir
router.delete('/memories/:id', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Non connecté' });
    users.marc.memories = (users.marc.memories || []).filter(m => m.id !== req.params.id);
    users.blandine.memories = [...users.marc.memories];
    saveStore(users);
    res.json({ success: true });
});

// ✅ PROXY DE RECHERCHE D'ADRESSE (Contourne le CORS du navigateur)
router.get('/search-address', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Non connecté' });

    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Query requise' });

    try {
        // C'est le serveur Node qui fait la requête, pas le navigateur
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
                                     {
                                         headers: {
                                             'User-Agent': 'QuatrePlusServer/1.0' // Requis par Nominatim
                                         }
                                     }
        );
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Erreur proxy recherche:', error);
        res.status(500).json({ error: 'Erreur de recherche' });
    }
});

module.exports = router;
