/**
 * Loop Player UI - Pad-based rhythm controller interface v2.0
 * 
 * Shows rhythm pads for songs that match available loops
 * Matching: Taal + Time required, Genre + Tempo boost ranking
 * 
 * Auto-fill behavior: Uses fill matching the SOURCE loop
 * - Transition FROM loop1 → uses fill1
 * - Transition FROM loop2 → uses fill2
 * - Transition FROM loop3 → uses fill3
 * 
 * Note: Uses API_BASE_URL from main.js (loaded first on index.html)
 */

// Global instance
let loopPlayerInstance = null;
let loopsMetadataCache = null;

/**
 * Load loops metadata (cached)
 */
async function getLoopsMetadata() {
    if (loopsMetadataCache) {
        return loopsMetadataCache;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/loops/metadata`);
        if (response.ok) {
            loopsMetadataCache = await response.json();
            return loopsMetadataCache;
        }
    } catch (error) {
        console.error('Failed to load loops metadata:', error);
    }

    return null;
}

/**
 * Get tempo category from BPM
 */
function getTempoCategory(bpm) {
    if (!bpm) return 'medium';
    const bpmNum = parseInt(bpm);
    if (bpmNum < 80) return 'slow';
    if (bpmNum > 120) return 'fast';
    return 'medium';
}

/**
 * Check if two time signatures are equivalent
 * Examples: 6/8 ≡ 3/4, 9/8 ≡ 3/4, 12/8 ≡ 4/4
 */
function areTimeSignaturesEquivalent(time1, time2) {
    if (time1 === time2) return true;
    
    // Common equivalent time signatures
    const equivalents = {
        '6/8': ['3/4'],
        '3/4': ['6/8'], 
        '9/8': ['3/4'],
        '12/8': ['4/4'],
        '4/4': ['12/8']
    };
    
    const time1Equivalents = equivalents[time1] || [];
    return time1Equivalents.includes(time2);
}

/**
 * Find best matching loop set for a song
 * Returns: {loopSet, score} or null
 */
async function findMatchingLoopSet(song) {
    const metadata = await getLoopsMetadata();
    if (!metadata || !metadata.loops || metadata.loops.length === 0) {
        console.log('🔍 Loop matching: No metadata or loops available');
        return null;
    }

    const songTaal = (song.taal || '').toLowerCase().trim();
    const songTime = (song.time || song.timeSignature || '').trim();
    const songGenre = (song.genre || '').toLowerCase().trim();
    const songTempo = getTempoCategory(song.bpm || song.tempo);

    console.log('🔍 Loop matching for song:', {
        songId: song.id,
        title: song.title,
        songTaal,
        songTime, 
        songGenre,
        songTempo,
        availableLoops: metadata.loops.length
    });

    // Group loops by condition set
    const loopSets = {};
    metadata.loops.forEach(loop => {
        const key = `${loop.conditions.taal}_${loop.conditions.timeSignature}_${loop.conditions.tempo}_${loop.conditions.genre}`;
        if (!loopSets[key]) {
            loopSets[key] = {
                conditions: loop.conditions,
                loops: [],
                files: {}
            };
        }
        loopSets[key].loops.push(loop);
        
        // Map files by type for easy access
        const fileKey = `${loop.type}${loop.number}`;
        loopSets[key].files[fileKey] = loop.filename;
    });

    console.log('🔍 Available loop sets:', Object.keys(loopSets).map(key => {
        const set = loopSets[key];
        return {
            key,
            taal: set.conditions.taal,
            time: set.conditions.timeSignature,
            tempo: set.conditions.tempo,
            genre: set.conditions.genre
        };
    }));

    // Find matching loop sets and score them
    let bestMatch = null;
    let bestScore = 0;

    for (const [key, loopSet] of Object.entries(loopSets)) {
        const cond = loopSet.conditions;
        
        // **REQUIRED**: Taal and Time must match
        const taalMatch = songTaal.includes(cond.taal.toLowerCase()) || cond.taal.toLowerCase().includes(songTaal);
        const timeMatch = areTimeSignaturesEquivalent(cond.timeSignature, songTime);

        console.log(`🔍 Testing loop set ${key}:`, {
            taalMatch: `"${songTaal}" vs "${cond.taal.toLowerCase()}"`,
            timeMatch: `"${songTime}" vs "${cond.timeSignature}" (equivalent: ${timeMatch})`,
            taalResult: taalMatch,
            timeResult: timeMatch
        });

        if (!taalMatch || !timeMatch) {
            continue; // Skip if required conditions don't match
        }

        // **OPTIONAL**: Score based on genre and tempo
        let score = 10; // Base score for taal + time match
        
        if (songGenre && cond.genre.toLowerCase() === songGenre) {
            score += 5; // Genre match bonus
        }
        
        if (songTempo && cond.tempo === songTempo) {
            score += 3; // Tempo match bonus
        }

        // Ensure complete set (3 loops + 3 fills)
        if (loopSet.loops.length === 6) {
            score += 2; // Complete set bonus
        }

        if (score > bestScore) {
            bestScore = score;
            bestMatch = loopSet;
        }
    }

    return bestMatch ? { loopSet: bestMatch, score: bestScore } : null;
}

/**
 * Get match quality description from score
 */
function getMatchQuality(score) {
    if (score >= 18) {
        return { label: 'Perfect Match', description: 'All conditions match (Taal, Time, Tempo, Genre)' };
    } else if (score >= 15) {
        return { label: 'Excellent Match', description: 'Required conditions + 1 optional match' };
    } else if (score >= 10) {
        return { label: 'Good Match', description: 'Required conditions match (Taal + Time)' };
    } else {
        return { label: 'Partial Match', description: 'Some conditions match' };
    }
}

/**
 * Check if song has matching loops available
 */
async function shouldShowLoopPlayer(song) {
    if (!song) return false;
    
    const match = await findMatchingLoopSet(song);
    return match !== null;
}

/**
 * Generate HTML for loop player with pads
 */
function getLoopPlayerHTML(songId) {
    return `
<div class="loop-player-container" id="loopPlayerContainer-${songId}" style="display: none;">
    <div class="loop-player-header">
        <h4><i class="fas fa-drum"></i> Rhythm Pads</h4>
        <div class="loop-player-controls-header">
            <div class="loop-player-status" id="loopStatus-${songId}">Loading...</div>
            <button class="loop-player-toggle-btn" id="loopToggleBtn-${songId}" title="Expand/Collapse Rhythm Pads">
                <i class="fas fa-chevron-down" id="loopToggleIcon-${songId}"></i>
            </button>
        </div>
    </div>
    
    <!-- Collapsible Content (default collapsed) -->
    <div class="loop-player-content collapsed" id="loopPlayerContent-${songId}">
        <!-- Pad Grid: 2 rows -->
        <div class="loop-pads-grid" id="padGrid-${songId}">
            <!-- Top Row: Loops -->
            <div class="loop-pads-row">
                <button class="loop-pad loop-pad-active" data-loop="loop1" id="pad-loop1-${songId}">
                    <span class="pad-number">1</span>
                    <span class="pad-label">Loop 1</span>
                </button>
                <button class="loop-pad" data-loop="loop2" id="pad-loop2-${songId}">
                    <span class="pad-number">2</span>
                    <span class="pad-label">Loop 2</span>
                </button>
                <button class="loop-pad" data-loop="loop3" id="pad-loop3-${songId}">
                    <span class="pad-number">3</span>
                    <span class="pad-label">Loop 3</span>
                </button>
            </div>
            
            <!-- Bottom Row: Fills -->
            <div class="loop-pads-row">
                <button class="loop-pad loop-pad-fill" data-loop="fill1" id="pad-fill1-${songId}">
                    <span class="pad-number">F1</span>
                    <span class="pad-label">Fill 1</span>
                </button>
                <button class="loop-pad loop-pad-fill" data-loop="fill2" id="pad-fill2-${songId}">
                    <span class="pad-number">F2</span>
                    <span class="pad-label">Fill 2</span>
                </button>
                <button class="loop-pad loop-pad-fill" data-loop="fill3" id="pad-fill3-${songId}">
                    <span class="pad-number">F3</span>
                    <span class="pad-label">Fill 3</span>
                </button>
            </div>
        </div>
        
        <!-- Controls -->
        <div class="loop-player-controls">
            <button class="loop-control-btn loop-play-btn" id="loopPlayBtn-${songId}">
                <i class="fas fa-play"></i>
                <span>Play</span>
            </button>
            
            <button class="loop-control-btn loop-autofill-btn" id="loopAutoFillBtn-${songId}">
                <i class="fas fa-magic"></i>
                <span>Auto-Fill: OFF</span>
            </button>
            
            <div class="loop-control-group">
                <label><i class="fas fa-volume-up"></i> Volume</label>
                <input type="range" min="0" max="100" value="80" class="loop-slider" id="loopVolume-${songId}">
                <span class="loop-value" id="loopVolumeValue-${songId}">80%</span>
            </div>
            
            <div class="loop-control-group">
                <label>
                    <i class="fas fa-tachometer-alt"></i> Tempo
                </label>
                <input type="range" min="90" max="110" value="100" class="loop-slider" id="loopTempo-${songId}" step="1">
                <span class="loop-value" id="loopTempoValue-${songId}">100%</span>
                <button class="loop-tempo-reset-btn" id="loopTempoReset-${songId}" title="Reset to 100%">
                    <i class="fas fa-undo"></i>
                </button>
            </div>
        </div>
    </div>
</div>

${loopPlayerStyles}
`;
}

/**
 * Initialize loop player for a song
 */
async function initializeLoopPlayer(songId) {
    console.log('🎵 Initializing loop player for song:', songId);
    
    // Check if songs array exists
    if (typeof songs === 'undefined') {
        console.log('❌ Songs array not available');
        return;
    }
    
    // Check if song is in the songs array
    const song = songs.find(s => s.id == songId);
    if (!song) {
        console.log('❌ Song not found in songs array:', songId);
        return;
    }
    
    console.log('🎵 Found song for loop matching:', { 
        id: song.id, 
        title: song.title, 
        taal: song.taal, 
        time: song.time || song.timeSignature,
        genre: song.genre,
        bpm: song.bpm || song.tempo
    });
    
    // Find matching loop set for this song
    const matchResult = await findMatchingLoopSet(song);
    
    if (!matchResult) {
        console.log('❌ No matching loop set found for song:', songId);
        const container = document.getElementById(`loopPlayerContainer-${songId}`);
        if (container) container.style.display = 'none';
        return;
    }
    
    console.log('✅ Found matching loop set with score:', matchResult.score);
    
    const { loopSet, score } = matchResult;
    
    // Show the container
    const container = document.getElementById(`loopPlayerContainer-${songId}`);
    if (!container) {
        console.log('❌ Loop container element not found:', `loopPlayerContainer-${songId}`);
        return;
    }
    container.style.display = 'block';
    console.log('✅ Loop player container shown for song:', songId);
    
    // Create or reuse player instance
    if (!loopPlayerInstance) {
        loopPlayerInstance = new LoopPlayerPad();
    }
    
    // Set up callbacks
    loopPlayerInstance.onLoopChange = (loopName) => {
        const status = document.getElementById(`loopStatus-${songId}`);
        if (status) {
            const displayName = loopName.replace(/(\d+)/, ' $1').toUpperCase();
            const matchInfo = getMatchQuality(score);
            status.textContent = `Playing: ${displayName}`;
        }
    };
    
    loopPlayerInstance.onPadActive = (padName) => {
        // Update active state on pads
        const allPads = container.querySelectorAll('.loop-pad');
        allPads.forEach(pad => {
            if (pad.dataset.loop === padName) {
                pad.classList.add('loop-pad-active');
            } else if (!padName.startsWith('fill')) {
                // Don't remove active from loops when fill is playing
                if (pad.dataset.loop.startsWith('loop')) {
                    pad.classList.remove('loop-pad-active');
                }
            }
        });
    };
    
    loopPlayerInstance.onError = (error) => {
        const status = document.getElementById(`loopStatus-${songId}`);
        if (status) status.textContent = `Error: ${error.message}`;
    };
    
    // Load loops with dynamic file mapping from matched loop set
    const status = document.getElementById(`loopStatus-${songId}`);
    const playBtn = document.getElementById(`loopPlayBtn-${songId}`);
    
    if (status) status.textContent = 'Loading loops...';
    if (playBtn) {
        playBtn.disabled = true;
        playBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Loading...</span>';
    }
    
    try {
        // Create loop map from matched files
        // Use API_BASE_URL for GitHub Pages compatibility (loops are served from Vercel backend)
        const loopMap = {
            loop1: `${API_BASE_URL}/loops/${loopSet.files.loop1}`,
            loop2: `${API_BASE_URL}/loops/${loopSet.files.loop2}`,
            loop3: `${API_BASE_URL}/loops/${loopSet.files.loop3}`,
            fill1: `${API_BASE_URL}/loops/${loopSet.files.fill1}`,
            fill2: `${API_BASE_URL}/loops/${loopSet.files.fill2}`,
            fill3: `${API_BASE_URL}/loops/${loopSet.files.fill3}`
        };
        
        console.log('🔊 Loading loops from:', loopMap);
        
        await loopPlayerInstance.loadLoops(loopMap);
        
        // Enable/disable pads based on successful fetch (ready for on-demand decode)
        const pads = container.querySelectorAll('.loop-pad');
        pads.forEach(pad => {
            const loopName = pad.dataset.loop;
            const loopFile = loopSet.files[loopName];
            const isLoaded = loopPlayerInstance.rawAudioData && loopPlayerInstance.rawAudioData.has(loopName);
            
            // Enable pad if file exists and was successfully fetched
            if (loopFile && isLoaded) {
                pad.disabled = false;
                pad.classList.remove('loop-pad-disabled');
                pad.title = '';
            } else {
                pad.disabled = true;
                pad.classList.add('loop-pad-disabled');
                if (!loopFile) {
                    pad.title = `${loopName} not available`;
                } else {
                    pad.title = `${loopName} failed to load`;
                }
            }
        });
        
        // Update status and play button
        const loadedCount = loopPlayerInstance.rawAudioData ? loopPlayerInstance.rawAudioData.size : 0;
        if (status) {
            if (loadedCount === 6) {
                const matchInfo = getMatchQuality(score);
                status.textContent = `Ready - ${matchInfo.label} (Click Play to initialize audio)`;
                status.title = matchInfo.description;
            } else {
                status.textContent = `Loaded ${loadedCount}/6 loops`;
            }
        }
        
        // Enable play button (audio will be initialized on first click)
        if (playBtn) {
            playBtn.disabled = false;
            playBtn.innerHTML = '<i class="fas fa-play"></i><span>Play</span>';
        }
    } catch (error) {
        console.error('Error loading loops:', error);
        if (status) status.textContent = 'Failed to load loops';
        if (playBtn) {
            playBtn.disabled = false;
            playBtn.innerHTML = '<i class="fas fa-play"></i><span>Play</span>';
        }
        return;
    }
    
    // Set up pad click handlers
    const pads = container.querySelectorAll('.loop-pad');
    pads.forEach(pad => {
        pad.addEventListener('click', () => {
            if (pad.disabled) return; // Prevent clicks on disabled pads
            
            const loopName = pad.dataset.loop;
            
            if (loopName.startsWith('loop')) {
                loopPlayerInstance.switchToLoop(loopName);
            } else if (loopName.startsWith('fill')) {
                loopPlayerInstance.playFill(loopName);
            }
        });
    });
    
    // Play/Pause button (reusing playBtn from above)
    if (playBtn) {
        playBtn.addEventListener('click', async () => {
            if (playBtn.disabled) return; // Prevent clicks while loading
            
            if (loopPlayerInstance.isPlaying) {
                loopPlayerInstance.pause();
                playBtn.innerHTML = '<i class="fas fa-play"></i><span>Play</span>';
                playBtn.classList.remove('playing');
            } else {
                try {
                    // Check if this is the first play (audio not initialized yet)
                    const isFirstPlay = !loopPlayerInstance.audioContext && loopPlayerInstance.rawAudioData.size > 0;
                    
                    if (isFirstPlay) {
                        // Show loading during first-time audio initialization
                        playBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Initializing...</span>';
                        playBtn.disabled = true;
                        if (status) status.textContent = 'Initializing audio & decoding buffers...';
                    }
                    
                    await loopPlayerInstance.play();
                    
                    // Update UI after successful play
                    playBtn.innerHTML = '<i class="fas fa-pause"></i><span>Pause</span>';
                    playBtn.classList.add('playing');
                    playBtn.disabled = false;
                    
                    if (isFirstPlay && status) {
                        const matchInfo = getMatchQuality(score);
                        status.textContent = `Playing - ${matchInfo.label} (Audio cached for instant playback)`;
                    }
                } catch (error) {
                    console.error('Error playing loops:', error);
                    const status = document.getElementById(`loopStatus-${songId}`);
                    if (status) status.textContent = `Error: ${error.message}`;
                    
                    // Reset button state on error
                    playBtn.innerHTML = '<i class="fas fa-play"></i><span>Play</span>';
                    playBtn.classList.remove('playing');
                    playBtn.disabled = false;
                }
            }
        });
    }
    
    // Auto-fill toggle
    const autoFillBtn = document.getElementById(`loopAutoFillBtn-${songId}`);
    if (autoFillBtn) {
        autoFillBtn.addEventListener('click', () => {
            const newState = !loopPlayerInstance.autoFill;
            loopPlayerInstance.setAutoFill(newState);
            
            autoFillBtn.innerHTML = `<i class="fas fa-magic"></i><span>Auto-Fill: ${newState ? 'ON' : 'OFF'}</span>`;
            autoFillBtn.classList.toggle('active', newState);
        });
    }
    
    // Volume slider
    const volumeSlider = document.getElementById(`loopVolume-${songId}`);
    const volumeValue = document.getElementById(`loopVolumeValue-${songId}`);
    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            const vol = parseInt(e.target.value) / 100;
            loopPlayerInstance.setVolume(vol);
            if (volumeValue) volumeValue.textContent = `${e.target.value}%`;
        });
    }
    
    // Tempo slider
    const tempoSlider = document.getElementById(`loopTempo-${songId}`);
    const tempoValue = document.getElementById(`loopTempoValue-${songId}`);
    const tempoResetBtn = document.getElementById(`loopTempoReset-${songId}`);
    
    if (tempoSlider) {
        tempoSlider.addEventListener('input', (e) => {
            const tempoPercent = parseInt(e.target.value);
            const rate = tempoPercent / 100;
            loopPlayerInstance.setPlaybackRate(rate);
            if (tempoValue) tempoValue.textContent = `${tempoPercent}%`;
        });
    }
    
    if (tempoResetBtn) {
        tempoResetBtn.addEventListener('click', () => {
            if (tempoSlider) {
                tempoSlider.value = '100';
                loopPlayerInstance.setPlaybackRate(1.0);
                if (tempoValue) tempoValue.textContent = '100%';
            }
        });
    }
    
    // Toggle button (expand/collapse)
    const toggleBtn = document.getElementById(`loopToggleBtn-${songId}`);
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            toggleLoopPlayer(songId);
        });
    }
}

/**
 * Cleanup loop player when song changes
 */
function cleanupLoopPlayer() {
    if (loopPlayerInstance && loopPlayerInstance.isPlaying) {
        loopPlayerInstance.pause();
    }
}

/**
 * Toggle loop player expand/collapse state
 */
function toggleLoopPlayer(songId) {
    const content = document.getElementById(`loopPlayerContent-${songId}`);
    const toggleBtn = document.getElementById(`loopToggleBtn-${songId}`);
    const toggleIcon = document.getElementById(`loopToggleIcon-${songId}`);
    
    if (content && toggleBtn && toggleIcon) {
        const isCollapsed = content.classList.contains('collapsed');
        
        if (isCollapsed) {
            // Expand
            content.classList.remove('collapsed');
            toggleBtn.classList.add('expanded');
            toggleIcon.className = 'fas fa-chevron-up';
            toggleBtn.title = 'Collapse Rhythm Pads';
        } else {
            // Collapse
            content.classList.add('collapsed');
            toggleBtn.classList.remove('expanded');
            toggleIcon.className = 'fas fa-chevron-down';
            toggleBtn.title = 'Expand Rhythm Pads';
        }
    }
}

// CSS Styles
const loopPlayerStyles = `
<style>
.loop-player-container {
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 50%, var(--light-bg) 100%);
    border: 2px solid var(--accent-color);
    border-radius: 12px;
    padding: 20px;
    margin: 20px 0;
    box-shadow: 
        0 4px 15px rgba(0,0,0,0.3),
        inset 0 1px 0 rgba(197, 177, 148, 0.2);
    position: relative;
    overflow: hidden;
}

.loop-player-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
        radial-gradient(circle at 20% 50%, rgba(197, 177, 148, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 50%, rgba(125, 141, 134, 0.1) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
}

.loop-player-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    color: var(--accent-color);
    position: relative;
    z-index: 1;
}

.loop-player-header h4 {
    margin: 0;
    font-size: 1.1em;
    font-weight: 600;
    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    gap: 8px;
}

.loop-player-header h4 i {
    color: var(--warning-color);
    font-size: 1.2em;
    animation: rhythmPulse 2s ease-in-out infinite;
}

@keyframes rhythmPulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.8; }
}

.loop-player-controls-header {
    display: flex;
    align-items: center;
    gap: 12px;
}

.loop-player-status {
    font-size: 0.9em;
    background: rgba(197, 177, 148, 0.2);
    color: var(--accent-color);
    padding: 6px 12px;
    border-radius: 8px;
    border: 1px solid rgba(197, 177, 148, 0.3);
    text-shadow: 0 1px 2px rgba(0,0,0,0.2);
    font-weight: 500;
}

.loop-player-toggle-btn {
    background: linear-gradient(135deg, rgba(197, 177, 148, 0.2) 0%, rgba(125, 141, 134, 0.2) 100%);
    border: 1px solid var(--accent-color);
    border-radius: 8px;
    color: var(--accent-color);
    padding: 8px 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 36px;
    height: 36px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.loop-player-toggle-btn:hover {
    background: linear-gradient(135deg, rgba(197, 177, 148, 0.3) 0%, rgba(125, 141, 134, 0.3) 100%);
    border-color: var(--warning-color);
    color: var(--warning-color);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
}

.loop-player-toggle-btn i {
    transition: transform 0.3s ease;
}

.loop-player-toggle-btn.expanded i {
    transform: rotate(180deg);
}

.loop-player-content {
    transition: all 0.3s ease;
    overflow: hidden;
    position: relative;
    z-index: 1;
}

.loop-player-content.collapsed {
    max-height: 0;
    opacity: 0;
    padding: 0;
    margin: 0;
}

.loop-pads-grid {
    margin-bottom: 20px;
}

.loop-pads-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 12px;
}

.loop-pad {
    background: linear-gradient(135deg, 
        rgba(197, 177, 148, 0.15) 0%, 
        rgba(125, 141, 134, 0.15) 50%, 
        rgba(62, 63, 41, 0.15) 100%);
    border: 2px solid rgba(197, 177, 148, 0.4);
    border-radius: 10px;
    padding: 20px 10px;
    color: var(--accent-color);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    box-shadow: 
        0 3px 6px rgba(0,0,0,0.2),
        inset 0 1px 0 rgba(197, 177, 148, 0.1);
    position: relative;
    overflow: hidden;
}

.loop-pad::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at center, rgba(197, 177, 148, 0.05) 0%, transparent 70%);
    transition: opacity 0.3s ease;
    opacity: 0;
}

.loop-pad:hover {
    background: linear-gradient(135deg, 
        rgba(197, 177, 148, 0.25) 0%, 
        rgba(125, 141, 134, 0.25) 50%, 
        rgba(62, 63, 41, 0.25) 100%);
    border-color: var(--accent-color);
    transform: translateY(-3px) scale(1.02);
    box-shadow: 
        0 6px 12px rgba(0,0,0,0.3),
        inset 0 1px 0 rgba(197, 177, 148, 0.2);
    color: #fff;
}

.loop-pad:hover::before {
    opacity: 1;
}

.loop-pad-active {
    background: linear-gradient(135deg, 
        rgba(243, 156, 18, 0.2) 0%, 
        rgba(197, 177, 148, 0.2) 50%, 
        rgba(125, 141, 134, 0.2) 100%);
    border-color: var(--warning-color);
    color: #fff;
    box-shadow: 
        0 0 20px rgba(243, 156, 18, 0.4),
        0 4px 8px rgba(0,0,0,0.3);
    animation: activePadGlow 2s ease-in-out infinite alternate;
}

@keyframes activePadGlow {
    0% { box-shadow: 0 0 20px rgba(243, 156, 18, 0.4), 0 4px 8px rgba(0,0,0,0.3); }
    100% { box-shadow: 0 0 25px rgba(243, 156, 18, 0.6), 0 4px 8px rgba(0,0,0,0.3); }
}

.loop-pad-fill {
    background: linear-gradient(135deg, 
        rgba(125, 141, 134, 0.2) 0%, 
        rgba(62, 63, 41, 0.2) 50%, 
        rgba(45, 44, 40, 0.2) 100%);
    border-color: var(--secondary-color);
}

.loop-pad-fill:hover {
    background: linear-gradient(135deg, 
        rgba(125, 141, 134, 0.3) 0%, 
        rgba(62, 63, 41, 0.3) 50%, 
        rgba(45, 44, 40, 0.3) 100%);
    border-color: var(--text-color);
}

.loop-pad-disabled {
    opacity: 0.4 !important;
    cursor: not-allowed !important;
    background: linear-gradient(135deg, 
        rgba(100, 100, 100, 0.15) 0%, 
        rgba(80, 80, 80, 0.15) 100%) !important;
    border-color: rgba(100, 100, 100, 0.3) !important;
    color: rgba(197, 177, 148, 0.5) !important;
}

.loop-pad-disabled:hover {
    transform: none !important;
    box-shadow: 0 3px 6px rgba(0,0,0,0.2) !important;
}

.pad-number {
    font-size: 1.5em;
    font-weight: 700;
    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

.pad-label {
    font-size: 0.85em;
    opacity: 0.9;
    text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.loop-player-controls {
    display: grid;
    grid-template-columns: auto auto;
    gap: 15px;
    align-items: center;
}

.loop-control-btn {
    background: linear-gradient(135deg, 
        rgba(197, 177, 148, 0.2) 0%, 
        rgba(125, 141, 134, 0.2) 100%);
    border: 1px solid var(--accent-color);
    border-radius: 8px;
    color: var(--accent-color);
    padding: 12px 20px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.loop-control-btn:hover {
    background: linear-gradient(135deg, 
        rgba(197, 177, 148, 0.3) 0%, 
        rgba(125, 141, 134, 0.3) 100%);
    border-color: var(--warning-color);
    color: #fff;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
}

.loop-control-btn.playing,
.loop-control-btn.active {
    background: linear-gradient(135deg, 
        rgba(40, 167, 69, 0.7) 0%, 
        rgba(34, 139, 58, 0.7) 100%);
    border-color: var(--success-color);
    color: white;
    box-shadow: 
        0 0 15px rgba(40, 167, 69, 0.5),
        0 2px 4px rgba(0,0,0,0.2);
}

.loop-control-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: linear-gradient(135deg, 
        rgba(100, 100, 100, 0.2) 0%, 
        rgba(80, 80, 80, 0.2) 100%);
    border-color: rgba(100, 100, 100, 0.3);
    color: rgba(197, 177, 148, 0.5);
}

.loop-control-btn:disabled:hover {
    transform: none;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.loop-control-group {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--accent-color);
    background: linear-gradient(135deg, 
        rgba(45, 44, 40, 0.4) 0%, 
        rgba(62, 63, 41, 0.4) 100%);
    padding: 10px 15px;
    border-radius: 8px;
    border: 1px solid rgba(197, 177, 148, 0.2);
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);
}

.loop-control-group label {
    font-size: 0.9em;
    font-weight: 600;
    white-space: nowrap;
    text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.loop-tempo-info {
    width: 100%;
    margin-top: 4px;
    text-align: center;
}

.loop-tempo-quality {
    margin-left: 8px;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.7em;
    font-weight: 600;
}

.loop-tempo-quality.optimal {
    background: rgba(40, 167, 69, 0.8);
    color: white;
}

.loop-tempo-quality.acceptable {
    background: rgba(243, 156, 18, 0.8);
    color: white;
}

.loop-tempo-quality.extreme {
    background: rgba(231, 76, 60, 0.8);
    color: white;
}

.loop-slider {
    flex: 1;
    min-width: 80px;
    accent-color: var(--accent-color);
}

.loop-value {
    font-size: 0.85em;
    font-weight: 600;
    min-width: 40px;
    text-align: right;
    text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.loop-tempo-reset-btn {
    background: linear-gradient(135deg, 
        rgba(197, 177, 148, 0.8) 0%, 
        rgba(125, 141, 134, 0.8) 100%);
    border: 1px solid var(--accent-color);
    border-radius: 4px;
    width: 28px;
    height: 28px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-left: 8px;
    transition: all 0.2s;
    font-size: 0.8em;
    color: var(--primary-color);
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.loop-tempo-reset-btn:hover {
    background: linear-gradient(135deg, 
        rgba(197, 177, 148, 1) 0%, 
        rgba(125, 141, 134, 1) 100%);
    border-color: var(--warning-color);
    color: var(--primary-color);
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
}

.loop-tempo-reset-btn:active {
    transform: scale(0.95);
}

@media (max-width: 768px) {
    .loop-player-controls {
        grid-template-columns: 1fr;
    }
    
    .loop-pads-row {
        gap: 8px;
    }
    
    .loop-pad {
        padding: 15px 8px;
    }
    
    .loop-player-container {
        padding: 15px;
        margin: 15px 0;
    }
}
</style>
`;
