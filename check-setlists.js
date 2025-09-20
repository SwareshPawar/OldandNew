const { MongoClient } = require('mongodb');

async function checkSetlists() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db('OldAndNew');
        
        // Check global setlists
        const globalSetlists = await db.collection('GlobalSetlists').find({}).toArray();
        console.log('Global Setlists in database:');
        console.log(JSON.stringify(globalSetlists, null, 2));
        
        // Check my setlists
        const mySetlists = await db.collection('MySetlists').find({}).toArray();
        console.log('\nMy Setlists in database:');
        console.log(JSON.stringify(mySetlists, null, 2));
        
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.close();
    }
}

checkSetlists();