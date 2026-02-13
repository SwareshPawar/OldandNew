/**
 * Check OldNewSongs Collection
 * 
 * This script checks if songs are in the OldNewSongs collection instead of Songs
 * Run with: node check-songs-collection.js
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;

async function checkSongsCollection() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db();
    
    // Check both possible collections
    console.log('🔍 Checking for songs in different collections:\n');
    
    // Check "Songs" collection
    const songsCollection = db.collection('Songs');
    const songsCount = await songsCollection.countDocuments();
    console.log(`📂 "Songs" collection: ${songsCount} documents`);
    
    // Check "OldNewSongs" collection
    const oldNewSongsCollection = db.collection('OldNewSongs');
    const oldNewSongsCount = await oldNewSongsCollection.countDocuments();
    console.log(`📂 "OldNewSongs" collection: ${oldNewSongsCount} documents\n`);
    
    if (oldNewSongsCount > 0) {
      console.log('⚠️  Found songs in "OldNewSongs" collection!');
      console.log('   The application might be using the wrong collection name.\n');
      
      // Sample songs from OldNewSongs
      const sampleSongs = await oldNewSongsCollection.find({}).limit(5).toArray();
      console.log(`📋 Sample songs from "OldNewSongs":`);
      sampleSongs.forEach((song, i) => {
        console.log(`  ${i + 1}. "${song.title}" (ID: ${song.id}, _id: ${song._id})`);
      });
      
      // Check ID format
      const songsWithNumericId = await oldNewSongsCollection.countDocuments({ 
        id: { $type: 'number' } 
      });
      const songsWithoutNumericId = oldNewSongsCount - songsWithNumericId;
      
      console.log(`\n📊 ID Status in "OldNewSongs":`);
      console.log(`  ✅ With numeric ID: ${songsWithNumericId}`);
      console.log(`  ⚠️  Without numeric ID: ${songsWithoutNumericId}`);
      
      if (songsWithoutNumericId > 0) {
        console.log(`\n⚠️  ACTION REQUIRED:`);
        console.log(`  - ${songsWithoutNumericId} songs need numeric IDs`);
        console.log(`  - Run migration on "OldNewSongs" collection`);
      } else {
        console.log(`\n✅ All songs in "OldNewSongs" have numeric IDs!`);
      }
    } else if (songsCount === 0 && oldNewSongsCount === 0) {
      console.log('ℹ️  No songs found in either collection.');
      console.log('   This is normal for a new/empty database.\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the check
console.log('🔍 Checking Songs Collections\n');
checkSongsCollection()
  .then(() => {
    console.log('\n✅ Check completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Check failed:', error);
    process.exit(1);
  });
