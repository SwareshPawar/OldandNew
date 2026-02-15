/**
 * Enhanced Debug Script - Check exact data types
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;

async function debugDataTypes() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db();
    
    // Check the admin user specifically
    const adminUser = await db.collection('Users').findOne({ username: 'swaresh1' });
    
    console.log('👤 Admin User: swaresh1');
    console.log('   _id:', adminUser._id);
    console.log('   _id type:', typeof adminUser._id);
    console.log('   _id.toString():', adminUser._id.toString());
    console.log('   isAdmin:', adminUser.isAdmin);
    console.log('   isAdmin type:', typeof adminUser.isAdmin);
    console.log('   isAdmin === true:', adminUser.isAdmin === true);
    console.log('   isAdmin == true:', adminUser.isAdmin == true);
    console.log();
    
    // Check a smart setlist
    const setlist = await db.collection('SmartSetlists').findOne({ name: 'Happy 4/4' });
    
    console.log('🧠 Smart Setlist: Happy 4/4');
    console.log('   createdBy:', setlist.createdBy);
    console.log('   createdBy type:', typeof setlist.createdBy);
    console.log('   isAdminCreated:', setlist.isAdminCreated);
    console.log('   isAdminCreated type:', typeof setlist.isAdminCreated);
    console.log();
    
    // Try the comparison
    console.log('🔍 Comparison:');
    console.log('   adminUser._id.toString():', adminUser._id.toString());
    console.log('   setlist.createdBy:', setlist.createdBy);
    console.log('   Match (strict):', adminUser._id.toString() === setlist.createdBy);
    console.log('   Match (loose):', adminUser._id.toString() == setlist.createdBy);
    console.log();
    
    // Try to find the user
    const foundUser = await db.collection('Users').findOne({ 
      _id: adminUser._id 
    });
    console.log('🔍 Finding user by _id:');
    console.log('   Found:', foundUser ? 'Yes' : 'No');
    if (foundUser) {
      console.log('   isAdmin:', foundUser.isAdmin);
      console.log('   isAdmin type:', typeof foundUser.isAdmin);
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

debugDataTypes().then(() => {
  console.log('\n✅ Debug completed!');
  process.exit(0);
}).catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
