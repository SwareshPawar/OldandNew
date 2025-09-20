const { MongoClient } = require('mongodb');

async function createTestSetlist() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db('OldNewSongs'); // Use the correct database name
        
        // Create a test global setlist
        const testSetlist = {
            name: 'Test Global Setlist',
            description: 'A test setlist to verify dropdown functionality',
            songs: [], // Empty for now
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const result = await db.collection('GlobalSetlists').insertOne(testSetlist);
        console.log('Test setlist created with ID:', result.insertedId);
        
        // Verify it was created
        const count = await db.collection('GlobalSetlists').countDocuments();
        console.log('Total global setlists:', count);
        
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.close();
    }
}

createTestSetlist();