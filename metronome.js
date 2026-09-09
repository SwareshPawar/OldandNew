// metronome.js
// Standalone Metronome/Tap Tempo practice tool page.
(function () {
    'use strict';

    const MIN_BPM = 40;
    const MAX_BPM = 220;
    const DEFAULT_BPM = 96;

    let bpm = DEFAULT_BPM;
    let accentEnabled = true;

    let audioContext = null;
    let schedulerTimerId = null;
    let nextNoteTime = 0;
    let beatIndex = 0;
    const lookaheadMs = 25;
    const scheduleAheadTime = 0.1;

    let tapTimes = [];

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

    function setBpm(nextBpm) {
        bpm = Math.max(MIN_BPM, Math.min(MAX_BPM, Math.round(nextBpm)));
        const bpmEl = document.getElementById('metronomeBpm');
        const sliderEl = document.getElementById('metronomeSlider');
        if (bpmEl) bpmEl.textContent = bpm;
        if (sliderEl) sliderEl.value = bpm;
        document.querySelectorAll('.metronome-quick-btn').forEach((btn) => {
            btn.classList.toggle('active', parseInt(btn.dataset.bpm, 10) === bpm);
        });
    }

    function getBeatsPerMeasure() {
        const el = document.getElementById('metronomeTimeSignature');
        return el ? parseInt(el.value, 10) || 4 : 4;
    }

    function getSubdivision() {
        const el = document.getElementById('metronomeSubdivision');
        return el ? parseInt(el.value, 10) || 1 : 1;
    }

    function scheduleClick(time, isAccent, isBeatStart) {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = 'sine';
        osc.frequency.value = isAccent ? 1500 : (isBeatStart ? 1000 : 700);
        const peak = isAccent ? 0.5 : (isBeatStart ? 0.32 : 0.18);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(peak, time + 0.002);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.start(time);
        osc.stop(time + 0.06);
    }

    function scheduler() {
        const subdivision = getSubdivision();
        const beatsPerMeasure = getBeatsPerMeasure();
        const totalTicksPerMeasure = beatsPerMeasure * subdivision;

        while (nextNoteTime < audioContext.currentTime + scheduleAheadTime) {
            const isBeatStart = beatIndex % subdivision === 0;
            const isAccent = accentEnabled && beatIndex === 0;
            scheduleClick(nextNoteTime, isAccent, isBeatStart);

            const secondsPerTick = 60.0 / bpm / subdivision;
            nextNoteTime += secondsPerTick;
            beatIndex = (beatIndex + 1) % totalTicksPerMeasure;
        }
    }

    function startMetronome() {
        if (schedulerTimerId) return;
        audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        beatIndex = 0;
        nextNoteTime = audioContext.currentTime + 0.05;
        schedulerTimerId = setInterval(scheduler, lookaheadMs);

        const startBtn = document.getElementById('metronomeStartBtn');
        if (startBtn) {
            startBtn.classList.add('active');
            startBtn.innerHTML = '<i class="fas fa-stop" aria-hidden="true"></i><span>Stop</span>';
        }
    }

    function stopMetronome() {
        if (schedulerTimerId) {
            clearInterval(schedulerTimerId);
            schedulerTimerId = null;
        }
        const startBtn = document.getElementById('metronomeStartBtn');
        if (startBtn) {
            startBtn.classList.remove('active');
            startBtn.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i><span>Start</span>';
        }
    }

    function toggleMetronome() {
        if (schedulerTimerId) {
            stopMetronome();
        } else {
            startMetronome();
        }
    }

    function toggleAccent() {
        accentEnabled = !accentEnabled;
        document.getElementById('metronomeAccentBtn')?.classList.toggle('active', accentEnabled);
    }

    function resetMetronome() {
        stopMetronome();
        setBpm(DEFAULT_BPM);
        accentEnabled = true;
        document.getElementById('metronomeAccentBtn')?.classList.add('active');
        tapTimes = [];
    }

    function handleTap() {
        const now = Date.now();
        tapTimes.push(now);
        if (tapTimes.length > 6) tapTimes.shift();
        // Reset the tap sequence if the last tap was too long ago
        if (tapTimes.length > 1 && now - tapTimes[tapTimes.length - 2] > 2000) {
            tapTimes = [now];
        }
        if (tapTimes.length >= 2) {
            const intervals = [];
            for (let i = 1; i < tapTimes.length; i++) {
                intervals.push(tapTimes[i] - tapTimes[i - 1]);
            }
            const avgMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            setBpm(60000 / avgMs);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        initMobileShell();
        setBpm(DEFAULT_BPM);
        document.getElementById('metronomeAccentBtn')?.classList.add('active');

        document.getElementById('toolPageBack')?.addEventListener('click', goBackToApp);
        document.querySelectorAll('[data-tool-nav-back]').forEach((btn) => {
            btn.addEventListener('click', goBackToApp);
        });

        document.getElementById('metronomeMinus')?.addEventListener('click', () => setBpm(bpm - 1));
        document.getElementById('metronomePlus')?.addEventListener('click', () => setBpm(bpm + 1));
        document.getElementById('metronomeSlider')?.addEventListener('input', (event) => {
            setBpm(parseInt(event.target.value, 10));
        });

        document.getElementById('metronomeTapBtn')?.addEventListener('click', handleTap);
        document.getElementById('metronomeStartBtn')?.addEventListener('click', toggleMetronome);
        document.getElementById('metronomeAccentBtn')?.addEventListener('click', toggleAccent);
        document.getElementById('metronomeResetBtn')?.addEventListener('click', resetMetronome);

        document.querySelectorAll('.metronome-quick-btn').forEach((btn) => {
            btn.addEventListener('click', () => setBpm(parseInt(btn.dataset.bpm, 10)));
        });
    });

    window.addEventListener('beforeunload', () => {
        stopMetronome();
    });
})();
