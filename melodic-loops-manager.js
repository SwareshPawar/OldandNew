/**
 * Melodic Loops Manager - Admin Interface JavaScript
 * Handles melodic pad uploads, metadata management, and display
 */

const API_BASE_URL = window.AppApiBase.resolve();

let melodicFiles = null;
let selectedKey = null;
let isReadOnlyMode = false;
const audioPreviewController = window.AdminPage.createAudioPreviewController({ playingClass: 'playing' });

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!isAuthenticated()) {
        showAuthenticationWarning();
        return;
    }

    await loadMelodicFiles();
    setupEventListeners();
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
                    Please <a href="index.html" style="color: #2c5282; font-weight: bold; text-decoration: underline;">login to the main app</a> first to access Melodic Loops Manager.
                `
            },
            {
                elementId: 'filesAlert',
                type: 'info',
                html: `
                    <strong><i class="fas fa-info-circle"></i> Login Required</strong><br>
                    You can view files but need admin access to upload or delete.
                `
            }
        ],
        disableSelectors: ['.key-selector']
    });
    
    // Still load and display files (read-only mode)
    loadMelodicFiles();
    updateStats();
}

/**
 * Load melodic files from server
 */
async function loadMelodicFiles() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/melodic-loops`);
        if (response.ok) {
            melodicFiles = await response.json();
            displayFiles();
        } else {
            showAlert('filesAlert', 'Failed to load melodic files', 'error');
        }
    } catch (error) {
        console.error('Error loading melodic files:', error);
        showAlert('filesAlert', 'Error loading files: ' + error.message, 'error');
    } finally {
        document.getElementById('loadingIndicator').style.display = 'none';
        document.getElementById('filesContainer').style.display = 'block';
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Key selection buttons
    document.querySelectorAll('.key-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectKey(btn.dataset.key);
        });
    });
}

/**
 * Handle key selection
 */
function selectKey(key) {
    selectedKey = key;
    
    // Update UI
    document.querySelectorAll('.key-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.key === key);
    });
    
    // Show upload section
    const uploadSection = document.getElementById('uploadSection');
    uploadSection.style.display = 'grid';
    
    // Update current file display
    updateCurrentFileDisplay();
    
    // Reset file inputs and buttons
    resetUploadInputs();
}

/**
 * Update current file display for selected key
 */
function updateCurrentFileDisplay() {
    if (!selectedKey || !melodicFiles) return;
    
    const atmosphereFile = melodicFiles.find(f => f.type === 'atmosphere' && f.key === selectedKey);
    const tanpuraFile = melodicFiles.find(f => f.type === 'tanpura' && f.key === selectedKey);
    
    const atmosphereCurrentFile = document.getElementById('atmosphereCurrentFile');
    const tanpuraCurrentFile = document.getElementById('tanpuraCurrentFile');
    
    if (atmosphereFile) {
        atmosphereCurrentFile.textContent = `Current: ${atmosphereFile.filename}`;
        atmosphereCurrentFile.style.display = 'block';
    } else {
        atmosphereCurrentFile.textContent = 'No file uploaded for this key';
        atmosphereCurrentFile.style.display = 'block';
    }
    
    if (tanpuraFile) {
        tanpuraCurrentFile.textContent = `Current: ${tanpuraFile.filename}`;
        tanpuraCurrentFile.style.display = 'block';
    } else {
        tanpuraCurrentFile.textContent = 'No file uploaded for this key';
        tanpuraCurrentFile.style.display = 'block';
    }
}

/**
 * Reset upload inputs and buttons
 */
function resetUploadInputs() {
    ['atmosphere', 'tanpura'].forEach(type => {
        const fileInput = document.getElementById(`${type}File`);
        const uploadBtn = document.getElementById(`upload${type.charAt(0).toUpperCase() + type.slice(1)}Btn`);
        const status = document.getElementById(`${type}Status`);
        
        if (fileInput) fileInput.value = '';
        if (uploadBtn) uploadBtn.disabled = true;
        if (status) status.style.display = 'none';
    });
}

/**
 * Handle file selection
 */
function handleFileSelect(type) {
    const fileInput = document.getElementById(`${type}File`);
    const uploadBtn = document.getElementById(`upload${type.charAt(0).toUpperCase() + type.slice(1)}Btn`);
    
    if (fileInput.files.length > 0 && selectedKey) {
        uploadBtn.disabled = false;
    } else {
        uploadBtn.disabled = true;
        if (!selectedKey) {
            showAlert('uploadAlert', 'Please select a musical key first', 'warning');
        }
    }
}

/**
 * Upload file
 */
async function uploadFile(type) {
    if (isReadOnlyMode) {
        showAlert('uploadAlert', 'Read-only mode. Login required for uploads.', 'warning');
        return;
    }

    const fileInput = document.getElementById(`${type}File`);
    const uploadBtn = document.getElementById(`upload${type.charAt(0).toUpperCase() + type.slice(1)}Btn`);
    const statusDiv = document.getElementById(`${type}Status`);
    
    const file = fileInput.files[0];
    if (!file) return;
    
    if (!selectedKey) {
        showAlert('uploadAlert', 'Please select a musical key first', 'error');
        return;
    }
    
    // Show uploading state
    statusDiv.textContent = 'Uploading...';
    statusDiv.className = 'upload-status uploading';
    statusDiv.style.display = 'block';
    uploadBtn.disabled = true;
    
    try {
        // Create FormData
        const formData = new FormData();
        formData.append('file', file);
        formData.append('key', selectedKey);
        formData.append('type', type);
        
        // Upload to server
        const response = await authFetch(`${API_BASE_URL}/api/melodic-loops/upload`, {
            method: 'POST',
            body: formData
        });

        statusDiv.textContent = '✓ Uploaded successfully';
        statusDiv.className = 'upload-status success';
        fileInput.value = ''; // Clear file input
        uploadBtn.disabled = true;

        // Reload files
        await loadMelodicFiles();
        updateStats();
        updateCurrentFileDisplay();

        showAlert('uploadAlert', `${type.charAt(0).toUpperCase() + type.slice(1)} pad uploaded successfully for key ${selectedKey}`, 'success');
    } catch (error) {
        if (error.message === 'AUTH_REQUIRED') {
            showAlert('uploadAlert', 'Session expired. Please login again.', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            return;
        }

        console.error('Upload error:', error);
        statusDiv.textContent = '✗ Upload failed';
        statusDiv.className = 'upload-status error';
        showAlert('uploadAlert', error.message || 'Upload failed', 'error');
    } finally {
        uploadBtn.disabled = false;
    }
}

/**
 * Display files in grid
 */
function displayFiles() {
    const filesContainer = document.getElementById('filesList');
    
    if (!melodicFiles || melodicFiles.length === 0) {
        filesContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #999; grid-column: 1 / -1;">No melodic files found. Upload your first atmosphere or tanpura pad!</div>';
        return;
    }

    // Group files by key
    const groupedFiles = {};
    melodicFiles.forEach(file => {
        if (!groupedFiles[file.key]) {
            groupedFiles[file.key] = {};
        }
        groupedFiles[file.key][file.type] = file;
    });

    // Sort keys
    const sortedKeys = Object.keys(groupedFiles).sort((a, b) => {
        const keyOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        return keyOrder.indexOf(a) - keyOrder.indexOf(b);
    });

    filesContainer.innerHTML = '';

    sortedKeys.forEach(key => {
        const files = groupedFiles[key];
        
        ['atmosphere', 'tanpura'].forEach(type => {
            if (files[type]) {
                const file = files[type];
                const encodedFileId = encodeURIComponent(String(file.id || ''));
                const encodedFilename = encodeURIComponent(String(file.filename || ''));
                const safeFileNameText = escapeHtml(file.filename || '');
                const safeUploadedDate = escapeHtml(new Date(file.uploadedAt).toLocaleDateString());
                const safeTypeLabel = escapeHtml(type);
                const fileCard = document.createElement('div');
                fileCard.className = 'file-card';
                
                fileCard.innerHTML = `
                    <h4>
                        <i class="fas fa-${type === 'atmosphere' ? 'cloud' : 'music'}"></i> 
                        ${type.charAt(0).toUpperCase() + type.slice(1)} Pad
                    </h4>
                    <div class="file-info">
                        <div class="file-info-item">
                            <i class="fas fa-key"></i>
                            <span class="key-badge">${file.key}</span>
                        </div>
                        <div class="file-info-item">
                            <i class="fas fa-file-alt"></i>
                            <span>${safeFileNameText}</span>
                        </div>
                        <div class="file-info-item">
                            <i class="fas fa-clock"></i>
                            <span>${safeUploadedDate}</span>
                        </div>
                        <div class="file-info-item">
                            <i class="fas fa-tag"></i>
                            <span class="type-badge ${type}">${safeTypeLabel}</span>
                        </div>
                    </div>
                    <div class="file-actions">
                        <button class="play-btn" onclick="playAudio('${API_BASE_URL}/loops/melodies/${type}/${encodedFilename}', this)" title="Play/Pause">
                            <i class="fas fa-play"></i>
                        </button>
                        ${isReadOnlyMode ?
                            '<span style="color:#718096; font-size: 0.85em; margin-left: 8px;">Read-only</span>' :
                            `<input type="file" id="replaceFile-${encodedFileId}" accept="audio/*" style="display: none;" 
                                   onchange="handleReplaceFile(decodeURIComponent('${encodedFileId}'), this)">
                            <button class="btn btn-warning btn-icon" onclick="document.getElementById('replaceFile-${encodedFileId}').click()" title="Replace">
                                <i class="fas fa-sync-alt"></i>
                            </button>
                            <button class="btn btn-danger btn-icon" onclick="deleteFile(decodeURIComponent('${encodedFileId}'))" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>`
                        }
                    </div>
                `;
                
                filesContainer.appendChild(fileCard);
            }
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
function handleReplaceFile(fileId, fileInput) {
    if (isReadOnlyMode) {
        showAlert('filesAlert', 'Read-only mode. Login required for replace/delete actions.', 'warning');
        if (fileInput) fileInput.value = '';
        return;
    }

    const file = fileInput.files[0];
    if (!file) return;
    
    if (!confirm(`Replace this melodic file with "${file.name}"? The original file will be permanently deleted.`)) {
        fileInput.value = ''; // Clear the selection
        return;
    }
    
    replaceMelodicFile(fileId, file);
}

/**
 * Replace melodic file
 */
async function replaceMelodicFile(fileId, file) {
    if (isReadOnlyMode) {
        showAlert('filesAlert', 'Read-only mode. Login required for replace/delete actions.', 'warning');
        return;
    }

    try {
        // Show loading state
        showAlert('filesAlert', 'Replacing melodic file...', 'info');
        
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await authFetch(`${API_BASE_URL}/api/melodic-loops/${fileId}/replace`, {
            method: 'PUT',
            body: formData
        });

        const result = await response.json();
        showAlert('filesAlert', `${result.message}: ${result.filename}`, 'success');
        await loadMelodicFiles();
        updateStats();
        updateCurrentFileDisplay();
    } catch (error) {
        if (error.message === 'AUTH_REQUIRED') {
            showAlert('filesAlert', 'Session expired. Please login again.', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            return;
        }

        console.error('Replace error:', error);
        showAlert('filesAlert', error.message || 'Failed to replace melodic file', 'error');
    }
}

/**
 * Delete file
 */
async function deleteFile(fileId) {
    if (isReadOnlyMode) {
        showAlert('filesAlert', 'Read-only mode. Login required for replace/delete actions.', 'warning');
        return;
    }

    if (!confirm('Are you sure you want to delete this melodic file? This action cannot be undone.')) {
        return;
    }

    try {
        await authFetch(`${API_BASE_URL}/api/melodic-loops/${fileId}`, {
            method: 'DELETE'
        });

        showAlert('filesAlert', 'File deleted successfully', 'success');
        await loadMelodicFiles();
        updateStats();
        updateCurrentFileDisplay();
    } catch (error) {
        if (error.message === 'AUTH_REQUIRED') {
            showAlert('filesAlert', 'Session expired. Please login again.', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            return;
        }

        console.error('Delete error:', error);
        showAlert('filesAlert', error.message || 'Failed to delete file', 'error');
    }
}

/**
 * Update statistics
 */
function updateStats() {
    if (!melodicFiles) {
        return;
    }

    const atmosphereCount = melodicFiles.filter(f => f.type === 'atmosphere').length;
    const tanpuraCount = melodicFiles.filter(f => f.type === 'tanpura').length;
    const uniqueKeys = new Set(melodicFiles.map(f => f.key)).size;
    const totalFiles = melodicFiles.length;

    document.getElementById('totalAtmosphere').textContent = atmosphereCount;
    document.getElementById('totalTanpura').textContent = tanpuraCount;
    document.getElementById('totalKeys').textContent = uniqueKeys;
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