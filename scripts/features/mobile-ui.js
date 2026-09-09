// scripts/features/mobile-ui.js
// Phase 3H extraction: mobile and panel UI helpers from main.js.
(function attachMobileUI(window) {
    if (!window) return;

    let mobileUIDeps = null;
    const mobileCatalogueState = {
        bound: false,
        selectMode: false,
        selectedSongIds: new Set(),
        observer: null,
    };

    function updatePositions() {
        const sidebar = document.querySelector('.sidebar');
        const songsSection = document.querySelector('.songs-section');
        const previewSection = document.querySelector('.preview-section');
        if (!sidebar || !songsSection || !previewSection) return;

        if (window.innerWidth > 768) {
            if (sidebar.classList.contains('hidden')) {
                songsSection.style.left = '0';
                previewSection.style.marginLeft = songsSection.classList.contains('hidden')
                    ? 'var(--preview-margin-left)'
                    : 'calc(var(--songs-panel-width) + var(--preview-margin-left))';
            } else {
                songsSection.style.left = 'var(--sidebar-width)';
                previewSection.style.marginLeft = songsSection.classList.contains('hidden')
                    ? 'calc(var(--sidebar-width) + var(--preview-margin-left))'
                    : 'calc(var(--sidebar-width) + var(--songs-panel-width) + var(--preview-margin-left))';
            }
        } else {
            songsSection.style.left = '0';
            previewSection.style.marginLeft = '0';
            previewSection.classList.add('full-width');
        }
    }

    function addMobileTouchNavigation() {
        if (document.body.dataset.mobileTouchNavBound === 'true') return;
        document.body.dataset.mobileTouchNavBound = 'true';

        const sidebar = document.querySelector('.sidebar');
        const songsSection = document.querySelector('.songs-section');
        if (!sidebar || !songsSection || window.innerWidth > 768) return;

        let touchStartX = 0;
        let touchStartY = 0;
        const minSwipeDistance = 50;
        const maxVerticalMovement = 100;

        document.addEventListener('touchstart', (event) => {
            touchStartX = event.changedTouches[0].screenX;
            touchStartY = event.changedTouches[0].screenY;
        }, { passive: true });

        document.addEventListener('touchend', (event) => {
            const touchEndX = event.changedTouches[0].screenX;
            const touchEndY = event.changedTouches[0].screenY;
            const deltaX = touchEndX - touchStartX;
            const deltaY = Math.abs(touchEndY - touchStartY);

            if (Math.abs(deltaX) < minSwipeDistance || deltaY > maxVerticalMovement) return;

            const screenWidth = window.innerWidth;
            const edgeThreshold = screenWidth * 0.15;

            if (deltaX > 0 && touchStartX <= edgeThreshold) {
                sidebar.classList.remove('hidden');
                songsSection.classList.add('hidden');
                updatePositions();
            } else if (deltaX < 0 && touchStartX >= (screenWidth - edgeThreshold)) {
                songsSection.classList.remove('hidden');
                sidebar.classList.add('hidden');
                updatePositions();
            } else if (deltaX < 0 && Math.abs(deltaX) > minSwipeDistance) {
                if (!sidebar.classList.contains('hidden')) {
                    sidebar.classList.add('hidden');
                    updatePositions();
                } else if (!songsSection.classList.contains('hidden')) {
                    songsSection.classList.add('hidden');
                    updatePositions();
                }
            }
        }, { passive: true });
    }

    function createMobileNavButtons() {
        const existingContainer = document.querySelector('.mobile-nav-container');
        if (existingContainer) {
            existingContainer.remove();
        }

        const mobileNavContainer = document.createElement('div');
        mobileNavContainer.className = 'mobile-nav-container';
        const isMobile = window.innerWidth <= 768;
        const bothPanelsButton = isMobile ? '' : `
                <button class="mobile-nav-btn mobile-nav-both" title="Toggle Both Panels">
                    <i class="fas fa-eye"></i>
                </button>`;

        mobileNavContainer.innerHTML = `
                <button class="mobile-nav-btn mobile-nav-sidebar" title="Toggle Sidebar">
                    <i class="fas fa-home"></i>
                </button>
                <button class="mobile-nav-btn mobile-nav-songs" title="Toggle Songs">
                    <i class="fas fa-list"></i>
                </button>${bothPanelsButton}
            `;

        document.body.appendChild(mobileNavContainer);

        const sidebar = document.querySelector('.sidebar');
        const songsSection = document.querySelector('.songs-section');
        if (!sidebar || !songsSection) return;

        document.querySelector('.mobile-nav-sidebar')?.addEventListener('click', (event) => {
            event.stopPropagation();
            sidebar.classList.toggle('hidden');
            if (!sidebar.classList.contains('hidden')) {
                songsSection.classList.add('hidden');
            }
            updatePositions();
        });

        document.querySelector('.mobile-nav-songs')?.addEventListener('click', (event) => {
            event.stopPropagation();
            songsSection.classList.toggle('hidden');
            if (!songsSection.classList.contains('hidden')) {
                sidebar.classList.add('hidden');
            }
            updatePositions();
        });

        const toggleBothBtn = document.querySelector('.mobile-nav-both');
        if (toggleBothBtn) {
            toggleBothBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                const areBothHidden = sidebar.classList.contains('hidden') && songsSection.classList.contains('hidden');
                sidebar.classList.toggle('hidden', !areBothHidden);
                songsSection.classList.toggle('hidden', !areBothHidden);
                toggleBothBtn.querySelector('i').className = areBothHidden ? 'fas fa-eye-slash' : 'fas fa-eye';
                updatePositions();
            });
        }
    }

    function activateMobileModernDestination(destination) {
        const navItems = document.querySelectorAll('[data-mobile-destination]');
        const currentItem = Array.from(navItems).find((item) => item.classList.contains('active'));
        const isSameDestination = currentItem?.dataset.mobileDestination === destination;
        const sidebar = document.querySelector('.sidebar');
        const songsSection = document.querySelector('.songs-section');

        navItems.forEach((item) => {
            const isActive = item.dataset.mobileDestination === destination;
            item.classList.toggle('active', isActive);
            item.setAttribute('aria-current', isActive ? 'page' : 'false');
        });

        if (destination === 'home') {
            const homeDrawerOpen = document.body.classList.contains('mobile-home-open') ||
                sidebar?.classList.contains('mobile-home-drawer-open') ||
                (sidebar && !sidebar.classList.contains('hidden'));
            if (isSameDestination && homeDrawerOpen) {
                closeMobileHomeDrawer();
            } else {
                openMobileHomeDrawer();
            }
        } else if (destination === 'songs') {
            closeMobileHomeDrawer();
            if (sidebar && songsSection) {
                if (isSameDestination && !songsSection.classList.contains('hidden')) {
                    songsSection.classList.add('hidden');
                } else {
                    document.getElementById('showAll')?.click();
                    sidebar.classList.add('hidden');
                    songsSection.classList.remove('hidden');
                }
            }
        } else if (destination === 'setlist') {
            closeMobileHomeDrawer();
            if (songsSection && isSameDestination && !songsSection.classList.contains('hidden')) {
                songsSection.classList.add('hidden');
            } else {
                const currentSetlist = mobileUIDeps?.getCurrentViewingSetlist?.();
                if (!currentSetlist) {
                    openMobileHomeDrawer(mobileUIDeps);
                } else if (mobileUIDeps?.getCurrentSetlistType?.() === 'global') {
                    mobileUIDeps.openGlobalSetlist?.(currentSetlist._id);
                } else if (mobileUIDeps?.getCurrentSetlistType?.() === 'my') {
                    mobileUIDeps.openMySetlist?.(currentSetlist._id);
                } else if (mobileUIDeps?.getCurrentSetlistType?.() === 'smart') {
                    mobileUIDeps.openSmartSetlist?.(currentSetlist.id || currentSetlist._id);
                }
                sidebar?.classList.add('hidden');
                songsSection?.classList.remove('hidden');
            }
        }

        updatePositions();
    }

    function updateMobileSetlistDrawerTitle(deps) {
        return deps?.getCurrentViewingSetlist?.() || null;
    }

    function openMobileSetlistDrawer(deps) {
        const section = document.getElementById('setlistSection');
        if (!section) return;

        if (!deps?.getCurrentViewingSetlist?.()) {
            deps?.showNotification?.('Please select a setlist first');
            return;
        }

        closeMobileHomeDrawer();
        updateMobileSetlistDrawerTitle(deps);
        section.style.display = 'block';
        document.querySelector('.sidebar')?.classList.add('hidden');
        document.querySelector('.songs-section')?.classList.remove('hidden');
        document.querySelector('.preview-section')?.classList.remove('full-width');
        updatePositions();
    }

    function closeMobileSetlistDrawer() {
        closeMobileHomeDrawer();
    }

    function openMobileHomeDrawer(deps) {
        const sidebar = document.querySelector('.sidebar');
        const songsSection = document.querySelector('.songs-section');
        const previewSection = document.querySelector('.preview-section');
        const backdrop = document.getElementById('mobileHomeBackdrop');
        if (!sidebar || !songsSection || !backdrop) return;

        if (!document.body.dataset.mobileHomeState) {
            document.body.dataset.mobileHomeState = JSON.stringify({
                sidebarHidden: sidebar.classList.contains('hidden'),
                songsHidden: songsSection.classList.contains('hidden'),
                sidebarScrollTop: sidebar.scrollTop,
                songsScrollTop: songsSection.scrollTop,
                previewScrollTop: previewSection ? previewSection.scrollTop : 0,
            });
        }

        songsSection.classList.add('hidden');
        sidebar.classList.remove('hidden');
        sidebar.classList.add('mobile-home-drawer-open');
        backdrop.classList.add('open');
        backdrop.setAttribute('aria-hidden', 'false');
        document.body.classList.add('mobile-home-open');
    }

    function closeMobileHomeDrawer() {
        const sidebar = document.querySelector('.sidebar');
        const songsSection = document.querySelector('.songs-section');
        const previewSection = document.querySelector('.preview-section');
        const backdrop = document.getElementById('mobileHomeBackdrop');
        if (!sidebar || !songsSection || !backdrop) return;

        const savedState = document.body.dataset.mobileHomeState;
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                sidebar.classList.add('hidden');
                songsSection.classList.add('hidden');
                sidebar.scrollTop = state.sidebarScrollTop || 0;
                songsSection.scrollTop = state.songsScrollTop || 0;
                if (previewSection) previewSection.scrollTop = state.previewScrollTop || 0;
            } catch (error) {
                sidebar.classList.add('hidden');
            }
        } else {
            sidebar.classList.add('hidden');
            songsSection.classList.add('hidden');
        }

        sidebar.classList.remove('mobile-home-drawer-open');
        backdrop.classList.remove('open');
        backdrop.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('mobile-home-open');
        delete document.body.dataset.mobileHomeState;
        updatePositions();
    }

    function getMobileSelectedSetlist() {
        const dropdown = document.getElementById('setlistDropdown');
        if (!dropdown || !dropdown.value) return null;

        const option = dropdown.options[dropdown.selectedIndex];
        const name = option ? option.textContent.replace(/\s*\((My|Global)\)\s*$/, '').trim() : 'Active setlist';
        return { value: dropdown.value, name };
    }

    function updateMobileFilterLabel() {
        const label = document.getElementById('mobileFiltersLabel');
        if (!label) return;

        const filterIds = ['keyFilter', 'genreFilter', 'moodFilter', 'artistFilter'];
        const activeCount = filterIds.reduce((count, id) => {
            const select = document.getElementById(id);
            if (!select || !select.value || ['Key', 'Genre', 'Mood', 'Artist'].includes(select.value)) return count;
            return count + 1;
        }, 0);
        label.textContent = `Filters · ${activeCount} active`;
    }

    function updateMobileSelectionBar() {
        const summary = document.getElementById('mobileSelectionSummary');
        const action = document.getElementById('mobileSelectionAction');
        if (!summary || !action) return;

        const count = mobileCatalogueState.selectedSongIds.size;
        const activeSetlist = getMobileSelectedSetlist();
        if (!count) {
            summary.textContent = activeSetlist ? `Add songs to ${activeSetlist.name}` : 'Select songs to add';
            action.textContent = activeSetlist ? `Add songs to ${activeSetlist.name}` : 'Select a setlist';
            action.disabled = !activeSetlist;
            return;
        }

        summary.textContent = activeSetlist ? `${count} selected` : 'Select a setlist to add songs';
        action.textContent = activeSetlist ? `Add ${count} songs to ${activeSetlist.name}` : 'Select a setlist';
        action.disabled = false;
    }

    function decorateMobileSongRows() {
        const rows = document.querySelectorAll('#NewContent .song-item, #OldContent .song-item');
        rows.forEach((row) => {
            const songId = Number(row.dataset.songId);
            const setlistButton = row.querySelector('.toggle-setlist');
            const isInSetlist = setlistButton?.classList.contains('btn-delete');
            if (setlistButton) {
                const buttonText = isInSetlist ? '−' : '+';
                const buttonLabel = isInSetlist ? 'Remove from active setlist' : 'Add to active setlist';
                if (setlistButton.textContent !== buttonText) setlistButton.textContent = buttonText;
                if (setlistButton.getAttribute('aria-label') !== buttonLabel) setlistButton.setAttribute('aria-label', buttonLabel);
                if (setlistButton.title !== buttonLabel) setlistButton.title = buttonLabel;
            }

            let selectControl = row.querySelector('.mobile-song-select-control');
            if (!selectControl) {
                selectControl = document.createElement('label');
                selectControl.className = 'mobile-song-select-control';
                selectControl.title = 'Select song';
                const input = document.createElement('input');
                input.type = 'checkbox';
                input.className = 'mobile-song-select';
                input.addEventListener('click', (event) => event.stopPropagation());
                input.addEventListener('change', (event) => {
                    if (event.target.checked) mobileCatalogueState.selectedSongIds.add(songId);
                    else mobileCatalogueState.selectedSongIds.delete(songId);
                    row.classList.toggle('mobile-selected', event.target.checked);
                    updateMobileSelectionBar();
                });
                selectControl.appendChild(input);
                const title = row.querySelector('.song-title');
                if (title) title.before(selectControl);
                else row.prepend(selectControl);
            }

            const input = selectControl.querySelector('input');
            if (input) {
                if (input.disabled !== isInSetlist) input.disabled = isInSetlist;
                const isSelected = mobileCatalogueState.selectedSongIds.has(songId) && !isInSetlist;
                if (input.checked !== isSelected) input.checked = isSelected;
                if (row.classList.contains('mobile-selected') !== isSelected) row.classList.toggle('mobile-selected', isSelected);
                if (isInSetlist) mobileCatalogueState.selectedSongIds.delete(songId);
            }
        });
        updateMobileSelectionBar();
    }

    function setMobileSelectMode(enabled) {
        mobileCatalogueState.selectMode = enabled;
        document.body.classList.toggle('mobile-select-mode', enabled);
        const toggle = document.getElementById('mobileSelectToggle');
        if (toggle) {
            toggle.classList.toggle('active', enabled);
            toggle.setAttribute('aria-pressed', String(enabled));
            const label = toggle.querySelector('span');
            if (label) label.textContent = enabled ? 'Done' : 'Select';
        }
        if (!enabled) {
            mobileCatalogueState.selectedSongIds.clear();
            document.querySelectorAll('.mobile-song-select').forEach((input) => {
                input.checked = false;
            });
            document.querySelectorAll('.song-item.mobile-selected').forEach((row) => row.classList.remove('mobile-selected'));
        }
        updateMobileSelectionBar();
    }

    function addSelectedMobileSongs() {
        const activeSetlist = getMobileSelectedSetlist();
        if (!activeSetlist) {
            mobileUIDeps?.showNotification?.('Please select a setlist from the Home menu first');
            openMobileHomeDrawer(mobileUIDeps);
            return;
        }

        const selectedIds = Array.from(mobileCatalogueState.selectedSongIds);
        selectedIds.forEach((songId) => {
            if (typeof mobileUIDeps?.addToSpecificSetlist === 'function') {
                mobileUIDeps.addToSpecificSetlist(songId, activeSetlist.value);
            }
        });
        setMobileSelectMode(false);
    }

    function setupMobileCatalogue() {
        if (mobileCatalogueState.bound) return;
        mobileCatalogueState.bound = true;

        const songsSection = document.querySelector('.songs-section');
        const filtersToggle = document.getElementById('mobileFiltersToggle');
        const sortToggle = document.getElementById('mobileSortToggle');
        const filtersBackdrop = document.getElementById('mobileFiltersBackdrop');
        const selectToggle = document.getElementById('mobileSelectToggle');
        const selectionAction = document.getElementById('mobileSelectionAction');
        const sortFilter = document.getElementById('sortFilter');
        const setlistDropdown = document.getElementById('setlistDropdown');

        const closeFilters = () => {
            songsSection?.classList.remove('mobile-filters-open');
            filtersToggle?.setAttribute('aria-expanded', 'false');
        };
        filtersToggle?.addEventListener('click', () => {
            const isOpen = songsSection?.classList.toggle('mobile-filters-open');
            filtersToggle.setAttribute('aria-expanded', String(Boolean(isOpen)));
        });
        filtersBackdrop?.addEventListener('click', closeFilters);
        sortToggle?.addEventListener('click', () => {
            songsSection?.classList.add('mobile-filters-open');
            filtersToggle?.setAttribute('aria-expanded', 'true');
            sortFilter?.focus();
        });
        selectToggle?.addEventListener('click', () => setMobileSelectMode(!mobileCatalogueState.selectMode));
        selectionAction?.addEventListener('click', addSelectedMobileSongs);
        setlistDropdown?.addEventListener('change', () => {
            updateMobileSelectionBar();
        });
        ['keyFilter', 'genreFilter', 'moodFilter', 'artistFilter'].forEach((id) => {
            document.getElementById(id)?.addEventListener('change', updateMobileFilterLabel);
        });

        ['NewContent', 'OldContent'].forEach((id) => {
            const content = document.getElementById(id);
            if (!content) return;
            const observer = new MutationObserver(decorateMobileSongRows);
            observer.observe(content, { childList: true, subtree: true });
            mobileCatalogueState.observer = observer;
        });
        updateMobileFilterLabel();
        decorateMobileSongRows();
    }

    function createMobileModernShell() {
        const shell = document.getElementById('mobileModernShell');
        if (!shell || shell.dataset.bound === 'true') return;

        shell.dataset.bound = 'true';
        document.body.classList.toggle('mobile-modern-mode', window.innerWidth <= 768);

        if (document.body.dataset.mobileModernResizeBound !== 'true') {
            document.body.dataset.mobileModernResizeBound = 'true';
            window.addEventListener('resize', () => {
                document.body.classList.toggle('mobile-modern-mode', window.innerWidth <= 768);
            });
        }

        shell.querySelectorAll('[data-mobile-destination]').forEach((item) => {
            item.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                activateMobileModernDestination(item.dataset.mobileDestination);
            });
        });

        const closeButton = document.getElementById('mobileHomeClose');
        const backdrop = document.getElementById('mobileHomeBackdrop');
        const setlistDropdown = document.getElementById('setlistDropdown');
        const setlistCloseButton = document.getElementById('mobileSetlistClose');
        const setlistBackdrop = document.getElementById('mobileSetlistBackdrop');
        const showAllButton = document.getElementById('showAll');
        const showFavoritesButton = document.getElementById('showFavorites');
        closeButton?.addEventListener('click', closeMobileHomeDrawer);
        backdrop?.addEventListener('click', closeMobileHomeDrawer);
        showAllButton?.addEventListener('click', closeMobileHomeDrawer, true);
        showFavoritesButton?.addEventListener('click', closeMobileHomeDrawer, true);
        setlistCloseButton?.addEventListener('click', closeMobileSetlistDrawer);
        setlistBackdrop?.addEventListener('click', closeMobileSetlistDrawer);
        if (setlistDropdown && setlistDropdown.dataset.mobileHomeBound !== 'true') {
            setlistDropdown.dataset.mobileHomeBound = 'true';
            setlistDropdown.addEventListener('change', () => closeMobileHomeDrawer(), true);
        }

        ['globalSetlistContent', 'mySetlistContent', 'smartSetlistContent'].forEach((id) => {
            const content = document.getElementById(id);
            if (!content || content.dataset.mobileSetlistBound === 'true') return;
            content.dataset.mobileSetlistBound = 'true';
            content.addEventListener('click', (event) => {
                const item = event.target.closest('.setlist-item');
                if (!item) return;
                event.preventDefault();
                event.stopImmediatePropagation();
                closeMobileHomeDrawer();
                if (id === 'smartSetlistContent') {
                    mobileUIDeps?.openSmartSetlist?.(item.dataset.setlistId);
                } else if (id === 'globalSetlistContent') {
                    mobileUIDeps?.openGlobalSetlist?.(item.dataset.setlistId);
                } else if (id === 'mySetlistContent') {
                    mobileUIDeps?.openMySetlist?.(item.dataset.setlistId);
                }
                window.setTimeout(() => {
                    document.querySelector('.songs-section')?.classList.remove('hidden');
                    document.getElementById('setlistSection').style.display = 'block';
                }, 0);
            }, true);
        });

        if (window.innerWidth <= 768) {
            activateMobileModernDestination('home');
        }
    }

    function makeToggleDraggable(id) {
        const el = document.getElementById(id);
        if (!el || el._isDraggableInitialized) return;
        el._isDraggableInitialized = true;

        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;
        let dragStarted = false;

        const savePosition = () => {
            const pos = { top: el.style.top, left: el.style.left, right: el.style.right, bottom: el.style.bottom };
            localStorage.setItem(id + '-pos', JSON.stringify(pos));
        };

        const snapToEdge = () => {
            const rect = el.getBoundingClientRect();
            const winW = window.innerWidth;
            const winH = window.innerHeight;
            const gap = 15;
            const btnSize = rect.width || 36;

            let left = Math.max(gap, Math.min(rect.left, winW - btnSize - gap));
            let top = Math.max(gap, Math.min(rect.top, winH - btnSize - gap));

            const allButtons = document.querySelectorAll('.panel-toggle.draggable');
            for (const otherBtn of allButtons) {
                if (otherBtn === el) continue;
                const otherRect = otherBtn.getBoundingClientRect();
                if (left < otherRect.right &&
                    left + btnSize > otherRect.left &&
                    top < otherRect.bottom &&
                    top + btnSize > otherRect.top) {
                    left = otherRect.right + gap;
                    if (left > winW - btnSize - gap) {
                        left = gap;
                        top = otherRect.bottom + gap;
                        if (top > winH - btnSize - gap) top = gap;
                    }
                }
            }

            el.style.left = left + 'px';
            el.style.top = top + 'px';
            el.style.right = '';
            el.style.bottom = '';
            savePosition();
        };

        const restorePosition = () => {
            const saved = localStorage.getItem(id + '-pos');
            const minPadding = 20;
            const btnSize = 36;
            const spacing = 60;
            const allIds = ['toggle-sidebar', 'toggle-songs', 'toggle-all-panels'];
            const idx = allIds.indexOf(id);

            if (saved) {
                let pos;
                try {
                    pos = JSON.parse(saved);
                } catch (error) {
                    return;
                }
                let top = parseInt(pos.top, 10) || minPadding;
                let left = parseInt(pos.left, 10) || '';
                const right = parseInt(pos.right, 10) || '';
                const bottom = parseInt(pos.bottom, 10) || '';

                top = Math.max(minPadding, Math.min(top, window.innerHeight - btnSize - minPadding));
                if (left !== '') {
                    left = Math.max(minPadding, Math.min(left, window.innerWidth - btnSize - minPadding));
                }
                el.style.top = top + 'px';
                el.style.left = left !== '' ? left + 'px' : '';
                el.style.right = right !== '' ? right + 'px' : '';
                el.style.bottom = bottom !== '' ? bottom + 'px' : '';
            } else {
                const centerY = Math.floor(window.innerHeight / 2);
                const totalHeight = allIds.length * btnSize + (allIds.length - 1) * spacing;
                const startY = centerY - Math.floor(totalHeight / 2);
                el.style.top = Math.max(minPadding, startY + idx * (btnSize + spacing)) + 'px';
                el.style.left = '';
                el.style.right = minPadding + 'px';
                el.style.bottom = '';
            }
        };

        const onMove = (clientX, clientY) => {
            if (!isDragging) return;
            dragStarted = true;
            el.style.left = clientX - offsetX + 'px';
            el.style.top = clientY - offsetY + 'px';
            el.style.right = '';
            el.style.bottom = '';
        };

        const onEnd = () => {
            if (isDragging && dragStarted) {
                snapToEdge();
                el._wasDragged = true;
                setTimeout(() => {
                    el._wasDragged = false;
                }, 100);
            }
            isDragging = false;
            dragStarted = false;
            document.body.style.userSelect = '';
        };

        el.addEventListener('mousedown', (event) => {
            event.preventDefault();
            isDragging = true;
            dragStarted = false;
            const rect = el.getBoundingClientRect();
            offsetX = event.clientX - rect.left;
            offsetY = event.clientY - rect.top;
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (event) => {
            if (isDragging) onMove(event.clientX, event.clientY);
        });
        document.addEventListener('mouseup', onEnd);

        el.addEventListener('touchstart', (event) => {
            isDragging = true;
            dragStarted = false;
            const touch = event.touches[0];
            const rect = el.getBoundingClientRect();
            offsetX = touch.clientX - rect.left;
            offsetY = touch.clientY - rect.top;
        }, { passive: false });

        el.addEventListener('touchmove', (event) => {
            if (!isDragging) return;
            const touch = event.touches[0];
            onMove(touch.clientX, touch.clientY);
            event.preventDefault();
        }, { passive: false });

        el.addEventListener('touchend', onEnd);
        window.addEventListener('resize', snapToEdge);

        restorePosition();

        let timeout;
        const showTemporarily = () => {
            el.classList.add('showing');
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                el.classList.remove('showing');
            }, 3000);
        };

        el.addEventListener('mouseenter', () => el.classList.add('showing'));
        el.addEventListener('mouseleave', () => el.classList.remove('showing'));
        el.addEventListener('touchstart', showTemporarily, { passive: true });
    }

    function initializeMobileUI(deps) {
        mobileUIDeps = deps || null;
        createMobileNavButtons();
        createMobileModernShell();
        setupMobileCatalogue();
        if (window.innerWidth <= 768) {
            addMobileTouchNavigation();
        }
        makeToggleDraggable('toggle-sidebar');
        makeToggleDraggable('toggle-songs');
        makeToggleDraggable('toggle-all-panels');

        if (document.body.dataset.mobileUiResizeBound !== 'true') {
            document.body.dataset.mobileUiResizeBound = 'true';
            window.addEventListener('resize', () => {
                document.body.classList.toggle('mobile-modern-mode', window.innerWidth <= 768);
                const existingContainer = document.querySelector('.mobile-nav-container');
                if (existingContainer) {
                    existingContainer.remove();
                }
                createMobileNavButtons();
                createMobileModernShell();
                const toggleButtonsVisibility = localStorage.getItem('toggleButtonsVisibility') || 'hide';
                deps.applyToggleButtonsVisibility(toggleButtonsVisibility);
            });
        }
    }

    window.MobileUI = {
        updatePositions,
        addMobileTouchNavigation,
        createMobileNavButtons,
        createMobileModernShell,
        activateMobileModernDestination,
        openMobileHomeDrawer,
        closeMobileHomeDrawer,
        openMobileSetlistDrawer,
        closeMobileSetlistDrawer,
        makeToggleDraggable,
        initializeMobileUI,
    };
})(window);