// Rhythm Mapper - Song Assignment Only
const API_BASE_URL = window.location.origin;

let songs = [];
let rhythmSets = [];
let selectedSongIds = new Set();

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([loadSongs(), loadRhythmSets()]);
    populateFilters();
    renderSongsTable();
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
    return response;
}

async function loadSongs() {
    try {
        const response = await authFetch(`${API_BASE_URL}/api/songs`);
        if (!response.ok) throw new Error('Failed to load songs');
        songs = await response.json();
    } catch (error) {
        showAlert('Error loading songs: ' + error.message, 'error');
    }
}

async function loadRhythmSets() {
    try {
        const response = await authFetch(`${API_BASE_URL}/api/rhythm-sets`);
        if (!response.ok) throw new Error('Failed to load rhythm sets');
        rhythmSets = await response.json();
        populateRhythmSetSelect();
    } catch (error) {
        showAlert('Error loading rhythm sets: ' + error.message, 'error');
    }
}

function populateRhythmSetSelect() {
    const select = document.getElementById('rhythmSetSelect');
    select.innerHTML = '<option value="">Select a rhythm set...</option>';
    
    rhythmSets.sort((a, b) => {
        if (a.rhythmFamily !== b.rhythmFamily) {
            return a.rhythmFamily.localeCompare(b.rhythmFamily);
        }
        return a.rhythmSetNo - b.rhythmSetNo;
    });

    rhythmSets.forEach(set => {
        const option = document.createElement('option');
        option.value = set.rhythmSetId;
        option.textContent = `${set.rhythmSetId} (${set.availableFiles?.length || 0}/6 loops)`;
        select.appendChild(option);
    });
}

function populateFilters() {
    // Populate Taal filter
    const taals = [...new Set(songs.map(s => s.taal).filter(Boolean))].sort();
    const taalSelect = document.getElementById('filterTaal');
    taals.forEach(taal => {
        const option = document.createElement('option');
        option.value = taal;
        option.textContent = taal;
        taalSelect.appendChild(option);
    });

    // Populate Key filter
    const keys = [...new Set(songs.map(s => s.key).filter(Boolean))].sort();
    const keySelect = document.getElementById('filterKey');
    keys.forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = key;
        keySelect.appendChild(option);
    });

    // Populate Rhythm Set filter
    const rhythms = [...new Set(songs.map(s => s.rhythmSetId).filter(Boolean))].sort();
    const rhythmSelect = document.getElementById('filterRhythm');
    const unmappedOption = rhythmSelect.querySelector('option[value="UNMAPPED"]');
    rhythms.forEach(rhythm => {
        const option = document.createElement('option');
        option.value = rhythm;
        option.textContent = rhythm;
        rhythmSelect.appendChild(option);
    });
}

function filterSongs() {
    const search = document.getElementById('songSearch').value.toLowerCase();
    const taalFilter = document.getElementById('filterTaal').value;
    const keyFilter = document.getElementById('filterKey').value;
    const rhythmFilter = document.getElementById('filterRhythm').value;

    const filtered = songs.filter(song => {
        const matchSearch = !search || 
            song.title?.toLowerCase().includes(search) ||
            song.id?.toString().includes(search);
        
        const matchTaal = !taalFilter || song.taal === taalFilter;
        const matchKey = !keyFilter || song.key === keyFilter;
        
        let matchRhythm = true;
        if (rhythmFilter === 'UNMAPPED') {
            matchRhythm = !song.rhythmSetId;
        } else if (rhythmFilter) {
            matchRhythm = song.rhythmSetId === rhythmFilter;
        }

        return matchSearch && matchTaal && matchKey && matchRhythm;
    });

    renderSongsTable(filtered);
}

function renderSongsTable(songsToRender = songs) {
    const tbody = document.getElementById('songsTableBody');
    
    if (songsToRender.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No songs found</td></tr>';
        return;
    }

    tbody.innerHTML = songsToRender.map(song => `
        <tr>
            <td class="checkbox-cell">
                <input type="checkbox" 
                       data-song-id="${song.id}" 
                       ${selectedSongIds.has(Number(song.id)) ? 'checked' : ''}
                       onchange="toggleSongSelection(${song.id}, this.checked)">
            </td>
            <td>${escapeHtml(song.title || 'Untitled')}</td>
            <td>${escapeHtml(song.taal || '-')}</td>
            <td>${escapeHtml(song.key || '-')}</td>
            <td>${song.tempo || '-'} BPM</td>
            <td>
                ${song.rhythmSetId 
                    ? `<span class="badge badge-success">${escapeHtml(song.rhythmSetId)}</span>`
                    : '<span class="badge badge-warning">Not Assigned</span>'
                }
            </td>
            <td>
                <button class="btn btn-secondary" onclick="clearSongMapping(${song.id})" ${!song.rhythmSetId ? 'disabled' : ''}>
                    <i class="fas fa-unlink"></i> Clear
                </button>
            </td>
        </tr>
    `).join('');

    updateHeaderCheckbox();
}

function toggleSongSelection(songId, checked) {
    if (checked) {
        selectedSongIds.add(Number(songId));
    } else {
        selectedSongIds.delete(Number(songId));
    }
    updateHeaderCheckbox();
}

function toggleAllCheckboxes(headerCheckbox) {
    const checkboxes = document.querySelectorAll('tbody input[type="checkbox"]');
    checkboxes.forEach(cb => {
        const songId = Number(cb.dataset.songId);
        if (headerCheckbox.checked) {
            selectedSongIds.add(songId);
            cb.checked = true;
        } else {
            selectedSongIds.delete(songId);
            cb.checked = false;
        }
    });
}

function updateHeaderCheckbox() {
    const headerCheckbox = document.getElementById('headerCheckbox');
    const visibleCheckboxes = document.querySelectorAll('tbody input[type="checkbox"]');
    const visibleChecked = Array.from(visibleCheckboxes).filter(cb => cb.checked);

    if (visibleCheckboxes.length === 0) {
        headerCheckbox.checked = false;
        headerCheckbox.indeterminate = false;
    } else if (visibleChecked.length === 0) {
        headerCheckbox.checked = false;
        headerCheckbox.indeterminate = false;
    } else if (visibleChecked.length === visibleCheckboxes.length) {
        headerCheckbox.checked = true;
        headerCheckbox.indeterminate = false;
    } else {
        headerCheckbox.checked = false;
        headerCheckbox.indeterminate = true;
    }
}

function selectAllSongs() {
    const visibleCheckboxes = document.querySelectorAll('tbody input[type="checkbox"]');
    visibleCheckboxes.forEach(cb => {
        selectedSongIds.add(Number(cb.dataset.songId));
        cb.checked = true;
    });
    updateHeaderCheckbox();
}

function clearSelection() {
    selectedSongIds.clear();
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    updateHeaderCheckbox();
}

async function assignRhythmSet() {
    if (selectedSongIds.size === 0) {
        showAlert('Please select at least one song', 'error');
        return;
    }

    const rhythmSetId = document.getElementById('rhythmSetSelect').value;
    if (!rhythmSetId) {
        showAlert('Please select a rhythm set', 'error');
        return;
    }

    const rhythmSet = rhythmSets.find(r => r.rhythmSetId === rhythmSetId);
    if (!rhythmSet) {
        showAlert('Invalid rhythm set selected', 'error');
        return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const songId of selectedSongIds) {
        try {
            const response = await authFetch(`${API_BASE_URL}/api/songs/${songId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rhythmSetId: rhythmSet.rhythmSetId,
                    rhythmFamily: rhythmSet.rhythmFamily,
                    rhythmSetNo: rhythmSet.rhythmSetNo
                })
            });

            if (response.ok) {
                successCount++;
            } else {
                failCount++;
            }
        } catch (error) {
            failCount++;
        }
    }

    showAlert(`Assigned ${successCount} song(s) successfully. ${failCount > 0 ? `Failed: ${failCount}` : ''}`, successCount > 0 ? 'success' : 'error');
    
    await loadSongs();
    clearSelection();
    filterSongs();
}

async function clearSongMapping(songId) {
    if (!confirm('Clear rhythm set assignment for this song?')) {
        return;
    }

    try {
        const response = await authFetch(`${API_BASE_URL}/api/songs/${songId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                rhythmSetId: null,
                rhythmFamily: null,
                rhythmSetNo: null
            })
        });

        if (response.ok) {
            showAlert('Rhythm set cleared successfully', 'success');
            await loadSongs();
            filterSongs();
        } else {
            throw new Error('Failed to clear mapping');
        }
    } catch (error) {
        showAlert('Error: ' + error.message, 'error');
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
