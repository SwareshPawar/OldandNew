// Loop & Rhythm Set Manager
function resolveApiBaseUrl() {
    const { protocol, hostname, port, origin } = window.location;

    // When opened from a local static server, Live Server, or file preview,
    // always target the backend server that serves the API.
    if (protocol === 'file:' || hostname === 'localhost' || hostname === '127.0.0.1') {
        const localHost = hostname || 'localhost';
        return port === '3001' ? origin : `http://${localHost}:3001`;
    }

    return origin;
}

const API_BASE_URL = resolveApiBaseUrl();

let rhythmSets = [];
let selectedRhythmSet = null;
let loopFiles = {
    loop1: null,
    loop2: null,
    loop3: null,
    fill1: null,
    fill2: null,
    fill3: null
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadRhythmSets();
    setupRhythmFamilyListener();
});

async function authFetch(url, options = {}) {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        alert('Please login first');
        window.location.href = '/index.html';
        throw new Error('Not authenticated');
    }

    options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };

    const response = await fetch(url, options);
    if (response.status === 401) {
        localStorage.removeItem('jwtToken');
        alert('Session expired. Please login again.');
        window.location.href = '/index.html';
        throw new Error('Session expired');
    }

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
                // Keep the default status-based message.
            }
        }

        throw new Error(errorMessage);
    }

    return response;
}

async function loadRhythmSets() {
    try {
        const response = await authFetch(`${API_BASE_URL}/api/rhythm-sets`);
        rhythmSets = await response.json();
        console.log('Loaded rhythm sets:', rhythmSets.length);
        console.log('Loop manager API base URL:', API_BASE_URL);
        // Debug: Show first set's data structure
        if (rhythmSets.length > 0) {
            console.log('Sample rhythm set:', rhythmSets[0]);
            console.log('availableFiles:', rhythmSets[0].availableFiles);
            console.log('files mapping:', rhythmSets[0].files);
            console.log('conditionsHint:', rhythmSets[0].conditionsHint);
        }
        populateRhythmFamilyList();
        renderRhythmSetsTable();
    } catch (error) {
        showAlert('Error loading rhythm sets: ' + error.message, 'error');
    }
}

function populateRhythmFamilyList() {
    const selectElement = document.getElementById('rhythmFamilySelect');
    if (!selectElement) return;
    
    // Get unique rhythm families
    const families = new Set();
    rhythmSets.forEach(set => {
        if (set.rhythmFamily) {
            families.add(set.rhythmFamily);
        }
    });
    
    // Sort alphabetically
    const sortedFamilies = Array.from(families).sort();
    
    // Clear existing options (keep first two: empty and custom)
    while (selectElement.options.length > 2) {
        selectElement.remove(2);
    }
    
    // Add existing families
    sortedFamilies.forEach(family => {
        const option = document.createElement('option');
        option.value = family;
        option.textContent = family;
        selectElement.appendChild(option);
    });
    
    console.log(`Populated ${sortedFamilies.length} rhythm families:`, sortedFamilies);
}

function handleRhythmFamilySelect() {
    const selectElement = document.getElementById('rhythmFamilySelect');
    const inputElement = document.getElementById('rhythmFamily');
    const selectedValue = selectElement.value;
    
    if (selectedValue === '__custom__') {
        // Show input field for custom entry
        selectElement.style.display = 'none';
        inputElement.style.display = 'block';
        inputElement.value = '';
        inputElement.focus();
        
        // Clear set number and preview
        document.getElementById('rhythmSetNo').innerHTML = '<option value="">Select set number...</option>';
        document.getElementById('rhythmSetPreview').style.display = 'none';
        document.getElementById('existingLoopsInfo').style.display = 'none';
    } else if (selectedValue) {
        // Use selected family
        inputElement.value = selectedValue;
        updateAvailableSetNumbers();
        updateRhythmSetPreview();
        showExistingLoops();
    } else {
        // Empty selection
        inputElement.value = '';
        document.getElementById('rhythmSetNo').innerHTML = '<option value="">Select set number...</option>';
        document.getElementById('rhythmSetPreview').style.display = 'none';
        document.getElementById('existingLoopsInfo').style.display = 'none';
    }
}

function setupRhythmFamilyListener() {
    const familyInput = document.getElementById('rhythmFamily');
    
    familyInput.addEventListener('input', () => {
        updateAvailableSetNumbers();
        updateRhythmSetPreview();
        showExistingLoops();
    });
    
    // Add button to go back to select
    familyInput.addEventListener('blur', (e) => {
        // Don't hide if clicking on set number dropdown
        setTimeout(() => {
            if (familyInput.value && familyInput.style.display === 'block') {
                // Keep visible if user entered a value
            }
        }, 200);
    });
    
    // Add escape key handler to go back to select
    familyInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const selectElement = document.getElementById('rhythmFamilySelect');
            familyInput.style.display = 'none';
            selectElement.style.display = 'block';
            selectElement.value = '';
        }
    });

    document.getElementById('rhythmSetNo').addEventListener('change', () => {
        updateRhythmSetPreview();
    });
}

function normalizeRhythmFamily(family) {
    return family.toLowerCase().trim().replace(/\s+/g, '_');
}

function buildRhythmSetId(family, setNo) {
    const normalized = normalizeRhythmFamily(family);
    if (!normalized || !setNo) return null;
    return `${normalized}_${setNo}`;
}

function updateAvailableSetNumbers() {
    const family = normalizeRhythmFamily(document.getElementById('rhythmFamily').value);
    const select = document.getElementById('rhythmSetNo');
    
    select.innerHTML = '<option value="">Select set number...</option>';

    if (!family) {
        return;
    }

    // Find existing set numbers for this family
    const existingSetNos = rhythmSets
        .filter(set => normalizeRhythmFamily(set.rhythmFamily) === family)
        .map(set => set.rhythmSetNo)
        .sort((a, b) => a - b);

    const maxSetNo = existingSetNos.length > 0 ? Math.max(...existingSetNos) : 0;

    // Generate available numbers (1 to maxSetNo + 1, excluding existing)
    const availableNumbers = [];
    for (let i = 1; i <= maxSetNo + 1; i++) {
        if (!existingSetNos.includes(i)) {
            availableNumbers.push(i);
        }
    }

    // If all numbers are taken, add next number
    if (availableNumbers.length === 0) {
        availableNumbers.push(maxSetNo + 1);
    }

    // Add available numbers
    if (availableNumbers.length > 0) {
        const optgroup1 = document.createElement('optgroup');
        optgroup1.label = 'Available Set Numbers';
        availableNumbers.forEach(num => {
            const option = document.createElement('option');
            option.value = num;
            option.textContent = `Set ${num} (new)`;
            optgroup1.appendChild(option);
        });
        select.appendChild(optgroup1);
    }

    // Add existing numbers (disabled for reference)
    if (existingSetNos.length > 0) {
        const optgroup2 = document.createElement('optgroup');
        optgroup2.label = 'Existing Sets (reference only)';
        existingSetNos.forEach(num => {
            const option = document.createElement('option');
            option.value = num;
            option.textContent = `Set ${num} (already exists)`;
            option.disabled = true;
            optgroup2.appendChild(option);
        });
        select.appendChild(optgroup2);
    }
}

function updateRhythmSetPreview() {
    const family = document.getElementById('rhythmFamily').value.trim();
    const setNo = document.getElementById('rhythmSetNo').value;
    const previewDiv = document.getElementById('rhythmSetPreview');
    const previewId = document.getElementById('previewRhythmSetId');

    if (family && setNo) {
        const rhythmSetId = buildRhythmSetId(family, setNo);
        previewId.textContent = rhythmSetId;
        previewDiv.style.display = 'block';
    } else {
        previewDiv.style.display = 'none';
    }
}

function showExistingLoops() {
    const family = normalizeRhythmFamily(document.getElementById('rhythmFamily').value);
    const infoDiv = document.getElementById('existingLoopsInfo');
    const listDiv = document.getElementById('existingLoopsList');

    if (!family) {
        infoDiv.style.display = 'none';
        return;
    }

    const familySets = rhythmSets
        .filter(set => normalizeRhythmFamily(set.rhythmFamily) === family)
        .sort((a, b) => a.rhythmSetNo - b.rhythmSetNo);

    if (familySets.length === 0) {
        infoDiv.style.display = 'none';
        return;
    }

    const setsList = familySets.map(set => {
        const loopCount = (set.availableFiles || []).length;
        return `${set.rhythmSetId} (${loopCount}/6 loops)`;
    }).join(', ');

    listDiv.textContent = setsList;
    infoDiv.style.display = 'block';
}

async function createRhythmSet() {
    const family = document.getElementById('rhythmFamily').value.trim();
    const setNo = parseInt(document.getElementById('rhythmSetNo').value, 10);
    const status = document.getElementById('status').value;
    const notes = document.getElementById('notes').value.trim();

    // Validation
    if (!family) {
        showAlert('Please enter a rhythm family', 'error');
        return;
    }

    if (!setNo || setNo <= 0) {
        showAlert('Please select a set number', 'error');
        return;
    }

    const rhythmSetId = buildRhythmSetId(family, setNo);
    
    // Check if already exists
    if (rhythmSets.some(set => set.rhythmSetId === rhythmSetId)) {
        showAlert('This rhythm set already exists! Please choose a different set number.', 'error');
        return;
    }

    try {
        const response = await authFetch(`${API_BASE_URL}/api/rhythm-sets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                rhythmFamily: normalizeRhythmFamily(family),
                rhythmSetNo: setNo,
                status,
                notes
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'Failed to create rhythm set' }));
            throw new Error(err.error || 'Failed to create rhythm set');
        }

        showAlert(`Rhythm set "${rhythmSetId}" created successfully!`, 'success');
        
        // Reset form
        const selectElement = document.getElementById('rhythmFamilySelect');
        const inputElement = document.getElementById('rhythmFamily');
        
        // Show select, hide input
        selectElement.style.display = 'block';
        inputElement.style.display = 'none';
        selectElement.value = '';
        inputElement.value = '';
        
        document.getElementById('rhythmSetNo').innerHTML = '<option value="">Select set number...</option>';
        document.getElementById('notes').value = '';
        document.getElementById('rhythmSetPreview').style.display = 'none';
        document.getElementById('existingLoopsInfo').style.display = 'none';

        // Reload rhythm sets
        await loadRhythmSets();

    } catch (error) {
        showAlert('Error: ' + error.message, 'error');
    }
}

function renderRhythmSetsTable() {
    const tbody = document.getElementById('rhythmSetsTableBody');
    
    if (rhythmSets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No rhythm sets found</td></tr>';
        return;
    }

    rhythmSets.sort((a, b) => {
        if (a.rhythmFamily !== b.rhythmFamily) {
            return a.rhythmFamily.localeCompare(b.rhythmFamily);
        }
        return a.rhythmSetNo - b.rhythmSetNo;
    });

    tbody.innerHTML = '';
    
    rhythmSets.forEach((set, index) => {
        const loopCount = (set.availableFiles || []).length;
        const loopBadge = loopCount === 6 
            ? `<span class="badge badge-success">${loopCount}/6</span>`
            : loopCount > 0
            ? `<span class="badge badge-warning">${loopCount}/6</span>`
            : `<span class="badge badge-danger">0/6</span>`;

        const statusBadge = set.status === 'active'
            ? '<span class="badge badge-success">Active</span>'
            : '<span class="badge badge-info">Draft</span>';

        const isSelected = selectedRhythmSet?.rhythmSetId === set.rhythmSetId;

        // Main row
        const mainRow = document.createElement('tr');
        mainRow.className = 'rhythm-set-row';
        mainRow.id = `row-${index}`;
        mainRow.style = isSelected ? 'background-color: #3a3a5a;' : '';
        mainRow.innerHTML = `
            <td style="cursor: pointer;" data-expand-trigger="${index}">
                <i class="fas fa-chevron-right expand-icon" id="icon-${index}"></i>
            </td>
            <td><strong>${escapeHtml(set.rhythmSetId)}</strong></td>
            <td>${escapeHtml(set.rhythmFamily)}</td>
            <td>${set.rhythmSetNo}</td>
            <td>${loopBadge}</td>
            <td>${statusBadge}</td>
            <td>
                <button class="btn btn-primary btn-mini" onclick="event.stopPropagation(); editRhythmSet('${escapeHtml(set.rhythmSetId)}', '${escapeHtml(set.rhythmFamily)}', ${set.rhythmSetNo})" style="margin-right: 5px;">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-danger btn-mini" onclick="event.stopPropagation(); deleteRhythmSet('${escapeHtml(set.rhythmSetId)}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        
        // Details row (expandable)
        const detailsRow = document.createElement('tr');
        detailsRow.className = 'loop-details-row';
        detailsRow.id = `details-${index}`;
        detailsRow.innerHTML = `
            <td colspan="7" class="loop-details-cell">
                ${renderLoopSlots(set)}
            </td>
        `;

        // Click handler ONLY for the chevron icon cell
        const expandCell = mainRow.querySelector('[data-expand-trigger]');
        expandCell.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleExpandRow(index);
        });

        tbody.appendChild(mainRow);
        tbody.appendChild(detailsRow);
    });
}

function renderLoopSlots(rhythmSet) {
    const loopTypes = ['loop1', 'loop2', 'loop3', 'fill1', 'fill2', 'fill3'];
    const availableFiles = rhythmSet.availableFiles || [];
    const files = rhythmSet.files || {};
    
    let html = '<div class="loop-grid">';
    
    loopTypes.forEach(loopType => {
        // Check both with and without .mp3 extension (API returns without extension)
        const hasLoop = availableFiles.includes(loopType) || availableFiles.includes(loopType + '.mp3');
        const filename = files[loopType] || '';
        const slotClass = hasLoop ? 'has-loop' : 'empty';
        const loopName = loopType.replace(/(\d)/, ' $1');
        const loopIcon = loopType.includes('loop') ? 'music' : 'drum';
        const slotId = `loop-slot-${rhythmSet.rhythmSetId}-${loopType}`;
        
        html += `
            <div class="loop-slot ${slotClass}" id="${slotId}" 
                 ondragover="handleDragOver(event)" 
                 ondragleave="handleDragLeave(event)"
                 ondrop="handleDrop(event, '${escapeHtml(rhythmSet.rhythmSetId)}', '${loopType}')">
                <div class="loop-slot-header">
                    <span class="loop-slot-title">
                        <i class="fas fa-${loopIcon}"></i> ${loopName.toUpperCase()}
                    </span>
                    ${hasLoop ? 
                        `<span class="badge badge-success" style="font-size: 10px;">✓</span>` : 
                        `<span class="badge badge-danger" style="font-size: 10px;">Empty</span>`
                    }
                </div>
                <div class="drag-drop-hint" style="font-size: 11px; color: #888; margin: 5px 0;">
                    <i class="fas fa-upload"></i> Drag & drop or click
                </div>
                <div class="loop-slot-actions">
                    ${hasLoop ? `
                        <button class="btn btn-primary btn-mini" onclick="playLoop('${escapeHtml(rhythmSet.rhythmSetId)}', '${loopType}', '${escapeHtml(filename)}')">
                            <i class="fas fa-play"></i> Play
                        </button>
                        <button class="btn btn-danger btn-mini" onclick="removeLoop('${escapeHtml(rhythmSet.rhythmSetId)}', '${loopType}')">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    ` : ''}
                    <button class="btn btn-success btn-mini" onclick="uploadSingleLoop('${escapeHtml(rhythmSet.rhythmSetId)}', '${loopType}')">
                        <i class="fas fa-upload"></i> ${hasLoop ? 'Replace' : 'Upload'}
                    </button>
                </div>
                <div class="loop-slot-info">
                    ${hasLoop ? 
                        `<i class="fas fa-check-circle" style="color: #27ae60;"></i> Loop available${rhythmSet.originalFilenames && rhythmSet.originalFilenames[loopType] ? ` <span style="color: #7f8c8d; font-size: 11px;">(Original: ${escapeHtml(rhythmSet.originalFilenames[loopType])})</span>` : ''}` : 
                        `<i class="fas fa-exclamation-circle" style="color: #e74c3c;"></i> No loop uploaded`
                    }
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    // Add "Test in Loop Player" button if rhythm set has loops
    if (availableFiles.length > 0) {
        html += `
            <div style="margin-top: 15px; text-align: center;">
                <button class="btn btn-primary" onclick="openLoopPlayer('${escapeHtml(rhythmSet.rhythmSetId)}')" style="padding: 12px 30px; font-size: 14px;">
                    <i class="fas fa-play-circle"></i> Test in Loop Player (${availableFiles.length}/6 loops)
                </button>
            </div>
        `;
    }
    
    return html;
}

function toggleExpandRow(index) {
    const icon = document.getElementById(`icon-${index}`);
    const row = document.getElementById(`row-${index}`);
    const detailsRow = document.getElementById(`details-${index}`);
    
    if (detailsRow.classList.contains('show')) {
        // Collapse
        detailsRow.classList.remove('show');
        icon.classList.remove('expanded');
        row.classList.remove('expanded');
    } else {
        // Expand
        detailsRow.classList.add('show');
        icon.classList.add('expanded');
        row.classList.add('expanded');
    }
}

async function playLoop(rhythmSetId, loopType, filename) {
    if (!filename) {
        showAlert('Loop file not found in metadata', 'error');
        console.error('playLoop called with empty filename:', { rhythmSetId, loopType, filename });
        return;
    }
    
    // Add cache-buster so freshly uploaded/replaced files are always fetched fresh
    const loopUrl = `${API_BASE_URL}/loops/${filename}?t=${Date.now()}`;
    const player = document.getElementById('loopPlayer');
    
    console.log('Playing loop:', { rhythmSetId, loopType, filename, loopUrl });
    
    try {
        player.src = loopUrl;
        // Explicitly reload so the audio element picks up the new src before playback
        player.load();
        await player.play();
        showAlert(`Playing ${loopType}...`, 'success');
    } catch (error) {
        console.error('Playback error:', error);
        showAlert(`Failed to play loop: ${error.message}`, 'error');
    }
}

async function uploadSingleLoop(rhythmSetId, loopType) {
    // Find the rhythm set to get metadata
    const rhythmSet = rhythmSets.find(s => s.rhythmSetId === rhythmSetId);
    if (!rhythmSet) {
        showAlert('Rhythm set not found', 'error');
        return;
    }
    
    // Get conditions from the rhythm set's existing loops
    const conditionsHint = rhythmSet.conditionsHint || {};
    
    // Create a file input - accept both .mp3 and .wav
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.mp3,.wav';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const fileName = file.name.toLowerCase();
        if (!fileName.endsWith('.mp3') && !fileName.endsWith('.wav')) {
            showAlert('Please select an MP3 or WAV file', 'error');
            return;
        }
        
        try {
            // Parse rhythmSetId to get rhythmFamily and rhythmSetNo
            // Format: rhythmFamily_rhythmSetNo (e.g., "dadra_1")
            const parts = rhythmSetId.split('_');
            const rhythmFamily = parts.slice(0, -1).join('_'); // Everything except last part
            const rhythmSetNo = parts[parts.length - 1]; // Last part
            
            // Parse type and number from loopType
            const type = loopType.includes('loop') ? 'loop' : 'fill';
            const number = parseInt(loopType.match(/\d+/)[0], 10);
            
            const formData = new FormData();
            formData.append('file', file);
            formData.append('rhythmFamily', rhythmFamily);
            formData.append('rhythmSetNo', rhythmSetNo);
            formData.append('taal', conditionsHint.taal || rhythmFamily);
            formData.append('type', type);
            formData.append('number', number);
            
            // Use conditionsHint from existing loops in the set, or defaults
            formData.append('timeSignature', conditionsHint.timeSignature || '4/4');
            formData.append('tempo', conditionsHint.tempo || 'medium');
            formData.append('genre', conditionsHint.genre || 'acoustic');
            formData.append('description', `${loopType} for ${rhythmSetId}`);
            
            showAlert(`Uploading ${loopType}...`, 'success');
            
            const response = await authFetch(`${API_BASE_URL}/api/loops/upload-single`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `Failed to upload ${loopType}`);
            }
            
            const result = await response.json();
            showAlert(`${loopType} uploaded successfully!`, 'success');
            
            // Signal loop player to bypass cache and re-fetch files (loop file was replaced on disk)
            localStorage.setItem('loopFilesReplacedAt', Date.now().toString());
            
            // Store the current rhythm set ID to re-expand after reload
            const currentRhythmSetId = rhythmSetId;
            
            // Reload rhythm sets to update the UI
            await loadRhythmSets();

            // If the loop player panel is currently showing this same rhythm set,
            // force-reload its audio buffers so the new sample is picked up immediately
            // without requiring a full page refresh.
            if (rhythmManagerPlayer && currentPlayerRhythmSet &&
                currentPlayerRhythmSet.rhythmSetId === currentRhythmSetId) {
                const updatedSet = rhythmSets.find(s => s.rhythmSetId === currentRhythmSetId);
                if (updatedSet) {
                    currentPlayerRhythmSet = updatedSet;
                    await loadRhythmSetIntoPlayer(updatedSet, true);
                    createSimplePlayerUI(updatedSet);
                }
            }
            
            // Find and re-expand the row
            const rhythmSetIndex = rhythmSets.findIndex(s => s.rhythmSetId === currentRhythmSetId);
            if (rhythmSetIndex !== -1) {
                setTimeout(() => {
                    toggleExpandRow(rhythmSetIndex);
                }, 100);
            }
            
        } catch (error) {
            showAlert(`Error: ${error.message}`, 'error');
        }
    };
    
    input.click();
}

function previewLoops(rhythmSetId) {
    const set = rhythmSets.find(s => s.rhythmSetId === rhythmSetId);
    if (!set || !set.availableFiles || set.availableFiles.length === 0) {
        showAlert('No loops available for this rhythm set', 'error');
        return;
    }

    // Show available loops
    const loopsList = set.availableFiles.join(', ');
    alert(`Available loops for ${rhythmSetId}:\n\n${loopsList}\n\nNote: Full preview player coming soon!`);
}

async function deleteRhythmSet(rhythmSetId) {
    if (!confirm(`Are you sure you want to delete rhythm set "${rhythmSetId}"?\n\nThis will permanently delete:\n- The rhythm set from the database\n- All associated loop files (loop1-3, fill1-3)\n\nThis action cannot be undone!`)) {
        return;
    }

    try {
        const response = await authFetch(`${API_BASE_URL}/api/rhythm-sets/${rhythmSetId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'Failed to delete rhythm set' }));
            console.error('Delete failed:', err);
            
            // If songs are mapped, offer force delete option
            if (err.mappedSongsCount > 0) {
                const songsList = err.mappedSongs 
                    ? err.mappedSongs.map(s => `  • ${s.title} (ID: ${s.id})`).join('\n')
                    : '';
                
                const forceDelete = confirm(
                    `Cannot delete rhythm set "${rhythmSetId}".\n\n` +
                    `${err.mappedSongsCount} song(s) are currently mapped to it:\n${songsList}\n\n` +
                    `Would you like to FORCE DELETE?\n\n` +
                    `⚠️ This will:\n` +
                    `- Unmap all songs (they will lose their rhythm set assignment)\n` +
                    `- Delete the rhythm set from database\n` +
                    `- Delete all loop files\n\n` +
                    `This action cannot be undone!`
                );
                
                if (forceDelete) {
                    await forceDeleteRhythmSet(rhythmSetId);
                }
                return;
            }
            
            throw new Error(err.error || 'Failed to delete rhythm set');
        }

        const result = await response.json();
        showAlert(result.message || `Rhythm set "${rhythmSetId}" deleted successfully`, 'success');
        
        await loadRhythmSets();

    } catch (error) {
        console.error('Delete error:', error);
        showAlert('Error: ' + error.message, 'error');
    }
}

async function forceDeleteRhythmSet(rhythmSetId) {
    try {
        showAlert('Force deleting rhythm set...', 'success');
        
        const response = await authFetch(`${API_BASE_URL}/api/rhythm-sets/${rhythmSetId}/force`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'Failed to force delete rhythm set' }));
            throw new Error(err.error || 'Failed to force delete rhythm set');
        }

        const result = await response.json();
        showAlert(result.message || `Rhythm set "${rhythmSetId}" force deleted successfully`, 'success');
        
        await loadRhythmSets();

    } catch (error) {
        console.error('Force delete error:', error);
        showAlert('Error: ' + error.message, 'error');
    }
}

async function removeLoop(rhythmSetId, loopType) {
    if (!confirm(`Are you sure you want to remove ${loopType} from rhythm set "${rhythmSetId}"?\n\nThis will permanently delete the loop file.\n\nThis action cannot be undone!`)) {
        return;
    }

    try {
        const response = await authFetch(`${API_BASE_URL}/api/rhythm-sets/${rhythmSetId}/loops/${loopType}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'Failed to remove loop' }));
            throw new Error(err.error || 'Failed to remove loop');
        }

        const result = await response.json();
        showAlert(result.message || `${loopType} removed successfully`, 'success');
        
        // Store the current rhythm set ID to re-expand after reload
        const currentRhythmSetId = rhythmSetId;
        
        // Reload rhythm sets to update the UI
        await loadRhythmSets();
        
        // Find and re-expand the row
        const rhythmSetIndex = rhythmSets.findIndex(s => s.rhythmSetId === currentRhythmSetId);
        if (rhythmSetIndex !== -1) {
            setTimeout(() => {
                toggleExpandRow(rhythmSetIndex);
            }, 100);
        }

    } catch (error) {
        showAlert('Error: ' + error.message, 'error');
    }
}

// ============================================================================
// DRAG AND DROP HANDLERS
// ============================================================================

function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.style.borderColor = '#9b59b6';
    event.currentTarget.style.backgroundColor = '#3a2a4a';
}

function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.style.borderColor = '';
    event.currentTarget.style.backgroundColor = '';
}

async function handleDrop(event, rhythmSetId, loopType) {
    event.preventDefault();
    event.stopPropagation();
    
    // Reset styling
    event.currentTarget.style.borderColor = '';
    event.currentTarget.style.backgroundColor = '';
    
    const files = event.dataTransfer.files;
    if (!files || files.length === 0) {
        showAlert('No file dropped', 'error');
        return;
    }
    
    const file = files[0];
    const fileName = file.name.toLowerCase();
    
    // Validate file type
    if (!fileName.endsWith('.mp3') && !fileName.endsWith('.wav')) {
        showAlert('Please drop an MP3 or WAV file', 'error');
        return;
    }
    
    // Upload the file
    await uploadFileForLoop(rhythmSetId, loopType, file);
}

async function uploadFileForLoop(rhythmSetId, loopType, file) {
    // Find the rhythm set to get metadata
    const rhythmSet = rhythmSets.find(s => s.rhythmSetId === rhythmSetId);
    if (!rhythmSet) {
        showAlert('Rhythm set not found', 'error');
        return;
    }
    
    const conditionsHint = rhythmSet.conditionsHint || {};
    
    try {
        // Parse rhythmSetId to get rhythmFamily and rhythmSetNo
        const parts = rhythmSetId.split('_');
        const rhythmFamily = parts.slice(0, -1).join('_');
        const rhythmSetNo = parts[parts.length - 1];
        
        // Parse type and number from loopType
        const type = loopType.includes('loop') ? 'loop' : 'fill';
        const number = parseInt(loopType.match(/\d+/)[0], 10);
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('rhythmFamily', rhythmFamily);
        formData.append('rhythmSetNo', rhythmSetNo);
        formData.append('taal', conditionsHint.taal || rhythmFamily);
        formData.append('type', type);
        formData.append('number', number);
        formData.append('timeSignature', conditionsHint.timeSignature || '4/4');
        formData.append('tempo', conditionsHint.tempo || 'medium');
        formData.append('genre', conditionsHint.genre || 'acoustic');
        formData.append('description', `${loopType} for ${rhythmSetId}`);
        
        showAlert(`Uploading ${file.name}...`, 'success');
        
        const response = await authFetch(`${API_BASE_URL}/api/loops/upload-single`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `Failed to upload ${loopType}`);
        }
        
        showAlert(`${loopType} uploaded successfully!`, 'success');
        
        // Signal loop player to bypass cache and re-fetch files (loop file was replaced on disk)
        localStorage.setItem('loopFilesReplacedAt', Date.now().toString());
        
        // Store the current rhythm set ID to re-expand after reload
        const currentRhythmSetId = rhythmSetId;
        
        // Reload rhythm sets to update the UI
        await loadRhythmSets();

        // If the loop player panel is currently showing this same rhythm set,
        // force-reload its audio buffers so the new sample is picked up immediately
        // without requiring a full page refresh.
        if (rhythmManagerPlayer && currentPlayerRhythmSet &&
            currentPlayerRhythmSet.rhythmSetId === currentRhythmSetId) {
            const updatedSet = rhythmSets.find(s => s.rhythmSetId === currentRhythmSetId);
            if (updatedSet) {
                currentPlayerRhythmSet = updatedSet;
                await loadRhythmSetIntoPlayer(updatedSet, true);
                createSimplePlayerUI(updatedSet);
            }
        }
        
        // Find and re-expand the row
        const rhythmSetIndex = rhythmSets.findIndex(s => s.rhythmSetId === currentRhythmSetId);
        if (rhythmSetIndex !== -1) {
            setTimeout(() => {
                toggleExpandRow(rhythmSetIndex);
            }, 100);
        }
        
    } catch (error) {
        showAlert(`Error: ${error.message}`, 'error');
    }
}

function showAlert(message, type) {
    const alertBox = document.getElementById('alertBox');
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type}`;
    alertBox.style.display = 'block';
    
    setTimeout(() => {
        alertBox.style.display = 'none';
    }, 5000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========================================
// Loop Player Integration
// ========================================

let rhythmManagerPlayer = null;
let currentPlayerRhythmSet = null;

/**
 * Open loop player for a specific rhythm set
 */
async function openLoopPlayer(rhythmSetId) {
    const rhythmSet = rhythmSets.find(s => s.rhythmSetId === rhythmSetId);
    if (!rhythmSet) {
        showAlert('Rhythm set not found', 'error');
        return;
    }

    // Check if rhythm set has any loops
    const loopCount = (rhythmSet.availableFiles || []).length;
    if (loopCount === 0) {
        showAlert('No loops available for this rhythm set. Please upload loops first.', 'warning');
        return;
    }

    currentPlayerRhythmSet = rhythmSet;

    // Show the player panel
    const playerPanel = document.getElementById('loopPlayerPanel');
    playerPanel.style.display = 'block';
    playerPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });

    try {
        // Create or reuse player instance
        if (!rhythmManagerPlayer) {
            rhythmManagerPlayer = new LoopPlayerPad();
        }

        // Force-reload if loop files were replaced on disk since the player last loaded them.
        // This ensures freshly uploaded samples are always fetched, not served from cache.
        const lastReplace = parseInt(localStorage.getItem('loopFilesReplacedAt') || '0', 10);
        const lastLoad = rhythmManagerPlayer._lastLoadedAt || 0;
        const forceReload = lastReplace > lastLoad;

        // Load loops for this rhythm set
        await loadRhythmSetIntoPlayer(rhythmSet, forceReload);
        
        // Create simple UI for the player
        createSimplePlayerUI(rhythmSet);
        
        showAlert(`Loop player loaded for: ${rhythmSetId}`, 'success');
    } catch (error) {
        console.error('Error opening loop player:', error);
        showAlert('Error opening loop player: ' + error.message, 'error');
    }
}

/**
 * Load a rhythm set's loops into the player
 * @param {object} rhythmSet
 * @param {boolean} forceReload - When true, bypasses audio buffer cache and browser HTTP cache.
 *   Pass true after an upload so freshly replaced files are picked up immediately.
 */
async function loadRhythmSetIntoPlayer(rhythmSet, forceReload = false) {
    const rhythmSetId = rhythmSet.rhythmSetId;
    const files = rhythmSet.files || {};
    
    // Build loop map with actual filenames.
    // When force-reloading after an upload, add a cache-buster to each URL so the
    // browser fetches fresh bytes even if the filename on disk is unchanged.
    const loopMap = {};
    const loopTypes = ['loop1', 'loop2', 'loop3', 'fill1', 'fill2', 'fill3'];
    const cacheBuster = forceReload ? `?t=${Date.now()}` : '';
    
    loopTypes.forEach(loopType => {
        const filename = files[loopType];
        if (filename) {
            loopMap[loopType] = `${API_BASE_URL}/loops/${filename}${cacheBuster}`;
        }
    });

    console.log('Loading rhythm set into player:', rhythmSetId, forceReload ? '(force reload)' : '', loopMap);

    // Load loops into player
    try {
        await rhythmManagerPlayer.loadLoops(loopMap, rhythmSetId, forceReload);
        // Track when we last loaded so openLoopPlayer can decide whether to force-reload
        rhythmManagerPlayer._lastLoadedAt = Date.now();
        showAlert(`Loaded ${Object.keys(loopMap).length} loops`, 'success');
    } catch (error) {
        console.error('Error loading loops into player:', error);
        showAlert('Error loading loops: ' + error.message, 'error');
    }
}

/**
 * Create simple player UI
 */
function createSimplePlayerUI(rhythmSet) {
    const container = document.getElementById('loopPlayerContainer');
    const files = rhythmSet.files || {};
    
    let html = `
        <div style="background: #2c2c2c; padding: 20px; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #9b59b6;">
                <i class="fas fa-drum"></i> ${escapeHtml(rhythmSet.rhythmSetId)}
            </h3>
            
            <!-- Loop Pads -->
            <div style="margin-bottom: 20px;">
                <h4 style="color: #3498db; margin-bottom: 10px;">
                    <i class="fas fa-music"></i> Main Loops
                </h4>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
    `;
    
    ['loop1', 'loop2', 'loop3'].forEach(loopType => {
        const hasLoop = files[loopType];
        html += `
            <button 
                class="btn ${hasLoop ? 'btn-primary' : 'btn-secondary'}" 
                ${hasLoop ? `onclick="playLoopPad('${loopType}')"` : 'disabled'}
                style="padding: 15px; font-size: 16px;">
                <i class="fas fa-play-circle"></i><br>
                ${loopType.toUpperCase()}
            </button>
        `;
    });
    
    html += `
                </div>
            </div>
            
            <!-- Fill Pads -->
            <div style="margin-bottom: 20px;">
                <h4 style="color: #e67e22; margin-bottom: 10px;">
                    <i class="fas fa-drum"></i> Fills
                </h4>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
    `;
    
    ['fill1', 'fill2', 'fill3'].forEach(fillType => {
        const hasFill = files[fillType];
        html += `
            <button 
                class="btn ${hasFill ? 'btn-warning' : 'btn-secondary'}" 
                ${hasFill ? `onclick="playLoopPad('${fillType}')"` : 'disabled'}
                style="padding: 15px; font-size: 16px;">
                <i class="fas fa-bolt"></i><br>
                ${fillType.toUpperCase()}
            </button>
        `;
    });
    
    html += `
                </div>
            </div>
            
            <!-- Controls -->
            <div style="margin-bottom: 20px;">
                <h4 style="color: #27ae60; margin-bottom: 10px;">
                    <i class="fas fa-sliders-h"></i> Controls
                </h4>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #bbb;">
                            <i class="fas fa-volume-up"></i> Volume: <span id="volumeValue">100</span>%
                        </label>
                        <input type="range" id="volumeSlider" min="0" max="100" value="100" 
                               style="width: 100%;" oninput="updateVolume(this.value)">
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #bbb;">
                            <i class="fas fa-tachometer-alt"></i> Tempo: <span id="tempoValue">100</span>%
                        </label>
                        <input type="range" id="tempoSlider" min="50" max="200" value="100" 
                               style="width: 100%;" oninput="updateTempo(this.value)">
                    </div>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                        <input type="checkbox" id="autoFillCheckbox" onchange="toggleAutoFill(this.checked)" checked>
                        <span style="color: #bbb;">
                            <i class="fas fa-magic"></i> Auto-fill (play fill before switching loops)
                        </span>
                    </label>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <button class="btn btn-success" onclick="startPlayer()" style="padding: 12px; font-size: 14px;">
                        <i class="fas fa-play"></i> Start / Resume
                    </button>
                    <button class="btn btn-danger" onclick="stopPlayer()" style="padding: 12px; font-size: 14px;">
                        <i class="fas fa-stop"></i> Stop
                    </button>
                </div>
            </div>
            
            <!-- Status -->
            <div id="playerStatus" style="padding: 10px; background: #1a1a1a; border-radius: 5px; color: #bbb; text-align: center;">
                <i class="fas fa-info-circle"></i> Click a loop pad to start playing
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

/**
 * Play a loop or fill pad
 */
async function playLoopPad(padName) {
    if (!rhythmManagerPlayer) return;
    
    try {
        // Initialize audio context if needed (requires user gesture)
        await rhythmManagerPlayer.initialize();
        
        const status = document.getElementById('playerStatus');
        
        if (padName.startsWith('fill')) {
            rhythmManagerPlayer.playFill(padName);
            if (status) status.innerHTML = `<i class="fas fa-bolt"></i> Playing ${padName.toUpperCase()}...`;
        } else {
            rhythmManagerPlayer.switchToLoop(padName);
            await rhythmManagerPlayer.play();
            if (status) status.innerHTML = `<i class="fas fa-play-circle"></i> Playing ${padName.toUpperCase()}...`;
        }
    } catch (error) {
        console.error('Error playing pad:', error);
        showAlert('Error: ' + error.message, 'error');
    }
}

/**
 * Start the player
 */
async function startPlayer() {
    if (!rhythmManagerPlayer) return;
    
    try {
        await rhythmManagerPlayer.initialize();
        await rhythmManagerPlayer.play();
        
        const status = document.getElementById('playerStatus');
        if (status) status.innerHTML = `<i class="fas fa-play-circle"></i> Playing...`;
    } catch (error) {
        console.error('Error starting player:', error);
        showAlert('Error: ' + error.message, 'error');
    }
}

/**
 * Stop the player
 */
function stopPlayer() {
    if (!rhythmManagerPlayer) return;
    
    rhythmManagerPlayer.pause();
    
    const status = document.getElementById('playerStatus');
    if (status) status.innerHTML = `<i class="fas fa-stop-circle"></i> Stopped`;
}

/**
 * Update volume
 */
function updateVolume(value) {
    if (!rhythmManagerPlayer) return;
    
    const volumeValue = document.getElementById('volumeValue');
    if (volumeValue) volumeValue.textContent = value;
    
    rhythmManagerPlayer.setVolume(value / 100);
}

/**
 * Update tempo
 */
function updateTempo(value) {
    if (!rhythmManagerPlayer) return;
    
    const tempoValue = document.getElementById('tempoValue');
    if (tempoValue) tempoValue.textContent = value;
    
    rhythmManagerPlayer.setTempo(value / 100);
}

/**
 * Toggle auto-fill
 */
function toggleAutoFill(enabled) {
    if (!rhythmManagerPlayer) return;
    
    rhythmManagerPlayer.setAutoFill(enabled);
    
    const status = document.getElementById('playerStatus');
    if (status) {
        const icon = enabled ? '<i class="fas fa-magic"></i>' : '<i class="fas fa-ban"></i>';
        status.innerHTML = `${icon} Auto-fill ${enabled ? 'enabled' : 'disabled'}`;
    }
}

/**
 * Close the loop player
 */
function closeLoopPlayer() {
    if (rhythmManagerPlayer) {
        rhythmManagerPlayer.pause();
    }
    
    const playerPanel = document.getElementById('loopPlayerPanel');
    playerPanel.style.display = 'none';
    
    currentPlayerRhythmSet = null;
}

/**
 * Edit Rhythm Set ID
 */
function editRhythmSet(rhythmSetId, rhythmFamily, rhythmSetNo) {
    const modal = document.getElementById('editRhythmSetModal');
    const currentId = document.getElementById('editCurrentRhythmSetId');
    const familyInput = document.getElementById('editRhythmFamily');
    const setNoInput = document.getElementById('editRhythmSetNo');
    const originalIdInput = document.getElementById('editOriginalRhythmSetId');
    
    // Set current values
    currentId.textContent = rhythmSetId;
    familyInput.value = rhythmFamily;
    setNoInput.value = rhythmSetNo;
    originalIdInput.value = rhythmSetId;
    
    // Update preview
    updateEditPreview();
    
    // Show modal
    modal.style.display = 'block';
    
    // Add event listeners for live preview
    familyInput.addEventListener('input', updateEditPreview);
    setNoInput.addEventListener('input', updateEditPreview);
}

/**
 * Update the preview of new rhythm set ID
 */
async function updateEditPreview() {
    const familyInput = document.getElementById('editRhythmFamily');
    const setNoInput = document.getElementById('editRhythmSetNo');
    const preview = document.getElementById('editNewRhythmSetIdPreview');
    const conflictWarning = document.getElementById('editConflictWarning');
    const conflictMessage = document.getElementById('editConflictMessage');
    const saveButton = document.getElementById('saveEditButton');
    
    const family = familyInput.value.trim();
    const setNo = parseInt(setNoInput.value);
    
    if (!family || !setNo || setNo < 1) {
        preview.textContent = '-';
        conflictWarning.style.display = 'none';
        saveButton.disabled = true;
        return;
    }
    
    const newRhythmSetId = `${family}_${setNo}`;
    preview.textContent = newRhythmSetId;
    
    // Check for conflicts
    const originalId = document.getElementById('editOriginalRhythmSetId').value;
    if (newRhythmSetId === originalId) {
        conflictWarning.style.display = 'none';
        saveButton.disabled = false;
        return;
    }
    
    // Check if new ID already exists
    const existingSet = rhythmSets.find(set => set.rhythmSetId === newRhythmSetId);
    if (existingSet) {
        conflictWarning.style.display = 'block';
        conflictMessage.textContent = `A rhythm set with ID "${newRhythmSetId}" already exists!`;
        saveButton.disabled = true;
    } else {
        conflictWarning.style.display = 'none';
        saveButton.disabled = false;
    }
}

/**
 * Save the edited rhythm set
 */
async function saveRhythmSetEdit() {
    const originalId = document.getElementById('editOriginalRhythmSetId').value;
    const newFamily = document.getElementById('editRhythmFamily').value.trim();
    const newSetNo = parseInt(document.getElementById('editRhythmSetNo').value);
    
    if (!newFamily || !newSetNo || newSetNo < 1) {
        showAlert('Please provide valid rhythm family and set number', 'error');
        return;
    }
    
    const newRhythmSetId = `${newFamily}_${newSetNo}`;
    
    // If no change, just close
    if (newRhythmSetId === originalId) {
        closeEditModal();
        return;
    }
    
    // Confirm the change
    const confirmed = confirm(
        `Are you sure you want to update the Rhythm Set ID?\n\n` +
        `From: ${originalId}\n` +
        `To: ${newRhythmSetId}\n\n` +
        `This will update:\n` +
        `- The rhythm set in the database\n` +
        `- All loop files (renamed accordingly)\n` +
        `- All songs mapped to this rhythm set\n\n` +
        `This action cannot be undone!`
    );
    
    if (!confirmed) return;
    
    try {
        showAlert('Updating rhythm set...', 'success');
        
        const response = await authFetch(`${API_BASE_URL}/api/rhythm-sets/${originalId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                newRhythmSetId: newRhythmSetId,
                rhythmFamily: newFamily,
                rhythmSetNo: newSetNo
            })
        });
        
        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'Failed to update rhythm set' }));
            throw new Error(err.error || 'Failed to update rhythm set');
        }
        
        const result = await response.json();
        
        showAlert(
            `Rhythm set updated successfully!\n\n` +
            `Old ID: ${originalId}\n` +
            `New ID: ${newRhythmSetId}\n\n` +
            `${result.updatedSongsCount || 0} song(s) updated.`,
            'success'
        );
        
        // Close modal and reload; signal all tabs to bust loops metadata cache
        closeEditModal();
        localStorage.setItem('loopsMetadataInvalidatedAt', Date.now().toString());
        if (typeof window.invalidateLoopsMetadataCache === 'function') {
            window.invalidateLoopsMetadataCache();
        }
        await loadRhythmSets();
        
    } catch (error) {
        console.error('Edit error:', error);
        showAlert('Error: ' + error.message, 'error');
    }
}

/**
 * Close the edit modal
 */
function closeEditModal() {
    const modal = document.getElementById('editRhythmSetModal');
    modal.style.display = 'none';
    
    // Clear inputs
    document.getElementById('editRhythmFamily').value = '';
    document.getElementById('editRhythmSetNo').value = '';
    document.getElementById('editOriginalRhythmSetId').value = '';
    document.getElementById('editNewRhythmSetIdPreview').textContent = '-';
    document.getElementById('editConflictWarning').style.display = 'none';
}
