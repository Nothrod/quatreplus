const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const historyPath = path.join(__dirname, '../data/question_history.json');
const questionsDir = path.join(__dirname, '../data/questions');

const categories = ['je_nai_jamais', 'drole', 'connaissance', 'general', 'coquin', 'hot', 'tres_hot'];

const readJSON = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const writeJSON = (filePath, data) => fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

const isToday = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

router.get('/', (req, res) => {
    try {
        let history = fs.existsSync(historyPath) ? readJSON(historyPath) : [];
        let currentQuestion = null;
        let comeBackTomorrow = false;
        let completedHistory = [];

        if (history.length > 0) {
            const last = history[history.length - 1];

            // ✨ CORRECTION : On vérifie les réponses en ignorant la casse (minuscule ou majuscule)
            const marcAns = last.marc_answer || last.Marc_answer;
            const blandineAns = last.blandine_answer || last.Blandine_answer;

            if (isToday(last.date)) {
                if (marcAns && blandineAns) {
                    comeBackTomorrow = true;
                    // On normalise les clés en minuscules pour que le frontend ne soit pas perdu
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
                writeJSON(historyPath, history);
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
        // ✨ CORRECTION : On force le nom d'utilisateur en minuscules pour la clé
        const currentUser = req.session.user.username.toLowerCase();
        const answerKey = `${currentUser}_answer`;

        let history = readJSON(historyPath);
        const questionIndex = history.findIndex(q => q.id === questionId);

        if (questionIndex !== -1) {
            history[questionIndex][answerKey] = answer;

            // Nettoyage des anciennes clés en majuscules pour éviter les doublons
            if (currentUser === 'marc') delete history[questionIndex].Marc_answer;
            if (currentUser === 'blandine') delete history[questionIndex].Blandine_answer;

            writeJSON(historyPath, history);
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
