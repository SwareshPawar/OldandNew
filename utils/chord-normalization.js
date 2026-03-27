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

const KEY_VARIANTS_BY_CANONICAL = {
  C: ['C'],
  'C#': ['C#', 'Db'],
  D: ['D'],
  Eb: ['Eb', 'D#'],
  E: ['E', 'Fb'],
  F: ['F', 'E#'],
  'F#': ['F#', 'Gb'],
  G: ['G'],
  'G#': ['G#', 'Ab'],
  A: ['A'],
  Bb: ['Bb', 'A#'],
  B: ['B', 'Cb']
};

const CHORD_LINE_REGEX = /^(\s*[A-G](?:#|b)?(?:[a-zA-Z0-9+#]*)?(?:\/[A-G](?:#|b)?)?[\s\-\/\|]*)+$/i;
const CHORD_TOKEN_REGEX = /([A-G](?:#|b)?(?:[a-zA-Z0-9+#]*)?(?:\/[A-G](?:#|b)?)?)/gi;
const INLINE_CHORD_REGEX = /([\[(])([A-G](?:#|b)?(?:[a-zA-Z0-9+#]*)?(?:\/[A-G](?:#|b)?)?)([\])])/gi;

function normalizeBaseNote(note) {
  if (!note || typeof note !== 'string') return note;
  const normalizedInput = note.charAt(0).toUpperCase() + note.slice(1);
  const index = NOTE_TO_INDEX[normalizedInput];
  return index === undefined ? note : CANONICAL_CHROMATIC[index];
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
    const [base, bass] = chordToken.split('/');
    const normalizedBase = normalizeChordToken(base);
    const normalizedBass = bass ? normalizeChordToken(bass) : '';
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

function normalizeLyricsChords(lyrics) {
  if (!lyrics || typeof lyrics !== 'string') return lyrics;
  return lyrics
    .split('\n')
    .map(line => {
      const trimmed = line.trim();
      if (!trimmed) return line;

      if (CHORD_LINE_REGEX.test(trimmed)) {
        return line.replace(CHORD_TOKEN_REGEX, chord => normalizeChordToken(chord));
      }

      return line.replace(INLINE_CHORD_REGEX, (match, open, chord, close) => {
        return `${open}${normalizeChordToken(chord)}${close}`;
      });
    })
    .join('\n');
}

function normalizeSongAccidentals(song) {
  if (!song || typeof song !== 'object') return song;
  const normalizedSong = { ...song };

  if (typeof normalizedSong.key === 'string') {
    normalizedSong.key = normalizeKeySignature(normalizedSong.key);
  }
  if (typeof normalizedSong.manualChords === 'string') {
    normalizedSong.manualChords = normalizeManualChords(normalizedSong.manualChords);
  }
  if (typeof normalizedSong.lyrics === 'string') {
    normalizedSong.lyrics = normalizeLyricsChords(normalizedSong.lyrics);
  }

  return normalizedSong;
}

function expandKeyFilterVariants(keys) {
  const expanded = new Set();
  (Array.isArray(keys) ? keys : []).forEach(key => {
    if (typeof key !== 'string' || !key.trim()) return;
    const normalizedKey = normalizeKeySignature(key);
    const match = normalizedKey.match(/^([A-G][#b]?)(m?)$/);
    if (!match) {
      expanded.add(normalizedKey);
      return;
    }

    const root = match[1];
    const suffix = match[2] || '';
    const variants = KEY_VARIANTS_BY_CANONICAL[root] || [root];
    variants.forEach(variantRoot => expanded.add(`${variantRoot}${suffix}`));
  });
  return Array.from(expanded);
}

module.exports = {
  CANONICAL_CHROMATIC,
  expandKeyFilterVariants,
  normalizeBaseNote,
  normalizeChordToken,
  normalizeKeySignature,
  normalizeLyricsChords,
  normalizeManualChords,
  normalizeSongAccidentals
};