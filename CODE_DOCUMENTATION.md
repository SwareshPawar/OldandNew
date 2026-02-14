# CODE DOCUMENTATION - SINGLE SOURCE OF TRUTH

**Old & New Songs Application**  
**Generated:** February 13, 2026  
**Last Updated:** February 15, 2026 - 12:00 AM  
**Version:** 1.4

---

## RECENT CHANGES (February 14-15, 2026)

### Completed Fixes - Session 5 (February 15, 2026 - Midnight)

15. **✅ API Security: Protected All Public Endpoints**
   - **Problem**: Critical API endpoints were publicly accessible without authentication
   - **Vulnerable Endpoints Secured**:
     - `GET /api/songs` - Now requires authentication (was public)
     - `GET /api/global-setlists` - Now requires authentication (was public)
     - `POST /api/songs/scan` - Now requires authentication (was public)
     - `GET /api/recommendation-weights` - Now requires authentication (was public)
     - `GET /api/debug/db` - Now requires admin role (was public)
   - **Impact**: 
     - Direct API access via browser URL now returns 401 Unauthorized
     - All song data, setlists, and configurations protected
     - Only authenticated users can access app data
     - Prevents data scraping and unauthorized access
   - **Locations**: [server.js](server.js#L104, server.js#L341, server.js#L473, server.js#L741, server.js#L232)
   - **Authentication Flow**: All protected endpoints now require `Authorization: Bearer <JWT_TOKEN>` header

### Completed Fixes - Session 4 (February 14, 2026 - Night)

13. **✅ Setlist Header Buttons: Fixed Incorrect Display When Switching Types**
   - **Problem**: When switching from smart setlist → my setlist, smart setlist buttons remained visible
   - **Root Cause**: `showMySetlistInMainSection()` only appended back button instead of rebuilding entire button set
   - **Fix**: Changed to completely rebuild all buttons (matching behavior of other setlist functions)
   - **Locations**: [main.js](main.js#L3582-L3620) `showMySetlistInMainSection()`
   - **Added**: Event listeners for edit, delete, and resequence buttons after HTML rebuild in both global and my setlist functions
   - **Impact**: Clean state transitions between setlist types (global ↔ my ↔ smart), proper button functionality
   
14. **✅ Code Cleanup: Removed Excessive console.log Statements**
   - **Removed from main.js**: ~50+ debug/info console.log statements
     - Service Worker registration success log
     - API_BASE_URL display log
     - Song ID duplicate warning logs
     - Loading progress messages
     - setupSearchableMultiselect debugging (🔧 emojis)
     - Multiselect option click logs (🖱️, ✅, ❌ emojis)
     - Smart Setlists loading logs (📋 emojis)
     - Song editing verbose logs (🎵 emojis)
     - Scan and render operation logs
   - **Removed from server.js**: ~25+ debug/info console.log statements
     - Database connection status logs
     - MongoDB URI availability logs
     - DB Middleware logging
     - Login attempt logs
     - DEBUG POST/PUT request logs
   - **Kept**: console.error, console.warn, and critical error logs
   - **Impact**: Cleaner console output, easier debugging, improved performance

### Completed Fixes - Session 3 (February 14, 2026 - Evening)

12. **✅ Admin Panel: Removed Duplicate Detection Tab**
   - **Removed**: Duplicate Detection tab from Admin Panel UI (tab button and content container)
   - **Preserved**: Duplicate detection functionality during song addition/editing
   - **Location Changes**:
     - [index.html](index.html#L377): Removed duplicateDetectionTab button
     - [index.html](index.html#L443): Removed duplicateDetectionTabContent container
     - [main.js](main.js): Removed tab switching logic, renderDuplicateDetection(), viewLyrics(), deleteSingleDuplicateSong()
     - [main.js](main.js#L2057): Kept stringSimilarity() function for song addition duplicate checking
   - **Result**: Admin Panel now has 2 tabs (User Management, Recommendation Weights) instead of 3
   - **Rationale**: Backend and frontend already prevent duplicates during song entry; admin browsing tab was redundant

### Completed Fixes - Session 2 (February 14, 2026 - Evening)

11. **✅ DOMContent Initialization: Fixed Double init() Calls**
   - **Problem**: Multiple DOMContentLoaded listeners causing double initialization
   - **Fixed**: Consolidated all inline scripts from [index.html](index.html) to [main.js](main.js)
   - **Moved to main.js**: WEIGHTS variable, fetchRecommendationWeights(), saveRecommendationWeightsToBackend(), toggleTheme()
   - **Removed**: All inline `<script>` blocks from [index.html](index.html)
   - **Impact**: Single initialization, no duplicate event listeners, proper load order

### Completed Fixes - Session 1 (February 14, 2026 - Afternoon)

6. **✅ Code Cleanup: Removed Unused Variables**

1. **✅ Issue #3: Duplicate Variable Declarations**
   - Fixed 4 local `jwtToken` redeclarations shadowing global variable
   - Locations: fetchUsers(), markAdmin(), add song handler, removeAdminRole()
   - Impact: Prevents stale authentication token issues

2. **✅ Issue #6: Setlist Rendering Consolidation**
   - Consolidated 3 duplicate rendering functions (~167 lines removed)
   - Created generic `renderSetlists()` function with configuration objects
   - All features preserved: permissions, mobile touch, refresh buttons
   - Impact: Improved maintainability, consistent behavior

3. **✅ UI: Toggle Buttons Visibility & Alignment**
   - Fixed panel toggle buttons visibility on desktop
   - Added desktop CSS rules for full opacity (opacity: 1)
   - Fixed mobile nav buttons appearing on desktop page load
   - Proper alignment: Auto-scroll positioned above nav buttons
   - Desktop: 4 buttons (sidebar, songs, both panels, auto-scroll)
   - Mobile: 3 buttons (sidebar, songs, auto-scroll)

4. **✅ Issue #6: Missing Null Checks**
   - Added 6 critical null checks to prevent runtime errors
   - Locations: Resequence button, drag-and-drop, viewLyrics, viewSingleLyrics, duplicate detection
   - Impact: Prevents "Cannot read property of null/undefined" crashes
   - Provides user feedback for missing data instead of silent failures

5. **✅ Issue #7: Undefined Function Call - renderGenreOptions()**
   - Fixed runtime error: "ReferenceError: renderGenreOptions is not defined"
   - Location: [main.js](main.js#L9084) in editSong() function
   - Removed obsolete call to non-existent `renderGenreOptions('editGenreDropdown')`
   - Genre multiselect now uses existing `setupSearchableMultiselect()` pattern
   - Verified: All other functions use proper `typeof` checks or exist
   - Impact: Eliminates crash when editing songs with genre fields

6. **✅ Code Cleanup: Removed Unused Variables**
   - **socket** - WebSocket variable declared but only used in dead/commented code
   - **lastSongsFetch** - Variable declared but never referenced anywhere
   - **isAnyModalOpen** - Boolean flag declared but never used
   - **connectWebSocket() function** - Function defined but never called (call was commented out)
   - Impact: Cleaner codebase, reduced confusion, ~10 lines of unused code removed

7. **✅ Enhanced Error Handling - Missing Try-Catch Blocks**
   - **JSON.parse Operations**: Added try-catch for search history and button positions
   - **localStorage Access**: Added try-catch for theme, authentication, settings, and cache operations
   - **localStorage Write Operations**: Protected all localStorage.setItem() calls
   - Locations: Theme handling, login/logout, settings panel, auto-scroll config, search history
   - Impact: Prevents crashes in private browsing mode, graceful degradation when storage fails

8. **✅ UI Consistency: Delete Confirmation Dialogs**
   - **Smart Setlist Delete**: Changed from browser `confirm()` to themed `confirmDeleteSetlistModal`
   - **Admin Role Removal**: Added new themed `confirmRemoveAdminModal`, replaced browser `confirm()`
   - **Song Delete Modal**: Updated to consistent themed design (btn-secondary/btn-danger classes)
   - **All Delete Operations**: Now use consistent modal structure with proper theming
   - Impact: Professional appearance, consistent UX, mobile-friendly, dark/light mode support

### Completed Fixes - Session 3 (February 14, 2026 - Late Evening)

9. **✅ JavaScript Architecture: Consolidated All Scripts from index.html to main.js**
   - **Removed inline scripts** - All `<script>` blocks removed from [index.html](index.html)
   - **Moved WEIGHTS variable** - Recommendation weights now initialized in [main.js](main.js#L25) with other globals
   - **Moved fetchRecommendationWeights()** - Function relocated to [main.js](main.js#L228) after API_BASE_URL definition
   - **Moved saveRecommendationWeightsToBackend()** - Function relocated to [main.js](main.js#L239)
   - **Moved toggleTheme()** - Simple theme toggle function added to [main.js](main.js#L1561)
   - **Removed duplicate DOMContentLoaded** - Eliminated race condition from HTML file
   - **Single script tag** - Only `<script src="main.js"></script>` remains in HTML
   - Impact: Eliminated double initialization of init(), proper variable scoping, cleaner architecture, single source of truth for JavaScript

### Code Metrics - Updated
- **Total Lines Removed:** ~921 lines of duplicate/obsolete code (+10 from inline scripts)
- **Null Guards Added:** 6 protective checks
- **Try-Catch Blocks Added:** 12+ error handling improvements
- **Runtime Errors Fixed:** 1 undefined function call
- **UI Inconsistencies Fixed:** 3 delete confirmation inconsistencies
- **Architecture Improvements:** All JavaScript consolidated to main.js
- **File Size Reduction:** ~8.3% reduction in main.js, cleaner HTML structure
- **Issues Resolved:** 12 major issues fixed (+1 from this session)
- **Bugs Fixed:** Authentication, button visibility, null references, undefined functions, storage errors, UI consistency, script initialization race conditions

---

## 1. GLOBAL VARIABLES

### Main Application State Variables ([main.js](main.js))

| Variable | Type | Purpose | Initial Value | Modified By |
|----------|------|---------|---------------|-------------|
| `deferredPrompt` | Event | Stores PWA install prompt | `undefined` | PWA install event handler |
| `jwtToken` | String | JWT authentication token | `localStorage.getItem('jwtToken')` | Login, logout functions |
| `currentUser` | Object/null | Currently logged-in user data | `localStorage.getItem('currentUser')` | Login, logout, loadUserData |
| `isDarkMode` | Boolean | Dark mode state | `localStorage.getItem('darkMode') === 'true'` | Theme toggle function |
| `songs` | Array | Global songs array | `[]` | loadSongsWithProgress, addSong, editSong |
| `smartSetlists` | Array | Smart setlists array | `[]` | loadSmartSetlistsFromServer |
| `globalSetlists` | Array | Global setlists (admin) | `[]` | loadGlobalSetlists |
| `mySetlists` | Array | User's personal setlists | `[]` | loadMySetlists |
| `favorites` | Array | User's favorite song IDs | `[]` | loadUserData, toggleFavorite |
| `currentViewingSetlist` | Object/null | Currently viewing setlist | `null` | Setlist display functions |
| `currentSetlistType` | String/null | Type of current setlist: 'global', 'my', 'smart' | `null` | Setlist display functions |
| `keepScreenOn` | Boolean | Screen wake lock state | `false` | initScreenWakeLock |
| `autoScrollSpeed` | Number | Auto-scroll speed in ms | `localStorage.getItem('autoScrollSpeed')` or `1500` | Settings form |
| `WEIGHTS` | Object | AI recommendation weights configuration | `localStorage.getItem('recommendationWeights')` or default values | fetchRecommendationWeights, saveRecommendationWeightsToBackend |
| `suggestedSongsDrawerOpen` | Boolean | Suggested songs drawer state | `false` | Toggle drawer functions |
| `isScrolling` | Boolean | Auto-scroll active state | `false` | Auto-scroll toggle |
| `navigationHistory` | Array | Song navigation history | `[]` | showPreview function |
| `currentHistoryPosition` | Number | Current position in navigation history | `-1` | Browser history navigation |
| `isNavigatingHistory` | Boolean | Flag for history navigation | `false` | History navigation handler |
| `wakeLock` | WakeLock/null | Screen wake lock reference | `null` | initScreenWakeLock |

### Constants ([main.js](main.js))

| Constant | Type | Purpose | Value |
|----------|------|---------|-------|
| `API_BASE_URL` | String | Backend API URL | Localhost: `'http://localhost:3001'`, Production: `'https://oldand-new.vercel.app'` |
| `CACHE_EXPIRY` | Object | Cache expiration times (ms) | `{songs: 300000, userdata: 600000, setlists: 120000}` |
| `GENRES` | Array | Available music genres | ["New", "Old", "Mid", "Hindi", "Marathi", "English", ...] |
| `VOCAL_TAGS` | Array | Vocal type tags | ['Male', 'Female', 'Duet'] |
| `KEYS` | Array | Musical keys | ["C", "C#", "D", "Eb", "E", "F", ...] |
| `CATEGORIES` | Array | Song categories | ["New", "Old"] |
| `TIMES` | Array | Time signatures | ["4/4", "3/4", "2/4", "6/8", "5/4", "7/8", "12/8", "14/8"] |
| `TAALS` | Array | Indian classical rhythm patterns | ["Keherwa", "Dadra", "EkTaal", ...] |
| `MOODS` | Array | Song moods | ["Happy", "Sad", "Romantic", "Powerful", ...] |
| `ARTISTS` | Array | Artist names | ["Kishore Kumar", "Lata Mangeshkar", ...] |
| `CHORD_TYPES` | Array | Chord type patterns | ["madd13", "maj7", "m7", "dim", "aug", ...] |
| `CHORDS` | Array | Base chord names | ["C", "C#", "D", "Eb", "E", "F", ...] |
| `TIME_GENRE_MAP` | Object | Maps time signatures to taals | `{"4/4": ["Keherwa", ...], "3/4": ["Waltz", ...]}` |

### Recommendation Weights Configuration ([main.js](main.js))

The `WEIGHTS` object (note: it's a variable, not a constant, as it's updated from the backend):

```javascript
WEIGHTS = {
    language: 20,        // Weight for language matching (20 points)
    scale: 25,          // Weight for key/scale relationships (25 points)
    timeSignature: 20,  // Weight for time signature matching (20 points)
    taal: 15,           // Weight for taal/rhythm pattern matching (15 points)
    tempo: 5,           // Weight for tempo similarity (5 points)
    genre: 5,           // Weight for genre matching (5 points)
    vocal: 5,           // Weight for vocal type matching (5 points)
    mood: 5             // Weight for mood matching (5 points)
}
```

**Total Maximum Score:** 100 points  
**Storage:** Synced between backend API and localStorage  
**Admin Configurable:** Yes (via Admin Panel)  
**Default Fallback:** Used when backend is unavailable

### Cache and Data Management ([main.js](main.js))

| Variable | Type | Purpose | Initial Value |
|----------|------|---------|---------------|
| `window.dataCache` | Object | Cached API responses | `{songs: null, userdata: null, 'global-setlists': null, 'my-setlists': null}` |
| `window.dataCache.lastFetch` | Object | Last fetch timestamps | `{songs: null, userdata: null, 'global-setlists': null, 'my-setlists': null}` |
| `initializationState` | Object | App initialization state | `{isInitializing: false, isInitialized: false, initPromise: null}` |
| `multiselectInstances` | Map | Multiselect dropdown instances | `new Map()` |

---

## 2. API ENDPOINTS (from [server.js](server.js))

### Authentication Endpoints

| Method | Route | Auth Required | Request Parameters | Response | Purpose |
|--------|-------|---------------|-------------------|----------|---------|
| POST | `/api/register` | No | `{firstName, lastName, username, email, phone, password, isAdmin?}` | `{message, user}` | Register new user |
| POST | `/api/login` | No | `{usernameOrEmail, password}` | `{token, user}` | Login user and get JWT |
| POST | `/api/forgot-password` | No | `{identifier, method}` | `{message, method, maskedIdentifier}` | Initiate password reset with OTP |
| POST | `/api/reset-password` | No | `{identifier, otp, newPassword}` | `{message}` | Reset password with OTP |

### Song Endpoints

| Method | Route | Auth Required | Request Parameters | Response | Purpose |
|--------|-------|---------------|-------------------|----------|---------|
| GET | `/api/songs` | No | `?since=TIMESTAMP` (optional) | `Array<Song>` | Get all songs, supports delta sync |
| POST | `/api/songs` | Yes | Song object | Created song | Add new song |
| PUT | `/api/songs/:id` | Yes | Song object | Updated song | Update existing song |
| DELETE | `/api/songs/:id` | Yes (Admin) | None | `{message}` | Delete song by ID |
| DELETE | `/api/songs` | Yes (Admin) | None | `{message}` | Delete all songs |
| POST | `/api/songs/scan` | No | `{keys, tempoMin, tempoMax, times, taals, moods, genres, categories}` | `Array<Song>` | Scan songs with conditions |

### User Data Endpoints

| Method | Route | Auth Required | Request Parameters | Response | Purpose |
|--------|-------|---------------|-------------------|----------|---------|
| GET | `/api/userdata` | Yes | None | `{favorites, name, email, transpose, ...}` | Get user's data |
| PUT | `/api/userdata` | Yes | `{favorites, name, email, transpose}` | `{message}` | Update user's data |

### Admin Endpoints

| Method | Route | Auth Required | Request Parameters | Response | Purpose |
|--------|-------|---------------|-------------------|----------|---------|
| GET | `/api/users` | Yes (Admin) | None | `Array<User>` | Get all users |
| PATCH | `/api/users/:id/admin` | Yes (Admin) | `{isAdmin: true}` | `{message}` | Mark user as admin |
| PATCH | `/api/users/:id/remove-admin` | Yes (Admin) | None | `{message}` | Remove admin role |

### Recommendation Weights Endpoints

| Method | Route | Auth Required | Request Parameters | Response | Purpose |
|--------|-------|---------------|-------------------|----------|---------|
| GET | `/api/recommendation-weights` | No | None | Weight configuration object | Get recommendation weights |
| PUT | `/api/recommendation-weights` | Yes (Admin) | `{language, scale, timeSignature, taal, tempo, genre, vocal, mood}` | `{message, lastModified}` | Update recommendation weights |

### Global Setlist Endpoints

| Method | Route | Auth Required | Request Parameters | Response | Purpose |
|--------|-------|---------------|-------------------|----------|---------|
| GET | `/api/global-setlists` | No | None | `Array<Setlist>` | Get all global setlists |
| POST | `/api/global-setlists` | Yes (Admin) | `{name, description, songs}` | Created setlist | Create global setlist |
| PUT | `/api/global-setlists/:id` | Yes (Admin) | `{name?, description?, songs?}` | `{message}` | Update global setlist |
| DELETE | `/api/global-setlists/:id` | Yes (Admin) | None | `{message}` | Delete global setlist |
| PUT | `/api/global-setlists/:id/transpose` | Yes (Admin) | `{songId, transpose, newKey}` | `{success, message, ...}` | Save transpose for song in global setlist |
| POST | `/api/global-setlists/add-song` | Yes (Admin) | `{setlistId, songId, manualSong?}` | `{success, message}` | Add song to global setlist |
| POST | `/api/global-setlists/remove-song` | Yes (Admin) | `{setlistId, songId}` | `{success, message}` | Remove song from global setlist |

### Personal Setlist Endpoints

| Method | Route | Auth Required | Request Parameters | Response | Purpose |
|--------|-------|---------------|-------------------|----------|---------|
| GET | `/api/my-setlists` | Yes | None | `Array<Setlist>` | Get user's personal setlists |
| POST | `/api/my-setlists` | Yes | `{name, description, songs}` | Created setlist | Create personal setlist |
| PUT | `/api/my-setlists/:id` | Yes | `{name?, description?, songs?}` | `{message}` | Update personal setlist |
| DELETE | `/api/my-setlists/:id` | Yes | None | `{message}` | Delete personal setlist |
| POST | `/api/my-setlists/add-song` | Yes | `{setlistId, songId, manualSong?}` | `{success, message}` | Add song to personal setlist |
| POST | `/api/my-setlists/remove-song` | Yes | `{setlistId, songId}` | `{success, message}` | Remove song from personal setlist |

### Smart Setlist Endpoints

| Method | Route | Auth Required | Request Parameters | Response | Purpose |
|--------|-------|---------------|-------------------|----------|---------|
| GET | `/api/smart-setlists` | Yes | None | `Array<SmartSetlist>` | Get user's smart setlists + admin-created |
| POST | `/api/smart-setlists` | Yes | `{name, description, conditions, songs}` | Created smart setlist | Create smart setlist |
| PUT | `/api/smart-setlists/:id` | Yes | `{name, description, conditions, songs}` | Updated setlist | Update smart setlist |
| DELETE | `/api/smart-setlists/:id` | Yes | None | `{success, message}` | Delete smart setlist |

---

## 3. FUNCTIONS

### A. Authentication Functions ([main.js](main.js), [utils/auth.js](utils/auth.js))

| Function | Parameters | Return Type | Purpose | Called From |
|----------|------------|-------------|---------|-------------|
| `updateAuthButtons()` | None | void | Update UI based on authentication state | Login, logout, init |
| `showLoginModal()` | None | void | Display login modal | Login button click |
| `showRegisterModal()` | None | void | Display registration modal | Register button click |
| `login()` | None | Promise<void> | Handle user login | Login form submit |
| `register()` | None | Promise<void> | Handle user registration | Register form submit |
| `logout()` | None | void | Logout user and clear state | Logout button click |
| `isJwtValid(token)` | token: String | Boolean | Check if JWT token is valid | Multiple locations |
| `getJwtExpiry(token)` | token: String | Number\|null | Get JWT expiration timestamp | isJwtValid |
| `loadUserData()` | None | Promise<void> | Load user data from server | Login, init |
| `setupPasswordResetEventListeners()` | None | void | Setup password reset UI handlers | DOMContentLoaded |
| `registerUser(db, userData)` | db: Database, userData: Object | Promise<Object> | Register new user (server) | POST /api/register |
| `authenticateUser(db, credentials)` | db: Database, credentials: Object | Promise<{token, user}> | Authenticate user (server) | POST /api/login |
| `verifyToken(token)` | token: String | Object\|null | Verify JWT token (server) | authMiddleware |
| `generateOTP()` | None | String | Generate 6-digit OTP (server) | POST /api/forgot-password |
| `storeOTP(db, identifier, otp, method)` | db, identifier, otp, method | Promise<void> | Store OTP in database (server) | POST /api/forgot-password |
| `sendEmailOTP(email, otp, name)` | email, otp, name | Promise<void> | Send OTP via email (server) | POST /api/forgot-password |
| `sendSMSOTP(phone, otp, name)` | phone, otp, name | Promise<void> | Send OTP via SMS (server) | POST /api/forgot-password |
| `findUserForPasswordReset(db, identifier)` | db, identifier | Promise<Object> | Find user for password reset (server) | POST /api/forgot-password |
| `resetUserPassword(db, identifier, newPassword, otp)` | db, identifier, newPassword, otp | Promise<Object> | Reset user password with OTP (server) | POST /api/reset-password |

### B. Setlist Functions ([main.js](main.js))

#### Global Setlists

| Function | Parameters | Return Type | Purpose | Called From |
|----------|------------|-------------|---------|-------------|
| `loadGlobalSetlists(forceRefresh)` | forceRefresh?: Boolean | Promise<void> | Load global setlists from server | init, render functions |
| `renderGlobalSetlists()` | None | Promise<void> | Render global setlists in sidebar | init, after CRUD operations |
| `showGlobalSetlistInMainSection(setlistId)` | setlistId: String | void | Display global setlist songs | Setlist click handler |
| `createGlobalSetlist()` | None | void | Open modal to create global setlist | Add button click |
| `editGlobalSetlist(setlistId)` | setlistId: String | void | Open modal to edit global setlist | Edit button click |
| `deleteGlobalSetlist(setlistId)` | setlistId: String | void | Delete global setlist | Delete button click |

#### Personal Setlists

| Function | Parameters | Return Type | Purpose | Called From |
|----------|------------|-------------|---------|-------------|
| `loadMySetlists(forceRefresh)` | forceRefresh?: Boolean | Promise<void> | Load user's personal setlists | init, render functions |
| `renderMySetlists()` | None | Promise<void> | Render personal setlists in sidebar | init, after CRUD operations |
| `showMySetlistInMainSection(setlistId)` | setlistId: String | void | Display personal setlist songs | Setlist click handler |
| `createMySetlist()` | None | void | Open modal to create personal setlist | Add button click |
| `editMySetlist(setlistId)` | setlistId: String | void | Open modal to edit personal setlist | Edit button click |
| `deleteMySetlist(setlistId)` | setlistId: String | void | Delete personal setlist | Delete button click |

#### Smart Setlists

| Function | Parameters | Return Type | Purpose | Called From |
|----------|------------|-------------|---------|-------------|
| `loadSmartSetlistsFromServer()` | None | Promise<void> | Load smart setlists from server | init, after login |
| `renderSmartSetlists()` | None | void | Render smart setlists in sidebar | init, after CRUD operations |
| `showSmartSetlistInMainSection(setlistId)` | setlistId: String | void | Display smart setlist songs | Setlist click handler |
| `scanSongsWithConditions(conditions)` | conditions: Object | Promise<Array> | Scan songs matching conditions | Scan button click |
| `getSmartSetlistConditions()` | None | Object | Get conditions from form | Form submit |
| `displayScanResults(songs)` | songs: Array | void | Display scan results in tabs | After scan |
| `createSmartSetlistWithSongs(formData)` | formData: Object | Promise<void> | Create smart setlist with scanned songs | Form submit |
| `editSmartSetlist(setlistId)` | setlistId: String | void | Open modal to edit smart setlist | Edit button click |
| `deleteSmartSetlist(setlistId)` | setlistId: String | Promise<void> | Delete smart setlist | Delete button click |
| `updateSmartSetlist(setlistId)` | setlistId: String | Promise<void> | Rescan and update smart setlist | Refresh button click |

#### Common Setlist Functions

| Function | Parameters | Return Type | Purpose | Called From |
|----------|------------|-------------|---------|-------------|
| `populateSetlistDropdown()` | None | void | Populate setlist dropdown selector | init, after setlist changes |
| `initializeSetlistSongSelection(prefix)` | prefix: String | Object | Initialize song selection UI for setlist | Modal open |
| `displaySetlistSongs(songs, container, context)` | songs, container, context | void | Display songs in setlist container | Setlist display functions |
| `removeSongFromSetlist(songId)` | songId: Number | Promise<void> | Remove song from current setlist | Remove button click |
| `refreshSetlistDisplay()` | None | void | Refresh current setlist display | After changes |
| `clearSetlistSelections()` | None | void | Clear all song selections | Before rendering |
| `refreshSetlistDataOnly()` | None | Promise<void> | Refresh setlist data from server | After changes |
| `refreshSetlistDataAndUI()` | None | Promise<void> | Refresh setlist data and update UI | After changes |
| `updateAllSetlistButtonStates()` | None | void | Update all setlist button states | After setlist changes |

### C. Song Management Functions ([main.js](main.js))

| Function | Parameters | Return Type | Purpose | Called From |
|----------|------------|-------------|---------|-------------|
| `loadSongsWithProgress(forceRefresh)` | forceRefresh?: Boolean | Promise<Array> | Load songs with progress indicator | init |
| `loadSongsFromFile()` | None | Promise<Array> | Load songs from cache/localStorage | init |
| `renderSongs(category, keyFilter, genreFilter, moodFilter, artistFilter)` | category, filters | void | Render songs based on filters | Init, filter changes |
| `showPreview(song, skipHistory, context)` | song: Object, skipHistory?: Boolean, context?: String | void | Display song preview with lyrics | Song click |
| `editSong(songId)` | songId: Number | void | Open edit modal for song | Edit button click |
| `deleteSong(songId)` | songId: Number | Promise<void> | Delete song | Delete button click |
| `toggleFavorite(songId)` | songId: Number | Promise<void> | Toggle song favorite status | Favorite button click |
| `updateSongCount()` | None | void | Update song count display | After song changes |
| `updateSongInCache(song, isNewSong)` | song: Object, isNewSong?: Boolean | Boolean | Update song in cache | After add/edit |
| `deleteSongById(songId, postDeleteCallback)` | songId, callback | Promise<void> | Delete song by ID with callback | Delete functions |

### D. AI Recommendation System Functions ([main.js](main.js))

| Function | Parameters | Return Type | Purpose | Called From |
|----------|------------|-------------|---------|-------------|
| `fetchRecommendationWeights()` | None | Promise<void> | Fetch recommendation weights from backend | DOMContentLoaded, init |
| `saveRecommendationWeightsToBackend(weights)` | weights: Object | Promise<Object> | Save weights to backend and update local | Admin panel |
| `getSuggestedSongs(currentSongId)` | currentSongId: Number | Array<Song> | Calculate and return top 20 suggested songs | showSuggestedSongs |
| `showSuggestedSongs()` | None | void | Display suggested songs in drawer | Song preview |
| `closeSuggestedSongsDrawer()` | None | void | Close suggested songs drawer | Close button, ESC key |
| `setupSuggestedSongsClosing()` | None | void | Setup event listeners for drawer | DOMContentLoaded |

#### Recommendation Algorithm Details

The `getSuggestedSongs()` function uses weighted scoring based on multiple musical attributes:

**Scoring Weights (configurable via WEIGHTS object):**
- **Language Match** (20 points): Matches songs in the same language (English, Hindi, Marathi, etc.)
- **Scale/Key Relationships** (25 points): 
  - Same key: 100% score
  - Relative major/minor: 90% score
  - Circle of fifths relations: 80% score
  - Same scale type (major/minor): 50% score
- **Time Signature** (20 points):
  - Exact match: 100% score
  - Compatible signatures (6/8↔3/4): 90% score
- **Taal Match** (15 points): Same Indian rhythm pattern
- **Tempo Similarity** (5 points): Calculated using BPM difference (±35 BPM tolerance)
- **Genre Match** (5 points): Non-language genre overlap
- **Vocal Type** (5 points): Male/Female/Duet matching
- **Mood Match** (5 points): Emotional tone similarity

**Filters:**
- Only suggests songs from the same category (New/Old)
- Excludes the current song
- Returns top 20 matches sorted by score (0-100%)

### E. UI/Rendering Functions ([main.js](main.js))

| Function | Parameters | Return Type | Purpose | Called From |
|----------|------------|-------------|---------|-------------|
| `showLoading(percent)` | percent?: Number | void | Show loading overlay with progress | During loading |
| `hideLoading()` | None | void | Hide loading overlay | After loading complete |
| `showNotification(message, typeOrDuration)` | message: String, typeOrDuration: String\|Number | void | Show notification toast | Throughout app |
| `applyTheme(isDark)` | isDark: Boolean | void | Apply light or dark theme with UI updates | Theme toggle, init |
| `toggleTheme()` | None | void | Simple theme toggle for sidebar button | Sidebar theme button |
| `renderGenreOptions(dropdownId)` | dropdownId: String | void | Render genre multiselect options | Multiselect setup |
| `renderMoodOptions(dropdownId)` | dropdownId: String | void | Render mood multiselect options | Multiselect setup |
| `renderArtistOptions(dropdownId)` | dropdownId: String | void | Render artist multiselect options | Multiselect setup |
| `updateCustomDropdownDisplay(value)` | value: String | void | Update custom dropdown display text | Dropdown selection |
| `setupModalClosing()` | None | void | Setup modal close handlers | DOMContentLoaded |
| `setupSuggestedSongsClosing()` | None | void | Setup suggested songs drawer close handlers | DOMContentLoaded |
| `addPanelToggles()` | None | void | Add panel toggle event handlers | init |
| `goBackToSidebar()` | None | void | Return from setlist to sidebar menu | Back button click |
| `renderFavorites()` | None | void | Render favorite songs | Favorites view |
| `createMobileNavButtons()` | None | void | Create mobile navigation buttons UI | init, window resize |
| `addMobileTouchNavigation()` | None | void | Enable touch swipe gestures for navigation | init (mobile only) |

### F. Database Functions ([server.js](server.js))

| Function | Parameters | Return Type | Purpose | Called From |
|----------|------------|-------------|---------|-------------|
| `connectToDatabase()` | None | Promise<void> | Connect to MongoDB | Middleware, startup |
| `authMiddleware(req, res, next)` | Express middleware params | void | Verify JWT authentication | Protected routes |
| `requireAdmin(req, res, next)` | Express middleware params | void | Require admin role | Admin routes |

### G. Utility Functions ([main.js](main.js))

| Function | Parameters | Return Type | Purpose | Called From |
|----------|------------|-------------|---------|-------------|
| `authFetch(url, options)` | url: String, options?: Object | Promise<Response> | Fetch with JWT authentication and timeout | API calls |
| `cachedFetch(endpoint, forceRefresh, retries)` | endpoint, forceRefresh?, retries? | Promise<Response> | Fetch with caching and retry logic | API calls |
| `invalidateCache(cacheKeys)` | cacheKeys: String\|Array | void | Invalidate specific cache entries | After data changes |
| `populateDropdown(id, options, withLabel)` | id, options, withLabel? | void | Populate dropdown with options | Init |
| `setupTapTempo(buttonId, inputId)` | buttonId, inputId | void | Setup tap tempo functionality | Init |
| `setupGenreMultiselect(inputId, dropdownId, selectedId)` | inputId, dropdownId, selectedId | void | Setup genre multiselect | DOMContentLoaded |
| `setupMoodMultiselect(inputId, dropdownId, selectedId)` | inputId, dropdownId, selectedId | void | Setup mood multiselect | DOMContentLoaded |
| `setupArtistMultiselect(inputId, dropdownId, selectedId)` | inputId, dropdownId, selectedId | void | Setup artist multiselect | DOMContentLoaded |
| `setupSearchableMultiselect(inputId, dropdownId, selectedId, dataArray, allowMultiple)` | inputId, dropdownId, selectedId, dataArray, allowMultiple | void | Setup searchable multiselect | Smart setlist modals |
| `transposeChord(chord, semitones)` | chord: String, semitones: Number | String | Transpose chord by semitones | Chord display |
| `extractDistinctChords(lyrics, transposeLevel, manualChords)` | lyrics, transposeLevel?, manualChords? | Array<String> | Extract distinct chords from lyrics | Song display |
| `initScreenWakeLock()` | None | Promise<void> | Initialize screen wake lock | DOMContentLoaded |
| `isCacheFresh(type, timestamp)` | type, timestamp | Boolean | Check if cache is fresh | Cache loading |
| `stringSimilarity(str1, str2)` | str1, str2 | Number | Calculate string similarity (0-1) | Duplicate detection |
| `findDuplicateSongs()` | None | Array | Find duplicate songs | Admin panel |
| `getMoodTags(moodString)` | moodString: String | Array<String> | Parse comma-separated mood string into array | Recommendation system |
| `getMoodMatchScore(mood1, mood2)` | mood1: String, mood2: String | Number | Calculate mood similarity (0-1) | getSuggestedSongs |
| `getVocalTags(genres)` | genres: Array | Array<String> | Extract vocal tags (Male/Female/Duet) from genres | Recommendation system |
| `getVocalMatchScore(genres1, genres2)` | genres1: Array, genres2: Array | Number | Calculate vocal type similarity (0-1) | getSuggestedSongs |
| `getCurrentFilterValues()` | None | Object | Get current filter values from UI | renderSongs |

---

## 4. EVENT LISTENERS

### Main Application Events ([main.js](main.js))

| Element ID/Selector | Event Type | Handler Function | Location | Purpose |
|---------------------|------------|------------------|----------|---------|
| `#loginBtn` | click | showLoginModal | main.js:4126 | Show login modal |
| `#registerBtn` | click | showRegisterModal | main.js:4127 | Show register modal |
| `#logoutBtn` | click | logout | main.js:4128 | Logout user |
| `#loginForm` | submit | async handler | main.js:896 | Handle login form submission |
| `#registerForm` | submit | async handler | main.js:842 | Handle registration form submission |
| `#themeToggle` | click | Theme toggle | main.js:765 | Toggle dark/light theme |
| `#toggle-sidebar` | click | Toggle sidebar | main.js:??  | Show/hide sidebar |
| `#toggle-songs` | click | Toggle songs panel | main.js:?? | Show/hide songs panel |
| `#toggle-all-panels` | click | Toggle all panels | main.js:6965 | Show/hide all panels |
| `#toggleAutoScroll` | click | Toggle auto-scroll | Song preview | Toggle auto-scrolling |
| `#installAppBtn` | click | PWA install handler | main.js:781 | Install PWA |
| `window` | beforeinstallprompt | PWA prompt handler | main.js:771 | Store install prompt |
| `#searchInput` | input | Search handler | Filters row | Filter songs by search |
| `#clearSearch` | click | Clear search | Filters row | Clear search input |
| `.close-modal` | click | Close modal | Multiple modals | Close any modal |
| `document` | DOMContentLoaded | init | main.js:698 | Initialize application |
| `window` | popstate | History handler | main.js:3668 | Handle browser back/forward |

### Setlist Events ([main.js](main.js))

| Element ID/Selector | Event Type | Handler Function | Location | Purpose |
|---------------------|------------|------------------|----------|---------|
| `#addGlobalSetlistBtn` | click | createGlobalSetlist | Sidebar | Create global setlist |
| `#addMySetlistBtn` | click | createMySetlist | Sidebar | Create personal setlist |
| `#addSmartSetlistBtn` | click | Open smart setlist modal | Sidebar | Create smart setlist |
| `.globalSetlistForm` | submit | Create/update global setlist | Modal | Submit global setlist form |
| `.mySetlistForm` | submit | Create/update personal setlist | Modal | Submit personal setlist form |
| `.smartSetlistForm` | submit | Create/update smart setlist | Modal | Submit smart setlist form |
| `#scanSongsBtn` | click | Scan songs | Smart setlist modal | Scan songs with conditions |
| `.setlist-item` | click | Show setlist | Sidebar | Display setlist in main section |
| `.edit-setlist` | click | Edit setlist | Sidebar | Edit setlist |
| `.delete-setlist` | click | Delete setlist | Sidebar | Delete setlist |
| `.remove-from-setlist-btn` | click | Remove song | Setlist display | Remove song from setlist |
| `#setlistDropdown` | change | Load selected setlist | Dropdown | Load setlist on selection |

### Song Events ([main.js](main.js))

| Element ID/Selector | Event Type | Handler Function | Location | Purpose |
|---------------------|------------|------------------|----------|---------|
| `#newSongForm` | submit | Add song | Add song modal | Create new song |
| `#editSongForm` | submit | Update song | Edit song modal | Update existing song |
| `.song-item` | click | showPreview | Songs list | Display song preview |
| `.favorite-btn` | click | toggleFavorite | Song item | Toggle favorite status |
| `.btn-edit` | click | editSong | Song item | Open edit modal |
| `.btn-delete` | click | deleteSong | Song item | Delete song |
| `#NewTab` | click | Switch to New tab | Tabs | Show New category songs |
| `#OldTab` | click | Switch to Old tab | Tabs | Show Old category songs |

### Suggested Songs Drawer Events ([main.js](main.js))

| Element ID/Selector | Event Type | Handler Function | Location | Purpose |
|---------------------|------------|------------------|----------|---------|
| `#toggleSuggestedSongs` | click | Show suggested songs | Song preview | Open AI recommendations drawer |
| `#closeSuggestedSongs` | click | closeSuggestedSongsDrawer | Drawer | Close recommendations drawer |
| `.suggested-song-item` | click | Show song preview | Drawer | Preview suggested song |
| `document` | click | Close drawer (outside) | Global | Close drawer on outside click |
| `document` | keydown (ESC) | closeSuggestedSongsDrawer | Global | Close drawer with ESC key |

### Filter Events ([main.js](main.js))

| Element ID/Selector | Event Type | Handler Function | Location | Purpose |
|---------------------|------------|------------------|----------|---------|
| `#keyFilter` | change | Filter songs | Filters row | Filter by musical key |
| `#genreFilter` | change | Filter songs | Filters row | Filter by genre |
| `#moodFilter` | change | Filter songs | Filters row | Filter by mood |
| `#artistFilter` | change | Filter songs | Filters row | Filter by artist |
| `#sortFilter` | change | Sort songs | Filters row | Sort songs |

### Multiselect Events ([main.js](main.js))

| Element/Pattern | Event Type | Handler Function | Location | Purpose |
|-----------------|------------|------------------|----------|---------|
| Multiselect input | click | Toggle dropdown | Multiselect | Show/hide options |
| Multiselect input | focus | Show dropdown | Multiselect | Show options on focus |
| Multiselect input | input | Filter options | Multiselect | Search/filter options |
| Multiselect option | click | Toggle selection | Dropdown | Select/deselect option |
| `.remove-tag` | click | Remove selection | Selected items | Remove selected item |
| `document` | click | Close dropdowns | Global | Close open dropdowns |
| Multiselect input | keydown | Keyboard navigation | Multiselect | Arrow keys, Enter, Escape |

### Admin Panel Events ([main.js](main.js))

| Element ID/Selector | Event Type | Handler Function | Location | Purpose |
|---------------------|------------|------------------|----------|---------|
| `#adminPanelBtn` | click | showAdminPanelModal | Sidebar | Open admin panel |
| `#userMgmtTab` | click | Switch to user management | Admin panel | Show user management |
| `#weightsTab` | click | Switch to weights | Admin panel | Show recommendation weights |
| `#duplicateDetectionTab` | click | Switch to duplicates | Admin panel | Show duplicate detection |
| `#weightsForm` | submit | Update weights | Admin panel | Save recommendation weights |
| `.mark-admin-btn` | click | markAdmin | User table | Mark user as admin |
| `.remove-admin-btn` | click | removeAdminRole | User table | Remove admin role |

---

## 5. DOM ELEMENT IDS

### Main Layout ([index.html](index.html))

| Element ID | Purpose |
|------------|---------|
| `notification` | Notification toast container |
| `loadingOverlay` | Loading spinner overlay |
| `loadingPercent` | Loading percentage text |
| `songPreview` | Song preview/lyrics display section |
| `toggle-sidebar` | Sidebar toggle button |
| `toggle-songs` | Songs panel toggle button |
| `toggle-all-panels` | Toggle all panels button |
| `toggleAutoScroll` | Auto-scroll toggle button |
| `installAppBtn` | PWA install button |

### Sidebar ([index.html](index.html))

| Element ID | Purpose |
|------------|---------|
| `loginBtn` | Login button |
| `registerBtn` | Register button |
| `logoutBtn` | Logout button |
| `userGreeting` | User greeting display |
| `adminPanelBtn` | Admin panel button |
| `showAll` | Show all songs link |
| `showFavorites` | Show favorites link |
| `themeToggle` | Theme toggle button |
| `addSongBelowFavoritesBtn` | Add song button |
| `totalSongs` | Total songs count |
| `NewCount` | New songs count |
| `OldCount` | Old songs count |

### Setlist Elements ([index.html](index.html))

| Element ID | Purpose |
|------------|---------|
| `setlistDropdown` | Setlist dropdown selector |
| `customSetlistDropdown` | Custom dropdown wrapper |
| `dropdownMainArea` | Dropdown main clickable area |
| `dropdownArrow` | Dropdown arrow |
| `dropdownMenu` | Dropdown menu |
| `dropdownText` | Dropdown text display |
| `globalSetlistHeader` | Global setlist folder header |
| `globalSetlistContent` | Global setlist list container |
| `mySetlistHeader` | Personal setlist folder header |
| `mySetlistContent` | Personal setlist list container |
| `smartSetlistHeader` | Smart setlist folder header |
| `smartSetlistContent` | Smart setlist list container |
| `setlistSection` | Main setlist display section |
| `setlistViewHeader` | Setlist view header |
| `setlistSectionActions` | Setlist action buttons container |
| `NewSetlistTab` | New songs tab in setlist |
| `OldSetlistTab` | Old songs tab in setlist |
| `NewSetlistSongs` | New songs container in setlist |
| `OldSetlistSongs` | Old songs container in setlist |

### Songs Panel ([index.html](index.html))

| Element ID | Purpose |
|------------|---------|
| `NewTab` | New songs tab |
| `OldTab` | Old songs tab |
| `NewContent` | New songs container |
| `OldContent` | Old songs container |
| `searchInput` | Search input field |
| `clearSearch` | Clear search button |
| `searchResults` | Search results container |
| `keyFilter` | Key filter dropdown |
| `genreFilter` | Genre filter dropdown |
| `moodFilter` | Mood filter dropdown |
| `artistFilter` | Artist filter dropdown |
| `sortFilter` | Sort filter dropdown |
| `favoritesSection` | Favorites section |
| `favoritesContent` | Favorites content container |

### Modals ([index.html](index.html))

| Element ID | Purpose |
|------------|---------|
| `loginModal` | Login modal |
| `registerModal` | Registration modal |
| `forgotPasswordModal` | Forgot password modal |
| `otpVerificationModal` | OTP verification modal |
| `addSongModal` | Add song modal |
| `editSongModal` | Edit song modal |
| `deleteSongModal` | Delete song confirmation modal |
| `confirmDeleteAllModal` | Delete all songs confirmation |
| `adminPanelModal` | Admin panel modal |
| `globalSetlistModal` | Global setlist create/edit modal |
| `mySetlistModal` | Personal setlist create/edit modal |
| `smartSetlistModal` | Smart setlist create/edit modal |
| `setlistViewModal` | Setlist view modal |
| `confirmDeleteSetlistModal` | Delete setlist confirmation |
| `addManualSongModal` | Add manual song to setlist modal |

### Suggested Songs Drawer ([index.html](index.html))

| Element ID | Purpose |
|------------|---------|
| `suggestedSongsDrawer` | AI recommendations drawer container |
| `suggestedSongsContent` | Suggested songs list container |
| `toggleSuggestedSongs` | Toggle button for recommendations drawer |
| `closeSuggestedSongs` | Close button inside drawer |

**Features:**
- Displays top 20 AI-recommended songs based on current song
- Shows match score (0-100%) for each suggestion
- Displays key, tempo, time signature, taal, and mood metadata
- Click any suggestion to preview that song
- Opens/closes with animation from right side
- Closes on ESC key or outside click

### Form Fields ([index.html](index.html))

| Element ID | Purpose |
|------------|---------|
| `songTitle` | Song title input (add) |
| `songCategory` | Song category select (add) |
| `songKey` | Song key select (add) |
| `songArtist` | Song artist multiselect (add) |
| `songMood` | Song mood multiselect (add) |
| `songTempo` | Song tempo input (add) |
| `songTime` | Song time signature select (add) |
| `songTaal` | Song taal select (add) |
| `songGenre` | Song genre multiselect (add) |
| `songLyrics` | Song lyrics textarea (add) |
| `editSongTitle` | Song title input (edit) |
| `editSongCategory` | Song category select (edit) |
| `editSongKey` | Song key select (edit) |
| `editSongArtist` | Song artist multiselect (edit) |
| `editSongMood` | Song mood multiselect (edit) |
| `editSongTempo` | Song tempo input (edit) |
| `editSongTime` | Song time signature select (edit) |
| `editSongTaal` | Song taal select (edit) |
| `editSongGenre` | Song genre multiselect (edit) |
| `editSongLyrics` | Song lyrics textarea (edit) |

---

## 6. DATA STRUCTURES

### Song Object
```javascript
{
  id: Number,                    // Unique song ID
  _id: String,                   // MongoDB ObjectId
  title: String,                 // Song title
  category: String,              // "New" or "Old"
  key: String,                   // Musical key (e.g., "C", "Am")
  tempo: String,                 // Tempo in BPM (e.g., "120 BPM")
  time: String,                  // Time signature (e.g., "4/4")
  timeSignature: String,         // Alternate time signature field
  taal: String,                  // Indian rhythm pattern
  genre: String,                 // Comma-separated genres (legacy)
  genres: Array<String>,         // Array of genres
  artist: String,                // Artist name
  artistDetails: String,         // Detailed artist info
  originalArtist: String,        // Original artist
  mood: String,                  // Comma-separated moods
  lyrics: String,                // Song lyrics with chords
  songNumber: Number,            // Song number
  createdBy: String,             // Creator name
  createdAt: String,             // ISO timestamp
  updatedBy: String,             // Last updater name
  updatedAt: String,             // ISO timestamp
  isManualEntry: Boolean,        // True if manual setlist entry
  manualChords: String           // Manually entered chords
}
```

### Global Setlist Object
```javascript
{
  _id: String,                   // MongoDB ObjectId
  name: String,                  // Setlist name
  description: String,           // Setlist description
  songs: Array<Number|Object>,   // Song IDs or manual song objects
  songTransposes: Object,        // Map of songId -> transpose level
  createdBy: String,             // Creator name
  createdAt: String,             // ISO timestamp
  updatedBy: String,             // Last updater name
  updatedAt: String              // ISO timestamp
}
```

### Personal Setlist Object
```javascript
{
  _id: String,                   // MongoDB ObjectId
  name: String,                  // Setlist name
  description: String,           // Setlist description
  songs: Array<Number|Object>,   // Song IDs or manual song objects
  userId: String,                // Owner user ID
  createdBy: String,             // Creator name
  createdAt: String,             // ISO timestamp
  updatedBy: String,             // Last updater name
  updatedAt: String              // ISO timestamp
}
```

### Smart Setlist Object
```javascript
{
  _id: String,                   // Smart setlist ID (smart_timestamp)
  id: String,                    // Alternate ID
  name: String,                  // Smart setlist name
  description: String,           // Smart setlist description
  conditions: {                  // Scan conditions
    keys: Array<String>,         // Musical keys
    tempoMin: Number,            // Min tempo
    tempoMax: Number,            // Max tempo
    times: Array<String>,        // Time signatures
    taals: Array<String>,        // Taals
    moods: Array<String>,        // Moods
    genres: Array<String>,       // Genres
    categories: Array<String>    // Categories
  },
  songs: Array<Object>,          // Scanned songs (simplified)
  createdBy: String,             // Creator user ID
  createdByUsername: String,     // Creator username
  isAdminCreated: Boolean,       // True if created by admin
  createdAt: String,             // ISO timestamp
  updatedAt: String              // ISO timestamp
}
```

### User Object
```javascript
{
  _id: String,                   // MongoDB ObjectId
  firstName: String,             // First name
  lastName: String,              // Last name
  username: String,              // Username (lowercase)
  email: String,                 // Email (lowercase)
  phone: String,                 // Phone number
  password: String,              // Hashed password
  isAdmin: Boolean,              // Admin role flag
  createdAt: String              // ISO timestamp
}
```

### User Data Object
```javascript
{
  _id: String,                   // User ID
  favorites: Array<Number>,      // Favorite song IDs
  name: String,                  // User name
  email: String,                 // User email
  transpose: Object,             // Map of songId -> transpose level
  firstName: String,             // First name
  lastName: String,              // Last name
  Activitydate: String           // Last activity timestamp
}
```

---

## 7. CODE ISSUES FOUND

### Potential Bugs

1. **Duplicate Variable Declarations** ✅ FIXED ([main.js](main.js))
   - `jwtToken` had 4 local redeclarations shadowing the global variable
   - **Impact:** Medium - Can cause unexpected behavior with stale tokens
   - **Solution:** ✅ COMPLETED - Removed all local redeclarations, now uses global variable
   - **Note:** `isDarkMode` only has one declaration with multiple re-assignments (correct behavior)

2. **Missing Null Checks** ([main.js](main.js))
   - `currentViewingSetlist` accessed without null check in some functions
   - **Impact:** Medium - Could cause runtime errors
   - **Solution:** Add null checks before accessing properties

3. **Inconsistent Song ID Format** ✅ FIXED ([server.js](server.js), [main.js](main.js))
   - Songs sometimes use `id` (Number), sometimes `_id` (String)
   - Setlists store both formats
   - **Impact:** High - Can cause songs not to match
   - **Solution:** Standardize on single ID format
   - **Status:** ✅ COMPLETED - See [MIGRATION_SONG_ID_FIX.md](MIGRATION_SONG_ID_FIX.md) Issue #1

4. **Race Conditions in Cache Updates** ([main.js](main.js))
   - Multiple async functions updating cache simultaneously
   - **Impact:** Medium - Can cause stale data
   - **Solution:** Implement queue or mutex for cache updates

5. **Manual Song Duplicate Detection** ([main.js](main.js:5124)
   - Complex duplicate checking logic that may miss edge cases
   - **Impact:** Low - Users can add duplicate manual songs
   - **Solution:** Normalize title comparison

### Unused Variables

1. **socket** ([main.js](main.js:3550)) - WebSocket variable declared but not used
2. **lastSongsFetch** ([main.js](main.js:3551)) - Declared but never used
3. **isAnyModalOpen** ([main.js](main.js:11455)) - Declared but not consistently used
4. **userDataSaveQueue** ([main.js](main.js:11457)) - Declared but queue not implemented properly

### Duplicate Code

1. **Multiselect Setup** ✅ COMPLETED ([main.js](main.js))
   - `setupGenreMultiselect`, `setupMoodMultiselect`, `setupArtistMultiselect` had 97% similar code (732 lines)
   - **Solution:** ✅ COMPLETED - Extracted to single generic `setupSearchableMultiselect` function
   - **Status:** ✅ All three multiselects now use generic function - See [MIGRATION_SONG_ID_FIX.md](MIGRATION_SONG_ID_FIX.md) Issue #2
   - **Impact:** Removed 732 lines of duplicate code (-6.2% file size reduction)

2. **Setlist Rendering** ✅ COMPLETED ([main.js](main.js))
   - `renderGlobalSetlists`, `renderMySetlists`, `renderSmartSetlists` had 85% similar code
   - **Solution:** ✅ COMPLETED - Extracted to single generic `renderSetlists` function
   - **Status:** ✅ All three setlist types now use generic function with configuration objects
   - **Impact:** Removed ~167 lines of duplicate code, improved maintainability
   - **Features preserved:** Permission checking, mobile touch support, refresh button (smart), conditional messages

3. **Modal Opening/Closing** ([main.js](main.js), [index.html](index.html))
   - Repetitive modal open/close logic
   - **Solution:** Create generic modal handler

### Missing Error Handling

1. **API Calls Without Try-Catch** ([main.js](main.js))
   - Some fetch calls don't handle network errors
   - **Impact:** Medium - Can crash app on network failure
   - **Solution:** Add try-catch blocks

2. **localStorage Access** ([main.js](main.js))
   - Some localStorage accesses without try-catch (quota exceeded)
   - **Impact:** Low - Can cause errors in private mode
   - **Solution:** Wrap in try-catch

3. **JSON Parsing** ([main.js](main.js))
   - Some JSON.parse calls without error handling
   - **Impact:** Medium - Can crash on corrupted data
   - **Solution:** Add try-catch with fallbacks

### Performance Concerns

1. **Large Songs Array Rendering** ([main.js](main.js))
   - Rendering 500+ songs without virtualization
   - **Impact:** High - Slow on large datasets
   - **Solution:** Implement virtual scrolling or pagination

2. **Frequent localStorage Updates** ([main.js](main.js))
   - Saving to localStorage on every change
   - **Impact:** Medium - Can slow down on large data
   - **Solution:** Debounce or batch updates

3. **Duplicate Detection Algorithm** ([main.js](main.js:4329))
   - O(n²) algorithm for finding duplicates
   - **Impact:** High - Very slow on 1000+ songs
   - **Solution:** Already has optimization with grouping, but could use better hashing

4. **No Request Cancellation** ([main.js](main.js))
   - No abort controller for cancelled requests
   - **Impact:** Medium - Wasted bandwidth
   - **Solution:** Implement request cancellation (already has timeout, add cancel on navigation)

### Security Issues

1. **JWT Storage in localStorage** ([main.js](main.js))
   - JWT tokens stored in localStorage (XSS vulnerable)
   - **Impact:** High - Tokens can be stolen via XSS
   - **Solution:** Consider httpOnly cookies or secure storage

2. **Admin Panel Access** ([main.js](main.js), [server.js](server.js))
   - Admin functions exposed in client code
   - **Impact:** Low - Server-side validation exists
   - **Note:** Server properly validates admin role

3. **No Rate Limiting Client-Side** ([main.js](main.js))
   - No throttling on API calls
   - **Impact:** Low - Could abuse server
   - **Solution:** Implement client-side debouncing

---

## 8. DEPENDENCIES

### Backend Dependencies ([package.json](package.json))

| Package | Version | Purpose |
|---------|---------|---------|
| `express` | ^4.17.1 | Web server framework |
| `cors` | ^2.8.5 | Cross-origin resource sharing |
| `mongodb` | ^6.0.0 | MongoDB database driver |
| `bcryptjs` | ^2.4.3 | Password hashing |
| `jsonwebtoken` | ^9.0.2 | JWT token generation/verification |
| `express-jwt` | ^8.5.1 | JWT middleware for Express |
| `jwks-rsa` | ^3.2.0 | JWKS retrieval for JWT verification |
| `dotenv` | ^16.6.1 | Environment variable management |
| `nodemailer` | ^7.0.6 | Email sending for OTP |
| `twilio` | ^5.10.2 | SMS sending for OTP |

### Frontend Dependencies (CDN)

| Library | Purpose |
|---------|---------|
| Font Awesome 5.15.4 | Icons throughout the application |

### Development Environment

- **Node.js**: Version 22.x
- **MongoDB**: Version 6.0+
- **Browser Requirements**: ES6+ support, Service Worker support for PWA

### External Services

1. **MongoDB Atlas** - Cloud database hosting
2. **Vercel** - Application hosting
3. **Twilio** (optional) - SMS OTP delivery
4. **Email Service** (via nodemailer) - Email OTP delivery

### PWA Requirements

- Service Worker (`service-worker.js`)
- Web App Manifest (`manifest.json`)
- HTTPS for production deployment

---

## NOTES

### Code Organization

- **Total Lines**: ~11,185 lines in [main.js](main.js) after cleanup (reduced from ~11,693)
- **Recommendation**: Consider splitting into modules:
  - `auth.js` - Authentication functions
  - `setlists.js` - Setlist management
  - `songs.js` - Song CRUD operations
  - `ui.js` - UI rendering and interactions
  - `cache.js` - Caching and data management

### Recent Major Changes History

Based on backup files and migration documents, major changes include:
1. **Song ID Standardization** (Feb 13, 2026) - Standardized on numeric `song.id`
2. **Multiselect Code Consolidation** (Feb 13, 2026) - Reduced 732 lines of duplicate code
3. **Migration of genres to moods system** - Enhanced song categorization
4. **Smart setlist implementation** - Dynamic setlist generation based on conditions
5. **Improved caching mechanism** - Better performance with cache validation
6. **Admin panel for user management** - User role management interface
7. **OTP-based password reset** - Enhanced security features
8. **Code cleanup and error handling** (Feb 14, 2026) - Removed unused variables, added try-catch blocks
9. **UI consistency improvements** (Feb 14, 2026) - Standardized delete confirmations

---

## 9. MIGRATION & CONSOLIDATION HISTORY

### Issue #1: Song ID Standardization ✅ COMPLETED
**Date:** February 13, 2026  
**Problem:** Inconsistent song identifier usage (`song.id` vs `song._id`)  
**Solution:** Standardized on `song.id` (numeric integer) as primary identifier  
**Impact:** Fixed song matching in setlists, prevented data corruption  
**Files Modified:** main.js, server.js  

### Issue #2: Multiselect Code Consolidation ✅ COMPLETED  
**Date:** February 13, 2026  
**Problem:** 97% identical code across 3 multiselect functions (732 lines total)  
**Functions:** `setupGenreMultiselect()`, `setupMoodMultiselect()`, `setupArtistMultiselect()`  
**Solution:** Consolidated into generic `setupSearchableMultiselect()` function  
**Impact:** 6.2% file size reduction, improved maintainability  

### Issue #3: Setlist Rendering Consolidation ✅ COMPLETED
**Date:** February 14, 2026  
**Problem:** 85% similar code across 3 setlist rendering functions  
**Functions:** `renderGlobalSetlists()`, `renderMySetlists()`, `renderSmartSetlists()`  
**Solution:** Created generic `renderSetlists()` with configuration objects  
**Impact:** ~167 lines removed, consistent behavior preserved  

### Issue #4: Variable Declaration Cleanup ✅ COMPLETED
**Date:** February 14, 2026  
**Problem:** Local variable redeclarations shadowing global variables  
**Variables:** 4 instances of local `jwtToken` declarations  
**Solution:** Removed all local redeclarations, use global variables  
**Impact:** Fixed authentication token staleness issues  

### Issue #5: Unused Code Removal ✅ COMPLETED
**Date:** February 14, 2026  
**Problem:** Dead code and unused variables cluttering codebase  
**Removed:** `socket`, `lastSongsFetch`, `isAnyModalOpen`, `connectWebSocket()`  
**Solution:** Thorough analysis and removal of unused declarations  
**Impact:** Cleaner codebase, reduced developer confusion  

---

## 10. ERROR HANDLING IMPROVEMENTS

### Try-Catch Coverage Added (February 14, 2026)

**JSON.parse Operations:**
- Search history parsing - Line 6062
- Button position restoration - Line 10584
- User data parsing - Multiple locations

**localStorage Access:**
- Theme preferences - Lines 826-833, 844-850
- Authentication data - Lines 977-983, 5121-5128  
- Settings storage - Lines 9191-9200, 1717-1721
- Cache operations - Lines 268-278, 436-442, 687-693

**Benefits:**
- Prevents crashes in private browsing mode
- Graceful degradation when storage quota exceeded
- Better user experience with fallback values
- Console warnings for debugging without breaking functionality

---

## 11. UI CONSISTENCY STANDARDS

### Delete Confirmation Modal Standards (February 14, 2026)

**Standard Structure:**
```html
<div class="modal" id="[name]Modal">
    <div class="modal-content">
        <span class="close-modal">×</span>
        <h3>Confirm Delete [Item]</h3>
        <div class="[type]-form">
            <p id="[name]Message">Confirmation message...</p>
            <div class="modal-actions">
                <button class="btn btn-secondary" id="cancel[Action]">Cancel</button>
                <button class="btn btn-danger" id="confirm[Action]">Delete</button>
            </div>
        </div>
    </div>
</div>
```

**Implemented Consistently:**
- Song deletion: `deleteSongModal`
- Global setlist deletion: `confirmDeleteSetlistModal`
- Personal setlist deletion: `confirmDeleteSetlistModal`
- Smart setlist deletion: `confirmDeleteSetlistModal` ✅ FIXED
- Admin role removal: `confirmRemoveAdminModal` ✅ NEW

**Button Classes Standardized:**
- Cancel: `btn btn-secondary` 
- Delete: `btn btn-danger`
- Container: `modal-actions` class

---

## 12. TESTING RECOMMENDATIONS

### Unit Testing
1. **Core Functions**: transpose, chord extraction, string similarity
2. **Utility Functions**: JWT validation, cache validation, data formatting
3. **Multiselect Logic**: Search filtering, selection management
4. **Error Handling**: Try-catch block coverage, fallback behaviors

### Integration Testing
1. **API Endpoints**: All CRUD operations for songs, setlists, users
2. **Authentication Flow**: Login, logout, token refresh, password reset
3. **Cache Management**: Cache invalidation, refresh mechanisms
4. **Admin Operations**: User management, weight configuration

### End-to-End Testing  
1. **Critical User Flows**: Login → Create song → Add to setlist → View preview
2. **Mobile Experience**: Touch interactions, responsive design, auto-scroll
3. **PWA Features**: Install prompt, offline behavior, service worker
4. **Error Scenarios**: Network failures, storage quota exceeded

### Performance Testing
1. **Large Datasets**: 1000+ songs rendering, search performance
2. **Memory Usage**: Long sessions, memory leaks, cleanup
3. **Network Performance**: API response times, cache effectiveness
4. **Mobile Performance**: Touch responsiveness, scroll performance

---

## 13. ARCHITECTURE & FUTURE IMPROVEMENTS

### Recommended Architecture Changes
1. **Module Splitting**: Break main.js into logical modules
   - `auth.js` - Authentication functions
   - `setlists.js` - Setlist management  
   - `songs.js` - Song CRUD operations
   - `ui.js` - UI rendering and interactions
   - `cache.js` - Caching and data management
   - `utils.js` - Utility functions

2. **State Management**: Consider implementing centralized state management
3. **Event System**: Implement pub/sub for component communication
4. **API Layer**: Create dedicated API service layer

### Performance Improvements
1. **Virtual Scrolling**: For large song lists (1000+ songs)
2. **Request Cancellation**: Implement AbortController for cancelled requests  
3. **Debounced Operations**: Better batching of localStorage updates
4. **Memory Optimization**: Implement cleanup for long-running sessions

### Feature Enhancements  
1. **Offline Support**: Service Worker caching for offline functionality
2. **Real-time Collaboration**: WebSockets for multiple users
3. **Advanced Recommendations**: ML-based song suggestions
4. **Audio Integration**: Playback controls and tempo detection
5. **Import/Export**: Standard formats (ChordPro, OpenSong)
6. **Version Control**: Song history and change tracking
7. **Analytics**: Usage statistics and performance metrics

### Security Enhancements
1. **Token Storage**: Move from localStorage to httpOnly cookies
2. **Rate Limiting**: Client-side request throttling
3. **Input Validation**: Enhanced client-side validation
4. **CSRF Protection**: Cross-site request forgery prevention

---

## 14. PROJECT OVERVIEW

### Application Purpose
**Old & New Songs** - A comprehensive web application for managing song collections, setlists, and musical performances. Designed for musicians, worship teams, and music directors who need organized access to lyrics, chord charts, and setlist management.

### Key Features
- **Song Management**: Add, edit, delete songs with lyrics, chords, and metadata
- **Smart Setlists**: Dynamic setlist generation based on musical criteria  
- **Personal & Global Setlists**: User-specific and admin-managed setlists
- **Chord Transposition**: Real-time key changes with chord detection
- **Auto-scroll**: Automated lyrics scrolling with speed control
- **Admin Panel**: User management and system configuration
- **PWA Support**: Offline functionality and mobile app experience
- **Responsive Design**: Desktop and mobile optimized interface

### Technology Stack
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with MongoDB Atlas
- **Hosting**: Vercel (frontend), MongoDB Atlas (database)
- **Authentication**: JWT tokens with OTP reset
- **PWA**: Service Worker, Web App Manifest

### File Structure
```
├── main.js                 # Core application logic (~11,185 lines)
├── server.js              # Backend API server  
├── index.html             # Main HTML structure
├── styles.css             # Application styles
├── service-worker.js      # PWA service worker
├── manifest.json          # PWA manifest
├── spinner.html           # Loading overlay
├── api/
│   └── index.js          # Vercel API routes
├── utils/
│   └── auth.js           # Authentication utilities
└── backups/              # Code backups
```

---

**Document End - Last Updated: February 14, 2026 - Comprehensive Single Source of Truth**
