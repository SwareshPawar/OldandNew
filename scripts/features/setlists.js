// scripts/features/setlists.js
// Phase 3E extraction: all setlist-related UI functions extracted from main.js.
// Exposes window.SetlistsUI.  All public functions accept deps as last argument.
// main.js retains compatibility wrappers that call window.SetlistsUI.*
(function attachSetlistsUI(window) {
    if (!window) return;

    // ─── Dropdown helpers ───────────────────────────────────────────────────

    function setupCustomDropdownHandlers(deps) {
        const dropdownArrow = document.getElementById('dropdownArrow');
        const dropdownMainArea = document.getElementById('dropdownMainArea');
        const dropdownMenu = document.getElementById('dropdownMenu');
        const customDropdown = document.querySelector('.custom-setlist-dropdown');

        if (!dropdownArrow || !dropdownMainArea || !dropdownMenu || !customDropdown) return;

        dropdownArrow.removeEventListener('click', _handleDropdownArrowClick);
        dropdownMainArea.removeEventListener('click', _handleDropdownMainAreaClick);

        dropdownArrow.addEventListener('click', (e) => handleDropdownArrowClick(e, deps));
        dropdownMainArea.addEventListener('click', (e) => handleDropdownMainAreaClick(e, deps));

        document.addEventListener('click', (e) => {
            if (!customDropdown.contains(e.target)) closeDropdownMenu();
        });

        dropdownMenu.addEventListener('click', (e) => {
            const opt = e.target.closest('.dropdown-option');
            if (opt) {
                selectDropdownOption(opt.dataset.value || '', opt.textContent, deps);
                closeDropdownMenu();
            }
        });
    }

    // Placeholder refs so removeEventListener calls don't error (stubs, actual logic is in-line above)
    function _handleDropdownArrowClick() {}
    function _handleDropdownMainAreaClick() {}

    function handleDropdownArrowClick(e, deps) {
        e.stopPropagation();
        const dropdownMenu = document.getElementById('dropdownMenu');
        const isOpen = dropdownMenu && dropdownMenu.style.display === 'block';
        if (isOpen) closeDropdownMenu(); else openDropdownMenu();
    }

    function handleDropdownMainAreaClick(e, deps) {
        e.stopPropagation();
        const setlistDropdown = document.getElementById('setlistDropdown');
        const selectedValue = setlistDropdown ? setlistDropdown.value : '';
        if (selectedValue && selectedValue !== '') {
            if (selectedValue.startsWith('global_')) {
                const setlistId = selectedValue.replace('global_', '');
                deps.setActiveSetlistElementId(setlistId);
                showGlobalSetlistInMainSection(setlistId, deps);
            } else if (selectedValue.startsWith('my_')) {
                const setlistId = selectedValue.replace('my_', '');
                deps.setActiveSetlistElementId(setlistId);
                showMySetlistInMainSection(setlistId, deps);
            }
        } else {
            deps.showNotification('Please select a setlist first', 'info');
        }
    }

    function openDropdownMenu() {
        const dropdownMenu = document.getElementById('dropdownMenu');
        const dropdownArrow = document.getElementById('dropdownArrow');
        if (dropdownMenu) dropdownMenu.style.display = 'block';
        if (dropdownArrow) dropdownArrow.style.transform = 'rotate(180deg)';
    }

    function closeDropdownMenu() {
        const dropdownMenu = document.getElementById('dropdownMenu');
        const dropdownArrow = document.getElementById('dropdownArrow');
        if (dropdownMenu) dropdownMenu.style.display = 'none';
        if (dropdownArrow) dropdownArrow.style.transform = 'rotate(0deg)';
    }

    function selectDropdownOption(value, text, deps) {
        const setlistDropdown = document.getElementById('setlistDropdown');
        if (!setlistDropdown) return;
        setlistDropdown.value = value;
        updateCustomDropdownDisplay(value);
        if (value && value !== '') {
            localStorage.setItem('selectedSetlist', value);
        } else {
            localStorage.removeItem('selectedSetlist');
        }
        updateSetlistDropdownStyle(!!value);
        setlistDropdown.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function updateCustomDropdownDisplay(value) {
        const dropdownText = document.getElementById('dropdownText');
        const setlistDropdown = document.getElementById('setlistDropdown');
        if (value && value !== '' && dropdownText && setlistDropdown) {
            const selectedOption = setlistDropdown.querySelector(`option[value="${value}"]`);
            if (selectedOption) {
                dropdownText.textContent = selectedOption.textContent;
                dropdownText.style.fontStyle = 'normal';
                dropdownText.style.color = '';
                return;
            }
        }
        if (dropdownText) {
            dropdownText.textContent = 'Select a Setlist';
            dropdownText.style.fontStyle = 'italic';
            dropdownText.style.color = '#aaa';
        }
    }

    function updateSetlistDropdownStyle(hasSelection) {
        const setlistDropdown = document.getElementById('setlistDropdown');
        if (!setlistDropdown) return;
        if (hasSelection) {
            setlistDropdown.style.backgroundColor = '#e8f5e8';
            setlistDropdown.style.border = '2px solid #28a745';
            setlistDropdown.style.fontWeight = 'bold';
        } else {
            setlistDropdown.style.backgroundColor = '';
            setlistDropdown.style.border = '';
            setlistDropdown.style.fontWeight = '';
        }
    }

    function populateSetlistDropdown(deps) {
        const setlistDropdown = document.getElementById('setlistDropdown');
        const dropdownMenu = document.getElementById('dropdownMenu');
        const dropdownText = document.getElementById('dropdownText');
        if (!setlistDropdown || !dropdownMenu || !dropdownText) return;

        const globalSetlists = deps.getGlobalSetlists();
        const mySetlists = deps.getMySetlists();
        const currentUser = deps.getCurrentUser();
        const currentSelection = setlistDropdown.value;

        setlistDropdown.innerHTML = '<option value="">Select a Setlist</option>';
        dropdownMenu.innerHTML = '';

        const hasGlobalData = globalSetlists && globalSetlists.length > 0;
        const hasMyData = mySetlists && mySetlists.length > 0;

        const defaultOption = document.createElement('div');
        defaultOption.className = 'dropdown-option';
        defaultOption.dataset.value = '';
        defaultOption.textContent = 'Select a Setlist';
        defaultOption.style.cssText = 'font-style: italic; color: #aaa;';
        dropdownMenu.appendChild(defaultOption);

        if (currentUser && hasMyData) {
            mySetlists.forEach(setlist => {
                const option = document.createElement('option');
                option.value = `my_${setlist._id}`;
                option.textContent = `${setlist.name} (My)`;
                setlistDropdown.appendChild(option);
                const customOption = document.createElement('div');
                customOption.className = 'dropdown-option';
                customOption.dataset.value = `my_${setlist._id}`;
                customOption.dataset.type = 'my';
                customOption.dataset.setlistId = setlist._id;
                customOption.innerHTML = `${setlist.name} <span style="color: #888; font-size: 0.85em; float: right;">(My)</span>`;
                dropdownMenu.appendChild(customOption);
            });
        }

        if (hasGlobalData) {
            globalSetlists.forEach(setlist => {
                const option = document.createElement('option');
                option.value = `global_${setlist._id}`;
                option.textContent = `${setlist.name} (Global)`;
                setlistDropdown.appendChild(option);
                const customOption = document.createElement('div');
                customOption.className = 'dropdown-option';
                customOption.dataset.value = `global_${setlist._id}`;
                customOption.dataset.type = 'global';
                customOption.dataset.setlistId = setlist._id;
                customOption.innerHTML = `${setlist.name} <span style="color: #888; font-size: 0.85em; float: right;">(Global)</span>`;
                dropdownMenu.appendChild(customOption);
            });
        }

        if (!hasGlobalData && (!currentUser || !hasMyData)) {
            const helpOption = document.createElement('option');
            helpOption.value = '';
            helpOption.disabled = true;
            helpOption.textContent = currentUser ? 'Create your first setlist to get started' : 'Login to create and access setlists';
            setlistDropdown.appendChild(helpOption);
            const helpCustomOption = document.createElement('div');
            helpCustomOption.className = 'dropdown-option';
            helpCustomOption.style.color = '#888';
            helpCustomOption.style.fontStyle = 'italic';
            helpCustomOption.textContent = helpOption.textContent;
            dropdownMenu.appendChild(helpCustomOption);
        }

        setupCustomDropdownHandlers(deps);

        if (currentSelection) {
            const exists = Array.from(setlistDropdown.options).some(o => o.value === currentSelection);
            if (exists) {
                setlistDropdown.value = currentSelection;
                updateCustomDropdownDisplay(currentSelection);
                updateSetlistDropdownStyle(true);
            }
        } else {
            const saved = localStorage.getItem('selectedSetlist');
            if (saved) {
                const exists = Array.from(setlistDropdown.options).some(o => o.value === saved);
                if (exists) {
                    setlistDropdown.value = saved;
                    updateCustomDropdownDisplay(saved);
                    updateSetlistDropdownStyle(true);
                }
            }
        }
    }

    // ─── Song-selection initializer (used in create/edit modals) ────────────

    function initializeSetlistSongSelection(prefix, deps) {
        const searchInput = document.getElementById(`${prefix}SetlistSongSearch`);
        const oldSongList = document.getElementById(`${prefix}OldSongSelectionList`);
        const newSongList = document.getElementById(`${prefix}NewSongSelectionList`);
        const selectAllOldCheckbox = document.getElementById(`${prefix}SelectAllOldSongs`);
        const selectAllNewCheckbox = document.getElementById(`${prefix}SelectAllNewSongs`);
        const selectedCountSpan = document.getElementById(`${prefix}SelectedCount`);
        const selectedOldCountSpan = document.getElementById(`${prefix}SelectedOldCount`);
        const selectedNewCountSpan = document.getElementById(`${prefix}SelectedNewCount`);
        const oldSongsTab = document.getElementById(`${prefix}OldSongsTab`);
        const newSongsTab = document.getElementById(`${prefix}NewSongsTab`);
        const oldSongsContent = document.getElementById(`${prefix}OldSongsContent`);
        const newSongsContent = document.getElementById(`${prefix}NewSongsContent`);
        const oldSongsCount = document.getElementById(`${prefix}OldSongsCount`);
        const newSongsCount = document.getElementById(`${prefix}NewSongsCount`);
        const keyFilter = document.getElementById(`${prefix}KeyFilter`);
        const genreFilter = document.getElementById(`${prefix}GenreFilter`);
        const moodFilter = document.getElementById(`${prefix}MoodFilter`);
        const artistFilter = document.getElementById(`${prefix}ArtistFilter`);

        if (!searchInput || !oldSongList || !newSongList || !selectAllOldCheckbox || !selectAllNewCheckbox ||
            !selectedCountSpan || !selectedOldCountSpan || !selectedNewCountSpan ||
            !oldSongsTab || !newSongsTab || !oldSongsContent || !newSongsContent) return;

        let selectedSongs = [];
        let filteredOldSongs = [];
        let filteredNewSongs = [];
        let currentFilters = { search: '', key: '', genre: '', mood: '', artist: '' };

        function initializeFilters() {
            [keyFilter, genreFilter, moodFilter, artistFilter].forEach(f => {
                if (f) while (f.options.length > 1) f.removeChild(f.lastChild);
            });
            const songs = deps.getSongs();
            if (keyFilter) {
                deps.KEYS.forEach(key => {
                    const opt = document.createElement('option');
                    opt.value = key; opt.textContent = key;
                    keyFilter.appendChild(opt);
                });
            }
            if (genreFilter) {
                const genres = [...new Set(songs.flatMap(s =>
                    typeof s.genre === 'string' ? s.genre.split(',').map(g => g.trim()) : []
                ))].sort();
                genres.forEach(g => {
                    const opt = document.createElement('option');
                    opt.value = g; opt.textContent = g;
                    genreFilter.appendChild(opt);
                });
            }
            if (moodFilter) {
                const moods = [...new Set(songs.flatMap(s =>
                    typeof s.mood === 'string' ? s.mood.split(',').map(m => m.trim()) : []
                ))].sort();
                moods.forEach(m => {
                    const opt = document.createElement('option');
                    opt.value = m; opt.textContent = m;
                    moodFilter.appendChild(opt);
                });
            }
            if (artistFilter) {
                const artists = [...new Set(songs.map(s => s.artist || s.originalArtist).filter(Boolean))].sort();
                artists.forEach(a => {
                    const opt = document.createElement('option');
                    opt.value = a; opt.textContent = a;
                    artistFilter.appendChild(opt);
                });
            }
        }

        function applyFilters(songsToFilter) {
            return songsToFilter.filter(song => {
                if (currentFilters.search) {
                    const text = `${song.title} ${song.artist || ''} ${song.originalArtist || ''}`.toLowerCase();
                    if (!text.includes(currentFilters.search.toLowerCase())) return false;
                }
                if (currentFilters.key && song.key !== currentFilters.key) return false;
                if (currentFilters.genre) {
                    const sg = typeof song.genre === 'string' ? song.genre.split(',').map(g => g.trim()) : [];
                    if (!sg.includes(currentFilters.genre)) return false;
                }
                if (currentFilters.mood) {
                    const sm = typeof song.mood === 'string' ? song.mood.split(',').map(m => m.trim()) : [];
                    if (!sm.includes(currentFilters.mood)) return false;
                }
                if (currentFilters.artist) {
                    if ((song.artist || song.originalArtist || '') !== currentFilters.artist) return false;
                }
                return true;
            });
        }

        function categorizeSongs() {
            const songs = deps.getSongs();
            filteredOldSongs = applyFilters(songs.filter(s => s.category === 'Old'));
            filteredNewSongs = applyFilters(songs.filter(s => s.category === 'New'));
            if (oldSongsCount) oldSongsCount.textContent = filteredOldSongs.length;
            if (newSongsCount) newSongsCount.textContent = filteredNewSongs.length;
            return { oldSongs: filteredOldSongs, newSongs: filteredNewSongs };
        }

        function filterAndDisplaySongs() {
            categorizeSongs();
            renderSongLists();
            updateSelectAllStates();
        }

        function renderSongLists() {
            renderSongList(oldSongList, filteredOldSongs, 'old');
            renderSongList(newSongList, filteredNewSongs, 'new');
        }

        function renderSongList(container, songList, category) {
            container.innerHTML = '';
            if (songList.length === 0) {
                container.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-secondary);">No ${category} songs found</div>`;
                return;
            }
            songList.forEach(song => {
                const songItem = document.createElement('div');
                songItem.className = 'song-checkbox-item';
                const isSelected = selectedSongs.includes(song.id);
                songItem.innerHTML = `
                    <input type="checkbox" id="${prefix}_${category}_song_${song.id}" ${isSelected ? 'checked' : ''}>
                    <div class="song-checkbox-details">
                        <div class="song-checkbox-title">${song.title}</div>
                        <div class="song-checkbox-artist">${song.artist || song.originalArtist || 'Unknown Artist'} | ${song.key || 'No Key'}</div>
                    </div>`;
                const checkbox = songItem.querySelector('input[type="checkbox"]');
                checkbox.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        if (!selectedSongs.includes(song.id)) selectedSongs.push(song.id);
                    } else {
                        selectedSongs = selectedSongs.filter(id => id !== song.id);
                    }
                    updateSelectedSongsDisplay();
                    updateSelectAllStates();
                });
                songItem.addEventListener('click', (e) => {
                    if (e.target.type !== 'checkbox') {
                        checkbox.checked = !checkbox.checked;
                        checkbox.dispatchEvent(new Event('change'));
                    }
                });
                container.appendChild(songItem);
            });
        }

        function updateSelectedSongsDisplay() {
            const songs = deps.getSongs();
            const selectedOldSongs = selectedSongs.filter(id => {
                const s = songs.find(s => s.id === id);
                return s && s.category === 'Old';
            });
            const selectedNewSongs = selectedSongs.filter(id => {
                const s = songs.find(s => s.id === id);
                return s && s.category === 'New';
            });
            selectedCountSpan.textContent = selectedSongs.length;
            selectedOldCountSpan.textContent = selectedOldSongs.length;
            selectedNewCountSpan.textContent = selectedNewSongs.length;

            const selectedOldSongsList = document.getElementById(`${prefix}SelectedOldSongsList`);
            const selectedNewSongsList = document.getElementById(`${prefix}SelectedNewSongsList`);
            if (selectedOldSongsList) selectedOldSongsList.innerHTML = '';
            if (selectedNewSongsList) selectedNewSongsList.innerHTML = '';

            function renderResequencableList(songIds, container, category) {
                songIds.forEach((songId, idx) => {
                    const song = songs.find(s => s.id === songId);
                    if (!song) return;
                    const selectedItem = document.createElement('div');
                    selectedItem.className = 'selected-song-item';
                    selectedItem.draggable = true;
                    selectedItem.dataset.songId = songId;
                    selectedItem.innerHTML = `
                        <div class="selected-song-title">${song.title}</div>
                        <div class="selected-song-artist">${song.artist || song.originalArtist || 'Unknown Artist'}</div>
                        <div class="selected-song-actions">
                            <button class="move-up-btn" title="Move Up" ${idx === 0 ? 'disabled' : ''}>&uarr;</button>
                            <button class="move-down-btn" title="Move Down" ${idx === songIds.length - 1 ? 'disabled' : ''}>&darr;</button>
                        </div>`;
                    selectedItem.querySelector('.move-up-btn').onclick = function () {
                        const arr = category === 'Old' ? selectedOldSongs : selectedNewSongs;
                        if (idx > 0) {
                            const temp = arr[idx - 1]; arr[idx - 1] = arr[idx]; arr[idx] = temp;
                            const mainIdx = selectedSongs.indexOf(arr[idx]);
                            const prevIdx = selectedSongs.indexOf(arr[idx - 1]);
                            if (mainIdx > -1 && prevIdx > -1) {
                                selectedSongs.splice(mainIdx, 1);
                                selectedSongs.splice(prevIdx, 0, arr[idx]);
                            }
                            updateSelectedSongsDisplay();
                        }
                    };
                    selectedItem.querySelector('.move-down-btn').onclick = function () {
                        const arr = category === 'Old' ? selectedOldSongs : selectedNewSongs;
                        if (idx < arr.length - 1) {
                            const temp = arr[idx + 1]; arr[idx + 1] = arr[idx]; arr[idx] = temp;
                            const mainIdx = selectedSongs.indexOf(arr[idx]);
                            const nextIdx = selectedSongs.indexOf(arr[idx + 1]);
                            if (mainIdx > -1 && nextIdx > -1) {
                                selectedSongs.splice(mainIdx, 1);
                                selectedSongs.splice(nextIdx, 0, arr[idx]);
                            }
                            updateSelectedSongsDisplay();
                        }
                    };
                    container.appendChild(selectedItem);
                });
                let dragSrcEl = null;
                container.addEventListener('dragstart', function (e) {
                    const item = e.target.closest('.selected-song-item');
                    if (!item) return;
                    dragSrcEl = item;
                    item.classList.add('dragging');
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', item.dataset.songId);
                });
                container.addEventListener('dragend', function () {
                    if (dragSrcEl) dragSrcEl.classList.remove('dragging');
                    dragSrcEl = null;
                });
                container.addEventListener('dragover', function (e) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    const item = e.target.closest('.selected-song-item');
                    if (item && item !== dragSrcEl) item.classList.add('drag-over');
                });
                container.addEventListener('dragleave', function (e) {
                    const item = e.target.closest('.selected-song-item');
                    if (item) item.classList.remove('drag-over');
                });
                container.addEventListener('drop', function (e) {
                    e.preventDefault();
                    const item = e.target.closest('.selected-song-item');
                    if (!item || !dragSrcEl || item === dragSrcEl) return;
                    item.classList.remove('drag-over');
                    const draggedId = dragSrcEl.dataset.songId;
                    const targetId = item.dataset.songId;
                    const arr = category === 'Old' ? selectedOldSongs : selectedNewSongs;
                    const oldIndex = arr.indexOf(draggedId);
                    const newIndex = arr.indexOf(targetId);
                    if (oldIndex > -1 && newIndex > -1) {
                        const [removed] = arr.splice(oldIndex, 1);
                        let insertAt = newIndex;
                        if (oldIndex < newIndex) insertAt = newIndex - 1;
                        arr.splice(insertAt, 0, removed);
                        const mainIdx = selectedSongs.indexOf(draggedId);
                        selectedSongs.splice(mainIdx, 1);
                        selectedSongs.splice(insertAt + (category === 'Old' ? 0 : selectedOldSongs.length), 0, draggedId);
                        updateSelectedSongsDisplay();
                    }
                });
            }

            if (selectedOldSongs.length > 0 && selectedOldSongsList) renderResequencableList(selectedOldSongs, selectedOldSongsList, 'Old');
            if (selectedNewSongs.length > 0 && selectedNewSongsList) renderResequencableList(selectedNewSongs, selectedNewSongsList, 'New');
        }

        function updateSelectAllStates() {
            const songs = deps.getSongs();
            updateSelectAllState(selectAllOldCheckbox, applyFilters(songs.filter(s => s.category === 'Old')), 'old');
            updateSelectAllState(selectAllNewCheckbox, applyFilters(songs.filter(s => s.category === 'New')), 'new');
        }

        function updateSelectAllState(checkbox, filteredSongs) {
            const ids = filteredSongs.map(s => s.id);
            const selected = selectedSongs.filter(id => ids.includes(id));
            if (filteredSongs.length === 0) {
                checkbox.checked = false; checkbox.indeterminate = false;
            } else if (selected.length === filteredSongs.length) {
                checkbox.checked = true; checkbox.indeterminate = false;
            } else if (selected.length > 0) {
                checkbox.checked = false; checkbox.indeterminate = true;
            } else {
                checkbox.checked = false; checkbox.indeterminate = false;
            }
        }

        function handleSelectAll(checkbox, filteredSongs) {
            const ids = filteredSongs.map(s => s.id);
            if (checkbox.checked) {
                ids.forEach(id => { if (!selectedSongs.includes(id)) selectedSongs.push(id); });
            } else {
                selectedSongs = selectedSongs.filter(id => !ids.includes(id));
            }
            updateSelectedSongsDisplay();
            renderSongLists();
            updateSelectAllStates();
        }

        selectAllOldCheckbox.addEventListener('change', (e) => handleSelectAll(e.target, filteredOldSongs));
        selectAllNewCheckbox.addEventListener('change', (e) => handleSelectAll(e.target, filteredNewSongs));
        searchInput.addEventListener('input', () => { currentFilters.search = searchInput.value.trim(); filterAndDisplaySongs(); });
        if (keyFilter) keyFilter.addEventListener('change', (e) => { currentFilters.key = e.target.value; filterAndDisplaySongs(); });
        if (genreFilter) genreFilter.addEventListener('change', (e) => { currentFilters.genre = e.target.value; filterAndDisplaySongs(); });
        if (moodFilter) moodFilter.addEventListener('change', (e) => { currentFilters.mood = e.target.value; filterAndDisplaySongs(); });
        if (artistFilter) artistFilter.addEventListener('change', (e) => { currentFilters.artist = e.target.value; filterAndDisplaySongs(); });

        function initializeTabs() {
            if (prefix === 'my') {
                const stab = document.getElementById('selectedSongsMainTab');
                const atab = document.getElementById('addSongsMainTab');
                const scont = document.getElementById('selectedSongsContent');
                const acont = document.getElementById('addSongsContent');
                if (stab && atab && scont && acont) {
                    stab.addEventListener('click', () => { stab.classList.add('active'); atab.classList.remove('active'); scont.classList.add('active'); acont.classList.remove('active'); });
                    atab.addEventListener('click', () => { atab.classList.add('active'); stab.classList.remove('active'); acont.classList.add('active'); scont.classList.remove('active'); });
                }
            } else if (prefix === 'global') {
                const stab = document.getElementById('globalSelectedSongsMainTab');
                const atab = document.getElementById('globalAddSongsMainTab');
                const scont = document.getElementById('globalSelectedSongsContent');
                const acont = document.getElementById('globalAddSongsContent');
                if (stab && atab && scont && acont) {
                    stab.addEventListener('click', () => { stab.classList.add('active'); atab.classList.remove('active'); scont.classList.add('active'); acont.classList.remove('active'); });
                    atab.addEventListener('click', () => { atab.classList.add('active'); stab.classList.remove('active'); acont.classList.add('active'); scont.classList.remove('active'); });
                }
            }
            if (oldSongsTab && newSongsTab && oldSongsContent && newSongsContent) {
                oldSongsTab.addEventListener('click', () => { oldSongsTab.classList.add('active'); newSongsTab.classList.remove('active'); oldSongsContent.classList.add('active'); newSongsContent.classList.remove('active'); });
                newSongsTab.addEventListener('click', () => { newSongsTab.classList.add('active'); oldSongsTab.classList.remove('active'); newSongsContent.classList.add('active'); oldSongsContent.classList.remove('active'); });
            }
            const soTab = document.getElementById(`${prefix}SelectedOldTab`);
            const snTab = document.getElementById(`${prefix}SelectedNewTab`);
            const soCont = document.getElementById(`${prefix}SelectedOldContent`);
            const snCont = document.getElementById(`${prefix}SelectedNewContent`);
            if (soTab && snTab && soCont && snCont) {
                soTab.addEventListener('click', () => { soTab.classList.add('active'); snTab.classList.remove('active'); soCont.classList.add('active'); snCont.classList.remove('active'); });
                snTab.addEventListener('click', () => { snTab.classList.add('active'); soTab.classList.remove('active'); snCont.classList.add('active'); soCont.classList.remove('active'); });
            }
        }

        initializeFilters();
        initializeTabs();
        filterAndDisplaySongs();

        return {
            getSelectedSongs: () => selectedSongs,
            setSelectedSongs: (songIds) => { selectedSongs = songIds || []; updateSelectedSongsDisplay(); filterAndDisplaySongs(); },
            clearSelection: () => {
                selectedSongs = [];
                updateSelectedSongsDisplay();
                filterAndDisplaySongs();
                if (searchInput) searchInput.value = '';
                currentFilters = { search: '', key: '', genre: '', mood: '', artist: '' };
                if (keyFilter) keyFilter.value = '';
                if (genreFilter) genreFilter.value = '';
                if (moodFilter) moodFilter.value = '';
                if (artistFilter) artistFilter.value = '';
            }
        };
    }

    // ─── Data loading ────────────────────────────────────────────────────────

    async function loadGlobalSetlists(forceRefresh = false, deps) {
        try {
            if (!forceRefresh && window.dataCache && window.dataCache['global-setlists']) {
                deps.setGlobalSetlists(window.dataCache['global-setlists']);
                return;
            }
            const res = await deps.cachedFetch(`${deps.API_BASE_URL}/api/global-setlists`, forceRefresh);
            if (res.ok) {
                deps.setGlobalSetlists(await res.json());
                populateSetlistDropdown(deps);
            }
        } catch (err) {
            console.error('Failed to load global setlists:', err);
        }
    }

    async function loadMySetlists(forceRefresh = false, deps) {
        if (!deps.getJwtToken()) return;
        try {
            if (!forceRefresh && window.dataCache && window.dataCache['my-setlists']) {
                deps.setMySetlists(window.dataCache['my-setlists']);
                return;
            }
            const res = await deps.cachedFetch(`${deps.API_BASE_URL}/api/my-setlists`, forceRefresh);
            if (res.ok) {
                deps.setMySetlists(await res.json());
                populateSetlistDropdown(deps);
            }
        } catch (err) {
            console.error('Failed to load my setlists:', err);
        }
    }

    async function refreshSetlistDataOnly(deps) {
        try {
            deps.invalidateCache(['global-setlists', 'my-setlists']);
            await loadGlobalSetlists(false, deps);
            if (deps.getJwtToken()) await loadMySetlists(false, deps);
            populateSetlistDropdown(deps);
            const currentViewingSetlist = deps.getCurrentViewingSetlist();
            const currentSetlistType = deps.getCurrentSetlistType();
            if (currentViewingSetlist) {
                if (currentSetlistType === 'global') {
                    const updated = deps.getGlobalSetlists().find(s => s._id === currentViewingSetlist._id);
                    if (updated) deps.setCurrentViewingSetlist(updated);
                } else if (currentSetlistType === 'my') {
                    const updated = deps.getMySetlists().find(s => s._id === currentViewingSetlist._id);
                    if (updated) deps.setCurrentViewingSetlist(updated);
                }
                renderSetlistSongs(deps);
                refreshSetlistDisplay(deps);
            }
            updateAllSetlistButtonStates(deps);
        } catch (error) {
            console.error('Error refreshing setlist data:', error);
        }
    }

    async function refreshSetlistDataAndUI(deps) {
        try {
            await loadGlobalSetlists(false, deps);
            if (deps.getJwtToken()) await loadMySetlists(false, deps);
            populateSetlistDropdown(deps);
            updateAllSetlistButtonStates(deps);
        } catch (error) {
            console.error('Error refreshing setlist data:', error);
        }
    }

    // ─── Button state helpers ────────────────────────────────────────────────

    function updateAllSetlistButtonStates(deps) {
        const setlistDropdown = document.getElementById('setlistDropdown');
        if (!setlistDropdown || !setlistDropdown.value) return;
        const selectedSetlistId = setlistDropdown.value;
        let currentSetlist = null;
        if (selectedSetlistId.startsWith('global_')) {
            currentSetlist = deps.getGlobalSetlists().find(s => s._id === selectedSetlistId.replace('global_', ''));
        } else if (selectedSetlistId.startsWith('my_')) {
            currentSetlist = deps.getMySetlists().find(s => s._id === selectedSetlistId.replace('my_', ''));
        }
        if (!currentSetlist || !currentSetlist.songs) return;
        deps.getSongs().forEach(song => {
            const isIn = currentSetlist.songs.some(ss => {
                if (typeof ss === 'object' && ss.id) return ss.id === song.id;
                return ss === song.id;
            });
            updateSetlistButtonState(song.id, isIn);
        });
    }

    function updateSetlistButtonState(songId, isInSetlist) {
        const songCards = document.querySelectorAll('.song-card');
        songCards.forEach(card => {
            const cardTitle = card.querySelector('.song-title')?.textContent;
            const previewSetlistBtn = card.querySelector('.preview-setlist-btn');
            if (previewSetlistBtn) {
                const cardTitleAttr = card.dataset.songId ? parseInt(card.dataset.songId) : null;
                if (cardTitleAttr === songId) {
                    previewSetlistBtn.textContent = isInSetlist ? 'Remove from Setlist' : 'Add to Setlist';
                    previewSetlistBtn.style.background = isInSetlist
                        ? 'linear-gradient(135deg, #dc3545, #c82333)'
                        : 'linear-gradient(135deg, #667eea, #764ba2)';
                }
            }
        });
        const songPreviewEl = document.getElementById('songPreview');
        if (songPreviewEl && songPreviewEl.dataset.songId) {
            const previewSongId = parseInt(songPreviewEl.dataset.songId);
            if (previewSongId === songId) {
                const previewSetlistBtn = document.getElementById('previewSetlistBtn');
                if (previewSetlistBtn) {
                    const icon = previewSetlistBtn.querySelector('i');
                    const span = previewSetlistBtn.querySelector('span');
                    previewSetlistBtn.className = 'preview-action-btn preview-setlist-btn';
                    if (isInSetlist) {
                        previewSetlistBtn.classList.add('remove');
                        if (icon) icon.className = 'fas fa-check';
                        if (span) span.textContent = 'In Setlist';
                    } else {
                        previewSetlistBtn.classList.add('add');
                        if (icon) icon.className = 'fas fa-plus';
                        if (span) span.textContent = 'Add to Setlist';
                    }
                }
            }
        }
        const songItems = document.querySelectorAll('.song-item');
        songItems.forEach(item => {
            if (parseInt(item.dataset.songId) === songId) {
                const btn = item.querySelector('.setlist-btn') || item.querySelector('.toggle-setlist');
                if (btn) {
                    if (isInSetlist) {
                        btn.textContent = 'Remove';
                        btn.className = btn.classList.contains('toggle-setlist') ? 'btn btn-delete toggle-setlist' : 'setlist-btn remove-from-setlist';
                    } else {
                        btn.textContent = 'Add';
                        btn.className = btn.classList.contains('toggle-setlist') ? 'btn btn-primary toggle-setlist' : 'setlist-btn add-to-setlist';
                    }
                }
            }
        });
    }

    function updatePreviewSetlistButton(isInSetlist) {
        const previewBtn = document.getElementById('previewSetlistBtn');
        if (!previewBtn) return;
        const icon = previewBtn.querySelector('i');
        const span = previewBtn.querySelector('span');
        previewBtn.className = 'preview-action-btn preview-setlist-btn';
        if (isInSetlist) {
            previewBtn.classList.add('remove');
            if (icon) icon.className = 'fas fa-minus';
            if (span) span.textContent = 'Remove from Setlist';
        } else {
            previewBtn.classList.add('add');
            if (icon) icon.className = 'fas fa-plus';
            if (span) span.textContent = 'Add to Setlist';
        }
        previewBtn.offsetHeight;
    }

    // ─── Description helpers ─────────────────────────────────────────────────

    function showSetlistDescription(setlist, type) {
        let containerId, textId;
        if (type === 'global') { containerId = 'globalSetlistDescriptionContainer'; textId = 'globalSetlistDescriptionText'; }
        else if (type === 'my') { containerId = 'mySetlistDescriptionContainer'; textId = 'mySetlistDescriptionText'; }
        else if (type === 'smart') { containerId = 'smartSetlistDescriptionContainer'; textId = 'smartSetlistDescriptionText'; }
        const container = document.getElementById(containerId);
        const textEl = document.getElementById(textId);
        if (container && textEl && setlist.description) {
            textEl.textContent = setlist.description;
            container.style.display = 'block';
        }
    }

    function hideSetlistDescription(type) {
        let containerId;
        if (type === 'global') containerId = 'globalSetlistDescriptionContainer';
        else if (type === 'my') containerId = 'mySetlistDescriptionContainer';
        else if (type === 'smart') containerId = 'smartSetlistDescriptionContainer';
        const container = document.getElementById(containerId);
        if (container) container.style.display = 'none';
    }

    function showDropdownSetlistDescription(setlistId, deps) {
        const container = document.getElementById('setlistDescriptionContainer');
        const textEl = document.getElementById('setlistDescriptionText');
        if (!container || !textEl) return;
        if (!setlistId) { container.style.display = 'none'; return; }
        let setlist = null;
        if (setlistId.startsWith('global_')) {
            setlist = deps.getGlobalSetlists().find(s => s._id === setlistId.replace('global_', ''));
        } else if (setlistId.startsWith('my_')) {
            setlist = deps.getMySetlists().find(s => s._id === setlistId.replace('my_', ''));
        }
        if (setlist && setlist.description) {
            textEl.textContent = setlist.description;
            container.style.display = 'block';
        } else {
            container.style.display = 'none';
        }
    }

    // ─── Generic setlist renderer ────────────────────────────────────────────

    async function renderSetlists(config, deps) {
        const {
            contentElementId, dataArray, dataType, loadFunction, emptyMessage, icon,
            showHandler, editHandler, deleteHandler, refreshHandler, descriptionHideTypes,
            checkPermissions, enableMobileTouch, logPrefix
        } = config;

        const content = document.getElementById(contentElementId);
        if (!content) {
            if (logPrefix) console.warn(`${logPrefix} ${contentElementId} element not found`);
            return;
        }
        if (loadFunction) await loadFunction(true, deps);
        if (logPrefix) console.log(`${logPrefix} Rendering ${dataArray.length} setlists in sidebar`);
        content.innerHTML = '';

        if (dataArray.length === 0) {
            const message = typeof emptyMessage === 'function' ? emptyMessage() : emptyMessage;
            const testMsg = document.createElement('li');
            testMsg.innerHTML = `<div style="padding: 10px; color: #888; font-style: italic;">${message}</div>`;
            content.appendChild(testMsg);
            return;
        }

        dataArray.forEach(setlist => {
            const li = document.createElement('li');
            const setlistId = setlist.id || setlist._id;
            let canEdit = true, showActions = true;
            if (checkPermissions) {
                const p = checkPermissions(setlist);
                canEdit = p.canEdit; showActions = p.showActions;
            }
            let actionsHTML = '';
            if (refreshHandler) {
                actionsHTML += `<button class="setlist-action-btn smart-refresh-btn" title="Update Setlist - Rescan and save with current conditions"><i class="fas fa-sync"></i></button>`;
            }
            actionsHTML += `
                <button class="setlist-action-btn edit-setlist" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="setlist-action-btn delete-setlist" title="Delete"><i class="fas fa-trash"></i></button>`;
            const itemClass = dataType === 'smart' ? 'smart-setlist-header' : '';
            const wrapperStart = itemClass ? `<div class="${itemClass}">` : '';
            const wrapperEnd = itemClass ? '</div>' : '';
            const actionsClass = dataType === 'smart' ? 'smart-setlist-actions' : 'setlist-actions';
            li.innerHTML = `
                <div class="setlist-item" data-setlist-id="${setlistId}" data-type="${dataType}">
                    ${wrapperStart}<i class="fas ${icon}"></i><span>${setlist.name}</span>${wrapperEnd}
                    <div class="${actionsClass}" style="display: ${showActions ? 'flex' : 'none'};">${actionsHTML}</div>
                </div>`;
            content.appendChild(li);
        });

        content.querySelectorAll('.setlist-item').forEach(item => {
            const setlistId = item.dataset.setlistId;
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.setlist-actions') && !e.target.closest('.smart-setlist-actions')) {
                    if (logPrefix) console.log(`${logPrefix} Setlist clicked:`, setlistId);
                    deps.setActiveSetlistElementId(setlistId);
                    showHandler(setlistId, deps);
                    const setlist = dataArray.find(s => (s.id || s._id) === setlistId);
                    if (setlist) {
                        descriptionHideTypes.forEach(type => hideSetlistDescription(type));
                        showSetlistDescription(setlist, dataType);
                    }
                }
            });
            if (enableMobileTouch) {
                item.addEventListener('touchstart', () => {
                    item.style.transform = 'scale(0.98)';
                    setTimeout(() => { item.style.transform = ''; }, 100);
                }, { passive: true });
            }
            item.querySelector('.edit-setlist')?.addEventListener('click', (e) => { e.stopPropagation(); editHandler(setlistId, deps); });
            item.querySelector('.delete-setlist')?.addEventListener('click', (e) => { e.stopPropagation(); deleteHandler(setlistId, deps); });
            if (refreshHandler) {
                item.querySelector('.smart-refresh-btn')?.addEventListener('click', (e) => { e.stopPropagation(); refreshHandler(setlistId); });
            }
            item.querySelector('.resequence-setlist')?.addEventListener('click', (e) => {
                e.stopPropagation();
                window.setlistResequenceMode = true;
                showHandler(setlistId, deps);
            });
        });
    }

    async function renderGlobalSetlists(deps) {
        await renderSetlists({
            contentElementId: 'globalSetlistContent',
            dataArray: deps.getGlobalSetlists(),
            dataType: 'global',
            loadFunction: loadGlobalSetlists,
            emptyMessage: 'No global setlists available',
            icon: 'fa-list',
            showHandler: showGlobalSetlistInMainSection,
            editHandler: editGlobalSetlist,
            deleteHandler: deleteGlobalSetlist,
            descriptionHideTypes: ['my']
        }, deps);
    }

    async function renderMySetlists(deps) {
        await renderSetlists({
            contentElementId: 'mySetlistContent',
            dataArray: deps.getMySetlists(),
            dataType: 'my',
            loadFunction: loadMySetlists,
            emptyMessage: () => deps.getJwtToken() ? 'No personal setlists created' : 'Login to create your setlists',
            icon: 'fa-list',
            showHandler: showMySetlistInMainSection,
            editHandler: editMySetlist,
            deleteHandler: deleteMySetlist,
            descriptionHideTypes: ['global']
        }, deps);
    }

    // ─── Show setlists in main section ───────────────────────────────────────

    function showGlobalSetlistInMainSection(setlistId, deps) {
        const setlist = deps.getGlobalSetlists().find(s => s._id === setlistId);
        if (!setlist) return;
        deps.setCurrentViewingSetlist(setlist);
        deps.setCurrentSetlistType('global');

        const setlistHeader = document.getElementById('setlistViewHeader');
        if (setlistHeader) setlistHeader.textContent = setlist.name;

        const setlistSectionActions = document.getElementById('setlistSectionActions');
        if (setlistSectionActions) {
            setlistSectionActions.style.display = 'flex';
            setlistSectionActions.innerHTML = `
                <button onclick="goBackToSidebar(event)" class="btn btn-secondary setlist-action-btn" title="Back to Menu" aria-label="Back to Menu"><i class="fas fa-arrow-left"></i></button>
                <button id="editSetlistSectionBtn" class="btn btn-secondary setlist-action-btn" title="Edit Setlist" aria-label="Edit Setlist"><i class="fas fa-edit"></i></button>
                <button id="deleteSetlistSectionBtn" class="btn btn-danger setlist-action-btn" title="Delete Setlist" aria-label="Delete Setlist"><i class="fas fa-trash"></i></button>
                <button id="resequenceSetlistSectionBtn" class="btn btn-primary setlist-action-btn" title="Resequence Songs" aria-label="Resequence Setlist"><i class="fas fa-random"></i></button>
                <button id="saveSetlistSequenceBtn" class="btn btn-success setlist-action-btn" style="display:none;" title="Save New Sequence" aria-label="Save Sequence"><i class="fas fa-save"></i> Save Sequence</button>`;
            const editBtn = document.getElementById('editSetlistSectionBtn');
            const delBtn = document.getElementById('deleteSetlistSectionBtn');
            const reseqBtn = document.getElementById('resequenceSetlistSectionBtn');
            const canEdit = deps.getCurrentUser()?.isAdmin;
            if (editBtn && delBtn) {
                editBtn.style.opacity = canEdit ? '1' : '0.5';
                delBtn.style.opacity = canEdit ? '1' : '0.5';
                editBtn.style.cursor = canEdit ? 'pointer' : 'not-allowed';
                delBtn.style.cursor = canEdit ? 'pointer' : 'not-allowed';
                if (canEdit) {
                    editBtn.onclick = () => editGlobalSetlist(setlistId, deps);
                    delBtn.onclick = () => deleteGlobalSetlist(setlistId, deps);
                }
            }
            if (reseqBtn) {
                reseqBtn.onclick = async function () {
                    if (!deps.getCurrentViewingSetlist()) { deps.showNotification('No setlist is currently loaded', 'error'); return; }
                    if (!window.setlistResequenceMode) {
                        window.setlistResequenceMode = true;
                        reseqBtn.innerHTML = '<i class="fas fa-save"></i> Save Sequence';
                        refreshSetlistDisplay(deps);
                    } else {
                        const cvs = deps.getCurrentViewingSetlist();
                        await deps.authFetch(`${deps.API_BASE_URL}/api/global-setlists/${cvs._id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name: cvs.name, description: cvs.description, songs: cvs.songs })
                        });
                        window.setlistResequenceMode = false;
                        reseqBtn.innerHTML = '<i class="fas fa-random"></i>';
                        refreshSetlistDisplay(deps);
                        deps.showNotification('Setlist sequence saved!', 'success');
                    }
                };
            }
        }

        clearSetlistSelections();
        const NewContent = document.getElementById('NewContent');
        const OldContent = document.getElementById('OldContent');
        const setlistSection = document.getElementById('setlistSection');
        const deleteSection = document.getElementById('deleteSection');
        const favoritesSection = document.getElementById('favoritesSection');
        if (NewContent) NewContent.classList.remove('active');
        if (OldContent) OldContent.classList.remove('active');
        if (setlistSection) setlistSection.style.display = 'block';
        if (deleteSection) deleteSection.style.display = 'none';
        if (favoritesSection) favoritesSection.style.display = 'none';

        document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
        const dropdown = document.getElementById('setlistDropdown');
        if (dropdown && !window.updatingFromFolderNav) {
            window.updatingFromFolderNav = true;
            selectDropdownOption(`global_${setlistId}`, setlist.name, deps);
            showDropdownSetlistDescription(`global_${setlistId}`, deps);
            setTimeout(() => { window.updatingFromFolderNav = false; }, 100);
        }

        const setlistSongs = setlist.songs.map(item => {
            if (typeof item === 'object' && item !== null) return item;
            const itemId = typeof item === 'string' ? parseInt(item) : item;
            return deps.getSongs().find(s => s.id === itemId) || null;
        }).filter(Boolean);

        const newSongs = setlistSongs.filter(s => s.category === 'New');
        const oldSongs = setlistSongs.filter(s => s.category === 'Old');
        const NewSetlistTab = document.getElementById('NewSetlistTab');
        const OldSetlistTab = document.getElementById('OldSetlistTab');
        const NewSetlistSongs = document.getElementById('NewSetlistSongs');
        const OldSetlistSongs = document.getElementById('OldSetlistSongs');
        if (NewSetlistTab) NewSetlistTab.textContent = `New (${newSongs.length})`;
        if (OldSetlistTab) OldSetlistTab.textContent = `Old (${oldSongs.length})`;
        if (newSongs.length > 0) {
            if (NewSetlistTab) NewSetlistTab.classList.add('active');
            if (OldSetlistTab) OldSetlistTab.classList.remove('active');
            if (NewSetlistSongs) NewSetlistSongs.style.display = 'block';
            if (OldSetlistSongs) OldSetlistSongs.style.display = 'none';
        } else {
            if (NewSetlistTab) NewSetlistTab.classList.remove('active');
            if (OldSetlistTab) OldSetlistTab.classList.add('active');
            if (NewSetlistSongs) NewSetlistSongs.style.display = 'none';
            if (OldSetlistSongs) OldSetlistSongs.style.display = 'block';
        }
        if (NewSetlistSongs) displaySetlistSongs(newSongs, NewSetlistSongs, 'global-setlist', deps);
        if (OldSetlistSongs) displaySetlistSongs(oldSongs, OldSetlistSongs, 'global-setlist', deps);
        if (NewSetlistTab) NewSetlistTab.onclick = () => { NewSetlistTab.classList.add('active'); OldSetlistTab.classList.remove('active'); NewSetlistSongs.style.display = 'block'; OldSetlistSongs.style.display = 'none'; };
        if (OldSetlistTab) OldSetlistTab.onclick = () => { OldSetlistTab.classList.add('active'); NewSetlistTab.classList.remove('active'); OldSetlistSongs.style.display = 'block'; NewSetlistSongs.style.display = 'none'; };

        if (window.innerWidth <= 768) {
            document.querySelector('.songs-section')?.classList.remove('hidden');
            document.querySelector('.sidebar')?.classList.add('hidden');
            document.querySelector('.preview-section')?.classList.remove('full-width');
        }
    }

    function showMySetlistInMainSection(setlistId, deps) {
        const setlist = deps.getMySetlists().find(s => s._id === setlistId);
        if (!setlist) return;
        deps.setCurrentViewingSetlist(setlist);
        deps.setCurrentSetlistType('my');

        const setlistHeader = document.getElementById('setlistViewHeader');
        if (setlistHeader) setlistHeader.textContent = setlist.name;

        const setlistSectionActions = document.getElementById('setlistSectionActions');
        if (setlistSectionActions) {
            setlistSectionActions.style.display = 'flex';
            setlistSectionActions.innerHTML = `
                <button onclick="goBackToSidebar(event)" class="btn btn-secondary setlist-action-btn" title="Back to Menu" aria-label="Back to Menu"><i class="fas fa-arrow-left"></i></button>
                <button id="editSetlistSectionBtn" class="btn btn-secondary setlist-action-btn" title="Edit Setlist" aria-label="Edit Setlist"><i class="fas fa-edit"></i></button>
                <button id="deleteSetlistSectionBtn" class="btn btn-danger setlist-action-btn" title="Delete Setlist" aria-label="Delete Setlist"><i class="fas fa-trash"></i></button>
                <button id="resequenceSetlistSectionBtn" class="btn btn-primary setlist-action-btn" title="Resequence Songs" aria-label="Resequence Setlist"><i class="fas fa-random"></i></button>
                <button id="saveSetlistSequenceBtn" class="btn btn-success setlist-action-btn" style="display:none;" title="Save New Sequence" aria-label="Save Sequence"><i class="fas fa-save"></i> Save Sequence</button>`;
            const editBtn = document.getElementById('editSetlistSectionBtn');
            const delBtn = document.getElementById('deleteSetlistSectionBtn');
            const reseqBtn = document.getElementById('resequenceSetlistSectionBtn');
            if (editBtn && delBtn) {
                editBtn.style.opacity = '1'; delBtn.style.opacity = '1';
                editBtn.style.cursor = 'pointer'; delBtn.style.cursor = 'pointer';
                editBtn.onclick = () => editMySetlist(setlistId, deps);
                delBtn.onclick = () => deleteMySetlist(setlistId, deps);
            }
            if (reseqBtn) {
                reseqBtn.onclick = async function () {
                    if (!deps.getCurrentViewingSetlist()) { deps.showNotification('No setlist is currently loaded', 'error'); return; }
                    if (!window.setlistResequenceMode) {
                        window.setlistResequenceMode = true;
                        reseqBtn.innerHTML = '<i class="fas fa-save"></i> Save Sequence';
                        refreshSetlistDisplay(deps);
                    } else {
                        const cvs = deps.getCurrentViewingSetlist();
                        await deps.authFetch(`${deps.API_BASE_URL}/api/my-setlists/${cvs._id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name: cvs.name, description: cvs.description, songs: cvs.songs })
                        });
                        window.setlistResequenceMode = false;
                        reseqBtn.innerHTML = '<i class="fas fa-random"></i>';
                        refreshSetlistDisplay(deps);
                        deps.showNotification('Setlist sequence saved!', 'success');
                    }
                };
            }
        }

        clearSetlistSelections();
        const NewContent = document.getElementById('NewContent');
        const OldContent = document.getElementById('OldContent');
        const setlistSection = document.getElementById('setlistSection');
        const deleteSection = document.getElementById('deleteSection');
        const favoritesSection = document.getElementById('favoritesSection');
        if (NewContent) NewContent.classList.remove('active');
        if (OldContent) OldContent.classList.remove('active');
        if (setlistSection) setlistSection.style.display = 'block';
        if (deleteSection) deleteSection.style.display = 'none';
        if (favoritesSection) favoritesSection.style.display = 'none';

        document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
        const dropdown = document.getElementById('setlistDropdown');
        if (dropdown && !window.updatingFromFolderNav) {
            window.updatingFromFolderNav = true;
            selectDropdownOption(`my_${setlistId}`, setlist.name, deps);
            showDropdownSetlistDescription(`my_${setlistId}`, deps);
            setTimeout(() => { window.updatingFromFolderNav = false; }, 100);
        }

        const setlistSongs = setlist.songs.map(item => {
            if (typeof item === 'object' && item !== null) return item;
            const itemId = typeof item === 'string' ? parseInt(item) : item;
            return deps.getSongs().find(s => s.id === itemId) || null;
        }).filter(Boolean);

        const newSongs = setlistSongs.filter(s => s.category === 'New');
        const oldSongs = setlistSongs.filter(s => s.category === 'Old');
        const NewSetlistTab = document.getElementById('NewSetlistTab');
        const OldSetlistTab = document.getElementById('OldSetlistTab');
        const NewSetlistSongs = document.getElementById('NewSetlistSongs');
        const OldSetlistSongs = document.getElementById('OldSetlistSongs');
        if (NewSetlistTab) NewSetlistTab.textContent = `New (${newSongs.length})`;
        if (OldSetlistTab) OldSetlistTab.textContent = `Old (${oldSongs.length})`;
        if (newSongs.length > 0) {
            if (NewSetlistTab) NewSetlistTab.classList.add('active');
            if (OldSetlistTab) OldSetlistTab.classList.remove('active');
            if (NewSetlistSongs) NewSetlistSongs.style.display = 'block';
            if (OldSetlistSongs) OldSetlistSongs.style.display = 'none';
        } else {
            if (NewSetlistTab) NewSetlistTab.classList.remove('active');
            if (OldSetlistTab) OldSetlistTab.classList.add('active');
            if (NewSetlistSongs) NewSetlistSongs.style.display = 'none';
            if (OldSetlistSongs) OldSetlistSongs.style.display = 'block';
        }
        if (NewSetlistSongs) displaySetlistSongs(newSongs, NewSetlistSongs, 'user-setlist', deps);
        if (OldSetlistSongs) displaySetlistSongs(oldSongs, OldSetlistSongs, 'user-setlist', deps);
        if (NewSetlistTab) NewSetlistTab.onclick = () => { NewSetlistTab.classList.add('active'); OldSetlistTab.classList.remove('active'); NewSetlistSongs.style.display = 'block'; OldSetlistSongs.style.display = 'none'; };
        if (OldSetlistTab) OldSetlistTab.onclick = () => { OldSetlistTab.classList.add('active'); NewSetlistTab.classList.remove('active'); OldSetlistSongs.style.display = 'block'; NewSetlistSongs.style.display = 'none'; };

        if (window.innerWidth <= 768) {
            document.querySelector('.songs-section')?.classList.remove('hidden');
            document.querySelector('.sidebar')?.classList.add('hidden');
            document.querySelector('.preview-section')?.classList.remove('full-width');
        }
    }

    // ─── Display songs inside a setlist ──────────────────────────────────────

    function displaySetlistSongs(songs, container, context = 'user-setlist', deps) {
        container.innerHTML = '';
        const isResequenceMode = !!window.setlistResequenceMode;
        if (!songs || songs.length === 0) {
            container.innerHTML = '<p class="setlist-empty-message">This setlist is empty.</p>';
            return;
        }
        const ul = document.createElement('ul');
        ul.className = 'setlist-songs-list';

        songs.forEach((song, index) => {
            if (!song) return;
            let currentUserInFunction = null;
            try { currentUserInFunction = JSON.parse(localStorage.getItem('currentUser') || '{}'); }
            catch (e) { currentUserInFunction = {}; }

            let transposeLevel = 0;
            const currentSetlistType = deps.getCurrentSetlistType();
            const currentViewingSetlist = deps.getCurrentViewingSetlist();
            if (currentSetlistType === 'global' && currentViewingSetlist && currentViewingSetlist.songTransposes && song.id in currentViewingSetlist.songTransposes) {
                transposeLevel = currentViewingSetlist.songTransposes[song.id] || 0;
            } else {
                try {
                    const lt = JSON.parse(localStorage.getItem('transposeCache') || '{}');
                    if (song.id && typeof lt[song.id] === 'number') transposeLevel = lt[song.id];
                    else if (window.userData?.transpose && song.id in window.userData.transpose) transposeLevel = window.userData.transpose[song.id] || 0;
                } catch (e) { transposeLevel = 0; }
            }

            const distinctChords = deps.extractDistinctChords(song.lyrics, transposeLevel, song.manualChords);
            const chordsDisplay = distinctChords.length > 0 ? distinctChords.join(', ') : '';

            const li = document.createElement('li');
            li.className = 'setlist-song-item';
            li.dataset.songId = song.id;
            if (isResequenceMode) {
                li.setAttribute('draggable', 'true');
            } else if (currentSetlistType !== 'global' || (currentUserInFunction && currentUserInFunction.isAdmin)) {
                li.setAttribute('draggable', 'true');
            }
            li.innerHTML = `
                <div class="setlist-song-info">
                    <span class="setlist-song-number">${index + 1}.</span>
                    <div class="setlist-song-details">
                        <div class="setlist-song-title">${song.title}</div>
                        <div class="setlist-song-meta-row">
                            ${song.key ? `<div class="setlist-song-key"> ${transposeLevel !== 0 ? deps.transposeChord(song.key, transposeLevel) : song.key}</div>` : ''}
                            ${(song.time || song.timeSignature) ? `<span class="setlist-song-key-time">${song.time || song.timeSignature}</span>` : ''}
                            ${song.tempo ? `<span class="setlist-song-key-tempo">${song.tempo} </span>` : ''}
                        </div>
                        ${chordsDisplay ? `<div class="setlist-song-meta-row" style="margin-top: 4px;"><span class="setlist-song-key-tempo">${chordsDisplay}</span></div>` : ''}
                    </div>
                </div>
                <div class="setlist-song-actions">
                    ${!isResequenceMode && (currentSetlistType !== 'global' || (currentUserInFunction && currentUserInFunction.isAdmin)) ? `<button class="remove-from-setlist-btn" data-song-id="${song.id}" title="Remove from setlist" type="button">×</button>` : ''}
                </div>`;

            li.querySelector('.setlist-song-info').addEventListener('click', () => {
                clearSetlistSelections();
                li.classList.add('selected');
                deps.showPreview(song, false, context);
            });
            const removeBtn = li.querySelector('.remove-from-setlist-btn');
            if (removeBtn) {
                removeBtn.addEventListener('click', async (e) => {
                    e.preventDefault(); e.stopPropagation();
                    if (deps.getCurrentSetlistType() === 'global' && !deps.getCurrentUser()?.isAdmin) {
                        deps.showNotification('❌ Access denied: Only administrators can modify global setlists', 'error');
                        return;
                    }
                    await removeSongFromSetlist(song.id, deps);
                });
            }
            ul.appendChild(li);
        });

        if (isResequenceMode) {
            let dragSrcEl = null;
            ul.addEventListener('dragstart', (e) => {
                const li = e.target.closest('.setlist-song-item');
                if (!li) return;
                dragSrcEl = li; e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', li.dataset.songId);
                li.classList.add('dragging');
            });
            ul.addEventListener('dragend', () => { if (dragSrcEl) dragSrcEl.classList.remove('dragging'); dragSrcEl = null; });
            ul.addEventListener('dragover', (e) => {
                e.preventDefault(); e.dataTransfer.dropEffect = 'move';
                const li = e.target.closest('.setlist-song-item');
                if (li && li !== dragSrcEl) li.classList.add('drag-over');
            });
            ul.addEventListener('dragleave', (e) => { e.target.closest('.setlist-song-item')?.classList.remove('drag-over'); });
            ul.addEventListener('drop', (e) => {
                e.preventDefault();
                const li = e.target.closest('.setlist-song-item');
                if (!li || !dragSrcEl || li === dragSrcEl) return;
                const cvs = deps.getCurrentViewingSetlist();
                if (!cvs || !cvs.songs) return;
                li.classList.remove('drag-over');
                const draggedId = dragSrcEl.dataset.songId;
                const targetId = li.dataset.songId;
                const oldIdx = cvs.songs.findIndex(id => id == draggedId);
                const newIdx = cvs.songs.findIndex(id => id == targetId);
                if (oldIdx > -1 && newIdx > -1) {
                    const [removed] = cvs.songs.splice(oldIdx, 1);
                    let insertAt = newIdx;
                    if (oldIdx < newIdx) insertAt = newIdx - 1;
                    cvs.songs.splice(insertAt, 0, removed);
                }
                refreshSetlistDisplay(deps);
            });
        }
        container.appendChild(ul);
    }

    // ─── Remove song from current setlist ────────────────────────────────────

    async function removeSongFromSetlist(songId, deps) {
        const currentViewingSetlist = deps.getCurrentViewingSetlist();
        const currentSetlistType = deps.getCurrentSetlistType();
        if (!currentViewingSetlist) return;

        const songIndex = currentViewingSetlist.songs.findIndex(item => {
            if (typeof item === 'object' && item !== null) return item._id === songId || item.id === songId;
            return parseInt(item) === parseInt(songId);
        });
        if (songIndex === -1) return;

        currentViewingSetlist.songs.splice(songIndex, 1);
        const endpoint = currentSetlistType === 'global' ? '/api/global-setlists' : '/api/my-setlists';

        deps.authFetch(`${deps.API_BASE_URL}${endpoint}/${currentViewingSetlist._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: currentViewingSetlist.name, description: currentViewingSetlist.description, songs: currentViewingSetlist.songs })
        })
        .then(response => {
            if (!response.ok) {
                if (response.status === 403) throw new Error('FORBIDDEN_ACCESS');
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(async (updatedSetlist) => {
            if (updatedSetlist.error) throw new Error(updatedSetlist.error);
            const setlists = currentSetlistType === 'global' ? deps.getGlobalSetlists() : deps.getMySetlists();
            const idx = setlists.findIndex(s => s._id === currentViewingSetlist._id);
            if (updatedSetlist.message && !updatedSetlist._id) {
                if (idx !== -1) setlists[idx] = currentViewingSetlist;
            } else {
                if (idx !== -1) {
                    setlists[idx] = updatedSetlist;
                    deps.setCurrentViewingSetlist(updatedSetlist);
                }
            }
            refreshSetlistDisplay(deps);
            const setlistViewModal = document.getElementById('setlistViewModal');
            if (setlistViewModal && setlistViewModal.style.display !== 'none') renderSetlistSongs(deps);
            updateAllSetlistButtonStates(deps);
            await refreshSetlistDataOnly(deps);
            deps.showNotification('Song removed from setlist', 'success');
        })
        .catch(error => {
            console.error('Error removing song from setlist:', error);
            if (error.message === 'FORBIDDEN_ACCESS') {
                deps.showNotification('❌ Access denied: Only administrators can modify global setlists', 'error');
            } else {
                deps.showNotification('❌ Failed to remove song from setlist', 'error');
            }
            const cvs = deps.getCurrentViewingSetlist();
            if (cvs && Array.isArray(cvs.songs)) {
                cvs.songs.splice(songIndex, 0, songId);
                refreshSetlistDisplay(deps);
            } else {
                refreshSetlistDataOnly(deps).catch(console.error);
            }
        });
    }

    function refreshSetlistDisplay(deps) {
        const currentViewingSetlist = deps.getCurrentViewingSetlist();
        const currentSetlistType = deps.getCurrentSetlistType();
        if (!currentViewingSetlist || !currentSetlistType) return;
        const setlistId = currentViewingSetlist._id;
        if (currentSetlistType === 'global') showGlobalSetlistInMainSection(setlistId, deps);
        else if (currentSetlistType === 'my') showMySetlistInMainSection(setlistId, deps);
    }

    function clearSetlistSelections() {
        document.querySelectorAll('.setlist-song-item.selected').forEach(item => item.classList.remove('selected'));
    }

    // ─── Modal-based setlist view ─────────────────────────────────────────────

    function openSetlistView(setlistId, type, deps) {
        const setlists = type === 'global' ? deps.getGlobalSetlists() : deps.getMySetlists();
        const setlist = setlists.find(s => s._id === setlistId);
        if (!setlist) return;
        deps.setCurrentViewingSetlist(setlist);
        deps.setCurrentSetlistType(type);
        const modal = document.getElementById('setlistViewModal');
        const title = document.getElementById('setlistViewTitle');
        const description = document.getElementById('setlistViewDescription');
        const editBtn = document.getElementById('editSetlistBtn');
        const deleteBtn = document.getElementById('deleteSetlistBtn');
        if (title) title.textContent = setlist.name;
        if (description) description.textContent = setlist.description || 'No description';
        const canEdit = (type === 'global' && deps.getCurrentUser()?.isAdmin) || (type === 'my');
        if (editBtn) editBtn.style.display = canEdit ? 'block' : 'none';
        if (deleteBtn) deleteBtn.style.display = canEdit ? 'block' : 'none';
        renderSetlistSongs(deps);
        if (modal) modal.style.display = 'flex';
    }

    function renderSetlistSongs(deps) {
        const currentViewingSetlist = deps.getCurrentViewingSetlist();
        if (!currentViewingSetlist) return;
        const newSongsEl = document.getElementById('setlistNewSongs');
        const oldSongsEl = document.getElementById('setlistOldSongs');
        const songs = deps.getSongs();
        const newSongIds = currentViewingSetlist.songs.filter(id => {
            const s = songs.find(s => s.id === id);
            return s && s.category === 'New';
        });
        const oldSongIds = currentViewingSetlist.songs.filter(id => {
            const s = songs.find(s => s.id === id);
            return s && s.category === 'Old';
        });
        if (newSongsEl) {
            newSongsEl.innerHTML = '';
            newSongIds.forEach(id => {
                const s = songs.find(s => s.id === id);
                if (s) newSongsEl.appendChild(createSetlistSongElement(s, deps));
            });
            if (newSongIds.length === 0) newSongsEl.innerHTML = '<p class="no-songs">No New songs in this setlist</p>';
        }
        if (oldSongsEl) {
            oldSongsEl.innerHTML = '';
            oldSongIds.forEach(id => {
                const s = songs.find(s => s.id === id);
                if (s) oldSongsEl.appendChild(createSetlistSongElement(s, deps));
            });
            if (oldSongIds.length === 0) oldSongsEl.innerHTML = '<p class="no-songs">No Old songs in this setlist</p>';
        }
    }

    function createSetlistSongElement(song, deps) {
        let transposeLevel = 0;
        const currentSetlistType = deps.getCurrentSetlistType();
        try {
            const lt = JSON.parse(localStorage.getItem('transposeCache') || '{}');
            if (song.id && typeof lt[song.id] === 'number') transposeLevel = lt[song.id];
        } catch (e) { transposeLevel = 0; }
        const displayKey = transposeLevel !== 0 ? deps.transposeChord(song.key, transposeLevel) : song.key;
        const div = document.createElement('div');
        div.className = 'setlist-song-item';
        div.innerHTML = `
            <div class="setlist-song-info">
                <div class="setlist-song-title">${song.title}</div>
                <div class="setlist-song-meta">${displayKey} | ${song.artistDetails || 'Unknown'}</div>
            </div>
            ${(currentSetlistType !== 'global' || deps.getCurrentUser()?.isAdmin) ?
                `<button class="remove-from-setlist" onclick="removeFromSetlist(${song.id})" title="Remove from setlist"><i class="fas fa-times"></i></button>` : ''}`;
        div.addEventListener('click', (e) => {
            if (!e.target.closest('.remove-from-setlist')) {
                deps.showPreview(song, false, 'setlist');
                const mv = document.getElementById('setlistViewModal');
                if (mv) mv.style.display = 'none';
            }
        });
        return div;
    }

    // ─── CRUD: Global setlists ────────────────────────────────────────────────

    function createGlobalSetlist(deps) {
        if (!deps.getCurrentUser()?.isAdmin) { deps.showNotification('Only admins can create global setlists'); return; }
        const modal = document.getElementById('globalSetlistModal');
        const title = document.getElementById('globalSetlistModalTitle');
        const form = document.getElementById('globalSetlistForm');
        const submitBtn = document.getElementById('globalSetlistSubmit');
        if (title) title.textContent = 'Create Global Setlist';
        if (submitBtn) submitBtn.textContent = 'Create Setlist';
        if (form) form.reset();
        const idEl = document.getElementById('globalSetlistId');
        if (idEl) idEl.value = '';
        if (modal) modal.songSelector = initializeSetlistSongSelection('global', deps);
        if (modal) modal.style.display = 'flex';
        if (form) {
            form.onsubmit = async function () {
                setTimeout(async () => {
                    await refreshSetlistDataAndUI(deps);
                    renderGlobalSetlists(deps);
                    renderMySetlists(deps);
                    const dropdown = document.getElementById('setlistDropdown');
                    const nameInput = document.getElementById('globalSetlistName');
                    const newSetlist = deps.getGlobalSetlists().find(s => s.name === nameInput?.value);
                    if (dropdown && newSetlist) {
                        dropdown.value = `global_${newSetlist._id}`;
                        dropdown.dispatchEvent(new Event('change'));
                    }
                }, 100);
            };
        }
    }

    function editGlobalSetlist(setlistId, deps) {
        if (!deps.getCurrentUser()?.isAdmin) { deps.showNotification('Only admins can edit global setlists'); return; }
        const setlist = deps.getGlobalSetlists().find(s => s._id === setlistId);
        if (!setlist) return;
        const modal = document.getElementById('globalSetlistModal');
        const title = document.getElementById('globalSetlistModalTitle');
        const submitBtn = document.getElementById('globalSetlistSubmit');
        if (title) title.textContent = 'Edit Global Setlist';
        if (submitBtn) submitBtn.textContent = 'Update Setlist';
        const idEl = document.getElementById('globalSetlistId');
        const nameEl = document.getElementById('globalSetlistName');
        const descEl = document.getElementById('globalSetlistDescription');
        if (idEl) idEl.value = setlist._id;
        if (nameEl) nameEl.value = setlist.name;
        if (descEl) descEl.value = setlist.description || '';
        if (modal) {
            modal.songSelector = initializeSetlistSongSelection('global', deps);
            if (modal.songSelector && setlist.songs && setlist.songs.length > 0) {
                modal.songSelector.setSelectedSongs(setlist.songs);
            }
            modal.style.display = 'flex';
        }
    }

    function deleteGlobalSetlist(setlistId, deps) {
        if (!deps.getCurrentUser()?.isAdmin) { deps.showNotification('Only admins can delete global setlists'); return; }
        const setlist = deps.getGlobalSetlists().find(s => s._id === setlistId);
        if (!setlist) return;
        const modal = document.getElementById('confirmDeleteSetlistModal');
        const message = document.getElementById('deleteSetlistMessage');
        if (message) message.textContent = `Are you sure you want to delete the global setlist "${setlist.name}"?`;
        if (modal) modal.style.display = 'flex';
        const confirmBtn = document.getElementById('confirmDeleteSetlist');
        if (confirmBtn) {
            confirmBtn.onclick = async () => {
                try {
                    const res = await deps.authFetch(`${deps.API_BASE_URL}/api/global-setlists/${setlistId}`, { method: 'DELETE' });
                    if (res.ok) {
                        deps.setGlobalSetlists(deps.getGlobalSetlists().filter(s => s._id !== setlistId));
                        renderGlobalSetlists(deps);
                        deps.showNotification('Global setlist deleted');
                        if (modal) modal.style.display = 'none';
                    } else if (res.status === 403) {
                        deps.showNotification('❌ Access denied: Only administrators can delete global setlists', 'error');
                        if (modal) modal.style.display = 'none';
                    } else {
                        deps.showNotification('Failed to delete global setlist');
                    }
                } catch (err) {
                    console.error('Failed to delete global setlist:', err);
                    deps.showNotification('Failed to delete global setlist');
                }
            };
        }
    }

    // ─── CRUD: My setlists ────────────────────────────────────────────────────

    function createMySetlist(deps) {
        if (!deps.getJwtToken()) { deps.showNotification('Please log in to create setlists'); return; }
        const modal = document.getElementById('mySetlistModal');
        const title = document.getElementById('mySetlistModalTitle');
        const form = document.getElementById('mySetlistForm');
        const submitBtn = document.getElementById('mySetlistSubmit');
        if (title) title.textContent = 'Create My Setlist';
        if (submitBtn) submitBtn.textContent = 'Create Setlist';
        if (form) form.reset();
        const idEl = document.getElementById('mySetlistId');
        if (idEl) idEl.value = '';
        if (modal) modal.songSelector = initializeSetlistSongSelection('my', deps);
        if (modal) modal.style.display = 'flex';
        if (form) {
            form.onsubmit = async function () {
                setTimeout(async () => {
                    await refreshSetlistDataAndUI(deps);
                    renderGlobalSetlists(deps);
                    renderMySetlists(deps);
                    const dropdown = document.getElementById('setlistDropdown');
                    const nameInput = document.getElementById('mySetlistName');
                    const newSetlist = deps.getMySetlists().find(s => s.name === nameInput?.value);
                    if (dropdown && newSetlist) {
                        dropdown.value = `my_${newSetlist._id}`;
                        dropdown.dispatchEvent(new Event('change'));
                    }
                }, 100);
            };
        }
    }

    function editMySetlist(setlistId, deps) {
        const setlist = deps.getMySetlists().find(s => s._id === setlistId);
        if (!setlist) return;
        const modal = document.getElementById('mySetlistModal');
        const title = document.getElementById('mySetlistModalTitle');
        const submitBtn = document.getElementById('mySetlistSubmit');
        if (title) title.textContent = 'Edit My Setlist';
        if (submitBtn) submitBtn.textContent = 'Update Setlist';
        const idEl = document.getElementById('mySetlistId');
        const nameEl = document.getElementById('mySetlistName');
        const descEl = document.getElementById('mySetlistDescription');
        if (idEl) idEl.value = setlist._id;
        if (nameEl) nameEl.value = setlist.name;
        if (descEl) descEl.value = setlist.description || '';
        if (modal) {
            modal.songSelector = initializeSetlistSongSelection('my', deps);
            if (modal.songSelector && setlist.songs && setlist.songs.length > 0) {
                modal.songSelector.setSelectedSongs(setlist.songs);
            }
            modal.style.display = 'flex';
        }
    }

    function deleteMySetlist(setlistId, deps) {
        const setlist = deps.getMySetlists().find(s => s._id === setlistId);
        if (!setlist) return;
        const modal = document.getElementById('confirmDeleteSetlistModal');
        const message = document.getElementById('deleteSetlistMessage');
        if (message) message.textContent = `Are you sure you want to delete the setlist "${setlist.name}"?`;
        if (modal) modal.style.display = 'flex';
        const confirmBtn = document.getElementById('confirmDeleteSetlist');
        if (confirmBtn) {
            confirmBtn.onclick = async () => {
                try {
                    const res = await deps.authFetch(`${deps.API_BASE_URL}/api/my-setlists/${setlistId}`, { method: 'DELETE' });
                    if (res.ok) {
                        deps.setMySetlists(deps.getMySetlists().filter(s => s._id !== setlistId));
                        renderMySetlists(deps);
                        deps.showNotification('Setlist deleted');
                        if (modal) modal.style.display = 'none';
                    }
                } catch (err) {
                    console.error('Failed to delete setlist:', err);
                    deps.showNotification('Failed to delete setlist');
                }
            };
        }
    }

    // ─── Manual song addition ─────────────────────────────────────────────────

    async function addManualSongToSetlist(manualSong, deps) {
        const currentViewingSetlist = deps.getCurrentViewingSetlist();
        const currentSetlistType = deps.getCurrentSetlistType();
        const setlistId = currentViewingSetlist._id;
        const isGlobal = currentSetlistType === 'global';
        const currentSetlist = isGlobal ? deps.getGlobalSetlists().find(s => s._id === setlistId)
            : deps.getMySetlists().find(s => s._id === setlistId);
        if (currentSetlist && currentSetlist.songs) {
            const isDuplicate = currentSetlist.songs.some(song => {
                let title = '';
                if (typeof song === 'object') title = song.title || '';
                else { const f = deps.getSongs().find(s => s.id === parseInt(song)); title = f ? f.title : ''; }
                if (typeof song === 'string' && song.startsWith('manual_')) {
                    const ms = currentSetlist.songs.find(s => typeof s === 'object' && s.id === song);
                    if (ms) title = ms.title || '';
                }
                return title.toLowerCase().trim() === manualSong.title.toLowerCase().trim();
            });
            if (isDuplicate) { deps.showNotification(`"${manualSong.title}" is already in this setlist`); return false; }
        }
        try {
            const endpoint = isGlobal ? `${deps.API_BASE_URL}/api/global-setlists/add-song` : `${deps.API_BASE_URL}/api/my-setlists/add-song`;
            const res = await deps.authFetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ setlistId, songId: manualSong.id, manualSong })
            });
            if (res.ok) {
                const targetList = isGlobal ? deps.getGlobalSetlists() : deps.getMySetlists();
                const sl = targetList.find(s => s._id === setlistId);
                if (sl) { sl.songs = sl.songs || []; sl.songs.push(manualSong); }
                refreshSetlistDisplay(deps);
                return true;
            } else {
                throw new Error('Failed to add manual song to setlist');
            }
        } catch (error) {
            console.error('Error adding manual song to setlist:', error);
            return false;
        }
    }

    async function addSongToCurrentSetlist(song, deps) {
        const currentViewingSetlist = deps.getCurrentViewingSetlist();
        const currentSetlistType = deps.getCurrentSetlistType();
        if (!currentViewingSetlist || !currentSetlistType) return false;
        const setlistId = currentViewingSetlist._id;
        const isGlobal = currentSetlistType === 'global';
        const currentSetlist = isGlobal ? deps.getGlobalSetlists().find(s => s._id === setlistId)
            : deps.getMySetlists().find(s => s._id === setlistId);
        if (currentSetlist && currentSetlist.songs) {
            const isDuplicate = currentSetlist.songs.some(es => {
                if (typeof es === 'object') return (es._id === song._id) || (es.id === song._id) || (es.title?.toLowerCase().trim() === song.title?.toLowerCase().trim());
                return es === song._id || es === song.id;
            });
            if (isDuplicate) { deps.showNotification(`"${song.title}" is already in this setlist`); return false; }
        }
        const endpoint = isGlobal ? `${deps.API_BASE_URL}/api/global-setlists/add-song` : `${deps.API_BASE_URL}/api/my-setlists/add-song`;
        try {
            const res = await deps.authFetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ setlistId, songId: song._id })
            });
            if (res.ok) {
                const targetList = isGlobal ? deps.getGlobalSetlists() : deps.getMySetlists();
                const sl = targetList.find(s => s._id === setlistId);
                if (sl) { sl.songs = sl.songs || []; sl.songs.push(song); }
                refreshSetlistDisplay(deps);
                deps.showNotification(`"${song.title}" added to setlist`);
                return true;
            } else {
                deps.showNotification('Failed to add song to setlist');
                return false;
            }
        } catch (error) {
            console.error('Error adding song to setlist:', error);
            deps.showNotification('Failed to add song to setlist');
            return false;
        }
    }

    // ─── Preview setlist dropdown ──────────────────────────────────────────────

    function populateSetlistDropdownForSong(song, deps) {
        const globalSetlistsDropdown = document.getElementById('globalSetlistsDropdown');
        const mySetlistsDropdown = document.getElementById('mySetlistsDropdown');
        if (!globalSetlistsDropdown || !mySetlistsDropdown) return;
        const globalSetlists = deps.getGlobalSetlists();
        const mySetlists = deps.getMySetlists();

        globalSetlistsDropdown.innerHTML = '<div class="setlist-dropdown-title">Global Setlists</div>';
        globalSetlists.forEach(setlist => {
            const isIn = setlist.songs.includes(song.id);
            const item = document.createElement('div');
            item.className = `setlist-dropdown-item ${isIn ? 'in-setlist' : ''}`;
            item.innerHTML = `<i class="fas ${isIn ? 'fa-check' : 'fa-list'}"></i><span>${setlist.name}</span>`;
            item.addEventListener('click', () => {
                if (isIn) removeFromSpecificSetlist(song.id, setlist._id, deps);
                else addToSpecificSetlist(song.id, setlist._id, deps);
                const dd = document.getElementById('previewSetlistDropdown');
                if (dd) dd.style.display = 'none';
            });
            globalSetlistsDropdown.appendChild(item);
        });
        if (globalSetlists.length === 0) {
            const noItem = document.createElement('div');
            noItem.className = 'setlist-dropdown-item';
            noItem.style.cssText = 'opacity: 0.6; cursor: default;';
            noItem.innerHTML = '<i class="fas fa-info-circle"></i><span>No global setlists available</span>';
            globalSetlistsDropdown.appendChild(noItem);
        }

        mySetlistsDropdown.innerHTML = '<div class="setlist-dropdown-title">My Setlists</div>';
        if (deps.getJwtToken()) {
            mySetlists.forEach(setlist => {
                const isIn = setlist.songs.includes(song.id);
                const item = document.createElement('div');
                item.className = `setlist-dropdown-item ${isIn ? 'in-setlist' : ''}`;
                item.innerHTML = `<i class="fas ${isIn ? 'fa-check' : 'fa-list'}"></i><span>${setlist.name}</span>`;
                item.addEventListener('click', () => {
                    if (isIn) removeFromSpecificSetlist(song.id, setlist._id, deps);
                    else addToSpecificSetlist(song.id, setlist._id, deps);
                    const dd = document.getElementById('previewSetlistDropdown');
                    if (dd) dd.style.display = 'none';
                });
                mySetlistsDropdown.appendChild(item);
            });
            if (mySetlists.length === 0) {
                const noItem = document.createElement('div');
                noItem.className = 'setlist-dropdown-item';
                noItem.style.cssText = 'opacity: 0.6; cursor: default;';
                noItem.innerHTML = '<i class="fas fa-plus"></i><span>Create your first personal setlist</span>';
                mySetlistsDropdown.appendChild(noItem);
            }
        } else {
            const loginItem = document.createElement('div');
            loginItem.className = 'setlist-dropdown-item';
            loginItem.style.cssText = 'opacity: 0.6; cursor: default;';
            loginItem.innerHTML = '<i class="fas fa-sign-in-alt"></i><span>Login to create and access personal setlists</span>';
            mySetlistsDropdown.appendChild(loginItem);
        }
    }

    // ─── Add/remove from specific setlists (atomic API calls) ─────────────────

    async function addToGlobalSetlist(songId, setlistId, deps) {
        if (!deps.getCurrentUser()?.isAdmin) { deps.showNotification('Only admins can add songs to global setlists'); return; }
        const setlist = deps.getGlobalSetlists().find(s => s._id === setlistId);
        if (!setlist) return;
        if (setlist.songs.includes(songId)) { deps.showNotification('Song already in setlist'); return; }
        try {
            const updatedSongs = [...setlist.songs, songId];
            const res = await deps.authFetch(`${deps.API_BASE_URL}/api/global-setlists/${setlistId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ songs: updatedSongs })
            });
            if (res.ok) {
                setlist.songs = updatedSongs;
                const idx = deps.getGlobalSetlists().findIndex(s => s._id === setlistId);
                if (idx !== -1) deps.getGlobalSetlists()[idx] = setlist;
            }
        } catch (err) { console.error('Failed to add song to global setlist:', err); deps.showNotification('Failed to add song to setlist'); }
    }

    async function removeFromGlobalSetlist(songId, setlistId, deps) {
        if (!deps.getCurrentUser()?.isAdmin) { deps.showNotification('Only admins can modify global setlists'); return; }
        const setlist = deps.getGlobalSetlists().find(s => s._id === setlistId);
        if (!setlist) return;
        try {
            const updatedSongs = setlist.songs.filter(id => id !== songId);
            const res = await deps.authFetch(`${deps.API_BASE_URL}/api/global-setlists/${setlistId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ songs: updatedSongs })
            });
            if (res.ok) {
                setlist.songs = updatedSongs;
                const idx = deps.getGlobalSetlists().findIndex(s => s._id === setlistId);
                if (idx !== -1) deps.getGlobalSetlists()[idx] = setlist;
            }
        } catch (err) { console.error('Failed to remove song from global setlist:', err); deps.showNotification('Failed to remove song from setlist'); }
    }

    async function addToMySetlist(songId, setlistId, deps) {
        if (!deps.getJwtToken()) { deps.showNotification('Please login to add songs to your setlists'); return; }
        const setlist = deps.getMySetlists().find(s => s._id === setlistId);
        if (!setlist) return;
        if (setlist.songs.includes(songId)) { deps.showNotification('Song already in setlist'); return; }
        try {
            const updatedSongs = [...setlist.songs, songId];
            const res = await deps.authFetch(`${deps.API_BASE_URL}/api/my-setlists/${setlistId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ songs: updatedSongs })
            });
            if (res.ok) {
                setlist.songs = updatedSongs;
                const idx = deps.getMySetlists().findIndex(s => s._id === setlistId);
                if (idx !== -1) deps.getMySetlists()[idx] = setlist;
            }
        } catch (err) { console.error('Failed to add song to setlist:', err); deps.showNotification('Failed to add song to setlist'); }
    }

    async function removeFromMySetlist(songId, setlistId, deps) {
        if (!deps.getJwtToken()) { deps.showNotification('Please login to modify your setlists'); return; }
        const setlist = deps.getMySetlists().find(s => s._id === setlistId);
        if (!setlist) return;
        try {
            const updatedSongs = setlist.songs.filter(id => id !== songId);
            const res = await deps.authFetch(`${deps.API_BASE_URL}/api/my-setlists/${setlistId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ songs: updatedSongs })
            });
            if (res.ok) {
                setlist.songs = updatedSongs;
                const idx = deps.getMySetlists().findIndex(s => s._id === setlistId);
                if (idx !== -1) deps.getMySetlists()[idx] = setlist;
            }
        } catch (err) { console.error('Failed to remove song from setlist:', err); deps.showNotification('Failed to remove song from setlist'); }
    }

    // ─── Song-level add/remove via preview panel ──────────────────────────────

    function addToSpecificSetlist(songId, setlistId, deps) {
        if (!deps.getJwtToken()) { deps.showNotification('Please login to add songs to your setlist.'); return; }
        if (setlistId.startsWith('global_') && !deps.getCurrentUser()?.isAdmin) {
            deps.showNotification('❌ Access denied: Only administrators can modify Global Setlists', 'error'); return;
        }
        const song = deps.getSongs().find(s => s.id === songId);
        if (!song) { console.error('Song not found:', songId); return; }
        const isGlobal = setlistId.startsWith('global_');
        const setlistArray = isGlobal ? deps.getGlobalSetlists() : deps.getMySetlists();
        const targetSetlist = setlistArray.find(s => s._id === setlistId);
        if (targetSetlist && targetSetlist.songs) {
            const isDuplicate = targetSetlist.songs.some(es => {
                const esId = typeof es === 'object' ? (es.id || es._id) : es;
                return esId === songId;
            });
            if (isDuplicate) { deps.showNotification(`"${song.title}" is already in this setlist`); return; }
        }
        let apiEndpoint;
        if (setlistId.startsWith('global_')) apiEndpoint = `${deps.API_BASE_URL}/api/global-setlists/add-song`;
        else if (setlistId.startsWith('my_')) apiEndpoint = `${deps.API_BASE_URL}/api/my-setlists/add-song`;
        else { console.error('Unknown setlist type:', setlistId); return; }

        fetch(apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${deps.getJwtToken()}` },
            body: JSON.stringify({ setlistId: setlistId.replace(/^(global_|my_)/, ''), songId: song.id })
        })
        .then(response => {
            if (response.status === 403) throw new Error('FORBIDDEN_ACCESS');
            return response.json();
        })
        .then(data => {
            if (data.success) {
                const dd = document.getElementById('setlistDropdown');
                const opt = dd ? dd.selectedOptions[0] : null;
                deps.showNotification(`"${song.title}" added to ${opt ? opt.text : 'setlist'}`);
                refreshSetlistDataOnly(deps).then(() => updateAllSetlistButtonStates(deps)).catch(() => updateAllSetlistButtonStates(deps));
            } else {
                deps.showNotification('Failed to add song to setlist');
            }
        })
        .catch(error => {
            if (error.message === 'FORBIDDEN_ACCESS') deps.showNotification('❌ Access denied: Only administrators can modify global setlists', 'error');
            else deps.showNotification('❌ Error adding song to setlist', 'error');
            console.error('Error adding song to setlist:', error);
        });
    }

    function removeFromSpecificSetlist(songId, setlistId, deps) {
        if (!deps.getJwtToken()) { deps.showNotification('Please login to remove songs from your setlist.'); return; }
        const song = deps.getSongs().find(s => s.id === songId);
        if (!song) { console.error('Song not found:', songId); return; }
        let apiEndpoint;
        let cleanId = setlistId;
        if (setlistId.startsWith('global_')) { apiEndpoint = `${deps.API_BASE_URL}/api/global-setlists/remove-song`; cleanId = setlistId.replace('global_', ''); }
        else if (setlistId.startsWith('my_')) { apiEndpoint = `${deps.API_BASE_URL}/api/my-setlists/remove-song`; cleanId = setlistId.replace('my_', ''); }
        else { console.error('Unknown setlist type:', setlistId); return; }

        fetch(apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${deps.getJwtToken()}` },
            body: JSON.stringify({ setlistId: cleanId, songId })
        })
        .then(response => {
            if (response.status === 403) throw new Error('FORBIDDEN_ACCESS');
            return response.json();
        })
        .then(data => {
            if (data.success) {
                const dd = document.getElementById('setlistDropdown');
                const opt = dd ? dd.selectedOptions[0] : null;
                deps.showNotification(`"${song.title}" removed from ${opt ? opt.text : 'setlist'}`);
                refreshSetlistDataOnly(deps).then(() => updateAllSetlistButtonStates(deps)).catch(() => updateAllSetlistButtonStates(deps));
            } else {
                deps.showNotification('Failed to remove song from setlist');
            }
        })
        .catch(error => {
            if (error.message === 'FORBIDDEN_ACCESS') deps.showNotification('❌ Access denied: Only administrators can modify global setlists', 'error');
            else deps.showNotification('❌ Error removing song from setlist', 'error');
            console.error('Error removing song from setlist:', error);
        });
    }

    function checkSongInSetlistAndToggle(songId, setlistId, deps) {
        if (!setlistId) { deps.showNotification('Please select a setlist first'); return; }
        if (isSongInCurrentSetlist(songId, setlistId, deps)) removeFromSpecificSetlist(songId, setlistId, deps);
        else addToSpecificSetlist(songId, setlistId, deps);
    }

    function isSongInCurrentSetlist(songId, setlistId, deps) {
        let currentSetlist = null;
        if (setlistId.startsWith('global_')) currentSetlist = deps.getGlobalSetlists().find(s => s._id === setlistId.replace('global_', ''));
        else if (setlistId.startsWith('my_')) currentSetlist = deps.getMySetlists().find(s => s._id === setlistId.replace('my_', ''));
        if (!currentSetlist || !currentSetlist.songs) return false;
        return currentSetlist.songs.some(ss => {
            if (typeof ss === 'object' && ss.id) return parseInt(ss.id) === parseInt(songId);
            return parseInt(ss) === parseInt(songId);
        });
    }

    function removeFromCurrentSetlist(songId, deps) {
        const setlistDropdown = document.getElementById('setlistDropdown');
        if (!setlistDropdown || !setlistDropdown.value) { deps.showNotification('No setlist selected'); return; }
        removeFromSpecificSetlist(songId, setlistDropdown.value, deps);
    }

    // ─── window.removeFromSetlist for onclick attributes ──────────────────────
    // Registered lazily at runtime when deps are available; main.js calls SetlistsUI.registerGlobals(deps)

    function registerGlobals(deps) {
        window.removeFromSetlist = async function (songId) {
            const currentViewingSetlist = deps.getCurrentViewingSetlist();
            const currentSetlistType = deps.getCurrentSetlistType();
            if (!currentViewingSetlist || !currentSetlistType) return;
            if (currentSetlistType === 'global' && !deps.getCurrentUser()?.isAdmin) {
                deps.showNotification('❌ Access denied: Only administrators can modify global setlists', 'error'); return;
            }
            const updatedSongs = currentViewingSetlist.songs.filter(id => id !== songId);
            try {
                const endpoint = currentSetlistType === 'global' ? 'global-setlists' : 'my-setlists';
                const res = await deps.authFetch(`${deps.API_BASE_URL}/api/${endpoint}/${currentViewingSetlist._id}`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ songs: updatedSongs })
                });
                if (!res.ok) {
                    if (res.status === 403) { deps.showNotification('❌ Access denied: Only administrators can modify global setlists', 'error'); return; }
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                currentViewingSetlist.songs = updatedSongs;
                if (currentSetlistType === 'global') {
                    const idx = deps.getGlobalSetlists().findIndex(s => s._id === currentViewingSetlist._id);
                    if (idx !== -1) deps.getGlobalSetlists()[idx] = currentViewingSetlist;
                } else {
                    const idx = deps.getMySetlists().findIndex(s => s._id === currentViewingSetlist._id);
                    if (idx !== -1) deps.getMySetlists()[idx] = currentViewingSetlist;
                }
                renderSetlistSongs(deps);
                refreshSetlistDisplay(deps);
                await refreshSetlistDataOnly(deps);
                deps.showNotification('Song removed from setlist');
            } catch (err) {
                console.error('Failed to remove song from setlist:', err);
                deps.showNotification('❌ Failed to remove song from setlist', 'error');
            }
        };
    }

    // ─── Public API ───────────────────────────────────────────────────────────

    window.SetlistsUI = {
        // Dropdown
        setupCustomDropdownHandlers,
        handleDropdownArrowClick,
        handleDropdownMainAreaClick,
        openDropdownMenu,
        closeDropdownMenu,
        selectDropdownOption,
        updateCustomDropdownDisplay,
        updateSetlistDropdownStyle,
        populateSetlistDropdown,
        // Song selection modal
        initializeSetlistSongSelection,
        // Data load/refresh
        loadGlobalSetlists,
        loadMySetlists,
        refreshSetlistDataOnly,
        refreshSetlistDataAndUI,
        // Button state
        updateAllSetlistButtonStates,
        updateSetlistButtonState,
        updatePreviewSetlistButton,
        // Descriptions
        showSetlistDescription,
        hideSetlistDescription,
        showDropdownSetlistDescription,
        // Render
        renderSetlists,
        renderGlobalSetlists,
        renderMySetlists,
        // Show in main section
        showGlobalSetlistInMainSection,
        showMySetlistInMainSection,
        // Song display + remove
        displaySetlistSongs,
        removeSongFromSetlist,
        refreshSetlistDisplay,
        clearSetlistSelections,
        // Modal view
        openSetlistView,
        renderSetlistSongs,
        createSetlistSongElement,
        // CRUD
        createGlobalSetlist,
        editGlobalSetlist,
        deleteGlobalSetlist,
        createMySetlist,
        editMySetlist,
        deleteMySetlist,
        // Manual songs
        addManualSongToSetlist,
        addSongToCurrentSetlist,
        // Preview dropdown
        populateSetlistDropdownForSong,
        // Granular add/remove
        addToGlobalSetlist,
        removeFromGlobalSetlist,
        addToMySetlist,
        removeFromMySetlist,
        // Song-level toggle (preview panel)
        addToSpecificSetlist,
        removeFromSpecificSetlist,
        checkSongInSetlistAndToggle,
        isSongInCurrentSetlist,
        removeFromCurrentSetlist,
        // Global registration
        registerGlobals,
    };
})(window);
