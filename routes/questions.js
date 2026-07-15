// routes/questions.js
const express = require('express');
const router = express.Router();

// Questions par catégorie
const questions = {
    'Je n\'ai jamais': [
        { id: 1, text: 'Je n\'ai jamais...', type: 'text' },
        { id: 2, text: 'Je n\'ai jamais...', type: 'text' }
    ],
    'Préfères-tu': [
        { id: 3, text: 'Préfères-tu...', type: 'choice', choices: ['Option A', 'Option B'] }
    ],
    'Relation': [
        { id: 4, text: 'Question sur la relation...', type: 'text' }
    ],
    'Sexe': [
        { id: 5, text: 'Question intime...', type: 'text' }
    ],
    'Voyage': [
        { id: 6, text: 'Destination de rêve...', type: 'text' }
    ]
};

// Obtenir la question du jour
router.get('/today', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Non connecté' });
    }
    
    // Logique pour sélectionner une question non posée
    const allQuestions = Object.values(questions).flat();
    const randomQuestion = allQuestions[Math.floor(Math.random() * allQuestions.length)];
    
    res.json(randomQuestion);
});

// Sauvegarder une réponse
router.post('/answer', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Non connecté' });
    }
    
    const { questionId, answer } = req.body;
    // Sauvegarder la réponse en base
    res.json({ success: true });
});

module.exports = router;