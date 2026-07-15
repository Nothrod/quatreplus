// data/store.js
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dataDir = path.join(__dirname, '../data');
const storePath = path.join(dataDir, 'store.json');

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const defaultData = {
    marc: {
        username: 'marc',
        password: bcrypt.hashSync(process.env.MARC_PASSWORD || 'marc123', 10),
        profile: {
            name: 'Marc',
            avatar: '/images/marc.jpg',
            mood: null,
            music: 'En attente...',
            startDate: '2023-10-27'
        },
        thinkOfYou: {
            total: 0,
            streak: 0,
            lastSent: null, // Timestamp du dernier envoi
            history: [] // Array des dates d'envoi
        }
    },
    blandine: {
        username: 'blandine',
        password: bcrypt.hashSync(process.env.BLANDINE_PASSWORD || 'blandine123', 10),
        profile: {
            name: 'Blandine',
            avatar: '/images/blandine.jpg',
            mood: null,
            music: 'En attente...',
            startDate: '2023-10-27'
        },
        thinkOfYou: {
            total: 0,
            streak: 0,
            lastSent: null,
            history: []
        }
    }
};

function loadStore() {
    if (fs.existsSync(storePath)) {
        const saved = JSON.parse(fs.readFileSync(storePath, 'utf8'));
        // Fusionne avec les défauts pour assurer la compatibilité
        return {
            marc: { 
                ...defaultData.marc, 
                ...saved.marc, 
                profile: { ...defaultData.marc.profile, ...saved.marc?.profile },
                thinkOfYou: { ...defaultData.marc.thinkOfYou, ...saved.marc?.thinkOfYou }
            },
            blandine: { 
                ...defaultData.blandine, 
                ...saved.blandine, 
                profile: { ...defaultData.blandine.profile, ...saved.blandine?.profile },
                thinkOfYou: { ...defaultData.blandine.thinkOfYou, ...saved.blandine?.thinkOfYou }
            }
        };
    }
    return defaultData;
}

function saveStore(data) {
    fs.writeFileSync(storePath, JSON.stringify(data, null, 2));
}

const users = loadStore();

module.exports = { users, saveStore };