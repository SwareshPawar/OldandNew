#!/usr/bin/env node

require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function verifyMigration() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await client.connect();
        
        const db = client.db();
        const songsCollection = db.collection('OldNewSongs');
        
        console.log('📊 Verifying migration results...\n');
        
        // Get songs that now have mood field
        const songsWithMood = await songsCollection.find({ 
            mood: { $exists: true, $ne: "" } 
        }).limit(10).toArray();
        
        console.log('🎭 Sample songs with migrated mood data:');
        console.log('=' .repeat(60));
        
        songsWithMood.forEach((song, index) => {
            console.log(`${index + 1}. "${song.title}"`);
            console.log(`   📂 Genres: [${song.genres ? song.genres.join(', ') : 'none'}]`);
            console.log(`   🎭 Mood: "${song.mood}"`);
            if (song.migrationNote) {
                console.log(`   📝 Migration: ${song.migrationNote}`);
            }
            console.log('');
        });
        
        // Statistics
        const totalSongs = await songsCollection.countDocuments();
        const songsWithMoodField = await songsCollection.countDocuments({ mood: { $exists: true, $ne: "" } });
        const songsWithMigrationNote = await songsCollection.countDocuments({ migrationNote: { $exists: true } });
        
        console.log('📈 Migration Statistics:');
        console.log('=' .repeat(30));
        console.log(`📋 Total songs: ${totalSongs}`);
        console.log(`🎭 Songs with mood field: ${songsWithMoodField}`);
        console.log(`📝 Songs with migration note: ${songsWithMigrationNote}`);
        console.log(`✅ Migration success rate: ${((songsWithMigrationNote / totalSongs) * 100).toFixed(1)}%`);
        
    } catch (error) {
        console.error('❌ Verification failed:', error);
    } finally {
        await client.close();
        console.log('\n🔌 Database connection closed');
    }
}

verifyMigration();