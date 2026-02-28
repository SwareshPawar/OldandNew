# Vercel Routing Fix for Melodic Loops

## Problem
Atmosphere pads worked on desktop (`localhost:3001`) but not on mobile production (Vercel).

## Root Cause
The `vercel.json` configuration had a catch-all rewrite rule:
```json
{
  "source": "/(.*)",
  "destination": "/index.html"
}
```

This was intercepting ALL requests, including `/loops/melodies/atmosphere/atmosphere_G.wav`, and routing them to `index.html` instead of serving the actual WAV files.

## Why Desktop Worked
When testing on `localhost:3001`, requests go directly to the Node.js Express server which has:
```javascript
app.use('/loops', express.static(loopsDir));
```
This correctly serves static files from the `loops/` directory.

## Why Production Failed
On Vercel (production), the `vercel.json` rewrites take precedence. The catch-all rule was routing:
- `/loops/melodies/tanpura/tanpura_G.wav` → `index.html` ❌
- `/loops/melodies/atmosphere/atmosphere_G.wav` → `index.html` ❌

However, tanpura might have been cached on desktop from previous tests, which is why it appeared to work.

## Solution
Updated `vercel.json` with two fixes:

### 1. Exclude `/loops/` from Catch-All Rewrite
Changed:
```json
{
  "source": "/(.*)",
  "destination": "/index.html"
}
```

To:
```json
{
  "source": "/((?!loops/).*)",
  "destination": "/index.html"
}
```

The regex `((?!loops/).*)` uses a negative lookahead to match any path that does NOT start with `loops/`.

### 2. Added Explicit CORS Headers
```json
{
  "source": "/loops/(.*)",
  "headers": [
    {
      "key": "Cache-Control",
      "value": "public, max-age=31536000, immutable"
    },
    {
      "key": "Access-Control-Allow-Origin",
      "value": "*"
    },
    {
      "key": "Access-Control-Allow-Methods",
      "value": "GET, HEAD, OPTIONS"
    }
  ]
}
```

This ensures mobile browsers can properly fetch the loop files with appropriate CORS headers.

## Testing After Deployment

1. **Direct File Access Test**:
   ```
   https://[your-domain]/loops/melodies/atmosphere/atmosphere_G.wav
   ```
   Should download/stream the WAV file, not return index.html

2. **HEAD Request Test** (what the code does):
   ```bash
   curl -I https://[your-domain]/loops/melodies/atmosphere/atmosphere_G.wav
   ```
   Should return:
   - `200 OK`
   - `Content-Type: audio/wav`
   - CORS headers

3. **Mobile App Test**:
   - Clear mobile browser cache
   - Load production URL
   - Test atmosphere pad in key G
   - Should now play correctly

## Files Changed
- `vercel.json` - Fixed routing and added CORS headers

## Related Files
- `MOBILE_ATMOSPHERE_DEBUG.md` - Debugging guide (for reference)
- `server.js` - Express static serving (works correctly, no changes needed)
- `loop-player-pad.js` - Client-side code (works correctly, no changes needed)

## Deployment
```bash
git add vercel.json MOBILE_ATMOSPHERE_DEBUG.md VERCEL_ROUTING_FIX.md
git commit -m "Fix Vercel routing for melodic loops - exclude /loops/ from catch-all rewrite"
git push origin main
```

After push, Vercel will auto-deploy and the atmosphere pads should work on mobile.
