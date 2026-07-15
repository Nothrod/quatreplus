// routes/mood.js
const express = require('express');
const router = express.Router();
const { users, saveStore } = require('../data/store');

// Récupérer les humeurs
router.get('/', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Non connecté' });
    
    const currentUser = req.session.user;
    const otherUser = currentUser === 'marc' ? 'blandine' : 'marc';
    
    res.json({
        myMood: users[currentUser].profile.mood,
        otherMood: users[otherUser].profile.mood,
        otherName: users[otherUser].profile.name
    });
});

// Mettre à jour mon humeur
router.post('/update', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Non connecté' });
    
    const { emoji } = req.body;
    users[req.session.user].profile.mood = {
        emoji: emoji,
        timestamp: Date.now()
    };
    
    // Sauvegarder immédiatement sur le disque !
    saveStore(users);
    
    res.json({ success: true, mood: users[req.session.user].profile.mood });
});

module.exports = router;