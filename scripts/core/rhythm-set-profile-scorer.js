/**
 * Rhythm Set Profile Scoring Module
 * 
 * Provides intelligent scoring for matching songs to rhythm set profiles
 * based on learned patterns from existing song assignments.
 */

// Mood similarity groups for partial matching
const MOOD_GROUPS = {
  energetic: ['Happy', 'Joyful', 'Dance', 'Celebratory', 'Festive', 'Passionate'],
  melancholic: ['Sad', 'Sorrowful', 'Nostalgic'],
  romantic: ['Love', 'Romantic', 'Soothing'],
  inspiring: ['Motivational', 'Powerful', 'Patriotic'],
  evergreen: ['Evergreen']
};

/**
 * Get the mood group for a given mood
 * @param {string} mood - The mood to check
 * @returns {string|null} - The mood group name or null if not found
 */
function getMoodGroup(mood) {
  for (const [group, moods] of Object.entries(MOOD_GROUPS)) {
    if (moods.includes(mood)) return group;
  }
  return null;
}

/**
 * Score how well a song matches a rhythm set profile
 * @param {object} song - Song properties (mood, genre, taal, timeSignature, tempo, rhythmCategory)
 * @param {object} profile - Rhythm set profile from database
 * @param {object|null} weights - Scoring weights { mood, genre, taal, rhythmCategory, bpm, timeSignature }
 * @returns {object} - Score result with details
 */
function scoreProfileMatch(song, profile, weights = null) {
  // Default weights if not provided
  const w = weights || { 
    mood: 22, 
    genre: 18, 
    taal: 18,
    rhythmCategory: 10,
    bpm: 18, 
    timeSignature: 14 
  };
  
  let score = 0;
  let details = [];
  
  // 1. Mood matching (max: w.mood points)
  if (song.mood && Array.isArray(song.mood) && song.mood.length > 0 && profile.moods) {
    let moodScore = 0;
    const matchedMoods = [];
    
    song.mood.forEach(songMood => {
      // Check exact match first
      if (profile.moods[songMood] > 0) {
        const frequency = profile.moods[songMood] / profile.totalSongs;
        moodScore += frequency * w.mood; // Full weight for exact match
        matchedMoods.push(`${songMood} (exact)`);
      } else {
        // Check mood group similarity
        const songGroup = getMoodGroup(songMood);
        if (songGroup) {
          const groupMoods = MOOD_GROUPS[songGroup];
          const groupMatches = groupMoods.filter(m => m !== songMood && profile.moods[m] > 0);
          if (groupMatches.length > 0) {
            // Partial credit for same mood group (50% of weight)
            const groupFreq = groupMatches.reduce((sum, m) => sum + (profile.moods[m] || 0), 0) / profile.totalSongs;
            moodScore += groupFreq * w.mood * 0.5;
            matchedMoods.push(`${songMood} (${songGroup} group)`);
          }
        }
      }
    });
    
    score += Math.min(w.mood, moodScore);
    if (matchedMoods.length > 0) {
      details.push(`Mood: ${matchedMoods.join(', ')}`);
    }
  }
  
  // 2. Genre matching (max: w.genre points)
  if (song.genre && profile.genres) {
    const genreFreq = profile.genres[song.genre] || 0;
    if (genreFreq > 0) {
      const genreScore = (genreFreq / profile.totalSongs) * w.genre;
      score += genreScore;
      details.push(`Genre: ${song.genre} (${genreFreq}/${profile.totalSongs})`);
    }
  }
  
  // 3. Taal/rhythm family (max: w.taal points)
  if (song.taal && profile.taals) {
    const taalFreq = profile.taals[song.taal] || 0;
    if (taalFreq > 0) {
      const taalScore = (taalFreq / profile.totalSongs) * w.taal;
      score += taalScore;
      details.push(`Taal: ${song.taal} (${taalFreq}/${profile.totalSongs})`);
    }
  }
  
  // 4. Rhythm Category matching (max: w.rhythmCategory points)
  if (song.rhythmCategory && profile.rhythmCategories) {
    const categoryFreq = profile.rhythmCategories[song.rhythmCategory] || 0;
    if (categoryFreq > 0) {
      const categoryScore = (categoryFreq / profile.totalSongs) * w.rhythmCategory;
      score += categoryScore;
      details.push(`Category: ${song.rhythmCategory} (${categoryFreq}/${profile.totalSongs})`);
    }
  }
  
  // 5. Time signature (max: w.timeSignature points)
  const songTimeSignature = song.timeSignature || song.time;
  if (songTimeSignature && profile.timeSignatures) {
    const timeFreq = profile.timeSignatures[songTimeSignature] || 0;
    if (timeFreq > 0) {
      const timeScore = (timeFreq / profile.totalSongs) * w.timeSignature;
      score += timeScore;
      details.push(`Time: ${songTimeSignature} (${timeFreq}/${profile.totalSongs})`);
    }
  }
  
  // 5. BPM range proximity (max: w.bpm points)
  const songTempo = song.tempo || song.bpm;
  if (songTempo && profile.bpm && profile.bpm.avg) {
    const songBpm = parseInt(songTempo);
    if (!isNaN(songBpm)) {
      const bpmMin = profile.bpm.min;
      const bpmMax = profile.bpm.max;
      const bpmAvg = profile.bpm.avg;
      
      if (songBpm >= bpmMin && songBpm <= bpmMax) {
        // Within range: score based on distance from average
        const distanceFromAvg = Math.abs(songBpm - bpmAvg);
        const rangeSize = bpmMax - bpmMin || 1;
        const proximityRatio = 1 - (distanceFromAvg / rangeSize);
        const bpmScore = w.bpm * Math.max(0.5, proximityRatio); // At least 50% if in range
        score += bpmScore;
        details.push(`BPM: ${songBpm} in range [${bpmMin}-${bpmMax}]`);
      } else {
        // Outside range: reduced score based on distance
        const nearestBound = songBpm < bpmMin ? bpmMin : bpmMax;
        const distance = Math.abs(songBpm - nearestBound);
        const penaltyScore = Math.max(0, w.bpm * 0.3 * (1 - distance / 50)); // Max 30% if close
        score += penaltyScore;
        details.push(`BPM: ${songBpm} near range [${bpmMin}-${bpmMax}]`);
      }
    }
  }
  
  return {
    score: Math.round(score * 10) / 10, // Round to 1 decimal
    maxScore: 100,
    details: details,
    profileSize: profile.totalSongs,
    weights: w
  };
}

module.exports = {
  scoreProfileMatch,
  getMoodGroup,
  MOOD_GROUPS
};
