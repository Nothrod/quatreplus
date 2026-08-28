const express = require('express');
const router = express.Router();

// ➕ 1. IMPORT DU STORE GLOBAL (users ET saveStore)
const { users, saveStore } = require('../data/store');

const checkAuth = (req, res, next) => {
    if (!req.session.user || !req.session.user.username) {
        return res.status(401).json({ error: 'Non connecté' });
    }
    req.currentUser = req.session.user.username.toLowerCase();
    next();
};

// Fonction pour trouver l'utilisateur dans le store, peu importe la casse
const findUser = (username) => {
    return Object.values(users).find(u => u.username?.toLowerCase() === username) ||
    users[username] ||
    users[username.charAt(0).toUpperCase() + username.slice(1)];
};

router.get('/', checkAuth, (req, res) => {
    const currentUserData = findUser(req.currentUser);
    const otherUsername = req.currentUser === 'marc' ? 'blandine' : 'marc';
    const otherUserData = findUser(otherUsername);

    if (!currentUserData || !otherUserData) {
        return res.status(500).json({ error: 'Données utilisateur introuvables' });
    }

    res.json({
        myMood: currentUserData.profile?.mood || null,
        otherMood: otherUserData.profile?.mood || null,
        otherName: otherUsername
    });
});

router.post('/', checkAuth, (req, res) => {
    const { mood } = req.body;
    const currentUserData = findUser(req.currentUser);

    const otherUsername = req.currentUser === 'marc' ? 'blandine' : 'marc';
    const displayName = req.currentUser === 'marc' ? 'Marc' : 'Blandine';

    if (!currentUserData) return res.status(500).json({ error: 'Utilisateur introuvable' });

    if (!currentUserData.profile) currentUserData.profile = {};

    // On garde l'ancienne humeur pour l'afficher dans la notification
    const oldMood = currentUserData.profile.mood || '💭';
    currentUserData.profile.mood = mood;

    // ➕ 2. NOUVEAU : Ajouter une notification en attente pour l'autre personne
    if (!users[otherUsername]) users[otherUsername] = {}; // Sécurité
    if (!users[otherUsername].pendingNotifications) {
        users[otherUsername].pendingNotifications = [];
    }

    users[otherUsername].pendingNotifications.push({
        id: Date.now().toString(),
                                                   type: 'humeur',
                                                   text: `${displayName} a changé son humeur : ${oldMood} ➔ ${mood}`,
                                                   link: '/',
                                                   createdAt: Date.now()
    });

    // ➕ 3. SAUVEGARDE GLOBALE (remplace le TODO)
    saveStore(users);

    res.json({ success: true, mood });
});

module.exports = router;
