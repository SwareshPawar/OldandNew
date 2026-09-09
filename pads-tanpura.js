// pads-tanpura.js
// Standalone key-driven Atmosphere/Tanpura pad player, reusing the existing LoopPlayerPad audio engine.
// Declared here (top-level, outside the IIFE below) so loop-player-pad.js's own
// `typeof API_BASE_URL` check can see it - matches the resolution used by the main app,
// so melodic sample URLs resolve correctly in production too, not just on localhost.
const API_BASE_URL = window.AppApiBase ? window.AppApiBase.resolve() : window.location.origin;

(function () {
    'use strict';

    const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    let player = null;
    let selectedKey = 'C';
    let lastLoadedKey = null;

    function initMobileShell() {
        const applyMode = () => document.body.classList.toggle('mobile-modern-mode', window.innerWidth <= 768);
        applyMode();
        window.addEventListener('resize', applyMode);

        const toggle = document.getElementById('mobileToolsToggle');
        const menu = document.getElementById('mobileToolsMenu');
        if (!toggle || !menu) return;

        toggle.addEventListener('click', (event) => {
            event.stopPropagation();
            const isOpen = menu.classList.toggle('open');
            toggle.setAttribute('aria-expanded', String(isOpen));
            menu.setAttribute('aria-hidden', String(!isOpen));
        });
        document.addEventListener('click', (event) => {
            if (!menu.classList.contains('open')) return;
            if (event.target.closest('#mobileToolsMenu') || event.target.closest('#mobileToolsToggle')) return;
            menu.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
            menu.setAttribute('aria-hidden', 'true');
        });
    }

    // Mirrors the existing rhythm/loop player pattern: never create the AudioContext
    // ahead of time. Its own toggleAtmosphere/toggleTanpura calls create and resume
    // the context lazily, inside the real click, so autoplay restrictions don't block audio.
    function ensurePlayer() {
        if (player) return player;

        player = new LoopPlayerPad();
        player.onMelodicPadToggle = (padType, isPlaying) => {
            const btn = document.getElementById(padType === 'atmosphere' ? 'padAtmosphere' : 'padTanpura');
            if (!btn) return;
            btn.classList.toggle('playing', isPlaying);
            btn.querySelector('.pads-pad-state').textContent = isPlaying ? 'Playing...' : 'Tap to Play';
        };
        player.onMelodicError = (padType, error) => {
            console.warn(`Melodic pad error (${padType}):`, error);
            const hint = document.getElementById('padsAvailabilityHint');
            if (hint) hint.textContent = `Could not play ${padType} for this key.`;
        };
        return player;
    }

    async function refreshAvailability() {
        const p = await ensurePlayer();
        const availability = await p.checkMelodicAvailability(['atmosphere', 'tanpura']);
        const atmBtn = document.getElementById('padAtmosphere');
        const tanBtn = document.getElementById('padTanpura');
        const hint = document.getElementById('padsAvailabilityHint');

        if (atmBtn) atmBtn.classList.toggle('unavailable', !availability.atmosphere);
        if (tanBtn) tanBtn.classList.toggle('unavailable', !availability.tanpura);

        if (hint) {
            if (!availability.atmosphere && !availability.tanpura) {
                hint.textContent = `No pads uploaded yet for key ${selectedKey}.`;
            } else if (!availability.atmosphere) {
                hint.textContent = `Atmosphere pad not available for key ${selectedKey}.`;
            } else if (!availability.tanpura) {
                hint.textContent = `Tanpura not available for key ${selectedKey}.`;
            } else {
                hint.textContent = '';
            }
        }
    }

    async function selectKey(key) {
        selectedKey = key;
        document.querySelectorAll('.pads-key-btn').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.key === key);
        });
        const currentKeyLabel = document.getElementById('padsCurrentKeyLabel');
        if (currentKeyLabel) currentKeyLabel.textContent = key;

        if (key === lastLoadedKey) return; // already on this key; keep any playing pad untouched
        lastLoadedKey = key;

        const p = ensurePlayer();
        // Keep pads playing across a key change: remember what was on, let
        // setSongKeyAndTranspose swap the samples (it stops pads internally only
        // when the key actually differs), then resume playback in the new key.
        const wasAtmospherePlaying = p.melodicPads.atmosphere.isPlaying;
        const wasTanpuraPlaying = p.melodicPads.tanpura.isPlaying;

        await p.setSongKeyAndTranspose(key, 0, true);
        await refreshAvailability();

        if (wasAtmospherePlaying) await p.toggleAtmosphere();
        if (wasTanpuraPlaying) await p.toggleTanpura();
    }

    async function toggleAtmosphere() {
        const p = await ensurePlayer();
        await p.toggleAtmosphere();
    }

    async function toggleTanpura() {
        const p = await ensurePlayer();
        await p.toggleTanpura();
    }

    function renderKeys() {
        const container = document.getElementById('padsKeySelector');
        if (!container) return;
        container.innerHTML = KEYS.map((key) => `
            <button type="button" class="pads-key-btn${key === selectedKey ? ' active' : ''}" data-key="${key}">${key}</button>
        `).join('');
        container.querySelectorAll('.pads-key-btn').forEach((btn) => {
            btn.addEventListener('click', () => selectKey(btn.dataset.key));
        });
    }

    // Use real browser back-navigation (not a fresh href) so the app tab can be
    // restored from bfcache instead of reloading and refetching everything. Falls back to a
    // direct navigation if history.back() turns out to be a no-op (e.g. no real prior entry).
    function goBackToApp() {
        const startHref = window.location.href;
        window.history.back();
        setTimeout(() => {
            if (window.location.href === startHref) {
                window.location.href = 'index.html';
            }
        }, 400);
    }

    document.addEventListener('DOMContentLoaded', () => {
        initMobileShell();
        renderKeys();

        document.getElementById('padAtmosphere')?.addEventListener('click', toggleAtmosphere);
        document.getElementById('padTanpura')?.addEventListener('click', toggleTanpura);
        document.getElementById('toolPageBack')?.addEventListener('click', goBackToApp);
        document.querySelectorAll('[data-tool-nav-back]').forEach((btn) => {
            btn.addEventListener('click', goBackToApp);
        });

        const volumeSlider = document.getElementById('padsVolume');
        const volumeValue = document.getElementById('padsVolumeValue');
        volumeSlider?.addEventListener('input', async (event) => {
            const value = parseInt(event.target.value, 10);
            if (volumeValue) volumeValue.textContent = `${value}%`;
            const p = await ensurePlayer();
            p.setMelodicVolume(value / 100);
        });

        selectKey(selectedKey);
    });

    window.addEventListener('beforeunload', () => {
        player?.stopAllMelodicPads?.();
    });
})();
