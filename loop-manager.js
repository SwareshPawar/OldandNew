/**
 * Loop Manager - Admin Interface JavaScript
 * Handles loop file uploads, metadata management, and display
 */

const API_BASE_URL = window.AppApiBase.resolve();
const normalizeRhythmFamily = window.RhythmSetUtils.normalizeRhythmFamily;
const buildRhythmSetId = window.RhythmSetUtils.buildRhythmSetId;

let loopsMetadata = null;
let songMetadata = null;
let isReadOnlyMode = false;
const audioPreviewController = window.AdminPage.createAudioPreviewController();

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!isAuthenticated()) {
        showAuthenticationWarning();
        return;
    }

    await loadSongMetadata();
    await loadLoopsMetadata();
    setupEventListeners();
    updateFilenamePreview();
    updateStats();
});

async function authFetch(url, options = {}) {
    const response = await window.AppAuth.authFetch(url, {
        ...options,
        suppressAuthRedirect: true,
        loginUrl: 'index.html'
    });

    if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;

        try {
            const errorPayload = await response.clone().json();
            errorMessage = errorPayload.error || errorPayload.message || errorMessage;
        } catch (jsonError) {
            try {
                const errorText = await response.clone().text();
                if (errorText) {
                    errorMessage = errorText;
                }
            } catch (textError) {
                // Keep status-based message.
            }
        }

        throw new Error(errorMessage);
    }

    return response;
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    return window.AppAuth.hasToken();
}

/**
 * Show authentication warning
 */
function showAuthenticationWarning() {
    isReadOnlyMode = true;
    window.AdminPage.showAuthenticationWarnings({
        alerts: [
            {
                elementId: 'uploadAlert',
                type: 'error',
                html: `
                    <strong><i class="fas fa-lock"></i> Authentication Required</strong><br>
                    Please <a href="index.html" style="color: #2c5282; font-weight: bold; text-decoration: underline;">login to the main app</a> first to access Loop Manager.
                `
            },
            {
                elementId: 'loopsAlert',
                type: 'info',
                html: `
                    <strong><i class="fas fa-info-circle"></i> Login Required</strong><br>
                    You can view loops but need admin access to upload or delete.
                `
            }
        ],
        disableSelectors: ['#uploadForm']
    });
    
    // Still load and display loops (read-only mode)
    loadSongMetadata();
    loadLoopsMetadata();
    updateStats();
}

/**
 * Load song metadata (taals, times, genres from main.js)
 */
async function loadSongMetadata() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/song-metadata`);
        if (response.ok) {
            songMetadata = await response.json();
            populateDropdowns();
        } else {
            showAlert('uploadAlert', 'Failed to load song metadata', 'error');
        }
    } catch (error) {
        console.error('Error loading song metadata:', error);
    }
}

/**
 * Populate dropdowns with song metadata
 */
function populateDropdowns() {
    if (!songMetadata) return;

    // Populate Rhythm Family dropdown (source-of-truth from metadata/rhythm sets)
    const rhythmFamilySelect = document.getElementById('rhythmFamilyInput');
    const rhythmFamilies = Array.isArray(songMetadata.rhythmFamilies)
        ? songMetadata.rhythmFamilies
        : [];

    rhythmFamilySelect.innerHTML = '<option value="">Select Rhythm Family</option>';
    Array.from(new Set(rhythmFamilies)).sort().forEach(family => {
        const option = document.createElement('option');
        option.value = family;
        option.textContent = family;
        rhythmFamilySelect.appendChild(option);
    });

    // Keep Taal auto-synced with Rhythm Family for consistent mapping.
    const taalSelect = document.getElementById('taalInput');
    taalSelect.innerHTML = '<option value="">Auto from Rhythm Family</option>';
    taalSelect.disabled = true;

    syncTaalWithRhythmFamily();

    // Populate Time Signature dropdown
    const timeSelect = document.getElementById('timeInput');
    timeSelect.innerHTML = '<option value="">Select Time</option>';
    songMetadata.times.forEach(time => {
        const option = document.createElement('option');
        option.value = time;
        option.textContent = time;
        timeSelect.appendChild(option);
    });

    // Populate Genre dropdown with musical genres only
    const genreSelect = document.getElementById('genreInput');
    genreSelect.innerHTML = '<option value="">Select Genre</option>';
    songMetadata.musicalGenres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre.toLowerCase();
        option.textContent = genre;
        genreSelect.appendChild(option);
    });
}

/**
 * Load loops metadata from server
 */
async function loadLoopsMetadata() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/loops/metadata`);
        if (response.ok) {
            loopsMetadata = await response.json();
            displayLoops();
        } else {
            showAlert('loopsAlert', 'Failed to load loops metadata', 'error');
        }
    } catch (error) {
        console.error('Error loading loops:', error);
        showAlert('loopsAlert', 'Error loading loops: ' + error.message, 'error');
    } finally {
        document.getElementById('loadingIndicator').style.display = 'none';
        document.getElementById('loopsTableContainer').style.display = 'block';
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Filename preview updater
    document.getElementById('rhythmFamilyInput').addEventListener('change', () => {
        syncTaalWithRhythmFamily();
        updateFilenamePreview();
    });
    document.getElementById('rhythmSetNoInput').addEventListener('input', updateFilenamePreview);
    document.getElementById('timeInput').addEventListener('change', updateFilenamePreview);
    document.getElementById('tempoInput').addEventListener('change', updateFilenamePreview);
    document.getElementById('genreInput').addEventListener('change', updateFilenamePreview);

    // Upload form submission
    document.getElementById('uploadForm').addEventListener('submit', handleUpload);
}

function syncTaalWithRhythmFamily() {
    const rhythmFamily = normalizeRhythmFamily(document.getElementById('rhythmFamilyInput').value || '');
    const taalSelect = document.getElementById('taalInput');
    if (!taalSelect) return rhythmFamily;

    taalSelect.innerHTML = '<option value="">Auto from Rhythm Family</option>';
    if (rhythmFamily) {
        const option = document.createElement('option');
        option.value = rhythmFamily;
        option.textContent = rhythmFamily;
        option.selected = true;
        taalSelect.appendChild(option);
        taalSelect.value = rhythmFamily;
    }

    return rhythmFamily;
}

/**
 * Update filename preview as user selects conditions
 */
function updateFilenamePreview() {
    const rhythmFamily = document.getElementById('rhythmFamilyInput').value;
    const rhythmSetNo = document.getElementById('rhythmSetNoInput').value;
    const taal = normalizeRhythmFamily(rhythmFamily);
    const time = document.getElementById('timeInput').value.replace('/', '_');
    const tempo = document.getElementById('tempoInput').value;
    const genre = document.getElementById('genreInput').value;
    const rhythmSetId = buildRhythmSetId(rhythmFamily, rhythmSetNo);

    const preview = document.getElementById('filenamePreview');
    
    if (rhythmSetId && time && tempo && genre) {
        const pattern = `${taal}_${time}_${tempo}_${genre}`;
        preview.innerHTML = `
            <div style="margin-bottom: 8px; color: #2d3748; font-size: 0.95em;">Rhythm Set: <strong>${rhythmSetId}</strong></div>
            <div style="margin-bottom: 10px; color: #667eea; font-size: 1.1em;">${pattern}_TYPE#.wav</div>
            <div style="font-size: 0.85em; color: #666;">
                <div>• ${pattern}_LOOP1.wav</div>
                <div>• ${pattern}_LOOP2.wav</div>
                <div>• ${pattern}_LOOP3.wav</div>
                <div>• ${pattern}_FILL1.wav</div>
                <div>• ${pattern}_FILL2.wav</div>
                <div>• ${pattern}_FILL3.wav</div>
            </div>
        `;
        
        // Enable upload buttons for slots that have files selected
        for (let i = 1; i <= 6; i++) {
            const fileInput = document.getElementById(`loopFile${i}`);
            const uploadBtn = document.getElementById(`uploadBtn${i}`);
            if (fileInput && fileInput.files.length > 0 && uploadBtn) {
                uploadBtn.disabled = false;
            }
        }
    } else {
        preview.textContent = 'Select rhythm family, set number, and all loop conditions above';
        
        // Disable all upload buttons
        for (let i = 1; i <= 6; i++) {
            const uploadBtn = document.getElementById(`uploadBtn${i}`);
            if (uploadBtn) {
                uploadBtn.disabled = true;
            }
        }
    }
}

/**
 * Handle individual file upload slot
 * Enables/disables upload button when file is selected
 */
function handleIndividualUpload(slotNumber, type) {
    const fileInput = document.getElementById(`loopFile${getSlotId(slotNumber, type)}`);
    const uploadBtn = document.getElementById(`uploadBtn${getSlotId(slotNumber, type)}`);
    
    if (fileInput.files.length > 0) {
        // Check if all conditions are selected
        const rhythmFamily = document.getElementById('rhythmFamilyInput').value;
        const rhythmSetNo = document.getElementById('rhythmSetNoInput').value;
        const time = document.getElementById('timeInput').value;
        const tempo = document.getElementById('tempoInput').value;
        const genre = document.getElementById('genreInput').value;
        const rhythmSetId = buildRhythmSetId(rhythmFamily, rhythmSetNo);
        
        if (rhythmSetId && time && tempo && genre) {
            uploadBtn.disabled = false;
        } else {
            uploadBtn.disabled = true;
            showAlert('uploadAlert', 'Please select rhythm family, set no, time signature, tempo, and genre first', 'warning');
        }
    } else {
        uploadBtn.disabled = true;
    }
}

/**
 * Get slot ID (1-6) from number and type
 */
function getSlotId(number, type) {
    if (type === 'loop') {
        return number; // 1, 2, 3
    } else {
        return number + 3; // 4, 5, 6
    }
}

/**
 * Upload a single file with automatic renaming
 */
async function uploadSingleFile(slotNumber, type) {
    if (isReadOnlyMode) {
        showAlert('uploadAlert', 'Read-only mode. Login required for uploads.', 'warning');
        return;
    }

    const slotId = getSlotId(slotNumber, type);
    const fileInput = document.getElementById(`loopFile${slotId}`);
    const uploadBtn = document.getElementById(`uploadBtn${slotId}`);
    const statusSpan = document.getElementById(`status${slotId}`);
    
    const file = fileInput.files[0];
    if (!file) return;
    
    // Get form values
    const rhythmFamily = document.getElementById('rhythmFamilyInput').value;
    const rhythmSetNo = document.getElementById('rhythmSetNoInput').value;
    const taal = normalizeRhythmFamily(rhythmFamily);
    const time = document.getElementById('timeInput').value;
    const tempo = document.getElementById('tempoInput').value;
    const genre = document.getElementById('genreInput').value;
    const description = document.getElementById('descriptionInput').value;
    const rhythmSetId = buildRhythmSetId(rhythmFamily, rhythmSetNo);
    
    // Validate
    if (!rhythmSetId || !time || !tempo || !genre) {
        showAlert('uploadAlert', 'Please select rhythm family, set no, and all conditions (time, tempo, genre)', 'error');
        return;
    }
    
    // Show uploading state
    statusSpan.textContent = 'Uploading...';
    statusSpan.className = 'upload-status uploading';
    uploadBtn.disabled = true;
    
    try {
        // Create FormData
        const formData = new FormData();
        formData.append('file', file);
        formData.append('rhythmFamily', rhythmFamily);
        formData.append('rhythmSetNo', rhythmSetNo);
        formData.append('taal', taal);
        formData.append('timeSignature', time);
        formData.append('tempo', tempo);
        formData.append('genre', genre);
        formData.append('type', type);
        formData.append('number', slotNumber);
        formData.append('description', description);
        
        // Upload to server
        const response = await authFetch(`${API_BASE_URL}/api/loops/upload-single`, {
            method: 'POST',
            body: formData
        });
        statusSpan.textContent = '✓ Uploaded';
        statusSpan.className = 'upload-status success';
        fileInput.value = ''; // Clear file input

        // Reload loops
        await loadLoopsMetadata();
        updateStats();
    } catch (error) {
        if (error.message === 'AUTH_REQUIRED') {
            showAlert('uploadAlert', 'Session expired. Please login again.', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            return;
        }

        console.error('Upload error:', error);
        statusSpan.textContent = '✗ Failed';
        statusSpan.className = 'upload-status error';
        showAlert('uploadAlert', error.message || 'Upload failed', 'error');
    } finally {
        uploadBtn.disabled = false;
    }
}

/**
 * Handle loop set upload (DEPRECATED - now using individual uploads)
 */
async function handleUpload(event) {
    event.preventDefault();
    showAlert('uploadAlert', 'Please use the individual upload buttons for each file', 'info');
}

/**
 * Display loops in table
 */
function displayLoops() {
    if (!loopsMetadata || !loopsMetadata.loops) {
        document.getElementById('loopsTableBody').innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #999;">No loops found. Upload your first loop set!</td></tr>';
        return;
    }

    const resolveLoopRhythmSetId = (loop) => {
        if (loop.rhythmSetId) return String(loop.rhythmSetId).toLowerCase();
        const family = normalizeRhythmFamily(loop.rhythmFamily || loop.conditions?.taal || '');
        const setNo = parseInt(loop.rhythmSetNo || loop.setNo || 1, 10);
        return buildRhythmSetId(family, setNo) || 'unmapped';
    };

    // Group loops by rhythm set
    const loopSets = {};
    loopsMetadata.loops.forEach(loop => {
        const key = resolveLoopRhythmSetId(loop);
        if (!loopSets[key]) {
            loopSets[key] = {
                rhythmSetId: key,
                conditions: loop.conditions,
                rhythmFamily: loop.rhythmFamily || loop.conditions?.taal || '',
                rhythmSetNo: loop.rhythmSetNo || loop.setNo || 1,
                loops: []
            };
        }
        loopSets[key].loops.push(loop);
    });

    const tbody = document.getElementById('loopsTableBody');
    tbody.innerHTML = '';

    Object.entries(loopSets).forEach(([key, set]) => {
        set.loops.forEach((loop, index) => {
            const tr = document.createElement('tr');
            const safeFilename = escapeHtml(loop.filename || '');
            const safeRhythmSetId = escapeHtml(set.rhythmSetId || '');
            const safeRhythmFamily = escapeHtml(set.rhythmFamily || set.conditions?.taal || '');
            const safeTimeSignature = escapeHtml(set.conditions?.timeSignature || '');
            const safeTempo = escapeHtml(set.conditions?.tempo || '');
            const safeGenre = escapeHtml(set.conditions?.genre || '');
            const tempoClassToken = String(set.conditions?.tempo || 'unknown').toLowerCase().replace(/[^a-z0-9_-]/g, '');
            const safeLoopType = String(loop.type || '').toLowerCase();
            const badgeType = safeLoopType === 'loop' || safeLoopType === 'fill' ? safeLoopType : 'unknown';
            const loopNumber = Number.isFinite(Number(loop.number)) ? Number(loop.number) : '';
            
            // Filename
            const tdFile = document.createElement('td');
            tdFile.innerHTML = `<strong>${safeFilename}</strong>`;
            tr.appendChild(tdFile);

            // Type badge
            const tdType = document.createElement('td');
            tdType.innerHTML = `<span class="badge badge-${badgeType}">${escapeHtml(safeLoopType.toUpperCase())} ${loopNumber}</span>`;
            tr.appendChild(tdType);

            // Conditions (only show for first file in set)
            const tdConditions = document.createElement('td');
            if (index === 0) {
                tdConditions.innerHTML = `
                    <div class="conditions-display">
                        <span class="badge" style="background: #edf2f7; color: #1a202c;">${safeRhythmSetId}</span>
                        <span class="badge" style="background: #e6f2ff; color: #004085;">${safeRhythmFamily}</span>
                        <span class="badge" style="background: #fff3cd; color: #856404;">${safeTimeSignature}</span>
                        <span class="badge badge-tempo-${tempoClassToken}">${safeTempo}</span>
                        <span class="badge" style="background: #d1ecf1; color: #0c5460;">${safeGenre}</span>
                    </div>
                `;
                tdConditions.rowSpan = set.loops.length;
            }
            if (index === 0) tr.appendChild(tdConditions);

            // Audio preview
            const tdPreview = document.createElement('td');
            const previewWrapper = document.createElement('div');
            previewWrapper.className = 'audio-preview';
            const playBtn = document.createElement('button');
            playBtn.className = 'play-btn';
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
            playBtn.addEventListener('click', () => {
                playAudio(`/loops/${encodeURIComponent(String(loop.filename || ''))}`, playBtn);
            });
            previewWrapper.appendChild(playBtn);
            tdPreview.appendChild(previewWrapper);
            tr.appendChild(tdPreview);

            // Actions
            const tdActions = document.createElement('td');
            if (isReadOnlyMode) {
                tdActions.innerHTML = '<span style="color:#718096; font-size: 0.9em;">Read-only</span>';
            } else {
                const actionWrapper = document.createElement('div');
                actionWrapper.className = 'action-btns';

                const replaceInput = document.createElement('input');
                replaceInput.type = 'file';
                replaceInput.accept = 'audio/*';
                replaceInput.style.display = 'none';
                replaceInput.addEventListener('change', () => {
                    handleReplaceFile(loop.id, replaceInput);
                });

                const replaceBtn = document.createElement('button');
                replaceBtn.className = 'btn btn-warning btn-icon';
                replaceBtn.title = 'Replace';
                replaceBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
                replaceBtn.addEventListener('click', () => {
                    replaceInput.click();
                });

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn btn-danger btn-icon';
                deleteBtn.title = 'Delete';
                deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
                deleteBtn.addEventListener('click', () => {
                    deleteLoop(loop.id);
                });

                actionWrapper.appendChild(replaceInput);
                actionWrapper.appendChild(replaceBtn);
                actionWrapper.appendChild(deleteBtn);
                tdActions.appendChild(actionWrapper);
            }
            tr.appendChild(tdActions);

            tbody.appendChild(tr);
        });
    });
}

/**
 * Play audio preview
 */
function playAudio(url, button) {
    audioPreviewController.play(url, button);
}

/**
 * Handle replace file selection
 */
function handleReplaceFile(loopId, fileInput) {
    if (isReadOnlyMode) {
        showAlert('loopsAlert', 'Read-only mode. Login required for replace/delete actions.', 'warning');
        if (fileInput) fileInput.value = '';
        return;
    }

    const file = fileInput.files[0];
    if (!file) return;
    
    if (!confirm(`Replace this loop with "${file.name}"? The original file will be permanently deleted.`)) {
        fileInput.value = ''; // Clear the selection
        return;
    }
    
    replaceLoop(loopId, file);
}

/**
 * Replace loop file
 */
async function replaceLoop(loopId, file) {
    if (isReadOnlyMode) {
        showAlert('loopsAlert', 'Read-only mode. Login required for replace/delete actions.', 'warning');
        return;
    }

    try {
        // Show loading state
        showAlert('loopsAlert', 'Replacing loop file...', 'info');
        
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await authFetch(`${API_BASE_URL}/api/loops/${loopId}/replace`, {
            method: 'PUT',
            body: formData
        });

        const result = await response.json();
        showAlert('loopsAlert', `Loop replaced successfully: ${result.filename}`, 'success');
        await loadLoopsMetadata();
        updateStats();
    } catch (error) {
        if (error.message === 'AUTH_REQUIRED') {
            showAlert('loopsAlert', 'Session expired. Please login again.', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            return;
        }

        console.error('Replace error:', error);
        showAlert('loopsAlert', error.message || 'Failed to replace loop', 'error');
    }
}

/**
 * Delete loop file
 */
async function deleteLoop(loopId) {
    if (isReadOnlyMode) {
        showAlert('loopsAlert', 'Read-only mode. Login required for replace/delete actions.', 'warning');
        return;
    }

    if (!confirm('Are you sure you want to delete this loop? This action cannot be undone.')) {
        return;
    }

    try {
        await authFetch(`${API_BASE_URL}/api/loops/${loopId}`, {
            method: 'DELETE'
        });

        showAlert('loopsAlert', 'Loop deleted successfully', 'success');
        await loadLoopsMetadata();
        updateStats();
    } catch (error) {
        if (error.message === 'AUTH_REQUIRED') {
            showAlert('loopsAlert', 'Session expired. Please login again.', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            return;
        }

        console.error('Delete error:', error);
        showAlert('loopsAlert', error.message || 'Failed to delete loop', 'error');
    }
}

/**
 * Update statistics
 */
function updateStats() {
    if (!loopsMetadata || !loopsMetadata.loops) {
        return;
    }

    // Total loop sets (groups of 6)
    const loopSets = new Set();
    loopsMetadata.loops.forEach(loop => {
        const key = loop.rhythmSetId || buildRhythmSetId(loop.rhythmFamily || loop.conditions?.taal || '', loop.rhythmSetNo || loop.setNo || 1);
        loopSets.add(key);
    });

    // Unique rhythm families
    const taals = new Set(loopsMetadata.loops.map(l => normalizeRhythmFamily(l.rhythmFamily || l.conditions?.taal || '')).filter(Boolean));

    // Unique genres
    const genres = new Set(loopsMetadata.loops.map(l => l.conditions.genre));

    // Total files
    const totalFiles = loopsMetadata.loops.length;

    document.getElementById('totalLoops').textContent = loopSets.size;
    document.getElementById('totalTaals').textContent = taals.size;
    document.getElementById('totalGenres').textContent = genres.size;
    document.getElementById('totalFiles').textContent = totalFiles;
}

/**
 * Show alert message
 */
function showAlert(elementId, message, type) {
    window.AdminPage.showAlert(elementId, message, type);
}

function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = String(value ?? '');
    return div.innerHTML;
}
