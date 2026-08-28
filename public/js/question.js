// ➕ 1. IMPORT DU SYSTÈME DE NOTIFICATION (Active le polling en arrière-plan)
import { notifSystem } from './notif-bell.js';

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
    const currentUsername = userData.user.toLowerCase();
    const otherUsername = currentUsername === 'marc' ? 'blandine' : 'marc';
    const otherDisplayName = otherUsername === 'marc' ? 'Marc' : 'Blandine';

    let currentQuestionId = null;
    let allHistoryData = [];
    let currentFilter = 'all';

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
            allHistoryData = data.history;
            renderHistory();
        } catch (err) {
            console.error("Erreur chargement questions:", err);
        }
    }

    function renderCurrent(q, comeBackTomorrow) {
        if (!q) {
            if (todayContainer) todayContainer.style.display = 'none';
            return;
        }

        if (todayContainer) todayContainer.style.display = 'block';
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

        const myAnswer = q[`${currentUsername}_answer`] || q[`${currentUsername.charAt(0).toUpperCase() + currentUsername.slice(1)}_answer`];
        const otherAnswer = q[`${otherUsername}_answer`] || q[`${otherUsername.charAt(0).toUpperCase() + otherUsername.slice(1)}_answer`];

        const hasAnswered = !!myAnswer;
        const otherHasAnswered = !!otherAnswer;

        // ✅ SUPPRIMÉ : La logique d'attente et de notification est maintenant gérée par le serveur (routes/question.js)

        if (comeBackTomorrow && otherHasAnswered) {
            if (answerForm) answerForm.style.display = 'none';
            if (waitingMsg) {
                waitingMsg.style.display = 'block';
                waitingMsg.style.color = "#2E7D32";
                waitingMsg.style.fontWeight = "600";
                waitingMsg.style.textAlign = "center";
                waitingMsg.style.padding = "15px 0";

                waitingMsg.innerHTML = `
                <div style="margin-bottom: 10px;">Vous avez tous les deux répondu ! 🎉</div>
                <div style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 12px; margin: 10px 0; text-align: left; font-weight: normal; font-size: 1rem;">
                <div style="margin-bottom: 8px;"><strong>Marc :</strong> ${q.marc_answer || '...'}</div>
                <div><strong>Blandine :</strong> ${q.blandine_answer || '...'}</div>
                </div>
                <div style="margin-top: 10px; font-size: 0.95rem; color: #a0aec0;">Rendez-vous demain pour une nouvelle question 🌙</div>
                `;
            }
            return;
        }

        if (hasAnswered) {
            if (answerForm) answerForm.style.display = 'none';
            if (waitingMsg) {
                waitingMsg.style.display = 'block';
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

        const filteredHistory = currentFilter === 'all'
        ? allHistoryData
        : allHistoryData.filter(q => q.category === currentFilter);

        if (filteredHistory.length === 0) {
            const filterName = currentFilter === 'all' ? 'sélectionnée' : (categoryLabels[currentFilter]?.label || currentFilter);
            historyList.innerHTML = `<p style="text-align:center; color: var(--text-secondary); padding: 20px;">Aucun échange dans la catégorie "${filterName}" pour le moment.</p>`;
            return;
        }

        historyList.innerHTML = filteredHistory.map(q => {
            const catInfo = categoryLabels[q.category] || { label: q.category, class: 'badge-blue' };
            const marcAns = q.marc_answer ? `<p><strong>Marc :</strong> ${q.marc_answer}</p>` : '<p style="color: var(--text-secondary); font-style: italic;">Marc n\'a pas encore répondu</p>';
            const blandineAns = q.blandine_answer ? `<p><strong>Blandine :</strong> ${q.blandine_answer}</p>` : '<p style="color: var(--text-secondary); font-style: italic;">Blandine n\'a pas encore répondu</p>';
            const dateStr = new Date(q.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

            return `
            <div class="history-card" style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px; margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <span class="category-badge ${catInfo.class}">${catInfo.label}</span>
            <span style="font-size: 0.85rem; color: var(--text-secondary);">📅 ${dateStr}</span>
            </div>
            <p style="font-weight: 600; margin-bottom: 12px; font-size: 1.05rem;">"${q.text}"</p>
            <div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; margin-bottom: 8px;">
            ${marcAns}
            </div>
            <div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px;">
            ${blandineAns}
            </div>
            </div>
            `;
        }).join('');
    }

    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
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
