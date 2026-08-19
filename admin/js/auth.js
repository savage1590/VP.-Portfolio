// Authentication controller
const auth = {
    currentUser: null,

    async init() {
        this.bindEvents();
        try {
            const data = await API.getMe();
            this.currentUser = data.user;
            this.showApp();
        } catch (err) {
            this.showLogin();
        }
    },

    bindEvents() {
        const loginForm = document.getElementById('loginForm');
        const logoutBtn = document.getElementById('btnLogout');
        const togglePwdBtn = document.getElementById('togglePasswordBtn');
        const pwdForm = document.getElementById('passwordForm');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        if (togglePwdBtn) {
            togglePwdBtn.addEventListener('click', () => {
                const pwdInput = document.getElementById('loginPassword');
                if (pwdInput.type === 'password') {
                    pwdInput.type = 'text';
                    togglePwdBtn.textContent = '🙈';
                } else {
                    pwdInput.type = 'password';
                    togglePwdBtn.textContent = '👁️';
                }
            });
        }

        if (pwdForm) {
            pwdForm.addEventListener('submit', (e) => this.handleChangePassword(e));
        }
    },

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const errorAlert = document.getElementById('loginError');
        const submitBtn = document.getElementById('btnLoginSubmit');

        errorAlert.style.display = 'none';
        submitBtn.disabled = true;
        submitBtn.querySelector('.btn-text').textContent = 'Перевірка...';

        try {
            const res = await API.login(email, password);
            this.currentUser = res.user;
            app.showToast('Авторизація успішна! Ласкаво просимо.', 'success');
            this.showApp();
            app.initDashboard();
        } catch (err) {
            let msg = err.data?.error || err.message || 'Помилка авторизації';
            if (err.status === 404 || err.message?.includes('404')) {
                msg = 'Помилка 404: Бекенд-сервер недоступний або API-маршрут не знайдено.';
            } else if (err.status === 401) {
                msg = 'Невірний Email або пароль. Перевірте введені дані.';
            }
            errorAlert.textContent = msg;
            errorAlert.style.display = 'block';
        } finally {
            submitBtn.disabled = false;
            submitBtn.querySelector('.btn-text').textContent = 'Увійти в панель';
        }
    },

    async handleLogout() {
        app.confirmDialog({
            title: 'Вихід з акаунта',
            message: 'Ви впевнені, що бажаєте завершити поточну сесію?',
            confirmText: 'Вийти',
            onConfirm: async () => {
                try {
                    await API.logout();
                } catch (e) {}
                this.currentUser = null;
                this.showLogin();
                app.showToast('Ви успішно вийшли з системи', 'info');
            }
        });
    },

    async handleChangePassword(e) {
        e.preventDefault();
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;

        if (newPassword !== confirmNewPassword) {
            app.showToast('Новий пароль та підтвердження не співпадають', 'error');
            return;
        }

        try {
            await API.changePassword(currentPassword, newPassword);
            app.showToast('Пароль успішно оновлено!', 'success');
            app.closeModal('passwordModal');
            document.getElementById('passwordForm').reset();
        } catch (err) {
            app.showToast(err.data?.error || 'Не вдалося оновити пароль', 'error');
        }
    },

    showLogin() {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('adminApp').style.display = 'none';
    },

    showApp() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminApp').style.display = 'grid';
        if (this.currentUser) {
            document.getElementById('userEmailDisplay').textContent = this.currentUser.email;
        }
    }
};

window.auth = auth;
