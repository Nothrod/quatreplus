// server.js (en haut du fichier)
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const SimpleJSONStore = require('./store/session-store'); // <-- NOUVEAU
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3006;

// S'assurer que le dossier 'data' existe
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration avec notre store personnalisé ultra-stable
app.use(session({
    store: new SimpleJSONStore({ ttl: 30 * 24 * 60 * 60 }), // 30 jours
                secret: process.env.SESSION_SECRET || 'quatreplus-secret-key',
                resave: false,
                saveUninitialized: false,
                cookie: {
                    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 jours
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax'
                }
}));

// ==========================================
// ROUTES DE L'API
// ==========================================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/shared', require('./routes/shared'));
app.use('/api/mood', require('./routes/mood'));
app.use('/api/thinkofyou', require('./routes/thinkofyou'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/music', require('./routes/music'));
app.use('/api/friendship', require('./routes/friendship'));
app.use('/api/map', require('./routes/map'));
app.use('/api/rdv', require('./routes/rdv'));
app.use('/api/question', require('./routes/question'));
app.use('/api/onafait', require('./routes/onafait'));

// Page d'accueil
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`🌸 Serveur Quatre+ lancé sur http://localhost:${PORT}`);
});
