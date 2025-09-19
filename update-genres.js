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

// Current valid genres (matching the cleaned GENRES array from main.js)
const VALID_GENRES = [
    "New", "Old", "Mid", "Hindi", "Marathi", "English", "Acoustic", "Dance", "Love", "Patriotic", 
    "Qawalli", "Evergreen", "Classical", "Ghazal", "Sufi", "Rock", "Blues", "Female", "Male", "Duet"
];

// Additional genres that could be mapped to valid ones
const GENRE_MAPPING = {
    "Bollywood": "Hindi",     // Bollywood songs are typically Hindi
    "Pop": "Dance",           // Pop can be categorized as Dance
    "Jazz": "Classical",      // Jazz can be categorized as Classical
    "Funk": "Dance",         // Funk can be categorized as Dance
    "Tensed": null,          // Remove this - it's more of a mood
};

// Mood tags that should NOT be in genres (these belong in mood field)
const MOOD_TAGS = [
    "Happy", "Sad", "Romantic", "Energetic", "Calm", "Melancholic", "Uplifting", "Peaceful", 
    "Intense", "Joyful", "Nostalgic", "Spiritual", "Devotional", "Celebratory", "Reflective", 
    "Passionate", "Soothing", "Motivational", "Dramatic", "Playful", "Contemplative", "Festive", 
    "Sorrowful", "Triumphant", "Mysterious", "Hopeful", "Cheerful", "Relaxing", "Inspiring", 
    "Emotional", "Meditative", "Groovy", "Upbeat", "Mellow", "Exciting", "Tender", "Powerful", 
    "Powerfull", "Tensed"  // Added Tensed as it's more of a mood
];

// Potentially invalid/deprecated genre tags that should be removed or mapped
const DEPRECATED_GENRES = [
    "Powerfull", // Misspelling that was in genres
    "Tensed",    // This is more of a mood
];

async function cleanGenres() {
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
        let genreStats = {
            invalidGenresRemoved: 0,
            moodTagsRemoved: 0,
            deprecatedGenresRemoved: 0,
            songsWithEmptyGenres: 0
        };
        
        for (const song of songs) {
            processedCount++;
            
            const originalGenres = song.genres || [];
            const originalGenresStr = JSON.stringify(originalGenres);
            
            if (!Array.isArray(originalGenres)) {
                console.log(`⚠️  Skipping "${song.title}" - genres is not an array: ${typeof originalGenres}`);
                continue;
            }
            
            // Clean genres step by step
            let cleanedGenres = [...originalGenres];
            let removedItems = [];
            let mappedItems = [];
            
            // 0. Apply genre mapping first
            cleanedGenres = cleanedGenres.map(genre => {
                if (GENRE_MAPPING[genre] !== undefined) {
                    if (GENRE_MAPPING[genre] === null) {
                        removedItems.push(`${genre} (mapped to remove)`);
                        return null;
                    } else {
                        mappedItems.push(`${genre} → ${GENRE_MAPPING[genre]}`);
                        return GENRE_MAPPING[genre];
                    }
                }
                return genre;
            }).filter(genre => genre !== null);
            
            // 1. Remove mood tags
            const moodTagsFound = cleanedGenres.filter(genre => 
                MOOD_TAGS.some(moodTag => 
                    genre.toLowerCase().includes(moodTag.toLowerCase()) ||
                    moodTag.toLowerCase().includes(genre.toLowerCase())
                )
            );
            if (moodTagsFound.length > 0) {
                genreStats.moodTagsRemoved += moodTagsFound.length;
                removedItems.push(...moodTagsFound.map(item => `${item} (mood)`));
            }
            cleanedGenres = cleanedGenres.filter(genre => 
                !MOOD_TAGS.some(moodTag => 
                    genre.toLowerCase().includes(moodTag.toLowerCase()) ||
                    moodTag.toLowerCase().includes(genre.toLowerCase())
                )
            );
            
            // 2. Remove deprecated genres
            const deprecatedFound = cleanedGenres.filter(genre => DEPRECATED_GENRES.includes(genre));
            if (deprecatedFound.length > 0) {
                genreStats.deprecatedGenresRemoved += deprecatedFound.length;
                removedItems.push(...deprecatedFound.map(item => `${item} (deprecated)`));
            }
            cleanedGenres = cleanedGenres.filter(genre => !DEPRECATED_GENRES.includes(genre));
            
            // 3. Remove genres not in valid list (case-insensitive)
            const invalidGenres = cleanedGenres.filter(genre => 
                !VALID_GENRES.some(validGenre => 
                    validGenre.toLowerCase() === genre.toLowerCase()
                )
            );
            if (invalidGenres.length > 0) {
                genreStats.invalidGenresRemoved += invalidGenres.length;
                removedItems.push(...invalidGenres.map(item => `${item} (invalid)`));
            }
            cleanedGenres = cleanedGenres.filter(genre => 
                VALID_GENRES.some(validGenre => 
                    validGenre.toLowerCase() === genre.toLowerCase()
                )
            );
            
            // 4. Normalize case (match exactly with VALID_GENRES)
            cleanedGenres = cleanedGenres.map(genre => {
                const validGenre = VALID_GENRES.find(valid => 
                    valid.toLowerCase() === genre.toLowerCase()
                );
                return validGenre || genre;
            });
            
            // 5. Remove duplicates
            cleanedGenres = [...new Set(cleanedGenres)];
            
            // Check if empty genres array
            if (cleanedGenres.length === 0 && originalGenres.length > 0) {
                genreStats.songsWithEmptyGenres++;
            }
            
            // Check if we need to update this song
            const cleanedGenresStr = JSON.stringify(cleanedGenres);
            const needsUpdate = originalGenresStr !== cleanedGenresStr;
            
            if (needsUpdate) {
                console.log(`\n🔄 Updating song: "${song.title}"`);
                console.log(`   📂 Original genres: [${originalGenres.join(', ')}]`);
                console.log(`   🧹 Cleaned genres: [${cleanedGenres.join(', ')}]`);
                if (mappedItems.length > 0) {
                    console.log(`   🔄 Mapped genres: [${mappedItems.join(', ')}]`);
                }
                if (removedItems.length > 0) {
                    console.log(`   ❌ Removed items: [${removedItems.join(', ')}]`);
                }
                
                // Update the song in database
                const updateResult = await songsCollection.updateOne(
                    { _id: song._id },
                    {
                        $set: {
                            genres: cleanedGenres,
                            updatedAt: new Date().toISOString(),
                            genreCleanupNote: 'Cleaned genres to match valid options and removed mood tags'
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
                console.log(`⏭️  Skipping "${song.title}" - genres already clean`);
            }
            
            // Progress indicator
            if (processedCount % 25 === 0) {
                console.log(`\n📈 Progress: ${processedCount}/${songs.length} songs processed`);
            }
        }
        
        console.log('\n🎉 Genre cleanup completed!');
        console.log(`📊 Summary:`);
        console.log(`   📋 Total songs processed: ${processedCount}`);
        console.log(`   ✅ Songs updated: ${updatedCount}`);
        console.log(`   ⏭️  Songs skipped: ${processedCount - updatedCount}`);
        console.log(`\n🧹 Cleanup Statistics:`);
        console.log(`   ❌ Mood tags removed: ${genreStats.moodTagsRemoved}`);
        console.log(`   ❌ Invalid genres removed: ${genreStats.invalidGenresRemoved}`);
        console.log(`   ❌ Deprecated genres removed: ${genreStats.deprecatedGenresRemoved}`);
        console.log(`   ⚠️  Songs with empty genres after cleanup: ${genreStats.songsWithEmptyGenres}`);
        
        // Show final genre distribution
        console.log('\n📊 Final genre distribution:');
        const genreDistribution = {};
        const allSongs = await songsCollection.find({}).toArray();
        allSongs.forEach(song => {
            if (song.genres && Array.isArray(song.genres)) {
                song.genres.forEach(genre => {
                    genreDistribution[genre] = (genreDistribution[genre] || 0) + 1;
                });
            }
        });
        
        Object.entries(genreDistribution)
            .sort(([,a], [,b]) => b - a)
            .forEach(([genre, count]) => {
                const isValid = VALID_GENRES.includes(genre);
                const status = isValid ? '✅' : '❌';
                console.log(`   ${status} ${genre}: ${count} songs`);
            });
        
    } catch (error) {
        console.error('❌ Genre cleanup failed:', error);
        process.exit(1);
    } finally {
        await client.close();
        console.log('\n🔌 Database connection closed');
    }
}

// Add command line options
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run') || args.includes('-d');
const verbose = args.includes('--verbose') || args.includes('-v');

if (dryRun) {
    console.log('🧪 DRY RUN MODE - No changes will be made to the database');
    console.log('Remove --dry-run flag to perform actual cleanup');
}

async function dryRunCleanup() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await client.connect();
        
        const db = client.db();
        const songsCollection = db.collection('OldNewSongs');
        
        console.log('📊 Fetching all songs...');
        const songs = await songsCollection.find({}).toArray();
        console.log(`📋 Found ${songs.length} songs to analyze`);
        
        let wouldUpdateCount = 0;
        let genreIssues = {
            songsWithMoodTags: 0,
            songsWithInvalidGenres: 0,
            songsWithDeprecatedGenres: 0,
            totalIssues: 0
        };
        
        for (const song of songs) {
            const originalGenres = song.genres || [];
            if (!Array.isArray(originalGenres)) continue;
            
            let hasIssues = false;
            let issues = [];
            
            // Check for mood tags
            const moodTagsFound = originalGenres.filter(genre => 
                MOOD_TAGS.some(moodTag => 
                    genre.toLowerCase().includes(moodTag.toLowerCase()) ||
                    moodTag.toLowerCase().includes(genre.toLowerCase())
                )
            );
            if (moodTagsFound.length > 0) {
                hasIssues = true;
                genreIssues.songsWithMoodTags++;
                issues.push(`Mood tags: [${moodTagsFound.join(', ')}]`);
            }
            
            // Check for invalid genres
            const invalidGenres = originalGenres.filter(genre => 
                !VALID_GENRES.some(validGenre => 
                    validGenre.toLowerCase() === genre.toLowerCase()
                ) && !MOOD_TAGS.some(moodTag => 
                    genre.toLowerCase().includes(moodTag.toLowerCase())
                )
            );
            if (invalidGenres.length > 0) {
                hasIssues = true;
                genreIssues.songsWithInvalidGenres++;
                issues.push(`Invalid genres: [${invalidGenres.join(', ')}]`);
            }
            
            if (hasIssues) {
                wouldUpdateCount++;
                genreIssues.totalIssues += moodTagsFound.length + invalidGenres.length;
                
                if (verbose) {
                    console.log(`\n📝 Would update: "${song.title}"`);
                    console.log(`   📂 Current genres: [${originalGenres.join(', ')}]`);
                    issues.forEach(issue => console.log(`   ⚠️  ${issue}`));
                }
            }
        }
        
        console.log('\n🧪 DRY RUN RESULTS:');
        console.log(`📋 Total songs: ${songs.length}`);
        console.log(`✅ Songs that would be updated: ${wouldUpdateCount}`);
        console.log(`⏭️  Songs that would be skipped: ${songs.length - wouldUpdateCount}`);
        console.log(`\n📊 Issues found:`);
        console.log(`   🎭 Songs with mood tags in genres: ${genreIssues.songsWithMoodTags}`);
        console.log(`   ❌ Songs with invalid genres: ${genreIssues.songsWithInvalidGenres}`);
        console.log(`   🔢 Total invalid items: ${genreIssues.totalIssues}`);
        
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
🧹 Genre Cleanup Script

This script cleans up song genres by:
- Removing mood tags that belong in the mood field
- Removing invalid/deprecated genre options
- Normalizing case and removing duplicates
- Ensuring only valid genres remain

Usage:
  node update-genres.js [options]

Options:
  --dry-run, -d    Run without making changes (preview mode)
  --verbose, -v    Show detailed output for each song
  --help, -h       Show this help message

Examples:
  node update-genres.js --dry-run          # Preview changes
  node update-genres.js --dry-run -v       # Preview with details
  node update-genres.js                    # Perform cleanup

Valid Genres:
${VALID_GENRES.join(', ')}

Mood tags that will be removed from genres:
${MOOD_TAGS.slice(0, 10).join(', ')}, ... (and ${MOOD_TAGS.length - 10} more)
`);
    process.exit(0);
}

// Run the appropriate function
if (dryRun) {
    dryRunCleanup();
} else {
    cleanGenres();
}