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
            lastSent: null,
            history: []
        },
        pendingNotifications: [] // ✅ AJOUTÉ ICI
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
        },
        pendingNotifications: [] // ✅ AJOUTÉ ICI
    }
};

function loadStore() {
    if (fs.existsSync(storePath)) {
        const saved = JSON.parse(fs.readFileSync(storePath, 'utf8'));
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

// Dans defaultData.marc et defaultData.blandine, ajoute :
memories: [
    // Exemple de donnée de test (Paris)
    {
        id: 1,
        title: "Notre premier café",
        desc: "On a parlé pendant 4 heures ☕",
        date: "2023-10-27",
        lat: 48.8566,
        lng: 2.3522,
        addedBy: "marc"
    }
]

const users = loadStore();

// ✅ On exporte bien saveStore
module.exports = { users, saveStore };
