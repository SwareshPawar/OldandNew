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
 * Find best matching loop set for a song
 * Returns: {loopSet, score} or null
 */
async function findMatchingLoopSet(song) {
    const metadata = await getLoopsMetadata();
    if (!metadata || !metadata.loops || metadata.loops.length === 0) {
        return null;
    }

    const songTaal = (song.taal || '').toLowerCase().trim();
    const songTime = (song.time || song.timeSignature || '').trim();
    const songGenre = (song.genre || '').toLowerCase().trim();
    const songTempo = getTempoCategory(song.bpm || song.tempo);

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

    // Find matching loop sets and score them
    let bestMatch = null;
    let bestScore = 0;

    for (const [key, loopSet] of Object.entries(loopSets)) {
        const cond = loopSet.conditions;
        
        // **REQUIRED**: Taal and Time must match
        const taalMatch = songTaal.includes(cond.taal.toLowerCase()) || cond.taal.toLowerCase().includes(songTaal);
        const timeMatch = cond.timeSignature === songTime;

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
        <div class="loop-player-status" id="loopStatus-${songId}">Loading...</div>
    </div>
    
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

${loopPlayerStyles}
`;
}

/**
 * Initialize loop player for a song
 */
async function initializeLoopPlayer(songId) {
    // Check if songs array exists
    if (typeof songs === 'undefined') {
        return;
    }
    
    // Check if song is in the songs array
    const song = songs.find(s => s.id == songId);
    if (!song) {
        return;
    }
    
    // Find matching loop set for this song
    const matchResult = await findMatchingLoopSet(song);
    
    if (!matchResult) {
        const container = document.getElementById(`loopPlayerContainer-${songId}`);
        if (container) container.style.display = 'none';
        return;
    }
    
    const { loopSet, score } = matchResult;
    
    // Show the container
    const container = document.getElementById(`loopPlayerContainer-${songId}`);
    if (!container) {
        return;
    }
    container.style.display = 'block';
    
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
    if (status) status.textContent = 'Loading loops...';
    
    try {
        // Create loop map from matched files
        // Note: Tone.js handles URL encoding internally, so pass raw paths
        const loopMap = {
            loop1: `/loops/${loopSet.files.loop1}`,
            loop2: `/loops/${loopSet.files.loop2}`,
            loop3: `/loops/${loopSet.files.loop3}`,
            fill1: `/loops/${loopSet.files.fill1}`,
            fill2: `/loops/${loopSet.files.fill2}`,
            fill3: `/loops/${loopSet.files.fill3}`
        };
        
        await loopPlayerInstance.loadLoops(loopMap);
        if (status) {
            // Check if all loops fetched successfully
            const loadedCount = loopPlayerInstance.rawAudioData ? loopPlayerInstance.rawAudioData.size : 0;
            if (loadedCount === 6) {
                const matchInfo = getMatchQuality(score);
                status.textContent = `Ready - ${matchInfo.label}`;
                status.title = matchInfo.description;
            } else {
                status.textContent = `Loaded ${loadedCount}/6 loops`;
            }
        }
    } catch (error) {
        if (status) status.textContent = 'Failed to load loops';
        return;
    }
    
    // Disable pads for missing loops
    const pads = container.querySelectorAll('.loop-pad');
    pads.forEach(pad => {
        const loopName = pad.dataset.loop;
        const loopFile = loopSet.files[loopName];
        const isLoaded = loopPlayerInstance.rawAudioData && loopPlayerInstance.rawAudioData.has(loopName);
        
        // Disable pad if file doesn't exist or failed to load
        if (!loopFile || !isLoaded) {
            pad.disabled = true;
            pad.classList.add('loop-pad-disabled');
            pad.title = `${loopName} not available`;
        } else {
            pad.disabled = false;
            pad.classList.remove('loop-pad-disabled');
        }
    });
    
    // Set up pad click handlers
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
    
    // Play/Pause button
    const playBtn = document.getElementById(`loopPlayBtn-${songId}`);
    if (playBtn) {
        playBtn.addEventListener('click', async () => {
            if (loopPlayerInstance.isPlaying) {
                loopPlayerInstance.pause();
                playBtn.innerHTML = '<i class="fas fa-play"></i><span>Play</span>';
                playBtn.classList.remove('playing');
            } else {
                await loopPlayerInstance.play();
                playBtn.innerHTML = '<i class="fas fa-pause"></i><span>Pause</span>';
                playBtn.classList.add('playing');
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
}

/**
 * Cleanup loop player when song changes
 */
function cleanupLoopPlayer() {
    if (loopPlayerInstance && loopPlayerInstance.isPlaying) {
        loopPlayerInstance.pause();
    }
}

// CSS Styles
const loopPlayerStyles = `
<style>
.loop-player-container {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    padding: 20px;
    margin: 20px 0;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

.loop-player-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    color: white;
}

.loop-player-header h4 {
    margin: 0;
    font-size: 1.1em;
    font-weight: 600;
}

.loop-player-status {
    font-size: 0.9em;
    opacity: 0.9;
    background: rgba(255,255,255,0.15);
    padding: 4px 12px;
    border-radius: 12px;
}

.loop-pads-grid {
    margin-bottom: 20px;
}

.loop-pads-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 10px;
}

.loop-pad {
    background: rgba(255,255,255,0.15);
    border: 2px solid rgba(255,255,255,0.3);
    border-radius: 8px;
    padding: 20px 10px;
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
}

.loop-pad:hover {
    background: rgba(255,255,255,0.25);
    border-color: rgba(255,255,255,0.5);
    transform: translateY(-2px);
}

.loop-pad-active {
    background: rgba(255,255,255,0.3);
    border-color: white;
    box-shadow: 0 0 15px rgba(255,255,255,0.4);
}

.loop-pad-fill {
    background: rgba(255, 193, 7, 0.2);
    border-color: rgba(255, 193, 7, 0.5);
}

.loop-pad-fill:hover {
    background: rgba(255, 193, 7, 0.3);
    border-color: rgba(255, 193, 7, 0.8);
}

.loop-pad-disabled {
    opacity: 0.4 !important;
    cursor: not-allowed !important;
    background: rgba(100, 100, 100, 0.2) !important;
    border-color: rgba(100, 100, 100, 0.3) !important;
}

.loop-pad-disabled:hover {
    background: rgba(100, 100, 100, 0.2) !important;
    transform: none !important;
    box-shadow: none !important;
}

.pad-number {
    font-size: 1.4em;
    font-weight: 700;
}

.pad-label {
    font-size: 0.85em;
    opacity: 0.9;
}

.loop-player-controls {
    display: grid;
    grid-template-columns: auto auto;
    gap: 12px;
    align-items: center;
}

.loop-control-btn {
    background: rgba(255,255,255,0.2);
    border: 1px solid rgba(255,255,255,0.4);
    border-radius: 6px;
    color: white;
    padding: 10px 20px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: center;
}

.loop-control-btn:hover {
    background: rgba(255,255,255,0.3);
    border-color: rgba(255,255,255,0.6);
}

.loop-control-btn.playing,
.loop-control-btn.active {
    background: rgba(76, 175, 80, 0.8);
    border-color: rgba(76, 175, 80, 1);
}

.loop-control-group {
    display: flex;
    align-items: center;
    gap: 10px;
    color: white;
    background: rgba(0,0,0,0.15);
    padding: 8px 12px;
    border-radius: 6px;
}

.loop-control-group label {
    font-size: 0.9em;
    font-weight: 600;
    white-space: nowrap;
}

.loop-tempo-info {
    width: 100%;
    margin-top: 4px;
    text-align: center;
}

.loop-tempo-quality {
    margin-left: 8px;
    padding: 2px 8px;
    border-radius: 3px;
    font-size: 0.7em;
    font-weight: 600;
}

.loop-tempo-quality.optimal {
    background: #d4edda;
    color: #155724;
}

.loop-tempo-quality.acceptable {
    background: #fff3cd;
    color: #856404;
}

.loop-tempo-quality.extreme {
    background: #f8d7da;
    color: #721c24;
}

.loop-slider {
    flex: 1;
    min-width: 80px;
}

.loop-value {
    font-size: 0.85em;
    font-weight: 600;
    min-width: 40px;
    text-align: right;
}

.loop-tempo-reset-btn {
    background: #f0f0f0;
    border: 1px solid #ccc;
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
    color: #555;
}

.loop-tempo-reset-btn:hover {
    background: #e0e0e0;
    border-color: #999;
    color: #000;
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
}
</style>
`;
