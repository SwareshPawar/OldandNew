(function initializeChordNormalization(global) {
    function createChordNormalization() {
        const CANONICAL_CHROMATIC = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
        const NOTE_TO_INDEX = {
            C: 0,
            'C#': 1,
            Db: 1,
            D: 2,
            'D#': 3,
            Eb: 3,
            E: 4,
            Fb: 4,
            'E#': 5,
            F: 5,
            'F#': 6,
            Gb: 6,
            G: 7,
            'G#': 8,
            Ab: 8,
            A: 9,
            'A#': 10,
            Bb: 10,
            B: 11,
            Cb: 11
        };

        function normalizeBaseNote(note) {
            if (!note || typeof note !== 'string') return note;
            const normalizedInput = note.charAt(0).toUpperCase() + note.slice(1);
            const index = NOTE_TO_INDEX[normalizedInput];
            if (index === undefined) return note;
            const canonical = CANONICAL_CHROMATIC[index];
            return note === note.toLowerCase() ? canonical.toLowerCase() : canonical;
        }

        function normalizeKeySignature(key) {
            if (!key || typeof key !== 'string') return key;
            const match = key.trim().match(/^([A-Ga-g][#b]?)(m?)$/);
            if (!match) return key;
            return `${normalizeBaseNote(match[1])}${match[2] || ''}`;
        }

        function normalizeChordToken(chordToken) {
            if (!chordToken || typeof chordToken !== 'string') return chordToken;

            if (chordToken.includes('/')) {
                const [baseChord, bassNote] = chordToken.split('/');
                const normalizedBase = normalizeChordToken(baseChord);
                const normalizedBass = bassNote ? normalizeChordToken(bassNote) : '';
                return normalizedBass ? `${normalizedBase}/${normalizedBass}` : normalizedBase;
            }

            const match = chordToken.match(/^([A-Ga-g][#b]?)(.*)$/);
            if (!match) return chordToken;
            return `${normalizeBaseNote(match[1])}${match[2] || ''}`;
        }

        function normalizeManualChords(manualChords) {
            if (!manualChords || typeof manualChords !== 'string') return manualChords;
            return manualChords
                .split(',')
                .map(chord => normalizeChordToken(chord.trim()))
                .filter(Boolean)
                .join(', ');
        }

        function normalizeSongAccidentals(song) {
            if (!song || typeof song !== 'object') return song;
            const normalizedSong = { ...song };

            if (typeof normalizedSong.key === 'string') {
                normalizedSong.key = normalizeKeySignature(normalizedSong.key);
            }
            if (typeof normalizedSong.manualChords === 'string' && normalizedSong.manualChords.trim()) {
                normalizedSong.manualChords = normalizeManualChords(normalizedSong.manualChords);
            }

            return normalizedSong;
        }

        return {
            normalizeBaseNote,
            normalizeChordAccidentals: normalizeChordToken,
            normalizeChordToken,
            normalizeKeySignature,
            normalizeManualChords,
            normalizeSingleChordToken: normalizeChordToken,
            normalizeSongAccidentals
        };
    }

    global.ChordNormalization = global.ChordNormalization || createChordNormalization();
})(window);