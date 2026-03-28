/**
 * Suggest Rhythm Set Assignments Based on Reference Song
 * 
 * Finds songs similar to a reference song and suggests the same rhythm set assignment.
 * Creates a markdown report for manual review before applying changes.
 * 
 * Usage:
 *   node scripts/core/suggest-rhythm-assignments.js "Song Title" [--min-score=70] [--apply]
 * 
 * Options:
 *   --min-score=N    Minimum similarity score (0-100, default: 70)
 *   --apply          Actually apply the assignments (default: just report)
 *   --unassigned     Only consider songs without rhythm sets
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const { scoreProfileMatch } = require('./rhythm-set-profile-scorer');

// Parse command line arguments
const args = process.argv.slice(2);
const songTitle = args.find(arg => !arg.startsWith('--'));
const minScore = parseInt(args.find(arg => arg.startsWith('--min-score='))?.split('=')[1] || '70');
const shouldApply = args.includes('--apply');
const unassignedOnly = args.includes('--unassigned');

if (!songTitle) {
  console.error('❌ Error: Song title is required');
  console.log('\nUsage: node scripts/core/suggest-rhythm-assignments.js "Song Title" [--min-score=70] [--apply] [--unassigned]');
  process.exit(1);
}

async function suggestRhythmAssignments() {
  console.log('🎵 Rhythm Set Assignment Suggester');
  console.log('=' .repeat(60));
  console.log(`Reference Song: "${songTitle}"`);
  console.log(`Minimum Score: ${minScore}`);
  console.log(`Mode: ${shouldApply ? 'APPLY CHANGES' : 'REPORT ONLY'}`);
  console.log(`Filter: ${unassignedOnly ? 'Unassigned songs only' : 'All songs'}`);
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
    
    // Find the reference song
    console.log(`🔍 Finding reference song: "${songTitle}"...`);
    const referenceSong = await songsCollection.findOne({ 
      title: { $regex: new RegExp(songTitle, 'i') } 
    });
    
    if (!referenceSong) {
      console.error(`❌ Song "${songTitle}" not found in database`);
      process.exit(1);
    }
    
    if (!referenceSong.rhythmSetId) {
      console.error(`❌ Song "${songTitle}" does not have a rhythm set assigned`);
      console.log('   Please assign a rhythm set to this song first.');
      process.exit(1);
    }
    
    console.log(`✅ Found: "${referenceSong.title}"`);
    console.log(`   ID: ${referenceSong.id}`);
    console.log(`   Rhythm Set: ${referenceSong.rhythmSetId}`);
    console.log(`   Mood: ${referenceSong.mood || 'none'}`);
    console.log(`   Genre: ${referenceSong.genre || 'none'}`);
    console.log(`   Taal: ${referenceSong.taal || 'none'}`);
    console.log(`   Tempo: ${referenceSong.tempo || 'none'}`);
    console.log(`   Time Signature: ${referenceSong.timeSignature || referenceSong.time || 'none'}`);
    console.log(`   Rhythm Category: ${referenceSong.rhythmCategory || 'none'}`);
    
    // Get the profile for this rhythm set
    const targetProfile = await profilesCollection.findOne({ 
      rhythmSetId: referenceSong.rhythmSetId 
    });
    
    if (!targetProfile) {
      console.warn(`⚠️  No profile found for rhythm set ${referenceSong.rhythmSetId}`);
      console.log('   Profile will be created automatically when songs are assigned.');
    } else {
      console.log(`\n📊 Target Profile Statistics:`);
      console.log(`   Total Songs: ${targetProfile.totalSongs}`);
      console.log(`   Moods: ${Object.keys(targetProfile.moods || {}).length} types`);
      console.log(`   Genres: ${Object.keys(targetProfile.genres || {}).length} types`);
      console.log(`   Taals: ${Object.keys(targetProfile.taals || {}).length} types`);
      console.log(`   Rhythm Categories: ${Object.keys(targetProfile.rhythmCategories || {}).length} types`);
    }
    
    // Find candidate songs
    console.log(`\n🔍 Finding candidate songs...`);
    const query = unassignedOnly 
      ? { rhythmSetId: { $exists: false } }
      : { id: { $ne: referenceSong.id } }; // Exclude reference song
    
    const candidateSongs = await songsCollection.find(query).toArray();
    console.log(`   Found ${candidateSongs.length} candidate songs`);
    
    if (candidateSongs.length === 0) {
      console.log('\n✨ No candidate songs found. All done!');
      return;
    }
    
    // Score each candidate against the reference song's profile
    console.log(`\n📊 Scoring candidates against profile...`);
    const scoredCandidates = [];
    
    // Get scoring weights
    const profileScoringConfig = db.collection('ProfileScoringConfig');
    const config = await profileScoringConfig.findOne({ _id: 'default' });
    const weights = config?.weights || { 
      mood: 22, genre: 18, taal: 18, rhythmCategory: 10, bpm: 18, timeSignature: 14 
    };
    
    for (const candidate of candidateSongs) {
      if (!targetProfile) {
        // No profile yet, just use simple matching
        let score = 0;
        if (candidate.mood && referenceSong.mood && 
            JSON.stringify(candidate.mood) === JSON.stringify(referenceSong.mood)) score += 25;
        if (candidate.genre === referenceSong.genre) score += 20;
        if (candidate.taal === referenceSong.taal) score += 20;
        if (candidate.rhythmCategory === referenceSong.rhythmCategory) score += 10;
        
        scoredCandidates.push({
          song: candidate,
          score: score,
          details: ['Simple matching (no profile yet)']
        });
      } else {
        const result = scoreProfileMatch(candidate, targetProfile, weights);
        if (result.score >= minScore) {
          scoredCandidates.push({
            song: candidate,
            score: result.score,
            details: result.details
          });
        }
      }
    }
    
    // Sort by score descending
    scoredCandidates.sort((a, b) => b.score - a.score);
    
    console.log(`   ✅ Found ${scoredCandidates.length} songs with score >= ${minScore}`);
    
    if (scoredCandidates.length === 0) {
      console.log('\n✨ No similar songs found above the minimum score threshold.');
      console.log(`   Try lowering --min-score (current: ${minScore})`);
      return;
    }
    
    // Generate markdown report
    const timestamp = new Date().toISOString().split('T')[0];
    const reportPath = path.join(__dirname, '..', '..', `rhythm-assignment-suggestions-${timestamp}.md`);
    
    let markdown = `# Rhythm Set Assignment Suggestions\n\n`;
    markdown += `**Generated:** ${new Date().toISOString()}\n\n`;
    markdown += `**Reference Song:** ${referenceSong.title}\n\n`;
    markdown += `**Suggested Rhythm Set:** ${referenceSong.rhythmSetId}\n\n`;
    markdown += `**Minimum Score:** ${minScore}\n\n`;
    markdown += `**Candidates Found:** ${scoredCandidates.length}\n\n`;
    markdown += `---\n\n`;
    
    markdown += `## Reference Song Details\n\n`;
    markdown += `- **Title:** ${referenceSong.title}\n`;
    markdown += `- **ID:** ${referenceSong.id}\n`;
    markdown += `- **Rhythm Set:** ${referenceSong.rhythmSetId}\n`;
    markdown += `- **Mood:** ${referenceSong.mood || 'none'}\n`;
    markdown += `- **Genre:** ${referenceSong.genre || 'none'}\n`;
    markdown += `- **Taal:** ${referenceSong.taal || 'none'}\n`;
    markdown += `- **Tempo:** ${referenceSong.tempo || 'none'}\n`;
    markdown += `- **Time Signature:** ${referenceSong.timeSignature || referenceSong.time || 'none'}\n`;
    markdown += `- **Rhythm Category:** ${referenceSong.rhythmCategory || 'none'}\n\n`;
    
    markdown += `---\n\n`;
    markdown += `## Suggested Assignments (${scoredCandidates.length} songs)\n\n`;
    
    for (let i = 0; i < scoredCandidates.length; i++) {
      const { song, score, details } = scoredCandidates[i];
      markdown += `### ${i + 1}. ${song.title} (Score: ${score.toFixed(1)})\n\n`;
      markdown += `- **ID:** ${song.id}\n`;
      markdown += `- **Current Rhythm Set:** ${song.rhythmSetId || '(unassigned)'}\n`;
      markdown += `- **Mood:** ${song.mood || 'none'}\n`;
      markdown += `- **Genre:** ${song.genre || 'none'}\n`;
      markdown += `- **Taal:** ${song.taal || 'none'}\n`;
      markdown += `- **Tempo:** ${song.tempo || 'none'}\n`;
      markdown += `- **Time Signature:** ${song.timeSignature || song.time || 'none'}\n`;
      markdown += `- **Rhythm Category:** ${song.rhythmCategory || 'none'}\n`;
      markdown += `- **Match Reasons:** ${details.join(', ')}\n`;
      markdown += `- **Suggested Action:** Assign rhythm set **${referenceSong.rhythmSetId}**\n\n`;
    }
    
    markdown += `---\n\n`;
    markdown += `## How to Apply\n\n`;
    markdown += `Review the suggestions above and apply them manually through the admin UI, or run:\n\n`;
    markdown += `\`\`\`bash\n`;
    markdown += `node scripts/core/suggest-rhythm-assignments.js "${songTitle}" --min-score=${minScore} --apply\n`;
    markdown += `\`\`\`\n\n`;
    markdown += `This will automatically assign the rhythm set to all suggested songs.\n`;
    
    // Write markdown file
    fs.writeFileSync(reportPath, markdown, 'utf8');
    console.log(`\n📝 Report saved to: ${reportPath}`);
    
    // Apply changes if requested
    if (shouldApply) {
      console.log(`\n🔄 Applying rhythm set assignments...`);
      let applied = 0;
      
      for (const { song } of scoredCandidates) {
        await songsCollection.updateOne(
          { id: song.id },
          { 
            $set: { 
              rhythmSetId: referenceSong.rhythmSetId,
              rhythmFamily: referenceSong.rhythmFamily,
              rhythmSetNo: referenceSong.rhythmSetNo,
              updatedAt: new Date().toISOString(),
              updatedBy: 'auto-assignment-script'
            } 
          }
        );
        applied++;
        console.log(`   ✓ Applied to: ${song.title} (ID: ${song.id})`);
      }
      
      console.log(`\n✅ Applied ${applied} assignments`);
      console.log(`   Profile for ${referenceSong.rhythmSetId} will auto-update`);
    } else {
      console.log(`\n⚠️  DRY RUN: No changes were made to the database`);
      console.log(`   Review the report and run with --apply flag to apply assignments`);
    }
    
    console.log(`\n🎉 Done!`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    await client.close();
    console.log('\n📡 Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  suggestRhythmAssignments()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { suggestRhythmAssignments };
