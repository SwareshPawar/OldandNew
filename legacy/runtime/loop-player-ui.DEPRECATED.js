/**
 * ⚠️⚠️⚠️ DEPRECATED - DO NOT USE ⚠️⚠️⚠️
 * 
 * This file has been REPLACED by loop-player-pad-ui.js (v2.0)
 * 
 * Date Deprecated: February 19, 2026
 * Reason: Migrated to modern pad-based interface with better UX
 * 
 * This file is kept for reference only and is NOT loaded in index.html
 * Use loop-player-pad-ui.js instead for all loop player functionality
 * 
 * ⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️
 */

/**
 * Loop Player UI Integration (OLD VERSION)
 * 
 * This file contains the UI components and integration code for the Loop Player feature.
 * Add this to your main.js file and include loop-player.js in your HTML.
 */

// ==========================================================================
// GLOBAL LOOP PLAYER INSTANCE
// ==========================================================================

let currentLoopPlayer = null;
let currentSongLoops = null;

// ==========================================================================
// HTML TEMPLATE FOR LOOP PLAYER UI
// ==========================================================================

function getLoopPlayerHTML(songId) {
  return `
    <div class="loop-player-container" id="loopPlayerContainer-${songId}">
      <div class="loop-player-header">
        <h3>
          <i class="fas fa-music"></i> Loop Player
        </h3>
        <button class="btn-icon" onclick="toggleLoopPlayerExpanded(${songId})" title="Toggle Loop Player">
          <i class="fas fa-chevron-down" id="loopPlayerToggleIcon-${songId}"></i>
        </button>
      </div>
      
      <div class="loop-player-content" id="loopPlayerContent-${songId}">
        <!-- Upload Section -->
        <div class="loop-upload-section">
          <h4>Upload Loop Files</h4>
          <div class="loop-types-grid">
            ${['main', 'variation1', 'variation2', 'variation3', 'fillin'].map(type => `
              <div class="loop-type-upload">
                <label>${formatLoopType(type)}</label>
                <div class="loop-upload-controls">
                  <input 
                    type="file" 
                    id="loopFile-${songId}-${type}" 
                    accept="audio/*" 
                    style="display:none"
                    onchange="handleLoopFileUpload(${songId}, '${type}', this)"
                  >
                  <button 
                    class="btn btn-small" 
                    onclick="document.getElementById('loopFile-${songId}-${type}').click()"
                    id="uploadBtn-${songId}-${type}"
                  >
                    <i class="fas fa-upload"></i> Upload
                  </button>
                  <button 
                    class="btn btn-small btn-danger" 
                    onclick="deleteLoopFile(${songId}, '${type}')"
                    id="deleteBtn-${songId}-${type}"
                    style="display:none"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                  <span class="loop-status" id="loopStatus-${songId}-${type}">
                    <i class="fas fa-circle" style="color:#ccc"></i> Not loaded
                  </span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Pattern Configuration -->
        <div class="loop-pattern-section">
          <h4>Loop Pattern</h4>
          <div class="pattern-editor" id="patternEditor-${songId}">
            <div class="pattern-chips" id="patternChips-${songId}">
              <!-- Pattern chips will be added here dynamically -->
            </div>
            <div class="pattern-add-controls">
              <select id="loopTypeSelect-${songId}" class="form-control">
                <option value="main">Main Loop</option>
                <option value="variation1">Variation 1</option>
                <option value="variation2">Variation 2</option>
                <option value="variation3">Variation 3</option>
                <option value="fillin">Fill-in</option>
              </select>
              <button  class="btn btn-small" onclick="addToPattern(${songId})">
                <i class="fas fa-plus"></i> Add
              </button>
            </div>
            <div class="pattern-example">
              <small>Example: Main → Variation1 → Variation2 → Variation3 → Fill → Repeat</small>
            </div>
          </div>
        </div>

        <!-- Playback Controls -->
        <div class="loop-controls-section">
          <h4>Playback Controls</h4>
          <div class="playback-controls">
            <button 
              class="btn btn-primary btn-play" 
              id="playPauseBtn-${songId}" 
              onclick="togglePlayPause(${songId})"
              disabled
            >
              <i class="fas fa-play"></i> Play
            </button>
            
            <div class="control-group">
              <label>
                <i class="fas fa-volume-up"></i> Volume: 
                <span id="volumeValue-${songId}">80</span>%
              </label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value="80" 
                class="slider"
                id="volumeSlider-${songId}"
                oninput="handleVolumeChange(${songId}, this.value)"
              >
            </div>

            <div class="control-group">
              <label>
                <i class="fas fa-tachometer-alt"></i> Tempo: 
                <span id="tempoValue-${songId}">100</span>%
                <span id="tempoQuality-${songId}" class="tempo-quality" style="display:none;"></span>
              </label>
              <input 
                type="range" 
                min="50" 
                max="200" 
                value="100" 
                class="slider"
                id="tempoSlider-${songId}"
                oninput="handleTempoChange(${songId}, this.value)"
              >
              <div class="tempo-info">
                <small style="color: #888; font-size: 0.85em;">
                  Optimal range: 75-150% • Preserves pitch quality
                </small>
              </div>
              <div class="tempo-presets">
                <button class="btn-preset" onclick="setTempo(${songId}, 75)">75%</button>
                <button class="btn-preset" onclick="setTempo(${songId}, 100)">100%</button>
                <button class="btn-preset" onclick="setTempo(${songId}, 125)">125%</button>
              </div>
            </div>
          </div>

          <div class="now-playing" id="nowPlaying-${songId}" style="display:none">
            <i class="fas fa-music"></i>
            <span>Now Playing: <strong id="currentLoop-${songId}">--</strong></span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ==========================================================================
// CSS STYLES FOR LOOP PLAYER
// ==========================================================================

const loopPlayerStyles = `
<style>
.loop-player-container {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.loop-player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #667eea;
}

.loop-player-header h3 {
  margin: 0;
  color: #667eea;
  font-size: 1.3rem;
}

.loop-upload-section,
.loop-pattern-section,
.loop-controls-section {
  margin-bottom: 25px;
}

.loop-upload-section h4,
.loop-pattern-section h4,
.loop-controls-section h4 {
  color: #495057;
  font-size: 1.1rem;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.loop-types-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.loop-type-upload {
  background: white;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.loop-type-upload label {
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  font-size: 0.95rem;
}

.loop-upload-controls {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.loop-status {
  font-size: 0.85rem;
  color: #666;
  display: flex;
  align-items: center;
  gap: 5px;
}

.pattern-editor {
  background: white;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.pattern-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 40px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
  margin-bottom: 15px;
}

.pattern-chip {
  background: #667eea;
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  animation: chipSlideIn 0.2s ease-out;
}

@keyframes chipSlideIn {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.pattern-chip .chip-remove {
  cursor: pointer;
  background: rgba(255,255,255,0.3);
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: background 0.2s;
}

.pattern-chip .chip-remove:hover {
  background: rgba(255,255,255,0.5);
}

.pattern-add-controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.pattern-add-controls select {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.pattern-example {
  margin-top: 10px;
  padding: 8px;
  background: #e7f3ff;
  border-left: 3px solid #667eea;
  font-size: 0.85rem;
  color: #495057;
}

.playback-controls {
  background: white;
  padding: 20px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.btn-play {
  width: 100%;
  padding: 15px;
  font-size: 1.1rem;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.control-group {
  margin-bottom: 20px;
}

.control-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #495057;
}

.slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #ddd;
  outline: none;
  -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #667eea;
  cursor: pointer;
}

.slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #667eea;
  cursor: pointer;
  border: none;
}

.tempo-presets {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.btn-preset {
  padding: 6px 12px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.btn-preset:hover {
  background: #e9ecef;
  border-color: #667eea;
  color: #667eea;
}

.tempo-info {
  margin-top: 4px;
  margin-bottom: 4px;
}

.tempo-quality {
  margin-left: 8px;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 0.75em;
  font-weight: 600;
}

.tempo-quality.optimal {
  background: #d4edda;
  color: #155724;
}

.tempo-quality.acceptable {
  background: #fff3cd;
  color: #856404;
}

.tempo-quality.extreme {
  background: #f8d7da;
  color: #721c24;
}

.now-playing {
  margin-top: 15px;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 10px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.95; }
}

.btn-small {
  padding: 6px 12px;
  font-size: 0.85rem;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  color: #667eea;
  padding: 5px;
  transition: transform 0.3s;
}

.btn-icon:hover {
  transform: scale(1.1);
}

.loop-player-content.collapsed {
  display: none;
}
</style>
`;

// ==========================================================================
// UTILITY FUNCTIONS
// ==========================================================================

function formatLoopType(type) {
  const typeNames = {
    'main': 'Main Loop',
    'variation1': 'Variation 1',
    'variation2': 'Variation 2',
    'variation3': 'Variation 3',
    'fillin': 'Fill-in'
  };
  return typeNames[type] || type;
}

// ==========================================================================
// INITIALIZATION
// ==========================================================================

async function initializeLoopPlayer(songId) {
  try {
    // Load loop data for the song
    const response = await fetch(`${API_BASE_URL}/api/songs/${songId}/loops`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to load loop data');
    }
    
    currentSongLoops = await response.json();
    
    // Update UI with loaded loop status
    updateLoopStatus(songId, currentSongLoops);
    
    // Initialize pattern display
    updatePatternDisplay(songId, currentSongLoops.pattern || []);
    
    // Initialize loop player engine
    if (!currentLoopPlayer) {
      currentLoopPlayer = new LoopPlayer();
    }
    
    // Load audio files if available
    if (currentSongLoops.loops && Object.keys(currentSongLoops.loops).length > 0) {
      await currentLoopPlayer.loadLoops(currentSongLoops.loops);
      
      // Set pattern
      if (currentSongLoops.pattern && currentSongLoops.pattern.length > 0) {
        currentLoopPlayer.setPattern(currentSongLoops.pattern);
        document.getElementById(`playPauseBtn-${songId}`).disabled = false;
      }
      
      // Set callbacks
      currentLoopPlayer.onLoopChange = (loopType) => {
        document.getElementById(`currentLoop-${songId}`).textContent = formatLoopType(loopType);
        document.getElementById(`nowPlaying-${songId}`).style.display = 'flex';
      };
      
      currentLoopPlayer.onError = (error) => {
        showNotification(error, 'error');
      };
    }
    
  } catch (error) {
    console.error('Error initializing loop player:', error);
    showNotification('Failed to load loop player', 'error');
  }
}

function updateLoopStatus(songId, loopData) {
  const loopTypes = ['main', 'variation1', 'variation2', 'variation3', 'fillin'];
  
  loopTypes.forEach(type => {
    const statusEl = document.getElementById(`loopStatus-${songId}-${type}`);
    const deleteBtn = document.getElementById(`deleteBtn-${songId}-${type}`);
    
    if (loopData.loops && loopData.loops[type]) {
      statusEl.innerHTML = '<i class="fas fa-check-circle" style="color:#28a745"></i> Loaded';
      if (deleteBtn) deleteBtn.style.display = 'inline-block';
    } else {
      statusEl.innerHTML = '<i class="fas fa-circle" style="color:#ccc"></i> Not loaded';
      if (deleteBtn) deleteBtn.style.display = 'none';
    }
  });
}

// ==========================================================================
// FILE UPLOAD
// ==========================================================================

async function handleLoopFileUpload(songId, loopType, input) {
  const file = input.files[0];
  if (!file) return;
  
  // Validate file type
  if (!file.type.startsWith('audio/')) {
    showNotification('Please select an audio file', 'error');
    input.value = '';
    return;
  }
  
  // Validate file size (10MB max)
  if (file.size > 10 * 1024 * 1024) {
    showNotification('File size must be less than 10MB', 'error');
    input.value = '';
    return;
  }
  
  const formData = new FormData();
  formData.append('audioFile', file);
  formData.append('loopType', loopType);
  
  try {
    showNotification('Uploading...', 'info');
    const uploadBtn = document.getElementById(`uploadBtn-${songId}-${loopType}`);
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    
    const response = await fetch(`${API_BASE_URL}/api/songs/${songId}/loops/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Upload failed');
    }
    
    const result = await response.json();
    showNotification(`${formatLoopType(loopType)} uploaded successfully!`, 'success');
    
    // Reload loop player
    await initializeLoopPlayer(songId);
    
  } catch (error) {
    console.error('Upload error:', error);
    showNotification('Failed to upload loop file', 'error');
  } finally {
    const uploadBtn = document.getElementById(`uploadBtn-${songId}-${loopType}`);
    uploadBtn.disabled = false;
    uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Upload';
    input.value = '';
  }
}

async function deleteLoopFile(songId, loopType) {
  if (!confirm(`Delete ${formatLoopType(loopType)}?`)) {
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/songs/${songId}/loops/${loopType}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Delete failed');
    }
    
    showNotification(`${formatLoopType(loopType)} deleted`, 'success');
    await initializeLoopPlayer(songId);
    
  } catch (error) {
    console.error('Delete error:', error);
    showNotification('Failed to delete loop file', 'error');
  }
}

// ==========================================================================
// PATTERN CONFIGURATION
// ==========================================================================

function updatePatternDisplay(songId, pattern) {
  const container = document.getElementById(`patternChips-${songId}`);
  if (!container) return;
  
  if (pattern.length === 0) {
    container.innerHTML = '<span style="color:#999;font-style:italic;">No pattern set. Add loops to create a pattern.</span>';
    return;
  }
  
  container.innerHTML = pattern.map((loopType, index) => `
    <div class="pattern-chip">
      <span>${formatLoopType(loopType)}</span>
      <span class="chip-remove" onclick="removeFromPattern(${songId}, ${index})">×</span>
    </div>
  `).join('');
}

async function addToPattern(songId) {
  const select = document.getElementById(`loopTypeSelect-${songId}`);
  const loopType = select.value;
  
  const currentPattern = currentSongLoops?.pattern || [];
  currentPattern.push(loopType);
  
  await savePattern(songId, currentPattern);
}

async function removeFromPattern(songId, index) {
  const currentPattern = currentSongLoops?.pattern || [];
  currentPattern.splice(index, 1);
  
  await savePattern(songId, currentPattern);
}

async function savePattern(songId, pattern) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/songs/${songId}/loops/config`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ pattern, enabled: true })
    });
    
    if (!response.ok) {
      throw new Error('Failed to save pattern');
    }
    
    await initializeLoopPlayer(songId);
    showNotification('Pattern saved!', 'success');
    
  } catch (error) {
    console.error('Save pattern error:', error);
    showNotification('Failed to save pattern', 'error');
  }
}

// ==========================================================================
// PLAYBACK CONTROLS
// ==========================================================================

async function togglePlayPause(songId) {
  if (!currentLoopPlayer) {
    showNotification('Loop player not initialized', 'error');
    return;
  }
  
  await currentLoopPlayer.togglePlayPause();
  
  const btn = document.getElementById(`playPauseBtn-${songId}`);
  if (currentLoopPlayer.isPlaying) {
    btn.innerHTML = '<i class="fas fa-pause"></i> Pause';
    btn.classList.add('btn-warning');
    btn.classList.remove('btn-primary');
  } else {
    btn.innerHTML = '<i class="fas fa-play"></i> Play';
    btn.classList.add('btn-primary');
    btn.classList.remove('btn-warning');
    document.getElementById(`nowPlaying-${songId}`).style.display = 'none';
  }
}

function handleVolumeChange(songId, value) {
  const volumePercent = parseInt(value);
  document.getElementById(`volumeValue-${songId}`).textContent = volumePercent;
  
  if (currentLoopPlayer) {
    currentLoopPlayer.setVolume(volumePercent / 100);
  }
}

function handleTempoChange(songId, value) {
  const tempoPercent = parseInt(value);
  document.getElementById(`tempoValue-${songId}`).textContent = tempoPercent;
  
  // Show quality indicator
  const qualityEl = document.getElementById(`tempoQuality-${songId}`);
  if (qualityEl) {
    if (tempoPercent >= 75 && tempoPercent <= 150) {
      qualityEl.textContent = '✓ Optimal';
      qualityEl.className = 'tempo-quality optimal';
      qualityEl.style.display = 'inline-block';
    } else if (tempoPercent >= 60 && tempoPercent <= 175) {
      qualityEl.textContent = '⚠ Acceptable';
      qualityEl.className = 'tempo-quality acceptable';
      qualityEl.style.display = 'inline-block';
    } else {
      qualityEl.textContent = '⚠ Extreme';
      qualityEl.className = 'tempo-quality extreme';
      qualityEl.style.display = 'inline-block';
    }
  }
  
  if (currentLoopPlayer) {
    currentLoopPlayer.setPlaybackRate(tempoPercent / 100);
  }
}

function setTempo(songId, tempoPercent) {
  document.getElementById(`tempoSlider-${songId}`).value = tempoPercent;
  handleTempoChange(songId, tempoPercent);
}

function toggleLoopPlayerExpanded(songId) {
  const content = document.getElementById(`loopPlayerContent-${songId}`);
  const icon = document.getElementById(`loopPlayerToggleIcon-${songId}`);
  
  content.classList.toggle('collapsed');
  
  if (content.classList.contains('collapsed')) {
    icon.classList.remove('fa-chevron-down');
    icon.classList.add('fa-chevron-right');
  } else {
    icon.classList.remove('fa-chevron-right');
    icon.classList.add('fa-chevron-down');
  }
}

// ==========================================================================
// CLEANUP
// ==========================================================================

function cleanupLoopPlayer() {
  if (currentLoopPlayer) {
    currentLoopPlayer.destroy();
    currentLoopPlayer = null;
  }
  currentSongLoops = null;
}

// Export functions for use in main.js
window.loopPlayerFunctions = {
  getLoopPlayerHTML,
  initializeLoopPlayer,
  cleanupLoopPlayer,
  loopPlayerStyles
};
