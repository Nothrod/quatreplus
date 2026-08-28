// ➕ 1. IMPORT DU SYSTÈME DE NOTIFICATION (Nécessaire pour que le moteur de polling s'active)
import { notifSystem } from './notif-bell.js';

export function initMessaging() {
    const entryBtn = document.getElementById('widget-messaging-entry');
    const modal = document.getElementById('messaging-modal');
    const closeBtn = document.getElementById('messaging-close');
    const historyContainer = document.getElementById('messaging-history');
    const inputField = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-message-btn');
    const clearBtn = document.getElementById('clear-messages-btn');
    const unreadBadge = document.getElementById('messaging-unread-badge');
    const unreadText = document.getElementById('messaging-unread-text');

    if (!entryBtn) return;

    let modalOpen = false;
    let lastMessageId = null;

    // ============ OUVERTURE / FERMETURE ============
    entryBtn.addEventListener('click', async () => {
        modal.classList.add('active');
        modalOpen = true;
        await loadMessages('force');
        markAsRead();
    });

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        modalOpen = false;
    });

    // ============ ENVOI ============
    sendBtn.addEventListener('click', async () => {
        const text = inputField.value.trim();
        if (!text) return;
        sendBtn.disabled = true;
        try {
            const res = await fetch('/api/messaging', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            if (res.ok) {
                inputField.value = '';
                await loadMessages('force');
                markAsRead();
            }
        } catch (err) { console.error(err); }
        finally { sendBtn.disabled = false; }
    });

    // ============ VIDER ============
    clearBtn.addEventListener('click', async () => {
        if (!confirm('Es-tu sûr(e) de vouloir VIDER toute la messagerie pour vous deux ?')) return;
        clearBtn.disabled = true;
        try {
            const res = await fetch('/api/messaging', { method: 'DELETE' });
            if (res.ok) {
                lastMessageId = 'reset';
                await loadMessages('force');
                updateUnreadBadge();
            }
        } catch (err) { console.error(err); }
        finally { clearBtn.disabled = false; }
    });

    // ============ CHARGEMENT ============
    async function loadMessages(mode = 'auto') {
        try {
            const res = await fetch('/api/messaging');
            const data = await res.json();
            const messages = data.messages || [];
            const latestId = messages.length ? messages[messages.length - 1].id : null;

            if (mode === 'force' || latestId !== lastMessageId) {
                const nearBottom = historyContainer.scrollHeight - historyContainer.scrollTop - historyContainer.clientHeight < 120;

                // ✅ SUPPRIMÉ : La notification est maintenant gérée par le serveur (routes/messaging.js)
                // pour assurer la synchronisation entre Marc et Blandine.

                lastMessageId = latestId;
                renderMessages(messages);

                if (mode === 'force' || nearBottom) {
                    historyContainer.scrollTop = historyContainer.scrollHeight;
                }
                if (modalOpen && mode !== 'force') markAsRead();
            }
        } catch (err) { console.error(err); }
    }

    // ============ BADGE NON LUS ============
    async function updateUnreadBadge() {
        if (!unreadBadge || !unreadText) return;
        try {
            const res = await fetch('/api/messaging/unread');
            const count = (await res.json()).count || 0;

            if (count > 0) {
                unreadBadge.textContent = count;
                unreadBadge.style.display = 'inline-flex';
                unreadText.textContent = count === 1 ? 'message non lu 💬' : 'messages non lus 💬';
            } else {
                unreadBadge.style.display = 'none';
                unreadText.textContent = 'Aucun message non lu';
            }
        } catch (err) { console.error(err); }
    }

    async function markAsRead() {
        try {
            await fetch('/api/messaging/read', { method: 'POST' });
            updateUnreadBadge();
        } catch (err) { console.error(err); }
    }

    // ============ 🆕 TEMPS RÉEL (toutes les 10s) ============
    setInterval(() => {
        updateUnreadBadge();
        if (modalOpen) loadMessages();
    }, 10000);

        updateUnreadBadge();

        // ============ AFFICHAGE ============
        function renderMessages(messages) {
            historyContainer.innerHTML = '';
            if (messages.length === 0) {
                historyContainer.innerHTML = '<p class="empty-msg">Aucun message pour le moment... Envoie le premier ! 💌</p>';
                return;
            }
            messages.forEach(msg => {
                const msgEl = document.createElement('div');
                msgEl.className = `msg-bubble ${msg.isMe ? 'msg-me' : 'msg-other'}`;
                const d = new Date(msg.timestamp);
                const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                const date = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
                msgEl.innerHTML = `
                <div class="msg-author">${escapeHTML(msg.author)}</div>
                <div class="msg-text">${escapeHTML(msg.text)}</div>
                <div class="msg-time">📅 ${date} à ${time}</div>
                `;
                historyContainer.appendChild(msgEl);
            });
        }

        function escapeHTML(str) {
            const p = document.createElement('p');
            p.textContent = str;
            return p.innerHTML;
        }

        // ============ SÉLECTEUR D'EMOJIS ============
        const emojiToggleBtn = document.getElementById('emoji-toggle-btn');
        const emojiPicker = document.getElementById('emoji-picker');
        if (emojiToggleBtn && emojiPicker) {
            const emojiGrid = emojiPicker.querySelector('.emoji-grid');
            const faceEmojis = ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃',
            '😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙',
            '😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫',
            '🤔','🤐','🤨','😐','😑','😶','😏','😒',
            '🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒',
            '🤕','🤢','🤮','🥵','🥶','🥴','😵','🤯','🤠','🥳',
            '😎','🤓','🧐','😕','😟','🙁','😮','😯',
            '😲','😳','🥺','😦','😧','😨','😰','😥','😢',
            '😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤',
            '😡','😠','🤬','😈','👿','💀','☠️','💩','🤡','👹',
            '👺','👻','👽','👾','🤖','😺','😸','😹','😻','😼',
            '😽','🙀','😿','😾','🙈'];

            faceEmojis.forEach(emoji => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'emoji-item';
                btn.textContent = emoji;
                btn.addEventListener('click', () => insertEmoji(emoji));
                emojiGrid.appendChild(btn);
            });

            emojiToggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                emojiPicker.classList.toggle('active');
            });

            document.addEventListener('click', (e) => {
                if (!emojiPicker.contains(e.target) && e.target !== emojiToggleBtn) {
                    emojiPicker.classList.remove('active');
                }
            });

            function insertEmoji(emoji) {
                const start = inputField.selectionStart;
                const end = inputField.selectionEnd;
                const text = inputField.value;
                inputField.value = text.substring(0, start) + emoji + text.substring(end);
                const newPos = start + emoji.length;
                inputField.setSelectionRange(newPos, newPos);
                inputField.focus();
                emojiPicker.classList.remove('active');
            }
        }
}
