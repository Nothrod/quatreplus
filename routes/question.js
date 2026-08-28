const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ➕ 1. IMPORT DU STORE GLOBAL POUR LES NOTIFICATIONS
const { users, saveStore } = require('../data/store');

const historyPath = path.join(__dirname, '../data/question_history.json');
const questionsDir = path.join(__dirname, '../data/questions');

const categories = ['je_nai_jamais', 'drole', 'connaissance', 'general', 'coquin', 'hot', 'tres_hot'];

// ==========================================
// 📁 LECTURE / ÉCRITURE CLASSIQUE (Pour les pools de questions en clair)
// ==========================================
const readJSON = (filePath) => {
    const raw = fs.readFileSync(filePath, 'utf8');
    return raw.trim() ? JSON.parse(raw) : [];
};
const writeJSON = (filePath, data) => fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

// ==========================================
// 🔐 CHIFFREMENT AES-256-GCM (Pour l'historique des réponses)
// ==========================================
const keyPath = path.join(__dirname, '../data/.question_key');

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

function readSecureJSON(filePath) {
    if (!fs.existsSync(filePath)) return [];
    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        if (!raw.trim()) return [];
        const parsed = JSON.parse(raw);
        if (parsed && parsed.encrypted) {
            return decryptData(parsed);
        }
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.error('Erreur lecture données sécurisées:', e);
        return [];
    }
}

function writeSecureJSON(filePath, data) {
    const encryptedPayload = encryptData(data);
    fs.writeFileSync(filePath, JSON.stringify(encryptedPayload, null, 2));
}

// ==========================================
// UTILITAIRES
// ==========================================
const isToday = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

// ==========================================
// ROUTES
// ==========================================
router.get('/', (req, res) => {
    try {
        let history = fs.existsSync(historyPath) ? readSecureJSON(historyPath) : [];
        let currentQuestion = null;
        let comeBackTomorrow = false;
        let completedHistory = [];

        if (history.length > 0) {
            const last = history[history.length - 1];
            const marcAns = last.marc_answer || last.Marc_answer;
            const blandineAns = last.blandine_answer || last.Blandine_answer;

            if (isToday(last.date)) {
                if (marcAns && blandineAns) {
                    comeBackTomorrow = true;
                    currentQuestion = { ...last, marc_answer: marcAns, blandine_answer: blandineAns };
                    completedHistory = history.slice(0, -1);
                } else {
                    currentQuestion = { ...last, marc_answer: marcAns, blandine_answer: blandineAns };
                    completedHistory = history.slice(0, -1);
                }
            } else {
                completedHistory = history;
            }
        }

        if (!currentQuestion && !comeBackTomorrow) {
            const shuffledCats = [...categories].sort(() => 0.5 - Math.random());
            let pickedCategory = null;
            let questionText = null;

            for (const cat of shuffledCats) {
                const filePath = path.join(questionsDir, `${cat}.json`);
                if (fs.existsSync(filePath)) {
                    const pool = readJSON(filePath);
                    if (pool.length > 0) {
                        pickedCategory = cat;
                        const randomIndex = Math.floor(Math.random() * pool.length);
                        questionText = pool.splice(randomIndex, 1)[0];
                        writeJSON(filePath, pool);
                        break;
                    }
                }
            }

            if (pickedCategory && questionText) {
                currentQuestion = {
                    id: Date.now(),
           category: pickedCategory,
           text: questionText,
           date: new Date().toISOString(),
           marc_answer: null,
           blandine_answer: null
                };
                history.push(currentQuestion);
                writeSecureJSON(historyPath, history);
                completedHistory = history.slice(0, -1);
            }
        }

        res.json({
            current: currentQuestion,
            comeBackTomorrow: comeBackTomorrow,
            history: completedHistory.reverse()
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

router.post('/answer', (req, res) => {
    try {
        const { questionId, answer } = req.body;
        const currentUser = req.session.user.username.toLowerCase();
        const otherUser = currentUser === 'marc' ? 'blandine' : 'marc';
        const currentDisplayName = currentUser === 'marc' ? 'Marc' : 'Blandine';

        const answerKey = `${currentUser}_answer`;
        const otherAnswerKey = `${otherUser}_answer`;

        let history = readSecureJSON(historyPath);
        const questionIndex = history.findIndex(q => q.id === questionId);

        if (questionIndex !== -1) {
            history[questionIndex][answerKey] = answer;

            if (currentUser === 'marc') delete history[questionIndex].Marc_answer;
            if (currentUser === 'blandine') delete history[questionIndex].Blandine_answer;

            writeSecureJSON(historyPath, history);

            // ➕ 2. NOUVEAU : Si l'autre personne a DÉJÀ répondu, on la notifie que je viens de répondre
            if (history[questionIndex][otherAnswerKey]) {
                if (!users[otherUser].pendingNotifications) {
                    users[otherUser].pendingNotifications = [];
                }
                users[otherUser].pendingNotifications.push({
                    id: Date.now().toString(),
                                                           type: 'question',
                                                           text: `${currentDisplayName} a répondu à la question : « ${history[questionIndex].text} »`,
                                                           link: '/',
                                                           createdAt: Date.now()
                });
                saveStore(users);
            }

            res.json({ success: true, history });
        } else {
            res.status(404).json({ error: 'Question introuvable' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur lors de la sauvegarde' });
    }
});

module.exports = router;
