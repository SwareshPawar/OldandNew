// scripts/features/admin-ui.js
// Phase 3G extraction: admin panel and recommendation-weight UI from main.js.
(function attachAdminUI(window) {
    if (!window) return;

    async function fetchUsers(deps) {
        try {
            const res = await deps.authFetch(`${deps.API_BASE_URL}/api/users`);
            if (!res.ok) return [];
            return res.json();
        } catch (error) {
            return [];
        }
    }

    function showAdminNotification(message) {
        const notification = document.getElementById('adminNotification');
        if (!notification) return;
        notification.textContent = message;
        notification.classList.add('show');
        notification.style.display = 'block';
        setTimeout(() => {
            notification.classList.remove('show');
            notification.style.display = 'none';
        }, 2000);
    }

    function renderUsers(users) {
        const tbody = document.querySelector('#usersTable tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        const sortedUsers = [...users].sort((a, b) => {
            if (a.isAdmin && !b.isAdmin) return -1;
            if (!a.isAdmin && b.isAdmin) return 1;
            return a.username.localeCompare(b.username);
        });

        sortedUsers.forEach((user) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="max-width:180px;overflow-wrap:break-word;">${user.username}</td>
                <td>${user.isAdmin ? '<span class="admin-badge">Admin</span>' : ''}</td>
                <td>
                    <button class="btn" ${user.isAdmin ? 'disabled' : ''} onclick="markAdmin('${user._id}')">Mark Admin</button>
                </td>
                <td>
                    <button class="btn btn-danger" ${!user.isAdmin ? 'disabled' : ''} onclick="removeAdminRole('${user._id}')">Remove Admin</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    async function loadUsers(deps) {
        const users = await fetchUsers(deps);
        renderUsers(users);
    }

    async function markAdmin(userId, deps) {
        try {
            const res = await deps.authFetch(`${deps.API_BASE_URL}/api/users/${userId}/admin`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isAdmin: true })
            });
            if (res.ok) {
                showAdminNotification('User marked as admin');
                loadUsers(deps);
            } else {
                showAdminNotification('Failed to update user');
            }
        } catch (error) {
            showAdminNotification('Failed to update user');
        }
    }

    async function removeAdminRole(userId, deps) {
        const modal = document.getElementById('confirmRemoveAdminModal');
        const message = document.getElementById('removeAdminMessage');
        if (!modal || !message) return;

        message.textContent = 'Are you sure you want to remove admin role from this user?';
        modal.style.display = 'flex';

        const confirmButton = document.getElementById('confirmRemoveAdmin');
        const cancelButton = document.getElementById('cancelRemoveAdmin');

        if (confirmButton) {
            confirmButton.onclick = async () => {
                modal.style.display = 'none';
                try {
                    const res = await fetch(`${deps.API_BASE_URL}/api/users/${userId}/remove-admin`, {
                        method: 'PATCH',
                        headers: {
                            Authorization: `Bearer ${deps.getJwtToken()}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    let msg;
                    if (res.ok) {
                        msg = 'Admin role removed successfully';
                        loadUsers(deps);
                    } else {
                        const data = await res.json().catch(() => ({}));
                        msg = data.error ? `Failed: ${data.error}` : 'Failed to remove admin role';
                    }
                    showAdminNotification(msg);
                } catch (error) {
                    showAdminNotification('Network error during admin role removal');
                }
            };
        }

        if (cancelButton) {
            cancelButton.onclick = () => {
                modal.style.display = 'none';
            };
        }
    }

    async function fetchRecommendationWeights(deps) {
        try {
            const res = await fetch(`${deps.API_BASE_URL}/api/recommendation-weights`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('jwtToken') || ''}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                const localLastModified = deps.getWeights().lastModified || localStorage.getItem('recommendationWeightsLastModified');
                if (!localLastModified || !data.lastModified || data.lastModified !== localLastModified) {
                    const nextWeights = { ...deps.DEFAULT_RECOMMENDATION_WEIGHTS, ...data };
                    deps.setWeights(nextWeights);
                    localStorage.setItem('recommendationWeights', JSON.stringify(nextWeights));
                    if (data.lastModified) {
                        localStorage.setItem('recommendationWeightsLastModified', data.lastModified);
                    }
                }
            }
        } catch (error) {
            // fall back to local cache
        }
    }

    async function saveRecommendationWeightsToBackend(weights, deps) {
        try {
            const res = await fetch(`${deps.API_BASE_URL}/api/recommendation-weights`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('jwtToken') || ''}`
                },
                body: JSON.stringify(weights)
            });
            if (res.ok) {
                const data = await res.json();
                const mergedWeights = { ...deps.DEFAULT_RECOMMENDATION_WEIGHTS, ...weights };
                localStorage.setItem('recommendationWeights', JSON.stringify(mergedWeights));
                deps.setWeights(mergedWeights);
                return { success: true, message: data.message || 'Weights updated' };
            }
            const err = await res.json();
            return { success: false, message: err.error || 'Failed to update weights' };
        } catch (error) {
            return { success: false, message: 'Network error' };
        }
    }

    async function loadWeightsToForm(deps) {
        await fetchRecommendationWeights(deps);
        const weights = deps.getWeights();
        const setValue = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.value = value;
        };
        setValue('weightLanguage', weights.language ?? 0);
        setValue('weightScale', weights.scale ?? 0);
        setValue('weightTimeSignature', weights.timeSignature ?? 0);
        setValue('weightTaal', weights.taal ?? 0);
        setValue('weightTempo', weights.tempo ?? 0);
        setValue('weightGenre', weights.genre ?? 0);
        setValue('weightVocal', weights.vocal ?? 0);
        setValue('weightMood', weights.mood ?? 0);
        setValue('weightRhythmCategory', weights.rhythmCategory ?? 0);
        updateWeightsTotalBar();
    }

    function updateWeightsTotalBar() {
        const values = [
            parseInt(document.getElementById('weightLanguage')?.value, 10) || 0,
            parseInt(document.getElementById('weightScale')?.value, 10) || 0,
            parseInt(document.getElementById('weightTimeSignature')?.value, 10) || 0,
            parseInt(document.getElementById('weightTaal')?.value, 10) || 0,
            parseInt(document.getElementById('weightTempo')?.value, 10) || 0,
            parseInt(document.getElementById('weightGenre')?.value, 10) || 0,
            parseInt(document.getElementById('weightVocal')?.value, 10) || 0,
            parseInt(document.getElementById('weightMood')?.value, 10) || 0,
            parseInt(document.getElementById('weightRhythmCategory')?.value, 10) || 0,
        ];
        const total = values.reduce((sum, value) => sum + value, 0);
        const bar = document.getElementById('weightsTotalBar');
        if (!bar) return;
        bar.textContent = `Total: ${total} / 100`;
        bar.style.color = total === 100 ? '#27ae60' : '#e74c3c';
    }

    function showAdminPanelModal(deps) {
        const modal = document.getElementById('adminPanelModal');
        if (!modal) {
            console.error('Admin panel modal element not found');
            return;
        }

        modal.style.display = 'flex';

        const userMgmtTab = document.getElementById('userMgmtTab');
        const userMgmtTabContent = document.getElementById('userMgmtTabContent');
        const weightsTab = document.getElementById('weightsTab');
        const weightsTabContent = document.getElementById('weightsTabContent');
        const rhythmSetsTab = document.getElementById('rhythmSetsTab');
        const rhythmSetsTabContent = document.getElementById('rhythmSetsTabContent');

        if (userMgmtTab) userMgmtTab.classList.add('active');
        if (userMgmtTabContent) {
            userMgmtTabContent.classList.add('active');
            userMgmtTabContent.style.display = '';
        }
        if (weightsTab) weightsTab.classList.remove('active');
        if (weightsTabContent) {
            weightsTabContent.classList.remove('active');
            weightsTabContent.style.display = 'none';
        }
        if (rhythmSetsTab) rhythmSetsTab.classList.remove('active');
        if (rhythmSetsTabContent) {
            rhythmSetsTabContent.classList.remove('active');
            rhythmSetsTabContent.style.display = 'none';
        }

        loadUsers(deps);
        registerGlobals(deps);
    }

    function registerGlobals(deps) {
        window.markAdmin = (userId) => markAdmin(userId, deps);
        window.removeAdminRole = (userId) => removeAdminRole(userId, deps);
    }

    function initializeAdminUI(deps) {
        registerGlobals(deps);

        const adminPanelBtn = document.getElementById('adminPanelBtn');
        if (adminPanelBtn && !adminPanelBtn.dataset.adminUiBound) {
            adminPanelBtn.dataset.adminUiBound = 'true';
            adminPanelBtn.onclick = () => showAdminPanelModal(deps);
        }

        const userMgmtTab = document.getElementById('userMgmtTab');
        const weightsTab = document.getElementById('weightsTab');
        const rhythmSetsTab = document.getElementById('rhythmSetsTab');
        const userMgmtTabContent = document.getElementById('userMgmtTabContent');
        const weightsTabContent = document.getElementById('weightsTabContent');
        const rhythmSetsTabContent = document.getElementById('rhythmSetsTabContent');

        if (userMgmtTab && !userMgmtTab.dataset.adminUiBound) {
            userMgmtTab.dataset.adminUiBound = 'true';
            userMgmtTab.addEventListener('click', () => {
                userMgmtTab.classList.add('active');
                if (weightsTab) weightsTab.classList.remove('active');
                if (rhythmSetsTab) rhythmSetsTab.classList.remove('active');
                if (userMgmtTabContent) userMgmtTabContent.style.display = '';
                if (weightsTabContent) weightsTabContent.style.display = 'none';
                if (rhythmSetsTabContent) rhythmSetsTabContent.style.display = 'none';
            });
        }

        if (weightsTab && !weightsTab.dataset.adminUiBound) {
            weightsTab.dataset.adminUiBound = 'true';
            weightsTab.addEventListener('click', () => {
                if (userMgmtTab) userMgmtTab.classList.remove('active');
                weightsTab.classList.add('active');
                if (rhythmSetsTab) rhythmSetsTab.classList.remove('active');
                if (userMgmtTabContent) userMgmtTabContent.style.display = 'none';
                if (weightsTabContent) weightsTabContent.style.display = '';
                if (rhythmSetsTabContent) rhythmSetsTabContent.style.display = 'none';
                loadWeightsToForm(deps);
            });
        }

        const weightIds = [
            'weightLanguage',
            'weightScale',
            'weightTimeSignature',
            'weightTaal',
            'weightTempo',
            'weightGenre',
            'weightVocal',
            'weightMood',
            'weightRhythmCategory'
        ];
        weightIds.forEach((id) => {
            const element = document.getElementById(id);
            if (element && !element.dataset.adminUiBound) {
                element.dataset.adminUiBound = 'true';
                element.addEventListener('input', updateWeightsTotalBar);
            }
        });

        const weightsForm = document.getElementById('weightsForm');
        if (weightsForm && !weightsForm.dataset.adminUiBound) {
            weightsForm.dataset.adminUiBound = 'true';
            weightsForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const newWeights = {
                    language: parseInt(document.getElementById('weightLanguage')?.value, 10),
                    scale: parseInt(document.getElementById('weightScale')?.value, 10),
                    timeSignature: parseInt(document.getElementById('weightTimeSignature')?.value, 10),
                    taal: parseInt(document.getElementById('weightTaal')?.value, 10),
                    tempo: parseInt(document.getElementById('weightTempo')?.value, 10),
                    genre: parseInt(document.getElementById('weightGenre')?.value, 10),
                    vocal: parseInt(document.getElementById('weightVocal')?.value, 10),
                    mood: parseInt(document.getElementById('weightMood')?.value, 10),
                    rhythmCategory: parseInt(document.getElementById('weightRhythmCategory')?.value, 10)
                };
                const total = Object.values(newWeights).reduce((sum, value) => sum + value, 0);
                const notif = document.getElementById('weightsNotification');
                if (!notif) return;
                if (total !== 100) {
                    notif.textContent = 'Total must be 100.';
                    notif.style.display = 'block';
                    notif.style.background = '#ffe0e0';
                    notif.style.color = '#b30000';
                    return;
                }
                notif.textContent = 'Saving...';
                notif.style.display = 'block';
                notif.style.background = '';
                notif.style.color = '';
                const result = await saveRecommendationWeightsToBackend(newWeights, deps);
                if (result.success) {
                    notif.textContent = 'Weights saved successfully!';
                    notif.style.background = '#e0ffe0';
                    notif.style.color = '#155724';
                } else {
                    notif.textContent = result.message;
                    notif.style.background = '#ffe0e0';
                    notif.style.color = '#b30000';
                }
                notif.style.display = 'block';
                const modalContent = notif.closest('.modal-content');
                if (modalContent) modalContent.scrollTop = 0;
                setTimeout(() => {
                    notif.style.display = 'none';
                }, 4000);
            });
        }
    }

    window.AdminUI = {
        fetchUsers,
        markAdmin,
        removeAdminRole,
        showAdminNotification,
        renderUsers,
        loadUsers,
        fetchRecommendationWeights,
        saveRecommendationWeightsToBackend,
        loadWeightsToForm,
        updateWeightsTotalBar,
        showAdminPanelModal,
        initializeAdminUI,
        registerGlobals,
    };
})(window);
