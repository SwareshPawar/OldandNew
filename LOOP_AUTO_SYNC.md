# Loop Player Auto-Sync System

## Overview

The loop player system now **automatically syncs** with your `main.js` metadata. When you update TAALS, GENRES, or TIMES arrays in main.js, the loop manager will automatically detect and use the new values.

## How It Works

### 1. **Single Source of Truth: main.js**

All metadata is defined in [main.js](main.js):

```javascript
const GENRES = [
    "New", "Old", "Mid", "Hindi", "Marathi", "English", "RD Pattern",
    "Acoustic", "Qawalli", "Classical", "Ghazal", "Sufi", "Rock",
    "Blues", "Female", "Male", "Duet"
];

const TAALS = [
    "Keherwa", "Keherwa Slow", "Dadra", "Dadra Slow", "EkTaal", 
    "JhapTaal", "TeenTaal", "Rupak", "Deepchandi", "Garba",
    "RD Pattern", "Desi Drum", "Western", "Waltz", "Rock", 
    "Jazz", "March Rhythm"
];

const TIMES = ["4/4", "3/4", "2/4", "6/8", "5/4", "7/8", "12/8", "14/8"];
```

### 2. **API Endpoint Reads main.js**

New API endpoint `/api/song-metadata` dynamically reads and parses main.js:

```javascript
GET /api/song-metadata

Response:
{
  "genres": [...],           // All genres from GENRES array
  "musicalGenres": [...],    // Filtered (excludes era/language/vocal tags)
  "taals": [...],            // All taals from TAALS array
  "times": [...],            // All time signatures from TIMES array
  "timeGenreMap": {...},     // TIME_GENRE_MAP object
  "vocalTags": ["Male", "Female", "Duet"],
  "languageTags": ["Hindi", "Marathi", "English"],
  "eraSettings": ["New", "Old", "Mid"]
}
```

### 3. **Loop Manager Uses API**

[loop-manager.html](loop-manager.html) fetches metadata on page load:

```javascript
// Loads dynamically from API
await loadSongMetadata();

// Populates dropdowns automatically
populateDropdowns();
```

**Result**: Dropdowns always show current main.js values!

### 4. **Loops Metadata Syncs Automatically**

When `/api/loops/metadata` is called, it:
1. Checks if loops-metadata.json exists
2. If missing or outdated, reads main.js
3. Auto-updates supportedTaals, supportedGenres, supportedTimeSignatures
4. Saves updated metadata

**Result**: Loop matching always uses latest main.js arrays!

## Workflow

### Adding New Taal/Genre/Time to System

**Before (Manual Sync - tedious ❌):**
1. Update main.js → Add "Bhangra" to TAALS
2. Update loops-metadata.json → Add "bhangra" to supportedTaals
3. Update loop-manager.html → Add option to dropdown
4. Redeploy

**Now (Auto-Sync - easy ✅):**
1. Update main.js → Add "Bhangra" to TAALS array
2. **That's it!** System auto-syncs on next load

### Example: Adding New Taal

```javascript
// In main.js
const TAALS = [
    "Keherwa", "Keherwa Slow", "Dadra", "Dadra Slow",
    "Bhangra",  // ← Add new taal here
    "EkTaal", "JhapTaal", "TeenTaal", "Rupak"
];
```

**What Happens Automatically:**
1. `/api/song-metadata` returns "Bhangra" in taals array
2. Loop Manager dropdown shows "Bhangra" option
3. `/api/loops/metadata` updates supportedTaals with "bhangra"
4. Loop matching now supports Bhangra songs

**No other changes needed!**

## API Endpoints

### GET /api/song-metadata
Returns all song metadata arrays from main.js

**Use Case**: Loop Manager, any UI needing dynamic metadata

**Caching**: No caching - always reads fresh from main.js

**Example**:
```bash
curl http://localhost:3000/api/song-metadata
```

### GET /api/loops/metadata
Returns loop metadata with auto-synced arrays

**Use Case**: Loop player matching, admin panel

**Auto-Sync**: Updates supportedTaals/Genres/Times from main.js if missing

**Example**:
```bash
curl http://localhost:3000/api/loops/metadata
```

## Genre Filtering

Musical genres are automatically filtered from metadata tags:

**Excluded from Loop System** (not musical genres):
- Era tags: "New", "Old", "Mid"
- Language tags: "Hindi", "Marathi", "English"
- Vocal tags: "Male", "Female", "Duet"

**Included in Loop System** (musical genres):
- "Acoustic", "Rock", "Qawalli", "Classical", "Ghazal", "Sufi", "Blues", "RD Pattern", etc.

This filtering happens automatically in the API.

## Benefits

### ✅ **No More Manual Sync**
Update main.js once, everything syncs automatically

### ✅ **Always Consistent**
Loop system always matches current main.js metadata

### ✅ **Less Code Duplication**
Single source of truth (main.js)

### ✅ **Easier Maintenance**
Add new taal/genre in one place

### ✅ **No Redeployment Needed**
Changes in main.js take effect immediately (server restart)

## Important Notes

### 1. **Case Handling**
- main.js uses Title Case: "Keherwa", "Dadra"
- Loop files use lowercase: keherwa, dadra
- System auto-converts for matching

### 2. **Genre Filtering**
Only musical genres appear in Loop Manager dropdowns. Era/language/vocal tags are automatically excluded.

### 3. **Server Restart Required**
After updating main.js:
```bash
# Restart server to pick up changes
node server.js
```

Or in development:
```bash
# If using nodemon, changes auto-reload
nodemon server.js
```

### 4. **Metadata Cache**
Loop Manager caches song metadata during page session. Refresh page to reload:
```javascript
// In browser console (if needed)
location.reload();
```

## Troubleshooting

### Dropdown Not Showing New Values

**Problem**: Added new taal to main.js but dropdown still shows old values

**Solution**:
1. Check main.js syntax (proper quotes, commas)
2. Restart server: `node server.js`
3. Hard refresh browser: `Ctrl+Shift+R`
4. Check browser console for API errors

### Loops Not Matching Songs

**Problem**: Uploaded loops for "Bhangra" but songs aren't matching

**Solution**:
1. Check song.taal field in database matches TAALS array case-insensitively
2. Verify loops-metadata.json has "bhangra" in supportedTaals
3. Test API: `curl http://localhost:3000/api/loops/metadata`
4. Check browser console during song play

### API Returns Empty Arrays

**Problem**: `/api/song-metadata` returns empty arrays

**Solution**:
1. Check main.js file exists and is readable
2. Verify array syntax is correct (proper closing brackets)
3. Check server logs for parsing errors
4. Test regex pattern manually

## Future Enhancements

### Possible Improvements

1. **Live Reload**: Auto-refresh Loop Manager when main.js changes
2. **Admin Interface**: Edit TAALS/GENRES from web UI, save to main.js
3. **Validation**: Check for duplicate or invalid values
4. **Stats Dashboard**: Show which taals/genres have loops available
5. **Bulk Import**: Parse all songs, suggest missing loop combinations

### Extension Points

The system is designed to be extensible. To add new metadata:

1. Add array to main.js (e.g., `const MOODS = [...]`)
2. Add extraction logic in `/api/song-metadata` endpoint
3. Add to loop metadata schema if needed
4. Update matching logic in `findMatchingLoopSet()`

## Summary

**Before**: Manual sync across 3+ files  
**Now**: Update main.js → Auto-sync everywhere

This makes maintaining the loop system much easier and reduces errors from inconsistent metadata.

---

**Last Updated**: February 15, 2026  
**Version**: 2.0 (Auto-Sync)
