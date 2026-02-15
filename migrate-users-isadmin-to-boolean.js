/**
 * Migration Script: Convert isAdmin Field to Boolean
 * 
 * This script converts all string "true"/"false" values in the isAdmin field
 * to proper boolean true/false values for consistency.
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;

async function migrateUsers() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db();
    const usersCollection = db.collection('Users');
    
    // Get all users
    const allUsers = await usersCollection.find({}).toArray();
    console.log(`👥 Found ${allUsers.length} total users\n`);
    
    let updatedCount = 0;
    let alreadyBooleanCount = 0;
    let convertedToTrueCount = 0;
    let convertedToFalseCount = 0;
    
    for (const user of allUsers) {
      console.log(`Processing: ${user.username}`);
      console.log(`   Current isAdmin: ${user.isAdmin} (type: ${typeof user.isAdmin})`);
      
      // Determine if update is needed
      if (typeof user.isAdmin === 'boolean') {
        console.log(`   ✅ Already boolean`);
        alreadyBooleanCount++;
      } else {
        // Convert to boolean
        const newIsAdmin = user.isAdmin === 'true' || user.isAdmin === true;
        console.log(`   🔧 Converting to: ${newIsAdmin}`);
        
        await usersCollection.updateOne(
          { _id: user._id },
          { 
            $set: { 
              isAdmin: newIsAdmin
            } 
          }
        );
        
        updatedCount++;
        if (newIsAdmin) {
          convertedToTrueCount++;
        } else {
          convertedToFalseCount++;
        }
        console.log(`   ✅ Updated successfully`);
      }
      
      console.log();
    }
    
    console.log('='.repeat(50));
    console.log(`\n📊 MIGRATION SUMMARY:`);
    console.log(`   Total users: ${allUsers.length}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`     - Converted to true: ${convertedToTrueCount}`);
    console.log(`     - Converted to false: ${convertedToFalseCount}`);
    console.log(`   Already boolean: ${alreadyBooleanCount}`);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    throw err;
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

migrateUsers().then(() => {
  console.log('\n✅ Migration completed successfully!');
  process.exit(0);
}).catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
