// scripts/features/smart-setlists.js
// Phase 3F extraction: smart setlist UI and form flows from main.js.
(function attachSmartSetlistsUI(window) {
    if (!window) return;

    function loadSmartSetlistsFromServer(deps) {
        return (async function () {
            console.log('Loading Smart Setlists from server...');

            if (!deps.getCurrentUser()) {
                console.log('No user logged in, clearing Smart Setlists');
                deps.setSmartSetlists([]);
                return;
            }

            try {
                const token = localStorage.getItem('jwtToken');
                if (!token) {
                    console.log('No JWT token found, clearing Smart Setlists');
                    deps.setSmartSetlists([]);
                    return;
                }

                const response = await fetch(`${deps.API_BASE_URL}/api/smart-setlists`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const setlists = await response.json();
                    deps.setSmartSetlists(setlists);
                    console.log(`Loaded ${setlists.length} Smart Setlists from server:`, setlists.map((setlist) => setlist.name));
                } else {
                    console.warn('Failed to load smart setlists from server - HTTP', response.status);
                    deps.setSmartSetlists([]);
                }
            } catch (error) {
                console.error('Error loading smart setlists from server:', error);
                deps.setSmartSetlists([]);
            }
        })();
    }

    function initializeSmartSetlistMultiselects(deps) {
        setupMultiselect('smartConditionKey', 'smartKeyDropdown', 'smartSelectedKeys', deps);
        setupMultiselect('smartConditionTime', 'smartTimeDropdown', 'smartSelectedTimes', deps);
        setupMultiselect('smartConditionTaal', 'smartTaalDropdown', 'smartSelectedTaals', deps);
        setupMultiselect('smartConditionMood', 'smartMoodDropdown', 'smartSelectedMoods', deps);
        setupMultiselect('smartConditionGenre', 'smartGenreDropdown', 'smartSelectedGenres', deps);
        setupMultiselect('smartConditionCategory', 'smartCategoryDropdown', 'smartSelectedCategories', deps);
    }

    function setupMultiselect(inputId, dropdownId, selectedId, deps) {
        const input = document.getElementById(inputId);
        const dropdown = document.getElementById(dropdownId);
        const selected = document.getElementById(selectedId);

        if (!input || !dropdown || !selected) {
            console.error('Missing multiselect elements:', { input: !!input, dropdown: !!dropdown, selected: !!selected });
            return;
        }

        const selections = new Set();

        input.replaceWith(input.cloneNode(true));
        dropdown.replaceWith(dropdown.cloneNode(true));

        const freshInput = document.getElementById(inputId);
        const freshDropdown = document.getElementById(dropdownId);

        freshInput.addEventListener('click', (event) => {
            event.stopPropagation();
            document.querySelectorAll('.multiselect-dropdown.show').forEach((element) => {
                if (element !== freshDropdown) {
                    element.classList.remove('show');
                }
            });
            freshDropdown.classList.toggle('show');
        });

        freshDropdown.addEventListener('click', (event) => {
            if (!event.target.classList.contains('multiselect-option')) return;

            const value = event.target.getAttribute('data-value');
            if (value === '') {
                selections.clear();
            } else if (selections.has(value)) {
                selections.delete(value);
            } else {
                selections.add(value);
                selections.delete('');
            }

            updateSelectedDisplay(inputId, selectedId, selections, deps);
        });

        document.addEventListener('click', (event) => {
            if (!event.target.closest(`#${inputId}`) && !event.target.closest(`#${dropdownId}`)) {
                freshDropdown.classList.remove('show');
            }
        });

        freshDropdown._selections = selections;
    }

    function updateSelectedDisplay(inputId, selectedId, selections, deps) {
        const input = document.getElementById(inputId);
        const selected = document.getElementById(selectedId);

        if (!input || !selected) return;

        if (selections.size === 0) {
            input.value = '';
            selected.innerHTML = '';
        } else {
            const values = Array.from(selections);
            input.value = values.join(', ');
            selected.innerHTML = values.map((value) => `
                <div class="selected-item">
                    ${value}
                    <span class="remove-selected" data-value="${value}" data-input="${inputId}">x</span>
                </div>
            `).join('');
        }

        selected.querySelectorAll('.remove-selected').forEach((button) => {
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                const value = event.target.getAttribute('data-value');
                const inputName = event.target.getAttribute('data-input');
                const dropdownElement = getDropdownElementForInput(inputName);

                if (dropdownElement && dropdownElement._selections) {
                    dropdownElement._selections.delete(value);
                    updateSelectedDisplay(inputName, selectedId, dropdownElement._selections, deps);
                }
            });
        });
    }

    function getDropdownElementForInput(inputId) {
        if (inputId === 'smartConditionKey') return document.getElementById('smartKeyDropdown');
        if (inputId === 'smartConditionTime') return document.getElementById('smartTimeDropdown');
        if (inputId === 'smartConditionTaal') return document.getElementById('smartTaalDropdown');
        if (inputId === 'smartConditionMood') return document.getElementById('smartMoodDropdown');
        if (inputId === 'smartConditionGenre') return document.getElementById('smartGenreDropdown');
        if (inputId === 'smartConditionCategory') return document.getElementById('smartCategoryDropdown');
        return null;
    }

    async function scanSongsWithConditions(conditions, deps) {
        try {
            const scanBtn = document.getElementById('scanSongsBtn');
            if (scanBtn) {
                scanBtn.disabled = true;
                scanBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Scanning...';
            }

            const response = await fetch(`${deps.API_BASE_URL}/api/songs/scan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('jwtToken') || ''}`
                },
                body: JSON.stringify(conditions)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error scanning songs:', error);
            deps.showNotification(`Failed to scan songs: ${error.message}`);
            throw new Error('Failed to scan songs');
        } finally {
            const scanBtn = document.getElementById('scanSongsBtn');
            if (scanBtn) {
                scanBtn.disabled = false;
                scanBtn.innerHTML = '<i class="fas fa-search"></i> Scan Songs';
            }
        }
    }

    function getSmartSetlistConditions() {
        const getSelections = (dropdownId) => {
            const dropdown = document.getElementById(dropdownId);
            return dropdown && dropdown._selections ? Array.from(dropdown._selections).filter((value) => value !== '') : [];
        };

        return {
            keys: getSelections('smartKeyDropdown'),
            tempoMin: parseInt(document.getElementById('smartTempoMin')?.value, 10) || null,
            tempoMax: parseInt(document.getElementById('smartTempoMax')?.value, 10) || null,
            times: getSelections('smartTimeDropdown'),
            taals: getSelections('smartTaalDropdown'),
            moods: getSelections('smartMoodDropdown'),
            genres: getSelections('smartGenreDropdown'),
            categories: getSelections('smartCategoryDropdown')
        };
    }

    function displayScanResults(songs, deps) {
        const resultsDiv = document.getElementById('smartSongsResults');
        const newSongsDiv = document.getElementById('smartNewSongs');
        const oldSongsDiv = document.getElementById('smartOldSongs');

        if (!resultsDiv || !newSongsDiv || !oldSongsDiv) {
            setTimeout(() => displayScanResults(songs, deps), 100);
            return;
        }

        const safeSongs = Array.isArray(songs) ? songs : [];
        const newSongs = safeSongs.filter((song) => song && song.category === 'New');
        const oldSongs = safeSongs.filter((song) => song && song.category === 'Old');

        const newCountEl = document.getElementById('smartNewCount');
        const oldCountEl = document.getElementById('smartOldCount');
        const totalCountEl = document.getElementById('scanResultCount');

        if (newCountEl) newCountEl.textContent = String(newSongs.length);
        if (oldCountEl) oldCountEl.textContent = String(oldSongs.length);
        if (totalCountEl) totalCountEl.textContent = String(safeSongs.length);

        newSongsDiv.innerHTML = renderSmartSongsList(newSongs);
        oldSongsDiv.innerHTML = renderSmartSongsList(oldSongs);

        document.querySelectorAll('.smart-scan-song').forEach((songDiv) => {
            songDiv.addEventListener('click', () => {
                const songId = parseInt(songDiv.dataset.songId, 10);
                const song = safeSongs.find((item) => item.id === songId || item._id === songId);
                if (song) {
                    deps.showPreview(song, false, 'smart-scan');
                }
            });
        });

        resultsDiv.style.display = 'block';
        const scanResults = document.getElementById('scanResults');
        if (scanResults) scanResults.style.display = 'block';

        setupSmartSongTabs();
    }

    function renderSmartSongsList(songs) {
        if (!songs || songs.length === 0) {
            return '<div class="no-songs">No songs found</div>';
        }

        return songs.map((song) => `
            <div class="song-item smart-scan-song" data-song-id="${song.id}">
                <div class="song-title">${song.title}</div>
                <div class="song-metadata">
                    <span class="song-number">#${song.songNumber || song.id}</span>
                    ${song.key ? `<span class="song-key">${song.key}</span>` : ''}
                    ${song.mood ? `<span class="song-mood">${song.mood}</span>` : ''}
                    ${song.tempo ? `<span class="song-tempo">${song.tempo} BPM</span>` : ''}
                    ${song.artistDetails ? `<span class="song-artist">by ${song.artistDetails}</span>` : ''}
                </div>
            </div>
        `).join('');
    }

    function setupSmartSongTabs() {
        const newTab = document.getElementById('smartNewTab');
        const oldTab = document.getElementById('smartOldTab');
        const newSongs = document.getElementById('smartNewSongs');
        const oldSongs = document.getElementById('smartOldSongs');

        if (!newTab || !oldTab || !newSongs || !oldSongs) return;

        newTab.onclick = () => {
            newTab.classList.add('active');
            oldTab.classList.remove('active');
            newSongs.classList.add('active');
            oldSongs.classList.remove('active');
        };

        oldTab.onclick = () => {
            oldTab.classList.add('active');
            newTab.classList.remove('active');
            oldSongs.classList.add('active');
            newSongs.classList.remove('active');
        };
    }

    function renderSmartSetlists(deps) {
        return deps.renderSetlists({
            contentElementId: 'smartSetlistContent',
            dataArray: deps.getSmartSetlists(),
            dataType: 'smart',
            loadFunction: null,
            emptyMessage: 'No smart setlists yet',
            icon: 'fa-brain',
            showHandler: showSmartSetlistInMainSection,
            editHandler: editSmartSetlist,
            deleteHandler: deleteSmartSetlist,
            refreshHandler: updateSmartSetlist,
            descriptionHideTypes: ['my', 'global'],
            checkPermissions: (setlist) => {
                const currentUser = deps.getCurrentUser();
                const isCreator = currentUser && setlist.createdBy === currentUser.id;
                const canEdit = isCreator || (deps.isAdmin() && setlist.isAdminCreated);
                return { canEdit, showActions: canEdit };
            },
            enableMobileTouch: true,
            logPrefix: 'Smart'
        });
    }

    function showSmartSetlistInMainSection(setlistId, deps) {
        const smartSetlist = deps.getSmartSetlists().find((setlist) => setlist.id === setlistId || setlist._id === setlistId);
        if (!smartSetlist || !smartSetlist.songs) {
            console.error('Smart setlist not found or has no songs:', setlistId);
            return;
        }

        deps.setCurrentViewingSetlist(smartSetlist);
        deps.setCurrentSetlistType('smart');

        const newContent = document.getElementById('NewContent');
        const oldContent = document.getElementById('OldContent');
        const setlistSection = document.getElementById('setlistSection');
        const deleteSection = document.getElementById('deleteSection');
        const favoritesSection = document.getElementById('favoritesSection');

        if (newContent) newContent.classList.remove('active');
        if (oldContent) oldContent.classList.remove('active');
        if (setlistSection) setlistSection.style.display = 'block';
        if (deleteSection) deleteSection.style.display = 'none';
        if (favoritesSection) favoritesSection.style.display = 'none';

        const setlistHeader = document.getElementById('setlistViewHeader');
        if (setlistHeader) {
            setlistHeader.textContent = `Smart Setlist: ${smartSetlist.name}`;
        }

        const setlistSectionActions = document.getElementById('setlistSectionActions');
        if (setlistSectionActions) {
            setlistSectionActions.style.display = 'flex';
            setlistSectionActions.innerHTML = `
                <button onclick="goBackToSidebar(event)" class="btn btn-secondary setlist-action-btn" title="Back to Menu" aria-label="Back to Menu">
                    <i class="fas fa-arrow-left"></i>
                </button>
                ${deps.isAdmin() ? `
                    <button class="btn btn-primary setlist-action-btn smart-refresh-btn-header" title="Update Setlist - Rescan and save with current conditions" aria-label="Update Smart Setlist">
                        <i class="fas fa-sync"></i>
                    </button>
                    <button class="btn btn-secondary setlist-action-btn edit-smart-setlist-header" title="Edit Smart Setlist" aria-label="Edit Smart Setlist">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger setlist-action-btn delete-smart-setlist-header delete-setlist" title="Delete Smart Setlist" aria-label="Delete Smart Setlist">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            `;

            if (deps.isAdmin()) {
                const refreshBtn = setlistSectionActions.querySelector('.smart-refresh-btn-header');
                const editBtn = setlistSectionActions.querySelector('.edit-smart-setlist-header');
                const deleteBtn = setlistSectionActions.querySelector('.delete-smart-setlist-header');

                if (refreshBtn) {
                    refreshBtn.onclick = (event) => {
                        event.stopPropagation();
                        updateSmartSetlist(smartSetlist.id || smartSetlist._id, deps);
                    };
                }
                if (editBtn) {
                    editBtn.onclick = (event) => {
                        event.stopPropagation();
                        editSmartSetlist(smartSetlist.id || smartSetlist._id, deps);
                    };
                }
                if (deleteBtn) {
                    deleteBtn.onclick = (event) => {
                        event.stopPropagation();
                        deleteSmartSetlist(smartSetlist.id || smartSetlist._id, deps);
                    };
                }
            }
        }

        const fullSongData = smartSetlist.songs.map((smartSong) => {
            const fullSong = deps.getSongs().find((song) => song.id === smartSong.id);
            return fullSong || smartSong;
        }).filter(Boolean);

        const newSongs = fullSongData.filter((song) => song.category === 'New');
        const oldSongs = fullSongData.filter((song) => song.category === 'Old');

        const newSetlistTab = document.getElementById('NewSetlistTab');
        const oldSetlistTab = document.getElementById('OldSetlistTab');
        const newSetlistSongs = document.getElementById('NewSetlistSongs');
        const oldSetlistSongs = document.getElementById('OldSetlistSongs');

        if (newSetlistSongs) {
            deps.displaySetlistSongs(newSongs, newSetlistSongs, 'smart-setlist');
        }
        if (oldSetlistSongs) {
            deps.displaySetlistSongs(oldSongs, oldSetlistSongs, 'smart-setlist');
        }

        if (newSetlistTab) newSetlistTab.textContent = `New (${newSongs.length})`;
        if (oldSetlistTab) oldSetlistTab.textContent = `Old (${oldSongs.length})`;

        if (newSetlistTab && oldSetlistTab && newSetlistSongs && oldSetlistSongs) {
            if (oldSongs.length > newSongs.length && newSongs.length === 0) {
                newSetlistTab.classList.remove('active');
                oldSetlistTab.classList.add('active');
                newSetlistSongs.style.display = 'none';
                oldSetlistSongs.style.display = 'block';
            } else {
                newSetlistTab.classList.add('active');
                oldSetlistTab.classList.remove('active');
                newSetlistSongs.style.display = 'block';
                oldSetlistSongs.style.display = 'none';
            }

            newSetlistTab.onclick = () => {
                newSetlistTab.classList.add('active');
                oldSetlistTab.classList.remove('active');
                newSetlistSongs.style.display = 'block';
                oldSetlistSongs.style.display = 'none';
            };

            oldSetlistTab.onclick = () => {
                oldSetlistTab.classList.add('active');
                newSetlistTab.classList.remove('active');
                oldSetlistSongs.style.display = 'block';
                newSetlistSongs.style.display = 'none';
            };
        }

        if (window.innerWidth <= 768) {
            document.querySelector('.songs-section')?.classList.remove('hidden');
            document.querySelector('.sidebar')?.classList.add('hidden');
            document.querySelector('.preview-section')?.classList.remove('full-width');
        }

        deps.showNotification(`Showing smart setlist: ${smartSetlist.name} (${smartSetlist.songs.length} songs)`);
    }

    function createSmartSetlist(deps) {
        const setValue = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.value = value;
        };

        setValue('smartSetlistId', '');
        setValue('smartSetlistName', '');
        setValue('smartSetlistDescription', '');
        setValue('smartTempoMin', '');
        setValue('smartTempoMax', '');
        setValue('smartConditionKey', '');
        setValue('smartConditionTime', '');
        setValue('smartConditionTaal', '');
        setValue('smartConditionMood', '');
        setValue('smartConditionGenre', '');
        setValue('smartConditionCategory', '');

        ['smartKeyDropdown', 'smartTimeDropdown', 'smartTaalDropdown', 'smartMoodDropdown', 'smartGenreDropdown', 'smartCategoryDropdown'].forEach((dropdownId) => {
            const dropdown = document.getElementById(dropdownId);
            if (dropdown && dropdown._selections) {
                dropdown._selections.clear();
            }
        });

        ['smartSelectedKeys', 'smartSelectedTimes', 'smartSelectedTaals', 'smartSelectedMoods', 'smartSelectedGenres', 'smartSelectedCategories'].forEach((selectedId) => {
            const selected = document.getElementById(selectedId);
            if (selected) selected.innerHTML = '';
        });

        const scanResults = document.getElementById('scanResults');
        const smartSongsResults = document.getElementById('smartSongsResults');
        if (scanResults) scanResults.style.display = 'none';
        if (smartSongsResults) smartSongsResults.style.display = 'none';
        deps.setSmartSetlistScanResults([]);

        const modalTitle = document.getElementById('smartSetlistModalTitle');
        const submitButton = document.getElementById('smartSetlistSubmit');
        if (modalTitle) modalTitle.textContent = 'Create Smart Setlist';
        if (submitButton) submitButton.textContent = 'Create Smart Setlist';

        setTimeout(() => initializeSmartSetlistMultiselects(deps), 100);
        deps.openModal('smartSetlistModal');
    }

    async function createSmartSetlistWithSongs(formData, deps) {
        if (!deps.getCurrentUser()) {
            deps.showNotification('Please log in to create smart setlists', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('jwtToken');
            if (!token) {
                deps.showNotification('Authentication required', 'error');
                return;
            }

            const smartSetlistData = {
                name: formData.name,
                description: formData.description,
                conditions: formData.conditions,
                songs: deps.getSmartSetlistScanResults()
            };

            const response = await fetch(`${deps.API_BASE_URL}/api/smart-setlists`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(smartSetlistData)
            });

            if (response.ok) {
                const newSmartSetlist = await response.json();
                deps.setSmartSetlists([...deps.getSmartSetlists(), newSmartSetlist]);
                renderSmartSetlists(deps);
                deps.showNotification(`Smart setlist "${newSmartSetlist.name}" created with ${deps.getSmartSetlistScanResults().length} songs`);
                return;
            }

            let errorMessage = 'Unknown error';
            if (response.status === 413) {
                errorMessage = 'Smart setlist data is too large. Try reducing the number of songs or conditions.';
            } else {
                try {
                    const error = await response.json();
                    errorMessage = error.error || error.message || `HTTP ${response.status}: ${response.statusText}`;
                } catch (jsonError) {
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }
            }
            deps.showNotification(`Failed to create smart setlist: ${errorMessage}`, 'error');
        } catch (error) {
            console.error('Error creating smart setlist:', error);
            deps.showNotification('Failed to create smart setlist', 'error');
        }
    }

    function editSmartSetlist(setlistId, deps) {
        const smartSetlist = deps.getSmartSetlists().find((setlist) => setlist.id === setlistId || setlist._id === setlistId);
        if (!smartSetlist) {
            console.error('Smart setlist not found for editing:', setlistId);
            return;
        }

        const setValue = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.value = value;
        };

        setValue('smartSetlistId', smartSetlist.id || smartSetlist._id);
        setValue('smartSetlistName', smartSetlist.name);
        setValue('smartSetlistDescription', smartSetlist.description || '');

        function populateMultiselect(dropdownId, inputId, selectedId, values) {
            const dropdown = document.getElementById(dropdownId);
            if (!dropdown) return;
            if (!dropdown._selections) {
                dropdown._selections = new Set();
            }
            dropdown._selections.clear();
            (values || []).forEach((value) => dropdown._selections.add(value));
            updateSelectedDisplay(inputId, selectedId, dropdown._selections, deps);
        }

        if (smartSetlist.conditions) {
            const conditions = smartSetlist.conditions;
            setValue('smartTempoMin', conditions.tempoMin || '');
            setValue('smartTempoMax', conditions.tempoMax || '');
            populateMultiselect('smartKeyDropdown', 'smartConditionKey', 'smartSelectedKeys', conditions.keys);
            populateMultiselect('smartTimeDropdown', 'smartConditionTime', 'smartSelectedTimes', conditions.times);
            populateMultiselect('smartTaalDropdown', 'smartConditionTaal', 'smartSelectedTaals', conditions.taals);
            populateMultiselect('smartMoodDropdown', 'smartConditionMood', 'smartSelectedMoods', conditions.moods);
            populateMultiselect('smartGenreDropdown', 'smartConditionGenre', 'smartSelectedGenres', conditions.genres);
            populateMultiselect('smartCategoryDropdown', 'smartConditionCategory', 'smartSelectedCategories', conditions.categories);
        } else {
            setTimeout(() => {
                populateMultiselect('smartKeyDropdown', 'smartConditionKey', 'smartSelectedKeys', []);
                populateMultiselect('smartTimeDropdown', 'smartConditionTime', 'smartSelectedTimes', []);
                populateMultiselect('smartTaalDropdown', 'smartConditionTaal', 'smartSelectedTaals', []);
                populateMultiselect('smartMoodDropdown', 'smartConditionMood', 'smartSelectedMoods', []);
                populateMultiselect('smartGenreDropdown', 'smartConditionGenre', 'smartSelectedGenres', []);
                populateMultiselect('smartCategoryDropdown', 'smartConditionCategory', 'smartSelectedCategories', []);
                setValue('smartTempoMin', '');
                setValue('smartTempoMax', '');
            }, 50);
        }

        const modalTitle = document.getElementById('smartSetlistModalTitle');
        const submitButton = document.getElementById('smartSetlistSubmit');
        if (modalTitle) modalTitle.textContent = 'Edit Smart Setlist';
        if (submitButton) submitButton.textContent = 'Update Smart Setlist';

        if (smartSetlist.songs) {
            deps.setSmartSetlistScanResults(smartSetlist.songs);
            displayScanResults(smartSetlist.songs, deps);
        }

        deps.openModal('smartSetlistModal');

        setTimeout(() => {
            initializeSmartSetlistMultiselects(deps);
            if (smartSetlist.conditions) {
                const conditions = smartSetlist.conditions;
                setValue('smartTempoMin', conditions.tempoMin || '');
                setValue('smartTempoMax', conditions.tempoMax || '');
                setTimeout(() => {
                    populateMultiselect('smartKeyDropdown', 'smartConditionKey', 'smartSelectedKeys', conditions.keys);
                    populateMultiselect('smartTimeDropdown', 'smartConditionTime', 'smartSelectedTimes', conditions.times);
                    populateMultiselect('smartTaalDropdown', 'smartConditionTaal', 'smartSelectedTaals', conditions.taals);
                    populateMultiselect('smartMoodDropdown', 'smartConditionMood', 'smartSelectedMoods', conditions.moods);
                    populateMultiselect('smartGenreDropdown', 'smartConditionGenre', 'smartSelectedGenres', conditions.genres);
                    populateMultiselect('smartCategoryDropdown', 'smartConditionCategory', 'smartSelectedCategories', conditions.categories);
                }, 50);
            }
        }, 100);
    }

    async function deleteSmartSetlist(setlistId, deps) {
        const setlist = deps.getSmartSetlists().find((item) => item.id === setlistId || item._id === setlistId);
        if (!setlist) return;

        const modal = document.getElementById('confirmDeleteSetlistModal');
        const message = document.getElementById('deleteSetlistMessage');
        if (message) {
            message.textContent = `Are you sure you want to delete the smart setlist "${setlist.name}"?`;
        }
        if (modal) {
            modal.style.display = 'flex';
        }

        const confirmButton = document.getElementById('confirmDeleteSetlist');
        if (confirmButton) {
            confirmButton.onclick = async () => {
                if (modal) modal.style.display = 'none';

                if (!deps.getCurrentUser()) {
                    deps.showNotification('Authentication required', 'error');
                    return;
                }

                try {
                    const token = localStorage.getItem('jwtToken');
                    if (!token) {
                        deps.showNotification('Authentication required', 'error');
                        return;
                    }

                    const response = await fetch(`${deps.API_BASE_URL}/api/smart-setlists/${setlistId}`, {
                        method: 'DELETE',
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        deps.setSmartSetlists(deps.getSmartSetlists().filter((item) => item.id !== setlistId && item._id !== setlistId));
                        renderSmartSetlists(deps);
                        deps.showNotification('Smart setlist deleted');
                        return;
                    }

                    let errorMessage = 'Unknown error';
                    try {
                        const error = await response.json();
                        errorMessage = error.error || error.message || `HTTP ${response.status}: ${response.statusText}`;
                    } catch (jsonError) {
                        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                    }
                    deps.showNotification(`Failed to delete smart setlist: ${errorMessage}`, 'error');
                } catch (error) {
                    console.error('Error deleting smart setlist:', error);
                    deps.showNotification('Failed to delete smart setlist', 'error');
                }
            };
        }

        const cancelButton = document.getElementById('cancelDeleteSetlist');
        if (cancelButton) {
            cancelButton.onclick = () => {
                if (modal) modal.style.display = 'none';
            };
        }
    }

    async function updateSmartSetlist(setlistId, deps) {
        const smartSetlist = deps.getSmartSetlists().find((setlist) => setlist.id === setlistId || setlist._id === setlistId);
        if (!smartSetlist || !smartSetlist.conditions) {
            deps.showNotification('Cannot update: Smart setlist or conditions not found', 'error');
            return;
        }

        if (!deps.getCurrentUser()) {
            deps.showNotification('Authentication required', 'error');
            return;
        }

        try {
            deps.showNotification(`Updating "${smartSetlist.name}"...`);
            const updatedSongs = await scanSongsWithConditions(smartSetlist.conditions, deps);

            const token = localStorage.getItem('jwtToken');
            if (!token) {
                deps.showNotification('Authentication required', 'error');
                return;
            }

            const updateData = {
                name: smartSetlist.name,
                description: smartSetlist.description,
                conditions: smartSetlist.conditions,
                songs: updatedSongs || []
            };

            const response = await fetch(`${deps.API_BASE_URL}/api/smart-setlists/${setlistId}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            if (response.ok) {
                const updatedSmartSetlist = await response.json();
                const nextSetlists = deps.getSmartSetlists().slice();
                const index = nextSetlists.findIndex((setlist) => setlist.id === setlistId || setlist._id === setlistId);
                if (index !== -1) {
                    nextSetlists[index] = updatedSmartSetlist;
                    deps.setSmartSetlists(nextSetlists);
                }

                renderSmartSetlists(deps);

                const currentViewingSetlist = deps.getCurrentViewingSetlist();
                if (currentViewingSetlist && deps.getCurrentSetlistType() === 'smart' && (currentViewingSetlist.id === setlistId || currentViewingSetlist._id === setlistId)) {
                    showSmartSetlistInMainSection(setlistId, deps);
                }

                deps.showNotification(`Smart setlist "${updatedSmartSetlist.name}" updated with ${updatedSongs.length} songs`);
                return;
            }

            let errorMessage = 'Unknown error';
            if (response.status === 413) {
                errorMessage = 'Smart setlist data is too large. Try reducing the number of songs or conditions.';
            } else {
                try {
                    const error = await response.json();
                    errorMessage = error.error || error.message || `HTTP ${response.status}: ${response.statusText}`;
                } catch (jsonError) {
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }
            }
            deps.showNotification(`Failed to update smart setlist: ${errorMessage}`, 'error');
        } catch (error) {
            console.error('Error updating smart setlist:', error);
            deps.showNotification('Failed to update smart setlist', 'error');
        }
    }

    async function updateSmartSetlistForm(setlistId, formData, deps) {
        if (!deps.getCurrentUser()) {
            deps.showNotification('Authentication required', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('jwtToken');
            if (!token) {
                deps.showNotification('Authentication required', 'error');
                return;
            }

            const response = await fetch(`${deps.API_BASE_URL}/api/smart-setlists/${setlistId}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const updatedSmartSetlist = await response.json();
                const nextSetlists = deps.getSmartSetlists().slice();
                const index = nextSetlists.findIndex((setlist) => setlist.id === setlistId || setlist._id === setlistId);
                if (index !== -1) {
                    nextSetlists[index] = updatedSmartSetlist;
                    deps.setSmartSetlists(nextSetlists);
                }

                renderSmartSetlists(deps);
                deps.showNotification('Smart setlist updated successfully');
                return;
            }

            let errorMessage = 'Unknown error';
            if (response.status === 413) {
                errorMessage = 'Smart setlist data is too large. Try reducing the number of songs or conditions.';
            } else {
                try {
                    const error = await response.json();
                    errorMessage = error.error || error.message || `HTTP ${response.status}: ${response.statusText}`;
                } catch (jsonError) {
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }
            }
            deps.showNotification(`Failed to update smart setlist: ${errorMessage}`, 'error');
        } catch (error) {
            console.error('Error updating smart setlist:', error);
            deps.showNotification('Failed to update smart setlist', 'error');
        }
    }

    function initializeSmartSetlistUI(deps) {
        const smartHeader = document.getElementById('smartSetlistHeader');
        const addSmartBtn = document.getElementById('addSmartSetlistBtn');

        if (smartHeader && !smartHeader._smartSetlistListenerAttached) {
            smartHeader._smartSetlistListenerAttached = true;
            smartHeader.addEventListener('click', (event) => {
                if (event.target.closest('.add-setlist-btn')) return;
                event.preventDefault();
                event.stopPropagation();

                const smartSetlistContent = document.getElementById('smartSetlistContent');
                const smartSetlistIcon = document.getElementById('smartSetlistIcon');
                const addSmartSetlistBtn = document.getElementById('addSmartSetlistBtn');

                if (!smartSetlistContent || !smartSetlistIcon) return;

                const isExpanded = smartSetlistContent.style.display === 'block';
                smartSetlistContent.style.display = isExpanded ? 'none' : 'block';
                smartSetlistIcon.classList.toggle('expanded', !isExpanded);

                if (addSmartSetlistBtn) {
                    const shouldShow = !isExpanded && !!deps.getCurrentUser();
                    addSmartSetlistBtn.style.display = shouldShow ? 'block' : 'none';
                }
            });
        }

        if (addSmartBtn && !addSmartBtn._smartSetlistListenerAttached) {
            addSmartBtn._smartSetlistListenerAttached = true;
            addSmartBtn.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                createSmartSetlist(deps);
            });
        }

        const smartSetlistForm = document.getElementById('smartSetlistForm');
        if (smartSetlistForm && !smartSetlistForm._submitListenerAttached) {
            smartSetlistForm._submitListenerAttached = true;
            smartSetlistForm.addEventListener('submit', async (event) => {
                event.preventDefault();

                const setlistId = document.getElementById('smartSetlistId')?.value;
                const name = document.getElementById('smartSetlistName')?.value.trim();
                const description = document.getElementById('smartSetlistDescription')?.value.trim();

                if (!name) {
                    deps.showNotification('Please enter a name for the smart setlist');
                    return;
                }

                if (!deps.getSmartSetlistScanResults() || deps.getSmartSetlistScanResults().length === 0) {
                    deps.showNotification('Please scan for songs before saving the smart setlist');
                    return;
                }

                try {
                    const formData = {
                        name,
                        description,
                        conditions: getSmartSetlistConditions(),
                        songs: deps.getSmartSetlistScanResults()
                    };

                    if (setlistId) {
                        await updateSmartSetlistForm(setlistId, formData, deps);
                    } else {
                        await createSmartSetlistWithSongs(formData, deps);
                    }

                    const modal = document.getElementById('smartSetlistModal');
                    if (modal) modal.style.display = 'none';
                } catch (error) {
                    console.error('Error saving smart setlist:', error);
                    deps.showNotification('Failed to save smart setlist');
                }
            });
        }

        const scanSongsBtn = document.getElementById('scanSongsBtn');
        if (scanSongsBtn && !scanSongsBtn._scanListenerAttached) {
            scanSongsBtn._scanListenerAttached = true;
            scanSongsBtn.addEventListener('click', async () => {
                try {
                    const results = await scanSongsWithConditions(getSmartSetlistConditions(), deps);
                    deps.setSmartSetlistScanResults(results);
                    displayScanResults(results, deps);
                } catch (error) {
                    console.error('Error scanning songs:', error);
                    deps.showNotification('Error scanning songs. Please try again.');
                }
            });
        }

        const scanNewTab = document.getElementById('scanNewTab');
        const scanOldTab = document.getElementById('scanOldTab');
        if (scanNewTab && scanOldTab && !scanNewTab._tabListenerAttached) {
            scanNewTab._tabListenerAttached = true;
            scanOldTab._tabListenerAttached = true;

            scanNewTab.addEventListener('click', () => {
                scanNewTab.classList.add('active');
                scanOldTab.classList.remove('active');
                document.getElementById('smartNewResults').style.display = 'block';
                document.getElementById('smartOldResults').style.display = 'none';
            });

            scanOldTab.addEventListener('click', () => {
                scanOldTab.classList.add('active');
                scanNewTab.classList.remove('active');
                document.getElementById('smartOldResults').style.display = 'block';
                document.getElementById('smartNewResults').style.display = 'none';
            });
        }
    }

    window.SmartSetlistsUI = {
        loadSmartSetlistsFromServer,
        initializeSmartSetlistMultiselects,
        setupMultiselect,
        updateSelectedDisplay,
        scanSongsWithConditions,
        getSmartSetlistConditions,
        displayScanResults,
        renderSmartSongsList,
        setupSmartSongTabs,
        renderSmartSetlists,
        showSmartSetlistInMainSection,
        createSmartSetlist,
        createSmartSetlistWithSongs,
        editSmartSetlist,
        deleteSmartSetlist,
        updateSmartSetlist,
        updateSmartSetlistForm,
        initializeSmartSetlistUI,
    };
})(window);