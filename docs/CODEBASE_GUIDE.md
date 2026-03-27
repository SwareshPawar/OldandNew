# Codebase Guide

Generated: 2026-03-27

This is one of the three canonical documentation files for the current codebase.

- Architecture and runtime overview: this document
- Exhaustive per-file function inventory: docs/FUNCTION_INVENTORY.md
- Duplication, structural issues, and cleanup backlog: docs/CODE_ISSUES_AND_DUPLICATION.md

## Coverage

- Active JavaScript files analyzed: 70
- Function inventory baseline: 594 extracted functions and methods before Phase 2 shared-helper extraction
- Largest file: main.js with 276 declared functions

Backups under backups/ were excluded from the active inventory.

## System Overview

The application is a single-page song management system with a Node/Express backend and MongoDB persistence. It combines several concerns in one repo:

- Song catalog management
- Authentication and password reset
- Global, personal, and smart setlists
- Chord normalization and transposition
- Rhythm-set assignment and recommendation workflows
- Rhythm loop playback and melodic pads
- Admin upload and mapping tools
- Minimal PWA install support

## Runtime Architecture

### Frontend Entry Point

main.js is the primary browser runtime. It owns application bootstrap, cache hydration, authentication state, DOM wiring, song rendering, preview, setlist flows, transpose logic, recommendation weights, admin panel logic, password reset modals, and several mobile-specific interactions.

The browser runtime now also includes shared core utilities loaded ahead of page scripts:

- scripts/core/api-base.js
  - Central API base URL resolution across local, GitHub Pages, and same-origin deployments
- scripts/core/auth-client.js
  - Shared token access, auth header construction, timeout-aware authFetch, and centralized 401 handling hooks
- scripts/shared/admin-page.js
  - Shared admin-page alerts, auth-warning banner helpers, and audio-preview controller for standalone upload/manager pages
- scripts/shared/rhythm-set.js
  - Shared browser rhythm-family normalization, category normalization, and rhythm-set ID parsing/building helpers
- scripts/shared/chord-normalization.js
  - Shared browser key and chord accidental normalization used by main.js
- scripts/shared/dom.js
  - Shared DOM/UI helpers extracted from main.js: modal open/close/setup, suggested-songs drawer close handling, search-history persistence/display, and highlightText. Exposes window.DOMHelpers with 9 functions via getDomDeps()-driven dependency injection
- scripts/features/auth-ui.js
  - Auth UI domain logic (login/register/logout button-state handling) extracted from main.js
- scripts/features/password-reset.js
  - Password reset OTP flow logic extracted from main.js with compatibility wrappers retained
- scripts/features/songs-ui.js
  - Songs list loading/count/render logic extracted from main.js with compatibility wrappers retained
- scripts/features/song-crud-ui.js
  - Song edit/delete modal logic, edit submit/update flow, delete confirmation/cancel handling, and delete API flow extracted from main.js with compatibility wrappers retained
- scripts/features/song-preview-ui.js
  - Song preview orchestration, chord-formatting, transpose helpers, auto-scroll handlers, and playback-adjacent UI helpers (applyLyricsBackground, floating stop button) extracted from main.js with compatibility wrappers retained
- scripts/features/setlists.js
  - Setlist management UI extracted from main.js: custom dropdown behavior, song selection state, global/personal setlist loading and rendering, setlist CRUD, song add/remove flows, and preview/setlist button-state synchronization. Exposes window.SetlistsUI with 51 functions via getSetlistDeps()-driven dependency injection and runtime global registration for removeFromSetlist
- scripts/features/smart-setlists.js
  - Smart setlist UI extracted from main.js: server-backed smart setlist loading, multiselect condition setup, scan-result rendering, smart setlist CRUD/update flows, and smart modal/listener initialization. Exposes window.SmartSetlistsUI with 19 functions via getSmartSetlistDeps()-driven dependency injection
- scripts/features/rhythm-sets.js
  - Rhythm-set admin-tab UI extracted from main.js: table rendering, create/save/recompute flows, and rhythm-set tab/form/table listener initialization. Exposes window.RhythmSetsUI with 7 functions via getRhythmSetsDeps()-driven dependency injection
- scripts/features/admin-ui.js
  - Admin panel UI extracted from main.js: user management fetch/render/role updates, recommendation-weight fetch/save/form sync, modal/tab initialization, and runtime global registration for markAdmin/removeAdminRole. Exposes window.AdminUI with 13 functions via getAdminUIDeps()-driven dependency injection
- scripts/features/mobile-ui.js
  - Mobile and panel UI helpers extracted from main.js: responsive mobile navigation buttons, touch navigation gestures, draggable panel toggles, and panel position recomputation. Exposes window.MobileUI with 5 functions via getMobileUIDeps()-driven dependency injection

Important responsibilities in main.js:

- Bootstrap and app lifecycle
  - performInitialization
  - loadSongsWithProgress
  - addEventListeners
  - setupModals
  - setupWindowCloseConfirmation
- Auth and session state
  - authFetch
  - login
  - logout
  - isJwtValid
  - updateAuthButtons
- Songs and filtering
  - renderSongs
  - filterAndDisplaySongs
  - editSong
  - deleteSongById
  - loadSongsFromFile
- Setlists
  - loadGlobalSetlists
  - loadMySetlists
  - loadSmartSetlistsFromServer
  - createGlobalSetlist
  - createMySetlist
  - createSmartSetlistWithSongs
- Preview and music tools
  - showPreview
- Rhythm-set integration
  - loadRhythmSets
  - createRhythmSetFromForm
  - renderRhythmSetsTable
  - updateRhythmSetIdPreview
- Password reset
  - initiatePasswordReset
  - verifyOtpAndResetPassword
  - resendOtp

main.js is not just a view layer. It currently behaves as a frontend application shell, controller layer, client-side cache layer, and significant portion of admin UI logic.

### Backend API

server.js is the backend core. It configures Express, MongoDB connection lifecycle, file uploads, static hosting, CORS, and all API endpoints.

Shared backend utilities now used by server-side flows:

- utils/chord-normalization.js
  - Canonical key, manual-chord, and lyrics normalization shared by server.js and migrate-chord-accidentals.js
- utils/rhythm-set.js
  - Canonical rhythm family/category normalization and rhythm-set ID parsing/building shared by server.js

Primary server responsibilities:

- Database connection and collection initialization
- Auth middleware and admin enforcement
- Song CRUD and batch operations
- Global, personal, and smart setlist APIs
- Recommendation weights APIs
- Rhythm-set CRUD and recomputation
- Loop metadata read/write and file upload/delete
- Melodic loop upload/delete
- User profile and admin-role management
- Song metadata endpoint used by admin upload pages

Primary collections inferred from code:

- OldNewSongs
- DeletedSongs
- RhythmSets
- Users
- PasswordResetOTPs
- UserData
- GlobalSetlists
- MySetlists
- SmartSetlists

### Authentication Subsystem

utils/auth.js contains auth-specific helpers:

- registerUser
- authenticateUser
- verifyToken
- generateOTP
- storeOTP
- verifyOTP
- sendEmailOTP
- sendSMSOTP
- resetUserPassword

The backend validates JWT_SECRET on startup and signs 7-day JWTs. The frontend stores the JWT in localStorage and rehydrates session state from localStorage on boot.

### Loop Playback Subsystem

The active loop playback stack is pad-based.

- loop-player-pad.js
  - Active audio engine
  - Web Audio playback
  - Loop switching
  - Melodic pad playback and crossfade scheduling
- loop-player-pad-ui.js
  - UI integration and song-to-loop-set resolution
  - Metadata loading and cache invalidation
  - Loop-player visibility logic
- loop-player-pad-soundtouch.js
  - Alternate engine path with SoundTouch-based tempo control
- loop-player-pad-tonejs.js
  - Alternate engine path using Tone.js patterns

Legacy loop playback files still present:

- loop-player.js
- loop-player-ui.DEPRECATED.js

Those files document earlier playback approaches and should not be treated as the primary runtime unless code references explicitly confirm otherwise.

### Loop and Rhythm Admin Tools

- loop-manager.js
  - Rhythm loop upload and replacement UI
  - Reads /api/song-metadata and /api/loops/metadata
  - Builds filename previews and loop table views
- loop-rhythm-manager.js
  - Standalone rhythm-set management workspace
  - Handles read-only fallback, quick-play, slot rendering, create/edit/delete flows
- melodic-loops-manager.js
  - Melodic pad upload and replacement UI by key
- rhythm-mapper.js
  - Song-to-rhythm-set assignment page for batch mapping

Standalone admin pages now consistently load scripts/core/api-base.js and scripts/core/auth-client.js, with shared alert rendering through scripts/shared/admin-page.js (and scripts/shared/rhythm-set.js where rhythm-set helpers are required). Unauthenticated mode now enforces explicit read-only behavior on loop, loop-rhythm, and melodic managers by blocking write actions while leaving browse/preview paths available, and protected mutations now run through shared AppAuth authFetch-style request handling for consistent error behavior (including rhythm-mapper assignment/unassignment flows).

Initial Phase 6 hardening has started on standalone admin pages: high-risk dynamic HTML interpolation in loop and melodic list rendering now escapes metadata values, loop-manager action controls bind handlers through DOM event listeners (instead of string-interpolated inline actions), and rhythm-mapper row rendering now coerces song IDs before inline handler interpolation.

Phase 6 continuation also hardens loop-rhythm-manager rendered handlers by using encoded payload transport for dynamic rhythm set identifiers/filenames and sanitized slot-id token generation for dynamic DOM ids.

Phase 6 also replaces loop-rhythm-manager player status innerHTML updates with a safe status helper that writes icon nodes plus textContent-based messages.

Phase 6 now also migrates loop-rhythm-manager rhythm-set table action controls (play/edit/delete) from inline onclick markup to DOM-created buttons with event listeners.

Phase 6 also migrates loop-rhythm-manager slot interactions (play/remove/upload/test and drop-zone behavior) to data-attribute driven DOM event binding helpers.

Phase 6 also migrates loop-rhythm-manager player controls generated by createSimplePlayerUI (pad buttons, sliders, auto-fill toggle, start/stop controls) to bindPlayerUIControls DOM event wiring.

Phase 6 additionally migrates loop-rhythm-manager rhythm-set main/details table row shells to direct DOM node construction for core cells instead of string-assembled row HTML.

Phase 6 is now complete: loop-rhythm-manager renderLoopSlots has been fully refactored to return a DocumentFragment built via createElement/textContent/data-attributes — there are no remaining HTML-string injection surfaces with dynamic user data in loop-rhythm-manager.js.

Related HTML pages:

- loop-manager.html
- loop-rhythm-manager.html
- melodic-loops-manager.html
- rhythm-mapper.html

### Serverless Entry

api/index.js is only a thin wrapper that exports server.js for serverless deployment.

### PWA Layer

service-worker.js is minimal. It calls skipWaiting during install and defines an empty fetch handler. It provides installability support, but not a real offline caching strategy.

### Legacy Runtime Note

Current runtime entry points load loop-player-pad.js and loop-player-pad-ui.js. Phase 5 reference audit found no direct runtime references from active HTML/JS files to loop-player-ui.DEPRECATED.js, loop-player.js, loop-player-pad-soundtouch.js, loop-player-pad-tonejs.js, rhythm-sets-manager.js, or rhythm-sets-manager.html.old. These files are now archived under legacy/runtime/.

## Data and File Flow

### Song and Setlist Data

1. main.js boots and restores localStorage state.
2. main.js calls backend APIs through authFetch or cachedFetch.
3. server.js reads and writes MongoDB documents.
4. Results are cached in window.dataCache and reflected into the DOM.

### Rhythm-Set Flow

1. Songs carry rhythmFamily, rhythmSetNo, and rhythmSetId.
2. server.js exposes rhythm-set CRUD and recommendation endpoints.
3. loop-rhythm-manager.js and rhythm-mapper.js manage admin mapping workflows.
4. loop-player-pad-ui.js resolves a song's usable loop set.
5. loop-player-pad.js loads and plays the mapped loop files.

### Loop Metadata Flow

1. Loop uploads are stored in uploads/loops.
2. Metadata is persisted in loops/loops-metadata.json.
3. server.js bootstraps or recomputes rhythm-set data from metadata.
4. loop-manager.js and loop-rhythm-manager.js render admin views from backend metadata endpoints.

### Melodic Pad Flow

1. Melodic files are stored under loops/melodies.
2. melodic-loops-manager.js uploads or replaces files by key and type.
3. loop-player-pad.js loads samples based on song key and transpose state.

## API Surface by Domain

The backend exposes a large route surface. Major groups visible in server.js:

- Auth and account
  - /api/register
  - /api/login
  - /api/forgot-password
  - /api/reset-password
- Users and admin
  - /api/users
  - /api/users/:id/admin
  - /api/users/:id/remove-admin
- Songs
  - /api/songs
  - /api/songs/:id
  - /api/songs/:id/rhythm-set
  - /api/songs/scan
  - /api/songs/deleted
- User data
  - /api/userdata
- Global setlists
  - /api/global-setlists
  - /api/global-setlists/add-song
  - /api/global-setlists/remove-song
- Personal setlists
  - /api/my-setlists
  - /api/my-setlists/add-song
  - /api/my-setlists/remove-song
- Smart setlists
  - /api/smart-setlists
- Recommendation weights
  - /api/recommendation-weights
- Rhythm sets
  - /api/rhythm-sets
  - /api/rhythm-sets/recommend
  - /api/rhythm-sets/:rhythmSetId/recompute
  - /api/rhythm-sets/:rhythmSetId/force
- Rhythm loops
  - /api/loops/metadata
  - /api/loops/upload
  - /api/loops/upload-single
  - /api/loops/:loopId
  - /api/loops/:loopId/replace
- Song-specific loop uploads
  - /api/songs/:id/loops/upload
  - /api/songs/:id/loops
  - /api/songs/:id/loops/config
- Melodic loops
  - /api/melodic-loops
  - /api/melodic-loops/key/:key
  - /api/melodic-loops/upload
  - /api/melodic-loops/:id/replace
  - /api/melodic-loops/:id
  - /api/melodic-loops/:type/:key
- Metadata and diagnostics
  - /api/song-metadata
  - /api/debug/db

## main.js Functional Domains

main.js contains 276 declared functions. For maintainability, it is best understood as several subsystems living in one file.

### 1. Bootstrap, cache, and session

Representative functions:

- performInitialization
- authFetch
- cachedFetch
- invalidateCache
- loadSongsWithProgress
- loadUserData
- loadSettings

### 2. Song CRUD and search

Representative functions:

- openAddSong
- editSong
- deleteSongById
- loadSongsFromFile
- filterAndDisplaySongs
- handleFileUpload
- handleMergeUpload

### 3. Rendering and preview

Representative functions:

- renderSongs
- renderSongLists
- renderSongList
- showPreview
- formatLyricsWithChords
- updatePreviewWithTransposition
- applyLyricsBackground

### 4. Setlist management

Representative functions:

- loadGlobalSetlists
- loadMySetlists
- createGlobalSetlist
- createMySetlist
- addToGlobalSetlist
- addToMySetlist
- renderGlobalSetlists
- renderMySetlists

### 5. Smart setlists and recommendations

Representative functions:

- createSmartSetlist
- createSmartSetlistWithSongs
- updateSmartSetlistForm
- scanSongsWithConditions
- displayScanResults
- fetchRecommendationWeights
- saveRecommendationWeightsToBackend

### 6. Rhythm-set and admin tooling

Representative functions:

- loadRhythmSets
- renderRhythmSetsTable
- createRhythmSetFromForm
- recomputeRhythmSetRow
- saveRhythmSetRow
- showAdminPanelModal

### 7. Music utilities

Representative functions:

- transposeChord
- transposeSingleChord
- cleanChordName
- normalizeBaseNote
- normalizeKeySignature
- normalizeSongAccidentals

### 8. Mobile, scrolling, and UI affordances

Representative functions:

- createMobileNavButtons
- addMobileTouchNavigation
- setupAutoScroll
- toggleAutoScroll
- makeToggleDraggable
- snapToEdge

For the exhaustive list, use docs/FUNCTION_INVENTORY.md.

## Active, Legacy, and Supporting Files

### Active core runtime

- main.js
- scripts/core/api-base.js
- scripts/core/auth-client.js
- scripts/features/auth-ui.js
- scripts/features/password-reset.js
- scripts/features/songs-ui.js
- scripts/features/song-crud-ui.js
- scripts/features/song-preview-ui.js
- scripts/shared/admin-page.js
- server.js
- utils/auth.js
- loop-player-pad.js
- loop-player-pad-ui.js
- loop-manager.js
- loop-rhythm-manager.js
- melodic-loops-manager.js
- rhythm-mapper.js

### Legacy or transitional files still present

- loop-player.js
- loop-player-ui.DEPRECATED.js
- loop-player-pad-soundtouch.js
- loop-player-pad-tonejs.js
- rhythm-sets-manager.js is empty
- rhythm-sets-manager.js.old and rhythm-sets-manager.html.old remain in repo

### Utility, migration, debug, and test scripts

The repo also contains many one-off scripts for migration, validation, debugging, and manual API checks. They are covered in the function inventory, but they are not part of the main browser runtime.

## Admin Feature Reference

This section captures architectural and behavioral details for the admin tools and their backend contracts. It consolidates knowledge previously spread across feature-specific archive docs.

### Loop API Response Structure

The `/api/loops/metadata` and `/api/rhythm-sets` endpoints return rhythm set objects with three key fields:

```
availableFiles: ['loop1', 'loop2', 'loop3', 'fill1', 'fill2', 'fill3']  // no extension
files: { loop1: "dadra_3_4_medium_dholak_LOOP1.wav", loop2: "...", ... }
conditionsHint: { taal, timeSignature, tempo, genre }
```

- `availableFiles` lists loop slot identifiers that are actually uploaded (no `.mp3`/`.wav` extension in the array values even if the file has one)
- `files` maps each slot to the full server-side filename
- Playback URL is constructed as `/loops/{filename}` — NOT `/loops/{rhythmSetId}/{type}.mp3`
- Upload sends: `rhythmFamily`, `rhythmSetNo`, `taal`, `type`, `number`, `timeSignature`, `tempo`, `genre`
- Filename convention: `{taal}_{timeSignature}_{tempo}_{genre}_{TYPE}{number}.wav`

### Rhythm Set Two-Screen Architecture

The admin workspace is split across two pages by design (previously everything was in rhythm-sets-manager which is now archived):

- **loop-rhythm-manager.html** — Create, rename, delete rhythm sets; upload and manage the 6 loop slots per set; preview loops; test with the integrated player panel
- **rhythm-mapper.html** — Batch assignment of songs to rhythm sets; select one or many songs then pick a rhythm set from a searchable dropdown; unassign flows

This separation prevents a single bloated screen and keeps the two workflows (set lifecycle vs song mapping) independently usable.

### Rhythm Set DELETE Endpoint — Safety Contract

`DELETE /api/rhythm-sets/:rhythmSetId` (admin-only, auth required):

- Pre-deletion safety check: queries how many songs reference this `rhythmSetId`. If count > 0, returns 400 and rejects the delete.
- Confirmation dialogs on the client should surface the mapped song count before sending the DELETE request.
- Response includes `deletedFilesCount` for user feedback.
- Three handled cases:
  - Database-only set (no uploaded files): deletes DB record, 0 files touched
  - Partial file set: deletes only files that exist, no error on missing ones
  - Complete set: deletes all 6 loop files, updates metadata, then removes DB record
- Individual loop slot delete: `DELETE /api/rhythm-sets/:rhythmSetId/loops/:loopType` — validates that `loopType` is one of `['loop1', 'loop2', 'loop3', 'fill1', 'fill2', 'fill3']`

### Rhythm Set EDIT Endpoint — Cascade Update Contract

`PUT /api/rhythm-sets/:rhythmSetId` with body `{ newRhythmSetId, rhythmFamily, rhythmSetNo }`:

- Cascade updates: rhythm set DB doc → all songs that reference old ID → loop file renames on disk → metadata file update
- Response includes `updatedSongsCount`
- Conflict detection: before saving, client checks if `newRhythmSetId` already exists. Save is disabled if a conflict is found.

### Orphaned (Loops-Only) Rhythm Sets

A loops-only set is one that has uploaded loop files but no corresponding DB record (exists in metadata but not in `RhythmSets` collection).

- Detection: `isInDatabase = rhythmSet._id || rhythmSet.createdAt`
- Visual indicator: orange "LOOPS ONLY" badge in the admin table
- Cannot be deleted via the normal delete flow — user must either create the DB record first or remove files manually
- Pre-delete validation returns a helpful error rather than silently failing

### Rhythm Set Number Dropdown — Duplicate Prevention

When creating a new rhythm set, the set number dropdown is dynamically generated from existing sets in the selected family:

- Available (unused) numbers are shown as ENABLED options
- Already-used numbers are shown as DISABLED options (visual reference only, cannot be selected)
- A divider line separates the two sections
- The rhythm set ID preview updates live: shows the constructed ID `"{family}_{number}"` before creation

### Quick-Create Workflow (loop-rhythm-manager)

The create flow follows three logical steps inside a single form:

1. Select an existing rhythm family or type a new one, pick a set number → preview shows constructed ID
2. Upload loops (drag-drop or multi-select file picker) — system auto-detects slot from filename (`*loop1*` → `loop1`, `*fill2*` → `fill2`)
3. Assign songs (searchable multi-select) — after set creation

Validation: warns if not exactly 6 files but allows the user to skip and upload later.

### Expandable Row Mechanics

The rhythm sets table uses dual-row rendering per set — one summary row plus one details row hidden by default:

- Summary row contains: expand chevron cell, ID, family, set number, loop count badge, status badge, action buttons
- Details row contains the 6 loop slot grid (hidden behind `display: none` or class toggle)
- Toggle function: `toggleExpandRow(index)` — rotates the chevron icon 0°→90° via CSS class, adds/removes `.show` and `.expanded` classes
- CSS classes: `expand-icon` (rotates), `loop-slot` (grid item), `loop-details-row` (hidden initially)
- Loop slot styling: green solid border when a loop is uploaded, red dashed border when empty
- Slot badge: ✓ for uploaded, "Empty" for missing

### Drag-Drop Upload

Loop slot drag-drop handlers:

- `dragover`: calls `event.preventDefault()` to allow drop; applies hover style `border-color: #9b59b6; background-color: #3a2a4a`
- `dragleave`: restores original slot border/background
- `drop`: validates file extension (`.mp3` or `.wav`), then calls `uploadFileForLoop()` directly — no additional button click required
- After upload, the row remains expanded; a `setTimeout` re-expands the refreshed row by matching `rhythmSetId` in the refreshed list (100ms delay is sufficient, increase if render is slow)
- Fallback: "Click to upload" button on each slot still works for non-drag users

### Mobile Responsive Breakpoints (Admin Pages)

- **Desktop**: all columns visible (Key, Tempo, Taal, Rhythm Set, Actions)
- **≤768px (tablet)**: non-critical columns hidden (Key, Tempo)
- **≤480px (mobile)**: only essential columns shown (Title, Checkbox, Rhythm Set, Actions); loop slot grid collapses to single column; form inputs go full-width with labels stacked above
- Touch targets: minimum 44×44px for all buttons

### Bulk Song Selection (rhythm-mapper)

- Internal state uses a `Set` (`selectedSongIds`) — not a single value — for multi-select
- Header checkbox toggles all rows at once
- Clicking a table row body toggles that row's checkbox (not a replace operation)
- Selection card display:
  - Single song: shows title, taal, key, current rhythm set
  - Multiple songs: shows count and rhythm set distribution summary
- Batch assignment: sends individual `PUT` requests per song, catches errors per-request
- Success/error message format: `"Assigned 5 song(s). Failed: 0"`

### Server-Side Unassign Detection — Critical Pattern

`PUT /api/songs/:id/rhythm-set` must distinguish a normal update from an explicit unassign (setting `rhythmSetId = null`):

```javascript
// Detection
const isUnassigning = (rhythmSetId === null) || (body.hasOwnProperty('rhythmSetId') && !rhythmSetId);

// When unassigning: skip all recommendation logic, write null directly to DB
// When updating: use || operator to fall back to existing values
```

Do NOT use `|| existingValue` for `rhythmSetId` when unassigning — that would convert `null` back to the old value. The distinction matters because recommendation recompute must be skipped entirely when unassigning. Response returns `{ id, rhythmSetId: null }`.

### Song ID Standardization

Songs use a numeric `id` field (not MongoDB's string `_id`):

- Assigned by `migrate-song-ids.js` as sequential integers
- All comparison code must use `parseInt()` for consistency: `parseInt(s.id) === parseInt(songId)`
- Database documents have both `_id` (MongoDB ObjectId) and `id` (numeric integer) — runtime code uses `id` only
- Smart setlist matching: compare `s.id === smartSong.id` only, no fallback to `_id`

### In-Table Loop Preview

Rhythm set rows show per-slot playback buttons inline:

- Buttons render only for slots that have uploaded files
- Order: loop1, loop2, loop3, fill1, fill2, fill3
- Audio files come from the already-loaded `loopsByRhythmSet` Map — no additional API calls per preview
- Icon toggles ▶→⏸ on the specific button during playback
- Only one loop plays at a time — starting a new preview auto-stops the previous one via the shared `playPreview()` / `stopPreview()` infrastructure

## Documentation Strategy

Use these three documents first:

1. docs/CODEBASE_GUIDE.md
2. docs/FUNCTION_INVENTORY.md
3. docs/CODE_ISSUES_AND_DUPLICATION.md

The `docs/archive/` directory has been fully reviewed; all unique technical knowledge has been merged into this document and LOOP_PLAYER_DOCUMENTATION.md. Archive files may be deleted without information loss.