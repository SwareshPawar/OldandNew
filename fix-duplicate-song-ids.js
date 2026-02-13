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

async function fixDuplicateSongIds() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await client.connect();
    const db = client.db('OldNewSongs');
    const songsCollection = db.collection('OldNewSongs');

    console.log('📊 Fetching all songs...\n');
    const songs = await songsCollection.find({}).toArray();
    console.log(`✅ Found ${songs.length} total songs\n`);

    // Find duplicate IDs
    const idMap = new Map();
    const duplicates = [];

    songs.forEach(song => {
      if (song.id !== undefined && song.id !== null) {
        if (idMap.has(song.id)) {
          duplicates.push({
            id: song.id,
            existing: idMap.get(song.id),
            duplicate: song
          });
        } else {
          idMap.set(song.id, song);
        }
      }
    });

    if (duplicates.length === 0) {
      console.log('✅ No duplicate IDs found! Database is clean.\n');
      return;
    }

    console.log(`❌ Found ${duplicates.length} duplicate songs\n`);
    console.log('🔎 Analyzing duplicates...\n');

    // Analyze each duplicate
    for (const dup of duplicates) {
      const existing = dup.existing;
      const duplicate = dup.duplicate;

      console.log('─'.repeat(70));
      console.log(`Duplicate ID: ${dup.id}`);
      console.log(`  Song 1 (MongoDB _id: ${existing._id}):`);
      console.log(`    Title: "${existing.title}"`);
      console.log(`    Artist: ${existing.artist || 'N/A'}`);
      console.log(`    Key: ${existing.key || 'N/A'}`);
      console.log(`    Created: ${existing.createdAt || 'N/A'}`);
      console.log(`  Song 2 (MongoDB _id: ${duplicate._id}):`);
      console.log(`    Title: "${duplicate.title}"`);
      console.log(`    Artist: ${duplicate.artist || 'N/A'}`);
      console.log(`    Key: ${duplicate.key || 'N/A'}`);
      console.log(`    Created: ${duplicate.createdAt || 'N/A'}`);

      // Check if songs are identical
      const areSame = 
        existing.title === duplicate.title &&
        existing.artist === duplicate.artist &&
        existing.key === duplicate.key &&
        existing.lyrics === duplicate.lyrics;

      if (areSame) {
        console.log(`  ⚠️  These appear to be EXACT DUPLICATES (same content)`);
      } else {
        console.log(`  ⚠️  These are DIFFERENT SONGS with the same ID`);
      }
    }

    console.log('─'.repeat(70));
    console.log();

    // Strategy: Delete exact duplicates, reassign IDs to different songs
    console.log('🔧 FIXING DUPLICATES...\n');

    let deletedCount = 0;
    let reassignedCount = 0;

    // Find the highest ID to start reassigning from
    let maxId = Math.max(...Array.from(idMap.keys()));
    console.log(`Current highest ID: ${maxId}\n`);

    for (const dup of duplicates) {
      const existing = dup.existing;
      const duplicate = dup.duplicate;

      // Check if songs are identical (exact duplicates)
      const areSame = 
        existing.title === duplicate.title &&
        existing.artist === duplicate.artist &&
        existing.key === duplicate.key &&
        existing.lyrics === duplicate.lyrics &&
        existing.chords === duplicate.chords;

      if (areSame) {
        // Delete the duplicate song (keep the first one)
        console.log(`🗑️  Deleting exact duplicate: ID ${dup.id}, "${duplicate.title}"`);
        console.log(`   MongoDB _id: ${duplicate._id}`);
        
        const result = await songsCollection.deleteOne({ _id: duplicate._id });
        if (result.deletedCount === 1) {
          console.log(`   ✅ Deleted successfully\n`);
          deletedCount++;
        } else {
          console.log(`   ❌ Failed to delete\n`);
        }
      } else {
        // Reassign new ID to the duplicate
        maxId++;
        console.log(`🔄 Reassigning ID for: "${duplicate.title}"`);
        console.log(`   Old ID: ${dup.id} → New ID: ${maxId}`);
        console.log(`   MongoDB _id: ${duplicate._id}`);
        
        const result = await songsCollection.updateOne(
          { _id: duplicate._id },
          { $set: { id: maxId } }
        );
        
        if (result.modifiedCount === 1) {
          console.log(`   ✅ Reassigned successfully\n`);
          reassignedCount++;
        } else {
          console.log(`   ❌ Failed to reassign\n`);
        }
      }
    }

    console.log('=' .repeat(70));
    console.log('📋 FIX SUMMARY');
    console.log('='.repeat(70));
    console.log(`🗑️  Deleted exact duplicates: ${deletedCount}`);
    console.log(`🔄 Reassigned new IDs: ${reassignedCount}`);
    console.log(`✅ Total fixed: ${deletedCount + reassignedCount}`);
    console.log('='.repeat(70));
    console.log();

    // Verify no duplicates remain
    console.log('🔍 Verifying fix...\n');
    const allSongs = await songsCollection.find({}).toArray();
    const verifyMap = new Map();
    let remainingDuplicates = 0;

    allSongs.forEach(song => {
      if (song.id !== undefined && song.id !== null) {
        if (verifyMap.has(song.id)) {
          remainingDuplicates++;
        } else {
          verifyMap.set(song.id, song);
        }
      }
    });

    if (remainingDuplicates === 0) {
      console.log('✅ SUCCESS! All duplicate IDs have been resolved.\n');
      console.log(`📊 Total songs now: ${allSongs.length}`);
      console.log(`📊 Unique IDs: ${verifyMap.size}\n`);
    } else {
      console.log(`❌ WARNING: ${remainingDuplicates} duplicate IDs still remain!\n`);
      console.log('Please run this script again or investigate manually.\n');
    }

  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed.');
  }
}

// Run fix
fixDuplicateSongIds();
