// tuner.js
// Standalone Tune & Pitch page: chromatic tuner (microphone) + reference tone generator.
(function () {
    'use strict';

    const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    let a4Reference = 440;
    let targetNote = 'A';
    let toneNote = 'A';
    let toneOctave = 4;
    let isPlayingTone = false;

    let audioContext = null;
    let analyser = null;
    let micStream = null;
    let rafId = null;
    let toneOscillator = null;
    let toneGain = null;
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

    // Standard equal-temperament frequency for a given note name + octave, relative to A4.
    function noteToFrequency(noteName, octave, a4) {
        const noteIndex = NOTE_NAMES.indexOf(noteName);
        const midi = (octave + 1) * 12 + noteIndex;
        return a4 * Math.pow(2, (midi - 69) / 12);
    }

    // Cents deviation of a detected frequency from the closest octave of the chosen target note.
    function centsFromTarget(frequency, note, a4) {
        let bestCents = 0;
        let bestAbs = Infinity;
        for (let octave = 0; octave <= 8; octave++) {
            const idealFreq = noteToFrequency(note, octave, a4);
            const cents = 1200 * Math.log2(frequency / idealFreq);
            if (Math.abs(cents) < bestAbs) {
                bestAbs = Math.abs(cents);
                bestCents = cents;
            }
        }
        return Math.round(bestCents);
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

    function updateTunerDisplay(cents, hasSignal) {
        const noteEl = document.getElementById('tunerNote');
        const centsEl = document.getElementById('tunerCents');
        const needleEl = document.getElementById('tunerNeedle');
        const pillEl = document.getElementById('tunerInTunePill');
        if (noteEl) noteEl.textContent = targetNote;

        if (!hasSignal) {
            if (centsEl) centsEl.textContent = '-- cents';
            if (needleEl) {
                needleEl.style.left = '50%';
                needleEl.parentElement.classList.remove('in-tune');
            }
            return;
        }

        const clamped = Math.max(-50, Math.min(50, cents));
        if (centsEl) centsEl.textContent = `${cents > 0 ? '+' : ''}${cents} cents`;
        if (needleEl) {
            needleEl.style.left = `${50 + clamped}%`;
            needleEl.parentElement.classList.toggle('in-tune', Math.abs(cents) <= 5);
        }
        if (pillEl) {
            if (Math.abs(cents) <= 5) {
                pillEl.textContent = 'In tune!';
                pillEl.className = 'tune-pitch-status-pill in-tune';
            } else {
                pillEl.textContent = cents > 0 ? 'Sharp' : 'Flat';
                pillEl.className = 'tune-pitch-status-pill out-of-tune';
            }
        }
    }

    async function startMicTuner() {
        const statusEl = document.getElementById('tunerListeningStatus');
        const pillEl = document.getElementById('tunerInTunePill');
        if (micStream) return;

        try {
            micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (error) {
            if (pillEl) pillEl.textContent = 'Microphone access denied. Try the Tone Generator instead.';
            return;
        }

        audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(micStream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);

        const buffer = new Float32Array(analyser.fftSize);
        if (statusEl) statusEl.innerHTML = '<i class="fas fa-circle" aria-hidden="true"></i> Listening...';
        if (pillEl) pillEl.textContent = 'Play a note on your instrument';

        smoothedFrequency = null;
        lastDisplayUpdate = 0;
        const DISPLAY_INTERVAL_MS = 120;
        const SMOOTHING = 0.25;

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
                    const cents = centsFromTarget(smoothedFrequency, targetNote, a4Reference);
                    updateTunerDisplay(cents, true);
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
        const statusEl = document.getElementById('tunerListeningStatus');
        const pillEl = document.getElementById('tunerInTunePill');
        if (statusEl) statusEl.innerHTML = '<i class="fas fa-circle" aria-hidden="true"></i> Idle';
        if (pillEl) pillEl.textContent = 'Tap Start Listening to begin';
        updateTunerDisplay(0, false);
    }

    function renderTargetNotes() {
        const container = document.getElementById('tunerTargetNotes');
        if (!container) return;
        container.innerHTML = NOTE_NAMES.map((note) => `
            <button type="button" class="tune-pitch-note-btn${note === targetNote ? ' active' : ''}" data-note="${note}">${note}</button>
        `).join('');
        container.querySelectorAll('.tune-pitch-note-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                targetNote = btn.dataset.note;
                container.querySelectorAll('.tune-pitch-note-btn').forEach((b) => b.classList.toggle('active', b === btn));
                updateTunerDisplay(0, false);
            });
        });
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

    function currentToneFrequency() {
        return noteToFrequency(toneNote, toneOctave, a4Reference);
    }

    function updateToneDisplay() {
        const noteEl = document.getElementById('toneNoteDisplay');
        const freqEl = document.getElementById('toneFreqDisplay');
        const freqReadout = document.getElementById('toneFrequencyReadout');
        const octaveSelect = document.getElementById('toneOctaveSelect');
        const freq = currentToneFrequency();

        if (noteEl) noteEl.textContent = `${toneNote}${toneOctave}`;
        if (freqEl) freqEl.textContent = `${freq.toFixed(1)} Hz`;
        if (freqReadout) freqReadout.value = `${freq.toFixed(1)} Hz`;
        if (octaveSelect) octaveSelect.value = String(toneOctave);

        document.querySelectorAll('#toneNoteButtons .tune-pitch-note-btn').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.note === toneNote);
        });

        if (isPlayingTone) {
            playReferenceTone(freq);
        }
    }

    function setOctave(nextOctave) {
        toneOctave = Math.max(2, Math.min(6, nextOctave));
        updateToneDisplay();
    }

    function toggleTonePlayback() {
        const btn = document.getElementById('tonePlayBtn');
        isPlayingTone = !isPlayingTone;
        if (isPlayingTone) {
            playReferenceTone(currentToneFrequency());
            if (btn) btn.innerHTML = '<i class="fas fa-stop" aria-hidden="true"></i> Stop Tone';
        } else {
            stopReferenceTone();
            if (btn) btn.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i> Play Tone';
        }
    }

    function renderToneNoteButtons() {
        const container = document.getElementById('toneNoteButtons');
        if (!container) return;
        container.innerHTML = NOTE_NAMES.map((note) => `
            <button type="button" class="tune-pitch-note-btn${note === toneNote ? ' active' : ''}" data-note="${note}">${note}</button>
        `).join('');
        container.querySelectorAll('.tune-pitch-note-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                toneNote = btn.dataset.note;
                updateToneDisplay();
            });
        });
    }

    function setA4Reference(value, sourceEl) {
        a4Reference = value;
        const tunerSelect = document.getElementById('tunerA4Reference');
        if (tunerSelect && tunerSelect !== sourceEl) tunerSelect.value = String(value);
        document.querySelectorAll('.tune-pitch-preset-btn').forEach((btn) => {
            btn.classList.toggle('active', parseInt(btn.dataset.freq, 10) === value);
        });
        updateToneDisplay();
        updateTunerDisplay(0, false);
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
            if (!isMic) {
                stopMicTuner();
            } else if (isPlayingTone) {
                isPlayingTone = false;
                stopReferenceTone();
                const btn = document.getElementById('tonePlayBtn');
                if (btn) btn.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i> Play Tone';
            }
        }

        micModeBtn.addEventListener('click', () => activate('mic'));
        toneModeBtn.addEventListener('click', () => activate('tone'));
    }

    document.addEventListener('DOMContentLoaded', () => {
        initMobileShell();
        setupModeToggle();
        renderTargetNotes();
        renderToneNoteButtons();
        updateToneDisplay();

        document.getElementById('tunerStartMic')?.addEventListener('click', startMicTuner);
        document.getElementById('tunerStopMic')?.addEventListener('click', stopMicTuner);
        document.getElementById('toolPageBack')?.addEventListener('click', goBackToApp);
        document.querySelectorAll('[data-tool-nav-back]').forEach((btn) => {
            btn.addEventListener('click', goBackToApp);
        });

        document.getElementById('tunerA4Reference')?.addEventListener('change', (event) => {
            setA4Reference(parseInt(event.target.value, 10), event.target);
        });

        document.getElementById('toneOctaveDown')?.addEventListener('click', () => setOctave(toneOctave - 1));
        document.getElementById('toneOctaveUp')?.addEventListener('click', () => setOctave(toneOctave + 1));
        document.getElementById('toneOctaveSelect')?.addEventListener('change', (event) => {
            setOctave(parseInt(event.target.value, 10));
        });
        document.getElementById('tonePlayBtn')?.addEventListener('click', toggleTonePlayback);

        document.querySelectorAll('.tune-pitch-preset-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                setA4Reference(parseInt(btn.dataset.freq, 10), btn);
            });
        });
    });

    window.addEventListener('beforeunload', () => {
        stopMicTuner();
        stopReferenceTone();
    });
})();
