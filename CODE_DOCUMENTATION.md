# CODE DOCUMENTATION - SINGLE SOURCE OF TRUTH

**Old & New Songs Application**  
**Generated:** February 13, 2026  
**Last Updated:** February 14, 2026  
**Version:** 1.1

---

## RECENT CHANGES (February 14, 2026)

### Completed Fixes

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

### Code Metrics
- **Total Lines Removed:** ~900 lines of duplicate code
- **File Size Reduction:** ~8% reduction in main.js
- **Issues Resolved:** 4 major issues fixed
- **Bugs Fixed:** Authentication token staleness, button visibility

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

### D. UI/Rendering Functions ([main.js](main.js))

| Function | Parameters | Return Type | Purpose | Called From |
|----------|------------|-------------|---------|-------------|
| `showLoading(percent)` | percent?: Number | void | Show loading overlay with progress | During loading |
| `hideLoading()` | None | void | Hide loading overlay | After loading complete |
| `showNotification(message, typeOrDuration)` | message: String, typeOrDuration: String\|Number | void | Show notification toast | Throughout app |
| `applyTheme(isDark)` | isDark: Boolean | void | Apply light or dark theme | Theme toggle, init |
| `renderGenreOptions(dropdownId)` | dropdownId: String | void | Render genre multiselect options | Multiselect setup |
| `renderMoodOptions(dropdownId)` | dropdownId: String | void | Render mood multiselect options | Multiselect setup |
| `renderArtistOptions(dropdownId)` | dropdownId: String | void | Render artist multiselect options | Multiselect setup |
| `updateCustomDropdownDisplay(value)` | value: String | void | Update custom dropdown display text | Dropdown selection |
| `setupModalClosing()` | None | void | Setup modal close handlers | DOMContentLoaded |
| `setupSuggestedSongsClosing()` | None | void | Setup suggested songs drawer close handlers | DOMContentLoaded |
| `addPanelToggles()` | None | void | Add panel toggle event handlers | init |
| `goBackToSidebar()` | None | void | Return from setlist to sidebar menu | Back button click |
| `renderFavorites()` | None | void | Render favorite songs | Favorites view |

### E. Database Functions ([server.js](server.js))

| Function | Parameters | Return Type | Purpose | Called From |
|----------|------------|-------------|---------|-------------|
| `connectToDatabase()` | None | Promise<void> | Connect to MongoDB | Middleware, startup |
| `authMiddleware(req, res, next)` | Express middleware params | void | Verify JWT authentication | Protected routes |
| `requireAdmin(req, res, next)` | Express middleware params | void | Require admin role | Admin routes |

### F. Utility Functions ([main.js](main.js))

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

- **Total Lines**: ~11,693 lines in [main.js](main.js) alone
- **Recommendation**: Consider splitting into modules:
  - `auth.js` - Authentication functions
  - `setlists.js` - Setlist management
  - `songs.js` - Song CRUD operations
  - `ui.js` - UI rendering and interactions
  - `cache.js` - Caching and data management

### Recent Changes

Based on backup files, recent major changes include:
1. Migration of genres to moods system
2. Smart setlist implementation
3. Improved caching mechanism
4. Added admin panel for user management
5. Implemented OTP-based password reset

### Testing Recommendations

1. Add unit tests for core functions (transpose, chord extraction)
2. Integration tests for API endpoints
3. E2E tests for critical user flows
4. Performance testing with large datasets (1000+ songs)

### Future Improvements

1. Implement virtual scrolling for large song lists
2. Add offline support with Service Worker caching
3. Implement real-time collaboration using WebSockets
4. Add song recommendations based on listening history
5. Export/import setlists in standard formats
6. Add audio playback integration
7. Implement song versioning/history

---

**Document End**
