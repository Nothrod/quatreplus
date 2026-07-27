export function initOnAFait() {
    const listContainer = document.getElementById('onafait-list');
    const entryWidget = document.getElementById('widget-onafait-entry');
    const summaryEl = document.getElementById('onafait-dashboard-summary');
    const backBtn = document.getElementById('onafait-back-btn');

    // 🚧 Fonction utilitaire pour afficher le popup "En construction"
    function showConstructionPopup() {
        let popup = document.getElementById('construction-popup');

        if (!popup) {
            popup = document.createElement('div');
            popup.id = 'construction-popup';
            popup.innerHTML = `
            <div class="popup-content">
            <div class="construction-icon">🚧</div>
            <h3>En construction</h3>
            <p>Cette fonctionnalité est en cours de développement et sera bientôt disponible !</p>
            <button class="btn-close" id="close-construction-popup">Fermer</button>
            </div>
            `;
            document.body.appendChild(popup);

            // Fermeture via le bouton
            document.getElementById('close-construction-popup').addEventListener('click', () => {
                popup.classList.remove('active');
            });

            // Bonus : Fermeture en cliquant en dehors du popup (sur le fond flouté)
            popup.addEventListener('click', (e) => {
                if (e.target === popup) {
                    popup.classList.remove('active');
                }
            });
        }

        // Petit délai pour s'assurer que le navigateur a rendu l'élément avant d'ajouter la classe 'active' (pour l'animation)
        setTimeout(() => popup.classList.add('active'), 10);
    }

    async function loadOnAFait() {
        try {
            const res = await fetch('/api/onafait/list');
            const items = await res.json();

            // 1. Mise à jour du résumé sur le widget du dashboard
            if (summaryEl) {
                const completedCount = items.filter(i => i.completed).length;
                summaryEl.textContent = `${completedCount} / ${items.length} moments validés`;
            }

            // 2. Affichage de la liste complète dans l'onglet
            if (!listContainer) return;
            listContainer.innerHTML = '';

            if (items.length === 0) {
                listContainer.innerHTML = '<p>Aucun élément pour le moment.</p>';
                return;
            }

            items.forEach(item => {
                const div = document.createElement('div');
                div.className = `onafait-item ${item.completed ? 'completed' : ''}`;
                div.innerHTML = `
                <label class="onafait-checkbox-wrapper">
                <input type="checkbox" class="onafait-checkbox" data-id="${item.id}" ${item.completed ? 'checked' : ''}>
                <span>${item.title}</span>
                ${item.description ? `<small>${item.description}</small>` : ''}
                <span class="onafait-points">+${item.points}</span>
                </label>
                `;
                listContainer.appendChild(div);
            });

            // 3. Gestion des clics sur les cases à cocher
            document.querySelectorAll('.onafait-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', async (e) => {
                    const id = e.target.dataset.id;
                    const completed = e.target.checked;
                    const itemDiv = e.target.closest('.onafait-item');

                    e.target.disabled = true; // Empêche le double-clic

                    try {
                        const res = await fetch('/api/onafait/toggle', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id, completed })
                        });
                        const data = await res.json();

                        if (data.success) {
                            if (completed) itemDiv.classList.add('completed');
                            else itemDiv.classList.remove('completed');

                            // Rafraîchit la liste et le résumé
                            loadOnAFait();
                            // Notifie les autres widgets (comme le niveau d'amitié) de se mettre à jour
                            window.dispatchEvent(new CustomEvent('friendship-level-updated'));
                        } else {
                            alert(data.error || 'Erreur lors de la mise à jour');
                            e.target.checked = !completed;
                        }
                    } catch (err) {
                        console.error(err);
                        alert('Erreur de connexion');
                        e.target.checked = !completed;
                    } finally {
                        e.target.disabled = false;
                    }
                });
            });

        } catch (err) {
            console.error('Erreur chargement On a fait:', err);
            if (listContainer) listContainer.innerHTML = '<p>Erreur de chargement.</p>';
            if (summaryEl) summaryEl.textContent = 'Erreur';
        }
    }

    // 4. MODIFICATION : Intercepter le clic sur le widget du dashboard
    if (entryWidget) {
        entryWidget.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showConstructionPopup();
        });
    }

    // 5. MODIFICATION : Intercepter aussi le bouton de la barre de navigation en bas (s'il existe)
    const navBtn = document.querySelector('.nav-btn[data-tab="tab-onafait"]');
    if (navBtn) {
        navBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showConstructionPopup();
        });
    }

    // 6. Bouton retour pour revenir au dashboard (au cas où l'onglet serait ouvert autrement)
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            const dashboardNavBtn = document.querySelector('.nav-btn[data-tab="tab-dashboard"]');
            if (dashboardNavBtn) {
                dashboardNavBtn.click();
            } else {
                document.querySelectorAll('.tab-content').forEach(tab => {
                    tab.classList.remove('active');
                    tab.style.display = 'none';
                });
                const targetTab = document.getElementById('tab-dashboard');
                if (targetTab) {
                    targetTab.classList.add('active');
                    targetTab.style.display = 'block';
                }
            }
        });
    }

    // Écouteur global si le niveau change ailleurs
    window.addEventListener('friendship-level-updated', loadOnAFait);

    // Lancement initial
    loadOnAFait();
}
