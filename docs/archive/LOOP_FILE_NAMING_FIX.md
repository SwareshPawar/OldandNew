# Loop File Naming Convention Fix

## 🐛 Issue Summary

**Error:** `GET http://localhost:3001/loops/6beat_1/fill3.mp3 404 (Not Found)`

**Root Cause:** Frontend was trying to access loops using incorrect URL paths with subfolder structure, but backend stores all loops directly in `/loops/` folder with specific filenames.

---

## 📁 Actual File Storage

### Directory Structure
```
loops/
├── dadra_3_4_medium_dholak_LOOP1.wav
├── dadra_3_4_medium_dholak_LOOP2.wav
├── dadra_3_4_medium_dholak_LOOP3.wav
├── dadra_3_4_medium_dholak_FILL1.wav
├── dadra_3_4_medium_dholak_FILL2.wav
├── dadra_3_4_medium_dholak_FILL3.wav
├── keherwa_4_4_fast_dholak_LOOP1.wav
├── keherwa_4_4_fast_dholak_FILL1.wav
└── loops-metadata.json
```

### Naming Convention (v2.0)
**Format:** `{taal}_{timeSignature}_{tempo}_{genre}_{TYPE}{number}.wav`

**Example:** `dadra_3_4_medium_dholak_LOOP1.wav`
- **taal:** dadra
- **timeSignature:** 3_4 (represents 3/4)
- **tempo:** medium
- **genre:** dholak
- **TYPE:** LOOP (or FILL)
- **number:** 1 (1-3)

---

## ❌ What Was Wrong

### Frontend Behavior (BEFORE)
```javascript
// ❌ WRONG: Tried to access loops in subfolders
playLoop('6beat_1', 'fill3')
→ GET /loops/6beat_1/fill3.mp3
→ 404 Not Found

uploadSingleLoop('dadra_1', 'loop2')
→ Uploaded to wrong endpoint
→ Missing metadata (timeSignature, tempo, genre)
```

### Issues
1. **Wrong URL Structure:** Frontend used `/loops/{rhythmSetId}/{loopType}.mp3`
2. **Missing Metadata:** Upload didn't send required fields for proper naming
3. **No Filename Mapping:** Frontend didn't know actual filenames
4. **Wrong File Extension:** Expected `.mp3` but files are `.wav`

---

## ✅ What Was Fixed

### Backend Changes (`server.js`)

#### 1. Enhanced API Response
**Location:** `/api/rhythm-sets` endpoint

**Added Fields:**
```javascript
// Before
{
  rhythmSetId: "dadra_1",
  availableFiles: ["loop1", "loop2", "loop3"]
}

// After
{
  rhythmSetId: "dadra_1",
  availableFiles: ["loop1", "loop2", "loop3"],
  files: {
    loop1: "dadra_3_4_medium_dholak_LOOP1.wav",
    loop2: "dadra_3_4_medium_dholak_LOOP2.wav",
    loop3: "dadra_3_4_medium_dholak_LOOP3.wav"
  },
  conditionsHint: {
    taal: "dadra",
    timeSignature: "3/4",
    tempo: "medium",
    genre: "dholak"
  }
}
```

**Changes Made:**
```javascript
// Lines 1015-1020: Added files mapping
const files = loopSet ? loopSet.files || {} : {};
const conditionsHint = loopSet ? loopSet.conditionsHint || {} : {};

return {
  ...set,
  files: files,
  conditionsHint: conditionsHint,
  // ... other fields
};
```

---

### Frontend Changes (`loop-rhythm-manager.js`)

#### 1. Updated `renderLoopSlots()` Function
**Purpose:** Pass actual filename to play button

**Changes:**
```javascript
// Lines 318-325: Get filename from files mapping
const files = rhythmSet.files || {};
const filename = files[loopType] || '';

// Pass filename to playLoop
<button onclick="playLoop('${escapeHtml(rhythmSet.rhythmSetId)}', '${loopType}', '${escapeHtml(filename)}')">
```

#### 2. Updated `playLoop()` Function
**Purpose:** Use actual filename instead of constructing path

**Before:**
```javascript
async function playLoop(rhythmSetId, loopType) {
  const loopUrl = `${API_BASE_URL}/loops/${rhythmSetId}/${loopType}.mp3`;
  // ❌ Wrong path
}
```

**After:**
```javascript
async function playLoop(rhythmSetId, loopType, filename) {
  const loopUrl = `${API_BASE_URL}/loops/${filename}`;
  // ✅ Correct path: /loops/dadra_3_4_medium_dholak_LOOP1.wav
}
```

#### 3. Updated `uploadSingleLoop()` Function
**Purpose:** Send all required metadata for proper file naming

**Key Changes:**
```javascript
// Lines 408-450: Get metadata from rhythm set
const rhythmSet = rhythmSets.find(s => s.rhythmSetId === rhythmSetId);
const conditionsHint = rhythmSet.conditionsHint || {};

// Parse rhythmSetId
const parts = rhythmSetId.split('_');
const rhythmFamily = parts.slice(0, -1).join('_'); // "dadra"
const rhythmSetNo = parts[parts.length - 1];       // "1"

// Extract type and number
const type = loopType.includes('loop') ? 'loop' : 'fill';
const number = parseInt(loopType.match(/\d+/)[0], 10);

// Send complete metadata
formData.append('file', file);
formData.append('rhythmFamily', rhythmFamily);
formData.append('rhythmSetNo', rhythmSetNo);
formData.append('taal', conditionsHint.taal || rhythmFamily);
formData.append('type', type);
formData.append('number', number);
formData.append('timeSignature', conditionsHint.timeSignature || '4/4');
formData.append('tempo', conditionsHint.tempo || 'medium');
formData.append('genre', conditionsHint.genre || 'acoustic');

// Use correct endpoint
const response = await authFetch(`${API_BASE_URL}/api/loops/upload-single`, {
  method: 'POST',
  body: formData
});
```

**What This Does:**
1. **Gets existing metadata** from rhythm set's first loop
2. **Parses rhythmSetId** to extract family and set number
3. **Sends all required fields** for proper naming convention
4. **Uses correct API endpoint** (`/api/loops/upload-single`)
5. **Accepts both .mp3 and .wav** files

---

## 🎯 How It Works Now

### Play Loop Flow
```
1. User clicks "Play" on Loop 1 in dadra_1 rhythm set
   ↓
2. Frontend gets filename from rhythmSet.files.loop1
   → "dadra_3_4_medium_dholak_LOOP1.wav"
   ↓
3. Constructs URL: /loops/dadra_3_4_medium_dholak_LOOP1.wav
   ↓
4. HTML5 Audio player loads and plays the file
   ✅ Success!
```

### Upload Loop Flow
```
1. User clicks "Upload" on Fill 3 in keherwa_2 rhythm set
   ↓
2. Frontend gets conditionsHint from rhythm set:
   {
     taal: "keherwa",
     timeSignature: "4/4",
     tempo: "fast",
     genre: "dholak"
   }
   ↓
3. Parses rhythmSetId "keherwa_2":
   - rhythmFamily: "keherwa"
   - rhythmSetNo: "2"
   ↓
4. Sends to /api/loops/upload-single with:
   - file: [user's file]
   - rhythmFamily: "keherwa"
   - rhythmSetNo: "2"
   - taal: "keherwa"
   - type: "fill"
   - number: 3
   - timeSignature: "4/4"
   - tempo: "fast"
   - genre: "dholak"
   ↓
5. Backend creates file: keherwa_4_4_fast_dholak_FILL3.wav
   ↓
6. Updates loops-metadata.json
   ↓
7. Frontend reloads rhythm sets
   ✅ New loop appears!
```

---

## 🔍 Metadata Structure

### loops-metadata.json
```json
{
  "version": "2.0",
  "description": "Loop file metadata and matching conditions",
  "loops": [
    {
      "id": "dadra_3_4_medium_dholak_loop1",
      "filename": "dadra_3_4_medium_dholak_LOOP1.wav",
      "type": "loop",
      "number": 1,
      "conditions": {
        "taal": "dadra",
        "timeSignature": "3/4",
        "tempo": "medium",
        "genre": "dholak"
      },
      "metadata": {
        "duration": 0,
        "uploadedAt": "2026-02-15T14:19:00.495Z",
        "description": ""
      },
      "files": {
        "loop1": "dadra_3_4_medium_dholak_LOOP1.wav"
      },
      "rhythmFamily": "dadra",
      "rhythmSetNo": 1,
      "rhythmSetId": "dadra_1"
    }
  ]
}
```

---

## 📊 API Response Format

### GET /api/rhythm-sets

**Response:**
```json
[
  {
    "rhythmSetId": "dadra_1",
    "rhythmFamily": "dadra",
    "rhythmSetNo": 1,
    "status": "active",
    "mappedSongCount": 5,
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
    "isComplete": true,
    "createdAt": "2026-02-15T14:19:00.495Z",
    "updatedAt": "2026-03-21T18:00:00.000Z"
  }
]
```

---

## 🎨 User Interface Changes

### Expandable Loop Slots

**Before:**
```
❌ All loops show "Empty" despite 6/6 in table
❌ Cannot play loops (404 errors)
❌ Upload doesn't work (wrong endpoint)
```

**After:**
```
✅ Green badges show which loops exist
✅ Play button works for available loops
✅ Upload creates properly named files
✅ Loops automatically appear after upload
```

### Visual Feedback
- **Green badge (✓):** Loop file exists and is playable
- **Red badge (Empty):** No loop uploaded yet
- **Play button:** Only shows for existing loops
- **Upload/Replace button:** Always available

---

## 🔄 Compatibility

### File Formats
- **Stored:** `.wav` files (original quality)
- **Accepted for Upload:** Both `.mp3` and `.wav`
- **Backend Converts:** Auto-converts to `.wav` if needed

### Naming Convention
- **Internal (Hidden from User):** `taal_timeSignature_tempo_genre_TYPE#.wav`
- **User Sees:** "Loop 1", "Fill 3", etc.
- **rhythmSetId:** Simple format like `dadra_1`, `keherwa_2`

---

## 🚀 Benefits

### For Users
1. **No Confusion:** User sees simple names (Loop 1, Fill 2)
2. **Automatic Naming:** System handles complex naming internally
3. **Consistent:** All loops in a set use same tempo/genre/timeSignature
4. **Play Works:** Can preview loops before using
5. **Upload Works:** Can add/replace individual loops

### For System
1. **Organized:** Files follow strict naming convention
2. **Metadata-Driven:** All info comes from loops-metadata.json
3. **No Duplicates:** Unique filenames prevent conflicts
4. **Searchable:** Easy to find loops by taal/tempo/genre
5. **Extensible:** Can add more metadata fields

### For Developers
1. **Clear Separation:** Internal naming hidden from UI
2. **Single Source of Truth:** loops-metadata.json
3. **Type-Safe:** Proper validation of all fields
4. **Maintainable:** Easy to understand file structure
5. **Debuggable:** Clear error messages

---

## 🎯 Testing Checklist

### ✅ Verified
- [x] Play button works for existing loops
- [x] Correct filenames shown in network tab
- [x] Upload sends all required metadata
- [x] New loops appear after upload
- [x] Files created with correct naming convention
- [x] loops-metadata.json updated correctly
- [x] Both .mp3 and .wav accepted for upload
- [x] Green/red badges show correct status
- [x] Multiple loops in same set share conditions

### 📝 Test Cases

#### Test 1: Play Existing Loop
1. Open Loop & Rhythm Manager
2. Expand dadra_1 rhythm set
3. Click "Play" on Loop 1
4. ✅ Should play without errors
5. Check network: `GET /loops/dadra_3_4_medium_dholak_LOOP1.wav 200 OK`

#### Test 2: Upload New Loop
1. Expand keherwa_2 rhythm set
2. Click "Upload" on Fill 3
3. Select any .mp3 or .wav file
4. ✅ Should upload successfully
5. Check file created: `keherwa_4_4_fast_dholak_FILL3.wav`
6. Check metadata updated in loops-metadata.json

#### Test 3: Replace Existing Loop
1. Expand rhythm set with existing loops
2. Click "Replace" on Loop 2
3. Select new file
4. ✅ Should replace old file
5. Old file deleted, new file with same name created

---

## 📚 Related Files

### Modified
1. **server.js** (Lines 1015-1030)
   - Added `files` mapping to API response
   - Added `conditionsHint` to API response

2. **loop-rhythm-manager.js** (Lines 318-450)
   - Updated `renderLoopSlots()` to pass filename
   - Updated `playLoop()` to use actual filename
   - Updated `uploadSingleLoop()` to send metadata

### Dependencies
1. **loops-metadata.json** - Source of truth for all loop metadata
2. **loops/** folder - Physical storage of loop files
3. **/api/loops/upload-single** - Backend upload endpoint

---

## 🎉 Summary

### Problem
Frontend couldn't play or upload loops due to incorrect file path assumptions and missing metadata.

### Solution
1. Backend now returns actual filenames in API response
2. Frontend uses these filenames for playback
3. Upload sends all required metadata from rhythm set
4. Internal naming convention hidden from users

### Result
- ✅ Play works perfectly
- ✅ Upload creates properly named files
- ✅ Loops mapped to correct rhythm sets
- ✅ User sees simple, clear interface
- ✅ System maintains organized file structure

---

**Fix Date:** March 21, 2026  
**Status:** ✅ COMPLETE  
**Files Changed:** 2 (server.js, loop-rhythm-manager.js)  
**Issue:** 404 errors on loop playback/upload  
**Resolution:** Proper filename mapping and metadata handling
