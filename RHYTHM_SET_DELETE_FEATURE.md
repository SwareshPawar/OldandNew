# Rhythm Set Delete Functionality

## Overview
Added the ability to delete rhythm sets from the Rhythm Set Management section, with safety checks to prevent deletion of rhythm sets that are currently in use by songs.

## Changes Made

### Backend Updates (`server.js`)

1. **New DELETE endpoint: `/api/rhythm-sets/:rhythmSetId`**
   - Requires authentication and admin privileges
   - Validates rhythmSetId format (must be `family_setNo`)
   - Checks if any songs are mapped to the rhythm set
   - Prevents deletion if songs are still mapped (safety check)
   - Deletes rhythm set from database if no songs are mapped
   - Returns success/error response with appropriate messages

2. **Safety Features**
   - **Pre-deletion validation**: Counts mapped songs before deletion
   - **Protective error**: Returns 400 error if songs are mapped
   - **Clear error messages**: Tells user exactly how many songs need to be unmapped
   - **404 handling**: Returns error if rhythm set doesn't exist

### Frontend Updates (`rhythm-sets-manager.js`)

1. **Added Delete button to Actions column**
   - Red danger button for visual clarity
   - Positioned at the end of action buttons
   - Tooltip: "Delete this rhythm set"

2. **New `deleteRhythmSet()` function**
   - Sends DELETE request to API
   - Handles response and errors
   - Returns parsed JSON response

3. **Enhanced delete event handler**
   - Shows confirmation dialog before deletion
   - Displays warning if songs are mapped to the rhythm set
   - Includes mapped song count in warning
   - Emphasizes action cannot be undone
   - Shows progress and success/error messages
   - Refreshes all data after successful deletion
   - Extended error display (5 seconds) for better visibility

4. **Smart confirmation dialog**
   ```
   Normal case:
   "Are you sure you want to delete rhythm set 'keherwa_2'?
   This action cannot be undone."

   With mapped songs:
   "Are you sure you want to delete rhythm set 'keherwa_2'?
   
   Warning: 5 song(s) are currently mapped to this rhythm set. 
   You must unmap them first.
   
   This action cannot be undone."
   ```

## User Experience Flow

### Successful Deletion (No Mapped Songs)
1. User clicks "Delete" button for a rhythm set
2. Confirmation dialog appears
3. User confirms
4. Alert shows "Deleting keherwa_2..."
5. Rhythm set is deleted
6. Alert shows "keherwa_2 deleted successfully."
7. Table refreshes without the deleted rhythm set
8. Statistics update (total rhythm sets count decreases)

### Prevented Deletion (Has Mapped Songs)
1. User clicks "Delete" button for a rhythm set
2. Confirmation dialog shows warning about mapped songs
3. If user confirms anyway:
   - Alert shows "Deleting keherwa_2..."
   - Server returns error: "Cannot delete rhythm set. 5 song(s) are currently mapped to it."
   - Error alert displays for 5 seconds
4. Rhythm set remains in table
5. User must unmap songs first, then try again

### How to Delete a Rhythm Set with Mapped Songs
1. Note which songs are mapped (check "Mapped" column count)
2. Go to Song Mapping section
3. Search for songs with that rhythm set
4. Select those songs
5. Assign them to a different rhythm set (or leave unmapped)
6. Return to Rhythm Set Management
7. Now the "Delete" button will work

## Safety Features

### Server-Side Protection
- ✅ Validates rhythm set ID format
- ✅ Checks for mapped songs before deletion
- ✅ Returns clear error message with song count
- ✅ Requires admin authentication
- ✅ Uses atomic database operations

### Client-Side Protection
- ✅ Confirmation dialog before deletion
- ✅ Warning message for mapped songs
- ✅ Shows mapped song count in dialog
- ✅ Clear "cannot be undone" warning
- ✅ Extended error display (5s vs 2.5s)

## Technical Details

### API Endpoint
```
DELETE /api/rhythm-sets/:rhythmSetId
Headers: Authorization: Bearer <token>
Returns: 
  Success: { success: true, message: "...", rhythmSetId: "..." }
  Error: { error: "Cannot delete rhythm set. X song(s) are mapped..." }
```

### Error Codes
- **400**: Invalid rhythm set ID format or songs are mapped
- **404**: Rhythm set not found
- **401**: Not authenticated
- **403**: Not admin
- **500**: Server error

### Database Operations
1. Parse and validate rhythmSetId
2. Count documents in songs collection with matching rhythmSetId
3. If count > 0: return error with count
4. If count = 0: delete from rhythmSets collection
5. Return result

## UI Location

```
Actions Column (Right Side):
┌────────────────────────────────────────────────┐
│ [Save] [Save Name] [Recompute] [Use] [Delete] │
│   ✓       🔄          ⚙️        →       🗑️     │
└────────────────────────────────────────────────┘
```

## Benefits

1. **Clean Management**: Remove unused/test rhythm sets
2. **Database Hygiene**: Keep only active rhythm sets
3. **Safe Operations**: Cannot accidentally delete sets in use
4. **Clear Feedback**: Users know exactly why deletion failed
5. **Data Integrity**: Prevents orphaned song mappings

## Best Practices

### Before Deleting
- ✅ Check the "Mapped" column count
- ✅ Verify this is the correct rhythm set
- ✅ Ensure loops are backed up if needed
- ✅ Consider archiving instead (change status to "archived")

### Alternative to Deletion
Instead of deleting, you can:
1. Change status to "archived" or "inactive"
2. Add note: "DO NOT USE - deprecated"
3. Keep for historical reference
4. Delete later when certain no songs reference it

### Recovery
- ⚠️ Deletion is permanent - there is no undo
- ⚠️ Rhythm set data is removed from database
- ⚠️ Loop files on server are NOT deleted (manual cleanup needed)
- ℹ️ If needed, recreate with same family_setNo and re-upload loops

## Example Scenarios

### Scenario 1: Delete Test Rhythm Set
```
Rhythm Set: test_1
Mapped Songs: 0
Action: Click Delete → Confirm → ✅ Deleted
```

### Scenario 2: Delete Active Rhythm Set
```
Rhythm Set: keherwa_2
Mapped Songs: 12
Action: Click Delete → Confirm → ❌ Error
Message: "Cannot delete rhythm set. 12 song(s) are currently mapped to it."
Solution: Remap those 12 songs to keherwa_1, then delete
```

### Scenario 3: Archive Instead of Delete
```
Rhythm Set: old_dadra_1
Mapped Songs: 3
Better Approach:
1. Change status to "archived"
2. Add note: "Replaced by dadra_2"
3. Remap songs when convenient
4. Delete later when ready
```
