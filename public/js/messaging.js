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

    // 🆕 Éléments photo
    const photoInput = document.getElementById('photo-input');
    const photoToggleBtn = document.getElementById('photo-toggle-btn');
    const photoPreview = document.getElementById('photo-preview');
    const photoPreviewImg = document.getElementById('photo-preview-img');
    const removePhotoBtn = document.getElementById('remove-photo-btn');

    if (!entryBtn) return;

    let modalOpen = false;
    let lastMessageId = null;
    let selectedPhoto = null; // 🆕 Photo sélectionnée en attente d'envoi

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

    // ============ 🆕 GESTION ET COMPRESSION DES PHOTOS ============

    // Fonction utilitaire pour compresser l'image côté client
    async function compressImage(file, maxWidth = 800, quality = 0.7) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Redimensionner si l'image est plus large que maxWidth
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');

                    // Fond blanc au cas où c'est un PNG transparent
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0, width, height);

                    // Compression en JPEG avec le facteur de qualité
                    const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                    resolve(compressedDataUrl);
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    }

    if (photoToggleBtn && photoInput) {
        photoToggleBtn.addEventListener('click', () => photoInput.click());

        photoInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Vérification de base avant compression
            if (!file.type.startsWith('image/')) {
                alert('Veuillez sélectionner une image valide');
                photoInput.value = '';
                return;
            }

            // Afficher un petit indicateur de chargement (optionnel mais sympa)
            photoPreviewImg.src = '';
            photoPreview.style.display = 'block';
            photoPreview.innerHTML = '<p style="padding:10px; text-align:center; font-size:0.8rem;">Compression en cours...</p>';

            try {
                // 🚀 Compression de l'image
                const compressedBase64 = await compressImage(file, 800, 0.75);

                selectedPhoto = compressedBase64;

                // Restaurer l'affichage de l'aperçu avec l'image compressée
                photoPreview.innerHTML = `
                <img id="photo-preview-img" src="${compressedBase64}" alt="Aperçu">
                <button id="remove-photo-btn" class="remove-photo-btn" type="button">×</button>
                `;

                // Réattacher l'événement au nouveau bouton de suppression
                document.getElementById('remove-photo-btn').addEventListener('click', () => {
                    selectedPhoto = null;
                    photoInput.value = '';
                    photoPreview.style.display = 'none';
                    photoPreview.innerHTML = '';
                });

            } catch (err) {
                console.error("Erreur de compression :", err);
                alert("Impossible de traiter l'image.");
                photoPreview.style.display = 'none';
                photoInput.value = '';
            }
        });
    }

    // ============ ENVOI ============
    sendBtn.addEventListener('click', async () => {
        const text = inputField.value.trim();
        if (!text && !selectedPhoto) return; // 🆕 Permet d'envoyer une photo sans texte

        sendBtn.disabled = true;
        try {
            const payload = { text: text || '' };
            if (selectedPhoto) {
                payload.photo = selectedPhoto; // 🆕 Ajout de la photo
            }

            const res = await fetch('/api/messaging', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                inputField.value = '';
                // 🆕 Réinitialiser la photo après envoi
                selectedPhoto = null;
                photoInput.value = '';
                photoPreview.style.display = 'none';
                photoPreviewImg.src = '';

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
                unreadText.textContent = count === 1 ? 'message non lu ' : 'messages non lus 💬';
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

                let html = `<div class="msg-author">${escapeHTML(msg.author)}</div>`;

                //  Affichage du texte (optionnel maintenant)
                if (msg.text) {
                    html += `<div class="msg-text">${escapeHTML(msg.text)}</div>`;
                }

                //  Affichage de la photo si présente
                if (msg.photo) {
                    html += `<img src="${msg.photo}" class="msg-photo" alt="Photo" onclick="openPhotoLightbox(this.src)" loading="lazy">`;
                }

                html += `<div class="msg-time"> ${date} à ${time}</div>`;
                msgEl.innerHTML = html;
                historyContainer.appendChild(msgEl);
            });
        }

        function escapeHTML(str) {
            if (!str) return '';
            const p = document.createElement('p');
            p.textContent = str;
            return p.innerHTML;
        }

        // ============ 🆕 LIGHTBOX POUR PHOTOS ============
        window.openPhotoLightbox = function(photoSrc) {
            const lightbox = document.getElementById('photo-lightbox');
            const img = document.getElementById('photo-lightbox-img');
            if (lightbox && img) {
                img.src = photoSrc;
                lightbox.classList.add('active');
            }
        };

        window.closePhotoLightbox = function() {
            const lightbox = document.getElementById('photo-lightbox');
            if (lightbox) {
                lightbox.classList.remove('active');
            }
        };

        // Fermer la lightbox en cliquant dessus
        document.addEventListener('click', (e) => {
            const lightbox = document.getElementById('photo-lightbox');
            if (lightbox && e.target === lightbox) {
                closePhotoLightbox();
            }
        });

        // ============ SÉLECTEUR D'EMOJIS ============
        const emojiToggleBtn = document.getElementById('emoji-toggle-btn');
        const emojiPicker = document.getElementById('emoji-picker');
        if (emojiToggleBtn && emojiPicker) {
            const emojiGrid = emojiPicker.querySelector('.emoji-grid');
            const faceEmojis = ['😀','😃','','😁','😆','😅','','😂','🙂','🙃',
            '😉','😊','😇','🥰','😍','🤩','','😗','😚','😙',
            '😋','😛','😜','🤪','😝','🤑','','🤭','🤫',
            '🤔','🤐','','😐','😑','😶','😏','😒',
            '🙄','😬','🤥','😌','','😪','🤤','😴','😷','🤒',
            '','🤢','🤮','','🥶','🥴','','🤯','🤠','',
            '😎','🤓','🧐','😕','😟','','😮','😯',
            '😲','😳','🥺','😦','😧','😨','😰','😥','😢',
            '😭','😱','😖','😣','😞','😓','😩','😫','🥱','',
            '😡','😠','','😈','👿','💀','☠️','💩','🤡','👹',
            '👺','','👽','👾','','😺','😸','😹','😻','😼',
            '😽','🙀','😿','😾',''];

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
