// routes/notifications.js
const express = require('express');
const router = express.Router();
const webpush = require('web-push');
const fs = require('fs');
const path = require('path');
const { users, saveStore } = require('../data/store');

// Configuration VAPID
webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:test@example.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

// Fichier pour stocker les subscriptions push
const subscriptionsPath = path.join(__dirname, '../data/push-subscriptions.json');

// Charger les subscriptions
function loadSubscriptions() {
    if (fs.existsSync(subscriptionsPath)) {
        return JSON.parse(fs.readFileSync(subscriptionsPath, 'utf8'));
    }
    return { marc: [], blandine: [] };
}

// Sauvegarder les subscriptions
function saveSubscriptions(subs) {
    fs.writeFileSync(subscriptionsPath, JSON.stringify(subs, null, 2));
}

// Renvoyer la clé publique VAPID au frontend
router.get('/vapidPublicKey', (req, res) => {
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// Enregistrer une subscription push
router.post('/subscribe', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Non connecté' });
    
    const subscription = req.body;
    const username = req.session.user;
    
    const subs = loadSubscriptions();
    
    // Vérifier si cette subscription existe déjà
    const exists = subs[username].some(s => s.endpoint === subscription.endpoint);
    if (!exists) {
        subs[username].push(subscription);
        saveSubscriptions(subs);
    }
    
    res.json({ success: true });
});

// Envoyer une notification à un utilisateur spécifique
router.post('/send', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Non connecté' });
    
    const { targetUser, title, body, icon, url } = req.body;
    
    const subs = loadSubscriptions();
    const targetSubs = subs[targetUser] || [];
    
    if (targetSubs.length === 0) {
        return res.json({ success: false, message: 'Aucun appareil enregistré' });
    }
    
    const payload = JSON.stringify({
        title,
        body,
        icon: icon || '/images/icon-192.png',
        url: url || '/'
    });
    
    // Envoyer à toutes les subscriptions de l'utilisateur cible
    const promises = targetSubs.map(subscription => {
        return webpush.sendNotification(subscription, payload).catch(err => {
            console.error('Erreur envoi notification:', err);
            // Si la subscription est invalide, on la retire
            if (err.statusCode === 410) {
                const subs = loadSubscriptions();
                subs[targetUser] = subs[targetUser].filter(s => s.endpoint !== subscription.endpoint);
                saveSubscriptions(subs);
            }
        });
    });
    
    Promise.all(promises).then(() => {
        res.json({ success: true });
    });
});

// Fonction utilitaire pour envoyer une notification (utilisable depuis d'autres routes)
async function sendNotification(targetUser, title, body, icon, url) {
    const subs = loadSubscriptions();
    const targetSubs = subs[targetUser] || [];
    
    if (targetSubs.length === 0) return;
    
    const payload = JSON.stringify({
        title,
        body,
        icon: icon || '/images/icon-192.png',
        url: url || '/'
    });
    
    const promises = targetSubs.map(subscription => {
        return webpush.sendNotification(subscription, payload).catch(err => {
            console.error('Erreur envoi notification:', err);
        });
    });
    
    await Promise.all(promises);
}

module.exports = router;
module.exports.sendNotification = sendNotification;