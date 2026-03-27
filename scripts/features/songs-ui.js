(function attachSongsUI(window) {
    if (!window) {
        return;
    }

    let renderSongsTimeout = null;
    let lastRenderParams = null;

    function loadSongsFromFile(deps) {
        const getCache = deps && deps.getDataCache ? deps.getDataCache : () => window.dataCache || {};
        const setSongs = deps && deps.setSongs ? deps.setSongs : () => {};

        const cache = getCache();
        if (cache.songs && cache.songs.length > 0) {
            setSongs(cache.songs);
            return cache.songs;
        }

        setSongs([]);
        return [];
    }

    function updateSongCount(deps) {
        const getSongs = deps && deps.getSongs ? deps.getSongs : () => [];
        const currentSongs = getSongs();

        const totalSongsEl = document.getElementById('totalSongs');
        const newCountEl = document.getElementById('NewCount');
        const oldCountEl = document.getElementById('OldCount');

        if (totalSongsEl) totalSongsEl.textContent = currentSongs.length;
        if (newCountEl) newCountEl.textContent = currentSongs.filter((s) => s.category === 'New').length;
        if (oldCountEl) oldCountEl.textContent = currentSongs.filter((s) => s.category === 'Old').length;
    }

    function debouncedRenderSongs(categoryOrSongs, filterOrContainer, genreFilterValue, moodFilterValue, artistFilterValue, deps) {
        const currentParams = JSON.stringify([categoryOrSongs, filterOrContainer, genreFilterValue, moodFilterValue, artistFilterValue]);

        if (currentParams === lastRenderParams) {
            console.log('renderSongs skipped - identical parameters');
            return;
        }

        if (renderSongsTimeout) {
            clearTimeout(renderSongsTimeout);
        }

        renderSongsTimeout = setTimeout(function executeRender() {
            lastRenderParams = currentParams;
            renderSongs(categoryOrSongs, filterOrContainer, genreFilterValue, moodFilterValue, artistFilterValue, deps);
            renderSongsTimeout = null;
        }, 50);
    }

    function renderSongs(categoryOrSongs, filterOrContainer, genreFilterValue, moodFilterValue, artistFilterValue, deps) {
        const getSongs = deps.getSongs;
        const getFavorites = deps.getFavorites;
        const getSearchInput = deps.getSearchInput;
        const getSongPreviewEl = deps.getSongPreviewEl;
        const getCurrentSetlistType = deps.getCurrentSetlistType;
        const getCurrentSetlistId = deps.getCurrentSetlistId;
        const getGlobalSetlistTranspose = deps.getGlobalSetlistTranspose;
        const isSongInCurrentSetlist = deps.isSongInCurrentSetlist;
        const transposeChord = deps.transposeChord;
        const toggleFavorite = deps.toggleFavorite;
        const checkSongInSetlistAndToggle = deps.checkSongInSetlistAndToggle;
        const showNotification = deps.showNotification;
        const editSong = deps.editSong;
        const isAdmin = deps.isAdmin;
        const openDeleteSongModal = deps.openDeleteSongModal;
        const showPreview = deps.showPreview;
        const getCurrentFilterValues = deps.getCurrentFilterValues;

        const allSongs = getSongs();
        const favorites = getFavorites();
        const searchInput = getSearchInput();
        const songPreviewEl = getSongPreviewEl();

        let songsToRender;
        let container;

        if (typeof categoryOrSongs === 'string') {
            const category = categoryOrSongs;
            const keyFilterValue = filterOrContainer;

            songsToRender = allSongs
                .filter((song) => song.category === category)
                .filter((song) => !keyFilterValue || keyFilterValue === 'Key' || song.key === keyFilterValue)
                .filter((song) => !genreFilterValue || genreFilterValue === 'Genre' || (song.genres ? song.genres.includes(genreFilterValue) : song.genre === genreFilterValue))
                .filter((song) => !moodFilterValue || moodFilterValue === 'Mood' || song.mood === moodFilterValue)
                .filter((song) => !artistFilterValue || artistFilterValue === 'Artist' || song.artistDetails === artistFilterValue);

            const searchTerm = (searchInput && searchInput.value) ? searchInput.value.trim().toLowerCase() : '';
            if (searchTerm) {
                songsToRender.sort((a, b) => {
                    const aTitleMatch = a.title && a.title.toLowerCase().includes(searchTerm);
                    const bTitleMatch = b.title && b.title.toLowerCase().includes(searchTerm);

                    if (aTitleMatch === bTitleMatch) {
                        const aLyricsMatch = a.lyrics && a.lyrics.toLowerCase().includes(searchTerm);
                        const bLyricsMatch = b.lyrics && b.lyrics.toLowerCase().includes(searchTerm);
                        if (aLyricsMatch && !bLyricsMatch) return -1;
                        if (!aLyricsMatch && bLyricsMatch) return 1;
                        return 0;
                    }

                    return aTitleMatch ? -1 : 1;
                });
            }

            const sortValue = document.getElementById('sortFilter') ? document.getElementById('sortFilter').value : 'recent';
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
                songsToRender.sort((a, b) => {
                    if (a.createdAt && b.createdAt) return new Date(b.createdAt) - new Date(a.createdAt);
                    return (b.id || 0) - (a.id || 0);
                });
            }

            container = category === 'New' ? document.getElementById('NewContent') : document.getElementById('OldContent');
        } else {
            songsToRender = categoryOrSongs;
            container = filterOrContainer;
        }

        if (!container) {
            return;
        }

        const visibleSongCountEl = document.getElementById('visibleSongCount');
        if (visibleSongCountEl) {
            visibleSongCountEl.textContent = 'Songs displayed: ' + songsToRender.length;
        }

        const existingSongItems = container.querySelectorAll('.song-item');
        existingSongItems.forEach((item) => {
            const favBtn = item.querySelector('.favorite-btn');
            if (favBtn && favBtn._favListener) favBtn.removeEventListener('click', favBtn._favListener);

            const setlistBtn = item.querySelector('.toggle-setlist');
            if (setlistBtn && setlistBtn._setlistListener) setlistBtn.removeEventListener('click', setlistBtn._setlistListener);

            const editBtn = item.querySelector('.edit-song');
            if (editBtn && editBtn._editListener) editBtn.removeEventListener('click', editBtn._editListener);

            const deleteBtn = item.querySelector('.delete-song');
            if (deleteBtn && deleteBtn._deleteListener) deleteBtn.removeEventListener('click', deleteBtn._deleteListener);

            if (item._divListener) item.removeEventListener('click', item._divListener);
        });

        container.innerHTML = '';
        if (songsToRender.length === 0) {
            container.innerHTML = '<p>No songs found.</p>';
            return;
        }

        const activeSongId = songPreviewEl && songPreviewEl.dataset.songId ? parseInt(songPreviewEl.dataset.songId, 10) : null;

        songsToRender.forEach((song) => {
            const div = document.createElement('div');
            div.className = 'song-item';
            div.dataset.songId = song.id;
            if (activeSongId === song.id) {
                div.classList.add('active-song');
            }

            let isInSetlist = false;
            const selectedSetlistDropdown = document.getElementById('setlistDropdown');
            const selectedSetlist = selectedSetlistDropdown ? selectedSetlistDropdown.value : '';
            if (selectedSetlist) {
                isInSetlist = isSongInCurrentSetlist(song.id, selectedSetlist);
            }

            const isFavorite = Array.isArray(favorites) && favorites.includes(song.id);
            const displayGenres = song.genres ? song.genres.join(', ') : song.genre || '';

            let transposeLevel = 0;
            if (getCurrentSetlistType() === 'global-setlist' && getCurrentSetlistId() && song.id) {
                const globalSetlistTranspose = getGlobalSetlistTranspose();
                if (globalSetlistTranspose && typeof globalSetlistTranspose[song.id] === 'number') {
                    transposeLevel = globalSetlistTranspose[song.id];
                }
            } else {
                try {
                    const localTranspose = JSON.parse(localStorage.getItem('transposeCache') || '{}');
                    if (song.id && typeof localTranspose[song.id] === 'number') {
                        transposeLevel = localTranspose[song.id];
                    }
                } catch (e) {
                    transposeLevel = 0;
                }
            }

            const displayKey = transposeLevel !== 0 ? transposeChord(song.key, transposeLevel) : song.key;

            div.innerHTML = `
                <div class="song-header">
                    <span class="song-title">${song.title}</span>
                    <button class="favorite-btn ${isFavorite ? 'favorited' : ''}" data-song-id="${song.id}">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
                <div class="song-meta">${displayKey} | ${song.tempo} | ${song.time || song.timeSignature} | ${song.taal || ''} | ${displayGenres}</div>
                <div class="song-actions">
                    <button class="btn ${isInSetlist ? 'btn-delete' : 'btn-primary'} toggle-setlist">${isInSetlist ? 'Remove' : 'Add'}</button>
                    <button class="btn btn-edit edit-song">Edit</button>
                    <button class="btn btn-delete delete-song" style="display:none;">Delete</button>
                </div>
            `;

            const favoriteBtn = div.querySelector('.favorite-btn');
            const setlistBtn = div.querySelector('.toggle-setlist');
            const editBtn = div.querySelector('.edit-song');
            const deleteBtn = div.querySelector('.delete-song');

            const favListener = (e) => {
                e.stopPropagation();
                toggleFavorite(song.id);
            };
            favoriteBtn.addEventListener('click', favListener);
            favoriteBtn._favListener = favListener;

            const setlistListener = (e) => {
                e.stopPropagation();
                const songId = parseInt(div.dataset.songId, 10);
                const selectedSong = allSongs.find((s) => s.id === songId);
                if (!selectedSong) return;

                const selectedDropdown = document.getElementById('setlistDropdown');
                const selectedValue = selectedDropdown ? selectedDropdown.value : '';
                if (selectedValue) {
                    checkSongInSetlistAndToggle(songId, selectedValue);
                } else {
                    showNotification('Please select a setlist from the dropdown first');
                }
            };
            setlistBtn.addEventListener('click', setlistListener);
            setlistBtn._setlistListener = setlistListener;

            const editListener = (e) => {
                e.stopPropagation();
                editSong(song.id);
            };
            editBtn.addEventListener('click', editListener);
            editBtn._editListener = editListener;

            if (isAdmin()) {
                deleteBtn.style.display = '';
                const deleteListener = (e) => {
                    e.stopPropagation();
                    openDeleteSongModal(song.id);
                };
                deleteBtn.addEventListener('click', deleteListener);
                deleteBtn._deleteListener = deleteListener;
            }

            const divListener = () => {
                showPreview(song, false, 'all-songs');
                const activeTab = document.getElementById('NewTab').classList.contains('active') ? 'New' : 'Old';
                const filters = getCurrentFilterValues();
                renderSongs(activeTab, filters.key, filters.genre, filters.mood, filters.artist, deps);
                if (window.innerWidth <= 768) {
                    document.querySelector('.songs-section').classList.add('hidden');
                    document.querySelector('.sidebar').classList.add('hidden');
                    document.querySelector('.preview-section').classList.add('full-width');
                }
            };
            div.addEventListener('click', divListener);
            div._divListener = divListener;

            container.appendChild(div);
        });
    }

    window.SongsUI = {
        loadSongsFromFile,
        updateSongCount,
        debouncedRenderSongs,
        renderSongs
    };
})(window);
