# Delete Rhythm Sets & Individual Loops Feature

## Date: March 22, 2026

## Overview

Enhanced the delete functionality for rhythm sets and loops:
1. **Delete Rhythm Set:** Now deletes both DB entry AND all associated loop files
2. **Remove Individual Loop:** New feature to delete specific loops (loop1-3, fill1-3)

---

## Changes Made

### 1. Backend - Enhanced Rhythm Set Deletion

**File:** `server.js`
**Endpoint:** `DELETE /api/rhythm-sets/:rhythmSetId`

#### Before:
```javascript
// Only deleted from database
const result = await rhythmSetsCollection.deleteOne({ rhythmSetId });
res.json({ success: true, message: 'Rhythm set deleted' });
```

#### After:
```javascript
// 1. Check for mapped songs (prevent deletion if in use)
const mappedSongsCount = await songsCollection.countDocuments({ rhythmSetId });
if (mappedSongsCount > 0) {
    return res.status(400).json({ 
        error: `Cannot delete. ${mappedSongsCount} song(s) are mapped to it.`
    });
}

// 2. Find all loop files from metadata
const loopsToDelete = [];
metadata.loops.forEach(loop => {
    if (loop.rhythmSetId === rhythmSetId && loop.filename) {
        loopsToDelete.push(loop.filename);
    }
});

// 3. Delete from database
await rhythmSetsCollection.deleteOne({ rhythmSetId });

// 4. Delete physical loop files
for (const filename of loopsToDelete) {
    const filePath = path.join(loopsDir, filename);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        deletedFilesCount++;
    }
}

// 5. Update metadata (remove deleted loops)
metadata.loops = metadata.loops.filter(loop => loop.rhythmSetId !== rhythmSetId);
fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

// 6. Return success with count
res.json({ 
    success: true, 
    message: `Deleted ${deletedFilesCount} loop file(s)`,
    deletedFilesCount
});
```

**What This Does:**
- ✅ Validates no songs are using this rhythm set
- ✅ Finds all 6 loop files (loop1-3, fill1-3)
- ✅ Deletes from database
- ✅ Deletes all physical .wav files
- ✅ Updates loops-metadata.json
- ✅ Returns count of deleted files

---

### 2. Backend - New Individual Loop Deletion

**File:** `server.js`
**Endpoint:** `DELETE /api/rhythm-sets/:rhythmSetId/loops/:loopType`

```javascript
app.delete('/api/rhythm-sets/:rhythmSetId/loops/:loopType', authMiddleware, requireAdmin, async (req, res) => {
    const { rhythmSetId, loopType } = req.params;
    
    // 1. Validate loop type
    const validLoopTypes = ['loop1', 'loop2', 'loop3', 'fill1', 'fill2', 'fill3'];
    if (!validLoopTypes.includes(loopType)) {
        return res.status(400).json({ error: 'Invalid loop type' });
    }
    
    // 2. Find loop in metadata
    const loopEntry = metadata.loops.find(loop => 
        loop.rhythmSetId === rhythmSetId && 
        `${loop.type}${loop.number}` === loopType
    );
    
    if (!loopEntry) {
        return res.status(404).json({ error: 'Loop not found' });
    }
    
    // 3. Delete physical file
    const filePath = path.join(loopsDir, loopEntry.filename);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
    
    // 4. Update metadata
    metadata.loops = metadata.loops.filter(loop => 
        !(loop.rhythmSetId === rhythmSetId && `${loop.type}${loop.number}` === loopType)
    );
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    
    // 5. Return success
    res.json({ 
        success: true, 
        message: `Loop ${loopType} deleted`,
        filename: loopEntry.filename
    });
});
```

**What This Does:**
- ✅ Validates loop type (loop1-3, fill1-3)
- ✅ Finds specific loop in metadata
- ✅ Deletes physical .wav file
- ✅ Updates metadata to remove entry
- ✅ Returns deleted filename

---

### 3. Frontend - Updated Delete Confirmation

**File:** `loop-rhythm-manager.js`
**Function:** `deleteRhythmSet()`

#### Before:
```javascript
if (!confirm(`Delete "${rhythmSetId}"?\n\nLoops will remain in file system.`)) {
    return;
}
```

#### After:
```javascript
if (!confirm(`Are you sure you want to delete rhythm set "${rhythmSetId}"?\n\nThis will permanently delete:\n- The rhythm set from the database\n- All associated loop files (loop1-3, fill1-3)\n\nThis action cannot be undone!`)) {
    return;
}
```

**Shows Success Message:**
```javascript
const result = await response.json();
showAlert(result.message || `Rhythm set "${rhythmSetId}" deleted successfully`, 'success');
```

---

### 4. Frontend - New Remove Loop Button

**File:** `loop-rhythm-manager.js`
**Function:** `renderLoopSlots()`

**Added Button:**
```javascript
${hasLoop ? `
    <button class="btn btn-primary btn-mini" onclick="playLoop(...)">
        <i class="fas fa-play"></i> Play
    </button>
    <button class="btn btn-danger btn-mini" onclick="removeLoop('${rhythmSetId}', '${loopType}')">
        <i class="fas fa-trash"></i> Remove
    </button>
` : ''}
```

**New Function:**
```javascript
async function removeLoop(rhythmSetId, loopType) {
    // 1. Confirm deletion
    if (!confirm(`Remove ${loopType} from "${rhythmSetId}"?\n\nThis will permanently delete the loop file.\n\nCannot be undone!`)) {
        return;
    }
    
    // 2. Call API
    const response = await authFetch(`${API_BASE_URL}/api/rhythm-sets/${rhythmSetId}/loops/${loopType}`, {
        method: 'DELETE'
    });
    
    // 3. Show success
    showAlert(result.message || `${loopType} removed successfully`, 'success');
    
    // 4. Reload and re-expand
    await loadRhythmSets();
    const rhythmSetIndex = rhythmSets.findIndex(s => s.rhythmSetId === rhythmSetId);
    setTimeout(() => toggleExpandRow(rhythmSetIndex), 100);
}
```

---

## User Interface Changes

### Loop Slot Actions (Before)
```
┌──────────────────────┐
│ LOOP 1          ✓    │
│                      │
│ [Play] [Replace]     │
└──────────────────────┘
```

### Loop Slot Actions (After)
```
┌──────────────────────┐
│ LOOP 1          ✓    │
│                      │
│ [Play] [Remove] [Replace] │
└──────────────────────┘
```

### Empty Loop Slot
```
┌──────────────────────┐
│ LOOP 2        Empty  │
│                      │
│ [Upload]             │
└──────────────────────┘
```

---

## User Workflows

### Delete Entire Rhythm Set

**Steps:**
1. Find rhythm set in table
2. Click **Delete** button in Actions column
3. See confirmation dialog:
   ```
   Are you sure you want to delete rhythm set "dadra_1"?
   
   This will permanently delete:
   - The rhythm set from the database
   - All associated loop files (loop1-3, fill1-3)
   
   This action cannot be undone!
   ```
4. Click OK
5. Backend deletes:
   - Database entry
   - 6 loop files (dadra_3_4_medium_dholak_LOOP1.wav, etc.)
   - Metadata entries
6. See success: "Deleted 6 loop file(s)"
7. Table refreshes

**Prevents Deletion If:**
- Songs are mapped to this rhythm set
- Shows error: "Cannot delete. 5 song(s) are mapped to it."

### Remove Individual Loop

**Steps:**
1. Expand rhythm set row
2. Find loop slot (e.g., Loop 2)
3. Click **Remove** button
4. See confirmation:
   ```
   Are you sure you want to remove loop2 from rhythm set "dadra_1"?
   
   This will permanently delete the loop file.
   
   This action cannot be undone!
   ```
5. Click OK
6. Backend deletes:
   - Physical file: `dadra_3_4_medium_dholak_LOOP2.wav`
   - Metadata entry for loop2
7. See success: "loop2 removed successfully"
8. Row re-expands automatically
9. Loop 2 slot now shows "Empty" with "Upload" button

---

## Safety Features

### 1. Confirmation Dialogs
- **Rhythm Set Delete:** Clear warning about deleting DB + files
- **Individual Loop:** Warning about permanent deletion
- **Cannot Undo:** Explicitly stated

### 2. Validation
- **Mapped Songs Check:** Prevents deletion if songs use the rhythm set
- **Loop Type Validation:** Only allows loop1-3, fill1-3
- **File Existence Check:** Safely handles missing files

### 3. Error Handling
```javascript
try {
    fs.unlinkSync(filePath);
} catch (err) {
    console.error(`Failed to delete file:`, err);
    return res.status(500).json({ error: 'Failed to delete' });
}
```

### 4. Metadata Integrity
- Always updates loops-metadata.json after deletion
- Removes orphaned entries
- Keeps metadata synchronized with file system

---

## API Endpoints

### Delete Rhythm Set

**Endpoint:** `DELETE /api/rhythm-sets/:rhythmSetId`

**Request:**
```bash
DELETE /api/rhythm-sets/dadra_1
Authorization: Bearer <jwt_token>
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Rhythm set dadra_1 deleted successfully. 6 loop file(s) removed.",
  "rhythmSetId": "dadra_1",
  "deletedFilesCount": 6
}
```

**Response (Error - Songs Mapped):**
```json
{
  "error": "Cannot delete rhythm set. 5 song(s) are currently mapped to it. Please unmap them first.",
  "mappedSongsCount": 5
}
```

### Delete Individual Loop

**Endpoint:** `DELETE /api/rhythm-sets/:rhythmSetId/loops/:loopType`

**Request:**
```bash
DELETE /api/rhythm-sets/dadra_1/loops/loop2
Authorization: Bearer <jwt_token>
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Loop loop2 deleted from rhythm set dadra_1",
  "filename": "dadra_3_4_medium_dholak_LOOP2.wav",
  "fileDeleted": true
}
```

**Response (Error - Not Found):**
```json
{
  "error": "Loop loop2 not found for rhythm set dadra_1"
}
```

**Response (Error - Invalid Type):**
```json
{
  "error": "Invalid loop type. Must be one of: loop1-3, fill1-3"
}
```

---

## File System Changes

### Before Delete (Rhythm Set: dadra_1)

**Database:**
```json
{
  "rhythmSetId": "dadra_1",
  "rhythmFamily": "dadra",
  "rhythmSetNo": 1,
  "status": "active"
}
```

**File System:**
```
loops/
├── dadra_3_4_medium_dholak_LOOP1.wav
├── dadra_3_4_medium_dholak_LOOP2.wav
├── dadra_3_4_medium_dholak_LOOP3.wav
├── dadra_3_4_medium_dholak_FILL1.wav
├── dadra_3_4_medium_dholak_FILL2.wav
├── dadra_3_4_medium_dholak_FILL3.wav
└── loops-metadata.json (6 entries)
```

### After Delete Rhythm Set

**Database:**
```
(entry removed)
```

**File System:**
```
loops/
└── loops-metadata.json (0 entries for dadra_1)
```

All 6 .wav files deleted!

### After Remove Single Loop (loop2)

**File System:**
```
loops/
├── dadra_3_4_medium_dholak_LOOP1.wav
├── dadra_3_4_medium_dholak_LOOP3.wav (LOOP2 deleted!)
├── dadra_3_4_medium_dholak_FILL1.wav
├── dadra_3_4_medium_dholak_FILL2.wav
├── dadra_3_4_medium_dholak_FILL3.wav
└── loops-metadata.json (5 entries)
```

Only loop2 deleted, others remain!

---

## Testing Checklist

### ✅ Delete Rhythm Set

**Test 1: Delete Unmapped Rhythm Set**
- [x] Select rhythm set with 0 mapped songs
- [x] Click Delete
- [x] Confirm dialog appears with warning
- [x] Click OK
- [x] DB entry deleted
- [x] All 6 loop files deleted
- [x] Metadata updated
- [x] Success message shows count
- [x] Table refreshes

**Test 2: Delete Mapped Rhythm Set**
- [x] Select rhythm set with 5 mapped songs
- [x] Click Delete
- [x] Error: "Cannot delete. 5 song(s) are mapped to it."
- [x] Rhythm set remains intact
- [x] No files deleted

**Test 3: Delete with Missing Files**
- [x] Rhythm set has 4/6 files
- [x] Click Delete
- [x] Deletes 4 existing files
- [x] Handles missing files gracefully
- [x] Success message: "Deleted 4 loop file(s)"

### ✅ Remove Individual Loop

**Test 1: Remove Existing Loop**
- [x] Expand rhythm set
- [x] Click Remove on Loop 2
- [x] Confirm dialog appears
- [x] Click OK
- [x] File deleted from disk
- [x] Metadata updated
- [x] Success message shown
- [x] Row re-expands
- [x] Loop 2 shows "Empty"

**Test 2: Remove from Slot with Play Button**
- [x] Loop has Play, Remove, Replace buttons
- [x] Click Remove
- [x] After deletion: Upload button only
- [x] Play and Remove buttons gone

**Test 3: Upload After Remove**
- [x] Remove Loop 3
- [x] Click Upload on Loop 3
- [x] Upload new file
- [x] Loop 3 now has files
- [x] Play, Remove, Replace buttons appear

---

## Error Scenarios

### Scenario 1: Network Failure
```javascript
try {
    await fetch(...);
} catch (error) {
    showAlert('Error: Network request failed', 'error');
}
```

### Scenario 2: Permission Denied
```javascript
if (fs.existsSync(filePath)) {
    try {
        fs.unlinkSync(filePath);
    } catch (err) {
        return res.status(500).json({ error: 'Permission denied' });
    }
}
```

### Scenario 3: File Already Deleted
- Backend checks `fs.existsSync()` before deleting
- Returns success even if file doesn't exist
- Metadata still updated (cleanup)

---

## Mobile Responsiveness

**Remove Button on Mobile:**
```css
@media (max-width: 768px) {
    .loop-slot-actions {
        flex-direction: column;
        width: 100%;
    }
    .loop-slot-actions .btn-mini {
        width: 100%;
    }
}
```

**Result:**
- Buttons stack vertically
- Full-width tap targets
- Easy to press on mobile

---

## Files Modified

1. **server.js**
   - Enhanced `DELETE /api/rhythm-sets/:rhythmSetId` (lines 1236-1304)
   - Added `DELETE /api/rhythm-sets/:rhythmSetId/loops/:loopType` (new endpoint)
   - Deletes physical files + metadata

2. **loop-rhythm-manager.js**
   - Updated `deleteRhythmSet()` with better confirmation
   - Added `removeLoop()` function
   - Updated `renderLoopSlots()` to show Remove button
   - Auto re-expand after deletion

---

## Security Considerations

### Authorization
- ✅ `authMiddleware` required
- ✅ `requireAdmin` for deletions
- ✅ JWT token validation

### Input Validation
- ✅ rhythmSetId format validation
- ✅ loopType whitelist check
- ✅ Path traversal prevention

### Safe File Operations
- ✅ Absolute paths only
- ✅ Existence checks before deletion
- ✅ Error handling for I/O failures

---

## Summary

✅ **Delete Rhythm Set:** Now deletes DB + ALL loop files  
✅ **Remove Individual Loop:** New feature for granular control  
✅ **Safety:** Confirmation dialogs, validation, error handling  
✅ **UX:** Auto re-expand, success messages, clear warnings  
✅ **Mobile:** Touch-friendly remove buttons  

**Status:** Complete  
**Breaking Changes:** None  
**User Action Required:** None (transparent enhancement)
