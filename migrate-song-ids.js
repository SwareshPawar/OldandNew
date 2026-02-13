/**
 * Migration Script: Standardize Song IDs
 * 
 * Purpose: Ensure all songs have a consistent numeric 'id' field
 * This script:
 * 1. Finds songs without an 'id' field
 * 2. Assigns sequential numeric IDs starting from the highest existing ID
 * 3. Reports on the migration status
 * 
 * Run with: node migrate-song-ids.js
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function migrateSongIds() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const songsCollection = db.collection('OldNewSongs'); // Use correct collection name
    
    // Get all songs
    const allSongs = await songsCollection.find({}).toArray();
    console.log(`📊 Total songs in database: ${allSongs.length}`);
    
    // Find songs without numeric id
    const songsWithoutId = allSongs.filter(song => 
      typeof song.id !== 'number' || song.id === null || song.id === undefined
    );
    
    console.log(`🔍 Songs without numeric ID: ${songsWithoutId.length}`);
    
    if (songsWithoutId.length === 0) {
      console.log('✅ All songs already have numeric IDs!');
      await client.close();
      return;
    }
    
    // Find the highest existing ID
    const songsWithId = allSongs.filter(song => typeof song.id === 'number');
    const maxId = songsWithId.length > 0 
      ? Math.max(...songsWithId.map(s => s.id))
      : 0;
    
    console.log(`📈 Highest existing ID: ${maxId}`);
    console.log(`🚀 Starting migration...`);
    
    // Assign IDs to songs without them
    let nextId = maxId + 1;
    let updatedCount = 0;
    
    for (const song of songsWithoutId) {
      try {
        const result = await songsCollection.updateOne(
          { _id: song._id },
          { $set: { id: nextId } }
        );
        
        if (result.modifiedCount > 0) {
          console.log(`  ✓ Updated song "${song.title}" (${song._id}) with id: ${nextId}`);
          updatedCount++;
          nextId++;
        } else {
          console.warn(`  ⚠️  Failed to update song "${song.title}" (${song._id})`);
        }
      } catch (error) {
        console.error(`  ❌ Error updating song "${song.title}":`, error.message);
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`  - Total songs: ${allSongs.length}`);
    console.log(`  - Songs needing ID: ${songsWithoutId.length}`);
    console.log(`  - Successfully updated: ${updatedCount}`);
    console.log(`  - Failed: ${songsWithoutId.length - updatedCount}`);
    
    // Verify migration
    console.log('\n🔍 Verifying migration...');
    const remainingWithoutId = await songsCollection.countDocuments({
      $or: [
        { id: { $exists: false } },
        { id: null },
        { id: { $type: 'string' } }
      ]
    });
    
    if (remainingWithoutId === 0) {
      console.log('✅ All songs now have numeric IDs!');
    } else {
      console.warn(`⚠️  ${remainingWithoutId} songs still without proper numeric IDs`);
    }
    
    // Check for duplicate IDs
    console.log('\n🔍 Checking for duplicate IDs...');
    const duplicates = await songsCollection.aggregate([
      { $group: { _id: '$id', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();
    
    if (duplicates.length > 0) {
      console.warn(`⚠️  Found ${duplicates.length} duplicate IDs:`);
      duplicates.forEach(dup => {
        console.warn(`  - ID ${dup._id} appears ${dup.count} times`);
      });
    } else {
      console.log('✅ No duplicate IDs found!');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the migration
console.log('🚀 Starting Song ID Migration Script\n');
migrateSongIds()
  .then(() => {
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
