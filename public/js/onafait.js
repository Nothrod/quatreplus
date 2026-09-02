// public/js/onafait.js

export function initOnAFait() {
    const entryWidget = document.getElementById('widget-onafait-entry');
    const backBtn = document.getElementById('onafait-back-btn');
    const onafaitList = document.getElementById('onafait-list');

    // 1. Gérer le clic sur le widget du dashboard pour ouvrir l'onglet
    if (entryWidget) {
        entryWidget.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Masquer tous les onglets et désactiver les boutons de nav
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

            // Afficher l'onglet "On a fait"
            document.getElementById('tab-onafait').classList.add('active');

            // Charger les données
            loadOnAFaitList();
        });
    }

    // 2. Gérer le bouton retour vers l'accueil
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            document.getElementById('tab-home').classList.add('active');
            document.querySelector('.nav-btn[data-tab="tab-home"]')?.classList.add('active');
        });
    }

    // 3. Fonction pour charger et afficher la liste depuis l'API
    async function loadOnAFaitList() {
        onafaitList.innerHTML = '<p style="text-align: center; color: #a0aec0; padding: 20px;">Chargement...</p>';

        try {
            const response = await fetch('/api/onafait/list');
            if (!response.ok) throw new Error('Erreur de chargement');
            const items = await response.json();

            onafaitList.innerHTML = ''; // Vider le message de chargement

            if (items.length === 0) {
                onafaitList.innerHTML = '<p style="text-align: center; color: #a0aec0; padding: 20px;">Aucun élément pour le moment.</p>';
                return;
            }

            items.forEach(item => {
                const div = document.createElement('div');
                div.className = 'onafait-item';
                div.style.cssText = 'display: flex; align-items: center; padding: 12px; border-bottom: 1px solid #e2e8f0; transition: background 0.2s;';
                div.style.cursor = 'pointer';

                div.innerHTML = `
                <input type="checkbox" id="onafait-${item.id}" ${item.completed ? 'checked' : ''}
                style="margin-right: 12px; transform: scale(1.2); cursor: pointer;">
                <label for="onafait-${item.id}" style="flex: 1; cursor: pointer; display: flex; flex-direction: column;">
                <span style="${item.completed ? 'text-decoration: line-through; color: #a0aec0;' : 'color: #2d3748; font-weight: 600;'}">
                ${item.title} <span style="font-size: 0.85em; color: #718096; font-weight: normal;">(+${item.points} pts)</span>
                </span>
                ${item.description ? `<span style="font-size: 0.8em; color: #718096; margin-top: 2px;">${item.description}</span>` : ''}
                </label>
                `;

                // Gérer le changement d'état (cocher/décocher)
                const checkbox = div.querySelector('input[type="checkbox"]');
                checkbox.addEventListener('change', async (e) => {
                    const completed = e.target.checked;
                    try {
                        const res = await fetch('/api/onafait/toggle', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: item.id, completed })
                        });
                        const data = await res.json();

                        if (data.success) {
                            // Recharger la liste pour refléter les changements et les nouveaux points
                            loadOnAFaitList();

                            // Optionnel : Mettre à jour le widget du niveau d'amitié sur le dashboard s'il est visible
                            const levelDisplay = document.getElementById('friendship-level');
                            if (levelDisplay && data.displayLevel) {
                                levelDisplay.textContent = data.displayLevel;
                            }
                        } else {
                            alert(data.error || 'Erreur lors de la mise à jour');
                            e.target.checked = !completed; // Revenir à l'état précédent en cas d'erreur
                        }
                    } catch (err) {
                        console.error('Erreur toggle:', err);
                        alert('Erreur de connexion au serveur');
                        e.target.checked = !completed;
                    }
                });

                // Permettre de cliquer sur toute la ligne pour cocher
                div.addEventListener('click', (e) => {
                    if (e.target !== checkbox) {
                        checkbox.checked = !checkbox.checked;
                        checkbox.dispatchEvent(new Event('change'));
                    }
                });

                onafaitList.appendChild(div);
            });

        } catch (err) {
            console.error(err);
            onafaitList.innerHTML = '<p style="text-align: center; color: #e53e3e; padding: 20px;">Erreur lors du chargement des données.</p>';
        }
    }
}
