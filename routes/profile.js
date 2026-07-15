// routes/profile.js
const express = require('express');
const router = express.Router();

// Mettre à jour le profil
router.post('/update', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Non connecté' });
    }
    
    const { mood, music, startDate } = req.body;
    // Mettre à jour le profil en base
    res.json({ success: true });
});

// Obtenir le profil de l'autre
router.get('/other', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Non connecté' });
    }
    
    const otherUser = req.session.user === 'marc' ? 'blandine' : 'marc';
    // Récupérer le profil de l'autre
    res.json({ profile: {} });
});

module.exports = router;