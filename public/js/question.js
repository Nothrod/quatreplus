// public/js/question.js

const categoryLabels = {
    je_nai_jamais: { label: '🙈 Je n\'ai jamais', class: 'badge-blue' },
    drole: { label: '😂 Drôle', class: 'badge-yellow' },
    connaissance: { label: '🧠 Connaissance', class: 'badge-green' },
    general: { label: '🌍 Général', class: 'badge-blue' },
    coquin: { label: '😏 Coquin', class: 'badge-orange' },
    hot: { label: '🔥 Hot', class: 'badge-red' },
    tres_hot: { label: '🌶️ Très Hot', class: 'badge-dark-red' }
};

export function initQuestion(userData) {
    const currentUsername = userData.user;
    const otherUsername = currentUsername === 'marc' ? 'blandine' : 'marc';
    const otherDisplayName = otherUsername === 'marc' ? 'Marc' : 'Blandine';

    let currentQuestionId = null;
    let allHistoryData = []; // Stocke TOUT l'historique pour le filtrer
    let currentFilter = 'all'; // Filtre par défaut

    const todayContainer = document.getElementById('question-today-container');
    const categoryBadge = document.getElementById('question-category-badge');
    const questionText = document.getElementById('current-question-text');
    const answerForm = document.getElementById('answer-form-container');
    const answerInput = document.getElementById('my-answer-input');
    const submitBtn = document.getElementById('submit-answer-btn');
    const waitingMsg = document.getElementById('waiting-message');
    const historyList = document.getElementById('question-history-list');

    if (!todayContainer || !questionText) {
        console.warn("⚠️ Les éléments HTML de l'onglet Question sont introuvables.");
        return;
    }

    async function loadData() {
        try {
            const res = await fetch('/api/question', { credentials: 'include' });
            const data = await res.json();
            renderCurrent(data.current, data.comeBackTomorrow);
            allHistoryData = data.history; // On sauvegarde les données brutes
            renderHistory(); // On affiche en appliquant le filtre actuel
        } catch (err) {
            console.error("Erreur chargement questions:", err);
        }
    }

    function renderCurrent(q, comeBackTomorrow) {
        if (comeBackTomorrow) {
            todayContainer.style.display = 'block';
            if (categoryBadge) categoryBadge.style.display = 'none';
            if (questionText) questionText.style.display = 'none';
            if (answerForm) answerForm.style.display = 'none';
            if (waitingMsg) {
                waitingMsg.style.display = 'block';
                waitingMsg.style.color = "#2E7D32";
                waitingMsg.style.fontSize = "1.1rem";
                waitingMsg.style.fontWeight = "600";
                waitingMsg.textContent = "Vous avez tous les deux répondu ! 🎉\nRendez-vous demain pour une nouvelle question 🌙";
                waitingMsg.style.whiteSpace = 'pre-line';
                waitingMsg.style.textAlign = 'center';
                waitingMsg.style.padding = '20px 0';
            }
            return;
        }

        if (!q || q.isFinished) {
            todayContainer.style.display = 'none';
            return;
        }

        todayContainer.style.display = 'block';
        currentQuestionId = q.id;

        if (questionText) {
            questionText.style.display = 'block';
            questionText.textContent = q.text;
        }

        if (categoryBadge) {
            categoryBadge.style.display = 'inline-block';
            const catInfo = categoryLabels[q.category] || { label: q.category, class: 'badge-blue' };
            categoryBadge.textContent = catInfo.label;
            categoryBadge.className = `category-badge ${catInfo.class}`;
        }

        const myAnswerKey = `${currentUsername}_answer`;
        const otherAnswerKey = `${otherUsername}_answer`;
        const hasAnswered = !!q[myAnswerKey];

        if (hasAnswered) {
            if (answerForm) answerForm.style.display = 'none';
            if (waitingMsg) {
                waitingMsg.style.display = 'block';
                waitingMsg.style.fontSize = "";
                waitingMsg.style.fontWeight = "";
                waitingMsg.style.whiteSpace = "";
                waitingMsg.style.textAlign = "";
                waitingMsg.style.padding = "";
                waitingMsg.style.color = "var(--primary)";
                waitingMsg.textContent = `En attente de la réponse de ${otherDisplayName}... 💭`;
            }
        } else {
            if (answerForm) answerForm.style.display = 'block';
            if (waitingMsg) waitingMsg.style.display = 'none';
            if (answerInput) answerInput.value = '';
        }
    }

    function renderHistory() {
        if (!historyList) return;

        // ✨ FILTRAGE DES DONNÉES
        const filteredHistory = currentFilter === 'all'
        ? allHistoryData
        : allHistoryData.filter(q => q.category === currentFilter);

        if (filteredHistory.length === 0) {
            const filterName = currentFilter === 'all' ? 'sélectionnée' : (categoryLabels[currentFilter]?.label || currentFilter);
            historyList.innerHTML = `<p style="text-align: center; color: #a0aec0; padding: 20px;">Aucun échange dans la catégorie "${filterName}" pour le moment.</p>`;
            return;
        }

        historyList.innerHTML = filteredHistory.map(q => {
            const catInfo = categoryLabels[q.category] || { label: q.category, class: 'badge-blue' };
            const marcAns = q.marc_answer ? `<div class="history-answer marc"><strong>Marc :</strong> ${q.marc_answer}</div>` : '<div class="history-answer pending">Marc n\'a pas encore répondu</div>';
            const blandineAns = q.blandine_answer ? `<div class="history-answer blandine"><strong>Blandine :</strong> ${q.blandine_answer}</div>` : '<div class="history-answer pending">Blandine n\'a pas encore répondu</div>';
            const dateStr = new Date(q.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

            return `
            <div class="history-item">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span class="category-badge-small ${catInfo.class}">${catInfo.label}</span>
            <span class="history-date">📅 ${dateStr}</span>
            </div>
            <div class="history-question">"${q.text}"</div>
            <div class="history-answers">
            ${marcAns}
            ${blandineAns}
            </div>
            </div>
            `;
        }).join('');
    }

    // ✨ GESTION DES CLICS SUR LES FILTRES
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Retirer la classe active de tous les boutons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Ajouter la classe active au bouton cliqué
            btn.classList.add('active');
            // Mettre à jour le filtre et ré-afficher
            currentFilter = btn.getAttribute('data-filter');
            renderHistory();
        });
    });

    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            if (!answerInput) return;
            const answer = answerInput.value.trim();
            if (!answer) return alert("Écris au moins un petit mot !");

            submitBtn.disabled = true;
            submitBtn.textContent = "Envoi en cours...";

            try {
                const res = await fetch('/api/question/answer', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ questionId: currentQuestionId, answer })
                });

                const data = await res.json();
                if (data.success) loadData();
            } catch (err) {
                console.error(err);
                alert("Erreur de connexion au serveur");
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = "Envoyer ma réponse 💌";
            }
        });
    }

    loadData();
}
