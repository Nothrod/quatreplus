const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
    // Option 1 : secret fourni via variable d'environnement
    if (process.env.MESSAGE_SECRET) {
        return crypto.createHash('sha256').update(process.env.MESSAGE_SECRET).digest();
    }
    // Option 2 : clé aléatoire générée une seule fois (fichier caché)
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
            if (raw && raw.encrypted) return decryptData(raw); // format chiffré
            return Array.isArray(raw) ? raw : [];             // ancien format clair (migration auto)
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

router.post('/', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Non connecté' });
    const userName = getUserName(req.session.user);
    const { text } = req.body;

    if (!text || !text.trim()) return res.status(400).json({ error: 'Message vide' });
    if (text.length > 1000) return res.status(400).json({ error: 'Message trop long (max 1000 caractères)' });

    const cleanText = text.replace(/<[^>]*>/g, '').trim();
    if (!cleanText) return res.status(400).json({ error: 'Message invalide' });

    const messages = getMessages();
    messages.push({ id: Date.now(), author: userName, text: cleanText, timestamp: new Date().toISOString() });

    if (messages.length > 500) messages.splice(0, messages.length - 500);
    saveMessages(messages);
    res.json({ success: true });
});

router.delete('/', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Non connecté' });
    saveMessages([]);
    res.json({ success: true });
});

module.exports = router;
