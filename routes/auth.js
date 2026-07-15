// ==========================================
// ROUTE D'AUTHENTIFICATION
// Gère la connexion, la déconnexion et la vérification de session
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

// ==========================================
// POST /api/auth/login
// Connexion de l'utilisateur
// ==========================================
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis' });
    }

    const user = findUser(username);

    if (!user) {
        console.log(`⚠️ Échec login : Utilisateur "${username}" non trouvé dans le store.`);
        return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    // Comparaison du mot de passe saisi avec le hash stocké
    if (bcrypt.compareSync(password, user.password)) {
        // On stocke le username en minuscules pour la cohérence de toute l'app
        const normalizedUsername = user.username.toLowerCase();
        req.session.user = { username: normalizedUsername };

        console.log(`✅ Connexion réussie : ${normalizedUsername}`);
        res.json({ success: true, user: normalizedUsername });
    } else {
        console.log(`⚠️ Échec login : Mot de passe incorrect pour "${username}"`);
        res.status(401).json({ error: 'Mot de passe incorrect' });
    }
});

// ==========================================
// POST /api/auth/logout
// Déconnexion de l'utilisateur
// ==========================================
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Erreur lors de la destruction de la session:', err);
            return res.status(500).json({ error: 'Erreur lors de la déconnexion' });
        }
        res.json({ success: true });
    });
});

// ==========================================
// GET /api/auth/me
// Vérifie si l'utilisateur est connecté et renvoie ses infos
// ==========================================
router.get('/me', (req, res) => {
    if (req.session.user && req.session.user.username) {
        const currentUserLower = req.session.user.username.toLowerCase();

        // On retrouve l'objet utilisateur original (pour avoir accès à ses données)
        const userObj = findUser(currentUserLower);

        if (!userObj) {
            // Session corrompue ou utilisateur supprimé
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

module.exports = router;
