export function initNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));
            
            btn.classList.add('active');
            const targetTabId = btn.getAttribute('data-tab');
            const targetTab = document.getElementById(targetTabId);
            if (targetTab) targetTab.classList.add('active');
        });
    });
}