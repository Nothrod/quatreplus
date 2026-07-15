// routes/friendship.js
const express = require('express');
const router = express.Router();

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

        if (!currentUserData || !otherUserData) return res.status(500).json({ error: 'Utilisateur introuvable' });

        const level = currentUserData.friendshipLevel || 3.5;
        const hasPending = otherUserData.pendingFriendshipProposal;
        const amIWaiting = hasPending && hasPending.proposedBy?.toLowerCase() === req.currentUser;

        res.json({
            currentLevel: level,
            isMaxLevel: level >= 4.0,
            reached4PlusAt: currentUserData.reached4PlusAt || null,
            updatedBy: currentUserData.updatedBy || null,
            amIWaiting: amIWaiting,
            myPendingProposal: amIWaiting ? { level: hasPending.level, date: hasPending.date } : null,
            waitingForUser: amIWaiting ? otherUsername : null
        });
    } catch (err) {
        console.error('❌ Erreur dans GET /api/friendship:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

router.get('/pending', checkAuth, (req, res) => {
    try {
        const currentUserData = users[req.currentUser];
        if (!currentUserData) return res.status(500).json({ error: 'Utilisateur introuvable' });

        res.json({
            hasPending: !!currentUserData.pendingFriendshipProposal,
            proposedLevel: currentUserData.pendingFriendshipProposal?.level || null,
            proposedBy: currentUserData.pendingFriendshipProposal?.proposedBy || null
        });
    } catch (err) {
        console.error('❌ Erreur dans GET /api/friendship/pending:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

router.post('/propose', checkAuth, (req, res) => {
    try {
        const { level } = req.body;
        const currentUserData = users[req.currentUser];
        const otherUsername = req.currentUser === 'marc' ? 'blandine' : 'marc';
        const otherUserData = users[otherUsername];

        if (!currentUserData || !otherUserData) return res.status(500).json({ error: 'Utilisateur introuvable' });

        otherUserData.pendingFriendshipProposal = {
            level: parseFloat(level),
            proposedBy: req.currentUser,
            date: new Date().toISOString()
        };

        try {
            saveStore(users);
            console.log(`📤 [PROPOSE] ${req.currentUser} propose ${level} à ${otherUsername}`);
        } catch (saveErr) {
            console.error('❌ Échec sauvegarde (propose):', saveErr);
        }

        res.json({ success: true, message: 'Proposition envoyée !' });
    } catch (err) {
        console.error('❌ Erreur dans POST /api/friendship/propose:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

router.post('/accept', checkAuth, (req, res) => {
    try {
        const currentUserData = users[req.currentUser];
        if (!currentUserData) return res.status(500).json({ error: 'Utilisateur introuvable' });

        if (currentUserData.pendingFriendshipProposal) {
            const newLevel = currentUserData.pendingFriendshipProposal.level;
            const proposer = currentUserData.pendingFriendshipProposal.proposedBy;
            const otherUsername = req.currentUser === 'marc' ? 'blandine' : 'marc';
            const otherUserData = users[otherUsername];

            [currentUserData, otherUserData].forEach(user => {
                if (user) {
                    user.friendshipLevel = newLevel;
                    user.updatedBy = proposer;
                    if (newLevel >= 4.0 && !user.reached4PlusAt) {
                        user.reached4PlusAt = new Date().toISOString();
                    }
                    user.pendingFriendshipProposal = null;
                }
            });

            try {
                saveStore(users);
                console.log(`✅ [ACCEPT] ${req.currentUser} a validé le niveau ${newLevel}`);
            } catch (saveErr) {
                console.error('❌ Échec sauvegarde (accept):', saveErr);
            }

            res.json({ success: true, newLevel });
        } else {
            res.status(400).json({ error: 'Aucune proposition en attente' });
        }
    } catch (err) {
        console.error('❌ Erreur dans POST /api/friendship/accept:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
