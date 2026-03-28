/**
 * Build Rhythm Set Profiles - Initial Migration Script
 * 
 * Generates rhythm set profiles from existing song assignments.
 * Run this script once to initialize the profile system.
 * 
 * Usage:
 *   node scripts/core/build-rhythm-set-profiles.js [--dry-run]
 * 
 * Options:
 *   --dry-run    Show what would be created without writing to database
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const { calculateProfileForRhythmSet } = require('./rhythm-set-profile-manager');

const DRY_RUN = process.argv.includes('--dry-run');

async function buildAllProfiles() {
  console.log('🚀 Rhythm Set Profile Builder');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no database writes)' : 'LIVE (will update database)'}`);
  console.log('=' .repeat(60));
  
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI not found in environment variables');
  }
  
  const client = new MongoClient(mongoUri);
  
  try {
    // Connect to MongoDB
    console.log('\n📡 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected successfully\n');
    
    const db = client.db('OldNewSongs');
    const songsCollection = db.collection('OldNewSongs');
    const profilesCollection = db.collection('RhythmSetProfiles');
    
    // Get all unique rhythm set IDs from songs
    console.log('🔍 Finding all rhythm sets with song assignments...');
    const rhythmSetIds = await songsCollection.distinct('rhythmSetId', {
      rhythmSetId: { $exists: true, $ne: null, $ne: '' }
    });
    
    console.log(`Found ${rhythmSetIds.length} rhythm sets with assigned songs\n`);
    
    if (rhythmSetIds.length === 0) {
      console.log('⚠️  No rhythm sets found with song assignments');
      console.log('   Nothing to profile. Exiting.');
      return;
    }
    
    // Build profile for each rhythm set
    const profiles = [];
    let totalSongsProcessed = 0;
    
    console.log('📊 Building profiles...\n');
    
    for (const rhythmSetId of rhythmSetIds) {
      if (!rhythmSetId) continue; // Skip null/undefined/empty
      
      const profile = await calculateProfileForRhythmSet(songsCollection, rhythmSetId);
      profiles.push(profile);
      totalSongsProcessed += profile.totalSongs;
      
      console.log(`  ✓ ${String(rhythmSetId).padEnd(20)} - ${profile.totalSongs} songs`);
      
      // Show detailed profile for first few (or in dry-run mode)
      if (profiles.length <= 3 || DRY_RUN) {
        console.log(`    Moods: ${Object.keys(profile.moods).length > 0 ? JSON.stringify(profile.moods) : 'none'}`);
        console.log(`    Genres: ${Object.keys(profile.genres).length > 0 ? JSON.stringify(profile.genres) : 'none'}`);
        console.log(`    Taals: ${Object.keys(profile.taals).length > 0 ? JSON.stringify(profile.taals) : 'none'}`);
        console.log(`    Rhythm Categories: ${Object.keys(profile.rhythmCategories).length > 0 ? JSON.stringify(profile.rhythmCategories) : 'none'}`);
        console.log(`    Time Signatures: ${Object.keys(profile.timeSignatures).length > 0 ? JSON.stringify(profile.timeSignatures) : 'none'}`);
        console.log(`    BPM: ${profile.bpm.count > 0 ? `${profile.bpm.min}-${profile.bpm.max} (avg ${profile.bpm.avg})` : 'none'}`);
        console.log('');
      }
    }
    
    console.log('=' .repeat(60));
    console.log('\n📈 Summary:');
    console.log(`  Rhythm Sets Profiled: ${profiles.length}`);
    console.log(`  Total Songs Analyzed: ${totalSongsProcessed}`);
    console.log(`  Average Songs per Set: ${Math.round(totalSongsProcessed / profiles.length)}`);
    
    // Find immature profiles (< 3 songs)
    const immatureProfiles = profiles.filter(p => p.totalSongs < 3);
    if (immatureProfiles.length > 0) {
      console.log(`  ⚠️  Immature Profiles (<3 songs): ${immatureProfiles.length}`);
      console.log(`     ${immatureProfiles.map(p => `${p.rhythmSetId}(${p.totalSongs})`).join(', ')}`);
    }
    
    // Write to database
    if (!DRY_RUN) {
      console.log('\n💾 Writing profiles to database...');
      
      // Create index if it doesn't exist
      await profilesCollection.createIndex({ rhythmSetId: 1 }, { unique: true });
      
      // Upsert each profile
      let updated = 0;
      let created = 0;
      
      for (const profile of profiles) {
        const result = await profilesCollection.updateOne(
          { rhythmSetId: profile.rhythmSetId },
          { $set: profile },
          { upsert: true }
        );
        
        if (result.upsertedCount > 0) {
          created++;
        } else if (result.modifiedCount > 0) {
          updated++;
        }
      }
      
      console.log(`✅ Database updated:`);
      console.log(`   Created: ${created} profiles`);
      console.log(`   Updated: ${updated} profiles`);
    } else {
      console.log('\n⏭️  DRY RUN: No database changes made');
      console.log('   Run without --dry-run flag to write profiles to database');
    }
    
    console.log('\n🎉 Profile build complete!');
    
  } catch (error) {
    console.error('\n❌ Error building profiles:', error);
    throw error;
  } finally {
    await client.close();
    console.log('\n📡 Disconnected from MongoDB');
  }
}

// Run the migration
if (require.main === module) {
  buildAllProfiles()
    .then(() => {
      console.log('\n✨ Done!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Fatal error:', error.message);
      process.exit(1);
    });
}

module.exports = { buildAllProfiles };
