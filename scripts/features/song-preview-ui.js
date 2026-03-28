(function attachSongPreviewUI(window) {
    if (!window) {
        return;
    }

    function getDisplayName(createdBy, deps) {
        const currentUser = deps.getCurrentUser ? deps.getCurrentUser() : null;

        if (createdBy && createdBy.length === 24 && /^[0-9a-fA-F]+$/.test(createdBy)) {
            if (currentUser && currentUser._id === createdBy) {
                return currentUser.firstName || currentUser.username || 'Unknown User';
            }
            return 'User';
        }

        if (currentUser && createdBy === currentUser.username) {
            return currentUser.firstName || currentUser.username || 'Unknown User';
        }

        return createdBy || 'Unknown User';
    }

    function isChordLine(line, deps) {
        return deps.CHORD_LINE_REGEX.test(line.trim());
    }

    function hasInlineChords(line, deps) {
        deps.INLINE_CHORD_REGEX.lastIndex = 0;
        return deps.INLINE_CHORD_REGEX.test(line);
    }

    function transposeSingleChord(chord, steps, deps) {
        if (!chord) return chord;

        const match = chord.match(/^([A-G][#b]?)(.*)$/i);
        if (!match) return chord;

        const baseNote = match[1];
        const quality = match[2] || '';
        const normalizedBaseNote = deps.normalizeBaseNote(baseNote);
        const chromaticScale = deps.CHORDS;

        const currentIndex = chromaticScale.indexOf(normalizedBaseNote);
        if (currentIndex === -1) return chord;

        const shift = Number.isFinite(steps) ? steps : 0;
        const newIndex = (currentIndex + shift + 12) % 12;
        let newBaseNote = chromaticScale[newIndex];

        if (baseNote === baseNote.toLowerCase()) {
            newBaseNote = newBaseNote.toLowerCase();
        }

        return newBaseNote + quality;
    }

    function transposeChord(chord, steps, deps) {
        if (!chord) return chord;
        const safeSteps = Number.isFinite(steps) ? steps : 0;

        if (chord.includes('/')) {
            const [baseChord, bassNote] = chord.split('/');
            const transposedBase = transposeSingleChord(baseChord, safeSteps, deps);
            const transposedBass = bassNote ? transposeSingleChord(bassNote, safeSteps, deps) : '';
            return transposedBase + (transposedBass ? '/' + transposedBass : '');
        }

        return transposeSingleChord(chord, safeSteps, deps);
    }

    function formatLyricsWithChords(lyrics, transposeLevel, deps) {
        if (!lyrics || typeof lyrics !== 'string') {
            return '<div class="lyric-line">No lyrics available</div>';
        }

        const lines = lyrics.split('\n');
        const output = [];
        const structureTagRegex = /^\s*[\[\(]?\s*(verse|chorus|bridge|pre-chorus|prechorus|intro|outro|interlude|solo|refrain|tag|coda|instrumental|break|hook|breakdown|drop|build)\s*[\d\w]*\s*[\]\)]?\s*:?\s*$/i;

        for (const line of lines) {
            if (line.trim() === '') {
                output.push('<div class="lyric-line">&nbsp;</div>');
                continue;
            }

            if (structureTagRegex.test(line.trim())) {
                output.push(`<div class="lyric-line song-structure-tag"><strong>${line.trim()}</strong></div>`);
                continue;
            }

            if (isChordLine(line, deps)) {
                const processedLine = line.replace(deps.CHORD_REGEX, (chord) => {
                    if (!chord.trim()) return chord;
                    if (chord.includes('/')) {
                        const [baseChord, bassNote] = chord.split('/');
                        const transposedBase = transposeChord(baseChord.trim(), transposeLevel, deps);
                        const transposedBass = bassNote ? transposeChord(bassNote.trim(), transposeLevel, deps) : '';
                        return `<span class="chord" data-original="${chord.trim()}">${transposedBase + (transposedBass ? '/' + transposedBass : '')}</span>`;
                    }
                    return `<span class="chord" data-original="${chord.trim()}">${transposeChord(chord.trim(), transposeLevel, deps)}</span>`;
                });
                output.push(`<div class="chord-line">${processedLine}</div>`);
            } else if (hasInlineChords(line, deps)) {
                const processedLine = line.replace(deps.INLINE_CHORD_REGEX, (match, chord) => {
                    if (chord.includes('/')) {
                        const [baseChord, bassNote] = chord.split('/');
                        const transposedBase = transposeChord(baseChord, transposeLevel, deps);
                        const transposedBass = bassNote ? transposeChord(bassNote, transposeLevel, deps) : '';
                        return `[<span class="chord" data-original="${chord}">${transposedBase}${transposedBass ? '/' + transposedBass : ''}</span>]`;
                    }
                    return `[<span class="chord" data-original="${chord}">${transposeChord(chord, transposeLevel, deps)}</span>]`;
                });
                output.push(`<div class="lyric-line">${processedLine}</div>`);
            } else {
                output.push(`<div class="lyric-line">${line}</div>`);
            }
        }

        return output.join('');
    }

    function extractDistinctChords(lyrics, transposeLevel, manualChords, deps) {
        function cleanChordName(chord) {
            return chord.replace(/maj(?=\d)|maj$/g, '');
        }

        const chordSet = new Set();

        if (manualChords && manualChords.trim()) {
            return manualChords
                .split(',')
                .map((chord) => {
                    const cleanChord = chord.trim();
                    if (!cleanChord) return '';
                    const finalChord = transposeLevel !== 0 ? transposeChord(cleanChord, transposeLevel, deps) : cleanChord;
                    return cleanChordName(finalChord);
                })
                .filter((chord) => chord.length > 0);
        }

        if (!lyrics) return [];

        const lines = lyrics.split('\n');
        for (const line of lines) {
            if (isChordLine(line, deps)) {
                const chords = line.match(deps.CHORD_REGEX);
                if (chords) {
                    chords.forEach((chord) => {
                        const cleanChord = chord.trim();
                        if (!cleanChord) return;
                        const finalChord = transposeLevel !== 0 ? transposeChord(cleanChord, transposeLevel, deps) : cleanChord;
                        chordSet.add(cleanChordName(finalChord));
                    });
                }
            }

            if (hasInlineChords(line, deps)) {
                const inlineChords = line.match(deps.INLINE_CHORD_REGEX);
                if (inlineChords) {
                    inlineChords.forEach((match) => {
                        const chord = match.replace(/[\[\]()]/g, '').trim();
                        if (!chord) return;
                        const finalChord = transposeLevel !== 0 ? transposeChord(chord, transposeLevel, deps) : chord;
                        chordSet.add(cleanChordName(finalChord));
                    });
                }
            }
        }

        return Array.from(chordSet).sort((a, b) => {
            const getRootNote = (chord) => {
                const match = chord.match(/^([A-G][#b]?)/);
                return match ? match[1] : chord;
            };

            const rootA = getRootNote(a);
            const rootB = getRootNote(b);

            if (rootA !== rootB) {
                const indexA = deps.CHORDS.indexOf(deps.normalizeBaseNote(rootA));
                const indexB = deps.CHORDS.indexOf(deps.normalizeBaseNote(rootB));
                return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
            }

            return a.length - b.length;
        });
    }

    function updatePreviewWithTransposition(level, deps) {
        const songPreviewEl = deps.getSongPreviewEl();
        if (!songPreviewEl.dataset.songId) return;

        let transposeLevel = parseInt(document.getElementById('transpose-level').textContent, 10);
        transposeLevel = Math.max(-12, Math.min(12, isNaN(transposeLevel) ? 0 : transposeLevel));
        const lyrics = songPreviewEl.dataset.originalLyrics;
        document.getElementById('transpose-level').textContent = transposeLevel;
        const originalKey = songPreviewEl.dataset.originalKey;
        document.getElementById('current-key').textContent = transposeLevel === 0 ? originalKey : transposeChord(originalKey, transposeLevel, deps);

        const songId = songPreviewEl.dataset.songId;
        const currentSong = (deps.getSongs ? deps.getSongs() : []).find((song) => song.id == songId || song._id == songId);
        const manualChords = currentSong ? currentSong.manualChords : '';
        const distinctChords = extractDistinctChords(lyrics, transposeLevel, manualChords, deps);
        const chordsDisplay = distinctChords.length > 0 ? distinctChords.join(', ') : '';
        const previewChordsElement = document.querySelector('.preview-meta-row .preview-meta-value[style*="margin-left"]');
        if (previewChordsElement) {
            if (chordsDisplay) {
                previewChordsElement.innerHTML = `Chords: ${chordsDisplay}`;
                previewChordsElement.style.display = 'inline';
            } else {
                previewChordsElement.style.display = 'none';
            }
        }

        const lyricsContainer = document.querySelector('.song-lyrics');
        if (lyricsContainer) {
            lyricsContainer.innerHTML = formatLyricsWithChords(lyrics, transposeLevel, deps);
        }
    }

    function setupAutoScroll(deps) {
        const songPreviewEl = deps.getSongPreviewEl();
        const toggleAutoScrollBtn = deps.getToggleAutoScrollBtn ? deps.getToggleAutoScrollBtn() : null;
        const wasAutoScrollActive = deps.getAutoScrollInterval() !== null;

        deps.setIsUserScrolling(false);
        songPreviewEl.scrollTop = 0;

        if (deps.getAutoScrollInterval()) {
            clearInterval(deps.getAutoScrollInterval());
            deps.setAutoScrollInterval(null);
        }

        if (!wasAutoScrollActive && toggleAutoScrollBtn) {
            toggleAutoScrollBtn.innerHTML = '<i class="fas fa-play"></i>';
            toggleAutoScrollBtn.classList.remove('active');
        } else if (wasAutoScrollActive) {
            setTimeout(() => {
                startAutoScroll('down', deps);
            }, 100);
        }
    }

    function startAutoScroll(direction, deps) {
        const songPreviewEl = deps.getSongPreviewEl();
        const toggleAutoScrollBtn = deps.getToggleAutoScrollBtn ? deps.getToggleAutoScrollBtn() : null;
        const scrollDirection = direction || 'down';

        if (deps.getAutoScrollInterval()) {
            clearInterval(deps.getAutoScrollInterval());
        }

        const scrollStep = scrollDirection === 'down' ? 20 : -20;
        if (toggleAutoScrollBtn) {
            toggleAutoScrollBtn.innerHTML = '<i class="fas fa-pause"></i>';
            toggleAutoScrollBtn.classList.add('active');
        }

        const intervalId = setInterval(() => {
            if (deps.getIsUserScrolling()) return;

            const previewHeight = songPreviewEl.scrollHeight;
            const viewportHeight = songPreviewEl.clientHeight;
            const maxScroll = previewHeight - viewportHeight;
            const currentScroll = songPreviewEl.scrollTop;

            if ((scrollDirection === 'down' && currentScroll >= maxScroll - 10) ||
                (scrollDirection === 'up' && currentScroll <= 10)) {
                clearInterval(intervalId);
                deps.setAutoScrollInterval(null);
                if (toggleAutoScrollBtn) {
                    toggleAutoScrollBtn.innerHTML = '<i class="fas fa-play"></i>';
                    toggleAutoScrollBtn.classList.remove('active');
                }
                return;
            }

            const targetScroll = scrollDirection === 'down'
                ? Math.min(currentScroll + scrollStep, maxScroll)
                : Math.max(currentScroll + scrollStep, 0);

            let startTime;
            function animateScroll(timestamp) {
                if (!startTime) startTime = timestamp;
                const progress = Math.min((timestamp - startTime) / 300, 1);
                const ease = progress * (2 - progress);
                songPreviewEl.scrollTop = currentScroll + (targetScroll - currentScroll) * ease;
                if (progress < 1 && !deps.getIsUserScrolling()) {
                    requestAnimationFrame(animateScroll);
                }
            }
            requestAnimationFrame(animateScroll);
        }, deps.getAutoScrollSpeed());

        deps.setAutoScrollInterval(intervalId);
    }

    function toggleAutoScroll(deps) {
        const toggleAutoScrollBtn = deps.getToggleAutoScrollBtn ? deps.getToggleAutoScrollBtn() : null;

        if (deps.getAutoScrollInterval()) {
            clearInterval(deps.getAutoScrollInterval());
            deps.setAutoScrollInterval(null);
            if (toggleAutoScrollBtn) {
                toggleAutoScrollBtn.innerHTML = '<i class="fas fa-play"></i>';
                toggleAutoScrollBtn.classList.remove('active');
            }
        } else {
            startAutoScroll('down', deps);
            if (toggleAutoScrollBtn) {
                toggleAutoScrollBtn.innerHTML = '<i class="fas fa-pause"></i>';
                toggleAutoScrollBtn.classList.add('active');
            }
        }
    }

    function handleUserScroll(deps) {
        deps.setIsUserScrolling(true);
        setTimeout(() => {
            deps.setIsUserScrolling(false);
        }, 1000);
    }

    async function showPreview(song, fromHistory, openingContext, deps) {
        const songPreviewEl = deps.getSongPreviewEl();
        const navigationHistory = deps.getNavigationHistory();
        const currentHistoryPosition = deps.getCurrentHistoryPosition();
        const isNavigatingHistory = deps.getIsNavigatingHistory();
        const currentModal = deps.getCurrentModal();

        if (!fromHistory && !isNavigatingHistory && !currentModal) {
            let nextHistory = navigationHistory;
            let nextPosition = currentHistoryPosition;

            if (currentHistoryPosition < navigationHistory.length - 1) {
                nextHistory = navigationHistory.slice(0, currentHistoryPosition + 1);
            }

            nextHistory = nextHistory.concat(song.id);
            nextPosition = nextHistory.length - 1;

            deps.setNavigationHistory(nextHistory);
            deps.setCurrentHistoryPosition(nextPosition);

            history.pushState({ songId: song.id, position: nextPosition }, '', `#song-${song.id}`);
        }

        songPreviewEl.innerHTML = '';
        songPreviewEl.dataset.songId = song.id;
        songPreviewEl.dataset.originalLyrics = song.lyrics || song.editSongLyrics || song.content || song.text || '';
        songPreviewEl.dataset.originalKey = deps.normalizeKeySignature(song.key);
        songPreviewEl.dataset.openingContext = openingContext;

        const setlistDropdown = document.getElementById('setlistDropdown');
        const currentSetlistValue = setlistDropdown ? setlistDropdown.value : '';
        const isInSetlist = currentSetlistValue ? deps.isSongInCurrentSetlist(song.id, currentSetlistValue) : false;
        const favorites = deps.getFavorites();
        const isFavorite = favorites.includes(song.id);

        let transposeLevel = 0;
        let userData = {};
        let localTranspose = {};
        const currentViewingSetlist = deps.getCurrentViewingSetlist ? deps.getCurrentViewingSetlist() : null;
        const currentUser = deps.getCurrentUser ? deps.getCurrentUser() : null;

        if (openingContext === 'global-setlist' && currentViewingSetlist && currentViewingSetlist.songTransposes && song.id in currentViewingSetlist.songTransposes) {
            transposeLevel = currentViewingSetlist.songTransposes[song.id] || 0;
        } else if (openingContext === 'user-setlist' || openingContext === 'all-songs') {
            try {
                localTranspose = JSON.parse(localStorage.getItem('transposeCache') || '{}');
            } catch (e) {
                localTranspose = {};
            }

            if (song.id && typeof localTranspose[song.id] === 'number') {
                transposeLevel = localTranspose[song.id];
            } else if (currentUser && currentUser.id && song.id) {
                if (window.userData && window.userData.transpose && song.id in window.userData.transpose && typeof window.userData.transpose[song.id] === 'number') {
                    transposeLevel = window.userData.transpose[song.id];
                } else if (!window.userDataFetched && !window.fetchingUserData) {
                    window.fetchingUserData = true;
                    try {
                        const response = await deps.authFetch(`${deps.API_BASE_URL}/api/userdata`);
                        if (response.ok) {
                            userData = await response.json();
                            window.userData = userData;
                            window.userDataFetched = true;
                            if (userData.transpose && song.id in userData.transpose && typeof userData.transpose[song.id] === 'number') {
                                transposeLevel = userData.transpose[song.id];
                            }
                        }
                    } catch (e) {
                    } finally {
                        window.fetchingUserData = false;
                    }
                }
            }
        } else {
            try {
                localTranspose = JSON.parse(localStorage.getItem('transposeCache') || '{}');
                if (song.id && typeof localTranspose[song.id] === 'number') {
                    transposeLevel = localTranspose[song.id];
                }
            } catch (e) {
                transposeLevel = 0;
            }
        }

        const distinctChords = extractDistinctChords(song.lyrics, transposeLevel, song.manualChords, deps);
        const chordsDisplay = distinctChords.length > 0 ? distinctChords.join(', ') : '';
        const canonicalSongKey = deps.normalizeKeySignature(song.key);
        const displayKey = transposeLevel !== 0 ? transposeChord(canonicalSongKey, transposeLevel, deps) : canonicalSongKey;
        const isAdmin = deps.isAdmin();

        songPreviewEl.innerHTML = `
<div class="song-preview-container">
    <div class="song-slide">
        <div class="song-preview-header">
            <h2 class="song-preview-title">${song.title}</h2>
            <button class="favorite-btn${isFavorite ? ' favorited' : ''}" id="previewFavoriteBtn" data-song-id="${song.id}" title="${isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}">
                <i class="fas fa-heart"></i>
            </button>
        </div>

        <div class="song-preview-metadata">
            <div class="preview-meta-group primary-info">
                <span class="preview-meta-label">Key</span>
                <span class="preview-meta-value preview-key" id="current-key">${displayKey}</span>
                ${song.tempo ? `<span class="preview-meta-chip"><i class="fas fa-drum"></i> ${song.tempo}</span>` : ''}
                ${(song.time || song.timeSignature) ? `<span class="preview-meta-chip"><i class="fas fa-clock"></i> ${song.time || song.timeSignature}</span>` : ''}
                ${song.taal ? `<span class="preview-meta-chip"><i class="fas fa-music"></i> ${song.taal}</span>` : ''}
            </div>
            ${chordsDisplay || song.artistDetails || song.mood || song.genres || song.genre || isAdmin ? `
            <button class="preview-meta-toggle" id="toggleMetaBtn">
                <span class="toggle-text">More Info</span>
                <i class="fas fa-chevron-down"></i>
            </button>
            <div class="preview-meta-group secondary-info collapsed" id="secondaryMetaInfo">
                ${chordsDisplay ? `
                <div class="preview-meta-row chords-row">
                    <span class="preview-meta-label">Chords</span>
                    <span class="preview-meta-value chords-display">${chordsDisplay}</span>
                </div>` : ''}
                ${song.artistDetails ? `
                <div class="preview-meta-row">
                    <span class="preview-meta-label">Artist</span>
                    <span class="preview-meta-value">${song.artistDetails}</span>
                </div>` : ''}
                ${song.mood ? `
                <div class="preview-meta-row">
                    <span class="preview-meta-label">Mood</span>
                    <span class="preview-meta-value preview-mood">${song.mood}</span>
                </div>` : ''}
                ${song.genres ? `
                <div class="preview-meta-row">
                    <span class="preview-meta-label">Genres</span>
                    <span class="preview-meta-value">${song.genres.join(', ')}</span>
                </div>` : song.genre ? `
                <div class="preview-meta-row">
                    <span class="preview-meta-label">Genre</span>
                    <span class="preview-meta-value">${song.genre}</span>
                </div>` : ''}
                ${song.rhythmCategory ? `
                <div class="preview-meta-row">
                    <span class="preview-meta-label">Rhythm Category</span>
                    <span class="preview-meta-value">${song.rhythmCategory}</span>
                </div>` : ''}
                ${isAdmin ? `
                <div class="preview-meta-row preview-rhythm-set-row">
                    <span class="preview-meta-label">Rhythm Set</span>
                    <div class="preview-rhythm-set-editor">
                        <select class="preview-rhythm-set-select" id="previewRhythmSetSelect">
                            <option value="">-- Loading... --</option>
                        </select>
                        <button class="preview-rhythm-set-save-btn" id="previewRhythmSetSaveBtn" title="Save Rhythm Set">
                            <i class="fas fa-save"></i> Save
                        </button>
                    </div>
                </div>` : ''}
            </div>` : ''}
        </div>

        <div class="song-preview-actions">
            <button class="preview-action-btn preview-setlist-btn ${isInSetlist ? 'remove' : 'add'}" id="previewSetlistBtn">
                <i class="fas ${isInSetlist ? 'fa-check' : 'fa-plus'}"></i>
                <span>${isInSetlist ? 'In Setlist' : 'Add to Setlist'}</span>
            </button>
            <button class="preview-action-btn preview-edit-btn" id="previewEditBtn">
                <i class="fas fa-edit"></i>
                <span>Edit</span>
            </button>
            ${isAdmin ? `<button class="preview-action-btn preview-delete-btn" id="previewDeleteBtn">
                <i class="fas fa-trash-alt"></i>
                <span>Delete</span>
            </button>` : ''}
        </div>

        <div class="song-preview-transpose">
            <div class="preview-transpose-label">
                <i class="fas fa-music"></i>
                <span>Transpose</span>
            </div>
            <button class="preview-transpose-btn transpose-down" id="transpose-down" title="Transpose Down">
                <i class="fas fa-minus"></i>
            </button>
            <span class="preview-transpose-display" id="transpose-level">${transposeLevel}</span>
            <button class="preview-transpose-btn transpose-up" id="transpose-up" title="Transpose Up">
                <i class="fas fa-plus"></i>
            </button>
            <button class="preview-transpose-btn preview-reset" id="transposeReset" title="Reset Transpose">
                <i class="fas fa-undo"></i>
                <span>Reset</span>
            </button>
            <button class="preview-transpose-btn preview-save" id="saveTransposeBtn" title="Save Transpose">
                <i class="fas fa-save"></i>
                <span>Save</span>
            </button>
        </div>

        ${song.updatedAt && song.updatedBy || song.createdBy && song.createdAt ? `
        <div class="song-preview-audit">
            ${song.updatedAt && song.updatedBy
                ? `<div class="preview-audit-info">
                    <i class="fas fa-edit"></i>
                    <span>Updated by <strong>${getDisplayName(song.updatedBy, deps)}</strong> on ${new Date(song.updatedAt).toLocaleDateString()}</span>
                   </div>`
                : `<div class="preview-audit-info">
                    <i class="fas fa-plus"></i>
                    <span>Added by <strong>${getDisplayName(song.createdBy, deps)}</strong> on ${new Date(song.createdAt).toLocaleDateString()}</span>
                   </div>`
            }
        </div>` : ''}

        ${typeof deps.getLoopPlayerHTML === 'function' ? deps.getLoopPlayerHTML(song.id) : ''}

        <div class="song-lyrics" id="preview-lyrics-container">Loading lyrics...</div>
    </div>
</div>
`;

        songPreviewEl.style.display = 'block';
        document.body.style.overflow = 'hidden';

        document.getElementById('transpose-level').textContent = transposeLevel;
        deps.attachPreviewEventListeners(song);

        setTimeout(() => {
            const lyricsContainer = document.getElementById('preview-lyrics-container');
            if (lyricsContainer) {
                const lyricsText = song.lyrics || song.editSongLyrics || song.content || song.text || 'No lyrics available';
                lyricsContainer.innerHTML = formatLyricsWithChords(lyricsText, transposeLevel, deps);
            }

            if (typeof deps.initializeLoopPlayer === 'function') {
                deps.initializeLoopPlayer(song.id);
            }
        }, 10);

        updatePreviewWithTransposition(transposeLevel, deps);

        if (deps.getIsNavigatingHistory()) {
            setTimeout(() => {
                deps.setIsNavigatingHistory(false);
            }, 100);
        }

        const previewFavBtn = document.getElementById('previewFavoriteBtn');
        if (previewFavBtn) {
            if (previewFavBtn._favListener) {
                previewFavBtn.removeEventListener('click', previewFavBtn._favListener);
            }
            previewFavBtn._favListener = () => {
                deps.toggleFavorite(song.id);
            };
            previewFavBtn.addEventListener('click', previewFavBtn._favListener);
        }

        document.getElementById('previewSetlistBtn').addEventListener('click', () => {
            const selectedSetlistDropdown = document.getElementById('setlistDropdown');
            const selectedSetlist = selectedSetlistDropdown ? selectedSetlistDropdown.value : '';

            if (selectedSetlist) {
                deps.checkSongInSetlistAndToggle(song.id, selectedSetlist);
            } else {
                deps.showNotification('Please select a setlist from the main dropdown first');
            }
        });

        document.getElementById('previewEditBtn').addEventListener('click', () => {
            deps.editSong(song.id);
        });

        if (isAdmin) {
            const delBtn = document.getElementById('previewDeleteBtn');
            if (delBtn) {
                delBtn.addEventListener('click', () => {
                    deps.openDeleteSongModal(song.id);
                });
            }
        }

        document.getElementById('transpose-up').addEventListener('click', () => {
            const currentLevel = parseInt(document.getElementById('transpose-level').textContent, 10);
            updatePreviewWithTransposition(currentLevel, deps);
        });
        document.getElementById('transpose-down').addEventListener('click', () => {
            const currentLevel = parseInt(document.getElementById('transpose-level').textContent, 10);
            updatePreviewWithTransposition(currentLevel, deps);
        });
        document.getElementById('transposeReset').addEventListener('click', () => {
            updatePreviewWithTransposition(0, deps);
        });

        setupAutoScroll(deps);
        applyLyricsBackground(song.category === 'New');

        if (deps.getSuggestedSongsDrawerOpen()) {
            deps.showSuggestedSongs();
        }
    }

    function applyLyricsBackground(isNew) {
        const lyricsContainer = document.querySelector('.song-lyrics');
        if (!lyricsContainer) return;
        lyricsContainer.classList.remove('lyrics-bg-New', 'lyrics-bg-Old');
        lyricsContainer.classList.add(isNew ? 'lyrics-bg-New' : 'lyrics-bg-Old');
    }

    function initializeFloatingStopButton(deps) {
        const floatingStopBtn = document.getElementById('floatingStopBtn');
        if (floatingStopBtn) {
            floatingStopBtn.addEventListener('click', () => stopCurrentlyPlayingSong(deps));
        }
    }

    function showFloatingStopButton(songId, songTitle, deps) {
        const floatingStopBtn = document.getElementById('floatingStopBtn');
        const floatingStopText = document.getElementById('floatingStopText');
        if (floatingStopBtn) {
            deps.getCurrentlyPlayingSongs().add(songId);
            deps.setCurrentPlayingSongId(songId);
            const shortTitle = songTitle && songTitle.length > 12 ? songTitle.substring(0, 12) + '...' : (songTitle || 'Song');
            floatingStopText.textContent = shortTitle;
            floatingStopBtn.style.display = 'flex';
            floatingStopBtn.title = `Stop "${songTitle}" (currently playing)`;
        }
    }

    function hideFloatingStopButton(songId, deps) {
        deps.getCurrentlyPlayingSongs().delete(songId);
        const currentPlayingSongId = deps.getCurrentPlayingSongId();
        if (currentPlayingSongId === songId && deps.getCurrentlyPlayingSongs().size === 0) {
            const floatingStopBtn = document.getElementById('floatingStopBtn');
            if (floatingStopBtn) {
                floatingStopBtn.style.display = 'none';
            }
            deps.setCurrentPlayingSongId(null);
        } else if (currentPlayingSongId === songId && deps.getCurrentlyPlayingSongs().size > 0) {
            const nextSongId = Array.from(deps.getCurrentlyPlayingSongs())[0];
            const nextSong = deps.getSongs().find(s => s.id === nextSongId);
            deps.setCurrentPlayingSongId(nextSongId);
            if (nextSong) {
                const floatingStopText = document.getElementById('floatingStopText');
                const shortTitle = nextSong.title && nextSong.title.length > 12 ? nextSong.title.substring(0, 12) + '...' : (nextSong.title || 'Song');
                floatingStopText.textContent = shortTitle;
            }
        }
    }

    function stopCurrentlyPlayingSong(deps) {
        const currentPlayingSongId = deps.getCurrentPlayingSongId();
        if (currentPlayingSongId) {
            const loopPlayer = window.getLoopPlayerInstance && window.getLoopPlayerInstance();
            if (loopPlayer) {
                if (loopPlayer.isPlaying) {
                    loopPlayer.pause();
                }
                loopPlayer.stopAllMelodicPads();
            } else {
                const loopContainer = document.querySelector(`#loopPlayerContainer-${currentPlayingSongId}`);
                if (loopContainer) {
                    const playBtn = loopContainer.querySelector('.loop-play-btn');
                    if (playBtn && playBtn.classList.contains('playing')) {
                        playBtn.click();
                    }
                }
            }
            const floatingStopBtn = document.getElementById('floatingStopBtn');
            if (floatingStopBtn) {
                floatingStopBtn.classList.add('animate-stop');
                setTimeout(() => {
                    floatingStopBtn.classList.remove('animate-stop');
                }, 600);
            }
            hideFloatingStopButton(currentPlayingSongId, deps);
        }
    }

    window.SongPreviewUI = {
        applyLyricsBackground,
        extractDistinctChords,
        formatLyricsWithChords,
        handleUserScroll,
        hasInlineChords,
        hideFloatingStopButton,
        initializeFloatingStopButton,
        isChordLine,
        setupAutoScroll,
        showFloatingStopButton,
        showPreview,
        startAutoScroll,
        stopCurrentlyPlayingSong,
        toggleAutoScroll,
        transposeChord,
        transposeSingleChord,
        updatePreviewWithTransposition
    };
})(window);
