// ==========================================
// ROUTE D'AUTHENTIFICATION
// ==========================================
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { users } = require('../data/store');

// Fonction utilitaire pour trouver l'utilisateur peu importe la casse
const findUser = (username) => {
    const lowerUser = username.toLowerCase();
    return Object.values(users).find(u => u.username && u.username.toLowerCase() === lowerUser) || null;
};

// POST /api/auth/login
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    console.log(`[BACKEND] Tentative de login pour: "${username}"`);

    if (!username || !password) {
        return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis' });
    }

    const user = findUser(username);
    if (!user) {
        console.log(`⚠️ [BACKEND] Échec : Utilisateur "${username}" non trouvé.`);
        return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    if (bcrypt.compareSync(password, user.password)) {
        const normalizedUsername = user.username.toLowerCase();
        req.session.user = { username: normalizedUsername };

        console.log(`✅ [BACKEND] Connexion réussie : ${normalizedUsername}. Session ID:`, req.sessionID);
        res.json({ success: true, user: normalizedUsername });
    } else {
        console.log(`⚠️ [BACKEND] Échec : Mot de passe incorrect pour "${username}"`);
        res.status(401).json({ error: 'Mot de passe incorrect' });
    }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    console.log(`[BACKEND] Déconnexion demandée.`);
    req.session.destroy((err) => {
        if (err) {
            console.error('Erreur destruction session:', err);
            return res.status(500).json({ error: 'Erreur lors de la déconnexion' });
        }
        res.clearCookie('connect.sid', { path: '/' });
        res.json({ success: true });
    });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
    console.log(`[BACKEND] Vérification /me. Session user actuelle:`, req.session.user);

    if (req.session.user && req.session.user.username) {
        const currentUserLower = req.session.user.username.toLowerCase();
        const userObj = findUser(currentUserLower);

        if (!userObj) {
            req.session.destroy();
            return res.json({ loggedIn: false });
        }

        const otherUserLower = currentUserLower === 'marc' ? 'blandine' : 'marc';
        const otherUserObj = findUser(otherUserLower);

        res.json({
            loggedIn: true,
            user: currentUserLower,
            myProfile: userObj.profile || {},
            otherProfile: otherUserObj ? otherUserObj.profile : {}
        });
    } else {
        res.json({ loggedIn: false });
    }
});

// ⚠️ CETTE LIGNE EST ABSOLUMENT CRUCIALE. ELLE DOIT ÊTRE TOUTE SEULE À LA FIN.
module.exports = router;
