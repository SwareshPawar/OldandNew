# Enharmonic Equivalence Fix for Melodic Loops

**Last Updated:** February 28, 2026  
**Status:** ✅ RESOLVED

## Problem
When transposing songs to keys like **Eb**, the melodic loop pads (atmosphere/tanpura) would not show available loops even though **D#** files existed. This had two root causes:
1. The main application uses flat notation (Eb, Bb) while loop files were named with sharp notation (D#, A#)
2. The `#` symbol in URLs was being interpreted as a fragment identifier, truncating the filename

## Root Causes

### Issue 1: Enharmonic Mismatch

**Main Application Behavior (main.js)**
The main app uses a chromatic scale with **flats for certain keys**:
```javascript
const chromaticScale = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
```

When transposing to Eb, the app displays "Eb" as the key.

**Loop Player Behavior (Before Fix)**
The loop player was only looking for files matching the exact key name:
- Effective key: **Eb**
- Looking for: `atmosphere_Eb.wav`, `tanpura_Eb.wav`
- Files actually available: `atmosphere_D#.wav`, `tanpura_D#.wav`
- Result: ❌ **Not found!**

### Issue 2: URL Fragment Problem

**Console Error:**
```
GET http://localhost:3001/loops/melodies/atmosphere/atmosphere_D 404 (Not Found)
```

Notice the URL is truncated at `atmosphere_D` - the `#` was being interpreted as a URL hash/fragment, causing the browser to stop at that point.

**Before Fix:**
```javascript
const url = `${baseUrl}/loops/melodies/${sampleType}/${sampleType}_${keyToCheck}.wav`;
// When keyToCheck = "D#":
// Browser sees: http://...atmosphere_D#.wav
// Browser requests: http://...atmosphere_D  ← truncated!
```

## Solution

The fix required two parts:

### Part 1: URL Encoding

Use `encodeURIComponent()` to properly encode special characters in URLs:

```javascript
// BEFORE (BROKEN):
const url = `${baseUrl}/loops/melodies/${sampleType}/${sampleType}_${keyToCheck}.wav`;
// D# becomes: .../atmosphere_D#.wav → browser truncates to atmosphere_D

// AFTER (FIXED):
const encodedKey = encodeURIComponent(keyToCheck);  // D# → D%23
const url = `${baseUrl}/loops/melodies/${sampleType}/${sampleType}_${encodedKey}.wav`;
// D# becomes: .../atmosphere_D%23.wav → correctly fetched! ✅
```

### Part 2: Enharmonic Equivalence Checking

Added **enharmonic equivalence checking** to both `checkMelodicAvailability()` and `loadMelodicSamples()` methods.

### Enharmonic Map
```javascript
const enharmonicMap = {
    'C#': 'Db', 'Db': 'C#',
    'D#': 'Eb', 'Eb': 'D#',
    'F#': 'Gb', 'Gb': 'F#',
    'G#': 'Ab', 'Ab': 'G#',
    'A#': 'Bb', 'Bb': 'A#'
};
```

### Check Algorithm
For each melodic sample type:
1. Try the effective key (e.g., "Eb") with proper URL encoding
2. If not found, try the enharmonic equivalent (e.g., "D#") with proper URL encoding
3. Use whichever file is found

## Implementation

### `checkMelodicAvailability()` Method
```javascript
const keysToTry = [effectiveKey];
if (enharmonicMap[effectiveKey]) {
    keysToTry.push(enharmonicMap[effectiveKey]);
}

for (const keyToCheck of keysToTry) {
    // URL encode the key to handle # symbol
    const encodedKey = encodeURIComponent(keyToCheck);  // D# → D%23
    const url = `${baseUrl}/loops/melodies/${sampleType}/${sampleType}_${encodedKey}.wav`;
    console.log(`  🔗 Trying URL: ${url}`);
    
    const response = await fetch(url);
    if (response.ok) {
        availability[sampleType] = true;
        console.log(`  ✅ ${sampleType}_${keyToCheck}.wav: Available`);
        return; // Found it!
    }
}
```

### `loadMelodicSamples()` Method
```javascript
const keysToTry = [effectiveKey];
if (enharmonicMap[effectiveKey]) {
    keysToTry.push(enharmonicMap[effectiveKey]);
}

for (const keyToCheck of keysToTry) {
    // URL encode the key to handle # symbol
    const encodedKey = encodeURIComponent(keyToCheck);  // D# → D%23
    const url = `${baseUrl}/loops/melodies/${sampleType}/${sampleType}_${encodedKey}.wav`;
    
    const response = await fetch(url, { method: 'HEAD' });
    if (response.ok) {
        foundUrl = url;
        console.log(`Found melodic sample: ${sampleType}_${keyToCheck}.wav`);
        break; // Found it!
    }
}
```

## Examples

### Example 1: Song in Eb
- **Original Key**: C
- **Transpose**: +3 semitones
- **Effective Key**: Eb (from main.js transpose function)
- **Files Checked**: 
  1. `atmosphere_Eb.wav` ❌
  2. `atmosphere_D#.wav` ✅ **Found!**
- **Result**: Atmosphere pad enabled

### Example 2: Song in D#
- **Original Key**: C
- **Transpose**: +3 semitones
- **Effective Key**: D# (if using sharp notation)
- **Files Checked**: 
  1. `atmosphere_D#.wav` ✅ **Found!**
- **Result**: Atmosphere pad enabled

### Example 3: Song in Bb
- **Original Key**: C
- **Transpose**: -2 semitones
- **Effective Key**: Bb (from main.js transpose function)
- **Files Checked**: 
  1. `atmosphere_Bb.wav` ❌
  2. `atmosphere_A#.wav` ✅ **Found!**
- **Result**: Atmosphere pad enabled

## File Naming Convention

You can now name your melodic loop files with **either** sharp or flat notation:

### Using Sharp Notation (Recommended)
```
atmosphere_C#.wav
atmosphere_D#.wav
atmosphere_F#.wav
atmosphere_G#.wav
atmosphere_A#.wav
```

### Using Flat Notation
```
atmosphere_Db.wav
atmosphere_Eb.wav
atmosphere_Gb.wav
atmosphere_Ab.wav
atmosphere_Bb.wav
```

### Mixed (Also Supported)
```
atmosphere_C#.wav   ← Sharp
atmosphere_Eb.wav   ← Flat
atmosphere_F#.wav   ← Sharp
atmosphere_Ab.wav   ← Flat
atmosphere_A#.wav   ← Sharp
```

The system will find them regardless!

## Benefits

1. ✅ **Flexibility**: Upload files with either sharp or flat notation
2. ✅ **Consistency**: Matches main.js transpose behavior
3. ✅ **User-Friendly**: Works regardless of how files are named
4. ✅ **Backward Compatible**: Existing files work without renaming
5. ✅ **No Duplication**: Don't need both Eb and D# files

## Testing

### Test Case 1: Transpose to Eb
1. Start with song in C
2. Transpose +3 semitones
3. Check melodic pads
4. Expected: Pads should be enabled if D# or Eb files exist

### Test Case 2: Transpose to Bb
1. Start with song in C
2. Transpose -2 semitones
3. Check melodic pads
4. Expected: Pads should be enabled if A# or Bb files exist

### Test Case 3: Mixed File Naming
1. Have `atmosphere_D#.wav` and `tanpura_Eb.wav`
2. Transpose to Eb
3. Expected: Both pads should work (finds D# for atmosphere, Eb for tanpura)

## Console Output

The fix provides helpful console logging:

**Before Fix (Broken):**
```
🔍 Checking melodic availability for key: D#
  Checking atmosphere: trying keys [D#, Eb]
  GET http://localhost:3001/loops/melodies/atmosphere/atmosphere_D 404 (Not Found)
  ⚠️ atmosphere_D#.wav: 404 Not Found
  ❌ atmosphere: Not Available
```

**After Fix (Working):**
```javascript
🔍 Checking melodic availability for key: D#
  Checking atmosphere: trying keys [D#, Eb]
  🔗 Trying URL: http://localhost:3001/loops/melodies/atmosphere/atmosphere_D%23.wav
  ✅ atmosphere_D#.wav: Available (effective key: D#)
  Checking tanpura: trying keys [D#, Eb]
  🔗 Trying URL: http://localhost:3001/loops/melodies/tanpura/tanpura_D%23.wav
  ✅ tanpura_D#.wav: Available (effective key: D#)
📊 Melodic availability result: {atmosphere: true, tanpura: true}
```

Notice the properly encoded URL: `atmosphere_D%23.wav` where `%23` is the URL-encoded version of `#`.

## Notes

- The effective key stored internally is still the calculated key (e.g., "Eb")
- The AudioBuffer is cached with the effective key name
- The file lookup tries both notations transparently with proper URL encoding
- No performance penalty - only tries second key if first fails
- **Critical:** Always use `encodeURIComponent()` when constructing URLs with special characters like `#`, `%`, `&`, etc.

## Files Modified

- `loop-player-pad.js` lines 505-560: Updated `checkMelodicAvailability()` 
  - Added `encodeURIComponent()` for URL safety
  - Added enharmonic equivalence checking
- `loop-player-pad.js` lines 595-615: Updated `loadMelodicSamples()`
  - Added `encodeURIComponent()` for URL safety
  - Ensured consistent enharmonic checking

## Related Documentation

- See **Bug #6** in `CODE_DOCUMENTATION.md` for full details
- See `AUDIO_FORMAT_SUPPORT_UPDATE.md` for loop system architecture
