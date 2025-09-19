const { MongoClient } = require('mongodb');
require('dotenv').config();

// MongoDB connection details
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://swareshpawar4141:TYkhlRAkYjHJIcgh@cluster0.dxhnj.mongodb.net/';
const DB_NAME = process.env.DB_NAME || 'OldNewSongs';
const COLLECTION_NAME = process.env.COLLECTION_NAME || 'OldNewSongs';

// Items to move from genres to moods
const GENRE_TO_MOOD_ITEMS = ['Love', 'Evergreen', 'Dance', 'Patriotic'];

// Updated GENRES array (removing the items that will become moods)
const UPDATED_GENRES = [
    "New", "Old", "Mid", "Hindi", "Marathi", "English", "Acoustic", "Qawalli", "Classical", "Ghazal", "Sufi", "Rock",
    "Blues", "Female", "Male", "Duet"
];

// Updated MOODS array (adding the new mood items)
const UPDATED_MOODS = [
    "Happy", "Sad", "Romantic", "Powerful", "Soothing", "Motivational", "Joyful",
    "Nostalgic", "Celebratory", "Passionate", "Festive", "Sorrowful",
    "Love", "Evergreen", "Dance", "Patriotic"
];

async function migrateGenresToMoods(preview = false) {
    let client;

    try {
        console.log('🔗 Connecting to MongoDB...');
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        
        const db = client.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);
        
        console.log('📊 Fetching all songs...');
        const songs = await collection.find({}).toArray();
        console.log(`📋 Found ${songs.length} songs to process`);
        
        if (songs.length === 0) {
            console.log('⚠️  No songs found in collection. Please check your database connection and collection name.');
            console.log(`🔍 Database: ${DB_NAME}, Collection: ${COLLECTION_NAME}`);
            return { success: true, updated: 0 };
        }
        
        let songsToUpdate = [];
        let processedCount = 0;
        let updatedCount = 0;
        let migrationStats = { love: 0, evergreen: 0, dance: 0, patriotic: 0 };
        
        for (const song of songs) {
            processedCount++;
            
            // Show progress every 25 songs
            if (processedCount % 25 === 0) {
                console.log(`📈 Progress: ${processedCount}/${songs.length} songs processed`);
            }
            
            const genres = song.genres || [];
            const currentMood = song.mood || '';
            
            // Find genre items that should become moods
            const genreItemsToMove = genres.filter(genre => GENRE_TO_MOOD_ITEMS.includes(genre));
            
            if (genreItemsToMove.length === 0) {
                console.log(`⏭️  Skipping "${song.title}" - no genres to move to moods`);
                continue;
            }
            
            // Remove the items from genres
            const updatedGenres = genres.filter(genre => !GENRE_TO_MOOD_ITEMS.includes(genre));
            
            // Add the items to mood (merge with existing mood)
            const existingMoods = currentMood ? currentMood.split(',').map(m => m.trim()).filter(m => m) : [];
            const newMoodItems = genreItemsToMove.filter(item => !existingMoods.includes(item));
            const allMoods = [...existingMoods, ...newMoodItems];
            const updatedMood = allMoods.join(', ');
            
            console.log(`🔄 ${preview ? 'Preview' : 'Updating'} song: "${song.title}"`);
            console.log(`   📂 Original genres: [${genres.join(', ')}]`);
            console.log(`   🧹 Updated genres: [${updatedGenres.join(', ')}]`);
            console.log(`   🎭 Original mood: "${currentMood}"`);
            console.log(`   🎭 Updated mood: "${updatedMood}"`);
            console.log(`   ➡️  Moved to mood: [${genreItemsToMove.join(', ')}]`);
            
            // Update migration stats
            genreItemsToMove.forEach(item => {
                if (item === 'Love') migrationStats.love++;
                if (item === 'Evergreen') migrationStats.evergreen++;
                if (item === 'Dance') migrationStats.dance++;
                if (item === 'Patriotic') migrationStats.patriotic++;
            });
            
            if (!preview) {
                const updateDoc = {
                    $set: {
                        genres: updatedGenres,
                        mood: updatedMood,
                        migrationNote: 'Genre to mood migration: moved Love/Evergreen/Dance/Patriotic from genres to mood field'
                    }
                };
                
                const result = await collection.updateOne(
                    { _id: song._id },
                    updateDoc
                );
                
                if (result.modifiedCount > 0) {
                    console.log(`   ✅ Successfully updated`);
                    updatedCount++;
                } else {
                    console.log(`   ❌ Failed to update`);
                }
            } else {
                songsToUpdate.push({
                    title: song.title,
                    originalGenres: genres,
                    updatedGenres: updatedGenres,
                    originalMood: currentMood,
                    updatedMood: updatedMood,
                    movedItems: genreItemsToMove
                });
                updatedCount++;
            }
        }
        
        console.log('\\n🎉 Genre to mood migration completed!');
        console.log('📊 Summary:');
        console.log(`   📋 Total songs processed: ${songs.length}`);
        console.log(`   ✅ Songs ${preview ? 'to be updated' : 'updated'}: ${updatedCount}`);
        console.log(`   ⏭️  Songs skipped: ${songs.length - updatedCount}`);
        
        if (preview) {
            console.log('\\n📝 Preview mode - no changes were made to the database');
            console.log('💡 Run without --preview flag to perform actual migration');
            
            console.log('\\n🔍 Sample songs to be updated:');
            songsToUpdate.slice(0, 5).forEach((song, index) => {
                console.log(`${index + 1}. "${song.title}"`);
                console.log(`   Genres: [${song.originalGenres.join(', ')}] → [${song.updatedGenres.join(', ')}]`);
                console.log(`   Mood: "${song.originalMood}" → "${song.updatedMood}"`);
                console.log(`   Moved: [${song.movedItems.join(', ')}]`);
            });
        } else {
            console.log('\\n🧹 Migration Statistics:');
            console.log(`   ❌ Love tags moved to mood: ${migrationStats.love}`);
            console.log(`   ❌ Evergreen tags moved to mood: ${migrationStats.evergreen}`);
            console.log(`   ❌ Dance tags moved to mood: ${migrationStats.dance}`);
            console.log(`   ❌ Patriotic tags moved to mood: ${migrationStats.patriotic}`);
            
            console.log('\\n📊 Final genre distribution:');
            const finalGenres = {};
            const allSongs = await collection.find({}).toArray();
            allSongs.forEach(song => {
                if (song.genres) {
                    song.genres.forEach(genre => {
                        finalGenres[genre] = (finalGenres[genre] || 0) + 1;
                    });
                }
            });
            
            Object.entries(finalGenres)
                .sort(([,a], [,b]) => b - a)
                .forEach(([genre, count]) => {
                    console.log(`   ✅ ${genre}: ${count} songs`);
                });
        }
        
        return { success: true, updated: updatedCount };
        
    } catch (error) {
        console.error('❌ Error during migration:', error);
        return { success: false, error: error.message };
    } finally {
        if (client) {
            console.log('🔌 Database connection closed');
            await client.close();
        }
    }
}

// Check command line arguments
const isPreview = process.argv.includes('--preview');

// Run the migration
migrateGenresToMoods(isPreview)
    .then(result => {
        if (result.success) {
            console.log(`\\n✅ Migration ${isPreview ? 'preview' : 'completed'} successfully!`);
            process.exit(0);
        } else {
            console.error(`\\n❌ Migration failed: ${result.error}`);
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('❌ Unexpected error:', error);
        process.exit(1);
    });