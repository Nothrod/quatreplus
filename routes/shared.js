// routes/shared.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../public/images');
const dataDir = path.join(__dirname, '../data');
const metaPath = path.join(dataDir, 'photo-meta.json');

// S'assurer que les dossiers existent au démarrage
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Configuration de multer (écrase l'ancienne photo)
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, 'shared-photo.jpg')
});
const upload = multer({ storage: storage });

// Lire les métadonnées (qui a mis la photo)
function getMeta() {
    if (fs.existsSync(metaPath)) {
        return JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    }
    return { author: null };
}

// Sauvegarder les métadonnées
function saveMeta(author) {
    fs.writeFileSync(metaPath, JSON.stringify({ author }));
}

// 1. Récupérer la photo actuelle et son auteur
router.get('/photo', (req, res) => {
    const photoPath = path.join(uploadDir, 'shared-photo.jpg');
    const meta = getMeta();
    
    if (fs.existsSync(photoPath)) {
        res.json({ 
            photoUrl: `/images/shared-photo.jpg?t=${Date.now()}`,
            author: meta.author
        });
    } else {
        res.json({ photoUrl: null, author: null });
    }
});

// 2. Uploader une nouvelle photo
router.post('/photo', upload.single('photo'), (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Non connecté' });
    }
    if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    // On sauvegarde QUI vient d'uploader
    saveMeta(req.session.user);

    res.json({ 
        success: true, 
        photoUrl: `/images/shared-photo.jpg?t=${Date.now()}`,
        author: req.session.user
    });
});

module.exports = router;