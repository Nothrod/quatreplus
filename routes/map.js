// routes/map.js
const express = require('express');
const router = express.Router();
const { users, saveStore } = require('../data/store');

// Récupérer tous les souvenirs
router.get('/memories', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Non connecté' });
    const memories = users.marc.memories || [];
    res.json({ memories });
});

// Ajouter un souvenir
router.post('/memories', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Non connecté' });

    const { title, desc, date, lat, lng } = req.body;

    const newMemory = {
        id: Date.now(),
            title,
            desc,
            date,
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

// 🗑️ NOUVEAU : Supprimer un souvenir
router.delete('/memories/:id', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Non connecté' });

    const memoryId = parseInt(req.params.id);

    // Filtrer pour retirer le souvenir
    users.marc.memories = (users.marc.memories || []).filter(m => m.id !== memoryId);
    users.blandine.memories = [...users.marc.memories];

    saveStore(users);

    res.json({ success: true });
});

module.exports = router;
