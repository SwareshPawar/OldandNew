#!/usr/bin/env node

require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('ERROR: MONGODB_URI is not set.');
  process.exit(1);
}

const DRY_RUN = process.argv.includes('--dry-run') || process.argv.includes('-d');

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

function normalizeSongLike(doc) {
  const normalized = { ...doc };

  if (typeof normalized.key === 'string') {
    normalized.key = normalizeKeySignature(normalized.key);
  }
  if (typeof normalized.manualChords === 'string') {
    normalized.manualChords = normalizeManualChords(normalized.manualChords);
  }
  if (typeof normalized.lyrics === 'string') {
    normalized.lyrics = normalizeLyricsChords(normalized.lyrics);
  }

  return normalized;
}

function pickSongFields(doc) {
  return {
    key: doc.key,
    manualChords: doc.manualChords,
    lyrics: doc.lyrics
  };
}

function songFieldsChanged(before, after) {
  return before.key !== after.key || before.manualChords !== after.manualChords || before.lyrics !== after.lyrics;
}

function normalizeSongsArrayForSetlist(songs) {
  if (!Array.isArray(songs)) return { songs, changed: false };

  let changed = false;
  const normalizedSongs = songs.map(item => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return item;

    const before = pickSongFields(item);
    const normalizedItem = normalizeSongLike(item);
    const after = pickSongFields(normalizedItem);

    if (songFieldsChanged(before, after)) {
      changed = true;
    }

    return normalizedItem;
  });

  return { songs: normalizedSongs, changed };
}

async function normalizeCollectionSongs(collection, collectionName) {
  const docs = await collection.find({}).toArray();
  let updated = 0;

  for (const doc of docs) {
    const before = pickSongFields(doc);
    const normalized = normalizeSongLike(doc);
    const after = pickSongFields(normalized);

    if (!songFieldsChanged(before, after)) continue;

    updated += 1;

    if (DRY_RUN) continue;

    await collection.updateOne(
      { _id: doc._id },
      {
        $set: {
          key: normalized.key,
          manualChords: normalized.manualChords,
          lyrics: normalized.lyrics,
          updatedAt: new Date().toISOString()
        }
      }
    );
  }

  console.log(`${collectionName}: ${updated} song docs ${DRY_RUN ? 'would be' : 'were'} updated`);
  return updated;
}

async function normalizeSetlists(collection, collectionName) {
  const docs = await collection.find({ songs: { $exists: true, $type: 'array' } }).toArray();
  let updated = 0;

  for (const doc of docs) {
    const result = normalizeSongsArrayForSetlist(doc.songs);
    if (!result.changed) continue;

    updated += 1;

    if (DRY_RUN) continue;

    await collection.updateOne(
      { _id: doc._id },
      {
        $set: {
          songs: result.songs,
          updatedAt: new Date().toISOString()
        }
      }
    );
  }

  console.log(`${collectionName}: ${updated} setlists ${DRY_RUN ? 'would be' : 'were'} updated`);
  return updated;
}

async function normalizeUserSongKeys(collection) {
  const docs = await collection.find({ songKeys: { $exists: true, $type: 'object' } }).toArray();
  let updated = 0;

  for (const doc of docs) {
    const songKeys = doc.songKeys || {};
    const normalizedSongKeys = {};
    let changed = false;

    Object.entries(songKeys).forEach(([songId, key]) => {
      const normalizedKey = typeof key === 'string' ? normalizeKeySignature(key) : key;
      normalizedSongKeys[songId] = normalizedKey;
      if (normalizedKey !== key) changed = true;
    });

    if (!changed) continue;

    updated += 1;

    if (DRY_RUN) continue;

    await collection.updateOne(
      { _id: doc._id },
      {
        $set: {
          songKeys: normalizedSongKeys,
          updatedAt: new Date().toISOString()
        }
      }
    );
  }

  console.log(`UserData.songKeys: ${updated} docs ${DRY_RUN ? 'would be' : 'were'} updated`);
  return updated;
}

async function run() {
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true
    }
  });

  try {
    console.log(`Connecting to MongoDB (${DRY_RUN ? 'DRY RUN' : 'LIVE RUN'})...`);
    await client.connect();

    const db = client.db();

    const songsCollection = db.collection('OldNewSongs');
    const globalSetlists = db.collection('GlobalSetlists');
    const mySetlists = db.collection('MySetlists');
    const smartSetlists = db.collection('SmartSetlists');
    const userData = db.collection('UserData');

    let totalUpdated = 0;

    totalUpdated += await normalizeCollectionSongs(songsCollection, 'OldNewSongs');
    totalUpdated += await normalizeSetlists(globalSetlists, 'GlobalSetlists');
    totalUpdated += await normalizeSetlists(mySetlists, 'MySetlists');
    totalUpdated += await normalizeSetlists(smartSetlists, 'SmartSetlists');
    totalUpdated += await normalizeUserSongKeys(userData);

    console.log(`Done. ${totalUpdated} documents ${DRY_RUN ? 'would be' : 'were'} updated.`);
    if (DRY_RUN) {
      console.log('Re-run without --dry-run to apply changes.');
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

run();
