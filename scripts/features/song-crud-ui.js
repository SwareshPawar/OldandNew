(function attachSongCrudUI(window) {
    if (!window) {
        return;
    }

    function findSongById(searchId, deps) {
        const numId = typeof searchId === 'string' ? parseInt(searchId, 10) : searchId;
        const strId = String(searchId);

        const sources = [
            deps.getSongs ? deps.getSongs() : [],
            deps.getDataCacheSongs ? deps.getDataCacheSongs() : [],
            deps.getWindowSongs ? deps.getWindowSongs() : []
        ];

        for (const source of sources) {
            if (!Array.isArray(source) || source.length === 0) {
                continue;
            }

            const found = source.find((song) => song.id === numId || song.id === strId || String(song.id) === strId);
            if (found) {
                return found;
            }
        }

        return null;
    }

    function editSong(id, deps) {
        const song = findSongById(id, deps);
        if (!song) {
            console.error(`❌ Edit Song: Song with ID ${id} not found in any data source`);
            return;
        }

        console.log(`🎵 Edit Song: Editing song ${song.id} "${song.title}" - mood: "${song.mood}"`);

        document.getElementById('editSongId').value = Number(song.id);
        document.getElementById('editSongTitle').value = song.title;
        document.getElementById('editSongCategory').value = song.category;
        document.getElementById('editSongKey').value = song.key;

        const artists = song.artistDetails ? song.artistDetails.split(',').map((artist) => artist.trim()).filter(Boolean) : [];
        deps.setupSearchableMultiselect('editSongArtist', 'editArtistDropdown', 'editSelectedArtists', deps.ARTISTS, true);
        setTimeout(() => {
            const editArtistDropdown = document.getElementById('editArtistDropdown');
            if (editArtistDropdown && editArtistDropdown._allSelections) {
                editArtistDropdown._allSelections.clear();
                artists.forEach((artist) => {
                    editArtistDropdown._allSelections.add(artist);
                });
                deps.updateSelectedMultiselect('editSelectedArtists', 'editArtistDropdown', true, 'editSongArtist');
                deps.renderMultiselectOptions('editArtistDropdown', deps.ARTISTS, Array.from(editArtistDropdown._allSelections));
                deps.updateSearchableInput('editSongArtist', 'editSelectedArtists');
                console.log(`🎵 Edit Song - Artist multiselect initialized with: [${Array.from(editArtistDropdown._allSelections).join(', ')}]`);
            }
        }, 100);

        const moods = song.mood ? song.mood.split(',').map((mood) => mood.trim()).filter(Boolean) : [];
        console.log(`🎵 Edit Song - Raw mood: "${song.mood}" → Split moods: [${moods.join(', ')}]`);

        deps.setupSearchableMultiselect('editSongMood', 'editMoodDropdown', 'editSelectedMoods', deps.MOODS, true);
        setTimeout(() => {
            const editMoodDropdown = document.getElementById('editMoodDropdown');
            if (editMoodDropdown && editMoodDropdown._allSelections) {
                editMoodDropdown._allSelections.clear();
                moods.forEach((mood) => {
                    editMoodDropdown._allSelections.add(mood);
                });
                deps.updateSelectedMultiselect('editSelectedMoods', 'editMoodDropdown', true, 'editSongMood');
                deps.renderMultiselectOptions('editMoodDropdown', deps.MOODS, Array.from(editMoodDropdown._allSelections));
                deps.updateSearchableInput('editSongMood', 'editSelectedMoods');
                console.log(`🎵 Edit Song - Mood multiselect initialized with: [${Array.from(editMoodDropdown._allSelections).join(', ')}]`);
            }
        }, 100);

        document.getElementById('editSongTempo').value = song.tempo;
        document.getElementById('editSongTime').value = song.time || song.timeSignature;
        deps.updateTaalDropdown('editSongTime', 'editSongTaal', song.taal);

        // Set rhythm set dropdown
        const editRhythmSetEl = document.getElementById('editSongRhythmSet');
        if (editRhythmSetEl) {
            editRhythmSetEl.value = song.rhythmSetId || '';
        }

        const editRhythmCategoryEl = document.getElementById('editSongRhythmCategory');
        if (editRhythmCategoryEl) {
            editRhythmCategoryEl.value = deps.normalizeRhythmCategoryValue(song.rhythmCategory || '');
        }

        deps.setupSearchableMultiselect('editSongGenre', 'editGenreDropdown', 'editSelectedGenres', deps.GENRES, true);
        const genres = song.genres || (song.genre ? [song.genre] : []);
        console.log(`🎵 Edit Song - Raw genre: "${song.genre}" → Split genres: [${genres.join(', ')}]`);

        setTimeout(() => {
            const editGenreDropdown = document.getElementById('editGenreDropdown');
            if (editGenreDropdown && editGenreDropdown._allSelections) {
                editGenreDropdown._allSelections.clear();
                genres.forEach((genre) => {
                    editGenreDropdown._allSelections.add(genre);
                });
                deps.updateSelectedMultiselect('editSelectedGenres', 'editGenreDropdown', true, 'editSongGenre');
                deps.renderMultiselectOptions('editGenreDropdown', deps.GENRES, Array.from(editGenreDropdown._allSelections));
                deps.updateSearchableInput('editSongGenre', 'editSelectedGenres');
                console.log(`🎵 Edit Song - Genre multiselect initialized with: [${Array.from(editGenreDropdown._allSelections).join(', ')}]`);
            }
        }, 100);

        document.getElementById('editSongLyrics').value = song.lyrics;

        const editSongModal = deps.getEditSongModal ? deps.getEditSongModal() : document.getElementById('editSongModal');
        if (editSongModal) {
            editSongModal.style.display = 'flex';
        }
    }

    function openDeleteSongModal(id, deps) {
        const songList = deps.getSongs ? deps.getSongs() : [];
        const song = songList.find((entry) => entry.id === Number(id));
        if (!song) {
            return;
        }

        document.getElementById('deleteSongId').value = Number(song.id);
        document.getElementById('deleteSongTitle').textContent = song.title;

        const deleteSongModal = deps.getDeleteSongModal ? deps.getDeleteSongModal() : document.getElementById('deleteSongModal');
        if (deleteSongModal) {
            deleteSongModal.style.display = 'flex';
        }
    }

    async function deleteSongById(songId, postDeleteCallback, deps) {
        try {
            const resp = await deps.authFetch(`${deps.API_BASE_URL}/api/songs/${songId}`, {
                method: 'DELETE'
            });

            if (resp.ok) {
                const nextSongs = (deps.getSongs ? deps.getSongs() : []).filter((song) => song.id !== songId);
                deps.setSongs(nextSongs);

                const dataCacheSongs = deps.getDataCacheSongs ? deps.getDataCacheSongs() : null;
                if (Array.isArray(dataCacheSongs)) {
                    deps.setDataCacheSongs(dataCacheSongs.filter((song) => song.id !== songId));
                }

                localStorage.setItem('songs', JSON.stringify(nextSongs));

                const timestamp = new Date().toISOString();
                deps.setSongsSyncTimestamp(timestamp);
                localStorage.setItem('songsSyncTimestamp', timestamp);

                console.log(`🗑️ Deleted song ${songId} from cache and backend`);
                deps.showNotification('Song deleted successfully');
                if (typeof postDeleteCallback === 'function') {
                    postDeleteCallback();
                }
            } else if (resp.status === 404) {
                deps.showNotification('Song not found in backend (already deleted)');
            } else {
                deps.showNotification('Failed to delete song from backend');
            }
        } catch (err) {
            deps.showNotification('Error deleting song from backend');
        }

        deps.updateSongCount();
    }

    async function handleEditSongSubmit(deps) {
        const id = document.getElementById('editSongId').value;
        const title = document.getElementById('editSongTitle').value;
        const lyrics = document.getElementById('editSongLyrics').value;

        const selectedGenres = Array.from(document.querySelectorAll('#editGenreDropdown .multiselect-option.selected'))
            .map((opt) => opt.dataset.value);

        const editMoodDropdown = document.getElementById('editMoodDropdown');
        const editArtistDropdown = document.getElementById('editArtistDropdown');
        const selectedMoods = Array.from((editMoodDropdown && editMoodDropdown._allSelections) || []);
        const selectedArtists = Array.from((editArtistDropdown && editArtistDropdown._allSelections) || []);

        const editRhythmSetIdInput = document.getElementById('editSongRhythmSet')?.value || '';
        const editRhythmSetId = editRhythmSetIdInput.trim();

        const original = (deps.getSongs() || []).find((song) => song.id == id) || {};
        const currentUser = deps.getCurrentUser ? deps.getCurrentUser() : null;
        const updatedSong = {
            id: Number(id),
            title,
            category: document.getElementById('editSongCategory').value,
            rhythmCategory: deps.normalizeRhythmCategoryValue(document.getElementById('editSongRhythmCategory')?.value || ''),
            key: deps.normalizeKeySignature(document.getElementById('editSongKey').value),
            artistDetails: selectedArtists.length > 0 ? selectedArtists.join(', ') : '',
            mood: selectedMoods.length > 0 ? selectedMoods.join(', ') : '',
            tempo: document.getElementById('editSongTempo').value,
            time: document.getElementById('editSongTime').value,
            taal: document.getElementById('editSongTaal').value,
            genres: selectedGenres,
            ...(editRhythmSetId ? { rhythmSetId: editRhythmSetId } : {}),
            lyrics,
            createdBy: original.createdBy || (currentUser && currentUser.username) || undefined,
            createdAt: original.createdAt || new Date().toISOString()
        };

        try {
            console.log(`🔄 Updating song in backend: ${updatedSong.title}`);
            const response = await deps.authFetch(`${deps.API_BASE_URL}/api/songs/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedSong)
            });

            if (response.ok) {
                let updated;
                try {
                    updated = await response.json();
                    console.log('✅ Backend update successful, received updated song data', updated);
                } catch (parseError) {
                    console.log('⚠️ Backend updated but no song data in response, using sent data');
                    updated = { ...updatedSong, id: Number(id) };
                }

                if (updated && updated.id && updated.title) {
                    deps.showNotification('Song updated successfully!');
                    const editSongModal = deps.getEditSongModal ? deps.getEditSongModal() : document.getElementById('editSongModal');
                    const editSongForm = deps.getEditSongForm ? deps.getEditSongForm() : document.getElementById('editSongForm');
                    if (editSongModal) editSongModal.style.display = 'none';
                    if (editSongForm) editSongForm.reset();

                    console.log('💾 Updating cache with updated song data');
                    deps.updateSongInCache(updated, false);

                    const activeTab = deps.getActiveTab();
                    console.log(`🎵 Edit song complete - Updated song category: ${updated.category}, Active tab: ${activeTab}`);
                    if (updated.category === activeTab) {
                        console.log(`✅ Rendering ${updated.category} tab after edit`);
                        deps.debouncedRenderSongs(updated.category, deps.getKeyFilterValue(), deps.getGenreFilterValue());
                    } else {
                        console.log(`⏭️ Skipping render - song category (${updated.category}) doesn't match active tab (${activeTab})`);
                    }

                    const songPreviewEl = deps.getSongPreviewEl ? deps.getSongPreviewEl() : document.getElementById('songPreview');
                    if (songPreviewEl && songPreviewEl.dataset.songId == id) {
                        const preservedContext = songPreviewEl.dataset.openingContext || 'all-songs';
                        deps.showPreview(updated, false, preservedContext);
                    }
                    return { ok: true, updated };
                }

                if (updated && updated.message) {
                    console.error('❌ Backend did not return updated song object. Received:', updated);
                    deps.showNotification('Backend did not return updated song object. Please check server response.', 'error');
                    return { ok: false, error: 'invalid-response-message' };
                }

                console.error('❌ Cannot update cache - invalid song data:', updated);
                deps.showNotification('Failed to update song: invalid backend response', 'error');
                return { ok: false, error: 'invalid-response-data' };
            }

            const errorText = await response.text();
            console.error('❌ Backend update failed:', response.status, errorText);
            deps.showNotification(`Failed to update song: ${response.status}`);
            return { ok: false, error: `http-${response.status}` };
        } catch (err) {
            deps.showNotification('Error updating song');
            return { ok: false, error: 'request-failed' };
        }
    }

    function hideDeleteSongModal(deps) {
        const deleteSongModal = deps.getDeleteSongModal ? deps.getDeleteSongModal() : document.getElementById('deleteSongModal');
        if (deleteSongModal) {
            deleteSongModal.style.display = 'none';
        }
    }

    async function handleDeleteSongConfirm(deps) {
        const id = Number(document.getElementById('deleteSongId').value);
        const deleteBtn = document.getElementById('confirmDeleteSong');
        if (deleteBtn) {
            deleteBtn.disabled = true;
        }

        try {
            await deleteSongById(id, () => {
                hideDeleteSongModal(deps);
                const activeTab = deps.getActiveTab();
                deps.debouncedRenderSongs(activeTab, deps.getKeyFilterValue(), deps.getGenreFilterValue());
            }, deps);
        } finally {
            if (deleteBtn) {
                deleteBtn.disabled = false;
            }
        }
    }

    window.SongCrudUI = {
        deleteSongById,
        editSong,
        handleDeleteSongConfirm,
        handleEditSongSubmit,
        hideDeleteSongModal,
        findSongById,
        openDeleteSongModal
    };
})(window);