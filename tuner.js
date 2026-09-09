// tuner.js
// Standalone guitar tuner page: microphone pitch detection + reference tone generator.
(function () {
    'use strict';

    const STANDARD_TUNING = [
        { note: 'E2', freq: 82.41 },
        { note: 'A2', freq: 110.00 },
        { note: 'D3', freq: 146.83 },
        { note: 'G3', freq: 196.00 },
        { note: 'B3', freq: 246.94 },
        { note: 'E4', freq: 329.63 }
    ];

    const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    // Mid octave (C4-B4) reference tones for the Tone Generator.
    const MID_OCTAVE_NOTES = NOTE_NAMES.map((name, index) => ({
        note: `${name}4`,
        freq: Math.round(440 * Math.pow(2, (index - 9) / 12) * 100) / 100
    }));

    let audioContext = null;
    let analyser = null;
    let micStream = null;
    let rafId = null;
    let toneOscillator = null;
    let toneGain = null;
    let activeToneButton = null;
    let smoothedFrequency = null;
    let lastDisplayUpdate = 0;

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

    function frequencyToNoteName(frequency) {
        const midi = Math.round(69 + 12 * Math.log2(frequency / 440));
        const octave = Math.floor(midi / 12) - 1;
        const name = NOTE_NAMES[((midi % 12) + 12) % 12];
        return `${name}${octave}`;
    }

    // Cents deviation from the nearest chromatic pitch, regardless of instrument/string -
    // this is what drives the in-tune (green) / out-of-tune (red) indicator for any note.
    function centsFromNearestNote(frequency) {
        const midi = 69 + 12 * Math.log2(frequency / 440);
        const rounded = Math.round(midi);
        return Math.round((midi - rounded) * 100);
    }

    function closestString(frequency) {
        let closest = STANDARD_TUNING[0];
        let smallestDiff = Infinity;
        STANDARD_TUNING.forEach((string) => {
            const diff = Math.abs(Math.log2(frequency / string.freq));
            if (diff < smallestDiff) {
                smallestDiff = diff;
                closest = string;
            }
        });
        return closest;
    }

    // Autocorrelation-based pitch detection (ACF2+ style), a common public-domain approach
    // for real-time single-note pitch tracking from a time-domain audio buffer.
    function autoCorrelate(buffer, sampleRate) {
        const size = buffer.length;
        let rms = 0;
        for (let i = 0; i < size; i++) {
            rms += buffer[i] * buffer[i];
        }
        rms = Math.sqrt(rms / size);
        if (rms < 0.01) return -1;

        let r1 = 0;
        let r2 = size - 1;
        const threshold = 0.2;
        for (let i = 0; i < size / 2; i++) {
            if (Math.abs(buffer[i]) < threshold) { r1 = i; break; }
        }
        for (let i = 1; i < size / 2; i++) {
            if (Math.abs(buffer[size - i]) < threshold) { r2 = size - i; break; }
        }

        const trimmed = buffer.slice(r1, r2);
        const newSize = trimmed.length;
        const c = new Array(newSize).fill(0);
        for (let lag = 0; lag < newSize; lag++) {
            for (let i = 0; i < newSize - lag; i++) {
                c[lag] += trimmed[i] * trimmed[i + lag];
            }
        }

        let d = 0;
        while (d < newSize - 1 && c[d] > c[d + 1]) d++;

        let maxVal = -1;
        let maxPos = -1;
        for (let i = d; i < newSize; i++) {
            if (c[i] > maxVal) {
                maxVal = c[i];
                maxPos = i;
            }
        }
        let t0 = maxPos;
        if (t0 <= 0) return -1;

        const x1 = c[t0 - 1] || 0;
        const x2 = c[t0] || 0;
        const x3 = c[t0 + 1] || 0;
        const a = (x1 + x3 - 2 * x2) / 2;
        const b = (x3 - x1) / 2;
        if (a) t0 -= b / (2 * a);

        return sampleRate / t0;
    }

    async function startMicTuner() {
        const statusEl = document.getElementById('tunerStatus');
        if (micStream) return;

        try {
            micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (error) {
            if (statusEl) statusEl.textContent = 'Microphone access denied. Try the Tone Generator instead.';
            return;
        }

        audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(micStream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);

        const buffer = new Float32Array(analyser.fftSize);
        if (statusEl) statusEl.textContent = 'Listening... play a single string.';

        const noteEl = document.getElementById('tunerNote');
        const freqEl = document.getElementById('tunerFrequency');
        const needleEl = document.getElementById('tunerNeedle');
        const stringEl = document.getElementById('tunerClosestString');

        smoothedFrequency = null;
        lastDisplayUpdate = 0;
        const DISPLAY_INTERVAL_MS = 120; // Throttle DOM updates so the needle doesn't jitter every frame
        const SMOOTHING = 0.25; // Exponential moving average factor for the detected frequency

        function update() {
            analyser.getFloatTimeDomainData(buffer);
            const frequency = autoCorrelate(buffer, audioContext.sampleRate);
            if (frequency !== -1 && frequency > 30 && frequency < 1200) {
                smoothedFrequency = smoothedFrequency === null
                    ? frequency
                    : smoothedFrequency + (frequency - smoothedFrequency) * SMOOTHING;

                const now = performance.now();
                if (now - lastDisplayUpdate >= DISPLAY_INTERVAL_MS) {
                    lastDisplayUpdate = now;

                    const nearestString = closestString(smoothedFrequency);
                    const cents = centsFromNearestNote(smoothedFrequency);
                    const clamped = Math.max(-50, Math.min(50, cents));

                    if (noteEl) noteEl.textContent = frequencyToNoteName(smoothedFrequency);
                    if (freqEl) freqEl.textContent = `${smoothedFrequency.toFixed(1)} Hz`;
                    if (stringEl) stringEl.textContent = `Closest string: ${nearestString.note} (${nearestString.freq} Hz)`;
                    if (needleEl) {
                        needleEl.style.left = `${50 + clamped}%`;
                        needleEl.parentElement.classList.toggle('in-tune', Math.abs(cents) <= 5);
                    }
                }
            }
            rafId = requestAnimationFrame(update);
        }
        update();
    }

    function stopMicTuner() {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
        if (micStream) {
            micStream.getTracks().forEach((track) => track.stop());
            micStream = null;
        }
        const statusEl = document.getElementById('tunerStatus');
        if (statusEl) statusEl.textContent = 'Stopped. Tap Start Listening to resume.';
    }

    async function playReferenceTone(frequency) {
        stopReferenceTone();
        audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
        // Some browsers still start a freshly created context suspended even inside a
        // click/touch gesture; resuming here (as the existing loop player does) is required
        // for sound to actually be audible.
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }
        toneOscillator = audioContext.createOscillator();
        toneGain = audioContext.createGain();
        toneOscillator.type = 'sine';
        toneOscillator.frequency.value = frequency;
        toneGain.gain.value = 0.25;
        toneOscillator.connect(toneGain);
        toneGain.connect(audioContext.destination);
        toneOscillator.start();
    }

    function stopReferenceTone() {
        if (toneOscillator) {
            try {
                toneOscillator.stop();
            } catch (error) {
                // already stopped
            }
            toneOscillator.disconnect();
            toneOscillator = null;
        }
        if (toneGain) {
            toneGain.disconnect();
            toneGain = null;
        }
    }

    function renderToneButtons() {
        const container = document.getElementById('tunerToneButtons');
        if (!container) return;
        container.innerHTML = MID_OCTAVE_NOTES.map((note) => `
            <button type="button" class="tuner-tone-btn" data-freq="${note.freq}">
                <span class="tuner-tone-note">${note.note}</span>
                <span class="tuner-tone-freq">${note.freq} Hz</span>
            </button>
        `).join('');

        // Toggle play/stop like the Pads & Tanpura page: press once to start, press
        // again (or press another note) to stop - instead of press-and-hold.
        container.querySelectorAll('.tuner-tone-btn').forEach((button) => {
            button.addEventListener('click', () => {
                if (activeToneButton === button) {
                    stopReferenceTone();
                    button.classList.remove('active');
                    activeToneButton = null;
                    return;
                }
                if (activeToneButton) {
                    activeToneButton.classList.remove('active');
                }
                playReferenceTone(parseFloat(button.dataset.freq));
                button.classList.add('active');
                activeToneButton = button;
            });
        });
    }

    function setupModeToggle() {
        const micModeBtn = document.getElementById('tunerModeMic');
        const toneModeBtn = document.getElementById('tunerModeTone');
        const micPanel = document.getElementById('tunerMicPanel');
        const tonePanel = document.getElementById('tunerTonePanel');
        if (!micModeBtn || !toneModeBtn || !micPanel || !tonePanel) return;

        function activate(mode) {
            const isMic = mode === 'mic';
            micModeBtn.classList.toggle('active', isMic);
            toneModeBtn.classList.toggle('active', !isMic);
            micPanel.style.display = isMic ? 'block' : 'none';
            tonePanel.style.display = isMic ? 'none' : 'block';
            if (!isMic) stopMicTuner();
            else {
                stopReferenceTone();
                activeToneButton?.classList.remove('active');
                activeToneButton = null;
            }
        }

        micModeBtn.addEventListener('click', () => activate('mic'));
        toneModeBtn.addEventListener('click', () => activate('tone'));
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
        setupModeToggle();
        renderToneButtons();

        document.getElementById('tunerStartMic')?.addEventListener('click', startMicTuner);
        document.getElementById('tunerStopMic')?.addEventListener('click', stopMicTuner);
        document.getElementById('toolPageBack')?.addEventListener('click', goBackToApp);
        document.querySelectorAll('[data-tool-nav-back]').forEach((btn) => {
            btn.addEventListener('click', goBackToApp);
        });
    });

    window.addEventListener('beforeunload', () => {
        stopMicTuner();
        stopReferenceTone();
    });
})();
