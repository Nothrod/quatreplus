// routes/thinkofyou.js
const express = require('express');
const router = express.Router();
const { users, saveStore } = require('../data/store');

// Récupérer les stats
router.get('/', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Non connecté' });

    const currentUser = req.session.user;
    const otherUser = currentUser === 'marc' ? 'blandine' : 'marc';

    const myStats = users[currentUser].thinkOfYou || { total: 0, streak: 0, lastSent: null, history: [] };
    const otherStats = users[otherUser].thinkOfYou || { total: 0, streak: 0, lastSent: null, history: [] };

    res.json({
        myStats: myStats,
        otherStats: otherStats,
        otherName: users[otherUser].profile.name,
        canSend: canSendToday(currentUser)
    });
});

// Envoyer un "Je pense à toi"
router.post('/send', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Non connecté' });

    const currentUser = req.session.user;
    const otherUser = currentUser === 'marc' ? 'blandine' : 'marc';

    if (!users[currentUser].thinkOfYou) {
        users[currentUser].thinkOfYou = { total: 0, streak: 0, lastSent: null, history: [] };
    }

    if (!canSendToday(currentUser)) {
        return res.status(400).json({ error: 'Tu as déjà envoyé un "Je pense à toi" aujourd\'hui' });
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    users[currentUser].thinkOfYou.total = (users[currentUser].thinkOfYou.total || 0) + 1;
    users[currentUser].thinkOfYou.lastSent = now.getTime();

    if (!users[currentUser].thinkOfYou.history) {
        users[currentUser].thinkOfYou.history = [];
    }
    users[currentUser].thinkOfYou.history.push(today);

    users[currentUser].thinkOfYou.streak = calculateStreak(users[currentUser].thinkOfYou.history);

    // Créer une notification interne pour l'autre utilisateur
    if (!users[otherUser].pendingNotifications) {
        users[otherUser].pendingNotifications = [];
    }

    users[otherUser].pendingNotifications.push({
        type: 'thinkofyou',
        from: currentUser,
        fromName: users[currentUser].profile.name,
        streak: users[currentUser].thinkOfYou.streak,
        timestamp: now.getTime(),
                                               read: false
    });

    saveStore(users);

    res.json({
        success: true,
        stats: users[currentUser].thinkOfYou
    });
});

// Vérifier les notifications en attente
router.get('/check', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Non connecté' });

    const currentUser = req.session.user;

    if (!users[currentUser].pendingNotifications) {
        users[currentUser].pendingNotifications = [];
    }

    // Filtrer les notifications non lues
    const unread = users[currentUser].pendingNotifications.filter(n => !n.read);

    res.json({ notifications: unread });
});

// Marquer une notification comme lue
router.post('/mark-read', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Non connecté' });

    const currentUser = req.session.user;
    const { timestamp } = req.body;

    if (!users[currentUser].pendingNotifications) {
        return res.json({ success: true });
    }

    const notif = users[currentUser].pendingNotifications.find(n => n.timestamp === timestamp);
    if (notif) {
        notif.read = true;
        saveStore(users);
    }

    res.json({ success: true });
});

// Route de reset (pour les tests)
router.post('/reset', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Non connecté' });

    const currentUser = req.session.user;

    users[currentUser].thinkOfYou = {
        total: 0,
        streak: 0,
        lastSent: null,
        history: []
    };

    saveStore(users);

    res.json({ success: true, message: 'Compteur réinitialisé' });
});

function canSendToday(username) {
    const lastSent = users[username].thinkOfYou?.lastSent;
    if (!lastSent) return true;

    const lastDate = new Date(lastSent).toDateString();
    const today = new Date().toDateString();

    return lastDate !== today;
}

function calculateStreak(history) {
    if (!history || history.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    let currentDate = new Date(today);

    while (true) {
        const dateStr = currentDate.toISOString().split('T')[0];
        if (history.includes(dateStr)) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
}

module.exports = router;
