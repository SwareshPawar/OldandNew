/**
 * Migration Script: Fix Smart Setlists isAdminCreated Flag
 * 
 * This script updates all smart setlists to have the correct isAdminCreated flag
 * based on whether their creator is an admin user.
 */

require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;

async function migrateSmartSetlists() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db();
    
    // Get all users
    const users = await db.collection('Users').find({}).toArray();
    console.log(`👥 Found ${users.length} users\n`);
    
    // Get all smart setlists
    const smartSetlists = await db.collection('SmartSetlists').find({}).toArray();
    console.log(`🧠 Found ${smartSetlists.length} smart setlists to check\n`);
    
    let updatedCount = 0;
    let alreadyCorrectCount = 0;
    
    for (const setlist of smartSetlists) {
      console.log(`Processing: "${setlist.name}"`);
      console.log(`   createdBy: ${setlist.createdBy}`);
      console.log(`   Current isAdminCreated: ${setlist.isAdminCreated}`);
      
      // Find the creator user
      let creator = null;
      
      // Try to match by _id (if createdBy is ObjectId string)
      try {
        creator = users.find(u => u._id.toString() === setlist.createdBy.toString());
      } catch (e) {
        // If that fails, try to match by username
        creator = users.find(u => u.username === setlist.createdByUsername);
      }
      
      if (!creator) {
        console.log(`   ⚠️  Creator not found - skipping`);
        console.log();
        continue;
      }
      
      console.log(`   Creator: ${creator.username} (isAdmin: ${creator.isAdmin})`);
      
      const shouldBeAdminCreated = creator.isAdmin === true;
      
      // Check if update is needed
      if (setlist.isAdminCreated === shouldBeAdminCreated) {
        console.log(`   ✅ Already correct`);
        alreadyCorrectCount++;
      } else {
        console.log(`   🔧 Updating to: ${shouldBeAdminCreated}`);
        
        await db.collection('SmartSetlists').updateOne(
          { _id: setlist._id },
          { 
            $set: { 
              isAdminCreated: shouldBeAdminCreated,
              migrated: true,
              migratedAt: new Date().toISOString()
            } 
          }
        );
        updatedCount++;
        console.log(`   ✅ Updated successfully`);
      }
      
      console.log();
    }
    
    console.log('='.repeat(50));
    console.log(`\n📊 MIGRATION SUMMARY:`);
    console.log(`   Total smart setlists: ${smartSetlists.length}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Already correct: ${alreadyCorrectCount}`);
    console.log(`   Skipped: ${smartSetlists.length - updatedCount - alreadyCorrectCount}`);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    throw err;
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

migrateSmartSetlists().then(() => {
  console.log('\n✅ Migration completed successfully!');
  process.exit(0);
}).catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
