# Song Change Loop Reload Implementation Plan

## Problem Statement
When a user changes songs:
1. The old loops continue playing even though a different song with different loops is selected
2. When key is transposed, melodic pads don't reload samples for the new key
3. User has to refresh the page to get the correct loops/pads loaded

## Root Cause
The `loopPlayerInstance` is a global singleton that persists across song changes. When a new song is selected:
- `initializeLoopPlayer(songId)` reuses the existing instance
- Loops are NOT reloaded for the new song's loop set
- Melodic samples are NOT reloaded for the new key
- The player continues playing the old song's loops

## Solution Design

### Part 1: Detect Song/Loop Changes
Add tracking to detect when:
1. Song ID changes
2. Loop set changes (different taal/time)
3. Key changes (different original key or transpose)

### Part 2: Reload Loops When Song Changes
When a different song is selected:
1. **If player is NOT playing**: Reload loops immediately
2. **If player IS playing**: Queue reload for next stop/play cycle

### Part 3: Reload Melodic Samples on Key Change
When key or transpose changes:
1. Stop melodic pads if playing
2. Clear cached samples for old key
3. Reload samples for new key
4. Update key indicators

### Part 4: Handle Transpose Changes
When transpose buttons (+/-) are clicked:
1. Update effective key calculation
2. Reload melodic samples if they were loaded
3. Update UI key indicators

## Implementation

### File: loop-player-pad.js

Add tracking properties:
```javascript
constructor() {
    // ... existing code ...
    
    // Track current song/loop state
    this.currentSongId = null;
    this.currentLoopSet = null;
    this.pendingLoopReload = null;
}
```

Add reload detection method:
```javascript
/**
 * Check if loops need to be reloaded for a new song
 * @param {number} songId
 * @param {object} loopMap
 * @returns {boolean}
 */
needsLoopReload(songId, loopMap) {
    // Always reload if song ID changed
    if (this.currentSongId !== songId) {
        return true;
    }
    
    // Check if loop files changed
    if (!this.currentLoopSet) {
        return true;
    }
    
    // Compare loop file URLs
    const currentUrls = Object.values(this.currentLoopSet || {}).sort().join('|');
    const newUrls = Object.values(loopMap || {}).sort().join('|');
    
    return currentUrls !== newUrls;
}
```

Update `loadLoops` method:
```javascript
async loadLoops(loopMap = null, songId = null) {
    if (!loopMap || Object.keys(loopMap).length === 0) {
        console.warn('No loops provided to load');
        return;
    }

    // Stop playback if different loops
    const needsReload = this.needsLoopReload(songId, loopMap);
    if (needsReload && this.isPlaying) {
        console.log('🔄 Different song detected - will reload on next play');
        this.pendingLoopReload = { loopMap, songId };
        // Don't stop - let user stop manually
        return;
    }
    
    // Update tracking
    this.currentSongId = songId;
    this.currentLoopSet = { ...loopMap };
    this.pendingLoopReload = null;

    // ... existing load logic ...
}
```

Add method to handle pending reload:
```javascript
/**
 * Check and apply pending loop reload if any
 * @private
 */
async _applyPendingReload() {
    if (this.pendingLoopReload) {
        console.log('🔄 Applying pending loop reload');
        const { loopMap, songId } = this.pendingLoopReload;
        this.pendingLoopReload = null;
        this.currentSongId = songId;
        this.currentLoopSet = { ...loopMap };
        
        // Clear old samples
        this.rawAudioData.clear();
        this.audioBuffers.clear();
        
        // Load new loops
        await this._fetchAndDecodeLoops(loopMap);
    }
}
```

Update `play` method to check pending reload:
```javascript
async play() {
    // Check for pending reload first
    if (this.pendingLoopReload) {
        await this._applyPendingReload();
    }
    
    // ... existing play logic ...
}
```

### File: loop-player-pad-ui.js

Update `initializeLoopPlayer`:
```javascript
async function initializeLoopPlayer(songId) {
    // ... existing code to find song and loop set ...
    
    // Create or reuse player instance
    if (!loopPlayerInstance) {
        loopPlayerInstance = new LoopPlayerPad();
    }
    
    // IMPORTANT: Set song key and transpose BEFORE loading loops
    loopPlayerInstance.setSongKeyAndTranspose(song.key, transposeLevel);
    
    // ... existing callback setup ...
    
    // Load loops with song ID for tracking
    await loopPlayerInstance.loadLoops(loopMap, songId);  // <-- ADD songId parameter
    
    // Check availability and enable/disable pads
    const melodicAvailability = await loopPlayerInstance.checkMelodicAvailability(['atmosphere', 'tanpura']);
    
    // ... rest of initialization ...
}
```

Add transpose change handler in main.js:
```javascript
// In the transpose button click handlers
document.getElementById('transposeUp').addEventListener('click', async () => {
    const currentLevel = parseInt(document.getElementById('transpose-level').textContent);
    const newLevel = Math.min(currentLevel + 1, 11);
    
    // Update UI
    document.getElementById('transpose-level').textContent = newLevel;
    
    // Reload melodic samples if loop player exists
    if (loopPlayerInstance) {
        const song = songs.find(s => s.id == currentSongId);
        if (song) {
            const newEffectiveKey = getEffectiveKey(song, newLevel);
            loopPlayerInstance.setSongKeyAndTranspose(song.key, newLevel);
            
            // Stop melodic pads and reload samples for new key
            loopPlayerInstance.stop MelodicPads();
            await loopPlayerInstance.loadMelodicSamples(true, ['atmosphere', 'tanpura']);
            
            // Update key indicators
            updateMelodicKeyIndicators(currentSongId, newEffectiveKey);
        }
    }
    
    // Update lyrics
    updatePreviewWithTransposition(newLevel);
});
```

## Testing Checklist

### Test 1: Song Change (Same Loop Set)
- [ ] Open song A (Dadra 3/4)
- [ ] Play loop 1
- [ ] Change to song B (also Dadra 3/4)
- [ ] Stop and play again
- [ ] ✅ Should play song B's loops, not song A's

### Test 2: Song Change (Different Loop Set)
- [ ] Open song A (Dadra 3/4)
- [ ] Play loop 1
- [ ] Change to song C (Keherwa 4/4)
- [ ] ✅ Status should show "Different loops - reload on next play"
- [ ] Stop current playback
- [ ] Click play
- [ ] ✅ Should load and play song C's Keherwa loops

### Test 3: Transpose Change
- [ ] Open song in key C
- [ ] Enable atmosphere pad (should load C samples)
- [ ] Click transpose +1 (now C#)
- [ ] ✅ Key indicator should show C#
- [ ] Stop atmosphere pad
- [ ] Click atmosphere pad again
- [ ] ✅ Should play C# samples

### Test 4: Song Change with Melodic Pads
- [ ] Open song A in key G with atmosphere playing
- [ ] Change to song B in key D
- [ ] ✅ Key indicator should update to D
- [ ] Stop atmosphere
- [ ] Play atmosphere again
- [ ] ✅ Should play D samples, not G

### Test 5: Continuous Play Across Songs
- [ ] Open song A, play rhythm loop
- [ ] While playing, change to song B (different loop set)
- [ ] ✅ Should show "Reload pending" message
- [ ] ✅ Current rhythm should keep playing
- [ ] Stop playback
- [ ] Play again
- [ ] ✅ Should play song B's loops

## Benefits

1. **No Interruption**: If user is playing, song change doesn't stop playback
2. **Automatic Reload**: Loops reload automatically on next play
3. **Correct Samples**: Melodic pads always load samples for current key
4. **Smooth UX**: No page refresh needed
5. **Clear Feedback**: User knows when reload is pending

## Edge Cases Handled

1. Same song reopened → No reload needed
2. Same loop set, different song → Still reload (might have different tempo)
3. Playing while changing song → Queue reload, don't interrupt
4. Transpose while melodic pad playing → Stop pad, reload samples
5. Rapid song changes → Only latest song's loops loaded

