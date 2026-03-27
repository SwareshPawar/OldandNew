// scripts/features/mobile-ui.js
// Phase 3H extraction: mobile and panel UI helpers from main.js.
(function attachMobileUI(window) {
    if (!window) return;

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
        createMobileNavButtons();
        if (window.innerWidth <= 768) {
            addMobileTouchNavigation();
        }
        makeToggleDraggable('toggle-sidebar');
        makeToggleDraggable('toggle-songs');
        makeToggleDraggable('toggle-all-panels');

        if (document.body.dataset.mobileUiResizeBound !== 'true') {
            document.body.dataset.mobileUiResizeBound = 'true';
            window.addEventListener('resize', () => {
                const existingContainer = document.querySelector('.mobile-nav-container');
                if (existingContainer) {
                    existingContainer.remove();
                }
                createMobileNavButtons();
                const toggleButtonsVisibility = localStorage.getItem('toggleButtonsVisibility') || 'hide';
                deps.applyToggleButtonsVisibility(toggleButtonsVisibility);
            });
        }
    }

    window.MobileUI = {
        updatePositions,
        addMobileTouchNavigation,
        createMobileNavButtons,
        makeToggleDraggable,
        initializeMobileUI,
    };
})(window);