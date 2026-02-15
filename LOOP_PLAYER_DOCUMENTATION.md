# Loop Player System v2.0 - Documentation

## Overview

The Loop Player System provides dynamic rhythm accompaniment for songs using pre-recorded audio loops. The system intelligently matches loops to songs based on **Taal** (rhythmic cycle), **Time Signature**, **Tempo**, and **Genre** characteristics.

## System Architecture

### Components

1. **Loop Files** (`/loops/` folder)
   - WAV audio files following naming convention
   - Organized by conditions (taal, time, tempo, genre)

2. **Metadata** (`/loops/loops-metadata.json`)
   - JSON database of all available loops
   - Maps files to matching conditions
   - Stores loop descriptions and timestamps

3. **Loop Manager** (`loop-manager.html` + `loop-manager.js`)
   - Admin interface for uploading and managing loops
   - Auto-generates filenames based on conditions
   - Visual preview and management

4. **Player Engine** (`loop-player-pad.js`)
   - Web Audio API-based loop player
   - Seamless loop switching
   - Auto-fill feature for transitions

5. **UI Integration** (`loop-player-pad-ui.js`)
   - 6-pad interface (3 loops + 3 fills)
   - Automated loop matching for songs
   - Volume and tempo controls (90-110% range)
   - Tempo reset button for quick return to 100%

6. **API Endpoints** (`server.js`)
   - `/api/loops/metadata` - Get loops metadata
   - `/api/loops/upload` - Upload new loop set (legacy bulk upload)
   - `/api/loops/upload-single` - Upload individual file with auto-rename (v2.0)
   - `/api/loops/:id` - Delete loop

## File Naming Convention v2.0

### Format
```
{taal}_{time_signature}_{tempo}_{genre}_{TYPE}{number}.wav
```

### Components
- **taal**: keherwa, dadra, rupak, jhaptal, teental, ektaal
- **time_signature**: 4_4, 3_4, 6_8, 7_8 (slash replaced with underscore)
- **tempo**: slow (<80 BPM), medium (80-120 BPM), fast (>120 BPM)
- **genre**: acoustic, rock, rd (rhythm & drums), qawalli, blues
- **TYPE**: LOOP or FILL (uppercase)
- **number**: 1, 2, or 3

### Examples
```
keherwa_4_4_medium_acoustic_LOOP1.wav
dadra_6_8_fast_rock_FILL2.wav
teental_4_4_slow_qawalli_LOOP3.wav
```

## Matching Logic

### How It Works

When a song is played, the system:

1. **Filters by Required Conditions** (MUST match - COMPULSORY)
   - **Taal**: Must match song's taal (flexible substring matching)
   - **Time signature**: Must match song's time signature (exact match)
   - If EITHER condition doesn't match, loop set is completely filtered out

2. **Ranks by Optional Conditions** (Boost score for best match selection)
   - Genre match: +5 points
   - Tempo match: +3 points
   - Complete set (6 files): +2 points
   - Base score for taal + time match: 10 points

3. **Selects Best Match**
   - Loop set with highest score is loaded
   - If no match found (score < 10), loop player is hidden

### Match Quality Levels
- **Perfect Match** (18+ points): All conditions match (Required + Genre + Tempo + Complete)
- **Excellent Match** (15+ points): Required + Genre OR Tempo + Complete
- **Good Match** (10-14 points): Required only (Taal + Time)
- **No Match** (< 10 points): Player hidden

### Required vs Optional Conditions

**COMPULSORY (Required):**
- ✅ **Taal** - Loop won't show if this doesn't match
- ✅ **Time Signature** - Loop won't show if this doesn't match

**OPTIONAL (Scoring):**
- Genre - Helps select best match when multiple options exist
- Tempo - Helps select best match when multiple options exist
- Complete Set - Slightly favors complete 6-file sets

**Example**: A song with Taal=Keherwa and Time=4/4 will ONLY see loops that have Keherwa and 4/4. Among multiple keherwa_4_4_* loop sets, the one with matching genre/tempo scores highest.

### Example Matching

**Song**: "Ae Watan"
- Taal: Keherwa
- Time: 4/4
- BPM: 95 → Tempo category: medium
- Genre: Acoustic

**Available Loop Sets**:
1. `keherwa_4_4_medium_acoustic_*` → **Score: 20** (Perfect)
2. `keherwa_4_4_fast_rock_*` → **Score: 10** (Good)
3. `dadra_6_8_medium_acoustic_*` → **Filtered out** (wrong taal/time)

**Result**: System loads `keherwa_4_4_medium_acoustic_*` loops

## Using the Loop Manager

### Accessing
- Navigate to `/loop-manager.html` (requires admin authentication)
- OR click "Loop Manager" link in Admin Panel popup (from main app)

### Uploading a New Loop Set v2.0

**Upload Method**: Individual file uploads with automatic renaming

1. **Select Conditions**
   - Choose Taal, Time Signature, Tempo, Genre
   - Filename pattern is generated and displayed automatically
   - All 6 upload buttons show expected filenames

2. **Upload Files Individually**
   - **6 Upload Slots**: Loop 1, Loop 2, Loop 3, Fill 1, Fill 2, Fill 3
   - For each slot:
     1. Click "Choose File" and select your WAV file
     2. Upload button becomes enabled (green)
     3. Click "Upload" button for that slot
     4. File is automatically renamed to match the pattern
     5. Status indicator shows success (✅) or error (❌)
   
3. **File Requirements**
   - Format: WAV (uncompressed)
   - Sample rate: 44.1kHz or 48kHz
   - Bit depth: 16-bit or 24-bit
   - No specific naming required (auto-renamed on server)

**Benefits of Individual Upload:**
- Upload files one at a time or all at once
- Replace individual files without re-uploading entire set
- Better error handling per file
- Clear status feedback for each upload
- No need to rename files manually

### Managing Loops

- **Preview**: Click play button to preview any loop
- **Delete**: Click trash icon to remove a loop file
- **Stats**: View total loop sets, taals, genres, and files

## Technical Specifications

### Audio Requirements
- **Format**: WAV (uncompressed) only
- **Sample Rate**: 44.1kHz or 48kHz recommended
- **Bit Depth**: 16-bit or 24-bit
- **Channels**: Stereo or Mono
- **Duration**: 
  - Loops: 2-8 bars typically
  - Fills: 1-2 bars typically
- **Seamlessness**: Loop start/end should align perfectly

### File Size Limits
- Individual file: < 10MB recommended
- Loop set (6 files): < 50MB total
- Consider Vercel deployment limits

### Browser Compatibility
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (iOS requires user gesture)
- Opera: ✅ Full support

## API Reference

### GET /api/loops/metadata
Get all loops metadata

**Response:**
```json
{
  "version": "2.0",
  "loops": [{
    "id": "keherwa_4_4_medium_acoustic_loop1",
    "filename": "keherwa_4_4_medium_acoustic_LOOP1.wav",
    "type": "loop",
    "number": 1,
    "conditions": {
      "taal": "keherwa",
      "timeSignature": "4/4",
      "tempo": "medium",
      "genre": "acoustic"
    },
    "metadata": {
      "duration": 0,
      "uploadedAt": "2026-02-15T10:00:00Z",
      "description": "Acoustic keherwa loop"
    }
  }],
  "tempoRanges": {...},
  "supportedTaals": [...],
  "supportedGenres": [...],
  "supportedTimeSignatures": [...]
}
```

### POST /api/loops/upload
Upload new loop set (legacy bulk upload)

**Authorization**: Required (Bearer token)

**Form Data**:
- `taal`: String
- `timeSignature`: String
- `tempo`: String (slow|medium|fast)
- `genre`: String
- `description`: String (optional)
- `loopFiles`: File[] (6 WAV files)

**Response:**
```json
{
  "success": true,
  "uploaded": 6,
  "files": ["keherwa_4_4_medium_acoustic_LOOP1.wav", ...],
  "pattern": "keherwa_4_4_medium_acoustic"
}
```

### POST /api/loops/upload-single
Upload individual file with automatic renaming (v2.0)

**Authorization**: Required (Bearer token)

**Form Data**:
- `taal`: String (e.g., "keherwa")
- `timeSignature`: String (e.g., "4/4")
- `tempo`: String (slow|medium|fast|very_fast)
- `genre`: String (e.g., "acoustic")
- `type`: String ("loop" or "fill")
- `number`: Number (1, 2, or 3)
- `file`: File (single WAV file)

**Response:**
```json
{
  "success": true,
  "filename": "keherwa_4_4_medium_acoustic_LOOP1.wav",
  "loopId": "keherwa_4_4_medium_acoustic_loop1"
}
```

### DELETE /api/loops/:loopId
Delete a loop file

**Authorization**: Required (Bearer token)

**Response:**
```json
{
  "success": true,
  "deleted": "keherwa_4_4_medium_acoustic_LOOP1.wav"
}
```

## Deployment Considerations

### Vercel Deployment

1. **Commit loop files to Git**
   ```bash
   git add loops/*.wav loops/loops-metadata.json
   git commit -m "Add loop files"
   git push
   ```

2. **Verify vercel.json routes**
   - Static routes for `/loops/` folder configured
   - API routes for loop management configured

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Test**
   - Check `/loops/filename.wav` accessibility
   - Test loop manager upload
   - Verify song matching works

### GitHub Pages (Alternative)
⚠️ **Not Recommended** - GitHub Pages is static only, cannot handle:
- API endpoints for upload/delete
- Dynamic metadata management
- Authentication

Use Vercel, Netlify, or similar platforms that support serverless functions.

## Migration from v1.0

### Old Format
```
keherwa_4_4_LOOP1.wav
```

### New Format
```
keherwa_4_4_medium_acoustic_LOOP1.wav
```

### Migration Steps

1. **Analyze existing loops**
   - Identify tempo category (slow/medium/fast)
   - Identify genre (acoustic/rock/rd/qawalli/blues)

2. **Rename files**
   - Manually rename following new convention
   - Or use Loop Manager to re-upload with conditions

3. **Update metadata**
   - Ensure `loops-metadata.json` includes all files
   - Or use API to register after renaming

4. **Test matching**
   - Verify songs find correct loops
   - Check match quality scores

## Troubleshooting

### Loop Player Not Showing
- ❌ **Song missing taal or time**: Add metadata to song
- ❌ **No matching loops**: Upload loops for that taal/time combination
- ❌ **Metadata not loaded**: Check `/api/loops/metadata` endpoint
- ❌ **Mismatch in conditions**: Taal AND Time Signature must both match exactly

### Loops Not Playing
- ❌ **AudioContext blocked**: Ensure user clicked play button first (browser autoplay policy)
- ❌ **File not found**: Check `/loops/` folder and filenames
- ❌ **Wrong format**: Ensure files are WAV, not MP3
- ❌ **Corrupt files**: Check browser console for "Failed to decode" warnings

### Corrupt or Invalid Audio Files
**Symptom**: Some loop pads don't work, console shows "Failed to decode" warnings

**Cause**: WAV file is corrupt, has invalid headers, or unsupported encoding

**Solution**:
1. Re-export the audio file from your DAW/audio editor
2. Use standard settings: 44.1kHz, 16-bit, PCM encoding
3. Test file in audio player before uploading
4. Delete corrupt file and re-upload

**Note**: App will continue working with partial loop set (graceful degradation)

### Upload Failed
- ❌ **Not authenticated**: Login as admin first
- ❌ **Wrong format**: Only WAV files accepted
- ❌ **File too large**: Compress or optimize WAV files (< 10MB per file recommended)
- ❌ **Server error**: Check server logs and network tab in DevTools

### Match Score Too Low
- ✅ **Add more specific loops**: Create loops matching song's genre/tempo
- ✅ **Update song metadata**: Add genre and BPM to songs
- ✅ **Check taal spelling**: Ensure exact match (case-insensitive)

## Best Practices

### For Administrators

1. **Organize by condition sets**
   - Create full sets (6 files) at once
   - Use consistent naming

2. **Quality over quantity**
   - High-quality recordings only
   - Seamless loops with proper start/end points

3. **Test before production**
   - Preview all loops in Loop Manager
   - Test with actual songs

### For Developers

1. **Extend matching logic**
   - Modify `findMatchingLoopSet()` for custom scoring
   - Add new conditions as needed

2. **Add new tempo ranges**
   - Update `tempoRanges` in metadata schema
   - Modify `getTempoCategory()` function

3. **Support new genres**
   - Add to `supportedGenres` array
   - Update Loop Manager dropdown

## Future Enhancements

### Planned Features
- [ ] Multiple loop sets per condition (user selection)
- [ ] BPM-based playback rate adjustment
- [ ] Loop waveform visualization
- [ ] Batch upload for many loop sets
- [ ] Cloud storage integration (S3, Cloudinary)
- [ ] AI-based tempo/genre detection

### Possible Improvements
- Real-time loop recording
- MIDI synchronization
- Per-song loop customization
- Loop mixing/layering
- Export custom loop patterns

## Support

For issues or questions:
1. Check this documentation
2. Review code comments in source files
3. Test with browser DevTools console open
4. Check server logs for API errors

---

**Version**: 2.0.1  
**Last Updated**: February 15, 2026 - 9:00 PM  
**Author**: Loop Player System Team  
**Changes in v2.0.1**:
- Individual file upload system with auto-renaming
- Tempo reset button added
- Graceful error handling for corrupt audio files
- Admin panel integration (Loop Manager link)
- Clarified compulsory vs optional matching conditions
