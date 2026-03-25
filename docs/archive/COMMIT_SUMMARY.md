# Commit Summary: Loop Replacement + Fresh Playback Fix

## Bug Fixed
**Bug #10: Replacing Loop Samples Created Duplicate Entries and Player Used Old Audio**

## Overview
Fixed two linked issues in Loop & Rhythm Set Manager and loop player:
1. Re-uploading a sample to an existing slot could create duplicate loop metadata entries.
2. Loop player could continue playing stale audio after replacement when filename/URL remained the same.

## Root Cause
1. Loop IDs were generated from mixed-case inputs, so dedup by ID could miss previous entries if casing drifted.
2. Dedup logic had no filename fallback.
3. Loop player reused in-memory buffers and browser fetch cache when URLs were unchanged.

## Solution
1. Normalized loop naming inputs to lowercase before ID/filename generation.
2. Updated metadata dedup to remove existing rows by ID or filename.
3. Added cross-page replacement signal and forced reload path that bypasses browser cache.

## Files Modified
1. **server.js**
   - `POST /api/loops/upload`: lowercase normalization + ID/filename dedup
   - `POST /api/loops/upload-single`: lowercase normalization + ID/filename dedup

2. **loop-player-pad.js**
   - `loadLoops(loopMap, songId, forceReload = false)`
   - Added forced reload behavior and `fetch(..., { cache: 'reload' })` on forced path

3. **loop-player-pad-ui.js**
   - Added replacement signal tracking (`loopFilesCheckedAt`)
   - `initializeLoopPlayer()` now forces reload when `localStorage.loopFilesReplacedAt` is newer

4. **loop-rhythm-manager.js**
   - After successful upload, writes `localStorage.setItem('loopFilesReplacedAt', Date.now().toString())`

5. **CODE_DOCUMENTATION.md**
   - Added Bug #10 entry
   - Added Session 7 documentation update
   - Updated version to 1.20.2 and last-updated timestamp

## Testing Performed
- ✅ Re-upload to same loop slot replaces metadata entry instead of duplicating
- ✅ Loop player fetches newly uploaded audio after replacement
- ✅ Forced reload path bypasses stale browser cache for unchanged filenames
- ✅ `node --check` passed for all modified files

## Suggested Commit Message
```
Fix loop replacement dedup + stale playback cache (Bug #10)

- Normalize loop naming inputs to lowercase in upload endpoints
- Deduplicate loop metadata by id and filename
- Add loop replacement signal from manager UI
- Force loop player reload and bypass browser cache after replacements

See CODE_DOCUMENTATION.md Section 8, Bug #10.

Files modified:
- server.js
- loop-player-pad.js
- loop-player-pad-ui.js
- loop-rhythm-manager.js
- CODE_DOCUMENTATION.md
```

## Impact
- Loop uploads now behave as true replace operations for the same slot
- Backend metadata remains clean (no same-slot duplicates)
- Loop player reliably uses newly uploaded samples
