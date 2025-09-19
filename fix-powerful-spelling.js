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

async function fixPowerfulSpelling() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await client.connect();
        
        const db = client.db();
        const songsCollection = db.collection('OldNewSongs');
        
        console.log('🔍 Finding songs with "Powerfull" spelling...');
        
        // Find songs with "Powerfull" in mood field
        const songsWithPowerfull = await songsCollection.find({
            mood: { $regex: /Powerfull/i }
        }).toArray();
        
        console.log(`📋 Found ${songsWithPowerfull.length} songs with "Powerfull" spelling`);
        
        let updatedCount = 0;
        
        for (const song of songsWithPowerfull) {
            console.log(`\n🔄 Updating: "${song.title}"`);
            console.log(`   🎭 Old mood: "${song.mood}"`);
            
            // Fix the spelling
            const newMood = song.mood.replace(/Powerfull/gi, 'Powerful');
            console.log(`   🎭 New mood: "${newMood}"`);
            
            // Update the song
            const result = await songsCollection.updateOne(
                { _id: song._id },
                {
                    $set: {
                        mood: newMood,
                        updatedAt: new Date().toISOString(),
                        spellingFixNote: 'Fixed "Powerfull" spelling to "Powerful"'
                    }
                }
            );
            
            if (result.modifiedCount > 0) {
                updatedCount++;
                console.log(`   ✅ Successfully updated`);
            } else {
                console.log(`   ⚠️  No changes made`);
            }
        }
        
        console.log('\n🎉 Spelling fix completed!');
        console.log(`📊 Summary:`);
        console.log(`   📋 Songs found with spelling issue: ${songsWithPowerfull.length}`);
        console.log(`   ✅ Songs updated: ${updatedCount}`);
        
    } catch (error) {
        console.error('❌ Spelling fix failed:', error);
        process.exit(1);
    } finally {
        await client.close();
        console.log('🔌 Database connection closed');
    }
}

fixPowerfulSpelling();