# Rhythm Set Edit Feature Implementation

## Overview
Added an **Edit** button alongside the **Delete** button in the loop-rhythm-manager.html that allows editing the Rhythm Set ID. This feature updates the rhythm set ID across the entire system end-to-end.

## Implementation Date
March 24, 2026

## Files Modified

### 1. `/loop-rhythm-manager.html`
- **Added Edit Modal** (lines ~630-695):
  - Modal dialog for editing rhythm set ID
  - Shows current rhythm set ID
  - Inputs for new rhythm family and set number
  - Live preview of new rhythm set ID
  - Conflict detection warning
  - Warning about what will be updated
  - Save and Cancel buttons

### 2. `/loop-rhythm-manager.js`
- **Modified table rendering** (line ~385):
  - Added "Edit" button next to the "Delete" button
  - Edit button calls `editRhythmSet(rhythmSetId, rhythmFamily, rhythmSetNo)`

- **Added new functions** (lines ~1170-1350):
  - `editRhythmSet(rhythmSetId, rhythmFamily, rhythmSetNo)`: Opens edit modal with current values
  - `updateEditPreview()`: Live preview of new rhythm set ID with conflict detection
  - `saveRhythmSetEdit()`: Saves the edited rhythm set via API
  - `closeEditModal()`: Closes the edit modal and clears inputs

### 3. `/server.js`
- **Enhanced PUT endpoint** (line ~1167-1169):
  - Added tracking of `updatedSongsCount` when renaming
  - Returns count of songs updated in the response
  - Response now includes `updatedSongsCount` field

## Features

### 1. Edit Button
- Located next to the Delete button in the Actions column
- Primary blue color to distinguish from Delete
- Icon: `fa-edit`

### 2. Edit Modal
- **Current State Display**: Shows the current rhythm set ID
- **New Values Input**:
  - Rhythm Family text input
  - Set Number numeric input (minimum 1)
- **Live Preview**: Shows the new rhythm set ID as you type
- **Conflict Detection**: 
  - Warns if the new ID already exists
  - Disables save button if conflict detected
- **Warning Section**: Clearly states what will be updated:
  - The rhythm set in the database
  - All loop files (renamed accordingly)
  - All songs mapped to this rhythm set

### 3. Backend Integration
The existing PUT endpoint at `/api/rhythm-sets/:rhythmSetId` handles:
- Updating the rhythm set document
- Renaming all loop files via `renameRhythmSetInLoopsMetadata()`
- Updating all songs that reference this rhythm set
- Recomputing derived metadata
- Returning the count of songs updated

### 4. End-to-End Updates
When a rhythm set ID is edited, the system automatically updates:
1. **RhythmSets Collection**: Updates the rhythm set document
2. **Songs Collection**: Updates all songs with the old rhythmSetId to the new one
3. **Loop Files**: Renames loop files in the file system and metadata
4. **Loops Metadata**: Updates the loops-metadata.json file

## User Flow

1. User clicks **Edit** button on a rhythm set row
2. Modal opens showing:
   - Current rhythm set ID
   - Inputs pre-filled with current family and set number
3. User modifies the family name or set number
4. Live preview shows the new rhythm set ID
5. If conflict detected, warning appears and save is disabled
6. User clicks **Save Changes**
7. Confirmation dialog appears with details of what will be updated
8. User confirms
9. System updates:
   - Rhythm set document
   - All related songs
   - All loop files
10. Success message shows count of songs updated
11. Table refreshes to show the updated rhythm set

## Technical Details

### API Endpoint
```
PUT /api/rhythm-sets/:rhythmSetId
```

**Request Body:**
```json
{
  "newRhythmSetId": "NewFamily_1",
  "rhythmFamily": "NewFamily",
  "rhythmSetNo": 1
}
```

**Response:**
```json
{
  "rhythmSetId": "NewFamily_1",
  "rhythmFamily": "NewFamily",
  "rhythmSetNo": 1,
  "previousRhythmSetId": "OldFamily_1",
  "renamed": true,
  "updatedSongsCount": 5,
  ...other rhythm set fields
}
```

### Error Handling
- Validates that family and set number are provided
- Checks for conflicts with existing rhythm set IDs
- Shows appropriate error messages
- Handles network errors gracefully

### Security
- Requires authentication (JWT token)
- Requires admin privileges
- Confirmation dialog before making changes

## UI/UX Improvements
- **Live Preview**: Users can see the new ID before saving
- **Conflict Detection**: Prevents creating duplicate IDs
- **Clear Warnings**: Users understand the scope of changes
- **Success Feedback**: Shows how many songs were updated
- **Responsive Design**: Modal works on all screen sizes

## Testing Checklist
- [ ] Edit button appears next to delete button
- [ ] Modal opens with correct current values
- [ ] Live preview updates as user types
- [ ] Conflict detection works correctly
- [ ] Save button disabled when invalid or conflict
- [ ] Confirmation dialog appears before saving
- [ ] Rhythm set is updated in database
- [ ] All related songs are updated
- [ ] Loop files are renamed correctly
- [ ] Success message shows correct song count
- [ ] Table refreshes with new data
- [ ] Modal closes properly
- [ ] Error handling works for network issues

## Benefits
1. **Data Consistency**: Ensures all references are updated atomically
2. **User-Friendly**: Clear interface with conflict prevention
3. **Comprehensive**: Updates everything end-to-end automatically
4. **Safe**: Requires confirmation and provides clear warnings
5. **Informative**: Shows exactly what will change and what changed

## Future Enhancements
- Add ability to edit status and notes in the same modal
- Add undo functionality
- Add bulk rename capability
- Add validation for rhythm family naming conventions
- Add preview of affected songs before saving
