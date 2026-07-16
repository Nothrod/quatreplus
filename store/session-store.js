// store/session-store.js
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const Store = session.Store;

const sessionsPath = path.join(__dirname, '../data/sessions.json');

// Créer le fichier s'il n'existe pas
if (!fs.existsSync(sessionsPath)) {
    fs.writeFileSync(sessionsPath, JSON.stringify({}));
}

class SimpleJSONStore extends Store {
    constructor(options = {}) {
        super(options);
        this.ttl = options.ttl || (30 * 24 * 60 * 60); // 30 jours par défaut
    }

    get(sid, callback) {
        try {
            const data = fs.readFileSync(sessionsPath, 'utf8');
            const sessions = JSON.parse(data || '{}');
            const record = sessions[sid];

            if (!record) return callback(null, null);

            // Vérifier l'expiration
            if (record.expires && Date.now() > record.expires) {
                this.destroy(sid, () => callback(null, null));
                return;
            }
            callback(null, record.session);
        } catch (err) {
            console.error("Erreur lecture session:", err);
            callback(err);
        }
    }

    set(sid, sessionData, callback) {
        try {
            const data = fs.readFileSync(sessionsPath, 'utf8');
            const sessions = JSON.parse(data || '{}');

            sessions[sid] = {
                session: sessionData,
                expires: Date.now() + (this.ttl * 1000)
            };

            // Écriture directe, sans renommage (évite le bug Windows EPERM)
            fs.writeFileSync(sessionsPath, JSON.stringify(sessions, null, 2));
            callback(null);
        } catch (err) {
            console.error("Erreur écriture session:", err);
            callback(err);
        }
    }

    destroy(sid, callback) {
        try {
            const data = fs.readFileSync(sessionsPath, 'utf8');
            const sessions = JSON.parse(data || '{}');
            delete sessions[sid];
            fs.writeFileSync(sessionsPath, JSON.stringify(sessions, null, 2));
            callback(null);
        } catch (err) {
            console.error("Erreur suppression session:", err);
            callback(err);
        }
    }
}

module.exports = SimpleJSONStore;
