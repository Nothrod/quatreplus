// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // <-- On le rajoute ici !
const { users } = require('../data/store');

// Login
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users[username];
    
    if (!user) {
        return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }
    
    // On compare le mot de passe saisi avec le hash stocké
    if (bcrypt.compareSync(password, user.password)) {
        req.session.user = username;
        res.json({ success: true, user: username });
    } else {
        res.status(401).json({ error: 'Mot de passe incorrect' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Vérifier si connecté
router.get('/me', (req, res) => {
    if (req.session.user) {
        const currentUser = req.session.user;
        const otherUser = currentUser === 'marc' ? 'blandine' : 'marc';
        
        res.json({ 
            loggedIn: true,
            user: currentUser, 
            myProfile: users[currentUser].profile,
            otherProfile: users[otherUser].profile
        });
    } else {
        res.json({ loggedIn: false });
    }
});

module.exports = router;