#!/usr/bin/env node

require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

// Define mood-related tags that might be in genres
const MOOD_TAGS = [
    "Happy", "Sad", "Romantic", "Energetic", "Calm", "Melancholic", "Uplifting", 
    "Peaceful", "Intense", "Joyful", "Nostalgic", "Spiritual", "Devotional", 
    "Celebratory", "Reflective", "Passionate", "Soothing", "Motivational",
    "Dramatic", "Playful", "Contemplative", "Festive", "Sorrowful", "Triumphant", 
    "Mysterious", "Hopeful", "Cheerful", "Relaxing", "Inspiring", "Emotional",
    "Meditative", "Groovy", "Upbeat", "Mellow", "Exciting", "Tender", "Powerful"
];

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

async function migrateMoods() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await client.connect();
        
        const db = client.db();
        const songsCollection = db.collection('OldNewSongs');
        
        console.log('📊 Fetching all songs...');
        const songs = await songsCollection.find({}).toArray();
        console.log(`📋 Found ${songs.length} songs to process`);
        
        let processedCount = 0;
        let updatedCount = 0;
        
        for (const song of songs) {
            processedCount++;
            
            // Get current genres and mood
            const currentGenres = song.genres || [];
            const currentMood = song.mood || '';
            
            // Find mood-related tags in genres
            const moodTagsInGenres = currentGenres.filter(genre => 
                MOOD_TAGS.some(moodTag => 
                    genre.toLowerCase().includes(moodTag.toLowerCase()) ||
                    moodTag.toLowerCase().includes(genre.toLowerCase())
                )
            );
            
            // Remove mood tags from genres
            const cleanedGenres = currentGenres.filter(genre => 
                !MOOD_TAGS.some(moodTag => 
                    genre.toLowerCase().includes(moodTag.toLowerCase()) ||
                    moodTag.toLowerCase().includes(genre.toLowerCase())
                )
            );
            
            // Combine existing mood with extracted mood tags
            const allMoodTags = [];
            if (currentMood) {
                // Split current mood by comma and add to array
                allMoodTags.push(...currentMood.split(',').map(m => m.trim()).filter(m => m));
            }
            allMoodTags.push(...moodTagsInGenres);
            
            // Remove duplicates and create new mood string
            const uniqueMoodTags = [...new Set(allMoodTags)];
            const newMood = uniqueMoodTags.join(', ');
            
            // Check if we need to update this song
            const needsUpdate = moodTagsInGenres.length > 0 || 
                               JSON.stringify(currentGenres) !== JSON.stringify(cleanedGenres);
            
            if (needsUpdate) {
                console.log(`\n🔄 Updating song: "${song.title}"`);
                console.log(`   📂 Original genres: [${currentGenres.join(', ')}]`);
                console.log(`   🧹 Cleaned genres: [${cleanedGenres.join(', ')}]`);
                console.log(`   🎭 Original mood: "${currentMood}"`);
                console.log(`   🎭 New mood: "${newMood}"`);
                console.log(`   🏷️  Extracted mood tags: [${moodTagsInGenres.join(', ')}]`);
                
                // Update the song in database
                const updateResult = await songsCollection.updateOne(
                    { _id: song._id },
                    {
                        $set: {
                            genres: cleanedGenres,
                            mood: newMood,
                            updatedAt: new Date().toISOString(),
                            migrationNote: 'Moved mood tags from genres to mood field'
                        }
                    }
                );
                
                if (updateResult.modifiedCount > 0) {
                    updatedCount++;
                    console.log(`   ✅ Successfully updated`);
                } else {
                    console.log(`   ⚠️  No changes made`);
                }
            } else {
                console.log(`⏭️  Skipping "${song.title}" - no mood tags in genres`);
            }
            
            // Progress indicator
            if (processedCount % 10 === 0) {
                console.log(`\n📈 Progress: ${processedCount}/${songs.length} songs processed`);
            }
        }
        
        console.log('\n🎉 Migration completed!');
        console.log(`📊 Summary:`);
        console.log(`   📋 Total songs processed: ${processedCount}`);
        console.log(`   ✅ Songs updated: ${updatedCount}`);
        console.log(`   ⏭️  Songs skipped: ${processedCount - updatedCount}`);
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await client.close();
        console.log('🔌 Database connection closed');
    }
}

// Add command line options
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run') || args.includes('-d');
const verbose = args.includes('--verbose') || args.includes('-v');

if (dryRun) {
    console.log('🧪 DRY RUN MODE - No changes will be made to the database');
    console.log('Remove --dry-run flag to perform actual migration');
}

async function dryRunMigration() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await client.connect();
        
        const db = client.db();
        const songsCollection = db.collection('OldNewSongs');
        
        console.log('📊 Fetching all songs...');
        const songs = await songsCollection.find({}).toArray();
        console.log(`📋 Found ${songs.length} songs to analyze`);
        
        let wouldUpdateCount = 0;
        
        for (const song of songs) {
            const currentGenres = song.genres || [];
            const currentMood = song.mood || '';
            
            const moodTagsInGenres = currentGenres.filter(genre => 
                MOOD_TAGS.some(moodTag => 
                    genre.toLowerCase().includes(moodTag.toLowerCase()) ||
                    moodTag.toLowerCase().includes(genre.toLowerCase())
                )
            );
            
            if (moodTagsInGenres.length > 0) {
                wouldUpdateCount++;
                if (verbose) {
                    console.log(`\n📝 Would update: "${song.title}"`);
                    console.log(`   🏷️  Found mood tags in genres: [${moodTagsInGenres.join(', ')}]`);
                    console.log(`   🎭 Current mood: "${currentMood}"`);
                }
            }
        }
        
        console.log('\n🧪 DRY RUN RESULTS:');
        console.log(`📋 Total songs: ${songs.length}`);
        console.log(`✅ Songs that would be updated: ${wouldUpdateCount}`);
        console.log(`⏭️  Songs that would be skipped: ${songs.length - wouldUpdateCount}`);
        
    } catch (error) {
        console.error('❌ Dry run failed:', error);
        process.exit(1);
    } finally {
        await client.close();
    }
}

// Show help
if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🎵 Mood Migration Script

This script migrates mood-related tags from the 'genres' field to the 'mood' field.

Usage:
  node migrate-moods.js [options]

Options:
  --dry-run, -d    Run without making changes (preview mode)
  --verbose, -v    Show detailed output for each song
  --help, -h       Show this help message

Examples:
  node migrate-moods.js --dry-run          # Preview changes
  node migrate-moods.js --dry-run -v       # Preview with details
  node migrate-moods.js                    # Perform migration

Mood tags that will be migrated:
${MOOD_TAGS.join(', ')}
`);
    process.exit(0);
}

// Run the appropriate function
if (dryRun) {
    dryRunMigration();
} else {
    migrateMoods();
}