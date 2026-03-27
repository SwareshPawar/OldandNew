// scripts/features/rhythm-sets.js
// Phase 3G extraction: rhythm set admin tab logic from main.js.
(function attachRhythmSetsUI(window) {
    if (!window) return;

    const RHYTHM_SET_STATUS_OPTIONS = ['active', 'inactive', 'archived'];

    function showRhythmSetsNotification(message, type = 'info') {
        const notif = document.getElementById('rhythmSetsNotification');
        if (!notif) return;

        notif.textContent = message;
        notif.style.display = 'block';
        if (type === 'success') {
            notif.style.background = '#e0ffe0';
            notif.style.color = '#155724';
        } else if (type === 'error') {
            notif.style.background = '#ffe0e0';
            notif.style.color = '#b30000';
        } else {
            notif.style.background = '';
            notif.style.color = '';
        }
    }

    function renderRhythmSetsTable(rhythmSets) {
        const tbody = document.querySelector('#rhythmSetsTable tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!Array.isArray(rhythmSets) || !rhythmSets.length) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = 7;
            td.style.padding = '12px 8px';
            td.textContent = 'No rhythm sets found.';
            tr.appendChild(td);
            tbody.appendChild(tr);
            return;
        }

        rhythmSets.forEach((set) => {
            const tr = document.createElement('tr');
            tr.dataset.rhythmSetId = set.rhythmSetId || '';

            const idCell = document.createElement('td');
            idCell.style.padding = '10px 8px';
            const idStrong = document.createElement('strong');
            idStrong.textContent = set.rhythmSetId || '-';
            const idSub = document.createElement('div');
            idSub.style.fontSize = '0.9em';
            idSub.style.opacity = '0.85';
            idSub.textContent = `${set.rhythmFamily || '-'} / ${set.rhythmSetNo || '-'}`;
            idCell.appendChild(idStrong);
            idCell.appendChild(idSub);

            const statusCell = document.createElement('td');
            statusCell.style.padding = '10px 8px';
            const statusSelect = document.createElement('select');
            statusSelect.className = 'rhythm-set-status-select';
            const statusOptions = new Set(RHYTHM_SET_STATUS_OPTIONS);
            if (set.status) statusOptions.add(String(set.status));
            Array.from(statusOptions).forEach((status) => {
                const option = document.createElement('option');
                option.value = status;
                option.textContent = status;
                if (String(set.status || 'active') === status) {
                    option.selected = true;
                }
                statusSelect.appendChild(option);
            });
            statusCell.appendChild(statusSelect);

            const mappedCell = document.createElement('td');
            mappedCell.style.padding = '10px 8px';
            mappedCell.textContent = String(set.mappedSongCount || 0);

            const filesCell = document.createElement('td');
            filesCell.style.padding = '10px 8px';
            const files = Array.isArray(set.availableFiles) ? set.availableFiles : [];
            const filesHeader = document.createElement('div');
            filesHeader.textContent = `${files.length}/6 ${set.isComplete ? '(complete)' : '(incomplete)'}`;
            const filesSub = document.createElement('div');
            filesSub.style.fontSize = '0.9em';
            filesSub.style.opacity = '0.85';
            filesSub.textContent = files.length ? files.join(', ') : 'No files linked';
            filesCell.appendChild(filesHeader);
            filesCell.appendChild(filesSub);

            const notesCell = document.createElement('td');
            notesCell.style.padding = '10px 8px';
            const notesInput = document.createElement('textarea');
            notesInput.className = 'rhythm-set-notes-input';
            notesInput.rows = 2;
            notesInput.style.width = '100%';
            notesInput.value = set.notes || '';
            notesCell.appendChild(notesInput);

            const updatedCell = document.createElement('td');
            updatedCell.style.padding = '10px 8px';
            updatedCell.textContent = set.updatedAt ? new Date(set.updatedAt).toLocaleString() : '-';

            const actionsCell = document.createElement('td');
            actionsCell.style.padding = '10px 8px';

            const saveBtn = document.createElement('button');
            saveBtn.type = 'button';
            saveBtn.className = 'btn rhythm-set-save-btn';
            saveBtn.textContent = 'Save';

            const recomputeBtn = document.createElement('button');
            recomputeBtn.type = 'button';
            recomputeBtn.className = 'btn rhythm-set-recompute-btn';
            recomputeBtn.style.marginLeft = '6px';
            recomputeBtn.textContent = 'Recompute';

            actionsCell.appendChild(saveBtn);
            actionsCell.appendChild(recomputeBtn);

            tr.appendChild(idCell);
            tr.appendChild(statusCell);
            tr.appendChild(mappedCell);
            tr.appendChild(filesCell);
            tr.appendChild(notesCell);
            tr.appendChild(updatedCell);
            tr.appendChild(actionsCell);
            tbody.appendChild(tr);
        });
    }

    async function loadRhythmSets(deps) {
        try {
            const res = await deps.authFetch(`${deps.API_BASE_URL}/api/rhythm-sets`);
            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Failed to load rhythm sets' }));
                throw new Error(err.error || 'Failed to load rhythm sets');
            }
            const rhythmSets = await res.json();
            renderRhythmSetsTable(rhythmSets);
        } catch (error) {
            showRhythmSetsNotification(error.message || 'Failed to load rhythm sets', 'error');
        }
    }

    async function createRhythmSetFromForm(deps) {
        const rhythmFamilyInput = document.getElementById('rhythmSetFamilyInput');
        const rhythmSetNoInput = document.getElementById('rhythmSetNoInput');
        const rhythmSetStatusInput = document.getElementById('rhythmSetStatusInput');
        const rhythmSetNotesInput = document.getElementById('rhythmSetNotesInput');

        if (!rhythmFamilyInput || !rhythmSetNoInput || !rhythmSetStatusInput || !rhythmSetNotesInput) {
            return;
        }

        const payload = {
            rhythmFamily: rhythmFamilyInput.value,
            rhythmSetNo: parseInt(rhythmSetNoInput.value, 10),
            status: rhythmSetStatusInput.value,
            notes: rhythmSetNotesInput.value
        };

        if (!payload.rhythmFamily || !payload.rhythmSetNo || payload.rhythmSetNo <= 0) {
            showRhythmSetsNotification('Rhythm family and positive set number are required.', 'error');
            return;
        }

        try {
            showRhythmSetsNotification('Creating rhythm set...');
            const res = await deps.authFetch(`${deps.API_BASE_URL}/api/rhythm-sets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Failed to create rhythm set' }));
                showRhythmSetsNotification(err.error || 'Failed to create rhythm set', 'error');
                return;
            }

            rhythmSetNoInput.value = '';
            rhythmSetNotesInput.value = '';
            showRhythmSetsNotification('Rhythm set created successfully.', 'success');
            await loadRhythmSets(deps);
        } catch (error) {
            showRhythmSetsNotification(error.message || 'Failed to create rhythm set', 'error');
        }
    }

    async function saveRhythmSetRow(rhythmSetId, status, notes, deps) {
        const res = await deps.authFetch(`${deps.API_BASE_URL}/api/rhythm-sets/${encodeURIComponent(rhythmSetId)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, notes })
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Failed to save rhythm set' }));
            throw new Error(err.error || 'Failed to save rhythm set');
        }

        return res.json();
    }

    async function recomputeRhythmSetRow(rhythmSetId, deps) {
        const res = await deps.authFetch(`${deps.API_BASE_URL}/api/rhythm-sets/${encodeURIComponent(rhythmSetId)}/recompute`, {
            method: 'PUT'
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Failed to recompute rhythm set' }));
            throw new Error(err.error || 'Failed to recompute rhythm set');
        }

        return res.json();
    }

    function initializeRhythmSetsUI(deps) {
        const rhythmSetsTab = document.getElementById('rhythmSetsTab');
        const rhythmSetsTabContent = document.getElementById('rhythmSetsTabContent');
        const userMgmtTab = document.getElementById('userMgmtTab');
        const weightsTab = document.getElementById('weightsTab');
        const userMgmtTabContent = document.getElementById('userMgmtTabContent');
        const weightsTabContent = document.getElementById('weightsTabContent');

        if (rhythmSetsTab && rhythmSetsTabContent && !rhythmSetsTab.dataset.rhythmUiBound) {
            rhythmSetsTab.dataset.rhythmUiBound = 'true';
            rhythmSetsTab.addEventListener('click', () => {
                if (userMgmtTab) userMgmtTab.classList.remove('active');
                if (weightsTab) weightsTab.classList.remove('active');
                rhythmSetsTab.classList.add('active');
                if (userMgmtTabContent) userMgmtTabContent.style.display = 'none';
                if (weightsTabContent) weightsTabContent.style.display = 'none';
                rhythmSetsTabContent.style.display = '';
                loadRhythmSets(deps);
            });
        }

        const rhythmSetCreateForm = document.getElementById('rhythmSetCreateForm');
        if (rhythmSetCreateForm && !rhythmSetCreateForm.dataset.bound) {
            rhythmSetCreateForm.dataset.bound = 'true';
            rhythmSetCreateForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                await createRhythmSetFromForm(deps);
            });
        }

        const rhythmSetsTable = document.getElementById('rhythmSetsTable');
        if (rhythmSetsTable && !rhythmSetsTable.dataset.bound) {
            rhythmSetsTable.dataset.bound = 'true';
            rhythmSetsTable.addEventListener('click', async (event) => {
                const target = event.target instanceof Element ? event.target : null;
                if (!target) return;
                const row = target.closest('tr[data-rhythm-set-id]');
                if (!row) return;

                const rhythmSetId = row.dataset.rhythmSetId;
                const statusSelect = row.querySelector('.rhythm-set-status-select');
                const notesInput = row.querySelector('.rhythm-set-notes-input');

                if (target.classList.contains('rhythm-set-save-btn')) {
                    try {
                        showRhythmSetsNotification(`Saving ${rhythmSetId}...`);
                        await saveRhythmSetRow(rhythmSetId, statusSelect ? statusSelect.value : 'active', notesInput ? notesInput.value : '', deps);
                        showRhythmSetsNotification(`Saved ${rhythmSetId}.`, 'success');
                        await loadRhythmSets(deps);
                    } catch (error) {
                        showRhythmSetsNotification(error.message || `Failed to save ${rhythmSetId}.`, 'error');
                    }
                }

                if (target.classList.contains('rhythm-set-recompute-btn')) {
                    try {
                        showRhythmSetsNotification(`Recomputing ${rhythmSetId}...`);
                        await recomputeRhythmSetRow(rhythmSetId, deps);
                        showRhythmSetsNotification(`Recomputed ${rhythmSetId}.`, 'success');
                        await loadRhythmSets(deps);
                    } catch (error) {
                        showRhythmSetsNotification(error.message || `Failed to recompute ${rhythmSetId}.`, 'error');
                    }
                }
            });
        }
    }

    window.RhythmSetsUI = {
        showRhythmSetsNotification,
        renderRhythmSetsTable,
        loadRhythmSets,
        createRhythmSetFromForm,
        saveRhythmSetRow,
        recomputeRhythmSetRow,
        initializeRhythmSetsUI,
    };
})(window);
