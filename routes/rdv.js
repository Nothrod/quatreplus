// routes/rdv.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const rdvPath = path.join(__dirname, '../data/rdv.json');

// Créer le fichier s'il n'existe pas
if (!fs.existsSync(rdvPath)) {
    fs.writeFileSync(rdvPath, JSON.stringify({ title: 'Prochain RDV', date: '', location: '' }));
}

// GET : Récupérer le RDV actuel
router.get('/', (req, res) => {
    try {
        const rdv = JSON.parse(fs.readFileSync(rdvPath, 'utf8'));
        res.json(rdv);
    } catch (err) {
        res.status(500).json({ error: 'Erreur de lecture du RDV' });
    }
});

// POST : Mettre à jour le RDV
router.post('/', (req, res) => {
    try {
        const { title, date, location } = req.body;
        const rdv = { title, date, location };
        fs.writeFileSync(rdvPath, JSON.stringify(rdv, null, 2));
        res.json({ success: true, rdv });
    } catch (err) {
        res.status(500).json({ error: 'Erreur de sauvegarde du RDV' });
    }
});

module.exports = router;
