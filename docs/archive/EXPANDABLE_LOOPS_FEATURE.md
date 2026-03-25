# Loop & Rhythm Manager - Expandable Rows with Individual Loop Management

## New Features Added

### ✅ Expandable Table Rows
- Click on any rhythm set row to expand/collapse
- Shows all 6 loop slots (3 loops + 3 fills) when expanded
- Visual chevron icon indicates expand/collapse state

### ✅ Individual Loop Management
- **Play Button** - Play each loop directly from the table
- **Upload Button** - Upload individual loops to specific slots
- **Replace Button** - Replace existing loops with new files
- **Visual Status** - Green badge for available loops, red for missing

### ✅ Improved Upload Workflow
- Upload loops one-by-one to specific slots
- Or use bulk upload section (6 files at once)
- Clear visual feedback for each slot
- No more confusion about which loop goes where

---

## How It Works

### 1. Expandable Rows

**Visual Appearance:**
```
┌─────────────────────────────────────────────────────┐
│ ▶ keherwa_1  │ keherwa │ 1 │ 6/6 │ Active │ [Actions]│ ← Click to expand
├─────────────────────────────────────────────────────┤
│ ▼ keherwa_2  │ keherwa │ 2 │ 4/6 │ Active │ [Actions]│ ← Expanded
│   ┌──────────────────────────────────────────────┐  │
│   │ LOOP 1 ✓   [▶ Play] [⬆ Replace]             │  │
│   │ LOOP 2 ✓   [▶ Play] [⬆ Replace]             │  │
│   │ LOOP 3 ✗   [⬆ Upload]                        │  │
│   │ FILL 1 ✓   [▶ Play] [⬆ Replace]             │  │
│   │ FILL 2 ✓   [▶ Play] [⬆ Replace]             │  │
│   │ FILL 3 ✗   [⬆ Upload]                        │  │
│   └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**CSS Implementation:**
- `.rhythm-set-row` - Main clickable row
- `.loop-details-row` - Hidden expandable section
- `.show` class - Displays the details
- `.expand-icon` - Rotates 90° when expanded

### 2. Loop Slot Display

Each slot shows:
- **Icon** - 🎵 for loops, 🥁 for fills
- **Name** - LOOP 1, LOOP 2, FILL 1, etc.
- **Status Badge** - ✓ (green) or Empty (red)
- **Action Buttons** - Play/Upload/Replace
- **Status Info** - "Loop available" or "No loop uploaded"

**Color Coding:**
- Green border = Loop exists
- Red dashed border = Loop missing
- Green badge = Has file
- Red badge = Empty slot

### 3. Individual Loop Upload

**Process:**
1. Click "Upload" or "Replace" button on any slot
2. File picker opens (only .mp3 files)
3. Select MP3 file
4. Automatic upload to correct slot
5. Table refreshes to show updated status

**JavaScript Implementation:**
```javascript
async function uploadSingleLoop(rhythmSetId, loopType) {
    // Creates hidden file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.mp3';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        
        // Validate MP3
        if (!file.name.endsWith('.mp3')) {
            showAlert('Please select MP3 file', 'error');
            return;
        }
        
        // Upload to specific slot
        const formData = new FormData();
        formData.append('loopFile', file);
        formData.append('rhythmSetId', rhythmSetId);
        formData.append('type', loopType.includes('loop') ? 'loop' : 'fill');
        formData.append('number', parseInt(loopType.match(/\d+/)[0]));
        
        await authFetch('/api/loops/upload', {
            method: 'POST',
            body: formData
        });
        
        // Refresh table
        await loadRhythmSets();
    };
    
    input.click();
}
```

### 4. Loop Playback

**Process:**
1. Click "Play" button on any loop with file
2. MP3 loads from `/loops/rhythmSetId/loopType.mp3`
3. Plays through hidden HTML5 audio player
4. Success/error alert shown

**JavaScript Implementation:**
```javascript
async function playLoop(rhythmSetId, loopType) {
    const loopUrl = `/loops/${rhythmSetId}/${loopType}.mp3`;
    const player = document.getElementById('loopPlayer');
    
    player.src = loopUrl;
    await player.play();
    showAlert(`Playing ${loopType}...`, 'success');
}
```

**HTML Audio Player:**
```html
<audio id="loopPlayer" style="display: none;"></audio>
```

---

## UI Structure

### Table Layout

```html
<table>
    <thead>
        <tr>
            <th>▶</th>        <!-- Expand icon -->
            <th>Rhythm Set ID</th>
            <th>Family</th>
            <th>Set #</th>
            <th>Loops</th>
            <th>Status</th>
            <th>Actions</th>
        </tr>
    </thead>
    <tbody>
        <!-- Main Row -->
        <tr class="rhythm-set-row" onclick="toggleExpandRow(0)">
            <td><i class="fas fa-chevron-right expand-icon"></i></td>
            <td><strong>keherwa_1</strong></td>
            <td>keherwa</td>
            <td>1</td>
            <td><span class="badge badge-success">6/6</span></td>
            <td><span class="badge badge-success">Active</span></td>
            <td>
                <button onclick="selectForUpload()">Upload</button>
                <button onclick="deleteRhythmSet()">Delete</button>
            </td>
        </tr>
        
        <!-- Details Row (Expandable) -->
        <tr class="loop-details-row">
            <td colspan="7" class="loop-details-cell">
                <div class="loop-grid">
                    <!-- 6 loop slots rendered here -->
                </div>
            </td>
        </tr>
    </tbody>
</table>
```

### Loop Slot Structure

```html
<div class="loop-slot has-loop">
    <div class="loop-slot-header">
        <span class="loop-slot-title">
            <i class="fas fa-music"></i> LOOP 1
        </span>
        <span class="badge badge-success">✓</span>
    </div>
    <div class="loop-slot-actions">
        <button class="btn btn-primary btn-mini" onclick="playLoop('keherwa_1', 'loop1')">
            <i class="fas fa-play"></i> Play
        </button>
        <button class="btn btn-success btn-mini" onclick="uploadSingleLoop('keherwa_1', 'loop1')">
            <i class="fas fa-upload"></i> Replace
        </button>
    </div>
    <div class="loop-slot-info">
        <i class="fas fa-check-circle" style="color: #27ae60;"></i> Loop available
    </div>
</div>
```

---

## User Workflows

### Workflow 1: Upload Missing Loop

```
1. Find rhythm set in table (e.g., keherwa_2 with 4/6 loops)
2. Click on the row to expand
3. See which loops are missing (red "Empty" badges)
4. Click "Upload" on missing slot (e.g., Loop 3)
5. Select MP3 file from computer
6. File uploads automatically
7. Table refreshes, now shows 5/6 loops
8. Loop slot turns green with ✓ badge
```

### Workflow 2: Replace Existing Loop

```
1. Click on rhythm set row to expand
2. Find loop to replace (green slot with ✓)
3. Click "Replace" button
4. Select new MP3 file
5. Old loop replaced with new file
6. Table refreshes with updated loop
```

### Workflow 3: Preview Loops Before Replacing

```
1. Expand rhythm set row
2. Click "Play" on any available loop
3. Listen to current loop
4. Decide if replacement needed
5. Click "Replace" if desired
6. Or leave as-is and close row
```

### Workflow 4: Bulk Upload (New Rhythm Set)

```
1. Create rhythm set (e.g., dadra_3)
2. Shows 0/6 loops in table
3. Click "Upload" button in Actions column
4. Scrolls to upload section
5. Select rhythm set (radio button)
6. Upload all 6 files using grid
7. Click "Upload All Loops"
8. Table updates to 6/6 loops
```

---

## CSS Styling

### Expandable Row Styles

```css
.rhythm-set-row {
    cursor: pointer;
    transition: background-color 0.2s;
}

.rhythm-set-row:hover {
    background-color: #3a3a5a !important;
}

.rhythm-set-row.expanded {
    background-color: #3a3a5a !important;
}

.loop-details-row {
    display: none;
    background-color: #1a1a1a;
}

.loop-details-row.show {
    display: table-row;
}
```

### Loop Slot Styles

```css
.loop-slot {
    background-color: #2c2c2c;
    border: 2px solid #444;
    border-radius: 8px;
    padding: 15px;
    transition: all 0.3s;
}

.loop-slot.has-loop {
    border-color: #27ae60;  /* Green */
}

.loop-slot.empty {
    border-color: #e74c3c;  /* Red */
    border-style: dashed;
}
```

### Expand Icon Animation

```css
.expand-icon {
    transition: transform 0.3s;
    display: inline-block;
}

.expand-icon.expanded {
    transform: rotate(90deg);
}
```

---

## Benefits

### For Users

1. **Visual Clarity**
   - See all loops at a glance
   - Color-coded status (green/red)
   - No guessing which loops exist

2. **Flexibility**
   - Upload one loop at a time
   - Or bulk upload all 6
   - Replace individual loops without affecting others

3. **Preview Before Replace**
   - Play loop to hear current version
   - Decide if replacement needed
   - No accidental overwrites

4. **Better Organization**
   - Expandable rows keep table clean
   - Only show details when needed
   - Easy to scan many rhythm sets

### For Workflow

1. **Faster Updates**
   - Click → Upload → Done
   - No need to navigate away
   - Immediate visual feedback

2. **Precise Control**
   - Upload to exact slot
   - No auto-detection confusion
   - No duplicate loop1 bug

3. **Easier Troubleshooting**
   - See missing loops immediately
   - Red badges highlight problems
   - Fix specific slots easily

---

## Technical Details

### State Management

```javascript
let rhythmSets = [];           // All rhythm sets from API
let selectedRhythmSet = null;  // Currently selected for bulk upload
let expandedRows = new Set();  // Track which rows are expanded (future)
```

### Key Functions

| Function | Purpose |
|----------|---------|
| `renderRhythmSetsTable()` | Renders main + detail rows |
| `renderLoopSlots(set)` | Generates HTML for 6 slots |
| `toggleExpandRow(index)` | Expands/collapses row |
| `playLoop(id, type)` | Plays MP3 file |
| `uploadSingleLoop(id, type)` | Uploads to specific slot |
| `selectForUpload(id)` | Selects for bulk upload |

### API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/rhythm-sets` | GET | Load all rhythm sets |
| `/api/loops/upload` | POST | Upload loop file |
| `/loops/{id}/{type}.mp3` | GET | Stream MP3 file |

---

## Examples

### Example 1: Complete Empty Rhythm Set

**Initial State:**
```
dadra_1 (0/6 loops) - all slots empty
```

**Process:**
1. Click row to expand
2. See 6 empty slots (red dashed borders)
3. Click "Upload" on Loop 1 → select file
4. Click "Upload" on Loop 2 → select file
5. Click "Upload" on Loop 3 → select file
6. Click "Upload" on Fill 1 → select file
7. Click "Upload" on Fill 2 → select file
8. Click "Upload" on Fill 3 → select file

**Final State:**
```
dadra_1 (6/6 loops) - all slots green ✓
```

### Example 2: Replace One Bad Loop

**Scenario:** Loop 2 has wrong tempo

**Process:**
1. Click keherwa_1 row to expand
2. Click "Play" on Loop 2 → verify wrong tempo
3. Click "Replace" on Loop 2
4. Select correct MP3 file
5. File uploads automatically
6. Click "Play" again → verify correct tempo

**Result:** Only Loop 2 changed, others untouched

### Example 3: Check All Loops Before Performance

**Process:**
1. Expand keherwa_1 row
2. Click "Play" on Loop 1 → sounds good ✓
3. Click "Play" on Loop 2 → sounds good ✓
4. Click "Play" on Loop 3 → sounds good ✓
5. Click "Play" on Fill 1 → sounds good ✓
6. Click "Play" on Fill 2 → sounds good ✓
7. Click "Play" on Fill 3 → sounds good ✓
8. Collapse row → ready for performance!

---

## Migration Notes

### What Changed

**Old System:**
- Radio button to select rhythm set
- "Preview" button showed alert with file list
- Had to use bulk upload section for all changes
- No way to play loops individually

**New System:**
- Click row to expand/collapse
- Individual slots with Play/Upload buttons
- Can upload/replace one loop at a time
- Audio player for instant playback

### Backward Compatibility

- ✅ Bulk upload section still works
- ✅ Create rhythm set still works
- ✅ Delete rhythm set still works
- ✅ All existing features preserved
- ✅ Added new features on top

---

## Future Enhancements

Possible additions:
- [ ] Volume control for loop playback
- [ ] Loop while playing (continuous)
- [ ] Download loop file button
- [ ] Waveform visualization
- [ ] BPM detection
- [ ] Bulk replace (replace all loops at once)
- [ ] Drag-and-drop to slots
- [ ] Keyboard shortcuts (Space = play/pause)

---

## Testing Checklist

- [ ] Click row to expand → details show
- [ ] Click again to collapse → details hide
- [ ] Chevron icon rotates correctly
- [ ] Play button works for existing loops
- [ ] Upload button opens file picker
- [ ] Replace button overwrites existing loop
- [ ] Upload to empty slot adds new loop
- [ ] Table refreshes after upload
- [ ] Loop count updates (e.g., 4/6 → 5/6)
- [ ] Green/red borders display correctly
- [ ] Status badges show correct state
- [ ] Multiple rows can be expanded simultaneously
- [ ] Audio plays correctly
- [ ] File validation works (only MP3)

---

## Summary

The new expandable rows feature provides:
✅ **Visual clarity** - See all loops at a glance
✅ **Individual control** - Upload/replace one loop at a time
✅ **Audio preview** - Play loops before replacing
✅ **Better UX** - Clean, organized interface
✅ **Flexibility** - Both bulk and individual uploads
✅ **No confusion** - Clear which slot is which

This solves your requirements:
- ✅ "Upload loop correctly" - Individual slot selection
- ✅ "Separately upload the loops" - One-by-one upload
- ✅ "Let user play the loops available" - Play button per loop
- ✅ "Click on row to expand" - Expandable table rows
- ✅ "Play, replace, or upload as needed" - All actions available

Ready to use! 🎉
