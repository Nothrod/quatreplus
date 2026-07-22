export function initOnAFait() {
    const listContainer = document.getElementById('onafait-list');
    const entryWidget = document.getElementById('widget-onafait-entry');
    const summaryEl = document.getElementById('onafait-dashboard-summary');
    const backBtn = document.getElementById('onafait-back-btn');

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
                listContainer.innerHTML = '<p style="text-align: center; color: #a0aec0; padding: 20px;">Aucun élément pour le moment.</p>';
                return;
            }

            items.forEach(item => {
                const div = document.createElement('div');
                div.className = `onafait-item ${item.completed ? 'completed' : ''}`;
                div.innerHTML = `
                <label class="onafait-checkbox-label">
                <input type="checkbox" class="onafait-checkbox" data-id="${item.id}" ${item.completed ? 'checked' : ''}>
                <span class="checkmark"></span>
                <div class="onafait-content">
                <span class="onafait-title">${item.title}</span>
                <span class="onafait-desc">${item.description}</span>
                </div>
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
            if (listContainer) listContainer.innerHTML = '<p style="text-align: center; color: #e53e3e; padding: 20px;">Erreur de chargement.</p>';
            if (summaryEl) summaryEl.textContent = 'Erreur';
        }
    }

    // 4. Rendre le widget du dashboard cliquable pour ouvrir l'onglet
    if (entryWidget) {
        entryWidget.addEventListener('click', () => {
            // On simule un clic sur le bouton de navigation "On a fait" s'il existe,
            // sinon on force l'affichage de l'onglet (fallback)
            const navBtn = document.querySelector('.nav-btn[data-tab="tab-onafait"]');
            if (navBtn) {
                navBtn.click();
            } else {
                document.querySelectorAll('.tab-content').forEach(tab => {
                    tab.classList.remove('active');
                    tab.style.display = 'none';
                });
                const targetTab = document.getElementById('tab-onafait');
                if (targetTab) {
                    targetTab.classList.add('active');
                    targetTab.style.display = 'block';
                }
            }
            loadOnAFait();
        });
    }

    // 5. Bouton retour pour revenir au dashboard
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            // 🎯 ASTUCE : On simule un clic sur le bouton "Dashboard" de la nav du bas.
            // Cela garantit que toute la logique de navigation.js (gestion des classes 'active', etc.) est respectée.
            const dashboardNavBtn = document.querySelector('.nav-btn[data-tab="tab-dashboard"]');
            if (dashboardNavBtn) {
                dashboardNavBtn.click();
            } else {
                // Fallback si le bouton n'a pas cet attribut exact
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
