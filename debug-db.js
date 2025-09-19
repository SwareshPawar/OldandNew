#!/usr/bin/env node

require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGODB_URI;
if (!uri) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
}

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function debugDatabase() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        console.log('🔑 URI:', uri.replace(/:([^:@]+)@/, ':****@')); // Hide password
        await client.connect();
        
        const db = client.db();
        console.log('📚 Connected to database:', db.databaseName);
        
        // List all collections
        console.log('\n📂 Available collections:');
        const collections = await db.listCollections().toArray();
        collections.forEach(col => {
            console.log(`   📁 ${col.name} (type: ${col.type})`);
        });
        
        if (collections.length === 0) {
            console.log('   ⚠️  No collections found!');
            return;
        }
        
        // Check each collection for documents
        for (const col of collections) {
            console.log(`\n🔍 Checking collection: ${col.name}`);
            const collection = db.collection(col.name);
            const count = await collection.countDocuments();
            console.log(`   📊 Document count: ${count}`);
            
            if (count > 0) {
                // Get a sample document
                const sample = await collection.findOne();
                console.log(`   📄 Sample document keys:`, Object.keys(sample));
                
                // If this looks like a songs collection, show more details
                if (sample.title || sample.artist || sample.genres || sample.mood) {
                    console.log(`   🎵 This looks like a songs collection!`);
                    console.log(`   📋 Sample song:`, {
                        title: sample.title,
                        artist: sample.artist,
                        genres: sample.genres,
                        mood: sample.mood
                    });
                }
            }
        }
        
        // Specifically check for 'songs' collection
        console.log('\n🎵 Checking songs collection specifically...');
        const songsCollection = db.collection('songs');
        const songsCount = await songsCollection.countDocuments();
        console.log(`📊 Songs collection count: ${songsCount}`);
        
        if (songsCount > 0) {
            console.log('\n📋 Sample songs with genres:');
            const songsWithGenres = await songsCollection.find({ 
                genres: { $exists: true, $ne: [] } 
            }).limit(5).toArray();
            
            songsWithGenres.forEach((song, index) => {
                console.log(`   ${index + 1}. "${song.title}" - Genres: [${song.genres ? song.genres.join(', ') : 'none'}]`);
                console.log(`      Mood: "${song.mood || 'none'}"`);
            });
        }
        
    } catch (error) {
        console.error('❌ Database debug failed:', error);
        if (error.code === 'ENOTFOUND') {
            console.log('💡 This looks like a network connectivity issue. Check your internet connection and MongoDB URI.');
        } else if (error.name === 'MongoServerError') {
            console.log('💡 This looks like an authentication issue. Check your MongoDB credentials.');
        }
    } finally {
        await client.close();
        console.log('\n🔌 Database connection closed');
    }
}

debugDatabase();