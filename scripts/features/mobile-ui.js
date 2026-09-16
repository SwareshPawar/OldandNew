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

        // The modern bottom nav (Home/Songs/Setlist/More) already covers navigation, and this
        // legacy edge-swipe gesture collides with the browser's native left-edge swipe-back
        // gesture, re-showing the sidebar right when the user swipes back.
        if (document.body.classList.contains('mobile-modern-mode')) return;

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

    function updateSuggestedToggleVisibility() {
        const toggle = document.getElementById('mobileSuggestedSongsToggle');
        const drawer = document.getElementById('suggestedSongsDrawer');
        const sidebar = document.querySelector('.sidebar');
        const songsSection = document.querySelector('.songs-section');
        const hasSongSelected = Boolean(document.getElementById('songPreview')?.dataset.songId);
        const panelOpen = (sidebar && !sidebar.classList.contains('hidden')) ||
            (songsSection && !songsSection.classList.contains('hidden'));

        if (!hasSongSelected || panelOpen) {
            window.closeSuggestedSongsDrawer?.();
            toggle?.setAttribute('hidden', '');
            // Force the drawer fully out of the DOM flow so it can't peek behind the panel or when no song is selected.
            drawer?.setAttribute('hidden', '');
        } else {
            drawer?.removeAttribute('hidden');
            toggle?.removeAttribute('hidden');
        }
    }

    window.updateSuggestedToggleVisibility = updateSuggestedToggleVisibility;

    function setNavDestinationActive(destination) {
        const navItems = document.querySelectorAll('[data-mobile-destination]');
        navItems.forEach((item) => {
            const isActive = item.dataset.mobileDestination === destination;
            item.classList.toggle('active', isActive);
            item.setAttribute('aria-current', isActive ? 'page' : 'false');
        });
    }

    function safeSetAriaHidden(element, isHidden) {
        if (!element) return;
        if (isHidden) {
            if (document.activeElement && (document.activeElement === element || element.contains(document.activeElement))) {
                document.activeElement.blur();
            }
            element.setAttribute('aria-hidden', 'true');
        } else {
            element.setAttribute('aria-hidden', 'false');
        }
    }

    function clearNavDestinationActive(destination) {
        const navItems = document.querySelectorAll('[data-mobile-destination]');
        navItems.forEach((item) => {
            if (!destination || item.dataset.mobileDestination === destination) {
                item.classList.remove('active');
                item.setAttribute('aria-current', 'false');
            }
        });
    }

    function openMobileSongsDrawer() {
        const sidebar = document.querySelector('.sidebar');
        const songsSection = document.querySelector('.songs-section');
        const setlistSection = document.getElementById('setlistSection');
        const backdrop = document.getElementById('mobileSongsBackdrop');
        if (!songsSection) return;

        closeMobileHomeDrawer();
        if (sidebar) sidebar.classList.add('hidden');
        if (setlistSection) setlistSection.style.display = 'none';

        songsSection.classList.remove('hidden');
        if (backdrop) {
            backdrop.classList.add('open');
            safeSetAriaHidden(backdrop, false);
        }
        document.body.classList.add('mobile-songs-open');
        document.body.classList.remove('mobile-setlist-open');
        setNavDestinationActive('songs');
        updatePositions();
        updateSuggestedToggleVisibility();
    }

    function closeMobileSongsDrawer() {
        const songsSection = document.querySelector('.songs-section');
        const backdrop = document.getElementById('mobileSongsBackdrop');
        if (songsSection) songsSection.classList.add('hidden');
        if (backdrop) {
            backdrop.classList.remove('open');
            safeSetAriaHidden(backdrop, true);
        }
        document.body.classList.remove('mobile-songs-open');
        clearNavDestinationActive('songs');
        updatePositions();
        updateSuggestedToggleVisibility();
    }

    function openMobileSetlistDrawer(deps) {
        const effectiveDeps = deps || mobileUIDeps;
        const currentSetlist = effectiveDeps?.getCurrentViewingSetlist?.();
        if (!currentSetlist) {
            effectiveDeps?.showNotification?.('Please select a setlist first');
            openMobileHomeDrawer(effectiveDeps);
            return;
        }

        const sidebar = document.querySelector('.sidebar');
        const songsSection = document.querySelector('.songs-section');
        const setlistSection = document.getElementById('setlistSection');
        const backdrop = document.getElementById('mobileSongsBackdrop');
        if (!songsSection) return;

        closeMobileHomeDrawer();
        if (sidebar) sidebar.classList.add('hidden');

        if (effectiveDeps?.getCurrentSetlistType?.() === 'global') {
            effectiveDeps.openGlobalSetlist?.(currentSetlist._id);
        } else if (effectiveDeps?.getCurrentSetlistType?.() === 'my') {
            effectiveDeps.openMySetlist?.(currentSetlist._id);
        } else if (effectiveDeps?.getCurrentSetlistType?.() === 'smart') {
            effectiveDeps.openSmartSetlist?.(currentSetlist.id || currentSetlist._id);
        }

        if (setlistSection) setlistSection.style.display = 'block';
        songsSection.classList.remove('hidden');
        if (backdrop) {
            backdrop.classList.add('open');
            safeSetAriaHidden(backdrop, false);
        }
        document.body.classList.add('mobile-setlist-open');
        document.body.classList.remove('mobile-songs-open');
        setNavDestinationActive('setlist');
        updatePositions();
        updateSuggestedToggleVisibility();
    }

    function closeMobileSetlistDrawer() {
        const songsSection = document.querySelector('.songs-section');
        const backdrop = document.getElementById('mobileSongsBackdrop');
        if (songsSection) songsSection.classList.add('hidden');
        if (backdrop) {
            backdrop.classList.remove('open');
            safeSetAriaHidden(backdrop, true);
        }
        document.body.classList.remove('mobile-setlist-open');
        clearNavDestinationActive('setlist');
        updatePositions();
        updateSuggestedToggleVisibility();
    }

    function closeAllMobileDrawers() {
        closeMobileHomeDrawer();
        closeMobileSongsDrawer();
        closeMobileSetlistDrawer();
    }

    function activateMobileModernDestination(destination) {
        window.closeSuggestedSongsDrawer?.();

        if (destination === 'home') {
            const sidebar = document.querySelector('.sidebar');
            const homeDrawerOpen = document.body.classList.contains('mobile-home-open') ||
                sidebar?.classList.contains('mobile-home-drawer-open');
            if (homeDrawerOpen) {
                closeMobileHomeDrawer();
            } else {
                closeMobileSongsDrawer();
                closeMobileSetlistDrawer();
                openMobileHomeDrawer();
            }
        } else if (destination === 'songs') {
            const songsSection = document.querySelector('.songs-section');
            const setlistSection = document.getElementById('setlistSection');
            const isSetlistVisible = setlistSection && setlistSection.style.display !== 'none';
            const favoritesSection = document.getElementById('favoritesSection');
            const isFavoritesVisible = favoritesSection && favoritesSection.style.display === 'block';
            const songsOpen = document.body.classList.contains('mobile-songs-open') ||
                (!songsSection?.classList.contains('hidden') && !isSetlistVisible && !isFavoritesVisible);
            if (songsOpen) {
                closeMobileSongsDrawer();
            } else {
                closeMobileHomeDrawer();
                closeMobileSetlistDrawer();
                document.getElementById('showAll')?.click();
                openMobileSongsDrawer();
            }
        } else if (destination === 'setlist') {
            const songsSection = document.querySelector('.songs-section');
            const setlistSection = document.getElementById('setlistSection');
            const isSetlistVisible = setlistSection && setlistSection.style.display === 'block';
            const setlistOpen = document.body.classList.contains('mobile-setlist-open') ||
                (!songsSection?.classList.contains('hidden') && isSetlistVisible);
            if (setlistOpen) {
                closeMobileSetlistDrawer();
            } else {
                closeMobileHomeDrawer();
                closeMobileSongsDrawer();
                openMobileSetlistDrawer(mobileUIDeps);
            }
        }
    }

    function updateMobileSetlistDrawerTitle(deps) {
        return deps?.getCurrentViewingSetlist?.() || null;
    }

    function openMobileHomeDrawer(deps) {
        const sidebar = document.querySelector('.sidebar');
        const songsSection = document.querySelector('.songs-section');
        const previewSection = document.querySelector('.preview-section');
        const backdrop = document.getElementById('mobileHomeBackdrop');
        if (!sidebar || !backdrop) return;

        closeMobileSongsDrawer();
        closeMobileSetlistDrawer();

        if (songsSection) songsSection.classList.add('hidden');
        sidebar.classList.remove('hidden');
        sidebar.classList.add('mobile-home-drawer-open');
        if (backdrop) {
            backdrop.classList.add('open');
            safeSetAriaHidden(backdrop, false);
        }
        document.body.classList.add('mobile-home-open');
        setNavDestinationActive('home');
        updatePositions();
        updateSuggestedToggleVisibility();
    }

    function closeMobileHomeDrawer() {
        const sidebar = document.querySelector('.sidebar');
        const backdrop = document.getElementById('mobileHomeBackdrop');
        if (!sidebar || !backdrop) return;

        sidebar.classList.add('hidden');
        sidebar.classList.remove('mobile-home-drawer-open');
        backdrop.classList.remove('open');
        safeSetAriaHidden(backdrop, true);
        document.body.classList.remove('mobile-home-open');
        clearNavDestinationActive('home');
        updatePositions();
        updateSuggestedToggleVisibility();
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
        const songsBackdrop = document.getElementById('mobileSongsBackdrop');
        const setlistDropdown = document.getElementById('setlistDropdown');
        const setlistCloseButton = document.getElementById('mobileSetlistClose');
        const setlistBackdrop = document.getElementById('mobileSetlistBackdrop');
        closeButton?.addEventListener('click', closeMobileHomeDrawer);
        backdrop?.addEventListener('click', closeMobileHomeDrawer);
        songsBackdrop?.addEventListener('click', () => {
            closeMobileSongsDrawer();
            closeMobileSetlistDrawer();
        });
        // True document-level capture so this runs before the target's own bubble-phase
        // handler (registering directly on #showAll/#showFavorites does not guarantee order).
        document.addEventListener('click', (event) => {
            if (event.target.closest('#showAll')) {
                closeMobileHomeDrawer();
                if (window.innerWidth <= 768) {
                    openMobileSongsDrawer();
                }
            } else if (event.target.closest('#showFavorites')) {
                closeMobileHomeDrawer();
                if (window.innerWidth <= 768) {
                    openMobileSongsDrawer();
                }
            }
        }, true);
        setlistCloseButton?.addEventListener('click', closeMobileSetlistDrawer);
        setlistBackdrop?.addEventListener('click', closeMobileSetlistDrawer);
        if (setlistDropdown && setlistDropdown.dataset.mobileHomeBound !== 'true') {
            setlistDropdown.dataset.mobileHomeBound = 'true';
            setlistDropdown.addEventListener('change', () => closeMobileHomeDrawer(), true);
        }

        const toolsToggle = document.getElementById('mobileToolsToggle');
        const toolsMenu = document.getElementById('mobileToolsMenu');
        if (toolsToggle && toolsMenu) {
            toolsToggle.addEventListener('click', (event) => {
                event.stopPropagation();
                const isOpen = toolsMenu.classList.toggle('open');
                toolsToggle.setAttribute('aria-expanded', String(isOpen));
                safeSetAriaHidden(toolsMenu, !isOpen);
            });
            document.addEventListener('click', (event) => {
                if (!toolsMenu.classList.contains('open')) return;
                if (event.target.closest('#mobileToolsMenu') || event.target.closest('#mobileToolsToggle')) return;
                toolsMenu.classList.remove('open');
                toolsToggle.setAttribute('aria-expanded', 'false');
                safeSetAriaHidden(toolsMenu, true);
            });
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
                    openMobileSetlistDrawer(mobileUIDeps);
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
        openMobileSongsDrawer,
        closeMobileSongsDrawer,
        openMobileSetlistDrawer,
        closeMobileSetlistDrawer,
        closeAllMobileDrawers,
        makeToggleDraggable,
        initializeMobileUI,
        updateSuggestedToggleVisibility,
    };
})(window);