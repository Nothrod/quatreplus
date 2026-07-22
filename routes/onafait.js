const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

let users = {};
let saveStore = () => console.warn('⚠️ saveStore non disponible');

try {
    const store = require('../data/store');
    users = store.users || {};
    if (typeof store.saveStore === 'function') saveStore = store.saveStore;
} catch (err) {
    console.error('❌ Erreur critique chargement store:', err);
}

const checkAuth = (req, res, next) => {
    if (!req.session.user || !req.session.user.username) return res.status(401).json({ error: 'Non connecté' });
    req.currentUser = req.session.user.username.toLowerCase();
    next();
};

// Helper pour éviter les erreurs d'arrondi JS (ex: 0.1 + 0.2)
const roundLevel = (num) => Math.round(num * 100) / 100;

router.get('/list', checkAuth, (req, res) => {
    try {
        const onafaitPath = path.join(__dirname, '../data/onafait.json');
        const items = JSON.parse(fs.readFileSync(onafaitPath, 'utf8'));
        const currentUserData = users[req.currentUser];
        const completed = currentUserData?.completedOnAFait || [];

        const enrichedItems = items.map(item => ({
            ...item,
            completed: completed.includes(item.id)
        }));

        res.json(enrichedItems);
    } catch (err) {
        console.error('❌ Erreur dans GET /api/onafait/list:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

router.post('/toggle', checkAuth, (req, res) => {
    try {
        const { id, completed } = req.body;
        const currentUser = req.currentUser;
        const otherUser = currentUser === 'marc' ? 'blandine' : 'marc';

        const currentUserData = users[currentUser];
        const otherUserData = users[otherUser];

        if (!currentUserData || !otherUserData) return res.status(500).json({ error: 'Utilisateur introuvable' });

        const onafaitPath = path.join(__dirname, '../data/onafait.json');
        const items = JSON.parse(fs.readFileSync(onafaitPath, 'utf8'));
        const item = items.find(i => i.id === id);

        if (!item) return res.status(404).json({ error: 'Élément introuvable' });

        if (!currentUserData.completedOnAFait) currentUserData.completedOnAFait = [];

        const updatePoints = (user, multiplier) => {
            if (!user.friendshipLevel) user.friendshipLevel = 3.5;
            user.friendshipLevel = Math.min(4.0, roundLevel(user.friendshipLevel + (item.points * multiplier)));
            user.updatedBy = 'system';
        };

        if (completed) {
            if (!currentUserData.completedOnAFait.includes(id)) {
                currentUserData.completedOnAFait.push(id);
                updatePoints(currentUserData, 1);
                updatePoints(otherUserData, 1);
            }
        } else {
            currentUserData.completedOnAFait = currentUserData.completedOnAFait.filter(itemId => itemId !== id);
            updatePoints(currentUserData, -1);
            updatePoints(otherUserData, -1);
        }

        saveStore(users);

        // Calcul du niveau affiché (plancher à 0.1 près, max 4.0)
        const displayLevel = Math.min(4.0, Math.floor(currentUserData.friendshipLevel * 10) / 10);

        res.json({ success: true, newLevel: currentUserData.friendshipLevel, displayLevel });
    } catch (err) {
        console.error('❌ Erreur dans POST /api/onafait/toggle:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
