// public/js/notif-bell.js

export class NotificationSystem {
    constructor() {
        this.STORAGE_KEY = 'app_ui_notifications';
        this.bell = document.getElementById('notificationBell');
        if (!this.bell) return;

        this.badge = document.getElementById('bellBadge');
        this.dropdown = document.getElementById('notificationDropdown');
        this.list = document.getElementById('notifList');

        this.types = {
            chat: { icon: '💬', cls: 'icon-chat', label: 'Tchat' },
            humeur: { icon: '😊', cls: 'icon-humeur', label: 'Humeur' },
            question: { icon: '❓', cls: 'icon-question', label: 'Question' },
            lieux: { icon: '📍', cls: 'icon-lieux', label: 'Nos lieux' },
            visiter: { icon: '🗺️', cls: 'icon-visiter', label: 'Lieux à visiter' },
            badge: { icon: '🏆', cls: 'icon-badge', label: 'Badge' },
            info: { icon: '💌', cls: 'icon-info', label: 'Info' } // ✅ AJOUTÉ pour le "Je pense à toi"
        };
        this.init();
    }

    init() {
        if (!this.bell) return;
        const btn = this.bell.querySelector('.bell-btn');

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.dropdown.classList.toggle('open');
        });

        document.addEventListener('click', (e) => {
            if (!this.bell.contains(e.target)) this.dropdown.classList.remove('open');
        });

            document.getElementById('markAllRead')?.addEventListener('click', () => this.markAllRead());

            this.render();
            this.startPolling(); // ✅ LANCEMENT DU POLLING
    }

    // ✅ NOUVEAU : Va chercher les notifs sur le serveur
    startPolling() {
        // Vérifie immédiatement au chargement de la page, puis toutes les 15 secondes
        this.fetchPending();
        setInterval(() => this.fetchPending(), 15000);
    }

    async fetchPending() {
        try {
            const res = await fetch('/api/notifications/pending');
            if (res.status === 401 || !res.ok) return;

            const data = await res.json();

            if (data.notifications && data.notifications.length > 0) {
                console.log(`🔔 ${data.notifications.length} nouvelle(s) notif(s) reçue(s) du serveur !`);

                let hasThinkOfYou = false;
                let thinkOfYouCount = 0;

                data.notifications.forEach(notif => {
                    // On ajoute la notif à la cloche
                    this.push({
                        type: notif.type,
                        text: notif.text,
                        link: notif.link
                    });

                    // On vérifie si c'est un "Je pense à toi"
                    if (notif.type === 'info' && notif.text.includes("Je pense à toi")) {
                        hasThinkOfYou = true;
                        thinkOfYouCount++;
                    }
                });

                // ✅ SI on a reçu un "Je pense à toi", on prévient le popup !
                if (hasThinkOfYou) {
                    window.dispatchEvent(new CustomEvent('thinkOfYouReceived', {
                        detail: { count: thinkOfYouCount }
                    }));
                }
            }
        } catch (err) {
            console.error('Erreur polling cloche:', err);
        }
    }

    // --- Le reste de tes méthodes reste exactement identique ---
    newChatMessage(sender, preview) {
        this.push({ type: 'chat', text: `<b>${sender}</b> a répondu dans <b>la cabane</b> : « ${preview} »`, link: '/chat' });
    }
    // ... (garde tes autres méthodes : humeurChanged, questionAnswered, etc.) ...

    push({ type, text, link }) {
        const notif = { id: Date.now() + Math.random(), type, text, link, read: false, createdAt: Date.now() };
        const all = this.getAll();
        all.unshift(notif);
        this.save(all.slice(0, 50));
        this.render();
        this.ringBell();
    }

    getAll() {
        try { return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || []; }
        catch { return []; }
    }

    save(list) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
    }

    render() {
        if (!this.bell) return;
        const all = this.getAll();
        const unread = all.filter(n => !n.read).length;

        if (unread > 0) {
            this.badge.hidden = false;
            this.badge.textContent = unread > 99 ? '99+' : unread;
        } else {
            this.badge.hidden = true;
        }

        if (all.length === 0) {
            this.list.innerHTML = '<li class="notif-empty">Aucune notification.</li>';
            return;
        }

        this.list.innerHTML = all.map(n => {
            const t = this.types[n.type] || { icon: '🔔', cls: 'icon-chat' };
            return `
            <li class="notif-item ${n.read ? '' : 'unread'}" data-id="${n.id}" data-link="${n.link || ''}">
            <div class="notif-icon ${t.cls}">${t.icon}</div>
            <div class="notif-content">
            <p class="notif-text">${n.text}</p>
            <span class="notif-time">${this.timeAgo(n.createdAt)}</span>
            </div>
            </li>
            `;
        }).join('');

        this.list.querySelectorAll('.notif-item').forEach(el => {
            el.addEventListener('click', () => {
                this.markRead(parseFloat(el.dataset.id));
                if (el.dataset.link) window.location.href = el.dataset.link;
            });
        });
    }

    markRead(id) {
        const all = this.getAll().map(n => n.id === id ? { ...n, read: true } : n);
        this.save(all);
        this.render();
    }

    markAllRead() {
        const all = this.getAll().map(n => ({ ...n, read: true }));
        this.save(all);
        this.render();
    }

    ringBell() {
        const btn = this.bell.querySelector('.bell-btn');
        btn.classList.remove('ring');
        void btn.offsetWidth;
        btn.classList.add('ring');
    }

    timeAgo(ts) {
        const diff = (Date.now() - ts) / 1000;
        if (diff < 60) return 'à l’instant';
        if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
        if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
        return `il y a ${Math.floor(diff / 86400)} j`;
    }
}

export const notifSystem = new NotificationSystem();
