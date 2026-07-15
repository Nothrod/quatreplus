// routes/thinkofyou.js
const express = require('express');
const router = express.Router();

// ✅ Import ultra-sécurisé du store
let users = {};
let saveStore = () => console.warn('⚠️ saveStore non disponible');

try {
    const store = require('../data/store');
    users = store.users || {};
    if (typeof store.saveStore === 'function') {
        saveStore = store.saveStore;
    }
} catch (err) {
    console.error('❌ Erreur critique chargement store:', err);
}

const checkAuth = (req, res, next) => {
    if (!req.session.user || !req.session.user.username) {
        return res.status(401).json({ error: 'Non connecté' });
    }
    req.currentUser = req.session.user.username.toLowerCase();
    next();
};

router.get('/', checkAuth, (req, res) => {
    try {
        const currentUserData = users[req.currentUser];
        const otherUsername = req.currentUser === 'marc' ? 'blandine' : 'marc';
        const otherUserData = users[otherUsername];

        if (!currentUserData || !otherUserData) {
            return res.status(500).json({ error: 'Données utilisateur introuvables' });
        }

        if (!currentUserData.thinkOfYou) currentUserData.thinkOfYou = { total: 0, streak: 0, lastSent: null };
        if (!otherUserData.thinkOfYou) otherUserData.thinkOfYou = { total: 0, streak: 0, lastSent: null };

        const lastSentTime = currentUserData.thinkOfYou.lastSent ? new Date(currentUserData.thinkOfYou.lastSent).getTime() : 0;
        const canSend = (Date.now() - lastSentTime) > (24 * 60 * 60 * 1000);

        res.json({
            myStats: { total: currentUserData.thinkOfYou.total, streak: currentUserData.thinkOfYou.streak },
            otherStats: { total: otherUserData.thinkOfYou.total },
            otherName: otherUsername,
            canSend: canSend
        });
    } catch (err) {
        console.error('❌ Erreur dans GET /api/thinkofyou:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

router.get('/check', checkAuth, (req, res) => {
    try {
        const currentUserData = users[req.currentUser];
        if (!currentUserData) return res.status(500).json({ error: 'Utilisateur introuvable' });

        if (!currentUserData.pendingNotifications) {
            currentUserData.pendingNotifications = [];
        }

        const notifications = [...currentUserData.pendingNotifications];

        // On vide le tableau
        currentUserData.pendingNotifications = [];

        // ✅ Sauvegarde protégée : si elle échoue, on log l'erreur mais on ne crash pas le serveur
        try {
            saveStore(users);
            console.log(`✅ [CHECK] Notifications vidées et sauvegardées pour ${req.currentUser}`);
        } catch (saveErr) {
            console.error('❌ Échec de la sauvegarde (check):', saveErr);
        }

        res.json({
            success: true,
            notifications: notifications,
            count: notifications.length
        });
    } catch (err) {
        console.error('❌ Erreur critique dans /check:', err);
        res.status(500).json({ error: 'Erreur serveur interne' });
    }
});

router.post('/send', checkAuth, (req, res) => {
    try {
        const currentUserData = users[req.currentUser];
        const otherUsername = req.currentUser === 'marc' ? 'blandine' : 'marc';
        const otherUserData = users[otherUsername];

        if (!currentUserData || !otherUserData) return res.status(500).json({ error: 'Utilisateur introuvable' });
        if (!currentUserData.thinkOfYou) currentUserData.thinkOfYou = { total: 0, streak: 0, lastSent: null };
        if (!otherUserData.pendingNotifications) otherUserData.pendingNotifications = [];

        const lastSentTime = currentUserData.thinkOfYou.lastSent ? new Date(currentUserData.thinkOfYou.lastSent).getTime() : 0;
        const canSend = (Date.now() - lastSentTime) > (24 * 60 * 60 * 1000);

        if (!canSend) return res.status(400).json({ error: 'Déjà envoyé aujourd\'hui' });

        currentUserData.thinkOfYou.total += 1;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const lastSentDateStr = currentUserData.thinkOfYou.lastSent ? new Date(currentUserData.thinkOfYou.lastSent).toDateString() : null;

        if (lastSentDateStr === yesterday.toDateString()) {
            currentUserData.thinkOfYou.streak += 1;
        } else {
            currentUserData.thinkOfYou.streak = 1;
        }

        currentUserData.thinkOfYou.lastSent = Date.now();

        otherUserData.pendingNotifications.push({
            type: 'thinkofyou',
            from: req.currentUser,
            fromName: req.currentUser === 'marc' ? 'Marc' : 'Blandine',
            streak: currentUserData.thinkOfYou.streak,
            timestamp: Date.now(),
                                                read: false
        });

        try {
            saveStore(users);
            console.log(`💌 [SEND] "Je pense à toi" envoyé de ${req.currentUser} à ${otherUsername}`);
        } catch (saveErr) {
            console.error('❌ Échec de la sauvegarde (send):', saveErr);
        }

        res.json({
            success: true,
            stats: { total: currentUserData.thinkOfYou.total, streak: currentUserData.thinkOfYou.streak }
        });
    } catch (err) {
        console.error('❌ Erreur critique dans /send:', err);
        res.status(500).json({ error: 'Erreur serveur interne' });
    }
});

router.post('/reset', checkAuth, (req, res) => {
    try {
        const currentUserData = users[req.currentUser];
        if (currentUserData && currentUserData.thinkOfYou) {
            currentUserData.thinkOfYou = { total: 0, streak: 0, lastSent: null, history: [] };
            currentUserData.pendingNotifications = [];

            try { saveStore(users); } catch (e) { console.error('❌ Échec sauvegarde (reset):', e); }
        }
        res.json({ success: true });
    } catch (err) {
        console.error('❌ Erreur critique dans /reset:', err);
        res.status(500).json({ error: 'Erreur serveur interne' });
    }
});

module.exports = router;
