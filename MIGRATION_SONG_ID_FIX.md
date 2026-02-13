# Song ID Standardization - Migration Guide

**Date:** February 13, 2026  
**Issue Fixed:** Inconsistent Song ID Format  
**Priority:** High

---

## Problem Summary

The codebase had inconsistent song identifier usage:
- Some code used `song.id` (numeric integer)
- Some code used `song._id` (MongoDB ObjectId)
- Some code checked both `s.id === item || s._id === item`

This inconsistency caused:
- Songs not matching properly in setlists
- Duplicate detection failures
- Update/delete operation failures
- Potential data corruption

---

## Solution Implemented

### Standardization Decision
**We standardized on `song.id` (numeric integer) as the primary song identifier.**

**Reasons:**
1. All update/delete operations use `id: parseInt(id)`
2. Sequential numeric IDs are user-friendly
3. Easier to reference in URLs and UI
4. Already established pattern in existing code

### Changes Made

#### 1. Database Migration Script
**File:** `migrate-song-ids.js`

This script:
- Finds all songs without a numeric `id` field
- Assigns sequential IDs starting from the highest existing ID
- Validates no duplicate IDs exist
- Reports detailed migration summary

#### 2. Server-Side Changes
**File:** `server.js`

**Changes:**
- Removed fallback logic `song.id || song._id` → `song.id`
- Simplified song data mapping in `/api/songs/scan` endpoint
- Removed `_id` field from response payloads (only return `id`)

**Lines Changed:**
- Line 628: `id: song.id || song._id` → `id: song.id`
- Line 629: Removed `_id: song._id` from response
- Line 665: `id: song.id || song._id` → `id: song.id`
- Line 666: Removed `_id: song._id` from response

#### 3. Client-Side Changes
**File:** `main.js`

**Changes:**
- Updated setlist song lookup to use only `id`
- Added string-to-number conversion for ID comparisons
- Simplified Smart Setlist song matching
- Fixed remove-from-setlist functionality
- Fixed manual song selection

**Major Updates:**
1. **Global Setlist (Line 4110-4120):**
   ```javascript
   // BEFORE
   const song = songs.find(s => s.id === item || s._id === item);
   
   // AFTER
   const itemId = typeof item === 'string' ? parseInt(item) : item;
   const song = songs.find(s => s.id === itemId);
   ```

2. **My Setlist (Line 4240-4250):**
   - Same fix as Global Setlist

3. **Remove from Setlist (Line 4384-4405):**
   ```javascript
   // BEFORE
   data-song-id="${song._id || song.id}"
   await removeSongFromSetlist(song._id || song.id);
   
   // AFTER
   data-song-id="${song.id}"
   await removeSongFromSetlist(song.id);
   ```

4. **Select Existing Song (Line 5038-5052):**
   ```javascript
   // BEFORE
   onclick="selectExistingSong('${song._id}')"
   const song = songs.find(s => s._id === songId);
   
   // AFTER
   onclick="selectExistingSong('${song.id}')"
   const song = songs.find(s => s.id === parseInt(songId));
   ```

5. **Duplicate Detection (Line 5142-5150):**
   ```javascript
   // BEFORE
   const foundSong = songs.find(s => s.id === song || s._id === song);
   const manualSongInList = currentSetlist.songs.find(s => 
       typeof s === 'object' && s._id === song);
   
   // AFTER
   const foundSong = songs.find(s => s.id === parseInt(song));
   const manualSongInList = currentSetlist.songs.find(s => 
       typeof s === 'object' && s.id === song);
   ```

6. **Smart Setlist Matching (Line 6143-6148):**
   ```javascript
   // BEFORE
   const fullSong = songs.find(s => 
       s.id === smartSong.id || s.id === smartSong._id || 
       s._id === smartSong.id || s._id === smartSong._id);
   
   // AFTER
   const fullSong = songs.find(s => s.id === smartSong.id);
   ```

---

## Migration Steps

### Prerequisites
- Backup your database before running migration
- Ensure you have access to MongoDB
- Node.js and npm installed
- `.env` file configured with `MONGODB_URI`

### Step 1: Backup Database
```bash
# Create a backup timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

# Backup using your preferred method (MongoDB Compass, mongodump, etc.)
# Or create manual backup through MongoDB Atlas
```

### Step 2: Run Migration Script
```powershell
# Navigate to project directory
cd c:\Users\SwaResH\Documents\REPOS\OldandNew

# Run the migration
node migrate-song-ids.js
```

### Expected Output:
```
🚀 Starting Song ID Migration Script

✅ Connected to MongoDB
📊 Total songs in database: 150
🔍 Songs without numeric ID: 5
📈 Highest existing ID: 145
🚀 Starting migration...
  ✓ Updated song "Example Song 1" with id: 146
  ✓ Updated song "Example Song 2" with id: 147
  ✓ Updated song "Example Song 3" with id: 148
  ✓ Updated song "Example Song 4" with id: 149
  ✓ Updated song "Example Song 5" with id: 150

📊 Migration Summary:
  - Total songs: 150
  - Songs needing ID: 5
  - Successfully updated: 5
  - Failed: 0

🔍 Verifying migration...
✅ All songs now have numeric IDs!

🔍 Checking for duplicate IDs...
✅ No duplicate IDs found!

🔌 Disconnected from MongoDB

✅ Migration completed successfully!
```

### Step 3: Deploy Updated Code

#### Option A: Deploy to Vercel (Production)
```powershell
# Commit changes
git add .
git commit -m "Fix: Standardize song IDs to numeric format"

# Push to production
git push origin main

# Vercel will auto-deploy
```

#### Option B: Local Testing
```powershell
# Start local server (terminal 1)
node server.js

# Serve frontend (terminal 2 - if needed)
# Open index.html in browser or use a static server
```

### Step 4: Verify Fix
1. **Test Song Display:** Navigate through songs, verify all load correctly
2. **Test Setlists:** Open global/my/smart setlists, verify songs display
3. **Test Add to Setlist:** Add songs to setlists, verify success
4. **Test Remove from Setlist:** Remove songs, verify it works
5. **Test Search/Filter:** Filter songs by various criteria
6. **Test Manual Songs:** Add manual songs to setlists
7. **Check Console:** No errors related to song IDs

---

## Rollback Procedure

If issues occur after migration:

### 1. Restore Database Backup
Use your backup from Step 1

### 2. Revert Code Changes
```powershell
# Revert to previous commit
git revert HEAD
git push origin main
```

---

## Post-Migration Notes

### What Changed for Users
- **No visible changes** - This is a backend fix
- Songs will continue to work exactly as before
- Performance may slightly improve due to simpler lookups

### What Changed for Developers
- Always use `song.id` (numeric) for songs
- Always use `setlist._id` (string) for setlists
- No more fallback checks needed
- Type conversion handled where needed (`parseInt()`)

### Data Structure Now

**Song Object:**
```javascript
{
  id: 1,                    // PRIMARY IDENTIFIER (numeric)
  title: "Song Title",
  artist: "Artist Name",
  key: "C",
  category: "New",
  // ... other fields
  // Note: _id still exists in MongoDB but not used in code
}
```

**Setlist Object:**
```javascript
{
  _id: "setlist_123456",    // PRIMARY IDENTIFIER (string)
  name: "My Setlist",
  songs: [
    1,                      // Song IDs (numeric)
    2,
    {                       // Or manual song objects
      id: "manual_789",
      title: "Manual Song"
    }
  ],
  // ... other fields
}
```

---

## Testing Checklist

- [ ] Migration script runs without errors
- [ ] All songs have numeric `id` field
- [ ] No duplicate song IDs exist
- [ ] Song list displays correctly
- [ ] Global setlists load and display songs
- [ ] My setlists load and display songs
- [ ] Smart setlists load and display songs
- [ ] Can add songs to setlists
- [ ] Can remove songs from setlists
- [ ] Can create new songs
- [ ] Can edit existing songs
- [ ] Can delete songs (admin)
- [ ] Search and filter work correctly
- [ ] Manual songs can be added
- [ ] No console errors related to IDs

---

## Future Improvements

1. **Add Unit Tests:** Test song ID operations
2. **Add Validation:** Server-side validation for numeric IDs
3. **Database Constraints:** Add unique index on `id` field
4. **API Documentation:** Update API docs with ID format
5. **Error Handling:** Better error messages for ID mismatches

---

## Support

If you encounter issues:
1. Check the migration script output for errors
2. Verify database backup is available
3. Check browser console for JavaScript errors
4. Check server logs for API errors
5. Verify `.env` file has correct `MONGODB_URI`

---

## Success Criteria

✅ Migration is successful when:
- Migration script reports 0 failures
- No duplicate IDs exist
- All songs have numeric `id` field
- Application loads without errors
- Setlists display songs correctly
- Add/remove song operations work
- No console errors appear

---

**Status:** ✅ Ready for Migration  
**Confidence:** High  
**Risk Level:** Low (with backup)  
**Estimated Downtime:** < 5 minutes
