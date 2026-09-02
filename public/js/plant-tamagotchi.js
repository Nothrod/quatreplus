// ==========================================
// SYSTÈME DE PLANTE TAMAGOTCHI (V4 - Timers individuels)
// ==========================================

class PlantTamagotchi {
    constructor() {
        this.STAGES = {
            SEED: 'seed', SEED_GERMINATING: 'seed_germinating', FIRST_SPROUT: 'first_sprout',
            SECOND_SPROUT: 'second_sprout', BUD: 'bud', BUD_OPENING: 'bud_opening',
            FLOWER_OPEN: 'flower_open', FLOWER_WILTING: 'flower_wilting',
            SECOND_SPROUT_WILTING: 'second_sprout_wilting', FIRST_SPROUT_WILTING: 'first_sprout_wilting'
        };

        this.STAGE_IMAGES = {
            [this.STAGES.SEED]: '/images/plant/seed.png',
            [this.STAGES.SEED_GERMINATING]: '/images/plant/seed_germinating.png',
            [this.STAGES.FIRST_SPROUT]: '/images/plant/first_sprout.png',
            [this.STAGES.SECOND_SPROUT]: '/images/plant/second_sprout.png',
            [this.STAGES.BUD]: '/images/plant/bud.png',
            [this.STAGES.BUD_OPENING]: '/images/plant/bud_opening.png',
            [this.STAGES.FLOWER_OPEN]: '/images/plant/flower_open.png',
            [this.STAGES.FLOWER_WILTING]: '/images/plant/flower_wilting.png',
            [this.STAGES.SECOND_SPROUT_WILTING]: '/images/plant/second_sprout_wilting.png',
            [this.STAGES.FIRST_SPROUT_WILTING]: '/images/plant/first_sprout_wilting.png'
        };

        this.STAGE_LABELS = {
            [this.STAGES.SEED]: '🌰 Graine',
            [this.STAGES.SEED_GERMINATING]: '🌱 Graine qui germe',
            [this.STAGES.FIRST_SPROUT]: '🌿 Première pousse (base)',
            [this.STAGES.SECOND_SPROUT]: '🌿🌿 Deuxième pousse (tige)',
            [this.STAGES.BUD]: '🌸 Bourgeon',
            [this.STAGES.BUD_OPENING]: '🌺 Bourgeon qui s\'ouvre',
            [this.STAGES.FLOWER_OPEN]: '🌺 Fleur ouverte',
            [this.STAGES.FLOWER_WILTING]: '🥀 Fleur qui fane',
            [this.STAGES.SECOND_SPROUT_WILTING]: '🥀 2e pousse qui fane',
            [this.STAGES.FIRST_SPROUT_WILTING]: '🥀 1re pousse qui fane'
        };

        // Récupérer l'utilisateur actuel (doit être défini au login, ex: localStorage.setItem('currentUser', 'marc'))
        this.currentUser = (localStorage.getItem('currentUser') || 'marc').toLowerCase();

        this.state = {
            stage: this.STAGES.SEED,
            water: 50, care: 50, connection: 50,
            epanouissement: 50, maxEpanouissementThisStage: 50,
            lastWater: { marc: null, blandine: null },
            lastCare: { marc: null, blandine: null },
            lastUpdate: Date.now()
        };

        this.COOLDOWN = 6 * 60 * 60 * 1000; // 6 heures

        this.init();
    }

    async init() {
        await this.loadState();
        this.calculateEpanouissement();
        this.updateStage();
        this.render();
        this.startDecayInterval();
        setInterval(() => this.updateTimers(), 1000);
    }

    calculateEpanouissement() {
        let rawEpanouissement = Math.round(
            (this.state.water * 0.35) + (this.state.care * 0.35) + (this.state.connection * 0.30)
        );
        this.state.epanouissement = Math.max(0, Math.min(100, rawEpanouissement));

        if (this.state.epanouissement > (this.state.maxEpanouissementThisStage || 0)) {
            this.state.maxEpanouissementThisStage = this.state.epanouissement;
        }
    }

    updateStage() {
        const e = this.state.epanouissement;
        const current = this.state.stage;

        if (e >= 100) {
            if (current === this.STAGES.SEED) { this.state.stage = this.STAGES.SEED_GERMINATING; this.resetStageProgress(); }
            else if (current === this.STAGES.SEED_GERMINATING) { this.state.stage = this.STAGES.FIRST_SPROUT; this.resetStageProgress(); }
            else if (current === this.STAGES.FIRST_SPROUT) { this.state.stage = this.STAGES.SECOND_SPROUT; this.resetStageProgress(); }
            else if (current === this.STAGES.SECOND_SPROUT) { this.state.stage = this.STAGES.BUD; this.resetStageProgress(); }
            else if (current === this.STAGES.BUD) { this.state.stage = this.STAGES.BUD_OPENING; this.resetStageProgress(); }
            else if (current === this.STAGES.BUD_OPENING) { this.state.stage = this.STAGES.FLOWER_OPEN; this.resetStageProgress(); }
            return;
        }

        if ((current === this.STAGES.BUD_OPENING || current === this.STAGES.FLOWER_OPEN) && e < 50 && (this.state.maxEpanouissementThisStage >= 75)) {
            this.state.stage = this.STAGES.FLOWER_WILTING; this.state.epanouissement = 50; this.state.maxEpanouissementThisStage = 50; return;
        }
        if (current === this.STAGES.FLOWER_WILTING) {
            if (e >= 80) { this.state.stage = this.STAGES.FLOWER_OPEN; this.state.epanouissement = 50; this.state.maxEpanouissementThisStage = 50; return; }
            if (e < 25) { this.state.stage = this.STAGES.SECOND_SPROUT_WILTING; this.state.epanouissement = 50; this.state.maxEpanouissementThisStage = 50; return; }
        }
        if (current === this.STAGES.SECOND_SPROUT_WILTING) {
            if (e >= 80) { this.state.stage = this.STAGES.SECOND_SPROUT; this.state.epanouissement = 50; this.state.maxEpanouissementThisStage = 50; return; }
            if (e < 25) { this.state.stage = this.STAGES.FIRST_SPROUT_WILTING; this.state.epanouissement = 50; this.state.maxEpanouissementThisStage = 50; return; }
        }
        if (current === this.STAGES.FIRST_SPROUT_WILTING) {
            if (e >= 80) { this.state.stage = this.STAGES.FIRST_SPROUT; this.state.epanouissement = 50; this.state.maxEpanouissementThisStage = 50; return; }
            if (e <= 0) {
                this.state.stage = this.STAGES.SEED; this.state.epanouissement = 50; this.state.maxEpanouissementThisStage = 50;
                this.state.water = 50; this.state.care = 50; this.state.connection = 50; return;
            }
        }
    }

    resetStageProgress() {
        this.state.epanouissement = 50;
        this.state.maxEpanouissementThisStage = 50;
    }

    // Vérifie le cooldown POUR L'UTILISATEUR ACTUEL
    canPerformAction(actionType) {
        const lastActionTime = this.state[actionType]?.[this.currentUser];
        if (!lastActionTime) return true;
        return (Date.now() - lastActionTime) >= this.COOLDOWN;
    }

    getRemainingCooldown(actionType) {
        const lastActionTime = this.state[actionType]?.[this.currentUser];
        if (!lastActionTime) return 0;
        return Math.max(0, this.COOLDOWN - (Date.now() - lastActionTime));
    }

    async water() {
        if (!this.canPerformAction('lastWater')) return;
        try {
            const res = await fetch('/api/plant/action/water', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user: this.currentUser })
            });
            const data = await res.json();
            this.state = { ...this.state, ...data };
            this.calculateEpanouissement();
            this.updateStage();
            this.render();
        } catch (err) { console.error('Erreur action boire:', err); }
    }

    async care() {
        if (!this.canPerformAction('lastCare')) return;
        try {
            const res = await fetch('/api/plant/action/care', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user: this.currentUser })
            });
            const data = await res.json();
            this.state = { ...this.state, ...data };
            this.calculateEpanouissement();
            this.updateStage();
            this.render();
        } catch (err) { console.error('Erreur action soin:', err); }
    }

    async addConnection(amount = 5) {
        try {
            const res = await fetch('/api/plant/action/connection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount })
            });
            const data = await res.json();
            this.state = { ...this.state, ...data };
            this.calculateEpanouissement();
            this.updateStage();
            this.render();
        } catch (err) { console.error('Erreur ajout connexion:', err); }
    }

    startDecayInterval() {
        setInterval(async () => {
            const elapsedHours = (Date.now() - this.state.lastUpdate) / 3600000;
            if (elapsedHours > 0) {
                this.state.water = Math.max(0, this.state.water - (0.5 * elapsedHours));
                this.state.care = Math.max(0, this.state.care - (0.3 * elapsedHours));
                this.state.lastUpdate = Date.now();
                this.calculateEpanouissement();
                this.updateStage();
                await this.saveState();
                this.render();
            }
        }, 60000);
    }

    render() {
        const img = document.getElementById('plant-image');
        const placeholder = document.getElementById('plant-placeholder');
        const imageSrc = this.STAGE_IMAGES[this.state.stage];

        if (imageSrc) {
            img.src = imageSrc;
            img.style.display = 'block';
            placeholder.style.display = 'none';
        } else {
            img.style.display = 'none';
            placeholder.style.display = 'flex';
        }

        const labelEl = document.getElementById('plant-stage-label');
        if (labelEl) labelEl.textContent = this.STAGE_LABELS[this.state.stage];

        this.updateGauge('water', this.state.water);
        this.updateGauge('care', this.state.care);
        this.updateGauge('connection', this.state.connection);
        this.updateGauge('epanouissement', this.state.epanouissement);

        const waterBtn = document.getElementById('plant-water-btn');
        const careBtn = document.getElementById('plant-care-btn');
        if (waterBtn) waterBtn.disabled = !this.canPerformAction('lastWater');
        if (careBtn) careBtn.disabled = !this.canPerformAction('lastCare');

        const widget = document.getElementById('plant-widget');
        if (widget) {
            if (this.state.stage.includes('wilting')) widget.classList.add('wilting');
            else widget.classList.remove('wilting');
        }
    }

    updateGauge(type, value) {
        const bar = document.getElementById(`${type}-bar`);
        const text = document.getElementById(`${type}-value`);
        if (bar) bar.style.width = `${Math.max(0, Math.min(100, value))}%`;
        if (text) text.textContent = `${Math.round(Math.max(0, Math.min(100, value)))}%`;
    }

    updateTimers() {
        const waterTimer = document.getElementById('water-timer');
        const careTimer = document.getElementById('care-timer');
        if (waterTimer) {
            const rem = this.getRemainingCooldown('lastWater');
            waterTimer.textContent = rem > 0 ? this.formatTime(rem) : 'Disponible !';
        }
        if (careTimer) {
            const rem = this.getRemainingCooldown('lastCare');
            careTimer.textContent = rem > 0 ? this.formatTime(rem) : 'Disponible !';
        }
    }

    formatTime(ms) {
        const h = Math.floor(ms / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
    }

    async saveState() {
        localStorage.setItem('plant-tamagotchi-state', JSON.stringify(this.state));
        try {
            await fetch('/api/plant/state', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.state)
            });
        } catch (e) { /* Ignore */ }
    }

    async loadState() {
        try {
            const res = await fetch('/api/plant/state');
            const serverState = await res.json();
            this.state = { ...this.state, ...serverState };
        } catch (err) {
            const saved = localStorage.getItem('plant-tamagotchi-state');
            if (saved) {
                this.state = { ...this.state, ...JSON.parse(saved) };
                const elapsedHours = (Date.now() - this.state.lastUpdate) / 3600000;
                if (elapsedHours > 0) {
                    this.state.water = Math.max(0, this.state.water - (0.5 * elapsedHours));
                    this.state.care = Math.max(0, this.state.care - (0.3 * elapsedHours));
                }
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.plantTamagotchi = new PlantTamagotchi();
    document.getElementById('plant-water-btn')?.addEventListener('click', () => window.plantTamagotchi.water());
    document.getElementById('plant-care-btn')?.addEventListener('click', () => window.plantTamagotchi.care());
});
