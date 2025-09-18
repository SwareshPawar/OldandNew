// --- GLOBAL CONSTANTS: must be at the very top ---

const GENRES = [
    "New", "Old","Mid","Hindi", "Marathi", "English", "Romantic", "Acoustic", "Dance", "Love", "Sad", "Patriotic", "Happy", "Qawalli", "Evergreen", "Classical", "Ghazal", "Sufi", "Powerfull",  "Rock",
    "Blues", "Female","Male","Duet"
];

const VOCAL_TAGS = ['Male', 'Female', 'Duet'];


const KEYS = [
    "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
    "Cm", "C#m", "Dm", "D#m", "Em", "Fm", "F#m", "Gm", "G#m", "Am", "A#m", "Bm"
];
const CATEGORIES = ["New", "Old"];
const TIMES = ["4/4", "3/4", "2/4", "6/8", "5/4", "7/8","12/8","14/8"];
const TAALS = [
    "Keherwa", "Keherwa Slow", "Dadra", "Dadra Slow", "Rupak", "EkTaal", "JhapTaal", "TeenTaal", "Deepchandi", "Garba","RD Patch", "Western", "Waltz", "K-Pop", "Hip-Hop", "Pop", "Rock", "Jazz", "Funk", "March Rhythm"
];
const TIME_GENRE_MAP = {
    "4/4": [
        "Keherwa", "Keherwa Slow","Keherwa Bhajani",  "Bhangra", "Pop", "Rock", "Jazz", "Funk", "Shuffle",
        "Blues", "Disco", "Reggae", "R&B", "Hip-Hop","K-Pop"
    ],
    "3/4": ["Waltz","Western", "Mazurka", "Viennese Waltz"],
    "2/4": ["Waltz","Western", "March", "Polka", "Samba"],
    "6/8": ["Rock","Dadra", "Dadra Slow","Dadra Bhajani", "Bhangra in 6/8", "Garba",],
    "5/4": ["JhapTaal", "Sultaal", "Jazz 5-beat"],
    "7/8": ["Rupak", "Rupak Ghazal", "Deepchandi"],
    "12/8": ["EkTaal","Chautaal", "Afro-Cuban 12/8", "Doha Taal", "Ballad 12/8"],
    "14/8": ["Deepchandi","Dhamaar"],
    "16/8": ["TeenTaal"]
};

// --- CHORD TYPES: single source of truth ---
const CHORD_TYPES = [
    "maj", "min", "m", "dim", "aug", "sus2", "sus4", "7sus4", "7sus2", "m7", "maj7", "7", "m9", "maj9", "9", "m11", "maj11", "11", "add9", "add11", "6", "13", "5", "sus", "7b5", "7#5", "7b9", "7#9", "b5", "#5", "b9", "#9"
];

        // Dynamic API base URL for local/dev/prod
        const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

            ? 'http://localhost:3001'
            : 'https://oldand-new.vercel.app'; // 'https://oldandnew.onrender.com'; || 'https://oldand-new.vercel.app';
        
        
        // const API_BASE_URL = 'https://oldand-new.vercel.app';

// --- CHORD REGEXES: always use CHORD_TYPES ---
const CHORDS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const CHORD_TYPE_REGEX = CHORD_TYPES.join("|");
const CHORD_REGEX = new RegExp(`([A-G](?:#|b)?)(?:${CHORD_TYPE_REGEX})?(?:\\/[A-G](?:#|b)?)?`, "gi");
const CHORD_LINE_REGEX = new RegExp(`^(\\s*[A-G](?:#|b)?(?:${CHORD_TYPE_REGEX})?(?:\\/[A-G](?:#|b)?)?\\s*)+$`, "i");
const INLINE_CHORD_REGEX = new RegExp(`[\\[(]([A-G](?:#|b)?(?:${CHORD_TYPE_REGEX})?(?:\\/[A-G](?:#|b)?)?)[\\])]`, "gi");

let isDarkMode = localStorage.getItem('darkMode') === 'true';
//let jwtToken = localStorage.getItem('jwtToken') || '';
//let currentUser = null;
 jwtToken = localStorage.getItem('jwtToken') || '';

// currentUser already initialized globally
isDarkMode = localStorage.getItem('darkMode') === 'true';


try {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) currentUser = JSON.parse(storedUser);
} catch {}

function populateGenreDropdown(id, timeSignature) {
    const select = document.getElementById(id);
    if (!select) return;
    select.innerHTML = '';
    let options = GENRES;
    if (timeSignature && TIME_GENRE_MAP[timeSignature]) {
        options = TIME_GENRE_MAP[timeSignature];
    }
    options.forEach(val => {
        const opt = document.createElement('option');
        opt.value = val;
        opt.textContent = val;
        select.appendChild(opt);
    });
}

// Merge all DOMContentLoaded logic into one handler
document.addEventListener('DOMContentLoaded', () => {
    // Restore auth state
    //let jwtToken = localStorage.getItem('jwtToken') || '';
    //let currentUser = null;
    try {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) currentUser = JSON.parse(storedUser);
    } catch {}

    // Helper: authFetch
    async function authFetch(url, options = {}) {
        const headers = options.headers || {};
        if (jwtToken) headers.Authorization = `Bearer ${jwtToken}`;
        return fetch(url, { ...options, headers });
    }

    async function updateLocalTransposeCache() {
        if (currentUser && currentUser.id) {
            try {
                const response = await authFetch(`${API_BASE_URL}/api/userdata`);
                if (response.ok) {
                    const userData = await response.json();
                    if (userData.transpose) {
                        localStorage.setItem('transposeCache', JSON.stringify(userData.transpose));
                    }
                }
            } catch {}
        }
    }
    updateLocalTransposeCache();

    // Inject spinner overlay if absent
    if (!document.getElementById('loadingOverlay')) {
        fetch('spinner.html')
            .then(r => r.text())
            .then(html => document.body.insertAdjacentHTML('beforeend', html))
            .catch(() => {});
    }

    function showLoading(percent) {
        const overlay = document.getElementById('loadingOverlay');
        const percentEl = document.getElementById('loadingPercent');
        if (overlay) overlay.style.display = 'flex';
        if (percentEl && typeof percent === 'number') percentEl.textContent = percent + '%';
    }
    function hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.style.display = 'none';
    }

    // Ensure these elements exist before use later
    const keyFilter = document.getElementById('keyFilter');
    const genreFilter = document.getElementById('genreFilter');

    async function loadSongsWithProgress() {
        showLoading(0);
        let response;
        try {
            for (let i = 0; i <= 20; i += 2) {
                showLoading(i);
                await new Promise(r => setTimeout(r, 25));
            }
            response = await authFetch(`${API_BASE_URL}/api/songs`);
            showLoading(30);
        } catch (err) {
            console.error('Network error fetching songs:', err);
            hideLoading();
            return;
        }
        if (!response.ok) {
            console.error('API error fetching songs:', response.status);
            hideLoading();
            return;
        }
        let allSongs = [];
        try {
            allSongs = await response.json();
        } catch (e) {
            console.error('Error parsing songs JSON', e);
        }
        showLoading(50);
        // Deduplicate
        const seen = new Set();
        const unique = [];
        for (const s of allSongs) {
            if (!seen.has(s.id)) {
                seen.add(s.id);
                unique.push(s);
            }
        }
        window.songs = unique;
        localStorage.setItem('songs', JSON.stringify(unique));
        showLoading(70);
        // Simulate render progress
        for (let i = 70; i <= 95; i += 5) {
            showLoading(i);
            await new Promise(r => setTimeout(r, 15));
        }
        if (typeof renderSongs === 'function') {
            renderSongs('New', keyFilter ? keyFilter.value : '', genreFilter ? genreFilter.value : '');
        }
        if (typeof updateSongCount === 'function') updateSongCount();
        showLoading(100);
        setTimeout(hideLoading, 300);
    }
    loadSongsWithProgress();

    // Populate dropdowns once
    populateDropdown('keyFilter', ['All Keys', ...KEYS]);
    populateDropdown('genreFilter', ['All Genres', ...GENRES]);
    populateDropdown('songKey', KEYS);
    populateDropdown('editSongKey', KEYS);
    populateDropdown('songCategory', CATEGORIES);
    populateDropdown('editSongCategory', CATEGORIES);
    populateDropdown('songTime', TIMES);
    populateDropdown('editSongTime', TIMES);
    populateDropdown('songTaal', TAALS);
    populateDropdown('editSongTaal', TAALS);

    // Genre multiselect (lazy setup; only once each)
    setupGenreMultiselect('songGenre', 'genreDropdown', 'selectedGenres');
    setupGenreMultiselect('editSongGenre', 'editGenreDropdown', 'editSelectedGenres');

    // Theme
     isDarkMode = localStorage.getItem('darkMode') === 'true';
    applyTheme(isDarkMode);
    const themeToggleBtn = document.getElementById('themeToggle');
    function updateThemeToggleBtn() {
        if (!themeToggleBtn) return;
        themeToggleBtn.setAttribute('aria-pressed', String(isDarkMode));
        themeToggleBtn.innerHTML = isDarkMode
            ? '<i class="fas fa-sun"></i><span>Light Mode</span>'
            : '<i class="fas fa-moon"></i><span>Dark Mode</span>';
    }
    updateThemeToggleBtn();
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            isDarkMode = !isDarkMode;
            localStorage.setItem('darkMode', isDarkMode);
            applyTheme(isDarkMode);
            updateThemeToggleBtn();
        });
    }

    // Auth UI
    if (typeof updateAuthButtons === 'function') updateAuthButtons();
    if (jwtToken && isJwtValid(jwtToken) && typeof loadUserData === 'function') {
        loadUserData().then(() => {
            if (typeof updateAuthButtons === 'function') updateAuthButtons();
        });
    } else if (!isJwtValid(jwtToken)) {
        localStorage.removeItem('jwtToken');
        jwtToken = '';
        if (typeof updateAuthButtons === 'function') updateAuthButtons();
    }

    // Tap tempo
    setupTapTempo('tapTempoBtn', 'songTempo');
    setupTapTempo('editTapTempoBtn', 'editSongTempo');

    // Sort filter
    const sortFilter = document.getElementById('sortFilter');
    if (sortFilter) {
        sortFilter.addEventListener('change', () => {
            const activeTab = document.getElementById('NewTab')?.classList.contains('active') ? 'New' : 'Old';
            if (typeof renderSongs === 'function') {
                renderSongs(activeTab, keyFilter ? keyFilter.value : '', genreFilter ? genreFilter.value : '');
            }
        });
    }

    initScreenWakeLock();

    // Add Song button(s)
    function openAddSong() {
        const modal = document.getElementById('addSongModal');
        if (modal) modal.style.display = 'flex';
    }
    ['addSongBelowFavoritesBtn', 'openAddSongModal'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', openAddSong);
        
    });

    // Login modal
    const loginBtn = document.getElementById('loginBtn');
    const loginModal = document.getElementById('loginModal');
    const closeLoginModal = document.getElementById('closeLoginModal');
    if (loginBtn && loginModal) {
        loginBtn.addEventListener('click', () => loginModal.style.display = 'flex');
    }
    if (closeLoginModal && loginModal) {
        closeLoginModal.addEventListener('click', () => loginModal.style.display = 'none');
    }

    // Register modal
    const registerBtn = document.getElementById('registerBtn');
    const registerModal = document.getElementById('registerModal');
    const closeRegisterModal = document.getElementById('closeRegisterModal');
    if (registerBtn && registerModal) {
        registerBtn.addEventListener('click', () => registerModal.style.display = 'flex');
    }
    if (closeRegisterModal && registerModal) {
        closeRegisterModal.addEventListener('click', () => registerModal.style.display = 'none');
    }

    // Forms
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async e => {
            e.preventDefault();
            const capitalizeFirst = s => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';
            const firstName = capitalizeFirst(document.getElementById('registerFirstName').value.trim());
            const lastName = capitalizeFirst(document.getElementById('registerLastName').value.trim());
            const username = document.getElementById('registerUsername').value.trim();
            const email = document.getElementById('registerEmail').value.trim();
            const phone = document.getElementById('registerPhone').value.trim();
            const password = document.getElementById('registerPassword').value;
            const errorDiv = document.getElementById('registerError');
            errorDiv.style.display = 'none';
            errorDiv.textContent = '';
            try {
                const res = await fetch(`${API_BASE_URL}/api/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ firstName, lastName, username, email, phone, password })
                });
                const data = await res.json().catch(() => ({}));
                if (res.ok) {
                    registerModal.style.display = 'none';
                    if (typeof showNotification === 'function') showNotification('Registration successful! Please login.');
                } else {
                    errorDiv.textContent = data.error || 'Registration failed';
                    errorDiv.style.display = 'block';
                }
            } catch {
                errorDiv.textContent = 'Network error';
                errorDiv.style.display = 'block';
            }
        });

        initScreenWakeLock();
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async e => {
            e.preventDefault();
            const loginInput = document.getElementById('loginUsername').value.trim();
            const password = document.getElementById('loginPassword').value;
            const errorDiv = document.getElementById('loginError');
            errorDiv.style.display = 'none';
            errorDiv.textContent = '';
            try {
                const res = await fetch(`${API_BASE_URL}/api/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ usernameOrEmail: loginInput, password })
                });
                const data = await res.json().catch(() => ({}));
                if (res.ok && data.token) {
                    localStorage.setItem('jwtToken', data.token);
                    if (data.user) localStorage.setItem('currentUser', JSON.stringify(data.user));
                    location.reload();
                } else {
                    errorDiv.textContent = data.error || 'Login failed';
                    errorDiv.style.display = 'block';
                }
            } catch {
                errorDiv.textContent = 'Network error';
                errorDiv.style.display = 'block';
            }
        });
    }

    // Final init hooks (if defined externally)
    if (typeof addEventListeners === 'function') addEventListeners();
    if (typeof loadSongsFromFile === 'function') loadSongsFromFile();
});

// --- FIXED helper implementations (fill in if previously incomplete) ---

function setupTapTempo(buttonId, inputId) {
    const btn = document.getElementById(buttonId);
    const input = document.getElementById(inputId);
    if (!btn || !input) return;
    let taps = [];
    btn.addEventListener('click', () => {
        const now = performance.now();
        taps.push(now);
        if (taps.length > 8) taps.shift();
        if (taps.length >= 2) {
            const intervals = [];
            for (let i = 1; i < taps.length; i++) intervals.push(taps[i] - taps[i - 1]);
            const avgMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            const bpm = Math.round(60000 / avgMs);
            input.value = bpm;
        }
    });
    btn.addEventListener('dblclick', () => { taps = []; });
    input.addEventListener('keydown', e => {
        if (e.code === 'Space') {
            e.preventDefault();
            btn.click();
        }
    });
}

function populateDropdown(id, options, withLabel = false) {
    const select = document.getElementById(id);
    if (!select) return;
    select.innerHTML = '';
    if (withLabel) {
        const opt = document.createElement('option');
        opt.disabled = true;
        opt.selected = true;
        opt.textContent = 'Select...';
        select.appendChild(opt);
    }
    options.forEach(val => {
        const opt = document.createElement('option');
        opt.value = val;
        opt.textContent = val;
        select.appendChild(opt);
    });
}

function renderGenreOptions(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;
    dropdown.innerHTML = GENRES
        .map(g => `<div class="multiselect-option" data-value="${g}">${g}</div>`)
        .join('');
}

function setupGenreMultiselect(inputId, dropdownId, selectedId) {
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);
    const selectedContainer = document.getElementById(selectedId);
    if (!input || !dropdown || !selectedContainer) return;

    // Render genre options
    renderGenreOptions(dropdownId);

    // Remove previous listeners if any
    if (input._genreListener) input.removeEventListener('click', input._genreListener);
    if (dropdown._genreListener) dropdown.removeEventListener('click', dropdown._genreListener);
    if (document._genreListener) document.removeEventListener('click', document._genreListener);

    // Make input always focusable and clickable
    input.setAttribute('readonly', 'true');
    input.style.cursor = 'pointer';

    input._genreListener = (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    };
    input.addEventListener('click', input._genreListener);

    // Hide dropdown when clicking outside
    document._genreListener = (e) => {
        if (!dropdown.contains(e.target) && e.target !== input) {
            dropdown.classList.remove('show');
        }
    };
    document.addEventListener('click', document._genreListener);

    // Select/deselect genres
    dropdown._genreListener = (e) => {
        const option = e.target.closest('.multiselect-option');
        if (!option) return;
        option.classList.toggle('selected');
        updateSelectedGenres(selectedId, dropdownId);
    };
    dropdown.addEventListener('click', dropdown._genreListener);
}

function updateSelectedGenres(selectedId, dropdownId) {
    const container = document.getElementById(selectedId);
    const dropdown = document.getElementById(dropdownId);
    if (!container || !dropdown) return;
    container.innerHTML = '';
    const selected = dropdown.querySelectorAll('.multiselect-option.selected');
    selected.forEach(opt => {
        const span = document.createElement('span');
        span.className = 'selected-genre-chip';
        span.textContent = opt.dataset.value;
        container.appendChild(span);
    });
}

function applyTheme(isDark) {
    const body = document.body;
    const toggle = document.getElementById('themeToggle');
    body.classList.toggle('dark-mode', isDark);
    if (toggle) {
        toggle.setAttribute('aria-pressed', String(isDark));
    }
    if (typeof redrawPreviewOnThemeChange === 'function') {
        redrawPreviewOnThemeChange();
    }
}


// JWT helpers
function getJwtExpiry(token) {
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (!payload.exp) return null;
        return payload.exp * 1000;
    } catch {
        return null;
    }
}
function isJwtValid(token) {
    const exp = getJwtExpiry(token);
    return !!(token && exp && Date.now() < exp);
}
// Robust theme switching function
// Global async init function for app initialization
async function init() {
    // Restore JWT and user state
    jwtToken = localStorage.getItem('jwtToken') || '';
    if (jwtToken) {
        updateAuthButtons();
        await loadUserData();
    } else {
        updateAuthButtons();
    }
    // Theme and UI setup
    if (typeof applyTheme === 'function') applyTheme(isDarkMode);
    // Genre multiselects
    if (typeof setupGenreMultiselect === 'function') {
        setupGenreMultiselect('songGenre', 'genreDropdown', 'selectedGenres');
        setupGenreMultiselect('editSongGenre', 'editGenreDropdown', 'editSelectedGenres');
    }
    // Load songs (always from backend)
    songs = await loadSongsFromFile();
    // Settings and UI
    loadSettings();
    addEventListeners();
    addPanelToggles();
    renderSongs('New', '', '');
    applyLyricsBackground(document.getElementById('NewTab').classList.contains('active'));
    connectWebSocket();
    updateSongCount();
    initScreenWakeLock();
    setupModalClosing();
    setupSuggestedSongsClosing();
    setupModals();
    setupWindowCloseConfirmation();
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
    // Admin panel button
    if (typeof updateAdminPanelBtn === 'function') updateAdminPanelBtn();
}
function applyTheme(isDark) {
    if (isDark) {
        document.body.classList.add('dark-mode');
        const toggle = document.getElementById('themeToggle');
        if (toggle) toggle.innerHTML = '<i class="fas fa-sun"></i><span>Light Mode</span>';
    } else {
        document.body.classList.remove('dark-mode');
        const toggle = document.getElementById('themeToggle');
        if (toggle) toggle.innerHTML = '<i class="fas fa-moon"></i><span>Dark Mode</span>';
    }
    redrawPreviewOnThemeChange();
}
// --- JWT expiry helpers: must be at the very top ---
// ===== GENRE MULTISELECT LOGIC =====
// Helper to update Taal dropdowns based on selected time signature
function updateTaalDropdown(timeSelectId, taalSelectId, selectedTaal = null) {
    const timeSelect = document.getElementById(timeSelectId);
    const taalSelect = document.getElementById(taalSelectId);
    if (!timeSelect || !taalSelect) return;
    const selectedTime = timeSelect.value;
    const taals = TIME_GENRE_MAP[selectedTime] || [];
    taalSelect.innerHTML = '';
    // Add default option
    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = 'Select Genre or Taal';
    defaultOpt.disabled = true;
    defaultOpt.selected = !selectedTaal;
    taalSelect.appendChild(defaultOpt);
    taals.forEach(taal => {
        const opt = document.createElement('option');
        opt.value = taal;
        opt.textContent = taal;
        if (selectedTaal && selectedTaal === taal) opt.selected = true;
        taalSelect.appendChild(opt);
    });
}
    // Dynamic Taal dropdown for Add Song
    const songTimeSelect = document.getElementById('songTime');
    const songTaalSelect = document.getElementById('songTaal');
    if (songTimeSelect && songTaalSelect) {
        songTimeSelect.addEventListener('change', () => updateTaalDropdown('songTime', 'songTaal'));
        updateTaalDropdown('songTime', 'songTaal'); // Initial population
    }
    // Dynamic Taal dropdown for Edit Song
    const editSongTimeSelect = document.getElementById('editSongTime');
    const editSongTaalSelect = document.getElementById('editSongTaal');
    if (editSongTimeSelect && editSongTaalSelect) {
        editSongTimeSelect.addEventListener('change', () => updateTaalDropdown('editSongTime', 'editSongTaal'));
        updateTaalDropdown('editSongTime', 'editSongTaal'); // Initial population
    }
// ...existing code...
// --- Tap Tempo Logic ---
function setupTapTempo(buttonId, inputId) {
    let tapTimes = [];
    const btn = document.getElementById(buttonId);
    const input = document.getElementById(inputId);
    if (!btn || !input) return;
    btn.addEventListener('click', () => {
        const now = Date.now();
        tapTimes.push(now);
        // Only keep last 6 taps
        if (tapTimes.length > 6) tapTimes.shift();
        if (tapTimes.length >= 2) {
            const intervals = [];
            for (let i = 1; i < tapTimes.length; i++) {
                intervals.push(tapTimes[i] - tapTimes[i - 1]);
            }
            const avgMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            const bpm = Math.round(60000 / avgMs);
            input.value = bpm;
        }
        // Reset if last tap was >2s ago
        if (tapTimes.length > 1 && now - tapTimes[tapTimes.length - 2] > 2000) {
            tapTimes = [now];
        }
    });
    // Optional: double-click to reset
    btn.addEventListener('dblclick', () => {
        tapTimes = [];
        input.value = '';
    });
    // Spacebar tap tempo support
    input.addEventListener('keydown', function(e) {
        if (e.code === 'Space' || e.key === ' ') {
            e.preventDefault();
            btn.click();
        }
    });
}


// ...existing code...

function populateDropdown(id, options, withLabel = false) {
    const select = document.getElementById(id);
    if (!select) return;
    select.innerHTML = '';
    if (withLabel) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = withLabel;
        select.appendChild(opt);
    }
    options.forEach(val => {
        const opt = document.createElement('option');
        opt.value = val;
        opt.textContent = val;
        select.appendChild(opt);
    });
}



function renderGenreOptions(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;
    dropdown.innerHTML = GENRES.map(genre => `<div class=\"multiselect-option\" data-value=\"${genre}\">${genre}</div>`).join("");
}

function setupGenreMultiselect(inputId, dropdownId, selectedId) {
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);
    const selectedContainer = document.getElementById(selectedId);
    if (!input || !dropdown || !selectedContainer) return;

    // Render options
    renderGenreOptions(dropdownId);

    // Remove previous listeners if any
    if (input._genreListener) input.removeEventListener('click', input._genreListener);
    if (dropdown._genreListener) dropdown.removeEventListener('click', dropdown._genreListener);
    if (document._genreListener) document.removeEventListener('click', document._genreListener);

    // Make input always focusable and clickable
    input.setAttribute('tabindex', '0');
    input.style.cursor = 'pointer';
    input._genreListener = (e) => {
        e.preventDefault();
        dropdown.classList.toggle('show');
    };
    input.addEventListener('click', input._genreListener);

    // Hide dropdown when clicking outside
    document._genreListener = (e) => {
        if (!e.target.closest('.multiselect-container')) {
            dropdown.classList.remove('show');
        }
    };
    document.addEventListener('click', document._genreListener);

    // Select/deselect genres
    dropdown._genreListener = (e) => {
        const option = e.target.closest('.multiselect-option');
        if (!option) return;
        option.classList.toggle('selected');
        updateSelectedGenres(selectedId, dropdownId);
    };
    dropdown.addEventListener('click', dropdown._genreListener);
}

function updateSelectedGenres(selectedId, dropdownId) {
    const selectedContainer = document.getElementById(selectedId);
    const dropdown = document.getElementById(dropdownId);
    selectedContainer.innerHTML = '';
    const selectedOptions = dropdown.querySelectorAll('.multiselect-option.selected');
    selectedOptions.forEach(opt => {
        // Prevent duplicate tags
        if ([...selectedContainer.children].some(tag => tag.textContent.trim().startsWith(opt.dataset.value))) return;
        const tag = document.createElement('div');
        tag.className = 'multiselect-tag';
        tag.innerHTML = `
            ${opt.dataset.value}
            <span class=\"remove-tag\">×</span>
        `;
        selectedContainer.appendChild(tag);
        tag.querySelector('.remove-tag').onclick = (e) => {
            e.stopPropagation();
            opt.classList.remove('selected');
            updateSelectedGenres(selectedId, dropdownId);
        };
    });
}

// Initialize genre multiselects on DOMContentLoaded

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
    // Remove duplicate isDarkMode initialization; handled in DOMContentLoaded
        let socket = null;
        let songs = [];
        let lastSongsFetch = null; // ISO string of last fetch
        let favorites = [];
        let keepScreenOn = false;
        let autoScrollSpeed = localStorage.getItem('autoScrollSpeed') || 1500;
        let suggestedSongsDrawerOpen = false;
        let isScrolling = false;

        let currentUser = (() => {
            try {
                const s = localStorage.getItem('currentUser');
                return s ? JSON.parse(s) : null;
            } catch { return null; }
        })();
         isDarkMode = localStorage.getItem('darkMode') === 'true';




        if (API_BASE_URL.includes('localhost')) {
            console.log('[Backend] Using LOCAL backend:', API_BASE_URL);
        } else {
            console.log('[Backend] Using PROD backend:', API_BASE_URL);
        }


        // Restore JWT token and user state on every refresh
        if (!jwtToken && localStorage.getItem('jwtToken')) {
            jwtToken = localStorage.getItem('jwtToken');
        }

        // On script load, update UI and user data if logged in and token is valid
        if (jwtToken && isJwtValid(jwtToken)) {
            loadUserData().then(() => {
                updateAuthButtons();
            });
        } else if (jwtToken && !isJwtValid(jwtToken)) {
            // Remove expired token only if it is actually expired
            localStorage.removeItem('jwtToken');
            jwtToken = '';
            updateAuthButtons();
        } else {
            updateAuthButtons();
        }

            
        async function loadSongsFromFile() {
            // ...removed console.time...
            // Always fetch all songs from backend and update localStorage
            try {
                const url = `${API_BASE_URL}/api/songs`;
                const response = await authFetch(url);
                if (response.ok) {
                    const allSongs = await response.json();
                    if (Array.isArray(allSongs)) {
                        // Deduplicate by ID
                        const uniqueSongs = [];
                        const seenIds = new Set();
                        for (const song of allSongs) {
                            if (!seenIds.has(song.id)) {
                                uniqueSongs.push(song);
                                seenIds.add(song.id);
                            }
                        }
                        songs = uniqueSongs;
                        localStorage.setItem('songs', JSON.stringify(songs));
                        if (uniqueSongs.length > 0) {
                            const latest = uniqueSongs.reduce((max, s) => {
                                const t = s.updatedAt || s.createdAt;
                                return (!max || t > max) ? t : max;
                            }, null);
                            lastSongsFetch = latest;
                        }
                    } else {
                        songs = [];
                    }
                } else {
                    songs = [];
                    const errorText = await response.text();
                    console.error('API error in loadSongsFromFile:', response.status, errorText);
                }
                return songs;
            } catch (err) {
                songs = [];
                console.error('Error loading songs from API (loadSongsFromFile):', err);
                return songs;
            }
            // ...removed console.timeEnd...
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
        n.classList.add('show');
        n.style.display = 'block';
        setTimeout(() => {
            n.classList.remove('show');
            n.style.display = 'none';
        }, 2000);
    }
    function renderUsers(users) {
        const tbody = document.querySelector('#usersTable tbody');
        tbody.innerHTML = '';
        users.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="max-width:180px;overflow-wrap:break-word;">${user.username}</td>
                <td>${user.isAdmin ? '<span class="admin-badge">Admin</span>' : ''}</td>
                <td>
                    <button class="btn" ${user.isAdmin ? 'disabled' : ''} onclick="markAdmin('${user._id}')">Mark Admin</button>
                </td>
                <td>
                    <button class="btn btn-reset" onclick="resetUserPassword('${user._id}')">Reset Password</button>
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
        document.getElementById('weightsTab').classList.remove('active');
        document.getElementById('weightsTabContent').style.display = 'none';
        document.getElementById('duplicateDetectionTab').classList.remove('active');
        document.getElementById('duplicateDetectionTabContent').style.display = 'none';
    }
    const adminPanelBtn = document.getElementById('adminPanelBtn');
    adminPanelBtn.onclick = () => showAdminPanelModal();

    // Tab switching logic for admin panel
    document.getElementById('userMgmtTab').onclick = function() {
        document.getElementById('userMgmtTab').classList.add('active');
        document.getElementById('userMgmtTabContent').style.display = '';
        document.getElementById('weightsTab').classList.remove('active');
        document.getElementById('weightsTabContent').style.display = 'none';
        document.getElementById('duplicateDetectionTab').classList.remove('active');
        document.getElementById('duplicateDetectionTabContent').style.display = 'none';
    };
    document.getElementById('weightsTab').onclick = function() {
        document.getElementById('userMgmtTab').classList.remove('active');
        document.getElementById('userMgmtTabContent').style.display = 'none';
        document.getElementById('weightsTab').classList.add('active');
        document.getElementById('weightsTabContent').style.display = '';
        document.getElementById('duplicateDetectionTab').classList.remove('active');
        document.getElementById('duplicateDetectionTabContent').style.display = 'none';
    };
    document.getElementById('duplicateDetectionTab').onclick = function() {
        document.getElementById('userMgmtTab').classList.remove('active');
        document.getElementById('userMgmtTabContent').style.display = 'none';
        document.getElementById('weightsTab').classList.remove('active');
        document.getElementById('weightsTabContent').style.display = 'none';
        document.getElementById('duplicateDetectionTab').classList.add('active');
        document.getElementById('duplicateDetectionTabContent').style.display = '';
        renderDuplicateDetection();
    };

    // --- Duplicate Detection Logic ---
    function stringSimilarity(str1, str2) {
        if (!str1 || !str2) return 0;
        str1 = str1.toLowerCase();
        str2 = str2.toLowerCase();
        const len1 = str1.length;
        const len2 = str2.length;
        const dp = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));
        for (let i = 0; i <= len1; i++) dp[i][0] = i;
        for (let j = 0; j <= len2; j++) dp[0][j] = j;
        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                if (str1[i - 1] === str2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
                }
            }
        }
        const maxLen = Math.max(len1, len2);
        return maxLen === 0 ? 1 : 1 - dp[len1][len2] / maxLen;
    }

    function findDuplicateSongs() {
        const duplicates = [];
        for (let i = 0; i < songs.length; i++) {
            for (let j = i + 1; j < songs.length; j++) {
                const s1 = songs[i];
                const s2 = songs[j];
                const titleSim = stringSimilarity(s1.title, s2.title);
                const lyricsSim = stringSimilarity(s1.lyrics, s2.lyrics);
                if (titleSim >= 0.8 || lyricsSim >= 0.8) {
                    duplicates.push({
                        song1: s1,
                        song2: s2,
                        titleSim,
                        lyricsSim
                    });
                }
            }
        }
        return duplicates;
    }

    function renderDuplicateDetection() {
        const container = document.getElementById('duplicateDetectionTabContent');
        container.innerHTML = '<h3>Duplicate Songs (≥80% match)</h3>';
        // Show loading indicator
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'duplicateLoading';
        loadingDiv.innerHTML = '<span>Detecting duplicates, please wait...</span>';
        loadingDiv.style.padding = '12px';
        container.appendChild(loadingDiv);

        // Limit to first 500 songs for performance
        const limitedSongs = songs.slice(0, 500);
        const duplicates = [];
        // Track shown pairs to avoid duplicates
        const shownPairs = new Set();
        // 1. Exact match detection using hash maps
        const titleMap = new Map();
        const lyricsMap = new Map();
        limitedSongs.forEach(song => {
            const t = song.title.trim().toLowerCase();
            const l = song.lyrics.trim().toLowerCase();
            if (titleMap.has(t)) {
                const other = titleMap.get(t);
                const key = [Math.min(song.id, other.id), Math.max(song.id, other.id)].join('_');
                if (!shownPairs.has(key)) {
                    duplicates.push({ song1: song, song2: other, titleSim: 1, lyricsSim: stringSimilarity(song.lyrics, other.lyrics) });
                    shownPairs.add(key);
                }
            } else {
                titleMap.set(t, song);
            }
            if (lyricsMap.has(l)) {
                const other = lyricsMap.get(l);
                const key = [Math.min(song.id, other.id), Math.max(song.id, other.id)].join('_');
                if (!shownPairs.has(key)) {
                    duplicates.push({ song1: song, song2: other, titleSim: stringSimilarity(song.title, other.title), lyricsSim: 1 });
                    shownPairs.add(key);
                }
            } else {
                lyricsMap.set(l, song);
            }
        });

        // 2. Fuzzy match detection for likely candidates
        // Group songs by first letter and similar length
        const groups = {};
        limitedSongs.forEach(song => {
            const key = song.title[0].toLowerCase() + '_' + song.title.length;
            if (!groups[key]) groups[key] = [];
            groups[key].push(song);
        });

        // Fast similarity check: normalized common chars
        function fastSimilarity(a, b) {
            if (!a || !b) return 0;
            a = a.toLowerCase();
            b = b.toLowerCase();
            let matches = 0;
            for (let ch of a) {
                if (b.includes(ch)) matches++;
            }
            return matches / Math.max(a.length, b.length);
        }

        Object.values(groups).forEach(group => {
            for (let i = 0; i < group.length; i++) {
                for (let j = i + 1; j < group.length; j++) {
                    const s1 = group[i];
                    const s2 = group[j];
                    const key = [Math.min(s1.id, s2.id), Math.max(s1.id, s2.id)].join('_');
                    if (shownPairs.has(key)) continue;
                    // Only do expensive check if fastSimilarity > 0.6
                    if (fastSimilarity(s1.title, s2.title) > 0.6 || fastSimilarity(s1.lyrics, s2.lyrics) > 0.6) {
                        const titleSim = stringSimilarity(s1.title, s2.title);
                        const lyricsSim = stringSimilarity(s1.lyrics, s2.lyrics);
                        if (titleSim >= 0.8 || lyricsSim >= 0.8) {
                            duplicates.push({ song1: s1, song2: s2, titleSim, lyricsSim });
                            shownPairs.add(key);
                        }
                    }
                }
            }
        });

        loadingDiv.remove();
        if (duplicates.length === 0) {
            container.innerHTML += '<p>No duplicates found.</p>';
            return;
        }
        let batchSize = 20;
        let currentBatch = 0;
        function renderBatch() {
            const start = currentBatch * batchSize;
            const end = Math.min(start + batchSize, duplicates.length);
            for (let idx = start; idx < end; idx++) {
                const dup = duplicates[idx];
                const div = document.createElement('div');
                div.className = 'duplicate-pair';
                div.innerHTML = `
                    <div class="duplicate-row" style="display:flex;align-items:flex-start;gap:32px;padding:16px 12px;margin-bottom:16px;border:1px solid #e0e0e0;border-radius:8px;background:#fafbfc;box-shadow:0 1px 4px rgba(0,0,0,0.04);">
                        <div class="duplicate-song" style="flex:1;min-width:220px;">
                            <div style="font-weight:600;font-size:1.08em;margin-bottom:4px;color:#2d6cdf;"><i class="fas fa-music"></i> Song 1</div>
                            <div style="font-size:1.04em;margin-bottom:2px;"><b>${dup.song1.title}</b></div>
                            <div style="color:#888;font-size:0.97em;margin-bottom:6px;">ID: ${dup.song1.id}</div>
                            <button class="btn btn-delete" style="margin-right:8px;" onclick="deleteSingleDuplicateSong(${dup.song1.id})">Delete</button>
                            <button class="btn btn-view" onclick="viewSingleLyrics(${dup.song1.id}, '${dup.song2.id}')">View Lyrics</button>
                        </div>
                        <div class="duplicate-song" style="flex:1;min-width:220px;">
                            <div style="font-weight:600;font-size:1.08em;margin-bottom:4px;color:#d14b4b;"><i class="fas fa-music"></i> Song 2</div>
                            <div style="font-size:1.04em;margin-bottom:2px;"><b>${dup.song2.title}</b></div>
                            <div style="color:#888;font-size:0.97em;margin-bottom:6px;">ID: ${dup.song2.id}</div>
                            <button class="btn btn-delete" style="margin-right:8px;" onclick="deleteSingleDuplicateSong(${dup.song2.id})">Delete</button>
                            <button class="btn btn-view" onclick="viewSingleLyrics(${dup.song2.id}, '${dup.song1.id}')">View Lyrics</button>
                        </div>
                        <div class="duplicate-meta" style="flex-basis:180px;min-width:140px;text-align:center;align-self:center;">
                            <div style="font-size:0.98em;margin-bottom:4px;"><span style="color:#2d6cdf;font-weight:600;">Title Similarity:</span> ${(dup.titleSim*100).toFixed(1)}%</div>
                            <div style="font-size:0.98em;"><span style="color:#d14b4b;font-weight:600;">Lyrics Similarity:</span> ${(dup.lyricsSim*100).toFixed(1)}%</div>
                        </div>
                    </div>
                    <div id="lyricsCompare${dup.song1.id}_${dup.song2.id}" style="display:none;"></div>
                    <div id="lyricsSingle${dup.song1.id}_${dup.song2.id}" style="display:none;"></div>
                    <div id="lyricsSingle${dup.song2.id}_${dup.song1.id}" style="display:none;"></div>
                `;
// Show lyrics for a single song in duplicate pair
window.viewSingleLyrics = function(songId, otherId) {
    const song = songs.find(s => s.id == songId);
    const lyricsDiv = document.getElementById(`lyricsSingle${songId}_${otherId}`);
    if (!lyricsDiv) return;
    lyricsDiv.style.display = lyricsDiv.style.display === 'none' ? 'block' : 'none';
    lyricsDiv.innerHTML = `<pre style='background:#f9f9f9;padding:8px;border:1px solid #ccc;'><b>${song.title}:</b>\n${song.lyrics}</pre>`;
}
                container.appendChild(div);
            }
            if (end < duplicates.length) {
                const loadMoreBtn = document.createElement('button');
                loadMoreBtn.textContent = `Load More (${duplicates.length - end} remaining)`;
                loadMoreBtn.className = 'btn';
                loadMoreBtn.style.margin = '12px 0';
                loadMoreBtn.onclick = function() {
                    loadMoreBtn.remove();
                    currentBatch++;
                    renderBatch();
                };
                container.appendChild(loadMoreBtn);
            }
        }
        renderBatch();
    }

    window.viewLyrics = function(id1, id2) {
        const song1 = songs.find(s => s.id === id1);
        const song2 = songs.find(s => s.id === id2);
        const lyricsDiv = document.getElementById(`lyricsCompare${id1}_${id2}`);
        if (!lyricsDiv) return;
        lyricsDiv.style.display = lyricsDiv.style.display === 'none' ? 'block' : 'none';
        lyricsDiv.innerHTML = `<pre style='background:#f9f9f9;padding:8px;border:1px solid #ccc;'><b>${song1.title}:</b>\n${song1.lyrics}\n\n<b>${song2.title}:</b>\n${song2.lyrics}</pre>`;
    }

    window.deleteSingleDuplicateSong = async function(songId) {
        // Remove from local
        songs = songs.filter(s => s.id !== songId);
        localStorage.setItem('songs', JSON.stringify(songs));
        // Remove from backend
        try {
            const resp = await fetch(`${API_BASE_URL}/api/songs/${songId}`, {
                method: 'DELETE',
                headers: jwtToken ? { 'Authorization': `Bearer ${jwtToken}` } : {}
            });
            if (resp.ok) {
                showNotification('Song deleted successfully');
            } else {
                showNotification('Failed to delete song from backend');
            }
        } catch (err) {
            showNotification('Error deleting song from backend');
        }
        renderDuplicateDetection();
        updateSongCount();
    }
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
    // Use global CHORDS, CHORD_REGEX, CHORD_LINE_REGEX, INLINE_CHORD_REGEX
        
        let navigationHistory = [];
        let currentHistoryPosition = -1;
        let isNavigatingHistory = false;
        let isAnyModalOpen = false;
        let currentModal = null;
        let userDataSaveQueue = Promise.resolve();

        // Search history
        let searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
    
        // Initialize the application

        function queueSaveUserData() {
            // Add the save to the end of the queue
            userDataSaveQueue = userDataSaveQueue.then(() => saveUserData());
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

        let wakeLock = null;
    
        async function initScreenWakeLock() {
            if ('wakeLock' in navigator && document.visibilityState === 'visible') {
                try {
                    wakeLock = await navigator.wakeLock.request('screen');
                    keepScreenOn = true;
                    showNotification('Screen will stay on');
                    wakeLock.addEventListener('release', () => {
                        keepScreenOn = false;
                        showNotification('Screen may sleep');
                    });
                } catch (err) {
                    console.error('Error enabling wake lock:', err);
                    showNotification('Failed to keep screen on');
                }
            }
        }

        document.addEventListener('visibilitychange', async () => {
            if (document.visibilityState === 'visible' && 'wakeLock' in navigator) {
                await initScreenWakeLock();
            } else if (wakeLock) {
                try {
                    await wakeLock.release();
                } catch (e) {}
                wakeLock = null;
                keepScreenOn = false;
                showNotification('Screen may sleep');
            }
        });


        function updateAuthButtons() {
            const isLoggedIn = !!jwtToken;
            const userGreeting = document.getElementById('userGreeting');
            if (isLoggedIn && currentUser && currentUser.firstName && currentUser.lastName) {
                userGreeting.textContent = `Hi, ${currentUser.firstName} ${currentUser.lastName}`;
                userGreeting.style.display = 'block';
            } else if (isLoggedIn && currentUser && currentUser.username) {
                userGreeting.textContent = `Hi, ${currentUser.username}`;
                userGreeting.style.display = 'block';
            } else {
                userGreeting.textContent = '';
                userGreeting.style.display = 'none';
            }
            document.getElementById('loginBtn').style.display = isLoggedIn ? 'none' : 'block';
            document.getElementById('logoutBtn').style.display = isLoggedIn ? 'block' : 'none';
            const registerBtn = document.getElementById('registerBtn');
            if (registerBtn) registerBtn.style.display = isLoggedIn ? 'none' : 'block';
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
    //const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://oldandnew.onrender.com';
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
                    <button class=\"btn\" ${user.isAdmin ? 'disabled' : ''} onclick=\"markAdmin('${user._id}')\">Mark Admin</button>
                </td>
                <td>
                    <button class=\"btn btn-reset\" onclick=\"resetUserPassword('${user._id}')\">Reset Password</button>
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

            // Set default values for mobile/desktop in percentage
            let sidebarWidth = localStorage.getItem("sidebarWidth");
            let songsPanelWidth = localStorage.getItem("songsPanelWidth");
            if (!sidebarWidth || !songsPanelWidth) {
                if (window.innerWidth <= 700) {
                    sidebarWidth = "60";
                    songsPanelWidth = "60";
                } else {
                    sidebarWidth = "20";
                    songsPanelWidth = "20";
                }
            }
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
    
   

        async function loadUserData() {
            try {
                const response = await authFetch(`${API_BASE_URL}/api/userdata`);
                if (response.ok) {
                    const data = await response.json();
                    // Always update favorites and setlists from backend
                    favorites = Array.isArray(data.favorites) ? data.favorites : [];
                    NewSetlist = Array.isArray(data.NewSetlist) ? data.NewSetlist : [];
                    OldSetlist = Array.isArray(data.OldSetlist) ? data.OldSetlist : [];
                    if (data.user && data.user.username) {
                        currentUser = data.user;
                        localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    }
                    updateAuthButtons();
                    // Render setlists after loading
                    renderSetlist('New');
                    renderSetlist('Old');
                } else if (response.status === 401 || response.status === 403) {
                    logout();
                    showNotification('Session expired. Please log in again.');
                } else {
                    let msg = 'Failed to load user data';
                    try {
                        const errData = await response.json();
                        if (errData && errData.error) msg = errData.error;
                    } catch {}
                    console.error('API error in loadUserData:', response.status, msg);
                    showNotification(msg);
                }
            } catch (err) {
                console.error('Network error in loadUserData:', err);
                showNotification('Network error: Failed to load user data');
            }
        }

        async function saveUserData() {
            try {
                // Limit favorites and setlists to 100 items each to avoid payload too large
                const limitedFavorites = Array.isArray(favorites) ? favorites.slice(0, 100) : [];
                const limitedNewSetlist = Array.isArray(NewSetlist) ? NewSetlist.slice(0, 100) : [];
                const limitedOldSetlist = Array.isArray(OldSetlist) ? OldSetlist.slice(0, 100) : [];
                // Use name, email, transpose as expected by backend
                const name = currentUser && currentUser.username ? currentUser.username : '';
                const email = currentUser && currentUser.email ? currentUser.email : '';
                let transpose = {};
                try {
                    transpose = JSON.parse(localStorage.getItem('transposeCache') || '{}');
                } catch (e) { transpose = {}; }
                const response = await authFetch(`${API_BASE_URL}/api/userdata`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        favorites: limitedFavorites,
                        NewSetlist: limitedNewSetlist,
                        OldSetlist: limitedOldSetlist,
                        name,
                        email: currentUser && currentUser.email ? currentUser.email : '',
                        username: currentUser && currentUser.username ? currentUser.username : ''
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
            // Normalize input
            const t = title.trim().toLowerCase();
            const l = lyrics.trim().toLowerCase();
            // Check for exact title or lyrics match
            for (const song of songs) {
                if (currentId && song.id === currentId) continue;
                if (song.title.trim().toLowerCase() === t || song.lyrics.trim().toLowerCase() === l) {
                    return true;
                }
            }
            // Fuzzy match: only compare with similar length and first letter
            for (const song of songs) {
                if (currentId && song.id === currentId) continue;
                if (song.title[0].toLowerCase() === title[0].toLowerCase() && Math.abs(song.title.length - title.length) < 3) {
                    // Fast similarity check
                    let matches = 0;
                    for (let ch of t) {
                        if (song.title.toLowerCase().includes(ch)) matches++;
                    }
                    if (matches / Math.max(song.title.length, t.length) > 0.6) {
                        // Expensive check
                        const titleSim = stringSimilarity(song.title, title);
                        if (titleSim >= 0.8) return true;
                    }
                }
                if (song.lyrics[0].toLowerCase() === lyrics[0].toLowerCase() && Math.abs(song.lyrics.length - lyrics.length) < 10) {
                    let matches = 0;
                    for (let ch of l) {
                        if (song.lyrics.toLowerCase().includes(ch)) matches++;
                    }
                    if (matches / Math.max(song.lyrics.length, l.length) > 0.6) {
                        const lyricsSim = stringSimilarity(song.lyrics, lyrics);
                        if (lyricsSim >= 0.8) return true;
                    }
                }
            }
            return false;
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

        function getVocalTags(genres) {
        return genres ? genres.filter(g => VOCAL_TAGS.includes(g)) : [];
        }
        function getNonVocalGenres(genres) {
            return genres ? genres.filter(g => !VOCAL_TAGS.includes(g)) : [];
        }

        function getVocalMatchScore(genres1, genres2) {
            const vocals1 = getVocalTags(genres1);
            const vocals2 = getVocalTags(genres2);
            return vocals1.length && vocals2.length ?
                vocals1.filter(v => vocals2.includes(v)).length / Math.max(vocals1.length, vocals2.length) : 0;
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
                    .filter(song => {
                        // If 'All Keys' or empty, show all
                        return !keyFilterValue || keyFilterValue === 'All Keys' || song.key === keyFilterValue;
                    })
                    .filter(song => {
                        // If 'All Genres' or empty, show all
                        return !genreFilterValue || genreFilterValue === 'All Genres' || (song.genres ? song.genres.includes(genreFilterValue) : song.genre === genreFilterValue);
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

            // Update visible song count below songs-section
            const visibleSongCountEl = document.getElementById('visibleSongCount');
            if (visibleSongCountEl) {
                visibleSongCountEl.textContent = `Songs displayed: ${songsToRender.length}`;
            }
            container.innerHTML = '';
            if (songsToRender.length === 0) {
                container.innerHTML = '<p>No songs found.</p>';
                return;
            }
            const activeSongId = songPreviewEl && songPreviewEl.dataset.songId ? parseInt(songPreviewEl.dataset.songId) : null;
            songsToRender.forEach(song => {
                const div = document.createElement('div');
                div.className = 'song-item';
                div.dataset.songId = song.id;
                if (activeSongId === song.id) {
                    div.classList.add('active-song');
                }
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
                    // Re-render songs to update active highlight
                    const activeTab = document.getElementById('NewTab').classList.contains('active') ? 'New' : 'Old';
                    renderSongs(activeTab, keyFilter.value, genreFilter.value);
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
                if (!bpm1 || !bpm2) return 0;
                const diff = Math.abs(bpm1 - bpm2);
                const score = 1 - Math.pow(diff / 35, 2);
                return Math.max(0, score);
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
                    genreMatch: 0,
                    vocalScore: 0
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

                // 7. Vocal tags match (move here!)
                details.vocalScore = getVocalMatchScore(
                    currentSong.genres || (currentSong.genre ? [currentSong.genre] : []),
                    song.genres || (song.genre ? [song.genre] : [])
                );
                score += WEIGHTS.vocal * details.vocalScore;

                return {
                    ...song,
                    matchScore: Math.min(Math.round(score), 100),
                    matchDetails: {
                        ...details,
                        languageScore: Math.round(details.languageScore * 100),
                        tempoSimilarity: Math.round(details.tempoSimilarity * 100),
                        genreMatch: Math.round(details.genreMatch * 100),
                        vocalScore: Math.round(details.vocalScore * 100)
                    }
                };
            });

            // Sort by priority
            return scoredSongs.sort((a, b) => b.matchScore - a.matchScore).slice(0, 20);
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
            // Favorite button event listener is attached after rendering preview HTML, not here.

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
                let currentLevel = parseInt(document.getElementById('transpose-level').textContent);
                currentLevel = isNaN(currentLevel) ? 0 : currentLevel;
                document.getElementById('transpose-level').textContent = currentLevel + 1;
                updatePreviewWithTransposition(currentLevel + 1);
            });

            document.getElementById('transpose-down')?.addEventListener('click', () => {
                let currentLevel = parseInt(document.getElementById('transpose-level').textContent);
                currentLevel = isNaN(currentLevel) ? 0 : currentLevel;
                document.getElementById('transpose-level').textContent = currentLevel - 1;
                updatePreviewWithTransposition(currentLevel - 1);
            });

            document.getElementById('transposeReset').addEventListener('click', () => {
                document.getElementById('transpose-level').textContent = 0;
                updatePreviewWithTransposition(0);
            });

            // Save transpose button event listener
            const saveTransposeBtn = document.getElementById('saveTransposeBtn');
            if (saveTransposeBtn) {
                saveTransposeBtn.addEventListener('click', async () => {
                    const level = parseInt(document.getElementById('transpose-level').textContent);
                    if (!currentUser || !currentUser.id || !song.id) {
                        showNotification('Login required to save transpose');
                        return;
                    }
                    // Calculate new key
                    const originalKey = song.key || '';
                    const newKey = transposeSingleChord(originalKey, level);
                    // Load userData first
                    let userData = {};
                    try {
                        const response = await authFetch(`${API_BASE_URL}/api/userdata`);
                        if (response.ok) {
                            userData = await response.json();
                        }
                    } catch (e) {}
                    if (!userData.transpose) userData.transpose = {};
                    userData.transpose[song.id] = level;
                    if (!userData.songKeys) userData.songKeys = {};
                    userData.songKeys[song.id] = newKey;
                    // Save to backend
                    let saveSuccess = false;
                    try {
                        const putResponse = await authFetch(`${API_BASE_URL}/api/userdata`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(userData)
                        });
                        if (putResponse.ok) {
                            showNotification('Transpose saved!');
                            song.key = newKey;
                            saveSuccess = true;
                        } else {
                            showNotification('Failed to save transpose');
                        }
                    } catch (e) {
                        showNotification('Network error saving transpose');
                    }
                    // Update localStorage cache immediately regardless of backend result
                    let localTranspose = {};
                    try {
                        localTranspose = JSON.parse(localStorage.getItem('transposeCache') || '{}');
                    } catch (e) { localTranspose = {}; }
                    localTranspose[song.id] = level;
                    localStorage.setItem('transposeCache', JSON.stringify(localTranspose));
                });
            }
            // Setup auto-scroll if needed
            setupAutoScroll();
        }
    
        async function showPreview(song, fromHistory = false) {
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

            // Use localStorage for transpose cache, update only on page refresh
            let transposeLevel = 0;
            let userData = {};
            let localTranspose = {};
            try {
                localTranspose = JSON.parse(localStorage.getItem('transposeCache') || '{}');
            } catch (e) { localTranspose = {}; }
            if (song.id && typeof localTranspose[song.id] === 'number') {
                transposeLevel = localTranspose[song.id];
            }
            // Fetch backend only if not found in localStorage
            if (currentUser && currentUser.id && song.id && typeof transposeLevel !== 'number') {
                try {
                    const response = await authFetch(`${API_BASE_URL}/api/userdata`);
                    if (response.ok) {
                        userData = await response.json();
                        window.userData = userData;
                        if (userData.transpose && song.id in userData.transpose && typeof userData.transpose[song.id] === 'number') {
                            transposeLevel = userData.transpose[song.id];
                        }
                    }
                } catch (e) {}
            }
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
            <span>Transpose: <span id="transpose-level">${transposeLevel}</span></span>
            <button class="btn btn-primary" id="transpose-up">+</button>
            <button id="transposeReset" class="btn btn-primary">Reset</button>
            <button id="saveTransposeBtn" class="btn btn-primary"><i class="fas fa-save"></i></button>
        </div>
        <div class="song-lyrics">${formatLyricsWithChords(song.lyrics, transposeLevel)}</div>
        <!-- Add these new swipe indicators -->
        <div class="swipe-indicator prev">←</div>
        <div class="swipe-indicator next">→</div>
    </div>
</div>
`;

            // Set the transpose-level element to the loaded value before attaching listeners
            document.getElementById('transpose-level').textContent = transposeLevel;
            // Attach all event listeners
            attachPreviewEventListeners(song);
            // Ensure transpose UI and lyrics are updated to the correct value
            updatePreviewWithTransposition(transposeLevel);
            
            // Reset navigation flag if this was a history navigation
            if (isNavigatingHistory) {
                setTimeout(() => { isNavigatingHistory = false; }, 100);
            }



            

        
            const previewFavBtn = document.getElementById('previewFavoriteBtn');
            if (previewFavBtn) {
                // Remove previous listener if any
                if (previewFavBtn._favListener) previewFavBtn.removeEventListener('click', previewFavBtn._favListener);
                previewFavBtn._favListener = () => {
                    toggleFavorite(song.id);
                };
                previewFavBtn.addEventListener('click', previewFavBtn._favListener);
            }
            
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
                        CHORD_REGEX,
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
            // Always get level from #transpose-level element
            let transposeLevel = parseInt(document.getElementById('transpose-level').textContent);
            transposeLevel = Math.max(-12, Math.min(12, isNaN(transposeLevel) ? 0 : transposeLevel));
            const lyrics = songPreviewEl.dataset.originalLyrics;
            document.getElementById('transpose-level').textContent = transposeLevel;
            const originalKey = songPreviewEl.dataset.originalKey;
            document.getElementById('current-key').textContent = transposeLevel === 0 ? originalKey : transposeChord(originalKey, transposeLevel);

            const lyricsContainer = document.querySelector('.song-lyrics');
            if (lyricsContainer) {
                lyricsContainer.innerHTML = formatLyricsWithChords(lyrics, transposeLevel);
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
            // Do NOT stop auto-scroll here!
            setTimeout(() => {
                isUserScrolling = false;
            }, 1000);
        }
    
        function addToSetlist(id) {
            if (!jwtToken) {
                showNotification('Please login to add songs to your setlist.');
                return;
            }
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
            if (!jwtToken) {
                showNotification('Please login to add songs to your favorites.');
                return;
            }
            const index = favorites.indexOf(id);
            const song = songs.find(s => s.id === id);
            let nowFavorite;
            if (index === -1) {
                favorites.push(id);
                nowFavorite = true;
            } else {
                favorites.splice(index, 1);
                nowFavorite = false;
            }
            showNotification(`"${song.title}" ${nowFavorite ? 'added to' : 'removed from'} favorites`);
            queueSaveUserData();
            const favButtons = document.querySelectorAll(`.favorite-btn[data-song-id="${id}"]`);
            favButtons.forEach(btn => {
                btn.classList.toggle('favorited', nowFavorite);
            });
            if (songPreviewEl.dataset.songId == id) {
                const previewBtn = document.getElementById('previewFavoriteBtn');
                if (previewBtn) {
                    previewBtn.classList.toggle('favorited', nowFavorite);
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
            // Populate Taal dropdown with correct options for the song's time signature and select the song's taal
            updateTaalDropdown('editSongTime', 'editSongTaal', song.taal);
            // Render correct genre options for multiselect
            renderGenreOptions('editGenreDropdown');
            setupGenreMultiselect('editSongGenre', 'editGenreDropdown', 'editSelectedGenres');
            // Set selected genres
            const genres = song.genres || (song.genre ? [song.genre] : []);
            const editSelectedGenres = document.getElementById('editSelectedGenres');
            editSelectedGenres.innerHTML = '';
            document.querySelectorAll('#editGenreDropdown .multiselect-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            genres.forEach(genre => {
                const options = document.querySelectorAll('#editGenreDropdown .multiselect-option');
                options.forEach(opt => {
                    if (opt.dataset.value === genre) {
                        opt.classList.add('selected');
                    }
                });
            });
            updateSelectedGenres('editSelectedGenres', 'editGenreDropdown');
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
                    parseInt(document.getElementById('weightGenre').value) || 0,
                    parseInt(document.getElementById('weightVocal').value) || 0
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
                'weightGenre',
                'weightVocal'
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
                        genre: parseInt(document.getElementById('weightGenre').value),
                        vocal: parseInt(document.getElementById('weightVocal').value)
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
                document.getElementById('weightVocal').value = WEIGHTS.vocal;
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
    

            
            document.getElementById('editSongGenre').addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('editGenreDropdown').classList.toggle('show');
            });
            

                        // Handle session reset based on settings

            // Disabled automatic reset on refresh/close to prevent loss of JWT and user data
            // If you want to allow a full reset, call resetApplicationState() explicitly from a button or menu
            
            
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
            if (newSongForm) {
                if (newSongForm._addListener) newSongForm.removeEventListener('submit', newSongForm._addListener);
                let addSongSubmitting = false;
                newSongForm._addListener = async function(e) {
                    e.preventDefault();
                    if (addSongSubmitting) return;
                    addSongSubmitting = true;
                    const title = document.getElementById('songTitle').value;
                    const lyrics = document.getElementById('songLyrics').value;
                    if (isDuplicateSong(title, lyrics)) {
                        showNotification('Duplicate song detected! Please check your title and lyrics.', 4000);
                        addSongSubmitting = false;
                        return;
                    }
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
                        const jwtToken = localStorage.getItem('jwtToken') || '';
                        const response = await fetch(`${API_BASE_URL}/api/songs`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${jwtToken}`
                            },
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
                    } finally {
                        addSongSubmitting = false;
                    }
                };
                newSongForm.addEventListener('submit', newSongForm._addListener);
            }
    
            editSongForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const id = document.getElementById('editSongId').value;
                const title = document.getElementById('editSongTitle').value;
                const lyrics = document.getElementById('editSongLyrics').value;

                const selectedGenres = Array.from(document.querySelectorAll('#editGenreDropdown .multiselect-option.selected'))
                    .map(opt => opt.dataset.value);

                // Find the original song for missing fields
                const original = songs.find(s => s.id == id) || {};
                const editSongLyrics = document.getElementById('editSongLyrics').value;
                const updatedSong = {
                    id: Number(id),
                    title: title,
                    category: document.getElementById('editSongCategory').value,
                    key: document.getElementById('editSongKey').value,
                    tempo: document.getElementById('editSongTempo').value,
                    time: document.getElementById('editSongTime').value,
                    taal: document.getElementById('editSongTaal').value,
                    genres: selectedGenres,
                    lyrics: lyrics,
                    editSongLyrics: editSongLyrics,
                    createdBy: original.createdBy || (currentUser && currentUser.username) || undefined,
                    createdAt: original.createdAt || new Date().toISOString()
                };

                try {
                    const response = await authFetch(`${API_BASE_URL}/api/songs/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updatedSong)
                    });
                    if (response.ok) {
                        // Fetch only the updated song from backend
                        const updatedSongRes = await authFetch(`${API_BASE_URL}/api/songs?id=${id}`);
                        let updated = null;
                        if (updatedSongRes.ok) {
                            const arr = await updatedSongRes.json();
                            updated = Array.isArray(arr) ? arr.find(s => s.id == id) : arr;
                        }
                        // Merge updated song into local cache and songs array
                        if (updated) {
                            let localSongs = JSON.parse(localStorage.getItem('songs') || '[]');
                            const idx = localSongs.findIndex(s => s.id == id);
                            if (idx !== -1) {
                                localSongs[idx] = updated;
                            } else {
                                localSongs.push(updated);
                            }
                            songs = localSongs;
                            localStorage.setItem('songs', JSON.stringify(songs));
                        }
                        showNotification('Song updated successfully!');
                        editSongModal.style.display = 'none';
                        editSongForm.reset();
                        // Render correct tab
                        if (updated) {
                            renderSongs(updated.category, keyFilter.value, genreFilter.value);
                            // If previewing this song, update preview
                            if (songPreviewEl.dataset.songId == id) {
                                showPreview(updated);
                            }
                        }
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
            //keepScreenOnBtn.addEventListener('click', toggleScreenWakeLock);
    
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
            settingsBtn.className = "sidebar-settings-btn"; // Optional: for styling

            const sidebar = document.querySelector(".sidebar");
            if (sidebar) {
                // Place at the bottom of sidebar
                sidebar.appendChild(settingsBtn);
            }
    
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
            applyTheme(isDarkMode);
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
                const pos = { top: el.style.top, left: el.style.left, right: el.style.right, bottom: el.style.bottom };
                localStorage.setItem(id + '-pos', JSON.stringify(pos));
            };

            const restorePosition = () => {
                const saved = localStorage.getItem(id + '-pos');
                if (saved) {
                    const pos = JSON.parse(saved);
                    el.style.top = pos.top || '';
                    el.style.left = pos.left || '';
                    el.style.right = pos.right || '';
                    el.style.bottom = pos.bottom || '';
                } else {
                    el.style.top = id === 'toggle-sidebar' ? '200px' :
                        id === 'toggle-songs' ? '260px' :
                        id === 'toggle-all-panels' ? '320px' : '200px';
                    el.style.left = '10px';
                    el.style.right = '';
                    el.style.bottom = '';
                }
            };

            // Snap to nearest edge
            function snapToEdge() {
            const rect = el.getBoundingClientRect();
            const winW = window.innerWidth;
            const winH = window.innerHeight;
            const gap = 15; // 10px gap from edge
            const distances = [
                { edge: 'left', value: rect.left },
                { edge: 'right', value: winW - rect.right },
                { edge: 'top', value: rect.top },
                { edge: 'bottom', value: winH - rect.bottom }
            ];
            distances.sort((a, b) => a.value - b.value);
            const nearest = distances[0].edge;

            // Reset all positions
            el.style.left = '';
            el.style.right = '';
            el.style.top = '';
            el.style.bottom = '';

            if (nearest === 'left') {
                el.style.left = gap + 'px';
                el.style.top = rect.top + 'px';
            } else if (nearest === 'right') {
                el.style.right = gap + 'px';
                el.style.top = rect.top + 'px';
            } else if (nearest === 'top') {
                el.style.top = gap + 'px';
                el.style.left = rect.left + 'px';
            } else if (nearest === 'bottom') {
                el.style.bottom = gap + 'px';
                el.style.left = rect.left + 'px';
            }
            savePosition();
        }

            const onMove = (clientX, clientY) => {
                let newLeft = clientX - offsetX;
                let newTop = clientY - offsetY;
                el.style.left = newLeft + 'px';
                el.style.top = newTop + 'px';
                el.style.right = '';
                el.style.bottom = '';
            };

            const onEnd = () => {
                isDragging = false;
                document.body.style.userSelect = '';
                snapToEdge();
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
                offsetX = touch.clientX - el.offsetLeft;
            }, { passive: false });

            el.addEventListener('touchmove', function (e) {
                if (isDragging) {
                    const touch = e.touches[0];
                    onMove(touch.clientX, touch.clientY);
                    e.preventDefault();
                }
            }, { passive: false });

            el.addEventListener('touchend', onEnd);

            // Snap to edge on window resize
            window.addEventListener('resize', snapToEdge);

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
    
        // --- Mobile edge swipe gesture logic ---
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;

        document.addEventListener('touchstart', function(e) {
            if (e.touches.length !== 1) return;
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchStartTime = Date.now();
        }, { passive: true });

        document.addEventListener('touchend', function(e) {
            if (e.changedTouches.length !== 1) return;
            const touch = e.changedTouches[0];
            const dx = touch.clientX - touchStartX;
            const dy = touch.clientY - touchStartY;
            const dt = Date.now() - touchStartTime;

            // Only trigger if swipe starts near left edge (within 30px)
            if (touchStartX < 30 && Math.abs(dx) > 60 && dt < 500) {
                // Swipe right from left edge
                if (dy < -40) {
                    // Swipe up: open home page from top
                    document.getElementById('showAll').click();
                } else if (dy > 40) {
                    // Swipe down: open song list from bottom
                    document.getElementById('showSetlist').click();
                }
            }
        }, { passive: true });

        async function resetUserPassword(userId) {
    console.log('Reset Password button clicked for user:', userId);
    const jwtToken = localStorage.getItem('jwtToken');
    try {
        const res = await fetch(`${API_BASE_URL}/api/users/${userId}/reset-password`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${jwtToken}`,
                'Content-Type': 'application/json'
            }
        });
        let msg;
        if (res.ok) {
            msg = 'Password reset to default (qwerty123)';
        } else {
            const data = await res.json().catch(() => ({}));
            msg = data.error ? `Failed: ${data.error}` : 'Failed to reset password';
        }
        showAdminNotification(msg);
    } catch (err) {
        showAdminNotification('Network error during password reset');
    }
}
window.resetUserPassword = resetUserPassword;
