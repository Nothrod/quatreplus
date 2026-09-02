const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ➕ 1. IMPORT DU STORE GLOBAL POUR LES NOTIFICATIONS
const { users, saveStore } = require('../data/store');

const dataDir = path.join(__dirname, '../data');
const messagesPath = path.join(dataDir, 'messages.json');
const metaPath = path.join(dataDir, 'messaging-meta.json');
const keyPath = path.join(dataDir, '.encryption-key');

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// ==========================================
// 🔐 CHIFFREMENT AES-256-GCM
// ==========================================
function getKey() {
    if (process.env.MESSAGE_SECRET) {
        return crypto.createHash('sha256').update(process.env.MESSAGE_SECRET).digest();
    }
    if (fs.existsSync(keyPath)) {
        return Buffer.from(fs.readFileSync(keyPath, 'utf8').trim(), 'hex');
    }
    const newKey = crypto.randomBytes(32);
    fs.writeFileSync(keyPath, newKey.toString('hex'), { mode: 0o600 });
    return newKey;
}

function encryptData(obj) {
    const key = getKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const enc = Buffer.concat([cipher.update(JSON.stringify(obj), 'utf8'), cipher.final()]);
    return {
        encrypted: true,
        iv: iv.toString('base64'),
        tag: cipher.getAuthTag().toString('base64'),
        data: enc.toString('base64')
    };
}

function decryptData(payload) {
    const key = getKey();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(payload.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(payload.tag, 'base64'));
    const dec = Buffer.concat([decipher.update(Buffer.from(payload.data, 'base64')), decipher.final()]);
    return JSON.parse(dec.toString('utf8'));
}

// ==========================================
// LECTURE / ÉCRITURE (chiffrées)
// ==========================================
function getMessages() {
    if (fs.existsSync(messagesPath)) {
        try {
            const raw = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
            if (raw && raw.encrypted) return decryptData(raw);
            return Array.isArray(raw) ? raw : [];
        } catch (e) {
            console.error('Erreur lecture messages:', e);
            return [];
        }
    }
    return [];
}

function saveMessages(messages) {
    fs.writeFileSync(messagesPath, JSON.stringify(encryptData(messages), null, 2));
}

function getMeta() {
    if (fs.existsSync(metaPath)) {
        try {
            const raw = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
            if (raw && raw.encrypted) return decryptData(raw);
            return (raw && typeof raw === 'object') ? raw : {};
        } catch (e) {
            return {};
        }
    }
    return {};
}

function saveMeta(meta) {
    fs.writeFileSync(metaPath, JSON.stringify(encryptData(meta), null, 2));
}

// ==========================================
// UTILS
// ==========================================
function getUserName(user) {
    if (!user) return 'Anonyme';
    if (typeof user === 'string') return user;
    if (typeof user === 'object') {
        return (user.username || user.name || user.pseudo || user.user || user.login || 'Anonyme');
    }
    return 'Anonyme';
}

// ==========================================
// ROUTES API
// ==========================================
router.get('/', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Non connecté' });
    const userName = getUserName(req.session.user);
    const enrichedMessages = getMessages().map(m => {
        const authorName = getUserName(m.author);
        return { ...m, author: authorName, isMe: authorName.toLowerCase() === userName.toLowerCase() };
    });
    res.json({ messages: enrichedMessages, currentUser: userName });
});

router.get('/unread', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Non connecté' });
    const userName = getUserName(req.session.user);
    const lastRead = getMeta()[userName] || 0;

    const count = getMessages().filter(m => {
        const authorName = getUserName(m.author);
        return authorName.toLowerCase() !== userName.toLowerCase() && new Date(m.timestamp).getTime() > lastRead;
    }).length;

    res.json({ count });
});

router.post('/read', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Non connecté' });
    const meta = getMeta();
    meta[getUserName(req.session.user)] = Date.now();
    saveMeta(meta);
    res.json({ success: true });
});

// 🆕 ROUTE POST MODIFIÉE POUR ACCEPTER LES PHOTOS
router.post('/', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Non connecté' });

    const userNameRaw = getUserName(req.session.user);
    const userName = userNameRaw.toLowerCase(); // 'marc' ou 'blandine'
    const { text, photo } = req.body; // 🆕 Récupération de la photo

    // 🆕 Validation : il faut au moins du texte OU une photo
    if ((!text || !text.trim()) && !photo) {
        return res.status(400).json({ error: 'Message vide' });
    }

    let cleanText = '';
    if (text) {
        if (text.length > 1000) return res.status(400).json({ error: 'Message trop long (max 1000 caractères)' });
        cleanText = text.replace(/<[^>]*>/g, '').trim();
    }

    let photoData = null;
    if (photo) {
        // 🆕 Vérification basique du format base64 image
        if (!photo.startsWith('data:image/')) {
            return res.status(400).json({ error: 'Format de photo invalide' });
        }
        // 🆕 Limite de taille approx 5MB en base64 (7MB pour être large)
        if (photo.length > 7 * 1024 * 1024) {
            return res.status(400).json({ error: 'Photo trop lourde (max 5MB)' });
        }
        photoData = photo;
    }

    const messages = getMessages();
    const messageObj = {
        id: Date.now().toString(),
            author: userNameRaw,
            timestamp: new Date().toISOString()
    };

    if (cleanText) {
        messageObj.text = cleanText;
    }
    if (photoData) {
        messageObj.photo = photoData; // 🆕 Ajout de la photo au message
    }

    messages.push(messageObj);

    if (messages.length > 500) messages.splice(0, messages.length - 500);
    saveMessages(messages);

    // ➕ 2. NOUVEAU : Ajouter une notification en attente pour l'autre personne
    const otherUser = userName === 'marc' ? 'blandine' : 'marc';
    const displayName = userName === 'marc' ? 'Marc' : 'Blandine';

    if (!users[otherUser]) users[otherUser] = {}; // Sécurité
    if (!users[otherUser].pendingNotifications) {
        users[otherUser].pendingNotifications = [];
    }

    // 🆕 Texte de notification adapté selon le contenu
    let notificationText = '';
    if (cleanText && photoData) {
        notificationText = `${displayName} t'a envoyé un message avec une photo 📷`;
    } else if (photoData) {
        notificationText = `${displayName} t'a envoyé une photo 📷`;
    } else {
        notificationText = `${displayName} t'a envoyé : "${cleanText.substring(0, 30)}${cleanText.length > 30 ? '...' : ''}"`;
    }

    users[otherUser].pendingNotifications.push({
        id: Date.now().toString(),
                                               type: 'chat',
                                               text: notificationText,
                                               link: '/',
                                               createdAt: Date.now()
    });

    saveStore(users);

    res.json({ success: true });
});

router.delete('/', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Non connecté' });
    saveMessages([]);

    // Optionnel : vider aussi les notifications de chat si tu le souhaites
    res.json({ success: true });
});

module.exports = router;
