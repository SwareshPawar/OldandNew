# Rhythm Set Loop Preview Feature

## Overview
Added the ability to preview and play available loops directly from the Rhythm Set Management table, allowing admins to verify which loops are available for each rhythm set without switching to the song mapping section.

## Changes Made

### HTML Updates (`rhythm-sets-manager.html`)

1. **Added "Preview Loops" column**
   - New column in the Rhythm Set Management table
   - Displays between "Notes" and "Actions" columns
   - Shows individual play buttons for each available loop file

2. **Added "Stop All Previews" button**
   - Located above the rhythm sets table
   - Provides quick way to stop any playing preview
   - Consistent with the song mapping section's stop button

3. **Added CSS styling**
   - `.loop-preview-buttons` - Container for preview buttons
   - Compact button styling (smaller font, padding)
   - Flexible wrap layout for buttons
   - Minimum width for consistent button sizes

4. **Updated help text**
   - Added instruction about clicking loop buttons to hear rhythm
   - Maintains existing rhythm set naming guidance

### JavaScript Updates (`rhythm-sets-manager.js`)

1. **Enhanced `renderRhythmSetsTable()` function**
   - Generates preview buttons for each available loop file
   - Uses `loopsByRhythmSet` Map to find available loops
   - Creates buttons in standard order (loop1, loop2, loop3, fill1, fill2, fill3)
   - Shows "No loops" message if rhythm set has no uploaded loops
   - Each button has data attributes for filename and label

2. **Added preview button event handler**
   - Listens for clicks on `.preview-loop-btn` buttons
   - Extracts filename from button data attribute
   - Constructs proper URL for loop file
   - Calls existing `playPreview()` function
   - Reuses all existing audio playback logic

3. **Added "Stop All Previews" button handler**
   - Calls existing `stopPreview()` function
   - Provides consistent stop functionality across both sections

4. **Updated table colspan**
   - Changed from 6 to 7 columns to accommodate new Preview Loops column

## Features

### Visual Feedback
- **Play icon** (▶) turns to **pause icon** (⏸) when playing
- Button shows which loop is currently playing
- Clicking same button again stops playback
- Only one loop plays at a time (auto-stops previous)

### Available Loops Display
- Shows compact buttons for: **LOOP1**, **LOOP2**, **LOOP3**, **FILL1**, **FILL2**, **FILL3**
- Only shows buttons for actually uploaded files
- Empty rhythm sets show "No loops" message
- Matches file count in "Files" column (e.g., 4/6 files = 4 buttons shown)

### Audio Playback
- Reuses existing audio player infrastructure
- Seamless integration with song mapping preview buttons
- Stops when any other preview starts
- Auto-stops when loop finishes playing
- Works with both "Stop Preview" buttons

## User Benefits

1. **Quick Verification**: Check which loops are available without leaving the management view
2. **Quality Control**: Listen to loops before assigning rhythm set to songs
3. **Efficient Workflow**: Preview → Edit → Save all in one place
4. **Audio Validation**: Ensure correct loops are uploaded for each set
5. **No Context Switching**: Don't need to select a song to preview rhythm set loops

## Usage Instructions

### To Preview Loops:
1. Scroll through the Rhythm Set Management table
2. Look at the "Preview Loops" column
3. Click any loop button (LOOP1, LOOP2, etc.)
4. Listen to the rhythm
5. Click "Stop All Previews" button or click the same button again to stop

### To Compare Loops:
1. Click LOOP1 for a rhythm set
2. Listen to the pattern
3. Click LOOP2 to hear the variation
4. Continue comparing all available loops
5. Use this to verify consistency and quality

### Combined with Other Features:
1. **Check loops** → Click preview buttons
2. **Edit notes** → Add observations about the loops
3. **Map songs** → Use "Use" button to apply rhythm set
4. **Verify mapping** → Preview loops while assigning to songs

## Technical Implementation

- **No new API calls**: Uses existing `loopsByRhythmSet` Map loaded at initialization
- **Shared audio player**: Reuses `currentAudio` variable and `playPreview()` function
- **Efficient rendering**: Generates buttons during table render with minimal overhead
- **Data attributes**: Clean HTML5 data attributes for filename and label storage
- **Event delegation**: Single event listener handles all preview buttons

## File Structure

```
Preview Loops Column Layout:
┌─────────────────────────────┐
│ ▶ LOOP1  ▶ LOOP2  ▶ LOOP3  │
│ ▶ FILL1  ▶ FILL2  ▶ FILL3  │
└─────────────────────────────┘

When playing:
┌─────────────────────────────┐
│ ⏸ LOOP1  ▶ LOOP2  ▶ LOOP3  │
│ ▶ FILL1  ▶ FILL2  ▶ FILL3  │
└─────────────────────────────┘
```

## Integration Points

- Works with existing loop metadata loading
- Compatible with rhythm set CRUD operations
- Maintains state during table refreshes
- Consistent with song mapping preview behavior
- Supports same audio formats and playback controls
