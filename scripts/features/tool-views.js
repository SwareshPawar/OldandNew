(function attachToolViews(window) {
    if (!window) return;

    const TOOL_NAMES = new Set(['metronome', 'pads', 'tuner']);
    const APP_TITLE = document.title;
    let activeTool = null;
    let previousAppState = null;
    let previousAppUrl = null;

    function toolSectionFor(name) {
        if (!TOOL_NAMES.has(name)) return null;
        return document.querySelector(`[data-tool-view="${name}"]`);
    }

    function getToolNameFromQuery() {
        const params = new URLSearchParams(window.location.search);
        const queryTool = params.get('tool');
        if (queryTool && TOOL_NAMES.has(queryTool)) return queryTool;

        const hashValue = window.location.hash.replace(/^#/, '');
        if (!hashValue) return null;

        const hashParams = new URLSearchParams(hashValue.startsWith('tool=') ? hashValue : `tool=${hashValue}`);
        const hashTool = hashParams.get('tool');
        return hashTool && TOOL_NAMES.has(hashTool) ? hashTool : null;
    }

    function updateToolLinkState(nextTool) {
        document.querySelectorAll('[data-tool-link]').forEach((link) => {
            const isActive = link.dataset.toolLink === nextTool;
            link.classList.toggle('active', isActive);
            link.setAttribute('aria-current', isActive ? 'page' : 'false');
        });
    }

    function closeToolsMenu() {
        const toggle = document.getElementById('mobileToolsToggle');
        const menu = document.getElementById('mobileToolsMenu');
        toggle?.classList.remove('active');
        toggle?.setAttribute('aria-expanded', 'false');
        menu?.classList.remove('open');
        menu?.setAttribute('aria-hidden', 'true');
    }

    function setSectionVisibility(section, isVisible) {
        if (!section) return;
        if (isVisible) section.removeAttribute('hidden');
        else section.setAttribute('hidden', 'hidden');
    }

    function restoreAppState() {
        if (!previousAppState) return;

        const sidebar = document.querySelector('.sidebar');
        const songsSection = document.querySelector('.songs-section');
        const previewSection = document.querySelector('.preview-section');

        if (sidebar) {
            sidebar.classList.toggle('hidden', previousAppState.sidebarHidden);
            sidebar.classList.remove('mobile-home-drawer-open');
        }
        if (songsSection) {
            songsSection.classList.toggle('hidden', previousAppState.songsHidden);
        }
        if (previewSection) {
            previewSection.classList.toggle('hidden', previousAppState.previewHidden);
        }

        previousAppState = null;
    }

    function hideAppPanels() {
        const sidebar = document.querySelector('.sidebar');
        const songsSection = document.querySelector('.songs-section');
        const previewSection = document.querySelector('.preview-section');

        previousAppState = {
            sidebarHidden: !!sidebar?.classList.contains('hidden'),
            songsHidden: !!songsSection?.classList.contains('hidden'),
            previewHidden: !!previewSection?.classList.contains('hidden')
        };

        if (sidebar) sidebar.classList.add('hidden');
        if (songsSection) songsSection.classList.add('hidden');
        if (previewSection) previewSection.classList.add('hidden');
    }

    function beginToolCleanup(name) {
        if (name === 'tuner') {
            if (window.TunePitchTool && typeof window.TunePitchTool.cleanup === 'function') {
                window.TunePitchTool.cleanup();
            }
        }
    }

    function getAppUrl(sourceUrl = window.location.href) {
        const appUrl = new URL(sourceUrl);
        appUrl.searchParams.delete('tool');
        if (/^#(?:tool=)?(?:metronome|pads|tuner)$/.test(appUrl.hash)) {
            appUrl.hash = '';
        }
        return appUrl;
    }

    function showToolView(name, options = {}) {
        const normalisedName = TOOL_NAMES.has(name) ? name : null;
        if (!normalisedName) return;

        const section = toolSectionFor(normalisedName);
        if (!section) return;

        const currentlyActive = activeTool;
        if (currentlyActive && currentlyActive !== normalisedName) {
            beginToolCleanup(currentlyActive);
            const currentSection = toolSectionFor(currentlyActive);
            if (currentSection) setSectionVisibility(currentSection, false);
        }

        document.querySelectorAll('[data-tool-view]').forEach((item) => {
            setSectionVisibility(item, item === section);
        });

        if (!previousAppState) {
            previousAppUrl = window.history.state?.returnUrl
                ? new URL(window.history.state.returnUrl, window.location.href)
                : getAppUrl();
            hideAppPanels();
        }

        activeTool = normalisedName;
        document.body.classList.add('tool-view-active');
        updateToolLinkState(normalisedName);
        closeToolsMenu();

        if (options.updateHistory !== false && currentlyActive !== normalisedName) {
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.set('tool', normalisedName);
            currentUrl.hash = `tool=${normalisedName}`;
            history.pushState({
                tool: normalisedName,
                returnUrl: previousAppUrl?.href || getAppUrl().href
            }, '', currentUrl);
        }

        document.title = normalisedName === 'tuner'
            ? 'Tune & Pitch - New & Old'
            : normalisedName === 'pads'
                ? 'Pads & Tanpura - New & Old'
                : 'Metronome - New & Old';
    }

    function hideToolView(options = {}) {
        if (!activeTool) return;

        beginToolCleanup(activeTool);

        document.querySelectorAll('[data-tool-view]').forEach((item) => setSectionVisibility(item, false));
        activeTool = null;
        document.body.classList.remove('tool-view-active');
        updateToolLinkState(null);
        restoreAppState();
        closeToolsMenu();
        document.title = APP_TITLE;

        if (options.updateHistory !== false) {
            history.pushState({ tool: null }, '', previousAppUrl || getAppUrl());
        }
        previousAppUrl = null;
    }

    function handleToolLinkClick(event) {
        const link = event.currentTarget;
        const toolName = link.dataset.toolLink;
        if (!toolName) return;
        event.preventDefault();
        event.stopPropagation();
        if (activeTool === toolName) {
            hideToolView();
            return;
        }
        showToolView(toolName);
    }

    function initializeToolLinks() {
        document.querySelectorAll('[data-tool-link]').forEach((link) => {
            if (link.dataset.toolBound === 'true') return;
            link.dataset.toolBound = 'true';
            link.addEventListener('click', handleToolLinkClick);
        });
    }

    function initialize() {
        initializeToolLinks();

        const initialTool = getToolNameFromQuery();
        if (initialTool) {
            showToolView(initialTool, { updateHistory: false });
            return;
        }

        document.querySelectorAll('[data-tool-view]').forEach((section) => setSectionVisibility(section, false));
        document.body.classList.remove('tool-view-active');
        updateToolLinkState(null);
    }

    window.addEventListener('popstate', () => {
        const toolFromState = window.history.state?.tool;
        const toolFromUrl = getToolNameFromQuery();
        const nextTool = toolFromState || toolFromUrl;

        if (!nextTool) {
            if (activeTool) hideToolView({ updateHistory: false });
            return;
        }

        showToolView(nextTool, { updateHistory: false });
    });

    document.addEventListener('DOMContentLoaded', initialize);

    window.ToolViews = {
        showToolView,
        hideToolView,
        activeTool: () => activeTool,
        initialize
    };
})(window);
