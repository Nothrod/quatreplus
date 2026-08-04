const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const rdvPath = path.join(__dirname, '../data/rdv.json');

// Créer le fichier avec un tableau vide s'il n'existe pas
if (!fs.existsSync(rdvPath)) {
    fs.writeFileSync(rdvPath, JSON.stringify([]));
}

// GET : Récupérer tous les RDV (triés par date)
router.get('/', (req, res) => {
    try {
        let rawData = fs.readFileSync(rdvPath, 'utf8');
        let rdvs = JSON.parse(rawData);

        // 🛡️ CORRECTION : Si c'est l'ancien format (un objet), on le réinitialise en tableau
        if (!Array.isArray(rdvs)) {
            rdvs = [];
            fs.writeFileSync(rdvPath, JSON.stringify(rdvs, null, 2));
        }

        // Trier par date croissante (les plus proches en premier)
        rdvs.sort((a, b) => new Date(a.date) - new Date(b.date));
        res.json(rdvs);
    } catch (err) {
        console.error("Erreur lecture RDV:", err);
        // En cas de fichier corrompu, on le réinitialise
        fs.writeFileSync(rdvPath, JSON.stringify([]));
        res.json([]);
    }
});

// POST : Ajouter un nouveau RDV
router.post('/', (req, res) => {
    try {
        let rawData = fs.readFileSync(rdvPath, 'utf8');
        let rdvs = JSON.parse(rawData);
        if (!Array.isArray(rdvs)) rdvs = [];

        const newRdv = {
            id: Date.now().toString(),
            title: req.body.title,
            date: req.body.date,
            location: req.body.location || ''
        };
        rdvs.push(newRdv);
        fs.writeFileSync(rdvPath, JSON.stringify(rdvs, null, 2));
        res.json({ success: true, rdv: newRdv });
    } catch (err) {
        res.status(500).json({ error: 'Erreur de sauvegarde' });
    }
});

// PUT : Modifier un RDV existant
router.put('/:id', (req, res) => {
    try {
        let rawData = fs.readFileSync(rdvPath, 'utf8');
        let rdvs = JSON.parse(rawData);
        if (!Array.isArray(rdvs)) rdvs = [];

        const index = rdvs.findIndex(r => r.id === req.params.id);
        if (index !== -1) {
            rdvs[index] = { ...rdvs[index], ...req.body };
            fs.writeFileSync(rdvPath, JSON.stringify(rdvs, null, 2));
            res.json({ success: true, rdv: rdvs[index] });
        } else {
            res.status(404).json({ error: 'RDV non trouvé' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Erreur de modification' });
    }
});

// DELETE : Supprimer un RDV
router.delete('/:id', (req, res) => {
    try {
        let rawData = fs.readFileSync(rdvPath, 'utf8');
        let rdvs = JSON.parse(rawData);
        if (!Array.isArray(rdvs)) rdvs = [];

        rdvs = rdvs.filter(r => r.id !== req.params.id);
        fs.writeFileSync(rdvPath, JSON.stringify(rdvs, null, 2));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Erreur de suppression' });
    }
});

module.exports = router;
