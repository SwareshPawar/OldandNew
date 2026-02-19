# Loop Player - Integration Guide

> ⚠️ **DEPRECATION NOTICE** ⚠️
> 
> This guide is **OUTDATED** and refers to the deprecated `loop-player-ui.js` file.
> 
> **Current Implementation:** The application now uses `loop-player-pad-ui.js` (v2.0)
> with a modern pad-based interface that includes:
> - Automatic loop matching based on Taal/Time/Genre/Tempo
> - Visual pad-based controls
> - Melodic loops (atmosphere/tanpura) integration
> - Enhanced UI with collapsible sections
> 
> **Date Deprecated:** February 19, 2026
> 
> This guide is kept for reference only. The new system is automatically integrated
> and does not require manual setup steps described below.
> 
> ---

## 🎵 What's Been Built (DEPRECATED VERSION)

A complete audio loop player system with:
- **Backend**: File upload, storage, and retrieval APIs
- **Audio Engine**: Web Audio API-based playback with tempo control
- **UI**: Upload interface, pattern editor, and playback controls

## 📁 Files Created

1. **loop-player.js** - Core audio playback engine
2. **loop-player-ui.js** - UI components and integration code
3. **server.js** - Updated with upload endpoints and multer configuration
4. **uploads/loops/** - Directory for storing audio files (created automatically)

## 🚀 Integration Steps

### Step 1: Add Scripts to HTML

Add these script tags to your `index.html` (before the closing `</body>` tag):

```html
<!-- Loop Player Scripts -->
<script src="loop-player.js"></script>
<script src="loop-player-ui.js"></script>
```

### Step 2: Add Styles

The CSS is included in `loop-player-ui.js` as a string. You can either:

**Option A**: Add it dynamically (recommended)
```javascript
// In your main.js initialization, add:
document.head.insertAdjacentHTML('beforeend', window.loopPlayerFunctions.loopPlayerStyles);
```

**Option B**: Copy the CSS from `loopPlayerStyles` in loop-player-ui.js to your `styles.css` file

### Step 3: Integrate into Song Detail View

Find where you display song details in `main.js` and add the loop player HTML:

```javascript
// Example: In your renderSongDetails or similar function
function renderSongDetails(song) {
  const songDetailsHTML = `
    <div class="song-info">
      <h2>${song.title}</h2>
      <!-- ... other song details ... -->
    </div>
    
    <!-- ADD LOOP PLAYER HERE -->
    ${window.loopPlayerFunctions.getLoopPlayerHTML(song.id)}
    
    <div class="lyrics">
      <!-- ... lyrics ... -->
    </div>
  `;
  
  // Render the HTML
  document.getElementById('contentArea').innerHTML = songDetailsHTML;
  
  // Initialize the loop player
  window.loopPlayerFunctions.initializeLoopPlayer(song.id);
}

// When leaving the song detail view, cleanup:
function cleanupSongView() {
  window.loopPlayerFunctions.cleanupLoopPlayer();
}
```

### Step 4: Test the System

1. **Start the server**:
   ```bash
   npm start
   ```

2. **Navigate to a song detail view**

3. **Upload loop files**:
   - Click "Upload" for each loop type (Main, Variation 1, 2, 3, Fill-in)
   - Supported formats: MP3, WAV, M4A
   - Max file size: 10MB per file

4. **Configure the pattern**:
   - Select a loop type from the dropdown
   - Click "Add" to add it to the pattern
   - Remove items by clicking the × on pattern chips
   - Example pattern: Main → Variation1 → Variation2 → Variation3 → Fill → (repeats)

5. **Play the loops**:
   - Click "Play" to start
   - Adjust volume (0-100%)
   - Adjust tempo (50-200%)
   - Use preset tempo buttons for quick changes

## 🎮 Usage Example

1. Upload your audio files:
   - Main Loop: Your basic groove (e.g., main_beat.mp3)
   - Variation 1-3: Different variations of the groove
   - Fill-in: Transitional fill between patterns

2. Set up a pattern:
   ```
   Main → Main → Variation1 → Variation2 → Fill → Main → ...
   ```

3. Hit Play and practice along!

## 🔧 API Endpoints

### Upload Loop File
```http
POST /api/songs/:id/loops/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
- audioFile: <file>
- loopType: "main" | "variation1" | "variation2" | "variation3" | "fillin"
```

### Get Loop Data
```http
GET /api/songs/:id/loops
Authorization: Bearer <token>

Response:
{
  "loops": {
    "main": "/uploads/loops/123_main_123456.mp3",
    "variation1": "/uploads/loops/123_variation1_123456.mp3"
  },
  "pattern": ["main", "variation1", "variation2", "variation3", "fillin"],
  "enabled": true
}
```

### Update Pattern
```http
PUT /api/songs/:id/loops/config
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "pattern": ["main", "variation1", "fillin"],
  "enabled": true
}
```

### Delete Loop File
```http
DELETE /api/songs/:id/loops/:loopType
Authorization: Bearer <token>
```

## 🎨 Customization

### Change Colors
Edit the CSS in `loop-player-ui.js`:
- Primary color: `#667eea` (purple)
- Success color: `#28a745` (green)
- Danger color: `#dc3545` (red)

### Add More Loop Types
1. Update `loopTypes` array in `getLoopPlayerHTML()`
2. Update validation in backend (server.js)

### Modify Default Pattern
Change in `initializeLoopPlayer()`:
```javascript
currentLoopPlayer.setPattern(['main', 'main', 'fill']); // Custom default
```

## 🐛 Troubleshooting

### "Loop player not initialized"
- Make sure `initializeLoopPlayer(songId)` is called after rendering the HTML
- Check browser console for errors
- Ensure audio files are accessible (check Network tab)

### "Failed to load loop"
- Verify file format (MP3, WAV, M4A)
- Check file permissions in uploads/loops directory
- Ensure server is serving static files correctly

### No sound playing
- Check browser audio permissions
- Verify volume slider is not at 0
- Check if audio context is suspended (some browsers require user interaction)
- Open browser console to see Web Audio API errors

### Tempo not working
- Web Audio API playback rate range: 0.5 to 2.0
- Some browsers have limitations on playback rate

## 📊 database Schema

Loop data is stored in the song document:

```javascript
{
  id: 123,
  title: "Song Title",
  // ... other song fields ...
  loopPlayer: {
    loops: {
      main: "/uploads/loops/123_main_1234567890.mp3",
      variation1: "/uploads/loops/123_variation1_1234567890.mp3",
      variation2: "/uploads/loops/123_variation2_1234567890.mp3",
      variation3: "/uploads/loops/123_variation3_1234567890.mp3",
      fillin: "/uploads/loops/123_fillin_1234567890.mp3"
    },
    pattern: ["main", "variation1", "variation2", "variation3", "fillin"],
    enabled: true
  }
}
```

## 🚀 Future Enhancements

Possible additions:
- [ ] Visual waveform display
- [ ] Beat/measure indicators
- [ ] Loop length detection and auto-sync
- [ ] Multiple pattern presets
- [ ] Export/import loop configurations
- [ ] Keyboard shortcuts for playback control
- [ ] Metronome overlay
- [ ] Recording capability

## 📝 Notes

- Audio files are stored in `uploads/loops/` directory
- Files are named: `{songId}_{loopType}_{timestamp}.{ext}`
- Old files are automatically deleted when new ones are uploaded
- Loop player uses Web Audio API (modern browsers only)
- Mobile support depends on browser audio capabilities

## ✅ Testing Checklist

- [ ] Upload audio files for all loop types
- [ ] Configure a custom pattern
- [ ] Play/pause works correctly
- [ ] Volume control adjusts audio level
- [ ] Tempo control changes playback speed
- [ ] Pattern loops continuously
- [ ] "Now Playing" shows current loop
- [ ] Delete loop files works
- [ ] Pattern persists after page reload
- [ ] Multiple songs have independent loop configurations

---

**Need help?** Check the browser console for detailed error messages or refer to the inline comments in the code.
