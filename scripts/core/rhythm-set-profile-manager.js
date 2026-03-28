/**
 * Rhythm Set Profile Manager
 * 
 * Handles calculation and updates of rhythm set profiles based on song assignments.
 * Profiles track mood, genre, taal, time signature, and BPM patterns for each rhythm set.
 */

/**
 * Calculate statistics for an array of BPM values
 * @param {number[]} bpmValues - Array of BPM numbers
 * @returns {object} - { min, max, avg, median, count }
 */
function calculateBpmStats(bpmValues) {
  if (!bpmValues || bpmValues.length === 0) {
    return { min: 0, max: 0, avg: 0, median: 0, count: 0 };
  }
  
  const sorted = [...bpmValues].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const sum = sorted.reduce((acc, val) => acc + val, 0);
  const avg = Math.round(sum / sorted.length);
  
  // Calculate median
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
  
  return {
    min,
    max,
    avg,
    median,
    count: sorted.length
  };
}

/**
 * Calculate complete profile for a rhythm set from scratch
 * @param {object} songsCollection - MongoDB songs collection
 * @param {string} rhythmSetId - The rhythm set ID to profile
 * @returns {Promise<object>} - Profile object ready for database
 */
async function calculateProfileForRhythmSet(songsCollection, rhythmSetId) {
  // Fetch all songs with this rhythm set assignment
  const songs = await songsCollection.find({ rhythmSetId }).toArray();
  
  const profile = {
    rhythmSetId,
    totalSongs: songs.length,
    moods: {},
    genres: {},
    taals: {},
    timeSignatures: {},
    rhythmCategories: {},
    bpm: { min: 0, max: 0, avg: 0, median: 0, count: 0 },
    updatedAt: new Date().toISOString(),
    lastRecalculatedAt: new Date().toISOString()
  };
  
  if (songs.length === 0) {
    return profile;
  }
  
  const bpmValues = [];
  
  // Process each song
  songs.forEach(song => {
    // Mood distribution (songs can have multiple moods)
    if (song.mood && Array.isArray(song.mood)) {
      song.mood.forEach(mood => {
        if (mood) {
          profile.moods[mood] = (profile.moods[mood] || 0) + 1;
        }
      });
    }
    
    // Genre distribution
    if (song.genre) {
      profile.genres[song.genre] = (profile.genres[song.genre] || 0) + 1;
    }
    
    // Taal distribution
    if (song.taal) {
      profile.taals[song.taal] = (profile.taals[song.taal] || 0) + 1;
    }
    
    // Rhythm Category distribution
    if (song.rhythmCategory) {
      profile.rhythmCategories[song.rhythmCategory] = (profile.rhythmCategories[song.rhythmCategory] || 0) + 1;
    }
    
    // Time signature distribution
    const timeSignature = song.timeSignature || song.time;
    if (timeSignature) {
      profile.timeSignatures[timeSignature] = (profile.timeSignatures[timeSignature] || 0) + 1;
    }
    
    // BPM values for statistics
    const tempo = song.tempo || song.bpm;
    if (tempo) {
      const bpmNum = parseInt(tempo);
      if (!isNaN(bpmNum) && bpmNum > 0) {
        bpmValues.push(bpmNum);
      }
    }
  });
  
  // Calculate BPM statistics
  profile.bpm = calculateBpmStats(bpmValues);
  
  return profile;
}

/**
 * Update or create a rhythm set profile in the database
 * @param {object} profilesCollection - MongoDB profiles collection
 * @param {object} songsCollection - MongoDB songs collection
 * @param {string} rhythmSetId - The rhythm set ID
 * @param {boolean} forceRecalculation - If true, always recalculate from scratch
 * @returns {Promise<object>} - Updated profile
 */
async function updateRhythmSetProfile(profilesCollection, songsCollection, rhythmSetId, forceRecalculation = false) {
  if (!rhythmSetId) {
    throw new Error('rhythmSetId is required');
  }
  
  // Calculate fresh profile
  const profile = await calculateProfileForRhythmSet(songsCollection, rhythmSetId);
  
  // Upsert to database
  await profilesCollection.updateOne(
    { rhythmSetId },
    { $set: profile },
    { upsert: true }
  );
  
  console.log(`✅ Profile updated for ${rhythmSetId}: ${profile.totalSongs} songs`);
  
  return profile;
}

/**
 * Handle rhythm set changes for a song (async, non-blocking)
 * Updates profiles when songs are added, removed, or reassigned
 * @param {object} profilesCollection - MongoDB profiles collection
 * @param {object} songsCollection - MongoDB songs collection
 * @param {number} songId - Song ID
 * @param {string|null} oldRhythmSetId - Previous rhythm set (null if new song)
 * @param {string|null} newRhythmSetId - New rhythm set (null if deleted)
 * @param {object} songData - Song data for logging
 */
async function handleRhythmSetChange(profilesCollection, songsCollection, songId, oldRhythmSetId, newRhythmSetId, songData) {
  try {
    const updates = [];
    
    // Update old rhythm set profile (song removed or changed)
    if (oldRhythmSetId && oldRhythmSetId !== newRhythmSetId) {
      updates.push(
        updateRhythmSetProfile(profilesCollection, songsCollection, oldRhythmSetId, true)
          .then(() => console.log(`  📉 Removed song ${songId} from profile ${oldRhythmSetId}`))
      );
    }
    
    // Update new rhythm set profile (song added or changed)
    if (newRhythmSetId && oldRhythmSetId !== newRhythmSetId) {
      updates.push(
        updateRhythmSetProfile(profilesCollection, songsCollection, newRhythmSetId, true)
          .then(() => console.log(`  📈 Added song ${songId} to profile ${newRhythmSetId}`))
      );
    }
    
    // Execute all updates (non-blocking from caller's perspective)
    await Promise.all(updates);
    
  } catch (error) {
    console.error(`❌ Error updating profiles for song ${songId}:`, error.message);
    // Don't throw - profile updates shouldn't break song operations
  }
}

/**
 * Get profile for a specific rhythm set
 * @param {object} profilesCollection - MongoDB profiles collection  
 * @param {string} rhythmSetId - The rhythm set ID
 * @returns {Promise<object|null>} - Profile or null if not found
 */
async function getProfile(profilesCollection, rhythmSetId) {
  return await profilesCollection.findOne({ rhythmSetId });
}

/**
 * Get all profiles summary
 * @param {object} profilesCollection - MongoDB profiles collection
 * @returns {Promise<array>} - Array of profiles with summary data
 */
async function getAllProfiles(profilesCollection) {
  return await profilesCollection
    .find({})
    .project({ rhythmSetId: 1, totalSongs: 1, updatedAt: 1, _id: 0 })
    .toArray();
}

module.exports = {
  calculateProfileForRhythmSet,
  updateRhythmSetProfile,
  handleRhythmSetChange,
  getProfile,
  getAllProfiles,
  calculateBpmStats
};
