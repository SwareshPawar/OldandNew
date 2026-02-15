/**
 * Debug Smart Setlists Script
 * Check the actual smart setlist data and user data
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;

async function debugSmartSetlists() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db();
    
    // Check all smart setlists
    console.log('🧠 SMART SETLISTS DATA:');
    const smartSetlists = await db.collection('SmartSetlists').find({}).toArray();
    console.log(`Total: ${smartSetlists.length}\n`);
    
    smartSetlists.forEach((setlist, i) => {
      console.log(`${i + 1}. "${setlist.name}"`);
      console.log(`   _id: ${setlist._id}`);
      console.log(`   createdBy: ${setlist.createdBy}`);
      console.log(`   createdByUsername: ${setlist.createdByUsername}`);
      console.log(`   isAdminCreated: ${setlist.isAdminCreated}`);
      console.log(`   createdAt: ${setlist.createdAt}`);
      console.log();
    });
    
    // Check all users
    console.log('\n👥 USERS DATA:');
    const users = await db.collection('Users').find({}).toArray();
    console.log(`Total: ${users.length}\n`);
    
    users.forEach((user, i) => {
      console.log(`${i + 1}. ${user.username}`);
      console.log(`   _id: ${user._id}`);
      console.log(`   email: ${user.email}`);
      console.log(`   firstName: ${user.firstName}`);
      console.log(`   lastName: ${user.lastName}`);
      console.log(`   isAdmin: ${user.isAdmin}`);
      console.log();
    });
    
    // Match smart setlists to users
    console.log('\n🔗 SMART SETLIST CREATORS:');
    for (const setlist of smartSetlists) {
      const creator = users.find(u => u._id.toString() === setlist.createdBy || u.username === setlist.createdByUsername);
      console.log(`"${setlist.name}"`);
      console.log(`   createdBy ID: ${setlist.createdBy}`);
      console.log(`   createdByUsername: ${setlist.createdByUsername}`);
      if (creator) {
        console.log(`   ✅ Found creator: ${creator.username} (isAdmin: ${creator.isAdmin})`);
      } else {
        console.log(`   ❌ Creator not found in Users collection`);
      }
      console.log(`   isAdminCreated flag: ${setlist.isAdminCreated}`);
      console.log();
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

debugSmartSetlists().then(() => {
  console.log('\n✅ Debug completed!');
  process.exit(0);
}).catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
