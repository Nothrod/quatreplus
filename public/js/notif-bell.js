// public/js/notif-bell.js

export class NotificationSystem {
    constructor() {
        this.STORAGE_KEY = 'app_ui_notifications'; // Clé différente pour ne pas interférer
        this.bell = document.getElementById('notificationBell');
        if (!this.bell) return; // Sécurité si la cloche n'est pas sur la page actuelle

        this.badge = document.getElementById('bellBadge');
        this.dropdown = document.getElementById('notificationDropdown');
        this.list = document.getElementById('notifList');

        this.types = {
            chat:     { icon: '💬', cls: 'icon-chat',     label: 'Tchat' },
            humeur:   { icon: '😊', cls: 'icon-humeur',   label: 'Humeur' },
            question: { icon: '❓', cls: 'icon-question', label: 'Question' },
            lieux:    { icon: '📍', cls: 'icon-lieux',    label: 'Nos lieux' },
            visiter:  { icon: '🗺️', cls: 'icon-visiter',  label: 'Lieux à visiter' },
            badge:    { icon: '🏆', cls: 'icon-badge',    label: 'Badge' },
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
    }

    newChatMessage(sender, preview) {
        this.push({ type: 'chat', text: `<b>${sender}</b> a répondu dans <b>la cabane</b> : « ${preview} »`, link: '/chat' });
    }
    humeurChanged(from, to) {
        this.push({ type: 'humeur', text: `Ton humeur est passée de <b>${from}</b> à <b>${to}</b>.`, link: '/mood' });
    }
    questionAnswered(question, answerer) {
        this.push({ type: 'question', text: `<b>${answerer}</b> a répondu à ta question : « ${question} »`, link: '/questions' });
    }
    lieuAjoute(name, author) {
        this.push({ type: 'lieux', text: `<b>${author}</b> a ajouté <b>${name}</b> à « Nos lieux ».`, link: '/map' });
    }
    lieuAVisiterAjoute(name, author) {
        this.push({ type: 'visiter', text: `<b>${author}</b> a ajouté <b>${name}</b> à « Lieux à visiter ».`, link: '/places' });
    }
    badgeDebloque(badgeName) {
        this.push({ type: 'badge', text: `Nouveau badge débloqué : <b>« ${badgeName} »</b> 🎉`, link: '/profile' });
    }

    push({ type, text, link }) {
        const notif = { id: Date.now() + Math.random(), type, text, link, read: false, createdAt: Date.now() };
        const all = this.getAll();
        all.unshift(notif);
        this.save(all.slice(0, 50)); // Garde seulement les 50 dernières pour ne pas surcharger
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
        if (diff < 3600) return `il y a ${Math.floor(diff/60)} min`;
        if (diff < 86400) return `il y a ${Math.floor(diff/3600)} h`;
        return `il y a ${Math.floor(diff/86400)} j`;
    }
}

// Export de l'instance unique
export const notifSystem = new NotificationSystem();
