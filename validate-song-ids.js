require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function validateSongIds() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await client.connect();
    const db = client.db('OldNewSongs');
    const songsCollection = db.collection('OldNewSongs');

    console.log('📊 Fetching all songs...\n');
    const songs = await songsCollection.find({}).toArray();
    console.log(`✅ Found ${songs.length} total songs\n`);

    // Validation checks
    const issues = {
      missingId: [],
      nonNumericId: [],
      nonIntegerId: [],
      negativeId: [],
      zeroId: [],
      duplicateIds: [],
      missingMongoId: []
    };

    const idMap = new Map(); // Track duplicate IDs
    let validCount = 0;

    console.log('🔎 Validating song IDs...\n');

    songs.forEach((song, index) => {
      const songInfo = {
        index: index + 1,
        title: song.title || 'Untitled',
        songNumber: song.songNumber || 'N/A',
        id: song.id,
        _id: song._id
      };

      // Check 1: ID field exists
      if (song.id === undefined || song.id === null) {
        issues.missingId.push(songInfo);
        return;
      }

      // Check 2: ID is numeric
      if (typeof song.id !== 'number') {
        issues.nonNumericId.push({
          ...songInfo,
          type: typeof song.id,
          value: song.id
        });
        return;
      }

      // Check 3: ID is an integer
      if (!Number.isInteger(song.id)) {
        issues.nonIntegerId.push(songInfo);
        return;
      }

      // Check 4: ID is positive
      if (song.id < 0) {
        issues.negativeId.push(songInfo);
        return;
      }

      // Check 5: ID is not zero
      if (song.id === 0) {
        issues.zeroId.push(songInfo);
        return;
      }

      // Check 6: Check for duplicate IDs
      if (idMap.has(song.id)) {
        issues.duplicateIds.push({
          id: song.id,
          songs: [idMap.get(song.id), songInfo]
        });
      } else {
        idMap.set(song.id, songInfo);
      }

      // Check 7: MongoDB _id exists
      if (!song._id) {
        issues.missingMongoId.push(songInfo);
      }

      validCount++;
    });

    // Report results
    console.log('=' .repeat(70));
    console.log('📋 VALIDATION REPORT');
    console.log('='.repeat(70));
    console.log();

    console.log(`✅ Valid songs: ${validCount} / ${songs.length}`);
    console.log();

    // Report issues
    let hasIssues = false;

    if (issues.missingId.length > 0) {
      hasIssues = true;
      console.log(`❌ MISSING ID FIELD (${issues.missingId.length} songs):`);
      issues.missingId.forEach(s => {
        console.log(`   - Song #${s.index}: "${s.title}" (songNumber: ${s.songNumber})`);
      });
      console.log();
    }

    if (issues.nonNumericId.length > 0) {
      hasIssues = true;
      console.log(`❌ NON-NUMERIC ID (${issues.nonNumericId.length} songs):`);
      issues.nonNumericId.forEach(s => {
        console.log(`   - Song #${s.index}: "${s.title}" | id: ${s.value} (type: ${s.type})`);
      });
      console.log();
    }

    if (issues.nonIntegerId.length > 0) {
      hasIssues = true;
      console.log(`❌ NON-INTEGER ID (${issues.nonIntegerId.length} songs):`);
      issues.nonIntegerId.forEach(s => {
        console.log(`   - Song #${s.index}: "${s.title}" | id: ${s.id}`);
      });
      console.log();
    }

    if (issues.negativeId.length > 0) {
      hasIssues = true;
      console.log(`❌ NEGATIVE ID (${issues.negativeId.length} songs):`);
      issues.negativeId.forEach(s => {
        console.log(`   - Song #${s.index}: "${s.title}" | id: ${s.id}`);
      });
      console.log();
    }

    if (issues.zeroId.length > 0) {
      hasIssues = true;
      console.log(`❌ ZERO ID (${issues.zeroId.length} songs):`);
      issues.zeroId.forEach(s => {
        console.log(`   - Song #${s.index}: "${s.title}" | id: ${s.id}`);
      });
      console.log();
    }

    if (issues.duplicateIds.length > 0) {
      hasIssues = true;
      console.log(`❌ DUPLICATE IDs (${issues.duplicateIds.length} conflicts):`);
      issues.duplicateIds.forEach(conflict => {
        console.log(`   - ID ${conflict.id} used by:`);
        conflict.songs.forEach(s => {
          console.log(`     • "${s.title}" (songNumber: ${s.songNumber})`);
        });
      });
      console.log();
    }

    if (issues.missingMongoId.length > 0) {
      hasIssues = true;
      console.log(`⚠️  MISSING MONGODB _id (${issues.missingMongoId.length} songs):`);
      issues.missingMongoId.forEach(s => {
        console.log(`   - Song #${s.index}: "${s.title}" | id: ${s.id}`);
      });
      console.log();
    }

    // Summary statistics
    console.log('=' .repeat(70));
    console.log('📊 ID STATISTICS');
    console.log('='.repeat(70));
    console.log();

    const validIds = Array.from(idMap.keys()).sort((a, b) => a - b);
    console.log(`Lowest ID:  ${validIds[0]}`);
    console.log(`Highest ID: ${validIds[validIds.length - 1]}`);
    console.log(`ID Range:   ${validIds[0]} - ${validIds[validIds.length - 1]}`);
    console.log(`Total IDs:  ${validIds.length}`);
    console.log();

    // Check for gaps in sequence
    const gaps = [];
    for (let i = 0; i < validIds.length - 1; i++) {
      const current = validIds[i];
      const next = validIds[i + 1];
      if (next - current > 1) {
        gaps.push({ from: current, to: next, missing: next - current - 1 });
      }
    }

    if (gaps.length > 0) {
      console.log(`⚠️  ID SEQUENCE GAPS (${gaps.length} gaps):`);
      gaps.slice(0, 10).forEach(gap => {
        console.log(`   - Gap between ${gap.from} and ${gap.to} (${gap.missing} missing)`);
      });
      if (gaps.length > 10) {
        console.log(`   ... and ${gaps.length - 10} more gaps`);
      }
      console.log();
    } else {
      console.log(`✅ No gaps in ID sequence`);
      console.log();
    }

    // Sample valid songs
    console.log('=' .repeat(70));
    console.log('📝 SAMPLE VALID SONGS');
    console.log('='.repeat(70));
    console.log();

    const sampleSize = Math.min(5, validCount);
    const validSongs = songs.filter(s => 
      typeof s.id === 'number' && 
      Number.isInteger(s.id) && 
      s.id > 0
    ).slice(0, sampleSize);

    validSongs.forEach(song => {
      console.log(`✓ ID: ${song.id} | Title: "${song.title}" | Song#: ${song.songNumber}`);
    });
    console.log();

    // Final status
    console.log('=' .repeat(70));
    if (!hasIssues) {
      console.log('✅ ALL SONGS HAVE VALID NUMERIC IDs!');
      console.log('✅ Backend database is correctly configured.');
    } else {
      console.log('❌ VALIDATION FAILED - Issues found above need to be fixed.');
      console.log('⚠️  Run migrate-song-ids.js to fix ID issues if needed.');
    }
    console.log('='.repeat(70));
    console.log();

    // Return exit code
    process.exit(hasIssues ? 1 : 0);

  } catch (err) {
    console.error('❌ Error during validation:', err);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed.');
  }
}

// Run validation
validateSongIds();
