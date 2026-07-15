const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

const MUSIC_FILE = path.join(__dirname, '..', 'data', 'music.json');

async function ensureMusicFileExists() {
    try {
        await fs.access(MUSIC_FILE);
    } catch {
        const defaultData = {
            marc: { title: '', artist: '', url: '', updatedAt: null },
            blandine: { title: '', artist: '', url: '', updatedAt: null }
        };
        await fs.mkdir(path.dirname(MUSIC_FILE), { recursive: true });
        await fs.writeFile(MUSIC_FILE, JSON.stringify(defaultData, null, 2));
    }
}

// Middleware de vérification robuste de la session
function checkSession(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Non connecté' });
    }

    const username = req.session.user.username;
    if (!username) {
        console.error("⚠️ ERREUR SESSION : L'objet user existe, mais 'username' est manquant !");
        console.log("🔍 Contenu de req.session.user :", req.session.user);
        return res.status(400).json({ error: 'Session invalide : nom d utilisateur manquant' });
    }

    req.currentUser = username.toLowerCase();
    next();
}

// GET /api/music - Récupérer la musique de L'AUTRE
router.get('/', checkSession, async (req, res) => {
    try {
        await ensureMusicFileExists();
        const data = await fs.readFile(MUSIC_FILE, 'utf8');
        const musicData = JSON.parse(data);

        const otherUser = req.currentUser === 'marc' ? 'blandine' : 'marc';
        const otherMusic = musicData[otherUser] || {};

        res.json({
            title: otherMusic.title || '',
            artist: otherMusic.artist || '',
            url: otherMusic.url || '',
            updatedBy: otherUser,
            updatedAt: otherMusic.updatedAt
        });
    } catch (err) {
        console.error('Erreur lecture musique:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET /api/music/mine - Récupérer SA propre musique
router.get('/mine', checkSession, async (req, res) => {
    try {
        await ensureMusicFileExists();
        const data = await fs.readFile(MUSIC_FILE, 'utf8');
        const musicData = JSON.parse(data);

        const myMusic = musicData[req.currentUser] || {};

        res.json({
            title: myMusic.title || '',
            artist: myMusic.artist || '',
            url: myMusic.url || '',
            updatedAt: myMusic.updatedAt
        });
    } catch (err) {
        console.error('Erreur lecture ma musique:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// POST /api/music - Sauvegarder SA propre musique
router.post('/', checkSession, async (req, res) => {
    try {
        const { title, artist, url } = req.body;
        if (!title || !artist) {
            return res.status(400).json({ error: 'Titre et artiste requis' });
        }

        await ensureMusicFileExists();
        const data = await fs.readFile(MUSIC_FILE, 'utf8');
        const musicData = JSON.parse(data);

        console.log(`💾 SAUVEGARDE : ${req.currentUser} enregistre "${title}" de "${artist}"`);

        musicData[req.currentUser] = {
            title: title.trim(),
            artist: artist.trim(),
            url: url ? url.trim() : '',
            updatedAt: new Date().toISOString()
        };

        await fs.writeFile(MUSIC_FILE, JSON.stringify(musicData, null, 2));

        res.json({ success: true, message: 'Musique sauvegardée' });
    } catch (err) {
        console.error('Erreur sauvegarde musique:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
