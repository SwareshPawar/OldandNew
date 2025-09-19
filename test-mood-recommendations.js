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

async function testMoodRecommendations() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await client.connect();
        
        const db = client.db();
        const songsCollection = db.collection('OldNewSongs');
        
        console.log('🎭 Testing mood-based recommendations...\n');
        
        // Find a few songs with different moods
        const romanticsongs = await songsCollection.find({ 
            mood: { $regex: /Romantic/i }
        }).limit(3).toArray();
        
        const sadSongs = await songsCollection.find({ 
            mood: { $regex: /Sad/i }
        }).limit(3).toArray();
        
        const happySongs = await songsCollection.find({ 
            mood: { $regex: /Happy/i }
        }).limit(3).toArray();
        
        console.log('🌹 Sample Romantic Songs:');
        romanticsongs.forEach((song, index) => {
            console.log(`   ${index + 1}. "${song.title}" - Mood: "${song.mood}"`);
        });
        
        console.log('\n😢 Sample Sad Songs:');
        sadSongs.forEach((song, index) => {
            console.log(`   ${index + 1}. "${song.title}" - Mood: "${song.mood}"`);
        });
        
        console.log('\n😊 Sample Happy Songs:');
        happySongs.forEach((song, index) => {
            console.log(`   ${index + 1}. "${song.title}" - Mood: "${song.mood}"`);
        });
        
        // Check distribution of moods
        const moodStats = await songsCollection.aggregate([
            { $match: { mood: { $exists: true, $ne: "" } } },
            { $project: { 
                moodArray: { $split: ["$mood", ","] }
            }},
            { $unwind: "$moodArray" },
            { $group: { 
                _id: { $trim: { input: "$moodArray" } }, 
                count: { $sum: 1 } 
            }},
            { $sort: { count: -1 } }
        ]).toArray();
        
        console.log('\n📊 Mood Distribution:');
        console.log('=' .repeat(30));
        moodStats.forEach(stat => {
            console.log(`${stat._id}: ${stat.count} songs`);
        });
        
        console.log('\n✅ Mood data is ready for enhanced recommendations!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await client.close();
        console.log('\n🔌 Database connection closed');
    }
}

testMoodRecommendations();