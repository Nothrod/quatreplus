// server.js
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3006;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'quatreplus-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Passer à true en production avec HTTPS
}));

// ==========================================
// ROUTES DE L'API
// ==========================================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/shared', require('./routes/shared'));
app.use('/api/mood', require('./routes/mood'));
app.use('/api/thinkofyou', require('./routes/thinkofyou'));
app.use('/api/notifications', require('./routes/notifications'));

// Page d'accueil
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`🌸 Serveur Quatre+ lancé sur http://localhost:${PORT}`);
});
