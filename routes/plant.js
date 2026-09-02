const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const PLANT_DATA_FILE = path.join(__dirname, '../data/plant.json');

const STAGES = {
    SEED: 'seed', SEED_GERMINATING: 'seed_germinating', FIRST_SPROUT: 'first_sprout',
    SECOND_SPROUT: 'second_sprout', BUD: 'bud', BUD_OPENING: 'bud_opening',
    FLOWER_OPEN: 'flower_open', FLOWER_WILTING: 'flower_wilting',
    SECOND_SPROUT_WILTING: 'second_sprout_wilting', FIRST_SPROUT_WILTING: 'first_sprout_wilting'
};

function loadPlantState() {
    try {
        if (fs.existsSync(PLANT_DATA_FILE)) {
            const state = JSON.parse(fs.readFileSync(PLANT_DATA_FILE, 'utf8'));

            // Migration automatique des anciens formats (si lastWater était un nombre)
            if (typeof state.lastWater === 'number') {
                state.lastWater = { marc: state.lastWater, blandine: state.lastWater };
            } else if (!state.lastWater) {
                state.lastWater = { marc: null, blandine: null };
            }

            if (typeof state.lastCare === 'number') {
                state.lastCare = { marc: state.lastCare, blandine: state.lastCare };
            } else if (!state.lastCare) {
                state.lastCare = { marc: null, blandine: null };
            }

            return state;
        }
    } catch (error) {
        console.error('Erreur chargement plante:', error);
    }
    return getDefaultState();
}

function savePlantState(state) {
    try {
        const dataDir = path.dirname(PLANT_DATA_FILE);
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
        fs.writeFileSync(PLANT_DATA_FILE, JSON.stringify(state, null, 2));
    } catch (error) {
        console.error('Erreur sauvegarde plante:', error);
    }
}

function getDefaultState() {
    return {
        stage: STAGES.SEED,
        water: 50,
        care: 50,
        connection: 50,
        epanouissement: 50,
        maxEpanouissementThisStage: 50,
        lastWater: { marc: null, blandine: null }, // Timer individuel
        lastCare: { marc: null, blandine: null },  // Timer individuel
        lastUpdate: Date.now(),
        marcThinkOfYou: false,
        blandineThinkOfYou: false,
        connectionBonusGiven: false,
        lastConnectionCheck: Date.now()
    };
}

function applyDecay(state) {
    const now = Date.now();
    const elapsedHours = (now - state.lastUpdate) / 3600000;

    if (elapsedHours > 0) {
        state.water = Math.max(0, state.water - (0.5 * elapsedHours));
        state.care = Math.max(0, state.care - (0.3 * elapsedHours));
        state.lastUpdate = now;
    }

    const currentDate = new Date();
    const lastCheckDate = new Date(state.lastConnectionCheck || now);

    if (currentDate.toDateString() !== lastCheckDate.toDateString()) {
        if (!state.marcThinkOfYou) state.connection = Math.max(0, state.connection - 10);
        if (!state.blandineThinkOfYou) state.connection = Math.max(0, state.connection - 10);

        state.marcThinkOfYou = false;
        state.blandineThinkOfYou = false;
        state.connectionBonusGiven = false;
        state.lastConnectionCheck = now;
    }

    return state;
}

function applyStageLogic(state) {
    let e = state.epanouissement;
    const current = state.stage;

    if (e > (state.maxEpanouissementThisStage || 0)) {
        state.maxEpanouissementThisStage = e;
    }

    if (e >= 100) {
        if (current === STAGES.SEED) { state.stage = STAGES.SEED_GERMINATING; reset(state); }
        else if (current === STAGES.SEED_GERMINATING) { state.stage = STAGES.FIRST_SPROUT; reset(state); }
        else if (current === STAGES.FIRST_SPROUT) { state.stage = STAGES.SECOND_SPROUT; reset(state); }
        else if (current === STAGES.SECOND_SPROUT) { state.stage = STAGES.BUD; reset(state); }
        else if (current === STAGES.BUD) { state.stage = STAGES.BUD_OPENING; reset(state); }
        else if (current === STAGES.BUD_OPENING) { state.stage = STAGES.FLOWER_OPEN; reset(state); }
        return state;
    }

    if ((current === STAGES.BUD_OPENING || current === STAGES.FLOWER_OPEN) && e < 50 && (state.maxEpanouissementThisStage >= 75)) {
        state.stage = STAGES.FLOWER_WILTING; state.epanouissement = 50; state.maxEpanouissementThisStage = 50; return state;
    }
    if (current === STAGES.FLOWER_WILTING) {
        if (e >= 80) { state.stage = STAGES.FLOWER_OPEN; state.epanouissement = 50; state.maxEpanouissementThisStage = 50; return state; }
        if (e < 25) { state.stage = STAGES.SECOND_SPROUT_WILTING; state.epanouissement = 50; state.maxEpanouissementThisStage = 50; return state; }
    }
    if (current === STAGES.SECOND_SPROUT_WILTING) {
        if (e >= 80) { state.stage = STAGES.SECOND_SPROUT; state.epanouissement = 50; state.maxEpanouissementThisStage = 50; return state; }
        if (e < 25) { state.stage = STAGES.FIRST_SPROUT_WILTING; state.epanouissement = 50; state.maxEpanouissementThisStage = 50; return state; }
    }
    if (current === STAGES.FIRST_SPROUT_WILTING) {
        if (e >= 80) { state.stage = STAGES.FIRST_SPROUT; state.epanouissement = 50; state.maxEpanouissementThisStage = 50; return state; }
        if (e <= 0) {
            state.stage = STAGES.SEED; state.epanouissement = 50; state.maxEpanouissementThisStage = 50;
            state.water = 50; state.care = 50; state.connection = 50;
            return state;
        }
    }
    return state;
}

function reset(state) {
    state.epanouissement = 50;
    state.maxEpanouissementThisStage = 50;
}

function recalculateEpanouissement(state) {
    state.epanouissement = Math.round((state.water * 0.35) + (state.care * 0.35) + (state.connection * 0.30));
    state.epanouissement = Math.max(0, Math.min(100, state.epanouissement));
    return applyStageLogic(state);
}

// --- ROUTES API ---

router.get('/state', (req, res) => {
    let state = loadPlantState();
    state = applyDecay(state);
    state = recalculateEpanouissement(state);
    savePlantState(state);
    res.json(state);
});

router.post('/state', (req, res) => {
    const state = req.body;
    state.lastUpdate = Date.now();
    savePlantState(state);
    res.json(state);
});

// ACTION : Donner à boire (+2 points, cooldown 6h INDIVIDUEL)
router.post('/action/water', (req, res) => {
    const { user } = req.body; // 'marc' ou 'blandine'
    if (!user || (user !== 'marc' && user !== 'blandine')) {
        return res.status(400).json({ error: 'Utilisateur invalide' });
    }

    let state = loadPlantState();
    const now = Date.now();
    const lastAction = state.lastWater[user] || 0;

    if (now - lastAction < 6 * 60 * 60 * 1000) {
        return res.status(400).json({ error: 'Cooldown' });
    }

    state.water = Math.min(100, state.water + 2); // <-- DIVISÉ PAR 2
    state.lastWater[user] = now;
    state.lastUpdate = now;
    state = recalculateEpanouissement(state);
    savePlantState(state);
    res.json(state);
});

// ACTION : S'en occuper (+1.5 points, cooldown 6h INDIVIDUEL)
router.post('/action/care', (req, res) => {
    const { user } = req.body;
    if (!user || (user !== 'marc' && user !== 'blandine')) {
        return res.status(400).json({ error: 'Utilisateur invalide' });
    }

    let state = loadPlantState();
    const now = Date.now();
    const lastAction = state.lastCare[user] || 0;

    if (now - lastAction < 6 * 60 * 60 * 1000) {
        return res.status(400).json({ error: 'Cooldown' });
    }

    state.care = Math.min(100, state.care + 1.5); // <-- DIVISÉ PAR 2
    state.lastCare[user] = now;
    state.lastUpdate = now;
    state = recalculateEpanouissement(state);
    savePlantState(state);
    res.json(state);
});

router.post('/action/connection', (req, res) => {
    let state = loadPlantState();
    const { amount = 5 } = req.body;
    state.connection = Math.min(100, state.connection + amount);
    state.lastUpdate = Date.now();
    state = recalculateEpanouissement(state);
    savePlantState(state);
    res.json(state);
});

router.post('/action/think-of-you', (req, res) => {
    const { user } = req.body;
    let state = loadPlantState();
    state = applyDecay(state);

    if (user.toLowerCase() === 'marc') {
        state.marcThinkOfYou = true;
    } else if (user.toLowerCase() === 'blandine') {
        state.blandineThinkOfYou = true;
    }

    if (state.marcThinkOfYou && state.blandineThinkOfYou && !state.connectionBonusGiven) {
        state.connection = Math.min(100, state.connection + 10);
        state.connectionBonusGiven = true;
    }

    state.lastUpdate = Date.now();
    state = recalculateEpanouissement(state);
    savePlantState(state);
    res.json(state);
});

module.exports = router;
