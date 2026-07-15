export function initAuth(onLoginSuccess) {
    const loginScreen = document.getElementById('login-screen');
    const mainScreen = document.getElementById('main-screen');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const welcomeMsg = document.getElementById('welcome-msg');
    const logoutBtn = document.getElementById('logout-btn');

    async function checkAuth() {
        try {
            const res = await fetch('/api/auth/me');
            const data = await res.json();
            if (data.loggedIn) {
                showMainScreen(data);
            } else {
                showLoginScreen();
            }
        } catch (err) {
            console.error('Erreur réseau:', err);
            showLoginScreen();
        }
    }

    function showLoginScreen() {
        loginScreen.classList.add('active');
        mainScreen.classList.remove('active');
    }

    function showMainScreen(data) {
        const displayName = data.user === 'marc' ? 'Marc' : 'Blandine';
        welcomeMsg.textContent = `Bonjour, ${displayName} 🤍`;
        loginScreen.classList.remove('active');
        mainScreen.classList.add('active');
        onLoginSuccess(data); // On déclenche le chargement des autres modules
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.textContent = 'Connexion en cours...';
        const username = document.getElementById('username').value.toLowerCase().trim();
        const password = document.getElementById('password').value;

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (data.success) {
                loginError.textContent = '';
                const meRes = await fetch('/api/auth/me');
                const meData = await meRes.json();
                showMainScreen(meData);
            } else {
                loginError.textContent = data.error || 'Identifiants incorrects';
            }
        } catch (err) {
            loginError.textContent = 'Erreur de connexion au serveur';
        }
    });

    logoutBtn.addEventListener('click', async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        showLoginScreen();
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        loginError.textContent = '';
    });

    checkAuth();
}