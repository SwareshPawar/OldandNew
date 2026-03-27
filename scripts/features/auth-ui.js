(function initAuthUI(global) {
    function showLoginModal() {
        const modal = global.document.getElementById('loginModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    function showRegisterModal() {
        const modal = global.document.getElementById('registerModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    async function login(deps) {
        const username = global.document.getElementById('loginUsername')?.value || '';
        const password = global.document.getElementById('loginPassword')?.value || '';

        try {
            const res = await global.fetch(`${deps.API_BASE_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (res.ok && data.token) {
                deps.setJwtToken(data.token);
                global.localStorage.setItem('jwtToken', data.token);
                deps.setCurrentUser(data.user);
                global.localStorage.setItem('currentUser', JSON.stringify(data.user));

                const loginModal = global.document.getElementById('loginModal');
                if (loginModal) loginModal.style.display = 'none';
                deps.showNotification('Login successful!');

                if (data.user && (data.user.isAdmin === true || data.user.isAdmin === 'true')) {
                    global.setTimeout(() => { global.location.reload(); }, 500);
                } else {
                    deps.updateAuthButtons();

                    if (deps.initializationState.isInitialized) {
                        await deps.loadUserData();
                        await deps.loadMySetlists();
                        await deps.loadSmartSetlistsFromServer();
                        deps.renderMySetlists();
                        deps.renderSmartSetlists();
                    } else if (!deps.initializationState.isInitializing) {
                        deps.showLoading(0, 'Initializing...');
                        await global.init();

                        if (global.innerWidth <= 768) {
                            const sidebar = global.document.querySelector('.sidebar');
                            if (sidebar) {
                                sidebar.classList.remove('hidden');
                            }
                        }
                    }
                }
            } else {
                deps.showNotification(data.error || 'Login failed');
            }
        } catch (err) {
            deps.showNotification('Login error');
        }
    }

    async function register(deps) {
        const username = global.document.getElementById('registerUsername')?.value || '';
        const password = global.document.getElementById('registerPassword')?.value || '';

        try {
            const res = await global.fetch(`${deps.API_BASE_URL}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (res.ok) {
                const registerModal = global.document.getElementById('registerModal');
                if (registerModal) registerModal.style.display = 'none';
                deps.showNotification('Registration successful! Please login.');

                global.setTimeout(() => {
                    const loginModal = global.document.getElementById('loginModal');
                    if (loginModal) {
                        loginModal.style.display = 'flex';
                        const loginUsername = global.document.getElementById('loginUsername');
                        if (loginUsername) loginUsername.value = username;
                    }
                }, 1000);
            } else {
                deps.showNotification(data.error || 'Registration failed');
            }
        } catch (err) {
            deps.showNotification('Registration error');
        }
    }

    function logout(deps) {
        deps.setJwtToken('');
        try {
            global.localStorage.removeItem('jwtToken');
        } catch (e) {
            console.warn('Failed to clear jwtToken:', e);
        }

        deps.setCurrentUser(null);
        try {
            global.localStorage.removeItem('currentUser');
        } catch (e) {
            console.warn('Failed to clear currentUser:', e);
        }

        deps.clearSmartSetlists();
        deps.showNotification('Logged out');
        deps.updateAuthButtons();
        global.setTimeout(() => { global.location.reload(); }, 500);
    }

    function updateAuthButtons(deps) {
        const isLoggedIn = !!deps.jwtToken;
        const userGreeting = global.document.getElementById('userGreeting');

        if (isLoggedIn && deps.currentUser && deps.currentUser.firstName && deps.currentUser.lastName) {
            userGreeting.textContent = `Hi, ${deps.currentUser.firstName} ${deps.currentUser.lastName}`;
            userGreeting.style.display = 'block';
        } else if (isLoggedIn && deps.currentUser && deps.currentUser.username) {
            userGreeting.textContent = `Hi, ${deps.currentUser.username}`;
            userGreeting.style.display = 'block';
        } else {
            userGreeting.textContent = '';
            userGreeting.style.display = 'none';
        }

        global.document.getElementById('loginBtn').style.display = isLoggedIn ? 'none' : 'block';
        global.document.getElementById('logoutBtn').style.display = isLoggedIn ? 'block' : 'none';

        const registerBtn = global.document.getElementById('registerBtn');
        if (registerBtn) registerBtn.style.display = isLoggedIn ? 'none' : 'block';

        const isAdminUser = deps.isAdmin();
        global.document.getElementById('adminPanelBtn').style.display = isAdminUser ? 'block' : 'none';
        global.document.getElementById('deleteAllSongsBtn').style.display = isAdminUser ? 'block' : 'none';

        if (!isLoggedIn) {
            global.document.getElementById('deleteSection').style.display = 'none';
        }

        const addGlobalSetlistBtn = global.document.getElementById('addGlobalSetlistBtn');
        const addMySetlistBtn = global.document.getElementById('addMySetlistBtn');
        const addSmartSetlistBtn = global.document.getElementById('addSmartSetlistBtn');

        if (addGlobalSetlistBtn) {
            addGlobalSetlistBtn.style.display = (isAdminUser && global.document.getElementById('globalSetlistContent')?.style.display === 'block') ? 'block' : 'none';
        }

        if (addMySetlistBtn) {
            addMySetlistBtn.style.display = (isLoggedIn && global.document.getElementById('mySetlistContent')?.style.display === 'block') ? 'block' : 'none';
        }

        if (addSmartSetlistBtn) {
            addSmartSetlistBtn.style.display = (isLoggedIn && global.document.getElementById('smartSetlistContent')?.style.display === 'block') ? 'block' : 'none';
        }
    }

    function hideAuthModals() {
        const loginModal = global.document.getElementById('loginModal');
        const registerModal = global.document.getElementById('registerModal');
        if (loginModal) loginModal.style.display = 'none';
        if (registerModal) registerModal.style.display = 'none';
    }

    global.AuthUI = {
        hideAuthModals,
        login,
        logout,
        register,
        showLoginModal,
        showRegisterModal,
        updateAuthButtons
    };
})(window);