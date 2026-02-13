/**
 * Database Verification Script
 * 
 * This script checks the database status and verifies data integrity
 * Run with: node verify-database.js
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function verifyDatabase() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db();
    
    // Get database name
    const dbName = db.databaseName;
    console.log(`📦 Database: ${dbName}\n`);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log(`📚 Collections (${collections.length}):`);
    collections.forEach(col => console.log(`  - ${col.name}`));
    console.log();
    
    // Check Songs collection
    console.log('🎵 SONGS COLLECTION:');
    const songsCollection = db.collection('Songs');
    const totalSongs = await songsCollection.countDocuments();
    console.log(`  Total songs: ${totalSongs}`);
    
    if (totalSongs > 0) {
      // Check songs with valid numeric IDs
      const songsWithId = await songsCollection.countDocuments({ 
        id: { $type: 'number' } 
      });
      console.log(`  Songs with numeric ID: ${songsWithId}`);
      
      // Check songs without numeric IDs
      const songsWithoutId = await songsCollection.countDocuments({
        $or: [
          { id: { $exists: false } },
          { id: null },
          { id: { $not: { $type: 'number' } } }
        ]
      });
      console.log(`  Songs WITHOUT numeric ID: ${songsWithoutId}`);
      
      // Get ID range
      const minSong = await songsCollection.find({ id: { $type: 'number' } })
        .sort({ id: 1 }).limit(1).toArray();
      const maxSong = await songsCollection.find({ id: { $type: 'number' } })
        .sort({ id: -1 }).limit(1).toArray();
      
      if (minSong.length > 0 && maxSong.length > 0) {
        console.log(`  ID range: ${minSong[0].id} - ${maxSong[0].id}`);
      }
      
      // Check for duplicate IDs
      const duplicates = await songsCollection.aggregate([
        { $match: { id: { $type: 'number' } } },
        { $group: { _id: '$id', count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } }
      ]).toArray();
      
      if (duplicates.length > 0) {
        console.log(`  ⚠️  Duplicate IDs: ${duplicates.length}`);
        duplicates.forEach(dup => {
          console.log(`    - ID ${dup._id} appears ${dup.count} times`);
        });
      } else {
        console.log(`  ✅ No duplicate IDs`);
      }
      
      // Sample songs
      const sampleSongs = await songsCollection.find({}).limit(3).toArray();
      console.log(`\n  Sample songs:`);
      sampleSongs.forEach((song, i) => {
        console.log(`    ${i + 1}. "${song.title}" (ID: ${song.id}, _id: ${song._id})`);
      });
    }
    
    console.log();
    
    // Check Global Setlists
    console.log('📋 GLOBAL SETLISTS:');
    const globalSetlistsCollection = db.collection('GlobalSetlists');
    const totalGlobalSetlists = await globalSetlistsCollection.countDocuments();
    console.log(`  Total: ${totalGlobalSetlists}`);
    
    // Check My Setlists
    console.log('\n📋 MY SETLISTS:');
    const mySetlistsCollection = db.collection('MySetlists');
    const totalMySetlists = await mySetlistsCollection.countDocuments();
    console.log(`  Total: ${totalMySetlists}`);
    
    // Check Smart Setlists
    console.log('\n🧠 SMART SETLISTS:');
    const smartSetlistsCollection = db.collection('SmartSetlists');
    const totalSmartSetlists = await smartSetlistsCollection.countDocuments();
    console.log(`  Total: ${totalSmartSetlists}`);
    
    if (totalSmartSetlists > 0) {
      const adminCreated = await smartSetlistsCollection.countDocuments({ 
        isAdminCreated: true 
      });
      console.log(`  Admin-created: ${adminCreated}`);
      console.log(`  User-created: ${totalSmartSetlists - adminCreated}`);
    }
    
    // Check Users
    console.log('\n👥 USERS:');
    const usersCollection = db.collection('Users');
    const totalUsers = await usersCollection.countDocuments();
    console.log(`  Total: ${totalUsers}`);
    
    if (totalUsers > 0) {
      const admins = await usersCollection.countDocuments({ isAdmin: true });
      console.log(`  Admins: ${admins}`);
      console.log(`  Regular users: ${totalUsers - admins}`);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Database verification complete!');
    
    // Summary
    console.log('\n📊 SUMMARY:');
    if (totalSongs === 0) {
      console.log('  ⚠️  Database appears to be empty or newly created');
      console.log('  ℹ️  This is normal for development environments');
      console.log('  ℹ️  Song ID validation is now active for future songs');
    } else {
      const songsWithoutId = await songsCollection.countDocuments({
        $or: [
          { id: { $exists: false } },
          { id: null },
          { id: { $not: { $type: 'number' } } }
        ]
      });
      
      if (songsWithoutId === 0) {
        console.log('  ✅ All songs have valid numeric IDs!');
      } else {
        console.log(`  ⚠️  ${songsWithoutId} songs need ID migration`);
        console.log(`  📝 Run: node migrate-song-ids.js`);
      }
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the verification
console.log('🔍 Starting Database Verification\n');
verifyDatabase()
  .then(() => {
    console.log('\n✅ Verification completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  });
