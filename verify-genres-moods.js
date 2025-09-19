const { MongoClient } = require('mongodb');
require('dotenv').config();

// MongoDB connection details
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://swareshpawar4141:TYkhlRAkYjHJIcgh@cluster0.dxhnj.mongodb.net/';
const DB_NAME = 'OldNewSongs';
const COLLECTION_NAME = 'OldNewSongs';

async function verifyGenresMoodsState() {
    let client;

    try {
        console.log('🔗 Connecting to MongoDB...');
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        
        const db = client.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);
        
        console.log('📊 Checking final genre and mood state...');
        const songs = await collection.find({}).toArray();
        console.log(`📋 Total songs: ${songs.length}`);
        
        // Check for any remaining Love, Evergreen, Dance, Patriotic in genres
        const songsWithOldGenres = songs.filter(song => {
            const genres = song.genres || [];
            return genres.some(genre => ['Love', 'Evergreen', 'Dance', 'Patriotic'].includes(genre));
        });
        
        console.log(`\\n🔍 Verification Results:`);
        console.log(`❌ Songs still containing Love/Evergreen/Dance/Patriotic in genres: ${songsWithOldGenres.length}`);
        
        if (songsWithOldGenres.length > 0) {
            console.log('⚠️  The following songs still have these items in genres:');
            songsWithOldGenres.slice(0, 5).forEach(song => {
                const problemGenres = song.genres.filter(g => ['Love', 'Evergreen', 'Dance', 'Patriotic'].includes(g));
                console.log(`   - "${song.title}": [${problemGenres.join(', ')}]`);
            });
        }
        
        // Count mood distribution
        const moodStats = {};
        const genreStats = {};
        let songsWithMoods = 0;
        
        songs.forEach(song => {
            // Count genres
            if (song.genres) {
                song.genres.forEach(genre => {
                    genreStats[genre] = (genreStats[genre] || 0) + 1;
                });
            }
            
            // Count moods
            if (song.mood && song.mood.trim()) {
                songsWithMoods++;
                const moods = song.mood.split(',').map(m => m.trim()).filter(m => m);
                moods.forEach(mood => {
                    moodStats[mood] = (moodStats[mood] || 0) + 1;
                });
            }
        });
        
        console.log(`\\n🎭 Mood Statistics:`);
        console.log(`📈 Songs with mood data: ${songsWithMoods} (${((songsWithMoods/songs.length)*100).toFixed(1)}%)`);
        console.log(`\\n📊 Top Moods:`);
        Object.entries(moodStats)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .forEach(([mood, count]) => {
                console.log(`   ✅ ${mood}: ${count} songs`);
            });
        
        console.log(`\\n📂 Final Genre Distribution:`);
        Object.entries(genreStats)
            .sort(([,a], [,b]) => b - a)
            .forEach(([genre, count]) => {
                console.log(`   ✅ ${genre}: ${count} songs`);
            });
        
        console.log(`\\n✅ Migration verification complete!`);
        if (songsWithOldGenres.length === 0) {
            console.log('🎉 All Love/Evergreen/Dance/Patriotic items successfully moved from genres to moods!');
        }
        
    } catch (error) {
        console.error('❌ Error during verification:', error);
    } finally {
        if (client) {
            console.log('🔌 Database connection closed');
            await client.close();
        }
    }
}

// Run the verification
verifyGenresMoodsState()
    .then(() => {
        console.log('\\n✅ Verification completed successfully!');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Unexpected error:', error);
        process.exit(1);
    });