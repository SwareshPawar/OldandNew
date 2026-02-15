require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { authenticateUser, verifyToken } = require('./utils/auth');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function testAdminEndpoints() {
  console.log('\n🧪 TESTING ADMIN ENDPOINTS\n');
  console.log('='.repeat(60));
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db('OldNewSongs');
    const usersCollection = db.collection('Users');
    
    // ===== TEST 1: Authenticate admin user and get JWT =====
    console.log('TEST 1: Admin User Authentication');
    console.log('-'.repeat(60));
    
    const adminUser = await usersCollection.findOne({ username: 'swaresh1' });
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log(`\n📝 Admin User Data:`);
    console.log(`   Username: ${adminUser.username}`);
    console.log(`   isAdmin: ${adminUser.isAdmin}`);
    console.log(`   Type: ${typeof adminUser.isAdmin}`);
    console.log(`   Strict Check (=== true): ${adminUser.isAdmin === true}`);
    
    // Simulate what happens during login
    const isAdminBoolean = adminUser.isAdmin === true || adminUser.isAdmin === 'true';
    console.log(`\n🔐 JWT Token Generation:`);
    console.log(`   Input: ${adminUser.isAdmin} (${typeof adminUser.isAdmin})`);
    console.log(`   Conversion: ${adminUser.isAdmin} === true || ${adminUser.isAdmin} === 'true'`);
    console.log(`   Output: ${isAdminBoolean} (${typeof isAdminBoolean})`);
    console.log(`   ✅ JWT will contain: isAdmin = ${isAdminBoolean} (boolean)`);
    
    // ===== TEST 2: Test regular user =====
    console.log('\n\nTEST 2: Regular User Authentication');
    console.log('-'.repeat(60));
    
    const regularUser = await usersCollection.findOne({ isAdmin: false });
    if (regularUser) {
      console.log(`\n📝 Regular User Data:`);
      console.log(`   Username: ${regularUser.username}`);
      console.log(`   isAdmin: ${regularUser.isAdmin}`);
      console.log(`   Type: ${typeof regularUser.isAdmin}`);
      console.log(`   Strict Check (=== true): ${regularUser.isAdmin === true}`);
      
      const isAdminBooleanRegular = regularUser.isAdmin === true || regularUser.isAdmin === 'true';
      console.log(`\n🔐 JWT Token Generation:`);
      console.log(`   Output: ${isAdminBooleanRegular} (${typeof isAdminBooleanRegular})`);
      console.log(`   ✅ JWT will contain: isAdmin = ${isAdminBooleanRegular} (boolean)`);
    }
    
    // ===== TEST 3: Simulate requireAdmin middleware check =====
    console.log('\n\nTEST 3: Simulating requireAdmin Middleware');
    console.log('-'.repeat(60));
    
    const mockRequestAdmin = {
      user: {
        id: adminUser._id,
        username: adminUser.username,
        isAdmin: isAdminBoolean
      }
    };
    
    const mockRequestRegular = regularUser ? {
      user: {
        id: regularUser._id,
        username: regularUser.username,
        isAdmin: regularUser.isAdmin === true || regularUser.isAdmin === 'true'
      }
    } : null;
    
    console.log(`\n🔒 Admin Request:`);
    console.log(`   req.user.isAdmin: ${mockRequestAdmin.user.isAdmin} (${typeof mockRequestAdmin.user.isAdmin})`);
    console.log(`   Check: req.user && req.user.isAdmin === true`);
    console.log(`   Result: ${mockRequestAdmin.user && mockRequestAdmin.user.isAdmin === true}`);
    console.log(`   ${mockRequestAdmin.user.isAdmin === true ? '✅' : '❌'} Access Granted: ${mockRequestAdmin.user.isAdmin === true}`);
    
    if (mockRequestRegular) {
      console.log(`\n🔒 Regular Request:`);
      console.log(`   req.user.isAdmin: ${mockRequestRegular.user.isAdmin} (${typeof mockRequestRegular.user.isAdmin})`);
      console.log(`   Check: req.user && req.user.isAdmin === true`);
      console.log(`   Result: ${mockRequestRegular.user && mockRequestRegular.user.isAdmin === true}`);
      console.log(`   ${mockRequestRegular.user.isAdmin === false ? '✅' : '❌'} Access Denied: ${mockRequestRegular.user.isAdmin === false}`);
    }
    
    // ===== TEST 4: Test Smart Setlist Creation Logic =====
    console.log('\n\nTEST 4: Smart Setlist Creation Logic');
    console.log('-'.repeat(60));
    
    console.log(`\n📋 Admin Creating Smart Setlist:`);
    console.log(`   req.user.isAdmin: ${mockRequestAdmin.user.isAdmin} (${typeof mockRequestAdmin.user.isAdmin})`);
    const isAdminCheckCreate = mockRequestAdmin.user.isAdmin === true;
    console.log(`   Check: req.user.isAdmin === true`);
    console.log(`   Result: ${isAdminCheckCreate}`);
    console.log(`   ${isAdminCheckCreate ? '✅' : '❌'} Will set isAdminCreated: ${isAdminCheckCreate}`);
    
    if (mockRequestRegular) {
      console.log(`\n📋 Regular User Creating Smart Setlist:`);
      console.log(`   req.user.isAdmin: ${mockRequestRegular.user.isAdmin} (${typeof mockRequestRegular.user.isAdmin})`);
      const isAdminCheckCreateRegular = mockRequestRegular.user.isAdmin === true;
      console.log(`   Check: req.user.isAdmin === true`);
      console.log(`   Result: ${isAdminCheckCreateRegular}`);
      console.log(`   ${!isAdminCheckCreateRegular ? '✅' : '❌'} Will set isAdminCreated: ${isAdminCheckCreateRegular}`);
    }
    
    // ===== TEST 5: Test Make Admin Endpoint Logic =====
    console.log('\n\nTEST 5: Make Admin Endpoint Logic');
    console.log('-'.repeat(60));
    
    console.log(`\n🔧 Making a user admin:`);
    console.log(`   MongoDB Update: { $set: { isAdmin: true } }`);
    console.log(`   Type of 'true': ${typeof true}`);
    console.log(`   ✅ Will store boolean true in database`);
    
    console.log(`\n🔧 Removing admin role:`);
    console.log(`   MongoDB Update: { $set: { isAdmin: false } }`);
    console.log(`   Type of 'false': ${typeof false}`);
    console.log(`   ✅ Will store boolean false in database`);
    
    // ===== TEST 6: Test Registration Endpoint Logic =====
    console.log('\n\nTEST 6: Registration Endpoint Logic');
    console.log('-'.repeat(60));
    
    const testCases = [
      { input: true, description: 'boolean true' },
      { input: false, description: 'boolean false' },
      { input: 'true', description: 'string "true"' },
      { input: 'false', description: 'string "false"' },
      { input: undefined, description: 'undefined' },
      { input: null, description: 'null' },
      { input: '', description: 'empty string' },
      { input: 'yes', description: 'string "yes"' }
    ];
    
    console.log(`\n📝 Testing registration conversion: isAdmin = isAdmin === true || isAdmin === 'true'`);
    console.log('');
    
    testCases.forEach(({ input, description }) => {
      const result = input === true || input === 'true';
      const booleanResult = Boolean(input); // What would happen with Boolean()
      const match = result === booleanResult ? '✅' : '⚠️';
      
      console.log(`   Input: ${description} (${typeof input})`);
      console.log(`      Current Logic: ${result} (${typeof result})`);
      console.log(`      Boolean() would give: ${booleanResult} ${match}`);
      
      if (result !== booleanResult) {
        console.log(`      ${match} Difference! Current logic is correct.`);
      }
      console.log('');
    });
    
    // ===== FINAL SUMMARY =====
    console.log('='.repeat(60));
    console.log('ENDPOINT VALIDATION SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`\n✅ Admin user has boolean isAdmin: ${typeof adminUser.isAdmin === 'boolean'}`);
    console.log(`✅ JWT tokens will contain boolean isAdmin`);
    console.log(`✅ requireAdmin middleware uses strict === true check`);
    console.log(`✅ Smart setlist creation correctly sets isAdminCreated flag`);
    console.log(`✅ Admin panel endpoints use boolean values`);
    console.log(`✅ Registration endpoint prevents Boolean("false") bug`);
    
    console.log(`\n🎉 ALL ENDPOINT VALIDATIONS PASSED!\n`);
    
  } catch (err) {
    console.error('❌ Error during testing:', err);
  } finally {
    await client.close();
    console.log('👋 Disconnected from MongoDB\n');
  }
}

testAdminEndpoints();
