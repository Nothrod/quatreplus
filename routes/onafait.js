const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// ➕ 1. IMPORT STANDARD DU STORE GLOBAL (plus propre et fiable)
const { users, saveStore } = require('../data/store');

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
        const displayName = currentUser === 'marc' ? 'Marc' : 'Blandine';

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

                // ➕ 2. NOUVEAU : Ajouter une notification pour l'autre personne (seulement à la validation)
                if (!users[otherUser].pendingNotifications) {
                    users[otherUser].pendingNotifications = [];
                }
                users[otherUser].pendingNotifications.push({
                    id: Date.now().toString(),
                                                           type: 'badge', // Utilise l'icône 🏆, parfait pour une validation de moment
                                                           text: `${displayName} a validé un nouveau moment : "${item.title}" 🎉`,
                                                           link: '/', // Ou l'URL de ton onglet onafait si tu en as une
                                                           createdAt: Date.now()
                });
            }
        } else {
            currentUserData.completedOnAFait = currentUserData.completedOnAFait.filter(itemId => itemId !== id);
            updatePoints(currentUserData, -1);
            updatePoints(otherUserData, -1);
        }

        // ➕ 3. SAUVEGARDE GLOBALE
        saveStore(users);

        const displayLevel = Math.min(4.0, Math.floor(currentUserData.friendshipLevel * 10) / 10);

        res.json({ success: true, newLevel: currentUserData.friendshipLevel, displayLevel });
    } catch (err) {
        console.error('❌ Erreur dans POST /api/onafait/toggle:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
