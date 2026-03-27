# Refactor Plan

Generated: 2026-03-27

Status: Supporting implementation plan.

Current implementation status:

- Phase 1A completed: shared browser API base resolution extracted to scripts/core/api-base.js
- Phase 1B completed: shared browser auth client extracted to scripts/core/auth-client.js
- Phase 1C completed: shared admin-page helpers extracted to scripts/shared/admin-page.js
- Phase 2A completed: backend chord normalization extracted to utils/chord-normalization.js and browser chord normalization extracted to scripts/shared/chord-normalization.js
- Phase 2B completed: backend/frontend rhythm-set helpers extracted to utils/rhythm-set.js and scripts/shared/rhythm-set.js
- Phase 3B completed: auth and password-reset feature logic extracted to scripts/features/auth-ui.js and scripts/features/password-reset.js with main.js compatibility wrappers
- Phase 3C started: songs list loading/count/render logic extracted to scripts/features/songs-ui.js with main.js compatibility wrappers
- Phase 3C continued: song edit/delete modal logic extracted to scripts/features/song-crud-ui.js with main.js compatibility wrappers
- Phase 3C continued: edit-song submit/update flow extracted to scripts/features/song-crud-ui.js and validated against live backend
- Phase 3C continued: delete confirmation/cancel event handling extracted to scripts/features/song-crud-ui.js
- Phase 3C continued: showPreview orchestration extracted to scripts/features/song-preview-ui.js with main.js compatibility wrapper
- Phase 3C continued: preview chord-formatting and transpose helpers extracted to scripts/features/song-preview-ui.js with main.js compatibility wrappers
- Phase 3C continued: preview auto-scroll handlers extracted to scripts/features/song-preview-ui.js with main.js compatibility wrappers and browser validation
- Phase 3D continued: playback-adjacent UI helpers (applyLyricsBackground, initializeFloatingStopButton, showFloatingStopButton, hideFloatingStopButton, stopCurrentlyPlayingSong) extracted to scripts/features/song-preview-ui.js with main.js compatibility wrappers and browser validation
- Phase 3E completed: all 51 setlist functions extracted to scripts/features/setlists.js exposing window.SetlistsUI; getSetlistDeps() and compatibility wrappers added to main.js for ~25 entry-point functions; getSongPreviewDeps() updated to route isSongInCurrentSetlist and checkSongInSetlistAndToggle through module; registerGlobals() wires window.removeFromSetlist at runtime; validated (zero errors, 51 exports confirmed, window.removeFromSetlist registered)
- Phase 3F completed: smart setlist UI extracted to scripts/features/smart-setlists.js exposing window.SmartSetlistsUI; getSmartSetlistDeps() added to main.js; compatibility wrappers added for smart setlist load/render/create/edit/update/delete/scan flows; smart modal listeners now initialize through the module when present; validated (zero errors, 19 declared functions, module loads cleanly, modal reset smoke test passed)
- Phase 3G completed: rhythm set admin-tab logic extracted to scripts/features/rhythm-sets.js and admin/user-role plus recommendation-weight logic extracted to scripts/features/admin-ui.js; getRhythmSetsDeps() and getAdminUIDeps() added to main.js; effective runtime wrappers added for rhythm CRUD/recompute, admin user management, recommendation weights, and admin panel modal flows; addEventListeners now delegates admin/rhythm listener binding to extracted module initializers when present; validated (zero errors, modules load cleanly, admin modal smoke test passed)
- Phase 3H completed: shared DOM helpers extracted to scripts/shared/dom.js and mobile/panel UI helpers extracted to scripts/features/mobile-ui.js; getDomDeps() and getMobileUIDeps() added to main.js; bootstrap now delegates modal/suggested-song/mobile setup through extracted initializers when present; compatibility wrappers added for modal open/close, search-history helpers, highlightText, mobile nav creation, touch navigation, draggable toggles, and panel position updates; validated (zero errors, modules load cleanly, shared modal open/close smoke test passed)
- Phase 4 started: loop-rhythm-manager and rhythm-mapper now route alert rendering through scripts/shared/admin-page.js and both standalone pages now load admin-page shared helper before page scripts
- Phase 4 continued: loop-manager and melodic-loops-manager now enforce explicit read-only mode for unauthenticated sessions by blocking upload/replace/delete handlers and rendering loop/file action cells as read-only while preserving preview and metadata browsing
- Phase 4 continued: loop-manager and melodic-loops-manager protected upload/replace/delete requests now use shared AppAuth authFetch-style handling (via local authFetch wrappers) with normalized request-failure messaging and centralized AUTH_REQUIRED redirects
- Phase 4 continued: rhythm-mapper request flows now use normalized AppAuth authFetch-style handling (via local authFetch wrapper) with centralized AUTH_REQUIRED redirect behavior and consistent backend error extraction across load/assign/unassign/clear paths
- Phase 4 continued: loop-rhythm-manager protected create/edit/upload/delete flows now use normalized AppAuth authFetch-style handling (via local authFetch wrapper), explicit write-action guards in read-only mode, and centralized AUTH_REQUIRED redirects while preserving metadata fallback for unauthenticated read access
- Phase 5 started: runtime reference audit confirms active pages load loop-player-pad.js and loop-player-pad-ui.js, with no direct runtime references found for loop-player-ui.DEPRECATED.js, loop-player.js, loop-player-pad-soundtouch.js, loop-player-pad-tonejs.js, rhythm-sets-manager.js, or rhythm-sets-manager.html.old (candidate archive/remove set)
- Phase 5 continued: archived loop-player-ui.DEPRECATED.js, loop-player-pad-soundtouch.js, loop-player-pad-tonejs.js, rhythm-sets-manager.html.old, and rhythm-sets-manager.js.old into legacy/runtime/ after confirming no active runtime references
- Phase 5 completed: archived loop-player.js and empty rhythm-sets-manager.js into legacy/runtime/ after final reference verification; active runtime now uses loop-player-pad.js plus extracted scripts/features/rhythm-sets.js path
- Phase 6 started: hardened high-risk standalone admin rendering paths by escaping loop/melodic metadata in dynamic HTML, replacing loop-manager inline action handlers with DOM event binding, and coercing rhythm-mapper song IDs to numeric values before inline handler interpolation
- Phase 6 continued: hardened loop-rhythm-manager inline handler interpolation by encoding dynamic rhythmSetId/rhythmFamily/filename payloads before handler invocation and sanitizing generated DOM id tokens used in rendered loop-slot markup
- Phase 6 continued: loop-rhythm-manager player status updates now use a safe DOM/text status renderer helper instead of direct innerHTML status interpolation
- Phase 6 continued: loop-rhythm-manager rhythm-set table action controls (play/edit/delete) now use DOM-created buttons with event listeners instead of string-interpolated inline onclick handlers
- Phase 6 continued: loop-rhythm-manager slot actions/test controls and drop-zone hooks now bind via data attributes + DOM event listeners (play/remove/upload/test/drop) instead of inline handler attributes
- Phase 6 continued: loop-rhythm-manager createSimplePlayerUI controls now bind via DOM listeners (pads, sliders, auto-fill, start/stop) instead of inline onclick/oninput/onchange attributes
- Phase 6 continued: loop-rhythm-manager rhythm-set main row/details row rendering now constructs core table DOM nodes directly instead of string-assembled row HTML
- Phase 6 continued: loop-rhythm-manager renderLoopSlots now returns a DocumentFragment built with createElement/textContent instead of an HTML template string; detailsCell uses appendChild
- Page entry points updated to load shared utilities before feature scripts

Phase 5 status:

- Completed
- runtime-reference audit completed for legacy loop/rhythm files
- deprecated/old loop/rhythm files archived under legacy/runtime

Phase 6 status:

- In progress
- initial XSS hardening pass applied to loop-manager.js, melodic-loops-manager.js, and rhythm-mapper.js
- loop-rhythm-manager dynamic handler interpolation hardened for encoded payload usage
- loop-rhythm-manager player status rendering hardened via setPlayerStatus helper
- loop-rhythm-manager table action controls moved to DOM event binding
- loop-rhythm-manager slot and drop-zone interactions moved to data-attribute DOM event binding
- loop-rhythm-manager player controls moved from inline handlers to bindPlayerUIControls DOM wiring
- loop-rhythm-manager main/details table rows now use direct DOM node construction for core cells
- loop-rhythm-manager renderLoopSlots fully migrated to DocumentFragment; no remaining HTML-string injection surfaces in loop-rhythm-manager.js
- Phase 6 Complete

Phase 2 status:

- Completed

Phase 3 status:

- In progress
- 3B completed (auth/password-reset extraction)
- 3C started (songs list render extraction)
- 3C continued (song CRUD modal extraction)
- 3C continued (song edit submit extraction)
- 3C continued (song delete event extraction)
- 3C continued (song preview orchestration extraction)
- 3C continued (song preview helper extraction)
- 3C continued (song preview auto-scroll extraction)
- 3D continued (playback-adjacent UI extraction: applyLyricsBackground + floating stop button)
- 3E completed (setlists extraction: all 51 setlist functions to scripts/features/setlists.js, window.SetlistsUI)
- 3F completed (smart setlists extraction: scripts/features/smart-setlists.js, window.SmartSetlistsUI)
- 3G completed (rhythm sets and admin extraction: scripts/features/rhythm-sets.js + scripts/features/admin-ui.js)
- 3H completed (mobile and DOM extraction: scripts/features/mobile-ui.js + scripts/shared/dom.js)

Phase 4 status:

- In progress
- shared admin alert helper aligned on loop-rhythm-manager and rhythm-mapper
- read-only action guards aligned on loop-manager and melodic-loops-manager
- protected request handling aligned on shared authFetch flow for loop-manager and melodic-loops-manager
- protected request handling aligned on shared authFetch flow for rhythm-mapper
- protected request handling + write-action guards aligned on shared authFetch flow for loop-rhythm-manager

Use this document with:

- docs/CODEBASE_GUIDE.md for architecture context
- docs/CODE_ISSUES_AND_DUPLICATION.md for why this refactor is needed
- docs/FUNCTION_INVENTORY.md for exhaustive function lookup during extraction

## Goal

Reduce maintenance risk without breaking the current deployment model.

This repo currently serves plain browser scripts directly from HTML pages. There is no bundler and index.html still relies on globally available functions and some inline event handlers. That constraint matters: the first refactor should preserve global access and script-tag loading, not attempt a full module-system conversion immediately.

## Constraints

### Current frontend loading model

- index.html loads plain scripts directly
- main.js is loaded before loop-player-pad.js and loop-player-pad-ui.js
- Some HTML still uses inline handlers such as goBackToSidebar(event)
- Admin pages load their own independent page scripts

### Implication

The first safe extraction strategy is:

- create shared IIFE-style browser modules under a new scripts directory
- expose stable namespaces on window
- keep existing global function names as compatibility wrappers while migrating

Do not start by converting the app to type="module" or introducing a bundler. That is a later optimization once the runtime boundaries are cleaner.

## Target Structure

Recommended new frontend structure:

```text
scripts/
  core/
    api-base.js
    app-state.js
    auth-client.js
    cache.js
  shared/
    rhythm-set.js
    dom.js
    admin-page.js
  music/
    chord-utils.js
    transpose.js
  features/
    auth-ui.js
    password-reset.js
    songs.js
    song-preview.js
    setlists.js
    smart-setlists.js
    rhythm-sets.js
    mobile-ui.js
```

Recommended backend additions:

```text
utils/
  auth.js
  chord-normalization.js
  rhythm-set.js
```

## Refactor Sequence

Follow this order. It is designed to reduce risk and keep the app runnable at every step.

### Phase 0: Baseline and guardrails

Objective:

- establish safe checkpoints before moving code

Files to update:

- package.json
- README.md if you want a short developer note for the refactor branch
- optional manual test checklist doc under docs/

Actions:

1. Capture a smoke-test checklist for:
   - login/logout
   - song load and search
   - setlist create/edit/delete
   - smart setlist scan and save
   - song preview and transpose
   - rhythm mapper page
   - loop-rhythm-manager page
   - melodic-loops-manager page
2. Do not change runtime code yet.

Exit criteria:

- You can validate each phase against a known set of working flows.

### Phase 1: Shared browser infrastructure

Objective:

- remove the easiest cross-page duplication first

#### 1A. API base URL utility

Create:

- scripts/core/api-base.js

Move logic from:

- loop-manager.js: resolveApiBaseUrl
- loop-rhythm-manager.js: resolveApiBaseUrl
- melodic-loops-manager.js: inline API_BASE_URL logic

Target API:

- window.AppApiBase.resolve()

Then update:

- loop-manager.js
- loop-rhythm-manager.js
- melodic-loops-manager.js
- rhythm-mapper.js if you want consistent origin handling there too

Implementation note:

- keep page scripts reading a local constant like const API_BASE_URL = window.AppApiBase.resolve();

#### 1B. Browser auth client

Create:

- scripts/core/auth-client.js

Move logic from:

- main.js: authFetch and token/session helpers
- loop-rhythm-manager.js: authFetch
- rhythm-mapper.js: authFetch

Target API:

- window.AppAuth.getToken()
- window.AppAuth.setToken(token)
- window.AppAuth.clearSession()
- window.AppAuth.authFetch(url, options)

Then update:

- main.js
- loop-rhythm-manager.js
- rhythm-mapper.js

Keep compatibility temporarily:

- leave function authFetch(...) in main.js as a thin wrapper returning window.AppAuth.authFetch(...)

#### 1C. Shared admin page helpers

Create:

- scripts/shared/admin-page.js

Move shared patterns from:

- loop-manager.js
- melodic-loops-manager.js

Candidates:

- isAuthenticated
- showAuthenticationWarning pattern
- showAlert pattern
- single-audio preview handling
- stats count formatting helpers

Target API:

- window.AdminPage.requireAuthBanner(config)
- window.AdminPage.showAlert(targetId, message, type)
- window.AdminPage.createAudioPreviewController()

Then update:

- loop-manager.js
- melodic-loops-manager.js

Exit criteria for Phase 1:

- no functional change
- duplicated auth/API base logic is reduced
- admin pages still load independently

### Phase 2: Extract stable pure logic from main.js

Objective:

- move low-risk, low-DOM logic out of main.js first

#### 2A. Chord normalization and transpose helpers

Status:

- Completed for normalization helpers
- Transpose extraction remains for a later phase

Create frontend files:

- scripts/shared/chord-normalization.js
- scripts/music/transpose.js

Move from main.js:

- normalizeBaseNote
- normalizeKeySignature
- normalizeSingleChordToken
- normalizeChordAccidentals
- normalizeSongAccidentals
- cleanChordName
- getRootNote
- isMajor
- isMinor
- isSameScaleType
- transposeChord
- transposeSingleChord

Also create backend file:

- utils/chord-normalization.js

Move from server.js and migrate-chord-accidentals.js:

- normalizeBaseNote
- normalizeChordToken
- normalizeKeySignature
- normalizeManualChords
- normalizeLyricsChords
- normalizeSongAccidentals

Then update:

- server.js
- migrate-chord-accidentals.js
- main.js

Implemented result:

- server.js and migrate-chord-accidentals.js now consume utils/chord-normalization.js
- main.js now consumes scripts/shared/chord-normalization.js via window.ChordNormalization aliases

Reason:

- these functions are logic-heavy and comparatively easy to validate
- they are already duplicated across files

#### 2B. Rhythm-set ID helpers

Status:

- Completed

Create frontend file:

- scripts/shared/rhythm-set.js

Create backend file:

- utils/rhythm-set.js

Move or consolidate from:

- main.js: normalizeRhythmFamilyValue, buildRhythmSetIdValue
- loop-manager.js: normalizeRhythmFamily, buildRhythmSetId
- loop-rhythm-manager.js: normalizeRhythmFamily, buildRhythmSetId, parseRhythmSetParts
- server.js: normalizeRhythmFamily, buildRhythmSetId, parseRhythmSetId, normalizeRhythmSetNo, normalizeRhythmCategory

Target frontend API:

- window.RhythmSetUtils.normalizeRhythmFamily(value)
- window.RhythmSetUtils.buildRhythmSetId(family, setNo)
- window.RhythmSetUtils.parseRhythmSetId(id)
- window.RhythmSetUtils.deriveRhythmSetFields(id, fallbackFamily, fallbackSetNo)

Implemented result:

- main.js, loop-manager.js, and loop-rhythm-manager.js now consume scripts/shared/rhythm-set.js
- server.js now consumes utils/rhythm-set.js

Exit criteria for Phase 2:

- duplicated pure logic is centralized
- browser and server behavior are aligned on chord and rhythm-set rules

### Phase 3: Split main.js by feature domain

Objective:

- reduce main.js from one monolith into coordinated feature files while preserving globals during migration

#### 3A. Core state and cache

Create:

- scripts/core/app-state.js
- scripts/core/cache.js

Move from main.js:

- CACHE_EXPIRY
- window.dataCache related behavior
- initializationState
- cachedFetch
- invalidateCache
- queueSaveUserData if it remains generic

Target API:

- window.AppState
- window.AppCache

#### 3B. Auth UI and password reset

Create:

- scripts/features/auth-ui.js
- scripts/features/password-reset.js

Move from main.js:

- login
- logout
- register
- updateAuthButtons
- hideAuthModals
- showLoginModal
- showRegisterModal
- showForgotPasswordModal
- hidePasswordResetModals
- showPasswordResetNotification
- initiatePasswordReset
- verifyOtpAndResetPassword
- resendOtp
- setupPasswordResetEventListeners

Keep exposed on window where needed:

- window.login
- window.logout

#### 3C. Song loading, filtering, and CRUD

Create:

- scripts/features/songs.js

Move from main.js:

- loadSongsFromFile
- loadSongsWithProgress
- filterAndDisplaySongs
- renderSongs
- renderSongList
- renderSongLists
- openAddSong
- editSong
- deleteSongById
- handleFileUpload
- handleMergeUpload
- updateSongCount
- related filter-population helpers

#### 3D. Song preview and playback-adjacent UI

Create:

- scripts/features/song-preview.js

Move from main.js:

- showPreview
- formatLyricsWithChords
- extractDistinctChords
- isChordLine
- hasInlineChords
- transposeChord
- transposeSingleChord
- updatePreviewWithTransposition
- setupAutoScroll
- toggleAutoScroll
- startAutoScroll
- handleUserScroll
- applyLyricsBackground
- stopCurrentlyPlayingSong
- initializeFloatingStopButton
- showFloatingStopButton
- hideFloatingStopButton

#### 3E. Setlists

Create:

- scripts/features/setlists.js

Move from main.js:

- loadGlobalSetlists
- loadMySetlists
- renderGlobalSetlists
- renderMySetlists
- createGlobalSetlist
- createMySetlist
- editGlobalSetlist
- editMySetlist
- deleteGlobalSetlist
- deleteMySetlist
- addToGlobalSetlist
- addToMySetlist
- removeFromGlobalSetlist
- removeFromMySetlist
- refreshSetlistDisplay
- related setlist form and dropdown helpers

#### 3F. Smart setlists

Create:

- scripts/features/smart-setlists.js

Move from main.js:

- loadSmartSetlistsFromServer
- renderSmartSetlists
- createSmartSetlist
- createSmartSetlistWithSongs
- updateSmartSetlist
- updateSmartSetlistForm
- deleteSmartSetlist
- scanSongsWithConditions
- displayScanResults
- initializeSmartSetlistMultiselects
- setupSmartSongTabs

#### 3G. Rhythm sets and admin panel

Create:

- scripts/features/rhythm-sets.js
- scripts/features/admin-ui.js

Move from main.js:

- loadRhythmSets
- renderRhythmSetsTable
- createRhythmSetFromForm
- saveRhythmSetRow
- recomputeRhythmSetRow
- fetchUsers
- loadUsers
- markAdmin
- removeAdminRole
- showAdminPanelModal
- showAdminNotification
- recommendation-weight UI functions

#### 3H. Mobile and general UI helpers

Create:

- scripts/features/mobile-ui.js
- scripts/shared/dom.js

Move from main.js:

- createMobileNavButtons
- addMobileTouchNavigation
- makeToggleDraggable
- snapToEdge
- setupModals
- setupModalClosing
- setupSuggestedSongsClosing
- highlightText
- search-history helpers if kept

Transition rule for Phase 3:

- each extracted file should expose a narrow window namespace
- main.js should become a coordinator that wires the extracted modules together
- keep existing global function names only as wrappers until HTML and dependent scripts are updated

Exit criteria for Phase 3:

- main.js becomes mostly bootstrap and orchestration
- most domain logic lives in feature files

### Phase 4: Align the standalone admin pages

Objective:

- reduce divergence between separate admin pages

Files to update:

- loop-manager.js
- loop-rhythm-manager.js
- melodic-loops-manager.js
- rhythm-mapper.js

Actions:

1. Make all admin pages use:
   - scripts/core/api-base.js
   - scripts/core/auth-client.js
   - scripts/shared/rhythm-set.js where relevant
   - scripts/shared/admin-page.js
2. Replace page-specific auth/token logic with shared utilities.
3. Normalize alert rendering and error handling.
4. Standardize the read-only fallback behavior.

Exit criteria:

- admin pages stop reimplementing the same boot/auth/alert patterns

### Phase 5: Legacy cleanup

Objective:

- make the active path obvious

Files to review:

- loop-player.js
- loop-player-ui.DEPRECATED.js
- loop-player-pad-soundtouch.js
- loop-player-pad-tonejs.js
- rhythm-sets-manager.js
- rhythm-sets-manager.js.old
- rhythm-sets-manager.html.old

Actions:

1. Confirm actual runtime references.
2. Move deprecated files to a legacy directory or docs/archive equivalent if still useful.
3. Delete empty files once references are verified absent.
4. Label optional engines explicitly if they remain.

Exit criteria:

- contributors can tell the active implementation from old code at a glance

### Phase 6: Security and rendering hardening

Objective:

- reduce XSS and state inconsistency risks after the structural split

Files affected:

- main.js replacement feature files
- loop-manager.js
- loop-rhythm-manager.js
- melodic-loops-manager.js
- rhythm-mapper.js

Actions:

1. Audit innerHTML usage after functions are moved into smaller files.
2. Replace user-data interpolation with textContent or safe DOM creation.
3. Remove direct localStorage token reads from feature modules where AppAuth already exists.
4. Revisit whether JWT storage should remain in localStorage.

## HTML Loading Changes

When you introduce shared browser modules, update pages in this order.

### index.html

Add shared scripts before main.js:

1. scripts/core/api-base.js
2. scripts/core/auth-client.js
3. scripts/core/app-state.js
4. scripts/core/cache.js
5. scripts/shared/rhythm-set.js
6. scripts/music/chord-utils.js
7. scripts/music/transpose.js
8. extracted feature scripts
9. main.js as the bootstrap/orchestrator

### loop-manager.html

Add before loop-manager.js:

- scripts/core/api-base.js
- scripts/core/auth-client.js if used there
- scripts/shared/admin-page.js
- scripts/shared/rhythm-set.js

### loop-rhythm-manager.html

Add before loop-rhythm-manager.js:

- scripts/core/api-base.js
- scripts/core/auth-client.js
- scripts/shared/admin-page.js
- scripts/shared/rhythm-set.js

### melodic-loops-manager.html

Add before melodic-loops-manager.js:

- scripts/core/api-base.js
- scripts/core/auth-client.js if used there
- scripts/shared/admin-page.js

### rhythm-mapper.html

Add before rhythm-mapper.js:

- scripts/core/api-base.js
- scripts/core/auth-client.js
- scripts/shared/rhythm-set.js
- scripts/shared/admin-page.js if you standardize alerts there

## First 5 Pull Requests

If you want this done safely, use these PR boundaries.

### PR 1

- Add scripts/core/api-base.js
- Add scripts/core/auth-client.js
- Update loop-rhythm-manager.js
- Update rhythm-mapper.js
- Update loop-manager.js
- Update melodic-loops-manager.js

### PR 2

- Add utils/chord-normalization.js
- Add utils/rhythm-set.js
- Update server.js
- Update migrate-chord-accidentals.js
- Add scripts/shared/rhythm-set.js
- Update main.js low-risk helpers

### PR 3

- Add scripts/features/auth-ui.js
- Add scripts/features/password-reset.js
- Shrink main.js auth-related section
- Update index.html script order

### PR 4

- Add scripts/features/songs-ui.js
- Add scripts/features/song-crud-ui.js
- Add scripts/features/song-preview-ui.js
- Shrink main.js songs loading/count/render section
- Shrink main.js song edit/delete modal section
- Shrink main.js edit-song submit/update section
- Shrink main.js delete confirmation/cancel section
- Shrink main.js showPreview section
- Shrink main.js preview formatting/transpose helper section
- Update index.html script order

### PR 5

- Add scripts/features/setlists.js
- Add scripts/features/smart-setlists.js
- Move setlist form handlers out of main.js

### PR 6

- Add scripts/features/songs.js
- Add scripts/features/song-preview.js
- Add scripts/features/mobile-ui.js
- Turn main.js into bootstrap/orchestration

## Success Criteria

The refactor is successful when:

- main.js is reduced to bootstrap and coordination
- shared request/auth logic exists in one browser utility layer
- rhythm-set logic has one canonical implementation per runtime
- chord normalization is not copy-pasted across server/runtime/migration scripts
- deprecated files are clearly marked or removed
- all major flows still pass the smoke checklist

## What Not To Do First

Avoid these until after the structural split:

- converting the app to ES modules everywhere
- introducing a bundler
- redesigning the UI at the same time
- changing auth storage strategy in the same PR as the structural extraction

Those are valid later steps, but combining them with the initial extraction will make regression tracking harder.