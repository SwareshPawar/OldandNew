// --- JWT expiry helpers: must be at the very top ---
function getJwtExpiry(token) {
    if (!token) return 0;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp ? payload.exp * 1000 : 0;
    } catch {
        return 0;
    }
}

function isJwtValid(token) {
    const expiry = getJwtExpiry(token);
    return token && expiry && Date.now() < expiry;
}

// Always define notificationEl first so it's available to all functions
    const notificationEl = document.getElementById('notification');

    // Initialize songs and setlists
    let isDarkMode = localStorage.getItem('darkMode') === 'true';
        let socket = null;
        let songs = [];
        let lastSongsFetch = null; // ISO string of last fetch
        let favorites = [];
        let keepScreenOn = false;
        let autoScrollSpeed = localStorage.getItem('autoScrollSpeed') || 1500;
        let suggestedSongsDrawerOpen = false;
        let touchStartX = 0;
        let touchStartY = 0;
        let isScrolling = false;
        let jwtToken = localStorage.getItem('jwtToken') || '';
        let currentUser = null;
        // Restore currentUser from localStorage if available
        try {
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) currentUser = JSON.parse(storedUser);
        } catch {}


        // Dynamic API base URL for local/dev/prod
        const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? 'http://localhost:3001'
            : 'https://oldandnew.onrender.com';

        // Restore JWT token and user state on every refresh
        if (!jwtToken && localStorage.getItem('jwtToken')) {
            jwtToken = localStorage.getItem('jwtToken');
        }


        // On script load, update UI and user data if logged in
        if (jwtToken && isJwtValid(jwtToken)) {
            // Only load user data if token is valid
            loadUserData().then(() => {
                updateAuthButtons();
            });
        } else {
            // Remove expired token
            localStorage.removeItem('jwtToken');
            jwtToken = '';
            updateAuthButtons();
        }

        // Also ensure greeting is updated after DOM is ready (in case of async issues)
        document.addEventListener('DOMContentLoaded', () => {
            updateAuthButtons();
            // Add event listener for the new Add Song button below Favorites
            const addSongBelowFavoritesBtn = document.getElementById('addSongBelowFavoritesBtn');
            if (addSongBelowFavoritesBtn) {
                addSongBelowFavoritesBtn.onclick = function() {
                    if (typeof openAddSongModal === 'function') {
                        openAddSongModal.click();
                    } else {
                        // fallback: open modal directly
                        document.getElementById('addSongModal').style.display = 'flex';
                    }
                };
            }
            // Add event listener for sort filter
            const sortFilter = document.getElementById('sortFilter');
            if (sortFilter) {
                sortFilter.addEventListener('change', function() {
                    const activeTab = document.getElementById('NewTab').classList.contains('active') ? 'New' : 'Old';
                    renderSongs(activeTab, keyFilter.value, genreFilter.value);
                });
            }
        });
            
        async function loadSongsFromFile() {
            console.time('loadSongsFromFile:total');
            // 1. Load songs from localStorage first
            let localSongs = JSON.parse(localStorage.getItem('songs') || '[]');
            songs = localSongs;
            // 2. Find latest updatedAt timestamp
            let latestUpdatedAt = localSongs.length > 0 ? Math.max(...localSongs.map(s => new Date(s.updatedAt || s.createdAt || 0).getTime())) : 0;
            // 3. Render songs immediately
            renderSongs('New', '', '');
            updateSongCount();
            // 4. Fetch new/updated songs from server in background
            try {
                let url = `${API_BASE_URL}/api/songs`;
                if (latestUpdatedAt) {
                    // Pass latest updatedAt as query param (API must support this)
                    url += `?updatedAfter=${latestUpdatedAt}`;
                }
                console.time('authFetch');
                const response = await authFetch(url);
                console.timeEnd('authFetch');
                if (response.ok) {
                    console.time('response.json');
                    const newSongs = await response.json();
                    console.timeEnd('response.json');
                    if (Array.isArray(newSongs)) {
                        // Merge new/updated songs into local cache
                        let mergedSongs = [...localSongs];
                        newSongs.forEach(newSong => {
                            const idx = mergedSongs.findIndex(s => s.id === newSong.id);
                            if (idx !== -1) {
                                mergedSongs[idx] = newSong; // update existing
                            } else {
                                mergedSongs.push(newSong); // add new
                            }
                        });
                        songs = mergedSongs;
                        localStorage.setItem('songs', JSON.stringify(songs));
                        // Update last fetch timestamp
                        if (newSongs.length > 0) {
                            const latest = newSongs.reduce((max, s) => {
                                const t = s.updatedAt || s.createdAt;
                                return (!max || t > max) ? t : max;
                            }, latestUpdatedAt);
                            lastSongsFetch = latest;
                        }
                        renderSongs('New', '', '');
                        updateSongCount();
                        return songs;
                    }
                    return songs;
                } else {
                    const errorText = await response.text();
                    console.error('API error in loadSongsFromFile:', response.status, errorText);
                }
                return songs;
            } catch (err) {
                console.error('Error loading songs from API (loadSongsFromFile):', err);
                console.timeEnd('loadSongsFromFile:total');
                return songs;
            }
            console.timeEnd('loadSongsFromFile:total');
        }
    
        function connectWebSocket() {
            if (!window.WebSocket) {
                console.warn("WebSockets not supported in this browser");
                return;
            }
            console.log("WebSocket connection removed for GitHub Pages compatibility");
        }
    
        function updateSongCount() {
            document.getElementById('totalSongs').textContent = songs.length;
            document.getElementById('NewCount').textContent = songs.filter(s => s.category === 'New').length;
            document.getElementById('OldCount').textContent = songs.filter(s => s.category === 'Old').length;
        }
    
        let NewSetlist = [];
        let OldSetlist = [];
    
        // DOM Elements
        const NewTab = document.getElementById('NewTab');
        const OldTab = document.getElementById('OldTab');
        const NewContent = document.getElementById('NewContent');
        const OldContent = document.getElementById('OldContent');
        const keyFilter = document.getElementById('keyFilter');
        const genreFilter = document.getElementById('genreFilter');
        const songPreviewEl = document.getElementById('songPreview');
        const showSetlistEl = document.getElementById('showSetlist');
        const showAllEl = document.getElementById('showAll');
        const showFavoritesEl = document.getElementById('showFavorites');
        const setlistSection = document.getElementById('setlistSection');
        const NewSetlistSongs = document.getElementById('NewSetlistSongs');
        const OldSetlistSongs = document.getElementById('OldSetlistSongs');
        const NewSetlistTab = document.getElementById('NewSetlistTab');
        const OldSetlistTab = document.getElementById('OldSetlistTab');
        const deleteSection = document.getElementById('deleteSection');
        const deleteContent = document.getElementById('deleteContent');
        const favoritesSection = document.getElementById('favoritesSection');
        const favoritesContent = document.getElementById('favoritesContent');
        const addSongModal = document.getElementById('addSongModal');
        const openAddSongModal = document.getElementById('openAddSongModal');
        const newSongForm = document.getElementById('newSongForm');
        const editSongModal = document.getElementById('editSongModal');
        const editSongForm = document.getElementById('editSongForm');
        const deleteSongModal = document.getElementById('deleteSongModal');
        const deleteSongForm = document.getElementById('deleteSongForm');
        const cancelDeleteSong = document.getElementById('cancelDeleteSong');
        const downloadBtn = document.getElementById('downloadSongsBtn');
        const deleteAllSongsBtn = document.getElementById('deleteAllSongsBtn');
        const confirmDeleteAllModal = document.getElementById('confirmDeleteAllModal');
        const cancelDeleteAll = document.getElementById('cancelDeleteAll');
        const confirmDeleteAll = document.getElementById('confirmDeleteAll');
        const searchInput = document.getElementById('searchInput');
        const clearSearchBtn = document.getElementById('clearSearch');
    const toggleSidebarBtn = document.getElementById('toggle-sidebar');
    const toggleSongsBtn = document.getElementById('toggle-songs');
    const toggleAllPanelsBtn = document.getElementById('toggle-all-panels');
    const toggleAutoScrollBtn = document.getElementById('toggleAutoScroll');
    const keepScreenOnBtn = document.getElementById('keepScreenOnBtn');

    document.getElementById('loginBtn').onclick = () => showLoginModal();
    document.getElementById('logoutBtn').onclick = () => logout();
    // --- Admin Panel Logic ---
    async function fetchUsers() {
        try {
            const jwtToken = localStorage.getItem('jwtToken');
            const res = await fetch(`${API_BASE_URL}/api/users`, {
                headers: { 'Authorization': `Bearer ${jwtToken}` }
            });
            if (!res.ok) {
                const errorText = await res.text();
                console.error('API error in fetchUsers:', res.status, errorText);
                return [];
            }
            return res.json();
        } catch (err) {
            console.error('Network error in fetchUsers:', err);
            return [];
        }
    }
    async function markAdmin(userId) {
        try {
            const jwtToken = localStorage.getItem('jwtToken');
            const res = await fetch(`${API_BASE_URL}/api/users/${userId}/admin`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${jwtToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isAdmin: true })
            });
            if (res.ok) {
                showAdminNotification('User marked as admin');
                loadUsers();
            } else {
                const errorText = await res.text();
                console.error('API error in markAdmin:', res.status, errorText);
                showAdminNotification('Failed to update user');
            }
        } catch (err) {
            console.error('Network error in markAdmin:', err);
            showAdminNotification('Failed to update user');
        }
    }
    function showAdminNotification(msg) {
        const n = document.getElementById('adminNotification');
        n.textContent = msg;
        n.style.display = 'block';
        setTimeout(() => n.style.display = 'none', 2000);
    }
    function renderUsers(users) {
        const tbody = document.querySelector('#usersTable tbody');
        tbody.innerHTML = '';
        users.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="max-width:180px;overflow-wrap:break-word;">${user.username}</td>
                <td>${user.isAdmin ? '<span class=\"admin-badge\">Admin</span>' : ''}</td>
                <td>
                    <button class="btn" ${user.isAdmin ? 'disabled' : ''} onclick="markAdmin('${user._id}')">Mark Admin</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
    async function loadUsers() {
        const users = await fetchUsers();
        renderUsers(users);
    }
    function showAdminPanelModal() {
        document.getElementById('adminPanelModal').style.display = 'flex';
        // Tab logic (future-proof)
        document.getElementById('userMgmtTab').classList.add('active');
        document.getElementById('userMgmtTabContent').style.display = '';
        loadUsers();
        window.markAdmin = markAdmin;
    }
    const adminPanelBtn = document.getElementById('adminPanelBtn');
    adminPanelBtn.onclick = () => showAdminPanelModal();
        // Show login modal (local/JWT)
        function showLoginModal() {
            let modal = document.getElementById('loginModal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'loginModal';
                modal.className = 'modal';
                modal.innerHTML = `
                    <div class="modal-content">
                        <span class="close-modal" onclick="this.closest('.modal').style.display='none'">×</span>
                        <h3>Login</h3>
                        <input id="loginUsername" type="text" placeholder="Username" style="width:100%;margin-bottom:10px;">
                        <input id="loginPassword" type="password" placeholder="Password" style="width:100%;margin-bottom:10px;">
                        <button id="loginSubmitBtn" class="btn btn-primary" style="width:100%;">Login</button>
                        <div style="margin-top:10px;text-align:center;">
                            <a href="#" id="showRegisterLink">Register</a>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
                document.getElementById('loginSubmitBtn').onclick = login;
                document.getElementById('showRegisterLink').onclick = (e) => {
                    e.preventDefault();
                    modal.style.display = 'none';
                    showRegisterModal();
                };
            }
            modal.style.display = 'flex';
        }

        function showRegisterModal() {
            let modal = document.getElementById('registerModal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'registerModal';
                modal.className = 'modal';
                modal.innerHTML = `
                    <div class="modal-content">
                        <span class="close-modal" onclick="this.closest('.modal').style.display='none'">×</span>
                        <h3>Register</h3>
                        <input id="registerUsername" type="text" placeholder="Username" style="width:100%;margin-bottom:10px;">
                        <input id="registerPassword" type="password" placeholder="Password" style="width:100%;margin-bottom:10px;">
                        <button id="registerSubmitBtn" class="btn btn-primary" style="width:100%;">Register</button>
                    </div>
                `;
                document.body.appendChild(modal);
                document.getElementById('registerSubmitBtn').onclick = register;
            }
            modal.style.display = 'flex';
        }

        async function login() {
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            try {
                const res = await fetch(`${API_BASE_URL}/api/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await res.json();
                if (res.ok && data.token) {
                    jwtToken = data.token;
                    localStorage.setItem('jwtToken', jwtToken);
                    currentUser = data.user;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    document.getElementById('loginModal').style.display = 'none';
                    showNotification('Login successful!');
                    // If user is admin, reload page to ensure all admin UI loads
                    if (currentUser && (currentUser.isAdmin === true || currentUser.isAdmin === 'true')) {
                        setTimeout(() => { window.location.reload(); }, 500);
                    } else {
                        updateAuthButtons();
                        await loadUserData();
                    }
                } else {
                    showNotification(data.error || 'Login failed');
                }
            } catch (err) {
                showNotification('Login error');
            }
        }

        async function register() {
            const username = document.getElementById('registerUsername').value;
            const password = document.getElementById('registerPassword').value;
            try {
                const res = await fetch(`${API_BASE_URL}/api/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await res.json();
                if (res.ok) {
                    document.getElementById('registerModal').style.display = 'none';
                    showNotification('Registration successful! Please login.');
                } else {
                    showNotification(data.error || 'Registration failed');
                }
            } catch (err) {
                showNotification('Registration error');
            }
        }

        function logout() {
            jwtToken = '';
            localStorage.removeItem('jwtToken');
            currentUser = null;
            localStorage.removeItem('currentUser');
            showNotification('Logged out');
            updateAuthButtons();
            // Reload page after logout to ensure all admin UI is removed
            setTimeout(() => { window.location.reload(); }, 500);
        }
    // Auth0 NAMESPACE removed

    
        // Auto-scroll and chord variables
        let autoScrollInterval = null;
        let isUserScrolling = false;
        const CHORDS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

        const CHORD_REGEX = /([A-G](?:#|b)?)(maj|min|m|dim|aug|sus2|sus4|7sus4|7sus2|m7|maj7|7|m9|maj9|9|m11|maj11|11|add9|add11|6|13|5|sus|7b5|7#5|7b9|7#9|b5|#5|b9|#9)?(?:\/[A-G](?:#|b)?)?/gi;
        const CHORD_LINE_REGEX = /^(\s*[A-G](?:#|b)?(?:maj|min|m|dim|aug|sus2|sus4|7sus4|7sus2|m7|maj7|7|m9|maj9|9|m11|maj11|11|add9|add11|6|13|5|sus|7b5|7#5|7b9|7#9|b5|#5|b9|#9)?(?:\/[A-G](?:#|b)?)?\s*)+$/i;
        const INLINE_CHORD_REGEX = /\[([A-G](?:#|b)?(?:maj|min|m|dim|aug|sus2|sus4|7sus4|7sus2|m7|maj7|7|m9|maj9|9|m11|maj11|11|add9|add11|6|13|5|sus|7b5|7#5|7b9|7#9|b5|#5|b9|#9)?(?:\/[A-G](?:#|b)?)?)\]/gi;
        
        let navigationHistory = [];
        let currentHistoryPosition = -1;
        let isNavigatingHistory = false;
        let isAnyModalOpen = false;
        let currentModal = null;
        let userDataSaveQueue = Promise.resolve();

        // Search history
        let searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
    
        // Initialize the application
        async function init() {
            console.time('init');
            // Ensure admin panel button is updated after all data is loaded
            if (typeof updateAdminPanelBtn === 'function') updateAdminPanelBtn();
            // Always restore JWT and user state on init
            jwtToken = localStorage.getItem('jwtToken') || '';
            if (jwtToken) {
                updateAuthButtons();
                await loadUserData();
            }
            console.time('loadSongsFromFile');
            songs = await loadSongsFromFile();
            console.timeEnd('loadSongsFromFile');
            const localSongs = JSON.parse(localStorage.getItem('songs')) || [];
            if (localSongs.length > 0) {
                const existingIds = new Set(songs.map(s => s.id));
                localSongs.forEach(song => {
                    if (!existingIds.has(song.id)) {
                        songs.push(song);
                    }
                });
            }
            console.time('loadSettings');
            loadSettings();
            console.timeEnd('loadSettings');
            console.time('addEventListeners');
            addEventListeners();
            console.timeEnd('addEventListeners');
            console.time('addPanelToggles');
            addPanelToggles();
            console.timeEnd('addPanelToggles');
            console.time('renderSongs');
            renderSongs('New', '', '');
            console.timeEnd('renderSongs');
            console.time('applyLyricsBackground');
            applyLyricsBackground(document.getElementById('NewTab').classList.contains('active'));
            console.timeEnd('applyLyricsBackground');
            console.time('connectWebSocket');
            connectWebSocket();
            console.timeEnd('connectWebSocket');
            console.time('updateSongCount');
            updateSongCount();
            console.timeEnd('updateSongCount');
            console.time('initScreenWakeLock');
            initScreenWakeLock();
            console.timeEnd('initScreenWakeLock');
            console.time('setupModalClosing');
            setupModalClosing();
            console.timeEnd('setupModalClosing');
            console.time('setupSuggestedSongsClosing');
            setupSuggestedSongsClosing();
            console.timeEnd('setupSuggestedSongsClosing');
            console.time('setupModals');
            setupModals();
            console.timeEnd('setupModals');
            console.time('setupWindowCloseConfirmation');
            setupWindowCloseConfirmation();
            console.timeEnd('setupWindowCloseConfirmation');
            // Back/forward navigation


            // Handle initial page load with hash
            if (window.location.hash) {
                const songId = parseInt(window.location.hash.replace('#song-', ''));
                const song = songs.find(s => s.id === songId);
                if (song) {
                    navigationHistory = [song.id];
                    currentHistoryPosition = 0;
                    history.replaceState({ songId: song.id, position: 0 }, '', `#song-${song.id}`);
                    showPreview(song, true);
                }
            }

            window.addEventListener('popstate', (event) => {
                if (event.state?.modalOpen) {
                    if (currentModal) closeModal(currentModal);
                    return;
                }
                if (event.state?.position !== undefined) {
                    isNavigatingHistory = true;
                    currentHistoryPosition = event.state.position;
                    const songId = navigationHistory[currentHistoryPosition];
                    const song = songs.find(s => s.id === songId);
                    if (song) {
                        showPreview(song, true);
                    } else {
                        songPreviewEl.innerHTML = '<h2>Select a song</h2><div class="song-lyrics">No song is selected</div>';
                    }
                }
            });
            console.timeEnd('init');
        }

        function queueSaveUserData() {
            // Add the save to the end of the queue
            userDataSaveQueue = userDataSaveQueue.then(() => saveUserData());
            // Save to localStorage immediately for fast reloads
            if (jwtToken && isJwtValid(jwtToken)) {
                localStorage.setItem('userData', JSON.stringify({ favorites, NewSetlist, OldSetlist }));
            }
            return userDataSaveQueue;
        }

        function setupSuggestedSongsClosing() {
            const drawer = document.getElementById('suggestedSongsDrawer');
            const toggleBtn = document.getElementById('toggleSuggestedSongs');
            
            // Click outside to close
            document.addEventListener('click', (e) => {
                if (suggestedSongsDrawerOpen && 
                    !e.target.closest('#suggestedSongsDrawer') && 
                    e.target !== toggleBtn) {
                    closeSuggestedSongsDrawer();
                }
            });
            
            // Escape key to close
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && suggestedSongsDrawerOpen) {
                    closeSuggestedSongsDrawer();
                }
            });
            
            // Ensure close button works
            document.getElementById('closeSuggestedSongs').addEventListener('click', closeSuggestedSongsDrawer);
        }
        

        function setupModalClosing() {
            document.querySelectorAll('.close-modal').forEach(button => {
                button.addEventListener('click', () => {
                    const modal = button.closest('.modal');
                    if (modal) {
                        modal.style.display = 'none';
                    }
                });
            });
            
            // Remove the outside click handler completely
        }
    
        function renderFavorites() {
            favoritesContent.innerHTML = '';
        
            if (favorites.length === 0) {
                favoritesContent.innerHTML = '<p>No favorite songs yet.</p>';
                return;
            }
        
            const favoriteSongs = songs.filter(song => favorites.includes(song.id));
            renderSongs(favoriteSongs, favoritesContent);
        }
    
        function initScreenWakeLock() {
            if ('wakeLock' in navigator) {
                keepScreenOnBtn.style.display = 'flex';
            } else {
                keepScreenOnBtn.style.display = 'none';
            }
        }


        function updateAuthButtons() {
            const isLoggedIn = !!jwtToken;
            const userGreeting = document.getElementById('userGreeting');
            if (isLoggedIn && currentUser && currentUser.username) {
                userGreeting.textContent = `Hi, ${currentUser.username}`;
                userGreeting.style.display = 'block';
            } else {
                userGreeting.textContent = '';
                userGreeting.style.display = 'none';
            }
            document.getElementById('loginBtn').style.display = isLoggedIn ? 'none' : 'block';
            document.getElementById('logoutBtn').style.display = isLoggedIn ? 'block' : 'none';
            const isAdminUser = isAdmin();
            document.getElementById('adminPanelBtn').style.display = isAdminUser ? 'block' : 'none';
            if (isAdminUser) {
                document.getElementById('deleteAllSongsBtn').style.display = 'block';
            } else {
                document.getElementById('deleteAllSongsBtn').style.display = 'none';
            }
            if (!isLoggedIn) {
                document.getElementById('deleteSection').style.display = 'none';
            }
    // --- Admin Panel Logic ---
    const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://oldandnew.onrender.com';
    async function fetchUsers() {
        const jwtToken = localStorage.getItem('jwtToken');
        const res = await fetch(`${API_BASE_URL}/api/users`, {
            headers: { 'Authorization': `Bearer ${jwtToken}` }
        });
        if (!res.ok) return [];
        return res.json();
    }
    async function markAdmin(userId) {
        const jwtToken = localStorage.getItem('jwtToken');
        const res = await fetch(`${API_BASE_URL}/api/users/${userId}/admin`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${jwtToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ isAdmin: true })
        });
        if (res.ok) {
            showAdminNotification('User marked as admin');
            loadUsers();
        } else {
            showAdminNotification('Failed to update user');
        }
    }
    function showAdminNotification(msg) {
        const n = document.getElementById('adminNotification');
        n.textContent = msg;
        n.style.display = 'block';
        setTimeout(() => n.style.display = 'none', 2000);
    }
    function renderUsers(users) {
        const tbody = document.querySelector('#usersTable tbody');
        tbody.innerHTML = '';
        users.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.username}</td>
                <td>${user.isAdmin ? '<span style=\"color:green;font-weight:bold;\">Admin</span>' : ''}</td>
                <td>
                    <button class="btn" ${user.isAdmin ? 'disabled' : ''} onclick="markAdmin('${user._id}')">Mark Admin</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
    async function loadUsers() {
        const users = await fetchUsers();
        renderUsers(users);
    }
    function showAdminPanelModal() {
        document.getElementById('adminPanelModal').style.display = 'flex';
        // Tab logic (future-proof)
        document.getElementById('userMgmtTab').classList.add('active');
        document.getElementById('userMgmtTabContent').style.display = '';
        loadUsers();
        window.markAdmin = markAdmin;
    }
    // Tab switching (future-proof, only one tab for now)
    document.getElementById('userMgmtTab').onclick = function() {
        document.getElementById('userMgmtTab').classList.add('active');
        document.getElementById('userMgmtTabContent').style.display = '';
    };
        }
        // window.addEventListener('DOMContentLoaded', updateAuthButtons);

        async function authFetch(url, options = {}) {
            options.headers = options.headers || {};
            if (jwtToken) {
                options.headers['Authorization'] = `Bearer ${jwtToken}`;
            }
            return fetch(url, options);
        }
    
        async function toggleScreenWakeLock() {
            if (!('wakeLock' in navigator)) return;
            
            if (!keepScreenOn) {
                try {
                    const wakeLock = await navigator.wakeLock.request('screen');
                    keepScreenOn = true;
                    keepScreenOnBtn.classList.add('active');
                    showNotification('Screen will stay on');
                } catch (err) {
                    console.error('Error enabling wake lock:', err);
                    showNotification('Failed to keep screen on');
                }
            } else {
                keepScreenOn = false;
                keepScreenOnBtn.classList.remove('active');
                showNotification('Screen may sleep');
            }
        }
    
        function showNotification(message, duration = 3000) {
            notificationEl.textContent = message;
            notificationEl.classList.add('show');
            
            setTimeout(() => {
                notificationEl.classList.remove('show');
            }, duration);
        }
    

        function loadSettings() {
            const showSetlistEl = document.getElementById('showSetlist');
            const savedHeader = localStorage.getItem("sidebarHeader");
            if (savedHeader) document.querySelector(".sidebar-header h2").textContent = savedHeader;

            const savedSetlistLabel = localStorage.getItem("setlistText");
            if (savedSetlistLabel && showSetlistEl) showSetlistEl.textContent = savedSetlistLabel;

            const sessionResetOption = localStorage.getItem("sessionResetOption") || "manual";

            const sidebarWidth = localStorage.getItem("sidebarWidth") || "15";
            const songsPanelWidth = localStorage.getItem("songsPanelWidth") || "20";
            const previewMargin = localStorage.getItem("previewMargin") || "40";
            const savedAutoScrollSpeed = localStorage.getItem("autoScrollSpeed") || "1500";

            document.documentElement.style.setProperty('--sidebar-width', `${sidebarWidth}%`);
            document.documentElement.style.setProperty('--songs-panel-width', `${songsPanelWidth}%`);
            document.documentElement.style.setProperty('--preview-margin-left', `${previewMargin}px`);

            document.getElementById('sidebarWidthInput').value = sidebarWidth;
            document.getElementById('songsPanelWidthInput').value = songsPanelWidth;
            document.getElementById('previewMarginInput').value = previewMargin;
            document.getElementById('autoScrollSpeedInput').value = savedAutoScrollSpeed;
            document.getElementById("sessionResetOption").value = sessionResetOption;
            
            autoScrollSpeed = parseInt(savedAutoScrollSpeed);
        }
    
        function saveSettings() {
            const newHeader = document.getElementById("sidebarHeaderInput").value;
            const newSetlist = document.getElementById("setlistTextInput").value;
            const sidebarWidth = document.getElementById("sidebarWidthInput").value;
            const songsPanelWidth = document.getElementById("songsPanelWidthInput").value;
            const previewMargin = document.getElementById("previewMarginInput").value;
            const newAutoScrollSpeed = document.getElementById("autoScrollSpeedInput").value;
            const sessionResetOption = document.getElementById("sessionResetOption").value;

    
            document.querySelector(".sidebar-header h2").textContent = newHeader;
            if (showSetlistEl) showSetlistEl.textContent = newSetlist;

            document.documentElement.style.setProperty('--sidebar-width', `${sidebarWidth}%`);
            document.documentElement.style.setProperty('--songs-panel-width', `${songsPanelWidth}%`);
            document.documentElement.style.setProperty('--preview-margin-left', `${previewMargin}px`);

            localStorage.setItem("sidebarHeader", newHeader);
            localStorage.setItem("setlistText", newSetlist);
            localStorage.setItem("sidebarWidth", sidebarWidth);
            localStorage.setItem("songsPanelWidth", songsPanelWidth);
            localStorage.setItem("previewMargin", previewMargin);
            localStorage.setItem("autoScrollSpeed", newAutoScrollSpeed);
            localStorage.setItem("sessionResetOption", sessionResetOption);
            autoScrollSpeed = parseInt(newAutoScrollSpeed);
        }
    
        function applyLyricsBackground(isNew) {
            const lyricsContainer = document.querySelector(".song-lyrics");
            if (!lyricsContainer) return;
            lyricsContainer.classList.remove("lyrics-bg-New", "lyrics-bg-Old");
            lyricsContainer.classList.add(isNew ? "lyrics-bg-New" : "lyrics-bg-Old");
        }
    
        function addPanelToggles() {
            const sidebar = document.querySelector('.sidebar');
            const songsSection = document.querySelector('.songs-section');
            const previewSection = document.querySelector('.preview-section');
    
            if (!sidebar || !songsSection || !previewSection || !toggleSidebarBtn || !toggleSongsBtn || !toggleAllPanelsBtn) {
                console.error('One or more elements not found for panel toggles');
                return;
            }
    
            toggleSidebarBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                sidebar.classList.toggle('hidden');
                if (window.innerWidth <= 768) {
                    if (!sidebar.classList.contains('hidden')) {
                        songsSection.classList.add('hidden');
                    }
                }
                updatePositions();
            });
    
            toggleSongsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                songsSection.classList.toggle('hidden');
                if (window.innerWidth <= 768) {
                    if (!songsSection.classList.contains('hidden')) {
                        sidebar.classList.add('hidden');
                    }
                }
                updatePositions();
            });
    
            toggleAllPanelsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const areBothHidden = sidebar.classList.contains('hidden') && songsSection.classList.contains('hidden');
                sidebar.classList.toggle('hidden', !areBothHidden);
                songsSection.classList.toggle('hidden', !areBothHidden);
                toggleAllPanelsBtn.querySelector('i').className = areBothHidden ? 'fas fa-eye-slash' : 'fas fa-eye';
                updatePositions();
            });
    
            document.addEventListener('click', (e) => {
                if (window.innerWidth <= 768 &&
                    !e.target.closest('.sidebar') &&
                    !e.target.closest('.songs-section') &&
                    !e.target.closest('.panel-toggle') &&
                    !e.target.closest('.modal')) {
                    sidebar.classList.add('hidden');
                    songsSection.classList.add('hidden');
                    toggleAllPanelsBtn.querySelector('i').className = 'fas fa-eye';
                    updatePositions();
                }
            });
    
            if (window.innerWidth > 768) {
                sidebar.classList.remove('hidden');
                songsSection.classList.remove('hidden');
            } else {
                sidebar.classList.add('hidden');
                songsSection.classList.add('hidden');
            }
            updatePositions();
    
            window.addEventListener('resize', updatePositions);
        }
    
        function updatePositions() {
            if (window.innerWidth > 768) {
                if (document.querySelector('.sidebar').classList.contains('hidden')) {
                    document.querySelector('.songs-section').style.left = '0';
                    document.querySelector('.preview-section').style.marginLeft =
                        document.querySelector('.songs-section').classList.contains('hidden') ?
                        'var(--preview-margin-left)' :
                        'calc(var(--songs-panel-width) + var(--preview-margin-left))';
                } else {
                    document.querySelector('.songs-section').style.left = 'var(--sidebar-width)';
                    document.querySelector('.preview-section').style.marginLeft =
                        document.querySelector('.songs-section').classList.contains('hidden') ?
                        'calc(var(--sidebar-width) + var(--preview-margin-left))' :
                        'calc(var(--sidebar-width) + var(--songs-panel-width) + var(--preview-margin-left))';
                }
            } else {
                document.querySelector('.songs-section').style.left = '0';
                document.querySelector('.preview-section').style.marginLeft = '0';
                document.querySelector('.preview-section').classList.add('full-width');
            }
        }
    
        function saveSongs(toFile = false) {
            if (toFile) {
                try {
                    const data = {
                        songs: songs,
                        NewSetlist: NewSetlist,
                        OldSetlist: OldSetlist
                    };
                    console.warn('File saving requires server-side support');
                } catch (err) {
                    console.error('Error saving to file:', err);
                }
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({
                        type: 'update',
                        songs: songs,
                        NewSetlist: NewSetlist,
                        OldSetlist: OldSetlist
                    }));
                }
            }
    
            localStorage.setItem('songs', JSON.stringify(songs));
            const embedded = document.getElementById('embeddedSongs');
            if (embedded) {
                embedded.textContent = JSON.stringify(songs, null, 2);
            }
        }

        // Add this function
        function optimizeMemoryUsage() {
            // Clean up large data structures when not needed
            if (songs.length > 500) {
                songs = songs.slice(0, 500);
                saveSongs();
            }
            
            if (searchHistory.length > 50) {
                searchHistory = searchHistory.slice(0, 50);
                localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
            }
            
            // Force garbage collection (works in most modern browsers)
            if (window.gc) {
                window.gc();
            } else if (window.CollectGarbage) {
                window.CollectGarbage();
            } else {
                try {
                    if (window.performance && window.performance.memory) {
                        console.log("Memory usage:", 
                            (window.performance.memory.usedJSHeapSize / 1048576).toFixed(2), "MB");
                    }
                } catch(e) {}
            }
        }

        // Call periodically (every 5 minutes)
        setInterval(optimizeMemoryUsage, 300000);
    

        async function loadSetlists() {
            console.time('loadSetlists');
            const response = await authFetch(`${API_BASE_URL}/api/userdata`);
            if (response.ok) {
                const data = await response.json();
                favorites = data.favorites || [];
                NewSetlist = data.NewSetlist || [];
                OldSetlist = data.OldSetlist || [];
            }
            console.timeEnd('loadSetlists');
        }
    

        async function loadUserData() {
            console.time('loadUserData');
            // Only use cache if JWT is valid
            if (jwtToken && isJwtValid(jwtToken)) {
                const cachedUserData = localStorage.getItem('userData');
                if (cachedUserData) {
                    try {
                        const data = JSON.parse(cachedUserData);
                        favorites = data.favorites || [];
                        NewSetlist = data.NewSetlist || [];
                        OldSetlist = data.OldSetlist || [];
                        // Optionally set other user fields
                        console.log('Loaded user data from cache');
                        console.timeEnd('loadUserData');
                        return;
                    } catch (e) {
                        // If cache is corrupted, ignore and fetch from backend
                    }
                }
            }
            // If not cached or token expired, fetch from backend
            try {
                const response = await authFetch(`${API_BASE_URL}/api/userdata`);
                if (response.ok) {
                    const data = await response.json();
                    favorites = data.favorites || [];
                    NewSetlist = data.NewSetlist || [];
                    OldSetlist = data.OldSetlist || [];
                    // Optionally set other user fields
                    localStorage.setItem('userData', JSON.stringify(data));
                }
            } catch (err) {
                console.error('Network error in loadUserData:', err);
            }
            console.timeEnd('loadUserData');
        }

        async function saveUserData() {
            try {
                const response = await authFetch(`${API_BASE_URL}/api/userdata`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        favorites,
                        NewSetlist,
                        OldSetlist
                    })
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('API error in saveUserData:', response.status, errorText);
                    showNotification('Failed to save user data');
                    return false;
                }
                // Optionally check response for success
                const data = await response.json();
                if (data && data.message === 'User data updated') {
                    // Success!
                    return true;
                } else {
                    console.error('Unexpected response in saveUserData:', data);
                    showNotification('Failed to save user data');
                    return false;
                }
            } catch (err) {
                console.error('Network error in saveUserData:', err);
                showNotification('Error saving user data');
                return false;
            }
        }

        // queueSaveUserData().then(success => {
        //     if (success) {
        //         showNotification('Favorites saved!');
        //     } else {
        //         showNotification('Failed to save favorites.');
        //     }
        // });
    
        function downloadSongs() {
            const data = {
                songs: songs,
                NewSetlist: NewSetlist,
                OldSetlist: OldSetlist,
                favorites: favorites
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Old-songs.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    
        function handleFileUpload(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function (e) {
                try {
                    const data = JSON.parse(e.target.result);
                    if (data.songs && Array.isArray(data.songs)) {
                        songs = data.songs;
                        NewSetlist = data.NewSetlist || [];
                        OldSetlist = data.OldSetlist || [];
                        favorites = data.favorites || [];
                        saveSongs();
                        queueSaveUserData();
                        
                        if (NewTab.classList.contains('active')) {
                            renderSongs('New', keyFilter.value, genreFilter.value);
                        } else {
                            renderSongs('Old', keyFilter.value, genreFilter.value);
                        }
                        showNotification('Songs loaded successfully!');
                    } else {
                        throw new Error('Invalid file format');
                    }
                } catch (err) {
                    showNotification('Could not load file: ' + err.message);
                }
            };
            reader.onerror = function () {
                showNotification('Error reading file');
            };
            reader.readAsText(file);
        }
    
        function handleMergeUpload(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function (e) {
                try {
                    const data = JSON.parse(e.target.result);
                    if (data.songs && Array.isArray(data.songs)) {
                        const existingIds = new Set(songs.map(s => s.id));
                        const newSongs = data.songs.filter(song => !existingIds.has(song.id));
                        const nextId = Math.max(0, ...songs.map(s => s.id)) + 1;
    
                        newSongs.forEach((song, index) => {
                            song.id = nextId + index;
                        });
    
                        songs = [...songs, ...newSongs];
                        saveSongs();
    
                        showNotification(`${newSongs.length} new songs merged successfully.`);
                        if (NewTab.classList.contains('active')) {
                            renderSongs('New', keyFilter.value, genreFilter.value);
                        } else {
                            renderSongs('Old', keyFilter.value, genreFilter.value);
                        }
                    } else {
                        throw new Error('Invalid file format');
                    }
                } catch (err) {
                    showNotification('Could not merge file: ' + err.message);
                }
            };
            reader.readAsText(file);
        }
    
        function isDuplicateSong(title, lyrics, currentId = null) {
            return songs.some(song => {
                if (currentId && song.id === currentId) return false;
                return song.title.toLowerCase() === title.toLowerCase() && 
                       song.lyrics.toLowerCase() === lyrics.toLowerCase();
            });
        }
    
        function saveSearchQuery(query) {
            if (!query.trim()) return;
    
            searchHistory = searchHistory.filter(item => item.toLowerCase() !== query.toLowerCase());
            searchHistory.unshift(query);
    
            if (searchHistory.length > 10) {
                searchHistory = searchHistory.slice(0, 10);
            }
    
            localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
        }
    
        function showSearchHistory() {
            const dropdown = document.getElementById('searchHistoryDropdown');
            dropdown.innerHTML = '';

            if (searchHistory.length === 0) {
                dropdown.style.display = 'none';
                return;
            }

            const header = document.createElement('div');
            header.className = 'search-history-header';
            header.textContent = 'Recent Searches';
            dropdown.appendChild(header);

            // Add clear history button
            const clearBtn = document.createElement('div');
            clearBtn.className = 'search-history-item';
            clearBtn.style.fontWeight = 'bold';
            clearBtn.style.cursor = 'pointer';
            clearBtn.textContent = 'Clear History';
            clearBtn.addEventListener('click', () => {
                searchHistory = [];
                localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
                dropdown.style.display = 'none';
            });
            dropdown.appendChild(clearBtn);

            searchHistory.forEach(query => {
                const item = document.createElement('div');
                item.className = 'search-history-item';
                item.textContent = query;

                item.addEventListener('click', () => {
                    document.getElementById('searchInput').value = query;
                    dropdown.style.display = 'none';
                    const event = new Event('input', { bubbles: true });
                    document.getElementById('searchInput').dispatchEvent(event);
                });

                dropdown.appendChild(item);
            });

            dropdown.style.display = 'block';
        }
    
        function highlightText(text, query) {
            if (!query) return text;
    
            const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            return text.replace(regex, match => `<span class="highlight">${match}</span>`);
        }
    
        function renderSongs(categoryOrSongs, filterOrContainer, genreFilterValue) {
            let songsToRender;
            let container;
            if (typeof categoryOrSongs === 'string') {
                const category = categoryOrSongs;
                const keyFilterValue = filterOrContainer;
                songsToRender = songs
                    .filter(song => song.category === category)
                    .filter(song => keyFilterValue === "" || song.key === keyFilterValue)
                    .filter(song => {
                        if (!genreFilterValue) return true;
                        if (!song.genres) return song.genre === genreFilterValue;
                        return song.genres.includes(genreFilterValue);
                    });
                // Sorting logic
                const sortValue = document.getElementById('sortFilter')?.value || 'recent';
                if (sortValue === 'az') {
                    songsToRender.sort((a, b) => a.title.localeCompare(b.title));
                } else if (sortValue === 'za') {
                    songsToRender.sort((a, b) => b.title.localeCompare(a.title));
                } else if (sortValue === 'oldest') {
                    songsToRender.sort((a, b) => {
                        if (a.createdAt && b.createdAt) return new Date(a.createdAt) - new Date(b.createdAt);
                        return (a.id || 0) - (b.id || 0);
                    });
                } else {
                    // Default: recently added (by createdAt desc, fallback to id desc)
                    songsToRender.sort((a, b) => {
                        if (a.createdAt && b.createdAt) return new Date(b.createdAt) - new Date(a.createdAt);
                        return (b.id || 0) - (a.id || 0);
                    });
                }
                container = category === 'New' ? NewContent : OldContent;
            } else {
                songsToRender = categoryOrSongs;
                container = filterOrContainer;
            }
// Add event listener for sort filter after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const sortFilter = document.getElementById('sortFilter');
    if (sortFilter) {
        sortFilter.addEventListener('change', function() {
            const activeTab = document.getElementById('NewTab').classList.contains('active') ? 'New' : 'Old';
            renderSongs(activeTab, keyFilter.value, genreFilter.value);
        });
    }
});
            container.innerHTML = '';
            if (songsToRender.length === 0) {
                container.innerHTML = '<p>No songs found.</p>';
                return;
            }
            songsToRender.forEach(song => {
                const div = document.createElement('div');
                div.className = 'song-item';
                div.dataset.songId = song.id;
                
                const isInSetlist = song.category === 'New' 
                    ? NewSetlist.some(s => s.id === song.id)
                    : OldSetlist.some(s => s.id === song.id);
                    
                const isFavorite = favorites.includes(song.id);
                
                const displayGenres = song.genres ? song.genres.join(', ') : song.genre || '';
                
                div.innerHTML = `
                <div class="song-header">
                    <span class="song-title">${song.title}</span>
                    <button class="favorite-btn ${isFavorite ? 'favorited' : ''}" data-song-id="${song.id}">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
                <div class="song-meta">${song.key} | ${song.tempo} | ${song.time} | ${song.taal || ''} | ${displayGenres}</div>
                <div class="song-actions">
                    <button class="btn ${isInSetlist ? 'btn-delete' : 'btn-primary'} toggle-setlist">
                        ${isInSetlist ? 'Remove' : 'Add'}
                    </button>
                    <button class="btn btn-edit edit-song">Edit</button>
                    <button class="btn btn-delete delete-song" style="display:none;">Delete</button>
                </div>
            `;
               
                div.querySelector('.favorite-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleFavorite(song.id);
                });
                
                div.querySelector('.toggle-setlist').addEventListener('click', (e) => {
                    e.stopPropagation();
                    const songId = parseInt(div.dataset.songId);
                    const song = songs.find(s => s.id === songId);
                    if (!song) return;
                    
                    const isInSetlist = song.category === 'New' 
                        ? NewSetlist.some(s => s.id === songId)
                        : OldSetlist.some(s => s.id === songId);
                    
                    if (isInSetlist) {
                        removeFromSetlist(songId, song.category);
                    } else {
                        addToSetlist(songId);
                    }
                });
                
                div.querySelector('.edit-song').addEventListener('click', (e) => {
                    e.stopPropagation();
                    editSong(song.id);
                });

                // Show delete button only for admins
                const deleteBtn = div.querySelector('.delete-song');
                if (isAdmin()) {
                    deleteBtn.style.display = '';
                    deleteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        openDeleteSongModal(song.id);
                    });
                }
                
                div.addEventListener('click', () => {
                    showPreview(song);
                    if (window.innerWidth <= 768) {
                        document.querySelector('.songs-section').classList.add('hidden');
                        document.querySelector('.sidebar').classList.add('hidden');
                        document.querySelector('.preview-section').classList.add('full-width');
                    }
                });
                container.appendChild(div);
            });
        }

        function resetApplicationState() {
            // Clear all data from memory
            songs = [];
            NewSetlist = [];
            OldSetlist = [];
            favorites = [];
            searchHistory = [];
            navigationHistory = [];
            currentHistoryPosition = -1;
            
            // Clear all local storage
            localStorage.removeItem('songs');
            localStorage.removeItem('NewSetlist');
            localStorage.removeItem('OldSetlist');
            localStorage.removeItem('favorites');
            localStorage.removeItem('searchHistory');
            localStorage.removeItem('darkMode');
            localStorage.removeItem('sidebarHeader');
            localStorage.removeItem('setlistText');
            localStorage.removeItem('sidebarWidth');
            localStorage.removeItem('songsPanelWidth');
            localStorage.removeItem('previewMargin');
            localStorage.removeItem('autoScrollSpeed');
            localStorage.removeItem('sessionResetOption');
            localStorage.removeItem('memoryOptimization');
            
            // Reset UI
            songPreviewEl.innerHTML = '<h2>Select a song</h2><div class="song-lyrics">No song is selected</div>';
            NewContent.innerHTML = '<p>No songs found.</p>';
            OldContent.innerHTML = '<p>No songs found.</p>';
            NewSetlistSongs.innerHTML = '<p>Your New setlist is empty.</p>';
            OldSetlistSongs.innerHTML = '<p>Your Old setlist is empty.</p>';
            deleteContent.innerHTML = '<p>No songs available to delete.</p>';
            favoritesContent.innerHTML = '<p>No favorite songs yet.</p>';
            
            // Reset filters and search
            searchInput.value = '';
            clearSearchBtn.style.display = 'none';
            document.getElementById('searchResults').classList.remove('active');
            keyFilter.value = '';
            genreFilter.value = '';
            
            // Reset counters
            document.getElementById('totalSongs').textContent = '0';
            document.getElementById('NewCount').textContent = '0';
            document.getElementById('OldCount').textContent = '0';
            
            // Reset theme to light mode if it was dark
            if (document.body.classList.contains('dark-mode')) {
                document.body.classList.remove('dark-mode');
                document.getElementById('themeToggle').innerHTML = '<i class="fas fa-moon"></i><span>Dark Mode</span>';
                localStorage.setItem('darkMode', 'false');
            }
            
            // Show default view
            NewTab.click();
            showAllEl.click();
            
            showNotification('Application has been reset to initial state');
            
            // Reload the page to ensure complete reset
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        }
    
        function getSuggestedSongs(currentSongId) {
            const currentSong = songs.find(song => song.id === parseInt(currentSongId));
            if (!currentSong) return [];

            // Filter songs from the same category only
            const sameCategorySongs = songs.filter(song => 
                song.id !== parseInt(currentSongId) && 
                song.category === currentSong.category
            );

            // Define known language tags
            const LANGUAGE_TAGS = ['English', 'Marathi', 'Spanish', 'Hindi', 'French', 'Tamil', 'Telugu', 'Punjabi', 'Bengali'];

            // Use global/configurable WEIGHTS

            // Time signature compatible pairs
            const TIME_SIGNATURE_COMPATIBILITY = {
                '6/8': ['3/4'],
                '3/4': ['6/8']
            };

            // Harmonic relationships (Circle of Fifths + Relative Major/Minor)
            const HARMONIC_RELATIONS = {
                // Major keys: [dominant, subdominant, relative minor]
                'C': ['G', 'F', 'Am'],
                'G': ['D', 'C', 'Em'],
                'D': ['A', 'G', 'F#m'],
                'A': ['E', 'D', 'C#m'],
                'E': ['B', 'A', 'G#m'],
                'B': ['F#', 'E', 'G#m'],
                'F#': ['C#', 'B', 'D#m'],
                'C#': ['G#', 'F#', 'A#m'],
                'F': ['C', 'Bb', 'Dm'],
                'Bb': ['F', 'Eb', 'Gm'],
                'Eb': ['Bb', 'Ab', 'Cm'],
                'Ab': ['Eb', 'Db', 'Fm'],
                'Db': ['Ab', 'Gb', 'Bbm'],
                'Gb': ['Db', 'Cb', 'Ebm'],
                
                // Minor keys: [dominant, subdominant, relative major]
                'Am': ['Em', 'Dm', 'C'],
                'Em': ['Bm', 'Am', 'G'],
                'Bm': ['F#m', 'Em', 'D'],
                'F#m': ['C#m', 'Bm', 'A'],
                'C#m': ['G#m', 'F#m', 'E'],
                'G#m': ['D#m', 'C#m', 'B'],
                'D#m': ['A#m', 'G#m', 'F#'],
                'A#m': ['Fm', 'D#m', 'C#'],
                'Dm': ['Am', 'Gm', 'F'],
                'Gm': ['Dm', 'Cm', 'Bb'],
                'Cm': ['Gm', 'Fm', 'Eb'],
                'Fm': ['Cm', 'Bbm', 'Ab'],
                'Bbm': ['Fm', 'Ebm', 'Db']
            };

            // Determine current song's scale type
            const isCurrentMajor = currentSong.key && !currentSong.key.endsWith('m');
            const isCurrentMinor = currentSong.key && currentSong.key.endsWith('m');

            // Helper functions
            const isMajor = key => key && !key.endsWith('m');
            const isMinor = key => key && key.endsWith('m');
            const isSameScaleType = (key1, key2) => (isMajor(key1) && isMajor(key2)) || (isMinor(key1) && isMinor(key2));

            const getTempoSimilarity = (tempo1, tempo2) => {
                if (!tempo1 || !tempo2) return 0;
                const bpm1 = parseInt(tempo1) || 0;
                const bpm2 = parseInt(tempo2) || 0;
                return bpm1 && bpm2 ? Math.max(0, 1 - (Math.abs(bpm1 - bpm2) / 50)) : 0;
            };

            const getLanguagesFromGenres = genres => 
                genres ? genres.filter(genre => LANGUAGE_TAGS.includes(genre)) : [];
            
            const getNonLanguageGenres = genres => 
                genres ? genres.filter(genre => !LANGUAGE_TAGS.includes(genre)) : [];

            const getLanguageMatchScore = (genres1, genres2) => {
                const langs1 = getLanguagesFromGenres(genres1);
                const langs2 = getLanguagesFromGenres(genres2);
                return langs1.length && langs2.length ? 
                    langs1.filter(lang => langs2.includes(lang)).length / Math.max(langs1.length, langs2.length) : 0;
            };

            const getGenreMatchScore = (genres1, genres2) => {
                const genresA = getNonLanguageGenres(genres1);
                const genresB = getNonLanguageGenres(genres2);
                return genresA.length && genresB.length ? 
                    genresA.filter(g => genresB.includes(g)).length / Math.max(genresA.length, genresB.length) : 0;
            };

            // Score each song
            const scoredSongs = sameCategorySongs.map(song => {
                const details = {
                    sameScaleType: isSameScaleType(currentSong.key, song.key),
                    scalePriority: 0,
                    languageScore: 0,
                    languages: [],
                    timeMatchType: 'none', // 'exact', 'compatible', or 'none'
                    taalMatch: false,
                    tempoSimilarity: 0,
                    genreMatch: 0
                };

                let score = 0;

                // 1. Language match
                details.languageScore = getLanguageMatchScore(
                    currentSong.genres || (currentSong.genre ? [currentSong.genre] : []),
                    song.genres || (song.genre ? [song.genre] : [])
                );
                score += WEIGHTS.language * details.languageScore;
                details.languages = getLanguagesFromGenres(song.genres || (song.genre ? [song.genre] : []));

                // 2. Scale relationships
                if (currentSong.key && song.key) {
                    if (currentSong.key === song.key) {
                        score += WEIGHTS.scale;
                        details.scalePriority = 4;
                    } 
                    else if ((isCurrentMajor && song.key === HARMONIC_RELATIONS[currentSong.key]?.[2]) ||
                            (isCurrentMinor && currentSong.key === HARMONIC_RELATIONS[song.key]?.[2])) {
                        score += WEIGHTS.scale * 0.9;
                        details.scalePriority = 3;
                    }
                    else if (HARMONIC_RELATIONS[currentSong.key]?.includes(song.key)) {
                        score += WEIGHTS.scale * 0.8;
                        details.scalePriority = 2;
                    }
                    else if (details.sameScaleType) {
                        score += WEIGHTS.scale * 0.5;
                        details.scalePriority = 1;
                    }
                }

                // 3. Time signature matching
                if (currentSong.time === song.time) {
                    details.timeMatchType = 'exact';
                    score += WEIGHTS.timeSignature;
                } 
                else if (TIME_SIGNATURE_COMPATIBILITY[currentSong.time]?.includes(song.time)) {
                    details.timeMatchType = 'compatible';
                    score += WEIGHTS.timeSignature * 0.9;
                }

                // 4. Taal match
                details.taalMatch = currentSong.taal === song.taal;
                if (details.taalMatch) score += WEIGHTS.taal;

                // 5. Tempo similarity
                details.tempoSimilarity = getTempoSimilarity(currentSong.tempo, song.tempo);
                score += WEIGHTS.tempo * details.tempoSimilarity;

                // 6. Non-language genres
                details.genreMatch = getGenreMatchScore(
                    currentSong.genres || (currentSong.genre ? [currentSong.genre] : []),
                    song.genres || (song.genre ? [song.genre] : [])
                );
                score += WEIGHTS.genre * details.genreMatch;

                return {
                    ...song,
                    matchScore: Math.min(Math.round(score), 100),
                    matchDetails: {
                        ...details,
                        languageScore: Math.round(details.languageScore * 100),
                        tempoSimilarity: Math.round(details.tempoSimilarity * 100),
                        genreMatch: Math.round(details.genreMatch * 100)
                    }
                };
            });

            // Sort by priority
            return scoredSongs.sort((a, b) => {
                // 1. Same scale type (major/minor)
                if (a.matchDetails.sameScaleType !== b.matchDetails.sameScaleType) {
                    return b.matchDetails.sameScaleType - a.matchDetails.sameScaleType;
                }
                
                // 2. Time signature (exact > compatible > none)
                const timePriority = {
                    'exact': 2,
                    'compatible': 1,
                    'none': 0
                };
                const aTimePrio = timePriority[a.matchDetails.timeMatchType];
                const bTimePrio = timePriority[b.matchDetails.timeMatchType];
                if (aTimePrio !== bTimePrio) {
                    return bTimePrio - aTimePrio;
                }
                
                // 3. Language match
                if (a.matchDetails.languageScore !== b.matchDetails.languageScore) {
                    return b.matchDetails.languageScore - a.matchDetails.languageScore;
                }
                
                // 4. Taal match
                if (a.matchDetails.taalMatch !== b.matchDetails.taalMatch) {
                    return b.matchDetails.taalMatch - a.matchDetails.taalMatch;
                }
                
                // 5. Scale relationship quality
                if (a.matchDetails.scalePriority !== b.matchDetails.scalePriority) {
                    return b.matchDetails.scalePriority - a.matchDetails.scalePriority;
                }
                
                // 6. Tempo similarity
                if (a.matchDetails.tempoSimilarity !== b.matchDetails.tempoSimilarity) {
                    return b.matchDetails.tempoSimilarity - a.matchDetails.tempoSimilarity;
                }
                
                // 7. Total score
                return b.matchScore - a.matchScore;
            }).slice(0, 20);
        }      
    
        function showSuggestedSongs() {
            const currentSongId = songPreviewEl.dataset.songId;
            if (!currentSongId) return;

            const suggestedSongs = getSuggestedSongs(currentSongId);
            const suggestedSongsContent = document.getElementById('suggestedSongsContent');
            suggestedSongsContent.innerHTML = '';

            if (suggestedSongs.length === 0) {
                suggestedSongsContent.innerHTML = '<p>No suggested songs found</p>';
                return;
            }

            suggestedSongs.forEach(song => {
                const div = document.createElement('div');
                div.className = 'suggested-song-item';
                div.innerHTML = `
                    <div class="suggested-song-title">${song.title}</div>
                    <div class="suggested-song-meta">
                        Key: ${song.key} | Tempo: ${song.tempo} | Time: ${song.time} | Taal: ${song.taal}
                        ${song.genres ? `<br>Genres: ${song.genres.join(', ')}` : 
                        song.genre ? `<br>Genre: ${song.genre}` : ''}
                    </div>
                    <div class="suggested-song-match">Match Score: ${song.matchScore}%</div>
                `;
                // <div class="suggested-song-meta">
                //         Language Match: ${song.languageScore}% |
                //         ${song.scaleMatch ? '✓ Same Scale' : '✗ Different Scale'} |
                //         ${song.timeMatch ? '✓ Same Time Signature' : '✗ Different Time Signature'} |
                //         ${song.taalMatch ? '✓ Same Taal' : '✗ Different Taal'} |
                //         Tempo Match: ${song.tempoSimilarity}% |
                //         Genre Match: ${song.genreMatch}%
                //     </div>
                div.addEventListener('click', () => {
                    showPreview(song);
                    closeSuggestedSongsDrawer();
                });
                suggestedSongsContent.appendChild(div);
            });
        }
    
        function toggleSuggestedSongsDrawer() {
            const drawer = document.getElementById('suggestedSongsDrawer');
            const toggleBtn = document.getElementById('toggleSuggestedSongs');
            
            if (suggestedSongsDrawerOpen) {
                drawer.classList.remove('open');
                toggleBtn.style.right = '20px';
            } else {
                showSuggestedSongs();
                drawer.classList.add('open');
                toggleBtn.style.right = '370px';
            }
            
            suggestedSongsDrawerOpen = !suggestedSongsDrawerOpen;
        }
    
        function closeSuggestedSongsDrawer() {
            const drawer = document.getElementById('suggestedSongsDrawer');
            const toggleBtn = document.getElementById('toggleSuggestedSongs');
            
            drawer.classList.remove('open');
            toggleBtn.style.right = '20px';
            suggestedSongsDrawerOpen = false;
        }
    
        function renderDeleteSongs() {
            deleteContent.innerHTML = '';
            if (songs.length === 0) {
                deleteContent.innerHTML = '<p>No songs available to delete.</p>';
                return;
            }
            songs
                .sort((a, b) => a.title.localeCompare(b.title))
                .forEach(song => {
                    const div = document.createElement('div');
                    div.className = 'song-item';
                    div.innerHTML = `
                        <div class="song-title">${song.title}</div>
                        <div class="song-meta">${song.key} | ${song.tempo} | ${song.time} | ${song.genre} | ${song.category}</div>
                        <div class="song-actions">
                            <button class="btn btn-delete delete-song">Delete</button>
                        </div>
                    `;
                    div.querySelector('.delete-song').addEventListener('click', (e) => {
                        e.stopPropagation();
                        openDeleteSongModal(song.id);
                    });
                    div.addEventListener('click', () => {
                        showPreview(song);
                    });
                    deleteContent.appendChild(div);
                });
        }

        function isAdmin() {
            if (!jwtToken) return false;
            try {
                const payload = JSON.parse(atob(jwtToken.split('.')[1]));
                // Accept both boolean true and string 'true' for isAdmin
                return payload && (payload.isAdmin === true || payload.isAdmin === 'true');
            } catch {
                return false;
            }
        }
    
        function renderSetlist(category) {
            const container = category === 'New' ? NewSetlistSongs : OldSetlistSongs;
            const setlist = category === 'New' ? NewSetlist : OldSetlist;
            container.innerHTML = '';
            if (setlist.length === 0) {
                container.innerHTML = '<p>Your ' + category + ' setlist is empty.</p>';
                return;
            }
    
            const ul = document.createElement('ul');
            ul.className = 'setlist-sortable';
            ul.style.listStyle = 'none';
            ul.style.padding = '0';
    
            setlist.forEach((song, index) => {
                const li = document.createElement('li');
                li.style.display = 'flex';
                li.style.justifyContent = 'space-between';
                li.style.alignItems = 'center';
                li.style.padding = '10px';
                li.style.marginBottom = '8px';
                li.style.background = '#f5f7fa';
                li.style.borderRadius = '5px';
                li.setAttribute('draggable', 'true');
                li.dataset.songId = song.id;
    
                li.innerHTML = `
                    <span><span class="setlist-index">${index + 1}.</span> ${song.title} (${song.key} | ${song.genre})</span>
                    <div class="song-actions">
                        <button class="btn btn-delete" onclick="removeFromSetlist(${song.id}, '${song.category}')">Remove</button>
                    </div>
                `;
    
                li.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('btn')) {
                        showPreview(song);
                    }
                });
    
                ul.appendChild(li);
            });
    
            container.appendChild(ul);
            enableDrag(container, category);
        }
    
        function enableDrag(container, category) {
            let draggedItem = null;
    
            container.querySelectorAll("li").forEach(item => {
                item.addEventListener("dragstart", e => {
                    draggedItem = item;
                    setTimeout(() => item.style.display = "none", 0);
                });
    
                item.addEventListener("dragend", () => {
                    item.style.display = "flex";
                    draggedItem = null;
                    updateSetlistOrder(container, category);
                });
    
                item.addEventListener("dragover", e => {
                    e.preventDefault();
                    const bounding = item.getBoundingClientRect();
                    const offset = e.clientY - bounding.top + (bounding.height / 2);
                    if (offset > bounding.height / 2) {
                        item.parentNode.insertBefore(draggedItem, item.nextSibling);
                    } else {
                        item.parentNode.insertBefore(draggedItem, item);
                    }
                });
            });
        }
    
        function updateSetlistOrder(container, category) {
            const ids = Array.from(container.querySelectorAll("li")).map(li => parseInt(li.dataset.songId));
            const fullList = category === 'New' ? NewSetlist : OldSetlist;
            const newList = ids.map(id => fullList.find(song => song.id === id));
    
            if (category === 'New') {
                NewSetlist = newList;
            } else {
                OldSetlist = newList;
            }
    
            queueSaveUserData();
            
            renderSetlist(category);
        }

        function attachPreviewEventListeners(song) {
            // Favorite button
            document.getElementById('previewFavoriteBtn')?.addEventListener('click', () => {
                toggleFavorite(song.id);
                // Update the button state
                const isFavorite = favorites.includes(song.id);
                const favBtn = document.getElementById('previewFavoriteBtn');
                favBtn.classList.toggle('favorited', isFavorite);
            });

            // Setlist button
            document.getElementById('previewSetlistBtn')?.addEventListener('click', () => {
                const isInSetlist = song.category === 'New' 
                    ? NewSetlist.some(s => s.id === song.id)
                    : OldSetlist.some(s => s.id === song.id);
                
                if (isInSetlist) {
                    removeFromSetlist(song.id, song.category);
                } else {
                    addToSetlist(song.id);
                }
                
                // Update the button after a short delay to allow state to update
                setTimeout(() => {
                    const newIsInSetlist = song.category === 'New' 
                        ? NewSetlist.some(s => s.id === song.id)
                        : OldSetlist.some(s => s.id === song.id);
                    const setlistBtn = document.getElementById('previewSetlistBtn');
                    setlistBtn.textContent = newIsInSetlist ? 'Remove from Setlist' : 'Add to Setlist';
                    setlistBtn.classList.toggle('btn-primary', !newIsInSetlist);
                    setlistBtn.classList.toggle('btn-delete', newIsInSetlist);
                }, 100);
            });
            
            document.getElementById('previewEditBtn')?.addEventListener('click', () => {
                editSong(song.id);
            });

            // Transpose controls
            document.getElementById('transpose-up')?.addEventListener('click', () => {
                const currentLevel = parseInt(document.getElementById('transpose-level').textContent);
                updatePreviewWithTransposition(currentLevel + 1);
            });

            document.getElementById('transpose-down')?.addEventListener('click', () => {
                const currentLevel = parseInt(document.getElementById('transpose-level').textContent);
                updatePreviewWithTransposition(currentLevel - 1);
            });

            document.getElementById('transposeReset').addEventListener('click', () => {
                updatePreviewWithTransposition(0);
            });

            // Setup auto-scroll if needed
            setupAutoScroll();
        }
    
        function showPreview(song, fromHistory = false) {
            // Update history if this is a new navigation (not from back/forward)
            if (!fromHistory && !isNavigatingHistory && !currentModal) {
                if (currentHistoryPosition < navigationHistory.length - 1) {
                   
                    navigationHistory = navigationHistory.slice(0, currentHistoryPosition + 1);
                }
                
                navigationHistory.push(song.id);
                currentHistoryPosition = navigationHistory.length - 1;
                
                history.pushState({ 
                    songId: song.id, 
                    position: currentHistoryPosition 
                }, '', `#song-${song.id}`);
            }

            // Clear the preview and reset state
            songPreviewEl.innerHTML = '';
            songPreviewEl.dataset.songId = song.id;
            songPreviewEl.dataset.originalLyrics = song.lyrics;
            songPreviewEl.dataset.originalKey = song.key;

            // Check if song is in setlist/favorites
            const isInSetlist = song.category === 'New' 
                ? NewSetlist.some(s => s.id === song.id)
                : OldSetlist.some(s => s.id === song.id);
            const isFavorite = favorites.includes(song.id);

            // Build the preview HTML
            songPreviewEl.innerHTML = `
<div class="song-preview-container">
    <div class="song-slide">
        <div class="preview-header">
            <div style="display: flex; align-items: center; gap: 10px;">
                <h2>${song.title}</h2>
            </div>
            <div class="preview-actions">
                <button class="favorite-btn${isFavorite ? ' favorited' : ''}" id="previewFavoriteBtn" data-song-id="${song.id}">
                    <i class="fas fa-heart"></i>
                </button>
                <button class="btn ${isInSetlist ? 'btn-delete' : 'btn-primary'}" id="previewSetlistBtn">
                    ${isInSetlist ? 'Remove from Setlist' : 'Add to Setlist'}
                </button>
                <button class="btn btn-edit" id="previewEditBtn">
                    <i class="fas fa-edit"></i> Edit
                </button>
                ${isAdmin() ? `<button class="btn btn-delete" id="previewDeleteBtn"><i class="fas fa-trash-alt"></i> Delete</button>` : ''}
            </div>
        </div>

        <div class="song-meta">
            <p><strong>Key:</strong> <span id="current-key">${song.key}</span></p>
            ${song.tempo ? `<p><strong>Tempo:</strong> ${song.tempo}</p>` : ''}
            ${song.time ? `<p><strong>Time Signature:</strong> ${song.time}</p>` : ''}
            ${song.taal ? `<p><strong>Taal:</strong> ${song.taal}</p>` : ''}
            ${song.genres ? `<p><strong>Genres:</strong> ${song.genres.join(', ')}</p>` : song.genre ? `<p><strong>Genre:</strong> ${song.genre}</p>` : ''}
        </div>

        <div class="song-audit">
            ${song.updatedAt && song.updatedBy
                ? `<p><strong>Updated by:</strong> ${song.updatedBy} <span style=\"color:#888;font-size:0.9em\">on ${new Date(song.updatedAt).toLocaleString()}</span></p>`
                : (song.createdBy && song.createdAt
                    ? `<p><strong>Added by:</strong> ${song.createdBy} <span style=\"color:#888;font-size:0.9em\">on ${new Date(song.createdAt).toLocaleString()}</span></p>`
                    : '')
            }
        </div>

        <div class="transpose-controls">
            <button class="btn btn-primary" id="transpose-down">-</button>
            <span>Transpose: <span id="transpose-level">0</span></span>
            <button class="btn btn-primary" id="transpose-up">+</button>
            <button id="transposeReset" class="btn btn-primary">Reset</button>
        </div>
        <div class="song-lyrics">${formatLyricsWithChords(song.lyrics, 0)}</div>
        <!-- Add these new swipe indicators -->
        <div class="swipe-indicator prev">←</div>
        <div class="swipe-indicator next">→</div>
    </div>
</div>
`;

            // Attach all event listeners
            attachPreviewEventListeners(song);
            
            // Reset navigation flag if this was a history navigation
            if (isNavigatingHistory) {
                setTimeout(() => { isNavigatingHistory = false; }, 100);
            }



            

        
            document.getElementById('previewFavoriteBtn').addEventListener('click', (e) => {
                toggleFavorite(song.id);
            });
            
            document.getElementById('previewSetlistBtn').addEventListener('click', (e) => {
                if (isInSetlist) {
                    removeFromSetlist(song.id, song.category);
                } else {
                    addToSetlist(song.id);
                }
            });
            
            document.getElementById('previewEditBtn').addEventListener('click', (e) => {
                editSong(song.id);
            });
            // Add delete button event for admins
            if (isAdmin()) {
                const delBtn = document.getElementById('previewDeleteBtn');
                if (delBtn) {
                    delBtn.addEventListener('click', () => {
                        // Open the delete modal for this song
                        document.getElementById('deleteSongId').value = song.id;
                        document.getElementById('deleteSongTitle').textContent = song.title;
                        document.getElementById('deleteSongModal').style.display = 'flex';
                    });
                }
            }
            
            document.getElementById('transpose-up').addEventListener('click', () => {
                const currentLevel = parseInt(document.getElementById('transpose-level').textContent);
                updatePreviewWithTransposition(currentLevel);
            });
            document.getElementById('transpose-down').addEventListener('click', () => {
                const currentLevel = parseInt(document.getElementById('transpose-level').textContent);
                updatePreviewWithTransposition(currentLevel);
            });
            document.getElementById('transposeReset').addEventListener('click', () => {
                updatePreviewWithTransposition(0);
            });

            // Setup auto-scroll if needed
            setupAutoScroll();
            applyLyricsBackground(song.category === 'New');
            
            if (suggestedSongsDrawerOpen) {
                showSuggestedSongs();
            }
        }
    
        function cleanUpLyrics(lyrics) {
            return lyrics.replace(/\n{3,}/g, '\n\n');
        }
    
        function formatLyricsWithChords(lyrics, transposeLevel) {
            const lines = lyrics.split('\n');
            let output = [];
    
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
    
                if (line.trim() === '') {
                    output.push(`<div class="lyric-line">${line}</div>`);
                    continue;
                }
    
                if (isChordLine(line)) {
                    let processedLine = line.replace(
                        /([A-G][#b]?(?:maj|min|m|dim|aug|sus2|sus4|m7|maj7|7|m9|maj9|9|m11|maj11|11|add9|add11|6|13)?(?:\/[A-G][#b]?)?)/gi,
                        (chord) => {
                            if (!chord.trim()) return chord;
                            if (chord.includes('/')) {
                                const [baseChord, bassNote] = chord.split('/');
                                const transposedBase = transposeChord(baseChord.trim(), transposeLevel);
                                const transposedBass = bassNote ? transposeChord(bassNote.trim(), transposeLevel) : '';
                                return `<span class="chord" data-original="${chord.trim()}">${transposedBase + (transposedBass ? '/' + transposedBass : '')}</span>`;
                            }
                            return `<span class="chord" data-original="${chord.trim()}">${transposeChord(chord.trim(), transposeLevel)}</span>`;
                        }
                    );
                    output.push(`<div class="chord-line">${processedLine}</div>`);
                }
                else if (hasInlineChords(line)) {
                    // Use INLINE_CHORD_REGEX to find and render inline chords
                    let processedLine = line.replace(INLINE_CHORD_REGEX, (match, chord) => {
                        if (chord.includes('/')) {
                            const [baseChord, bassNote] = chord.split('/');
                            const transposedBase = transposeChord(baseChord, transposeLevel);
                            const transposedBass = bassNote ? transposeChord(bassNote, transposeLevel) : '';
                            return `[<span class="chord" data-original="${chord}">${transposedBase}${transposedBass ? '/' + transposedBass : ''}</span>]`;
                        }
                        return `[<span class="chord" data-original="${chord}">${transposeChord(chord, transposeLevel)}</span>]`;
                    });
                    output.push(`<div class="lyric-line">${processedLine}</div>`);
                }
                else {
                    output.push(`<div class="lyric-line">${line}</div>`);
                }
            }
    
            return output.join('');
        }

        function isChordLine(line) {
            // Use only the defined constant for chord line detection
            return CHORD_LINE_REGEX.test(line.trim());
        }

        function hasInlineChords(line) {
            // Use only the defined constant for inline chord detection
            return INLINE_CHORD_REGEX.test(line);
        }
    
        function transposeChord(chord, steps) {
            if (steps === 0 || !chord) return chord;
    
            if (chord.includes('/')) {
                const [baseChord, bassNote] = chord.split('/');
                const transposedBase = transposeSingleChord(baseChord, steps);
                const transposedBass = bassNote ? transposeSingleChord(bassNote, steps) : '';
                return transposedBase + (transposedBass ? '/' + transposedBass : '');
            }
    
            return transposeSingleChord(chord, steps);
        }
    
        function transposeSingleChord(chord, steps) {
            if (steps === 0 || !chord) return chord;

            const match = chord.match(/^([A-G][#b]?)(.*)$/i);
            if (!match) return chord;

            const baseNote = match[1];
            const quality = match[2] || '';

            // Chromatic scale with both sharps and flats
            const chromaticScale = [
                'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
                'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'
            ];
            
            // Find current position
            let currentIndex = chromaticScale.indexOf(baseNote);
            if (currentIndex === -1) return chord;

            // Calculate new position (steps is already ±1)
            const newIndex = (currentIndex + steps + 12) % 12;
            let newBaseNote = chromaticScale[newIndex];

            // Maintain notation style (sharp vs flat)
            const preferFlats = ['F', 'Bb', 'Eb', 'Ab', 'Db'];
            if (preferFlats.includes(newBaseNote)) {
                const sharpToFlat = { 'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb' };
                newBaseNote = sharpToFlat[newBaseNote] || newBaseNote;
            }

            // Maintain case
            if (baseNote === baseNote.toLowerCase()) {
                newBaseNote = newBaseNote.toLowerCase();
            }

            return newBaseNote + quality;
        }
    
        function updatePreviewWithTransposition(level) {
            if (!songPreviewEl.dataset.songId) return;
            level = Math.max(-12, Math.min(12, level));
            const lyrics = songPreviewEl.dataset.originalLyrics;
            document.getElementById('transpose-level').textContent = level;
            const originalKey = songPreviewEl.dataset.originalKey;
            document.getElementById('current-key').textContent = level === 0 ? originalKey : transposeChord(originalKey, level);
    
            const lyricsContainer = document.querySelector('.song-lyrics');
            if (lyricsContainer) {
                lyricsContainer.innerHTML = formatLyricsWithChords(lyrics, level);
            }
        }
    
        function setupAutoScroll() {
            isUserScrolling = false;
            songPreviewEl.scrollTop = 0;
            if (autoScrollInterval) {
                clearInterval(autoScrollInterval);
                autoScrollInterval = null;
            }
            if (toggleAutoScrollBtn) {
                toggleAutoScrollBtn.innerHTML = '<i class="fas fa-play"></i>';
                toggleAutoScrollBtn.classList.remove('active');
            }
        }
    
        function startAutoScroll(direction = 'down') {
            if (autoScrollInterval) {
                clearInterval(autoScrollInterval);
            }
            
            const scrollStep = direction === 'down' ? 20 : -20;
            if (toggleAutoScrollBtn) {
                toggleAutoScrollBtn.innerHTML = '<i class="fas fa-pause"></i>';
                toggleAutoScrollBtn.classList.add('active');
            }
            
            autoScrollInterval = setInterval(() => {
                if (isUserScrolling) return;
                const previewHeight = songPreviewEl.scrollHeight;
                const viewportHeight = songPreviewEl.clientHeight;
                const maxScroll = previewHeight - viewportHeight;
                const currentScroll = songPreviewEl.scrollTop;
                
                if ((direction === 'down' && currentScroll >= maxScroll - 10) || 
                    (direction === 'up' && currentScroll <= 10)) {
                    clearInterval(autoScrollInterval);
                    autoScrollInterval = null;
                    if (toggleAutoScrollBtn) {
                        toggleAutoScrollBtn.innerHTML = '<i class="fas fa-play"></i>';
                        toggleAutoScrollBtn.classList.remove('active');
                    }
                    return;
                }
                
                const targetScroll = direction === 'down' 
                    ? Math.min(currentScroll + scrollStep, maxScroll)
                    : Math.max(currentScroll + scrollStep, 0);
                    
                let startTime;
                function animateScroll(timestamp) {
                    if (!startTime) startTime = timestamp;
                    const progress = Math.min((timestamp - startTime) / 300, 1);
                    const ease = progress * (2 - progress);
                    songPreviewEl.scrollTop = currentScroll + (targetScroll - currentScroll) * ease;
                    if (progress < 1 && !isUserScrolling) {
                        requestAnimationFrame(animateScroll);
                    }
                }
                requestAnimationFrame(animateScroll);
            }, autoScrollSpeed);
        }
    
        function toggleAutoScroll() {
            if (autoScrollInterval) {
                clearInterval(autoScrollInterval);
                autoScrollInterval = null;
                toggleAutoScrollBtn.innerHTML = '<i class="fas fa-play"></i>';
                toggleAutoScrollBtn.classList.remove('active');
            } else {
                startAutoScroll('down');
                toggleAutoScrollBtn.innerHTML = '<i class="fas fa-pause"></i>';
                toggleAutoScrollBtn.classList.add('active');
            }
        }
    
        function handleUserScroll() {
            isUserScrolling = true;
            if (autoScrollInterval) {
                clearInterval(autoScrollInterval);
                autoScrollInterval = null;
                toggleAutoScrollBtn.innerHTML = '<i class="fas fa-play"></i>';
                toggleAutoScrollBtn.classList.remove('active');
            }
            
            setTimeout(() => {
                isUserScrolling = false;
            }, 1000);
        }
    
        function addToSetlist(id) {
            const song = songs.find(s => s.id === id);
            if (!song) return;
            
            const setlist = song.category === 'New' ? NewSetlist : OldSetlist;
            if (!setlist.some(s => s.id === id)) {
                setlist.push(song);
                queueSaveUserData();
                
                showNotification(`"${song.title}" added to ${song.category} setlist`);
                
                updateSetlistButton(id, true);
                
                if (songPreviewEl.dataset.songId == id) {
                    updatePreviewSetlistButton(true);
                }
                
                if (setlistSection.style.display === 'block') {
                    renderSetlist(song.category);
                }
            }
        }
    
        function removeFromSetlist(id, category) {
            const song = songs.find(s => s.id === id);
            if (!song) return;
            
            if (category === 'New') {
                NewSetlist = NewSetlist.filter(s => s.id !== id);
            } else {
                OldSetlist = OldSetlist.filter(s => s.id !== id);
            }
            queueSaveUserData();
            
            showNotification(`"${song.title}" removed from ${category} setlist`);
            
            updateSetlistButton(id, false);
            
            if (songPreviewEl.dataset.songId == id) {
                updatePreviewSetlistButton(false);
            }
            
            if (setlistSection.style.display === 'block') {
                renderSetlist(category);
            }
        }
    
        function updatePreviewSetlistButton(isInSetlist) {
            const previewBtn = document.getElementById('previewSetlistBtn');
            if (previewBtn) {
                previewBtn.textContent = isInSetlist ? 'Remove from Setlist' : 'Add to Setlist';
                previewBtn.classList.toggle('btn-primary', !isInSetlist);
                previewBtn.classList.toggle('btn-delete', isInSetlist);
            }
        }
    
        function toggleFavorite(id) {
            const index = favorites.indexOf(id);
            const song = songs.find(s => s.id === id);

            if (index === -1) {
                favorites.push(id);
                showNotification(`"${song.title}" added to favorites`);
            } else {
                favorites.splice(index, 1);
                showNotification(`"${song.title}" removed from favorites`);
            }

            queueSaveUserData();
            

            const favButtons = document.querySelectorAll(`.favorite-btn[data-song-id="${id}"]`);
            favButtons.forEach(btn => {
                btn.classList.toggle('favorited', index === -1);
            });

            if (songPreviewEl.dataset.songId == id) {
                const previewBtn = document.getElementById('previewFavoriteBtn');
                if (previewBtn) {
                    previewBtn.classList.toggle('favorited', index === -1);
                }
            }
        }
    
        function updateSetlistButton(songId, isInSetlist) {
            const songItem = document.querySelector(`.song-item[data-song-id="${songId}"]`);
            if (songItem) {
                const btn = songItem.querySelector('.toggle-setlist');
                if (btn) {
                    btn.textContent = isInSetlist ? 'Remove' : 'Add';
                    btn.classList.toggle('btn-primary', !isInSetlist);
                    btn.classList.toggle('btn-delete', isInSetlist);
                }
            }
        }
    
        function redrawPreviewOnThemeChange() {
            if (songPreviewEl.dataset.songId) {
                try {
                    const currentLevel = parseInt(document.getElementById('transpose-level')?.textContent) || 0;
                    const currentSong = songs.find(song => song.id == songPreviewEl.dataset.songId);
                    if (currentSong) {
                        showPreview(currentSong);
                        updatePreviewWithTransposition(currentLevel);
                    }
                } catch (e) {
                    console.error("Error redrawing preview:", e);
                }
            }
        }

        function openModal(modal) {
        // Close any existing modal first
            if (currentModal) {
                closeModal(currentModal);
            }
            
            modal.style.display = 'flex';
            currentModal = modal;
            document.body.style.overflow = 'hidden';
            
            // Add to history to handle back button
            history.pushState({ modalOpen: true }, '');
        }

        function closeModal(modal) {
            modal.style.display = 'none';
            currentModal = null;
            document.body.style.overflow = '';
            
            // Update history if we're closing via back button
            if (history.state?.modalOpen) {
                history.back();
            }
        }

        function setupWindowCloseConfirmation() {
        // Removed beforeunload confirmation popup as requested
        }

        function setupModals() {
            document.querySelectorAll('.modal').forEach(modal => {
                // Only keep the close button functionality
                modal.querySelectorAll('.close-modal').forEach(btn => {
                    btn.addEventListener('click', () => closeModal(modal));
                });
            });
            
            // Keep the escape key functionality
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && currentModal) {
                    closeModal(currentModal);
                }
            });
        }
    
        function editSong(id) {
            const song = songs.find(s => s.id === id || s.id === id);
            if (!song) return;
            document.getElementById('editSongId').value = Number(song.id);
            document.getElementById('editSongTitle').value = song.title;
            document.getElementById('editSongCategory').value = song.category;
            document.getElementById('editSongKey').value = song.key;
            document.getElementById('editSongTempo').value = song.tempo;
            document.getElementById('editSongTime').value = song.time;
            document.getElementById('editSongTaal').value = song.taal;
            
            const genres = song.genres || (song.genre ? [song.genre] : []);
            const editSelectedGenres = document.getElementById('editSelectedGenres');
            editSelectedGenres.innerHTML = '';
            genres.forEach(genre => {
                const tag = document.createElement('div');
                tag.className = 'multiselect-tag';
                tag.innerHTML = `
                    ${genre}
                    <span class="remove-tag">×</span>
                `;
                editSelectedGenres.appendChild(tag);
                
                const options = document.querySelectorAll('#editGenreDropdown .multiselect-option');
                options.forEach(opt => {
                    if (opt.dataset.value === genre) {
                        opt.classList.add('selected');
                    }
                });
            });
            
            document.getElementById('editSongLyrics').value = song.lyrics;
            editSongModal.style.display = 'flex';
        }
    
        function openDeleteSongModal(id) {
            const song = songs.find(s => s.id === Number(id));
            if (!song) return;
            document.getElementById('deleteSongId').value = Number(song.id);
            document.getElementById('deleteSongTitle').textContent = song.title;
            deleteSongModal.style.display = 'flex';
        }

        function getCurrentSongList() {
            if (deleteSection.style.display === 'block') {
                return songs.slice().sort((a, b) => a.title.localeCompare(b.title));
            } else if (favoritesSection.style.display === 'block') {
                return songs.filter(song => favorites.includes(song.id));
            } else if (setlistSection.style.display === 'block') {
                const activeSetlist = NewSetlistTab.classList.contains('active') ? 
                    NewSetlist : OldSetlist;
                return activeSetlist;
            } else {
                // Regular song list view with filters applied
                const category = NewTab.classList.contains('active') ? 'New' : 'Old';
                const keyFilterValue = keyFilter.value;
                const genreFilterValue = genreFilter.value;
                
                return songs
                    .filter(song => song.category === category)
                    .filter(song => keyFilterValue === "" || song.key === keyFilterValue)
                    .filter(song => {
                        if (!genreFilterValue) return true;
                        if (!song.genres) return song.genre === genreFilterValue;
                        return song.genres.includes(genreFilterValue);
                    })
                    .sort((a, b) => a.title.localeCompare(b.title));
            }
        }

        function saveSettings() {
            const showSetlistEl = document.getElementById('showSetlist');
            const newHeader = document.getElementById("sidebarHeaderInput").value;
            const newSetlist = document.getElementById("setlistTextInput").value;
            const sidebarWidth = document.getElementById("sidebarWidthInput").value;
            const songsPanelWidth = document.getElementById("songsPanelWidthInput").value;
            const previewMargin = document.getElementById("previewMarginInput").value;
            const newAutoScrollSpeed = document.getElementById("autoScrollSpeedInput").value;
            const sessionResetOption = document.getElementById("sessionResetOption").value;

            document.querySelector(".sidebar-header h2").textContent = newHeader;
            if (showSetlistEl) showSetlistEl.textContent = newSetlist;

            document.documentElement.style.setProperty('--sidebar-width', `${sidebarWidth}%`);
            document.documentElement.style.setProperty('--songs-panel-width', `${songsPanelWidth}%`);
            document.documentElement.style.setProperty('--preview-margin-left', `${previewMargin}px`);

            localStorage.setItem("sidebarHeader", newHeader);
            localStorage.setItem("setlistText", newSetlist);
            localStorage.setItem("sidebarWidth", sidebarWidth);
            localStorage.setItem("songsPanelWidth", songsPanelWidth);
            localStorage.setItem("previewMargin", previewMargin);
            localStorage.setItem("autoScrollSpeed", newAutoScrollSpeed);
            localStorage.setItem("sessionResetOption", sessionResetOption);
            autoScrollSpeed = parseInt(newAutoScrollSpeed);
        }
    
        function addEventListeners() {
            // Live update for weights total bar
            function updateWeightsTotalBar() {
                const vals = [
                    parseInt(document.getElementById('weightLanguage').value) || 0,
                    parseInt(document.getElementById('weightScale').value) || 0,
                    parseInt(document.getElementById('weightTimeSignature').value) || 0,
                    parseInt(document.getElementById('weightTaal').value) || 0,
                    parseInt(document.getElementById('weightTempo').value) || 0,
                    parseInt(document.getElementById('weightGenre').value) || 0
                ];
                const total = vals.reduce((a, b) => a + b, 0);
                const bar = document.getElementById('weightsTotalBar');
                bar.textContent = `Total: ${total} / 100`;
                bar.style.color = (total === 100) ? '#27ae60' : '#e74c3c';
            }
            [
                'weightLanguage',
                'weightScale',
                'weightTimeSignature',
                'weightTaal',
                'weightTempo',
                'weightGenre'
            ].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.addEventListener('input', updateWeightsTotalBar);
            });
            // Call once on tab open
            if (document.getElementById('weightsTabContent')) {
                document.getElementById('weightsTab').addEventListener('click', updateWeightsTotalBar);
            }
            // Admin panel tab switching
            const userMgmtTab = document.getElementById('userMgmtTab');
            const weightsTab = document.getElementById('weightsTab');
            const userMgmtTabContent = document.getElementById('userMgmtTabContent');
            const weightsTabContent = document.getElementById('weightsTabContent');
            if (userMgmtTab && weightsTab && userMgmtTabContent && weightsTabContent) {
                userMgmtTab.addEventListener('click', () => {
                    userMgmtTab.classList.add('active');
                    weightsTab.classList.remove('active');
                    userMgmtTabContent.style.display = '';
                    weightsTabContent.style.display = 'none';
                });
                weightsTab.addEventListener('click', () => {
                    userMgmtTab.classList.remove('active');
                    weightsTab.classList.add('active');
                    userMgmtTabContent.style.display = 'none';
                    weightsTabContent.style.display = '';
                    loadWeightsToForm();
                });
            }

            // Save weights form
            const weightsForm = document.getElementById('weightsForm');
            if (weightsForm) {
                weightsForm.addEventListener('submit', async function(e) {
                    e.preventDefault();
                    const newWeights = {
                        language: parseInt(document.getElementById('weightLanguage').value),
                        scale: parseInt(document.getElementById('weightScale').value),
                        timeSignature: parseInt(document.getElementById('weightTimeSignature').value),
                        taal: parseInt(document.getElementById('weightTaal').value),
                        tempo: parseInt(document.getElementById('weightTempo').value),
                        genre: parseInt(document.getElementById('weightGenre').value)
                    };
                    const total = Object.values(newWeights).reduce((a, b) => a + b, 0);
                    const notif = document.getElementById('weightsNotification');
                    if (total !== 100) {
                        notif.textContent = 'Total must be 100.';
                        notif.style.display = 'block';
                        notif.style.background = '#ffe0e0';
                        notif.style.color = '#b30000';
                        return;
                    }
                    notif.textContent = 'Saving...';
                    notif.style.display = 'block';
                    notif.style.background = '';
                    notif.style.color = '';
                    const result = await saveRecommendationWeightsToBackend(newWeights);
                    notif.textContent = result.message;
                    notif.style.display = 'block';
                    if (result.success) {
                        notif.style.background = '#e0ffe0';
                        notif.style.color = '#155724';
                    } else {
                        notif.style.background = '#ffe0e0';
                        notif.style.color = '#b30000';
                    }
                    setTimeout(() => {
                        notif.style.display = 'none';
                    }, 2500);
                });
            }

            // Load weights into form
            async function loadWeightsToForm() {
                await fetchRecommendationWeights();
                document.getElementById('weightLanguage').value = WEIGHTS.language;
                document.getElementById('weightScale').value = WEIGHTS.scale;
                document.getElementById('weightTimeSignature').value = WEIGHTS.timeSignature;
                document.getElementById('weightTaal').value = WEIGHTS.taal;
                document.getElementById('weightTempo').value = WEIGHTS.tempo;
                document.getElementById('weightGenre').value = WEIGHTS.genre;
            }
            // Tab switching
            NewTab.addEventListener('click', () => {
                setlistSection.style.display = 'none';
                deleteSection.style.display = 'none';
                favoritesSection.style.display = 'none';
                NewTab.classList.add('active');
                OldTab.classList.remove('active');
                NewContent.classList.add('active');
                OldContent.classList.remove('active');
                renderSongs('New', keyFilter.value, genreFilter.value);
                applyLyricsBackground(true);
                
                // Mobile view: show songs panel and hide sidebar
                if (window.innerWidth <= 768) {
                    document.querySelector('.songs-section').classList.remove('hidden');
                    document.querySelector('.sidebar').classList.add('hidden');
                    document.querySelector('.preview-section').classList.remove('full-width');
                }
            });

    
            OldTab.addEventListener('click', () => {
                setlistSection.style.display = 'none';
                deleteSection.style.display = 'none';
                favoritesSection.style.display = 'none';
                OldTab.classList.add('active');
                NewTab.classList.remove('active');
                OldContent.classList.add('active');
                NewContent.classList.remove('active');
                renderSongs('Old', keyFilter.value, genreFilter.value);
                applyLyricsBackground(false);
                
                // Mobile view: show songs panel and hide sidebar
                if (window.innerWidth <= 768) {
                    document.querySelector('.songs-section').classList.remove('hidden');
                    document.querySelector('.sidebar').classList.add('hidden');
                    document.querySelector('.preview-section').classList.remove('full-width');
                }
            });
    
            // Filter changes
            keyFilter.addEventListener('change', () => {
                if (NewTab.classList.contains('active')) {
                    renderSongs('New', keyFilter.value, genreFilter.value);
                } else {
                    renderSongs('Old', keyFilter.value, genreFilter.value);
                }
            });
    
            genreFilter.addEventListener('change', () => {
                if (NewTab.classList.contains('active')) {
                    renderSongs('New', keyFilter.value, genreFilter.value);
                } else {
                    renderSongs('Old', keyFilter.value, genreFilter.value);
                }
            });
    
            // Menu navigation
            showSetlistEl.addEventListener('click', (e) => {
                e.preventDefault();
                NewContent.classList.remove('active');
                OldContent.classList.remove('active');
                setlistSection.style.display = 'block';
                deleteSection.style.display = 'none';
                favoritesSection.style.display = 'none';
                NewSetlistTab.classList.add('active');
                OldSetlistTab.classList.remove('active');
                NewSetlistSongs.style.display = 'block';
                OldSetlistSongs.style.display = 'none';
                renderSetlist('New');
                document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
                e.target.classList.add('active');
                
                // Mobile view: show songs panel and hide sidebar
                if (window.innerWidth <= 768) {
                    document.querySelector('.songs-section').classList.remove('hidden');
                    document.querySelector('.sidebar').classList.add('hidden');
                    document.querySelector('.preview-section').classList.remove('full-width');
                }
            });
    
            showAllEl.addEventListener('click', (e) => {
                e.preventDefault();
                NewContent.classList.add('active');
                OldContent.classList.remove('active');
                setlistSection.style.display = 'none';
                deleteSection.style.display = 'none';
                favoritesSection.style.display = 'none';
                renderSongs('New', keyFilter.value, genreFilter.value);
                document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
                e.target.classList.add('active');
                applyLyricsBackground(true);
                
                // Mobile view: show songs panel and hide sidebar
                if (window.innerWidth <= 768) {
                    document.querySelector('.songs-section').classList.remove('hidden');
                    document.querySelector('.sidebar').classList.add('hidden');
                    document.querySelector('.preview-section').classList.remove('full-width');
                }
            });

    
            showFavoritesEl.addEventListener('click', (e) => {
                e.preventDefault();
                NewContent.classList.remove('active');
                OldContent.classList.remove('active');
                setlistSection.style.display = 'none';
                deleteSection.style.display = 'none';
                favoritesSection.style.display = 'block';
                renderFavorites();
                document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
                e.target.classList.add('active');
                
                // Mobile view: show songs panel and hide sidebar
                if (window.innerWidth <= 768) {
                    document.querySelector('.songs-section').classList.remove('hidden');
                    document.querySelector('.sidebar').classList.add('hidden');
                    document.querySelector('.preview-section').classList.remove('full-width');
                }
            });
    
            // Setlist tab switching
            NewSetlistTab.addEventListener('click', () => {
                NewSetlistTab.classList.add('active');
                OldSetlistTab.classList.remove('active');
                NewSetlistSongs.style.display = 'block';
                OldSetlistSongs.style.display = 'none';
                renderSetlist('New');
            });
    
            OldSetlistTab.addEventListener('click', () => {
                OldSetlistTab.classList.add('active');
                NewSetlistTab.classList.remove('active');
                OldSetlistSongs.style.display = 'block';
                NewSetlistSongs.style.display = 'none';
                renderSetlist('Old');
            });
          
            let touchStartX = 0;
            let isScrolling = false;

            // Keyboard navigation
            document.addEventListener('keydown', (e) => {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
                
                if (e.key === 'ArrowRight') {
                } else if (e.key === 'ArrowLeft') {
                }

                document.addEventListener('keydown', (e) => {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
                    return;
                }
                
                if (!songPreviewEl.dataset.songId) return;
                
                if (e.key === 'ArrowRight') {
                    e.preventDefault();
                } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                }
            });
        });
    
            // Song modals
            openAddSongModal.addEventListener('click', () => {
                addSongModal.style.display = 'flex';
                document.getElementById('selectedGenres').innerHTML = '';
                document.querySelectorAll('#genreDropdown .multiselect-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
            });
    
            document.querySelectorAll('.close-modal').forEach(button => {
                button.addEventListener('click', () => {
                    button.closest('.modal').style.display = 'none';
                });
            });
    
            // Multi-select genre functionality
            document.getElementById('songGenre').addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('genreDropdown').classList.toggle('show');
            });
            
            document.getElementById('editSongGenre').addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('editGenreDropdown').classList.toggle('show');
            });
            
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.multiselect-container')) {
                    document.getElementById('genreDropdown').classList.remove('show');
                    document.getElementById('editGenreDropdown').classList.remove('show');
                }
            });
                        // Handle session reset based on settings

            // Disabled automatic reset on refresh/close to prevent loss of JWT and user data
            // If you want to allow a full reset, call resetApplicationState() explicitly from a button or menu
            
            document.querySelectorAll('#genreDropdown .multiselect-option').forEach(option => {
                option.addEventListener('click', () => {
                    option.classList.toggle('selected');
                    updateSelectedGenres('selectedGenres', 'genreDropdown');
                });
            });
            
            document.querySelectorAll('#editGenreDropdown .multiselect-option').forEach(option => {
                option.addEventListener('click', () => {
                    option.classList.toggle('selected');
                    updateSelectedGenres('editSelectedGenres', 'editGenreDropdown');
                });
            });
            
            function updateSelectedGenres(containerId, dropdownId) {
                const container = document.getElementById(containerId);
                container.innerHTML = '';
                
                const selectedOptions = document.querySelectorAll(`#${dropdownId} .multiselect-option.selected`);
                selectedOptions.forEach(opt => {
                    const tag = document.createElement('div');
                    tag.className = 'multiselect-tag';
                    tag.innerHTML = `
                        ${opt.dataset.value}
                        <span class="remove-tag">×</span>
                    `;
                    container.appendChild(tag);
                    
                    tag.querySelector('.remove-tag').addEventListener('click', (e) => {
                        e.stopPropagation();
                        opt.classList.remove('selected');
                        tag.remove();
                    });
                });
            }
    
            // Form submissions
            newSongForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const title = document.getElementById('songTitle').value;
                const lyrics = document.getElementById('songLyrics').value;

                const selectedGenres = Array.from(document.querySelectorAll('#genreDropdown .multiselect-option.selected'))
                    .map(opt => opt.dataset.value);

                const newSong = {
                    title: title,
                    category: document.getElementById('songCategory').value,
                    key: document.getElementById('songKey').value,
                    tempo: document.getElementById('songTempo').value,
                    time: document.getElementById('songTime').value,
                    taal: document.getElementById('songTaal').value,
                    genres: selectedGenres,
                    lyrics: lyrics,
                    createdBy: (currentUser && currentUser.username) ? currentUser.username : undefined,
                    createdAt: new Date().toISOString()
                };

                try {
                    const response = await authFetch(`${API_BASE_URL}/api/songs`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newSong)
                    });
                    if (response.ok) {
                        showNotification('Song added successfully!');
                        addSongModal.style.display = 'none';
                        newSongForm.reset();
                        document.getElementById('selectedGenres').innerHTML = '';
                        // Reload songs from backend
                        songs = await loadSongsFromFile();
                        renderSongs('New', keyFilter.value, genreFilter.value);
                        updateSongCount();
                    } else {
                        showNotification('Failed to add song');
                    }
                } catch (err) {
                    showNotification('Error adding song');
                }
            });
    
            editSongForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const id = document.getElementById('editSongId').value;
                const title = document.getElementById('editSongTitle').value;
                const lyrics = document.getElementById('editSongLyrics').value;

                const selectedGenres = Array.from(document.querySelectorAll('#editGenreDropdown .multiselect-option.selected'))
                    .map(opt => opt.dataset.value);

                const updatedSong = {
                    title: title,
                    category: document.getElementById('editSongCategory').value,
                    key: document.getElementById('editSongKey').value,
                    tempo: document.getElementById('editSongTempo').value,
                    time: document.getElementById('editSongTime').value,
                    taal: document.getElementById('editSongTaal').value,
                    genres: selectedGenres,
                    lyrics: lyrics,
                    updatedAt: new Date().toISOString(),
                    updatedBy: (currentUser && currentUser.username) ? currentUser.username : undefined
                };

                try {
                    const response = await authFetch(`${API_BASE_URL}/api/songs/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updatedSong)
                    });
                    if (response.ok) {
                        showNotification('Song updated successfully!');
                        editSongModal.style.display = 'none';
                        editSongForm.reset();
                        // Reload songs from backend
                        songs = await loadSongsFromFile();
                        renderSongs('New', keyFilter.value, genreFilter.value);
                    } else {
                        showNotification('Failed to update song');
                    }
                } catch (err) {
                    showNotification('Error updating song');
                }
            });
    
            cancelDeleteSong.addEventListener('click', () => {
                deleteSongModal.style.display = 'none';
            });
    
            deleteSongForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const id = Number(document.getElementById('deleteSongId').value);
                try {
                    const response = await authFetch(`${API_BASE_URL}/api/songs/${id}`, {
                        method: 'DELETE'
                    });
                    if (response.ok) {
                        showNotification('Song deleted successfully!');
                        deleteSongModal.style.display = 'none';
                        // Remove song from local cache and memory
                        songs = songs.filter(song => song.id !== id);
                        localStorage.setItem('songs', JSON.stringify(songs));
                        renderSongs('New', keyFilter.value, genreFilter.value);
                        updateSongCount();
                    } else {
                        showNotification('Failed to delete song');
                    }
                } catch (err) {
                    showNotification('Error deleting song');
                }
            });
    
            // Preview scrolling
            songPreviewEl.addEventListener('wheel', handleUserScroll, { passive: true });
            songPreviewEl.addEventListener('touchmove', handleUserScroll, { passive: true });
            
            // Auto-scroll controls
            toggleAutoScrollBtn.addEventListener('click', toggleAutoScroll);
            
            // Keep screen on button
            keepScreenOnBtn.addEventListener('click', toggleScreenWakeLock);
    
            // Bulk operations
            deleteAllSongsBtn.addEventListener('click', () => {
                confirmDeleteAllModal.style.display = 'flex';
            });
    
    
            cancelDeleteAll.addEventListener('click', () => {
                confirmDeleteAllModal.style.display = 'none';
            });
    
            confirmDeleteAll.addEventListener('click', () => {
                songs = [];
                NewSetlist = [];
                OldSetlist = [];
                favorites = [];
                saveSongs();
                queueSaveUserData();
                
                if (NewTab.classList.contains('active')) {
                    renderSongs('New', keyFilter.value, genreFilter.value);
                } else {
                    renderSongs('Old', keyFilter.value, genreFilter.value);
                }
                songPreviewEl.innerHTML = '<h2>Select a song</h2><div class="song-lyrics"></div>';
                songPreviewEl.dataset.songId = '';
                showNotification('All songs have been deleted.');
                confirmDeleteAllModal.style.display = 'none';
            });
    
            // Search functionality
            searchInput.addEventListener('input', function (e) {
                const query = e.target.value.trim().toLowerCase();
                clearSearchBtn.style.display = query ? 'block' : 'none';
                const searchResults = document.getElementById('searchResults');
                const searchResultsContent = document.getElementById('searchResultsContent');

                if (query.length === 0) {
                    searchResults.classList.remove('active');
                    if (NewTab.classList.contains('active')) {
                        renderSongs('New', keyFilter.value, genreFilter.value);
                    } else {
                        renderSongs('Old', keyFilter.value, genreFilter.value);
                    }
                    return;
                }

                if (query.length > 0) {
                    saveSearchQuery(query);
                }
    
                const filtered = songs.filter(song => {
                    return (
                        song.title.toLowerCase().includes(query) ||
                        (song.lyrics && song.lyrics.toLowerCase().includes(query)) ||
                        (song.taal && song.taal.toLowerCase().includes(query)) ||
                        (song.genre && song.genre.toLowerCase().includes(query)) ||
                        (song.genres && song.genres.some(g => g.toLowerCase().includes(query)))
                    );
                });
    
                if (filtered.length === 0) {
                    searchResultsContent.innerHTML = '<p>No results found</p>';
                    searchResults.classList.add('active');
                    return;
                }
    
                searchResultsContent.innerHTML = '';
    
                filtered.forEach(song => {
                    const resultItem = document.createElement('div');
                    resultItem.className = 'search-result-item';
                    resultItem.dataset.songId = song.id;
    
                    const highlightedTitle = highlightText(song.title, query);
    
                    let lyricsSnippet = '';
                    if (song.lyrics && song.lyrics.toLowerCase().includes(query)) {
                        const lyricsLower = song.lyrics.toLowerCase();
                        const queryPos = lyricsLower.indexOf(query);
                        const startPos = Math.max(0, queryPos - 20);
                        const endPos = Math.min(song.lyrics.length, queryPos + query.length + 40);
                        lyricsSnippet = song.lyrics.substring(startPos, endPos);
                        if (startPos > 0) lyricsSnippet = '...' + lyricsSnippet;
                        if (endPos < song.lyrics.length) lyricsSnippet = lyricsSnippet + '...';
                        lyricsSnippet = highlightText(lyricsSnippet, query);
                    }
    
                    resultItem.innerHTML = `
                        <div class="search-result-title">${highlightedTitle}</div>
                        <div class="search-result-meta">${song.key} | ${song.tempo} | ${song.time} | ${song.genre || ''}</div>
                        ${lyricsSnippet ? `<div class="search-result-snippet">${lyricsSnippet}</div>` : ''}
                    `;
    
                    resultItem.addEventListener('click', () => {
                        const foundSong = songs.find(s => s.id === song.id);
                        if (foundSong) {
                            showPreview(foundSong);
                            if (window.innerWidth <= 768) {
                                document.querySelector('.songs-section').classList.add('hidden');
                                document.querySelector('.sidebar').classList.add('hidden');
                                document.querySelector('.preview-section').classList.add('full-width');
                            }
                        }
                    });
    
                    searchResultsContent.appendChild(resultItem);
                });
    
                searchResults.classList.add('active');
            });
            
            // Clear search button
            clearSearchBtn.addEventListener('click', () => {
                searchInput.value = '';
                clearSearchBtn.style.display = 'none';
                document.getElementById('searchResults').classList.remove('active');
                document.getElementById('searchHistoryDropdown').style.display = 'none';
                if (NewTab.classList.contains('active')) {
                    renderSongs('New', keyFilter.value, genreFilter.value);
                } else {
                    renderSongs('Old', keyFilter.value, genreFilter.value);
                }
            });
            
            // Search history dropdown
            searchInput.addEventListener('focus', () => {
                if (searchInput.value.trim() === '') {
                    showSearchHistory();
                }
            });
            
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.search-container')) {
                    document.getElementById('searchHistoryDropdown').style.display = 'none';
                }
            });
    
            // Download/upload
            downloadBtn.addEventListener('click', downloadSongs);
    
            // HTML download
            document.getElementById('downloadHtmlWithSongsBtn').addEventListener('click', () => {
                try {
                    const clone = document.documentElement.cloneNode(true);
                    const embedded = clone.querySelector('#embeddedSongs');
                    if (embedded) {
                        embedded.textContent = JSON.stringify(songs, null, 2);
                    } else {
                        const script = document.createElement('script');
                        script.id = 'embeddedSongs';
                        script.type = 'application/json';
                        script.textContent = JSON.stringify(songs, null, 2);
                        clone.querySelector('body').appendChild(script);
                    }
    
                    const fullHtml = '<!DOCTYPE html>\n' + clone.outerHTML;
                    const blob = new Blob([fullHtml], { type: 'text/html' });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = 'NewOld_Songs_Updated.html';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    showNotification('HTML file downloaded with all songs');
                } catch (err) {
                    showNotification('Failed to generate updated HTML: ' + err.message);
                }
            });
    
            // Settings
            const settingsBtn = document.createElement("button");
            settingsBtn.id = "settingsBtn";
            settingsBtn.textContent = "🛠";
            document.querySelector(".app-container").appendChild(settingsBtn);
    
            settingsBtn.addEventListener("click", () => {
                document.getElementById("sidebarHeaderInput").value = document.querySelector(".sidebar-header h2").textContent;
                document.getElementById("setlistTextInput").value = showSetlistEl.textContent;
                document.getElementById("settingsModal").style.display = "flex";
            });
    
            document.getElementById("settingsForm").addEventListener("submit", function (e) {
                e.preventDefault();
                saveSettings();
                showNotification('Settings saved successfully');
                document.getElementById("settingsModal").style.display = "none";
            });
    
            // Folder toggle
            document.getElementById('toggleSongTools').addEventListener('click', () => {
                const folder = document.getElementById('songToolsContent');
                const toggle = document.getElementById('toggleSongTools');
                folder.classList.toggle('show');
                toggle.classList.toggle('active');
            });
    
            // Suggested songs
            document.getElementById('toggleSuggestedSongs').addEventListener('click', toggleSuggestedSongsDrawer);
            document.getElementById('closeSuggestedSongs').addEventListener('click', closeSuggestedSongsDrawer);
            document.addEventListener('click', (e) => {
                const drawer = document.getElementById('suggestedSongsDrawer');
                const toggleBtn = document.getElementById('toggleSuggestedSongs');
                
                if (suggestedSongsDrawerOpen && 
                    !e.target.closest('#suggestedSongsDrawer') && 
                    e.target !== toggleBtn) {
                    closeSuggestedSongsDrawer();
                }
            });
    
            // Theme toggle
            document.getElementById('themeToggle').addEventListener('click', () => {
                isDarkMode = !isDarkMode;
                localStorage.setItem('darkMode', isDarkMode);
                document.body.classList.toggle('dark-mode');
    
                const toggle = document.getElementById('themeToggle');
                if (isDarkMode) {
                    toggle.innerHTML = '<i class="fas fa-sun"></i><span>Light Mode</span>';
                } else {
                    toggle.innerHTML = '<i class="fas fa-moon"></i><span>Dark Mode</span>';
                }
                
                redrawPreviewOnThemeChange();
            });
    
            // Make toggle buttons draggable
            makeToggleDraggable('toggle-sidebar');
            makeToggleDraggable('toggle-songs');
            makeToggleDraggable('toggle-all-panels');
        }
    
        function makeToggleDraggable(id) {
            const el = document.getElementById(id);
            let isDragging = false, offsetX = 0, offsetY = 0;
    
            const savePosition = () => {
                const pos = { top: el.style.top, left: el.style.left };
                localStorage.setItem(id + '-pos', JSON.stringify(pos));
            };
    
            const restorePosition = () => {
                const saved = localStorage.getItem(id + '-pos');
                if (saved) {
                    const pos = JSON.parse(saved);
                    el.style.top = pos.top;
                    el.style.left = pos.left;
                } else {
                    // Initial positions: right side, one below the other
                    el.style.right = '10px';
                    el.style.left = '';
                    if (id === 'toggle-sidebar') {
                        el.style.top = '200px';
                    } else if (id === 'toggle-songs') {
                        el.style.top = '260px';
                    } else if (id === 'toggle-all-panels') {
                        el.style.top = '320px';
                    }
                }
            };
    
            // Use translateY for vertical movement only, works better on mobile
            let startTop = 0;
            const onMove = (clientX, clientY) => {
                let newTop = clientY - offsetY;
                el.style.left = '';
                el.style.right = '10px';
                el.style.top = newTop + 'px';
            };
    
            const onEnd = () => {
                isDragging = false;
                document.body.style.userSelect = '';
                const windowWidth = window.innerWidth;
                const elRect = el.getBoundingClientRect();
                if (elRect.left < windowWidth / 2) {
                    el.style.left = '10px';
                } else {
                    el.style.left = (windowWidth - el.offsetWidth - 10) + 'px';
                }
                savePosition();
            };
    
            el.addEventListener('mousedown', function (e) {
                isDragging = true;
                offsetX = e.clientX - el.offsetLeft;
                offsetY = e.clientY - el.offsetTop;
                document.body.style.userSelect = 'none';
            });
    
            document.addEventListener('mousemove', function (e) {
                if (isDragging) onMove(e.clientX, e.clientY);
            });
    
            document.addEventListener('mouseup', onEnd);
    
            el.addEventListener('touchstart', function (e) {
                isDragging = true;
                const touch = e.touches[0];
                offsetY = touch.clientY - el.offsetTop;
            }, { passive: false });

            el.addEventListener('touchmove', function (e) {
                if (isDragging) {
                    const touch = e.touches[0];
                    onMove(touch.clientX, touch.clientY);
                    e.preventDefault();
                }
            }, { passive: false });
    
            el.addEventListener('touchend', onEnd);
            restorePosition();
    
            let timeout;
            const showTemporarily = () => {
                el.classList.add('showing');
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    el.classList.remove('showing');
                }, 3000);
            };
    
            el.addEventListener('mouseenter', () => el.classList.add('showing'));
            el.addEventListener('mouseleave', () => el.classList.remove('showing'));
            el.addEventListener('touchstart', showTemporarily, { passive: true });
        }
    
        // Global functions
        window.addToSetlist = addToSetlist;
        window.editSong = editSong;
        window.openDeleteSongModal = openDeleteSongModal;
        window.removeFromSetlist = removeFromSetlist;
        window.renderSetlist = renderSetlist;
    

        // Start the application
        window.addEventListener('DOMContentLoaded', () => {
            // Restore login state and update UI
            if (jwtToken) {
                loadUserData(); // This will call updateAuthButtons after user is loaded
            } else {
                updateAuthButtons();
            }
            // ...existing code for any other initialization...
        });
