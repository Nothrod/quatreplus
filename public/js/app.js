/**
 * =========================================================
 * QUATRE+ - Application Mobile Privée
 * Fichier: public/js/app.js (Point d'entrée principal)
 * =========================================================
 */

import { initNavigation } from './navigation.js';
import { initAuth } from './auth.js';
import { initDashboard } from './dashboard.js';
import { initMood } from './mood.js';
import { initThinkOfYou } from './thinkofyou.js';
import { initNotifications } from './notifications.js';
import { initPopup } from './popup.js';
import { initMusicWidget } from './musicwidget.js';
import { initFriendshipLevel } from './friendshiplevel.js';
import { initMap } from './map.js';

console.log('🌸 Quatre+ initialisé (Mode Modulaire)');

// 1. Initialiser la navigation immédiatement (elle n'a pas besoin d'être connecté)
initNavigation();

// 2. Initialiser l'authentification. 
// Quand la connexion réussit, on lance le chargement des widgets.
initAuth((userData) => {
    console.log('Utilisateur connecté:', userData.user);
    initDashboard(userData);
    initMood();
    initThinkOfYou();
    initPopup();
    initMusicWidget();
    initFriendshipLevel(userData);
    initMap();
});

