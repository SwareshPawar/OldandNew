// scripts/shared/dom.js
// Phase 3H extraction: shared DOM helpers from main.js.
(function attachDomHelpers(window) {
    if (!window) return;

    function setupSuggestedSongsClosing(deps) {
        if (document.body.dataset.suggestedSongsClosingBound === 'true') return;
        document.body.dataset.suggestedSongsClosingBound = 'true';

        const toggleBtn = document.getElementById('toggleSuggestedSongs');
        const closeBtn = document.getElementById('closeSuggestedSongs');

        document.addEventListener('click', (event) => {
            if (deps.getSuggestedSongsDrawerOpen() &&
                !event.target.closest('#suggestedSongsDrawer') &&
                event.target !== toggleBtn) {
                deps.closeSuggestedSongsDrawer();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && deps.getSuggestedSongsDrawerOpen()) {
                deps.closeSuggestedSongsDrawer();
            }
        });

        if (closeBtn) {
            closeBtn.addEventListener('click', deps.closeSuggestedSongsDrawer);
        }
    }

    function setupModalClosing() {
        document.querySelectorAll('.close-modal').forEach((button) => {
            if (button.dataset.modalCloseBound === 'true') return;
            button.dataset.modalCloseBound = 'true';
            button.addEventListener('click', () => {
                const modal = button.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });
    }

    function openModal(modal, deps) {
        const currentModal = deps.getCurrentModal();
        if (currentModal) {
            closeModal(currentModal, deps);
        }

        const modalElement = typeof modal === 'string' ? document.getElementById(modal) : modal;
        if (!modalElement) {
            console.error('Modal not found:', modal);
            return;
        }

        modalElement.style.display = 'flex';
        deps.setCurrentModal(modalElement);
        document.body.style.overflow = 'hidden';
        history.pushState({ modalOpen: true }, '');
    }

    function closeModal(modal, deps) {
        if (!modal) return;

        modal.style.display = 'none';
        deps.setCurrentModal(null);
        document.body.style.overflow = '';

        if (modal.id === 'addSongModal') {
            const moodDropdown = document.getElementById('moodDropdown');
            const artistDropdown = document.getElementById('artistDropdown');
            const genreDropdown = document.getElementById('genreDropdown');

            if (moodDropdown && moodDropdown._allSelections) {
                moodDropdown._allSelections.clear();
            }
            if (artistDropdown && artistDropdown._allSelections) {
                artistDropdown._allSelections.clear();
            }
            if (genreDropdown && genreDropdown._allSelections) {
                genreDropdown._allSelections.clear();
            }

            document.querySelectorAll('#moodDropdown .multiselect-option').forEach((opt) => opt.classList.remove('selected'));
            document.querySelectorAll('#artistDropdown .multiselect-option').forEach((opt) => opt.classList.remove('selected'));
            document.querySelectorAll('#genreDropdown .multiselect-option').forEach((opt) => opt.classList.remove('selected'));

            deps.updateSelectedMultiselect('selectedMoods', 'moodDropdown', true, 'songMood');
            deps.updateSelectedMultiselect('selectedArtists', 'artistDropdown', true, 'songArtist');
            deps.updateSelectedMultiselect('selectedGenres', 'genreDropdown', true, 'songGenre');
        }

        if (history.state?.modalOpen) {
            history.back();
        }
    }

    function setupModals(deps) {
        document.querySelectorAll('.modal').forEach((modal) => {
            modal.querySelectorAll('.close-modal').forEach((button) => {
                if (button.dataset.modalHelperBound === 'true') return;
                button.dataset.modalHelperBound = 'true';
                button.addEventListener('click', () => closeModal(modal, deps));
            });
        });

        if (document.body.dataset.modalEscapeBound !== 'true') {
            document.body.dataset.modalEscapeBound = 'true';
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && deps.getCurrentModal()) {
                    closeModal(deps.getCurrentModal(), deps);
                }
            });
        }
    }

    function saveSearchQuery(query, deps) {
        if (!query.trim()) return;

        let nextHistory = deps.getSearchHistory().filter((item) => item.toLowerCase() !== query.toLowerCase());
        nextHistory.unshift(query);
        if (nextHistory.length > 10) {
            nextHistory = nextHistory.slice(0, 10);
        }
        deps.setSearchHistory(nextHistory);
        localStorage.setItem('searchHistory', JSON.stringify(nextHistory));
    }

    function showSearchHistory(deps) {
        const dropdown = document.getElementById('searchHistoryDropdown');
        if (!dropdown) return;

        dropdown.innerHTML = '';
        const searchHistory = deps.getSearchHistory();
        if (searchHistory.length === 0) {
            dropdown.style.display = 'none';
            return;
        }

        const header = document.createElement('div');
        header.className = 'search-history-header';
        header.textContent = 'Recent Searches';
        dropdown.appendChild(header);

        const clearBtn = document.createElement('div');
        clearBtn.className = 'search-history-item';
        clearBtn.style.fontWeight = 'bold';
        clearBtn.style.cursor = 'pointer';
        clearBtn.textContent = 'Clear History';
        clearBtn.addEventListener('click', () => {
            deps.setSearchHistory([]);
            localStorage.setItem('searchHistory', JSON.stringify([]));
            dropdown.style.display = 'none';
        });
        dropdown.appendChild(clearBtn);

        searchHistory.forEach((query) => {
            const item = document.createElement('div');
            item.className = 'search-history-item';
            item.textContent = query;
            item.addEventListener('click', () => {
                const input = document.getElementById('searchInput');
                if (!input) return;
                input.value = query;
                dropdown.style.display = 'none';
                input.dispatchEvent(new Event('input', { bubbles: true }));
            });
            dropdown.appendChild(item);
        });

        dropdown.style.display = 'block';
    }

    function highlightText(text, query) {
        if (!query) return text;
        const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        return text.replace(regex, (match) => `<span class="highlight">${match}</span>`);
    }

    function initializeDomUI(deps) {
        setupModalClosing();
        setupSuggestedSongsClosing(deps);
        setupModals(deps);
    }

    window.DOMHelpers = {
        setupSuggestedSongsClosing,
        setupModalClosing,
        openModal,
        closeModal,
        setupModals,
        saveSearchQuery,
        showSearchHistory,
        highlightText,
        initializeDomUI,
    };
})(window);