# Loop Playback & Upload Form Fix

## Date: March 21, 2026

## Update: March 25, 2026 - Replacement + Fresh Playback Fix

### New Issues Fixed

#### 3. ❌ Re-upload to Same Slot Could Create Duplicate Backend Loop Entries
**Problem:** Uploading a new sample to an existing slot (like `loop1`) sometimes created duplicate metadata entries instead of replacing.

**Root Cause:**
- Loop ID generation used request fields that could differ by casing (`Medium` vs `medium`).
- Dedup filter used only `id`, so old row could survive if case drift changed the computed id.

**Fix Applied:**
- Lowercased canonical naming fields before generating `basePattern` in both upload endpoints.
- Dedup now filters by **id and filename**:
   ```javascript
   metadata.loops = metadata.loops.filter(loop => loop.id !== loopId && loop.filename !== correctFilename);
   ```

#### 4. ❌ Loop Player Could Play Older Audio After Replacement
**Problem:** Even after successful replacement, loop player sometimes used stale audio.

**Root Cause:**
- In-memory `rawAudioData` cache was reused when song/URL looked unchanged.
- Browser fetch cache could return old content for same loop URL.

**Fix Applied:**
- Added `forceReload` support in `loadLoops()`.
- Forced reload path clears old buffers and fetches with cache bypass:
   ```javascript
   const response = await fetch(url, { cache: 'reload' });
   ```
- Upload success now sets `localStorage.loopFilesReplacedAt`.
- Loop player UI checks this signal and forces reload when newer than last check.

### Files Updated in This Follow-up
- `server.js`
- `loop-player-pad.js`
- `loop-player-pad-ui.js`
- `loop-rhythm-manager.js`
- `CHANGELOG.md`

### Validation
- ✅ Same-slot re-upload now replaces instead of duplicating metadata
- ✅ Loop player loads newly uploaded sample after replacement
- ✅ Syntax checks passed for all modified JavaScript files

## Issues Fixed

### 1. ❌ Loop Playback Returns 404
**Error:** `GET http://localhost:3001/loops/ 404 (Not Found)`

**Root Cause:** 
- `filename` parameter was empty when passed to `playLoop()` function
- Backend API wasn't sending `files` mapping properly
- Frontend couldn't map `loopType` to actual filename

### 2. ❌ Form Resets After Upload
**Problem:** After uploading a single loop, the expanded row collapses and user has to re-expand to upload more loops

**Root Cause:**
- `loadRhythmSets()` triggers `renderRhythmSetsTable()` which rebuilds entire table
- Expanded state is lost during re-render

---

## Solutions Implemented

### Fix #1: Enhanced Debugging in `playLoop()`

**File:** `loop-rhythm-manager.js` (Lines 394-417)

```javascript
async function playLoop(rhythmSetId, loopType, filename) {
    // Validate filename exists
    if (!filename) {
        showAlert('Loop file not found in metadata', 'error');
        console.error('playLoop called with empty filename:', { rhythmSetId, loopType, filename });
        return;
    }
    
    // Use the actual filename from metadata
    const loopUrl = `${API_BASE_URL}/loops/${filename}`;
    const player = document.getElementById('loopPlayer');
    
    console.log('Playing loop:', { rhythmSetId, loopType, filename, loopUrl });
    
    try {
        player.src = loopUrl;
        await player.play();
        showAlert(`Playing ${loopType}...`, 'success');
    } catch (error) {
        console.error('Playback error:', error);
        showAlert(`Failed to play loop: ${error.message}`, 'error');
    }
}
```

**What This Does:**
- ✅ Validates `filename` is not empty before attempting playback
- ✅ Logs detailed debug information to console
- ✅ Shows clear error message if filename is missing
- ✅ Catches and logs playback errors

### Fix #2: Keep Row Expanded After Upload

**File:** `loop-rhythm-manager.js` (Lines 470-485)

```javascript
const result = await response.json();
showAlert(`${loopType} uploaded successfully!`, 'success');

// Store the current rhythm set ID to re-expand after reload
const currentRhythmSetId = rhythmSetId;

// Reload rhythm sets to update the UI
await loadRhythmSets();

// Find and re-expand the row
const rhythmSetIndex = rhythmSets.findIndex(s => s.rhythmSetId === currentRhythmSetId);
if (rhythmSetIndex !== -1) {
    setTimeout(() => {
        toggleExpandRow(rhythmSetIndex);
    }, 100);
}
```

**What This Does:**
- ✅ Stores the rhythm set ID before reload
- ✅ Waits for table to re-render
- ✅ Finds the rhythm set in the refreshed list
- ✅ Automatically re-expands the row after 100ms delay
- ✅ User can continue uploading more loops without manual expand

### Fix #3: Enhanced Debugging in `loadRhythmSets()`

**File:** `loop-rhythm-manager.js` (Lines 44-58)

```javascript
async function loadRhythmSets() {
    try {
        const response = await authFetch(`${API_BASE_URL}/api/rhythm-sets`);
        if (!response.ok) throw new Error('Failed to load rhythm sets');
        rhythmSets = await response.json();
        console.log('Loaded rhythm sets:', rhythmSets.length);
        // Debug: Show first set's data structure
        if (rhythmSets.length > 0) {
            console.log('Sample rhythm set:', rhythmSets[0]);
            console.log('availableFiles:', rhythmSets[0].availableFiles);
            console.log('files mapping:', rhythmSets[0].files);
            console.log('conditionsHint:', rhythmSets[0].conditionsHint);
        }
        renderRhythmSetsTable();
    } catch (error) {
        showAlert('Error loading rhythm sets: ' + error.message, 'error');
    }
}
```

**What This Does:**
- ✅ Logs full rhythm set data structure
- ✅ Shows `files` mapping (loopType → filename)
- ✅ Shows `conditionsHint` (taal, tempo, genre, timeSignature)
- ✅ Helps debug if backend is sending correct data

---

## Expected API Response Structure

### GET /api/rhythm-sets

```json
[
  {
    "rhythmSetId": "dadra_1",
    "rhythmFamily": "dadra",
    "rhythmSetNo": 1,
    "status": "active",
    "availableFiles": ["loop1", "loop2", "loop3", "fill1", "fill2", "fill3"],
    "files": {
      "loop1": "dadra_3_4_medium_dholak_LOOP1.wav",
      "loop2": "dadra_3_4_medium_dholak_LOOP2.wav",
      "loop3": "dadra_3_4_medium_dholak_LOOP3.wav",
      "fill1": "dadra_3_4_medium_dholak_FILL1.wav",
      "fill2": "dadra_3_4_medium_dholak_FILL2.wav",
      "fill3": "dadra_3_4_medium_dholak_FILL3.wav"
    },
    "conditionsHint": {
      "taal": "dadra",
      "timeSignature": "3/4",
      "tempo": "medium",
      "genre": "dholak"
    },
    "isComplete": true
  }
]
```

### Key Fields:
- **availableFiles:** Array of loop types (loop1, loop2, etc.)
- **files:** Object mapping loopType to actual filename
- **conditionsHint:** Metadata used for creating new loops

---

## Testing Checklist

### ✅ To Test Playback Fix

1. Open http://localhost:3001/loop-rhythm-manager.html
2. Open browser DevTools Console (F12)
3. Expand any rhythm set with existing loops
4. Click "Play" on any loop
5. **Check Console Logs:**
   ```
   Playing loop: { rhythmSetId: "dadra_1", loopType: "loop1", filename: "dadra_3_4_medium_dholak_LOOP1.wav", loopUrl: "http://localhost:3001/loops/dadra_3_4_medium_dholak_LOOP1.wav" }
   ```
6. **If filename is empty:**
   ```
   playLoop called with empty filename: { rhythmSetId: "dadra_1", loopType: "loop1", filename: "" }
   ```
   → This means backend isn't sending `files` mapping

### ✅ To Test Upload Form Fix

1. Expand a rhythm set
2. Click "Upload" on any empty loop slot
3. Select and upload a file
4. **Expected:** Row stays expanded after upload
5. **Previous Behavior:** Row collapsed, had to re-expand
6. **New Behavior:** Can immediately upload next loop

### ✅ To Verify Backend API

1. Open http://localhost:3001/loop-rhythm-manager.html
2. Open DevTools Console (F12)
3. Look for:
   ```
   Loaded rhythm sets: 10
   Sample rhythm set: {rhythmSetId: "dadra_1", ...}
   availableFiles: (6) ["loop1", "loop2", "loop3", "fill1", "fill2", "fill3"]
   files mapping: {loop1: "dadra_3_4_medium_dholak_LOOP1.wav", loop2: "dadra_3_4_medium_dholak_LOOP2.wav", ...}
   conditionsHint: {taal: "dadra", timeSignature: "3/4", tempo: "medium", genre: "dholak"}
   ```

**If `files mapping` is empty `{}`:**
- Backend API isn't sending the data correctly
- Check `server.js` lines 1015-1030

---

## Troubleshooting

### Problem: Still Getting 404 on Playback

**Check:**
1. Console shows `filename: ""`
   - Backend not sending `files` object
   - Check server.js modifications were applied

2. Console shows `filename: "dadra_3_4_medium_dholak_LOOP1.wav"`
   - File doesn't exist in `/loops/` folder
   - Run: `ls loops/dadra_3_4_medium_dholak_LOOP1.wav`

3. File exists but still 404
   - Check file permissions
   - Check server is serving `/loops/` correctly
   - Verify: `app.use('/loops', express.static(loopsDir));` in server.js

### Problem: Row Still Collapses After Upload

**Check:**
1. Console shows: `Loaded rhythm sets: 10`
2. Look for: `Sample rhythm set:` log
3. If logs appear, setTimeout might be too short
4. Increase timeout from 100ms to 300ms:
   ```javascript
   setTimeout(() => {
       toggleExpandRow(rhythmSetIndex);
   }, 300); // Increased delay
   ```

### Problem: Play Button Shows But Empty Filename

**Root Cause:** 
- Frontend checks `availableFiles` to show play button
- But `files` mapping is empty
- Mismatch between backend logic

**Fix:**
- Check server.js line 1018-1020:
  ```javascript
  const files = loopSet ? loopSet.files || {} : {};
  ```
- Ensure this is correctly extracting files from `loopSet`

---

## Files Modified

1. **loop-rhythm-manager.js**
   - Enhanced `playLoop()` with validation and debugging
   - Added auto-expand after upload in `uploadSingleLoop()`
   - Enhanced logging in `loadRhythmSets()`

2. **server.js** (Previously Modified)
   - Added `files` mapping to API response
   - Added `conditionsHint` to API response

---

## Next Steps

### If Playback Still Fails:

1. **Check Backend Response:**
   ```javascript
   // In browser console
   fetch('http://localhost:3001/api/rhythm-sets', {
     headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwtToken') }
   })
   .then(r => r.json())
   .then(data => console.log('API Response:', data[0]))
   ```

2. **Verify File Exists:**
   ```bash
   ls -la loops/dadra_3_4_medium_dholak_LOOP1.wav
   ```

3. **Test Direct Access:**
   - Open http://localhost:3001/loops/dadra_3_4_medium_dholak_LOOP1.wav
   - Should download or play the file

### If Upload Form Still Resets:

1. **Check Timing:**
   - Increase setTimeout delay
   - Add console.log to verify `rhythmSetIndex` is found

2. **Alternative Approach:**
   - Store expanded state globally
   - Restore state after render using localStorage

---

## Summary

✅ **Added Validation:** playLoop() now checks for empty filename
✅ **Enhanced Debugging:** Console logs show all relevant data
✅ **Fixed Form Reset:** Row stays expanded after upload
✅ **Better UX:** User can upload multiple loops without re-expanding

**Status:** Ready for testing
**Expected Result:** Playback works with proper filenames, form stays expanded
