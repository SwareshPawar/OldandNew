# Mobile Atmosphere Pad Debugging Guide

## Issue Summary
- **Problem**: Atmosphere pads play correctly on desktop but not on mobile (production)
- **Working**: Tanpura pads work on both desktop and mobile
- **Key Tested**: G key specifically mentioned, but likely affects all keys
- **File Format**: Both atmosphere and tanpura are WAV files (903KB and 946KB respectively)

## Technical Analysis

### Code Review Results
1. ✅ **API URL Construction**: Uses `window.location.origin` for production (no localhost hardcoding)
2. ✅ **File Serving**: Server serves `/loops` directory statically via `express.static`
3. ✅ **CORS**: Properly configured with `.vercel.app` allowed
4. ✅ **Playback Logic**: Identical code path for both atmosphere and tanpura pads
5. ✅ **Audio Decoding**: Uses same `decodeAudioData()` method for both file types

### Mobile-Specific Checks Needed

#### 1. Browser Console Inspection
On your mobile device, access browser console (use Remote Debugging):

**For iOS Safari:**
- Connect iPhone to Mac
- Safari > Develop > [Your iPhone] > [Production URL]

**For Android Chrome:**
- Enable USB Debugging on phone
- Chrome desktop > `chrome://inspect` > Inspect device

**What to Look For:**
```javascript
// Check these console messages:
- "Loading melodic samples for key: G, types: atmosphere"
- "Found melodic sample: atmosphere_G.wav"
- "Fetched melodic sample: atmosphere_G, size: 903.00 KB"
- "Decoded melodic sample: atmosphere_G, duration: X.XXs"
- "Started atmosphere pad (key: G)"

// Look for errors:
- Failed to fetch
- decodeAudioData errors
- CORS errors
- Network timeout
```

#### 2. Network Tab Inspection
Check the actual HTTP requests:

**Expected Request:**
```
URL: https://[your-domain]/loops/melodies/atmosphere/atmosphere_G%23.wav
Method: HEAD (for checking availability)
Then: GET (for downloading)
Status: 200 OK
Size: ~903 KB
```

**Potential Issues:**
- ❌ 404 Not Found → File not deployed to production
- ❌ 500 Server Error → Server-side issue
- ❌ Request cancelled → Timeout or mobile browser killed the request
- ❌ Wrong URL → Check if it's using localhost instead of production domain

#### 3. AudioContext State
Add this debug code temporarily to `loop-player-pad.js` line ~795:

```javascript
async _startMelodicPad(padType) {
    // DEBUG: Log AudioContext state
    console.log(`🔍 AudioContext state: ${this.audioContext ? this.audioContext.state : 'not initialized'}`);
    
    await this._initializeSilent();
    
    // DEBUG: Check if context resumed
    console.log(`🔍 After init, AudioContext state: ${this.audioContext.state}`);
    
    this._restoreVolumeFromSilent();
    
    await this.loadMelodicSamples(false, [padType]);
    
    const effectiveKey = this._getEffectiveKey();
    const sampleName = `${padType}_${effectiveKey}`;
    const buffer = this.audioBuffers.get(sampleName);
    
    // DEBUG: Check buffer exists
    console.log(`🔍 Buffer for ${sampleName}:`, buffer ? `${buffer.duration}s` : 'NULL');
    
    if (!buffer) {
        console.warn(`Melodic sample ${sampleName} not found`);
        // ... rest of code
```

#### 4. File Deployment Verification
Verify the atmosphere files are actually deployed to production:

**Test URL directly in mobile browser:**
```
https://[your-domain]/loops/melodies/atmosphere/atmosphere_G.wav
```

If this returns 404, the files aren't deployed. Likely causes:
- Files not committed to git
- `.gitignore` excluding WAV files
- Vercel build not including loops directory
- Files only exist locally

#### 5. Mobile Browser Limitations

**iOS Safari specific issues:**
- May have stricter memory limits for audio decoding
- Requires user gesture before AudioContext starts (we handle this)
- May throttle large file downloads in background

**Android Chrome specific issues:**
- May have different WAV codec support
- Could throttle network requests for large files

## Quick Tests to Run

### Test 1: Direct File Access
On mobile browser, navigate to:
```
https://[your-production-url]/loops/melodies/atmosphere/atmosphere_G.wav
```
**Expected**: File downloads or plays
**If 404**: Files not deployed (see deployment section below)

### Test 2: Check Tanpura Files
Compare tanpura behavior:
```
https://[your-production-url]/loops/melodies/tanpura/tanpura_G.wav
```
**If this works but atmosphere doesn't**: Deployment issue (atmosphere files missing)

### Test 3: Keyboard Shortcut for Console on Mobile
- iOS: Settings > Safari > Advanced > Web Inspector
- Android: Menu > More Tools > Remote Devices

## Likely Root Causes (Prioritized)

### 1. ⭐ FILES NOT DEPLOYED (MOST LIKELY)
**Symptoms:** Direct URL returns 404
**Cause:** Atmosphere files only uploaded locally, not committed to git
**Solution:** 
```bash
git add loops/melodies/atmosphere/
git commit -m "Add all 12 atmosphere melodic files"
git push
```

### 2. Mobile AudioContext Not Resuming
**Symptoms:** AudioContext state = 'suspended'
**Cause:** Mobile browser auto-suspends AudioContext
**Solution:** Already handled in code via `audioContext.resume()`

### 3. WAV Decoding Fails on Mobile
**Symptoms:** decodeAudioData throws error
**Cause:** Specific WAV codec not supported on mobile
**Solution:** Convert to MP3 or use different WAV encoding

### 4. Network Timeout
**Symptoms:** Request starts but gets cancelled
**Cause:** 900KB file too large for mobile network
**Solution:** Compress files or improve network handling

### 5. CORS Issue
**Symptoms:** "CORS policy" error in console
**Cause:** Server not returning proper headers
**Solution:** Already configured in server.js, unlikely cause

## Deployment Checklist

If files aren't deployed to production:

```bash
# 1. Check .gitignore
cat .gitignore | grep -i wav
# If WAV files are ignored, remove that line

# 2. Check if files are staged
git status

# 3. Add atmosphere files
git add loops/melodies/atmosphere/

# 4. Commit
git commit -m "Add all 12 chromatic atmosphere melodic pad files"

# 5. Push to production
git push origin main  # or your production branch

# 6. Verify deployment on Vercel
# Check Vercel dashboard for successful build
```

## Vercel-Specific Considerations

### Check vercel.json Configuration
The `vercel.json` should include:
```json
{
  "functions": {
    "server.js": {
      "includeFiles": "loops/**"
    }
  }
}
```

### Check Build Output
- Vercel may not include large files by default
- Check build logs for file size warnings
- Verify `loops` directory is in the deployment

## Testing After Deployment

1. Clear mobile browser cache completely
2. Force refresh (if available on mobile)
3. Test direct file URL first
4. Then test via app interface
5. Check browser console for any new errors

## Next Steps

1. **Immediate**: Check if direct file URL works on mobile (Test 1)
2. **If 404**: Deploy files to production (Deployment Checklist)
3. **If 200 but still no playback**: Check browser console (Console Inspection)
4. **If decoding errors**: Consider converting to MP3
5. **If timeout**: Optimize file size

## File Format Comparison

| Metric | Atmosphere (WAV) | Tanpura (WAV) |
|--------|------------------|---------------|
| Size | ~903 KB | ~946 KB |
| Format | WAV | WAV |
| Desktop | ✅ Works | ✅ Works |
| Mobile | ❌ Fails | ✅ Works |

**Hypothesis**: Since both are WAV and similar size, issue is likely:
- File deployment (atmosphere not on production server)
- Or mobile browser cache issue (tanpura cached, atmosphere not)

## Resolution Path

Most likely scenario: The atmosphere files were uploaded locally via the server (POST to `/api/melodic-loops/:type/:key`) but never committed to git. When you access production on mobile, it's pulling from Vercel deployment which doesn't have these files. Desktop works because you're testing on `localhost:3001` which has the files.

**Solution**: Commit and push the atmosphere files to git, then redeploy to Vercel.
