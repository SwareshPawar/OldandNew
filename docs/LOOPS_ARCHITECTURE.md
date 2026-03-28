# Loops Architecture - Files & Metadata Sync

## Overview
Loop audio files are stored in the **repository** (`/loops/` directory), while metadata/references are stored in **MongoDB**. All operations keep both in perfect sync.

## File Naming Convention (v3.0)
```
Format: {rhythmSetId}_{TYPE}{number}.wav

Examples:
- dadra_1_LOOP1.wav
- dadra_1_LOOP2.wav
- dadra_1_FILL1.wav
- keherwa_2_LOOP1.wav
```

## Storage Locations

### 1. **Files** (Repository)
- **Location**: `/loops/` directory in git repository
- **What**: Actual audio files (.wav, .mp3)
- **Why repo**: Version controlled, backed up, deployed with code

### 2. **Metadata** (MongoDB)
- **Collection**: `LoopsMetadata`
- **What**: References to files + rhythm set info
- **Structure**:
  ```javascript
  {
    _id: 'loops-metadata',
    data: {
      version: '2.0',
      loops: [
        {
          id: 'dadra_1_loop1',
          filename: 'dadra_1_LOOP1.wav',  // ← Reference to file
          rhythmSetId: 'dadra_1',
          rhythmFamily: 'dadra',
          rhythmSetNo: 1,
          type: 'loop',
          number: 1,
          conditions: { taal, timeSignature, tempo, genre },
          metadata: { duration, uploadedAt, description }
        }
      ],
      rhythmSets: [...],
      supportedTaals: [...],
      supportedGenres: [...],
      supportedTimeSignatures: [...]
    }
  }
  ```

## Operation Sync Matrix

| Operation | Files (Repository) | Metadata (MongoDB) | Sync Status |
|-----------|-------------------|-------------------|-------------|
| **Rename Rhythm Set** | ✅ Renames files<br>`dadra_1_LOOP1.wav` → `dadra_2_LOOP1.wav` | ✅ Updates all references<br>rhythmSetId, filename, id | ✅ Synced |
| **Upload Loops** | ✅ Saves files to `/loops/` | ✅ Creates metadata entries | ✅ Synced |
| **Delete Loop** | ✅ Deletes file from disk | ✅ Removes metadata entry | ✅ Synced |
| **Copy Loop** | ✅ Copies file to new name | ✅ Creates new metadata entry | ✅ Synced |
| **Swap Loops** | ⏭️ **Files stay in place** | ✅ Swaps filename references | ✅ Synced |
| **Duplicate Rhythm Set** | ⏭️ **Reuses same files** | ✅ Creates new entries with `sharedFile: true` | ✅ Synced |
| **Assign Loop** | ⏭️ **File stays in place** | ✅ Creates new reference | ✅ Synced |

## How Sync Works

### 1. **Rename Rhythm Set** (`dadra_1` → `dadra_2`)
```javascript
// server.js: renameRhythmSetInLoopsMetadata()
async function renameRhythmSetInLoopsMetadata(oldId, newFamily, newSetNo, newId) {
  metadata.loops = loops.map(loop => {
    if (loop.rhythmSetId === oldId) {
      // 1. Rename actual file
      fs.renameSync(
        'loops/dadra_1_LOOP1.wav',
        'loops/dadra_2_LOOP1.wav'
      );
      
      // 2. Update metadata references
      loop.filename = 'dadra_2_LOOP1.wav';
      loop.rhythmSetId = 'dadra_2';
      loop.rhythmFamily = 'dadra';
      loop.rhythmSetNo = 2;
      loop.id = 'dadra_2_loop1';
    }
    return loop;
  });
  
  // 3. Save to MongoDB
  await writeLoopsMetadata(metadata);
}
```

### 2. **Upload Loops**
```javascript
// 1. Save files to repository
fs.renameSync(uploadedFile, 'loops/dadra_1_LOOP1.wav');

// 2. Create metadata
metadata.loops.push({
  filename: 'dadra_1_LOOP1.wav',
  rhythmSetId: 'dadra_1',
  // ... other metadata
});

// 3. Save to MongoDB
await writeLoopsMetadata(metadata);
```

### 3. **Swap Loops** (Efficient!)
```javascript
// Files: loops/dadra_1_LOOP1.wav, loops/keherwa_1_LOOP1.wav stay put

// Metadata: Just swap references
metadata.loops[0].filename = 'keherwa_1_LOOP1.wav';  // dadra slot now points to keherwa file
metadata.loops[1].filename = 'dadra_1_LOOP1.wav';    // keherwa slot now points to dadra file

await writeLoopsMetadata(metadata);
```

### 4. **Duplicate Rhythm Set** (Space Efficient!)
```javascript
// Files: Reuse existing files (no copy)
// loops/dadra_1_LOOP1.wav used by both dadra_1 and dadra_2

// Metadata: Create new entries pointing to same files
metadata.loops.push({
  rhythmSetId: 'dadra_2',
  filename: 'dadra_1_LOOP1.wav',  // ← Same file!
  sharedFile: true
});

await writeLoopsMetadata(metadata);
```

## MongoDB Functions

### Read from MongoDB
```javascript
async function readLoopsMetadata() {
  const doc = await loopsMetadataCollection.findOne({ _id: 'loops-metadata' });
  return doc ? doc.data : { version: '2.0', loops: [] };
}
```

### Write to MongoDB
```javascript
async function writeLoopsMetadata(metadata) {
  await loopsMetadataCollection.updateOne(
    { _id: 'loops-metadata' },
    { $set: { data: metadata, updatedAt: new Date() } },
    { upsert: true }
  );
}
```

### Bootstrap from File (One-time on startup)
```javascript
async function bootstrapLoopsMetadataFromFile() {
  const existing = await loopsMetadataCollection.findOne({ _id: 'loops-metadata' });
  if (existing) return; // Already bootstrapped
  
  // Read from file and save to MongoDB
  const fileData = JSON.parse(fs.readFileSync('loops/loops-metadata.json'));
  await writeLoopsMetadata(fileData);
}
```

## Production Behavior

### Local Development
- **Files**: Read/write from `/loops/` directory
- **Metadata**: Read from MongoDB, write to MongoDB
- **Startup**: Bootstrap MongoDB from file if empty

### Production (Vercel)
- **Files**: Deployed with code in `/loops/` directory (read-only)
- **Metadata**: Read/write from MongoDB (✅ works!)
- **Startup**: Uses existing MongoDB data

## Why This Architecture?

✅ **Files in repo**: Version controlled, backed up, deployed automatically  
✅ **Metadata in MongoDB**: Editable in production (Vercel read-only filesystem)  
✅ **Always in sync**: Every operation updates both files and metadata  
✅ **Efficient**: Duplicate/Swap operations reuse files instead of copying  
✅ **Consistent**: Works same way in local and production  

## Testing Sync

```javascript
// Test 1: Rename rhythm set
PUT /api/rhythm-sets/dadra_1
Body: { newRhythmSetId: 'dadra_2' }
Result: 
  - Files renamed: dadra_1_LOOP1.wav → dadra_2_LOOP1.wav ✅
  - MongoDB updated: rhythmSetId, filename, id all changed ✅

// Test 2: Upload new loop
POST /api/loops/upload
Files: [LOOP1.wav, LOOP2.wav, LOOP3.wav, FILL1.wav, FILL2.wav, FILL3.wav]
Result:
  - Files saved to /loops/ with correct names ✅
  - MongoDB metadata created for all files ✅

// Test 3: Swap loops
POST /api/rhythm-sets/loops/swap
Body: { slot1: {...}, slot2: {...} }
Result:
  - Files stay in place ✅
  - MongoDB references swapped ✅
```

## Migration Complete

Before: File-based metadata (fails in production)
After: MongoDB metadata + repo files (works everywhere!)

All operations maintain perfect sync between files and metadata! 🎉
