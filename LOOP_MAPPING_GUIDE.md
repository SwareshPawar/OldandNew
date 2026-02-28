# Loop Mapping Guide

## Overview
This guide explains how to correctly map rhythm loop files to songs in the Old and New Music Application. Understanding this mapping is crucial for loops to play correctly with your songs.

---

## How Loop Mapping Works

### The Mapping Formula

Loop files MUST follow this exact naming pattern:

```
{taal}_{timeSignature}_{tempo}_{genre}_{type}.wav
```

Where:
- `{taal}` = Rhythmic pattern (keherwa, dadra, rupak, etc.)
- `{timeSignature}` = Time signature with `/` replaced by `_` (e.g., `4/4` → `4_4`)
- `{tempo}` = Speed (slow, medium, fast)
- `{genre}` = Instrument type (dholak, tabla, pakhawaj, etc.)
- `{type}` = Loop type (LOOP1, LOOP2, LOOP3, FILL1, FILL2, FILL3)

### Example

**Song Metadata:**
```json
{
  "title": "Tere Bina",
  "taal": "keherwa",
  "timeSignature": "4/4",
  "tempo": "medium",
  "genre": "dholak"
}
```

**Required Loop Files:**
```
keherwa_4_4_medium_dholak_LOOP1.wav
keherwa_4_4_medium_dholak_LOOP2.wav
keherwa_4_4_medium_dholak_LOOP3.wav
keherwa_4_4_medium_dholak_FILL1.wav
keherwa_4_4_medium_dholak_FILL2.wav
keherwa_4_4_medium_dholak_FILL3.wav
```

---

## Required vs Optional Fields

### ✅ REQUIRED Fields (Must Match Exactly)

All four metadata fields MUST match between song and loop filename:

| Field | Song Value | Loop Filename Part | Example |
|-------|------------|-------------------|---------|
| **Taal** | `keherwa` | `keherwa_...` | `keherwa_4_4_medium_dholak_LOOP1.wav` |
| **Time Signature** | `4/4` | `_4_4_...` | `keherwa_4_4_medium_dholak_LOOP1.wav` |
| **Tempo** | `medium` | `_medium_...` | `keherwa_4_4_medium_dholak_LOOP1.wav` |
| **Genre** | `dholak` | `_dholak_...` | `keherwa_4_4_medium_dholak_LOOP1.wav` |

**⚠️ If ANY field mismatches, loops will NOT load!**

### ⚠️ OPTIONAL Loop Files (Individual Pads)

You need at least ONE loop file, but all 6 are recommended:

| File Type | Required? | What Happens If Missing |
|-----------|-----------|------------------------|
| `LOOP1.wav` | ✅ Highly recommended | Pad 1 disabled |
| `LOOP2.wav` | ⚠️ Optional | Pad 2 disabled |
| `LOOP3.wav` | ⚠️ Optional | Pad 3 disabled |
| `FILL1.wav` | ⚠️ Optional | Fill pad 1 disabled |
| `FILL2.wav` | ⚠️ Optional | Fill pad 2 disabled |
| `FILL3.wav` | ⚠️ Optional | Fill pad 3 disabled |

---

## Valid Values for Each Field

### 1. Taal (Rhythmic Pattern)
Valid values:
- `keherwa`
- `dadra`
- `rupak`
- `jhaptal`
- `ektaal`
- `teentaal`

**Case Sensitive:** Must be lowercase

### 2. Time Signature
Valid values:
- `3/4` → becomes `3_4` in filename
- `4/4` → becomes `4_4` in filename
- `6/8` → becomes `6_8` in filename
- `7/8` → becomes `7_8` in filename

**Important:** The `/` character is automatically replaced with `_` in filenames

### 3. Tempo
Valid values:
- `slow`
- `medium`
- `fast`

**Case Sensitive:** Must be lowercase

### 4. Genre (Instrument)
Common values:
- `dholak`
- `tabla`
- `pakhawaj`
- `drum`
- `percussion`

**Case Sensitive:** Must be lowercase
**Note:** Can be any string, but must match exactly between song and loop filename

---

## Step-by-Step Mapping Process

### Step 1: Create Your Song in Database

Add song with metadata:
```json
{
  "title": "My New Song",
  "taal": "dadra",
  "timeSignature": "3/4",
  "tempo": "slow",
  "genre": "tabla"
}
```

### Step 2: Name Your Loop Files Correctly

Based on the song metadata above, name your 6 loop files:

```
dadra_3_4_slow_tabla_LOOP1.wav
dadra_3_4_slow_tabla_LOOP2.wav
dadra_3_4_slow_tabla_LOOP3.wav
dadra_3_4_slow_tabla_FILL1.wav
dadra_3_4_slow_tabla_FILL2.wav
dadra_3_4_slow_tabla_FILL3.wav
```

### Step 3: Upload to Server

Place files in the `loops` directory on your server.

### Step 4: Verify Mapping

When you select the song:
- Server constructs URLs based on song metadata
- Checks if files exist with matching names
- Loads only the files that match

---

## Common Mistakes and Solutions

### ❌ Mistake 1: Taal Mismatch
**Problem:**
```javascript
Song:      { taal: "keherwa" }
Loop File: dadra_4_4_medium_dholak_LOOP1.wav
```
**Error:** No loops will load
**Solution:** Rename file to `keherwa_4_4_medium_dholak_LOOP1.wav`

---

### ❌ Mistake 2: Wrong Time Signature Format
**Problem:**
```javascript
Song:      { timeSignature: "4/4" }
Loop File: keherwa_4-4_medium_dholak_LOOP1.wav  // Wrong: 4-4
```
**Error:** No loops will load
**Solution:** Use underscore: `keherwa_4_4_medium_dholak_LOOP1.wav`

---

### ❌ Mistake 3: Tempo Typo
**Problem:**
```javascript
Song:      { tempo: "medium" }
Loop File: keherwa_4_4_meduim_dholak_LOOP1.wav  // Typo: meduim
```
**Error:** No loops will load
**Solution:** Fix spelling: `keherwa_4_4_medium_dholak_LOOP1.wav`

---

### ❌ Mistake 4: Wrong Case
**Problem:**
```javascript
Song:      { genre: "dholak" }
Loop File: keherwa_4_4_medium_Dholak_LOOP1.wav  // Capital D
```
**Error:** No loops will load
**Solution:** Use lowercase: `keherwa_4_4_medium_dholak_LOOP1.wav`

---

### ❌ Mistake 5: Extra Spaces
**Problem:**
```javascript
Loop File: keherwa_4_4_medium _dholak_LOOP1.wav  // Space before _dholak
```
**Error:** No loops will load
**Solution:** Remove spaces: `keherwa_4_4_medium_dholak_LOOP1.wav`

---

### ❌ Mistake 6: Missing Underscores
**Problem:**
```javascript
Loop File: keherwa44mediumdholak_LOOP1.wav  // Missing underscores
```
**Error:** No loops will load
**Solution:** Add underscores: `keherwa_4_4_medium_dholak_LOOP1.wav`

---

## Verification Checklist

Before uploading loop files, verify:

- [ ] Taal matches exactly (lowercase)
- [ ] Time signature uses `_` not `/`
- [ ] Tempo matches exactly (lowercase)
- [ ] Genre matches exactly (lowercase, no spaces)
- [ ] All underscores are present
- [ ] No extra spaces in filename
- [ ] File extension is `.wav` (lowercase)
- [ ] At least LOOP1 file exists
- [ ] Files are in `loops` directory

---

## Testing Your Mapping

### Method 1: Check Server Logs
When you select a song, check server console for:
```
🔊 Loading loops from: 
{
  loop1: 'http://localhost:3001/loops/keherwa_4_4_medium_dholak_LOOP1.wav',
  ...
}
```

### Method 2: Check Browser Console
Open DevTools Console and look for:
```
✅ Loops already loaded for this song
Successfully fetched 6 loop files
```

### Method 3: Direct URL Test
Open browser and navigate to:
```
http://your-domain.com/loops/keherwa_4_4_medium_dholak_LOOP1.wav
```

**Expected:**
- ✅ File downloads/plays → Mapping correct!
- ❌ 404 error → Filename doesn't match

---

## Quick Reference Table

| Song Metadata | Loop Filename Pattern |
|---------------|----------------------|
| `taal: "keherwa"` | `keherwa_...` |
| `timeSignature: "4/4"` | `_4_4_...` |
| `tempo: "medium"` | `_medium_...` |
| `genre: "dholak"` | `_dholak_...` |
| N/A | `_LOOP1.wav` (or LOOP2, LOOP3, FILL1, FILL2, FILL3) |

---

## Example Mappings

### Example 1: Keherwa 4/4 Medium Dholak
**Song:**
```json
{
  "taal": "keherwa",
  "timeSignature": "4/4",
  "tempo": "medium",
  "genre": "dholak"
}
```

**Loop Files:**
```
keherwa_4_4_medium_dholak_LOOP1.wav
keherwa_4_4_medium_dholak_LOOP2.wav
keherwa_4_4_medium_dholak_LOOP3.wav
keherwa_4_4_medium_dholak_FILL1.wav
keherwa_4_4_medium_dholak_FILL2.wav
keherwa_4_4_medium_dholak_FILL3.wav
```

---

### Example 2: Dadra 3/4 Slow Tabla
**Song:**
```json
{
  "taal": "dadra",
  "timeSignature": "3/4",
  "tempo": "slow",
  "genre": "tabla"
}
```

**Loop Files:**
```
dadra_3_4_slow_tabla_LOOP1.wav
dadra_3_4_slow_tabla_LOOP2.wav
dadra_3_4_slow_tabla_LOOP3.wav
dadra_3_4_slow_tabla_FILL1.wav
dadra_3_4_slow_tabla_FILL2.wav
dadra_3_4_slow_tabla_FILL3.wav
```

---

### Example 3: Teentaal 4/4 Fast Pakhawaj
**Song:**
```json
{
  "taal": "teentaal",
  "timeSignature": "4/4",
  "tempo": "fast",
  "genre": "pakhawaj"
}
```

**Loop Files:**
```
teentaal_4_4_fast_pakhawaj_LOOP1.wav
teentaal_4_4_fast_pakhawaj_LOOP2.wav
teentaal_4_4_fast_pakhawaj_LOOP3.wav
teentaal_4_4_fast_pakhawaj_FILL1.wav
teentaal_4_4_fast_pakhawaj_FILL2.wav
teentaal_4_4_fast_pakhawaj_FILL3.wav
```

---

## File Upload via Admin Interface

If using the Loop Manager web interface:

1. Navigate to `loop-manager.html`
2. Select **Taal**: `keherwa` (must match song)
3. Select **Time Signature**: `4/4` (must match song)
4. Select **Tempo**: `medium` (must match song)
5. Enter **Genre**: `dholak` (must match song)
6. Select **Loop Type**: `LOOP1` (then LOOP2, LOOP3, etc.)
7. Choose file and click "Upload Loop"

The system will automatically generate the correct filename!

---

## Troubleshooting

### Problem: "No loops loaded"
**Causes:**
1. Song metadata doesn't match loop filenames
2. Loop files not in `loops` directory
3. File permissions issue on server

**Solution:**
1. Verify all 4 metadata fields match exactly
2. Check file exists: `ls /loops/ | grep keherwa`
3. Check file permissions: `chmod 644 /loops/*.wav`

---

### Problem: "Some pads disabled"
**Causes:**
1. Only some loop files exist (e.g., only LOOP1 and LOOP2)

**Solution:**
1. Upload missing files (LOOP3, FILL1-3)
2. Or accept that only available pads will work

---

### Problem: "404 Not Found"
**Causes:**
1. Filename typo
2. File not deployed to production
3. Vercel routing issue (for production)

**Solution:**
1. Check exact filename matches song metadata
2. Verify file exists on server
3. Check `vercel.json` has loops directory excluded from rewrites

---

## Best Practices

### 1. Use Consistent Naming
- Always lowercase
- Always use underscores
- No spaces

### 2. Upload Complete Sets
- Upload all 6 files (LOOP1-3, FILL1-3) for best experience
- Minimum: LOOP1 for basic functionality

### 3. Test Before Deploying
- Test locally first with `node server.js`
- Verify all pads work
- Then deploy to production

### 4. Document Your Loops
Keep a spreadsheet of your loop mappings:

| Song Title | Taal | Time | Tempo | Genre | Files Uploaded |
|------------|------|------|-------|-------|----------------|
| Tere Bina | keherwa | 4/4 | medium | dholak | ✅ All 6 |
| Piya Re | dadra | 3/4 | slow | tabla | ✅ All 6 |

---

## Summary

**Remember: ALL 4 metadata fields must match EXACTLY**

```
Song Metadata → Loop Filename
-----------     -------------
taal           → {taal}_
timeSignature  → {time}_     (with / → _)
tempo          → {tempo}_
genre          → {genre}_
               → {LOOP1-3 or FILL1-3}.wav
```

**The formula is simple but strict - every character must match!**

---

## Need Help?

If loops still won't load:
1. Check browser console (F12)
2. Check server logs
3. Verify filename matches song metadata character-by-character
4. Test direct file URL in browser

For technical issues, check:
- `CODE_DOCUMENTATION.md` - Technical implementation details
- `server.js` - Loop URL construction logic
- `loop-player-pad.js` - Loop loading logic
