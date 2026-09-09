# Mobile View Migration - Change Tracker

**Purpose:** Consultation record for the New&Old mobile modern mode.

**Current stage:** Phase 6 complete: Suggested Songs Drawer mobile presentation implemented and verified.

**Last recorded:** 2026-09-09

## How To Use This Document

This document records implemented changes separately from proposed changes. Add new consultation feedback under **Architect Review Feedback** and record approved follow-up work as a new dated entry under **Change History**. Do not rewrite earlier entries when the design changes; append a new entry so the decision trail remains clear.

## Product Direction

New&Old is being adapted for mobile as a professional digital songbook and rehearsal/performance workstation.

The migration is incremental, not a rewrite. Existing business logic, APIs, permissions, song rendering, recommendation behavior, transpose semantics, setlist behavior, cache behavior, and rhythm/loop audio behavior remain authoritative.

The mobile experience has exactly three primary destinations:

1. Home
2. Songs
3. More

Song Preview is the primary performance surface opened from Songs, not a fourth primary navigation destination.

## Approved Design Decisions

- Desktop remains unchanged and is protected by the existing responsive boundary.
- Home, Songs, and More are the only persistent mobile navigation destinations.
- App-level More and Song-level More are separate concepts.
- Songs always represents the complete song catalogue, even when an active setlist exists.
- The active setlist remains application state and must remain visible in the mobile experience.
- Song Preview prioritizes title, favorite, recommendations, active setlist context, metadata, personal transpose, lyrics/chords, auto-scroll, and secondary tools.
- The Song Preview action row is `+ Setlist`, `AUTO`, and `More`.
- `AUTO` means Auto-scroll. There must be exactly one Auto-scroll control and no Play button for Auto-scroll.
- Recommendations remain directly visible from Song Preview and retain the existing algorithm.
- Mobile catalogue filtering should eventually use a compact `Filters - N active` interaction rather than permanently displaying every filter.
- Multi-select begins as explicit Select mode. Long-press selection is not part of the initial implementation.
- Setlists remain separate from Songs and preserve Global, My, and Smart types and existing collapse behavior.
- Personal transpose remains user-specific. Global setlist transpose remains separate and permission-aware.
- The active rhythm/loop engine is reused; no simplified fake player is introduced.
- The visual direction is warm cream/beige, olive/dark green, subtle gold, high contrast, clean typography, strong touch targets, safe-area support, and excellent dark mode.

## Current Architecture Baseline

- Frontend: vanilla JavaScript, HTML, and CSS with script-tag-loaded IIFE modules and `window.*` namespaces.
- Main orchestration: `main.js`.
- Mobile helper owner: `scripts/features/mobile-ui.js`.
- Existing mobile state: `.hidden` classes on `.sidebar` and `.songs-section`; the preview remains underneath when both are hidden.
- Existing legacy mobile controls: generated `.mobile-nav-container`, draggable `.panel-toggle` controls, and swipe navigation.
- Current mobile boundary: `max-width: 768px`; desktop-specific rules begin at `769px`.
- Song Preview owner: `scripts/features/song-preview-ui.js`.
- Setlist owner: `scripts/features/setlists.js` and `scripts/features/smart-setlists.js`.
- Active loop owners: `loop-player-pad.js` and `loop-player-pad-ui.js`.
- Cache and synchronization: `main.js`, LocalStorage, user data, setlist cache, and delta song synchronization.
- Service worker: install-oriented only; it does not currently provide full offline asset caching.

## Resolved Decisions

- **Mobile breakpoint:** `768px` remains the mobile boundary.
- **Active Setlist visibility:** full active-setlist card in Home, compact context in Song Preview, and contextual target text in Songs.
- **Song Preview architecture:** remains on the existing panel/state architecture.
- **Desktop:** remains unchanged.
- **Legacy navigation:** floating and swipe navigation remains temporarily for compatibility.

## Change History

### 2026-09-09 - Phase 0: Baseline and Guardrails

**Status:** Complete.

**Recorded findings:**

- Existing mobile initialization is delegated to `window.MobileUI.initializeMobileUI()` from `main.js`.
- Existing panel state and floating controls were identified before implementation.
- Existing desktop/mobile CSS boundaries were identified.
- Existing recommendation, transpose, setlist, authentication, rhythm/loop, cache, and service-worker ownership was confirmed.
- No backend or database changes were included in this phase.

**Guardrails established:**

- Preserve existing feature modules and compatibility wrappers.
- Isolate new presentation behind the mobile boundary.
- Avoid changing APIs, schemas, permissions, or domain algorithms.
- Validate mobile and desktop after each implementation phase.

### 2026-09-09 - Phase 1: Mobile Shell and Bottom Navigation

**Status:** Implemented and smoke-tested.

**Files changed:**

- `index.html`
  - Added a mobile-only navigation shell with exactly three destinations: Home, Songs, and More.
  - Added accessible labels and `aria-current` state handling.

- `scripts/features/mobile-ui.js`
  - Added mobile modern shell initialization.
  - Added destination activation without a page reload.
  - Home bridges to the existing sidebar panel.
  - Songs bridges to the existing songs catalogue panel.
  - More establishes the reserved destination and active-state contract; its app-level menu is intentionally deferred to a later phase.
  - Added one-time binding markers to avoid duplicate listeners.
  - Kept legacy mobile helpers available for compatibility.

- `styles.css`
  - Added mobile-only bottom navigation styling.
  - Added safe-area padding for modern phone layouts.
  - Added light and dark mode treatment.
  - Hid legacy floating mobile navigation only while mobile modern mode is active.
  - Left desktop navigation and panel styling outside the mobile mode.

- `docs/mobile-view-migration/WORKING_NOTES.md`
  - Added Phase 0 baseline and Phase 1 implementation notes.

### 2026-09-09 - Approved Decisions Before Phase 2A

**Status:** Approved.

- Retain the existing `768px` breakpoint.
- Keep desktop unchanged.
- Keep legacy floating and swipe navigation temporarily for compatibility.
- Do not introduce a new routing architecture.
- Keep the existing panel/state architecture underneath the mobile presentation.
- Treat App-level More and Song-level More as separate future features.
- Use explicit Select mode later for catalogue multi-select; do not use long-press selection.
- Do not change backend APIs, database schema, recommendation algorithm, transpose semantics, audio engine, or offline/cache behavior.

### 2026-09-09 - Phase 2A: Home Drawer

**Status:** Implemented and smoke-tested.

**Files changed:**

- `index.html`
  - Added the Home drawer's active-setlist card, close control, and backdrop.
  - Reused the existing sidebar action DOM instead of cloning actions.

- `scripts/features/mobile-ui.js`
  - Added Home drawer open/close behavior.
  - Added state snapshots for sidebar/song panel visibility and scroll positions.
  - Added active-setlist summary updates from existing current setlist state.
  - Kept the legacy sidebar, swipe navigation, and existing action handlers intact.

- `styles.css`
  - Added mobile-only drawer, backdrop, active-setlist card, close control, and dark-mode styling.
  - Did not change desktop selectors or desktop layout behavior.

- `main.js`
  - Exposed existing current setlist state through mobile dependencies only; no business logic changed.

**Existing actions reused:**

- `showAll` - All Songs
- `showFavorites` - Favorites
- `adminPanelBtn` - permission-aware Admin Panel
- `logoutBtn` - existing logout flow
- `themeToggle` - existing theme flow
- dynamically created `settingsBtn` - existing Settings modal
- `addSongBelowFavoritesBtn` and `openAddSongModal` - existing Add New Song flow
- `customSetlistDropdown`, `globalSetlistContent`, `mySetlistContent`, and `smartSetlistContent` - existing setlist selection and folder behavior

**Intentionally not implemented:**

- Songs catalogue redesign
- Song Preview context changes
- Setlist drawer redesign
- Recommendation drawer changes
- Transpose changes
- Rhythm / Loop changes
- App-level More menu
- Song-level More menu

**Intentionally not changed:**

- Home drawer contents
- Songs filter redesign
- Multi-select mode
- Setlist drawer
- Recommendation presentation
- App-level More menu
- Song-level More menu
- Transpose panel
- Rhythm / Loop panel
- Recommendation algorithm or weights
- Personal or global transpose semantics

### 2026-09-09 - Phase 2B: Mobile Songs Catalogue

**Status:** Implemented; data-backed browser validation pending an authenticated API session.

**Files changed:**

- `index.html`
  - Added compact mobile catalogue controls for Filters, Sort, and explicit Select mode.
  - Added the mobile filter backdrop and sticky multi-select action bar.

- `scripts/features/mobile-ui.js`
  - Added a mobile catalogue controller without replacing existing filtering or rendering logic.
  - Added `Filters · N active` state derived from the existing key, genre, mood, and artist selects.
  - Added a focused mobile filter sheet that exposes the existing filter and sort controls.
  - Added explicit Select mode; long-press selection was not added.
  - Added row checkboxes and contextual `Add N songs to <Active Setlist>` behavior.
  - Preserved the existing single-song add button and delegated add operations to its existing listeners.
  - Preserved existing edit/delete controls and permission behavior.
  - Added one-time listeners and mutation observation so rerendered catalogue rows receive mobile presentation only once.

- `styles.css`
  - Added mobile-only compact catalogue controls, sheet, row, selection, and dark-mode styling.
  - Kept song rows compact rather than converting the catalogue into large cards.
  - Left desktop catalogue layout and controls unchanged.

- `main.js`
  - Exposed existing song state and notifications to the mobile presentation controller only.
  - Did not change backend contracts, filtering logic, permissions, or catalogue state ownership.

**Existing behavior reused:**

- `SongsUI.renderSongs()` for catalogue rendering and metadata.
- Existing `searchInput`, `keyFilter`, `genreFilter`, `moodFilter`, `artistFilter`, and `sortFilter` elements.
- Existing `filterAndDisplaySongs()`/render event wiring in `main.js`.
- Existing `checkSongInSetlistAndToggle()` path for single-song add/remove.
- Existing `editSong()` and `openDeleteSongModal()` handlers.
- Existing `isAdmin()` permission check for delete visibility.
- Existing selected setlist dropdown and LocalStorage-backed selection.

**Preserved state:**

- Search text and filter values remain in their existing controls.
- Opening/closing the filter sheet does not reload or clear catalogue state.
- Active setlist remains separate from catalogue rendering.
- Select mode is explicit and does not use long press.

**Intentionally not changed:**

- Song Preview
- Setlist drawer
- Recommendations
- Transpose
- Rhythm / Loop
- App-level More
- Song-level More
- Backend APIs and database schema
- Recommendation algorithm or weights
- Offline/cache behavior
- Legacy mobile navigation
- Backend APIs and database schema
- Service-worker caching behavior
- Standalone admin pages

## Validation Record

### Browser smoke checks

- Mobile viewport: 360px
- Mobile viewport: 375px
- Mobile viewport: 412px
- Desktop viewport: 1024px

### Results

- Mobile shell renders with exactly three destinations.
- Songs activates the existing Songs panel and hides the existing sidebar.
- Legacy floating mobile navigation is hidden in mobile modern mode.
- Desktop shell is hidden at desktop width.
- Desktop panel toggle controls remain visible.
- Song Preview remains part of the existing application surface.
- No page reload is used for shell navigation.
- `node --check scripts/features/mobile-ui.js` passed.
- `node --check main.js` passed.
- `git diff --check` passed.

### 2026-09-09 - Phase 2A validation

- Tested Home drawer presentation at 360px, 375px, and 412px.
- Confirmed exactly three bottom-navigation destinations remain visible.
- Confirmed the drawer reuses the existing sidebar action surface, including permission-aware actions and the existing dynamically created Settings action.
- Confirmed the active-setlist card is visible in the Home drawer.
- Confirmed opening Home from Songs preserves the Songs panel underneath.
- Confirmed closing Home restores the Songs panel, sidebar visibility, drawer state, and body scroll state without reloading.
- Confirmed desktop at 1024px hides the mobile shell, backdrop, active-setlist card, and close control while retaining existing panel toggles.
- `node --check scripts/features/mobile-ui.js` passed.
- `node --check main.js` passed.
- `git diff --check` passed after normalizing only the new HTML lines.

### 2026-09-09 - Phase 2B validation

- Static validation passed for `main.js` and `scripts/features/mobile-ui.js`.
- `git diff --check` passed after normalizing only the new HTML lines.
- Mobile control markup was verified at 360px, 375px, and 412px.
- Desktop mobile-control visibility was verified at 1024px.
- Full data-backed search, filter, single-add, and multi-add validation is pending because the shared browser session was loading the local file without an authenticated API session; the existing app remained at zero loaded songs and showed its existing `401` authentication warnings.

### 2026-09-09 - Post-Phase 2B Stabilization

**Status:** Complete; page loads correctly.

**Fixes made:**

- Hardened `hideLoading()` in `main.js` to hide every injected loading overlay, apply the hidden class, force `display: none`, and mark overlays as hidden for assistive technology.
- Fixed the mobile catalogue `MutationObserver` loop in `scripts/features/mobile-ui.js`. Row decoration now changes button text, labels, checkbox state, and selected-row classes only when values differ, preventing repeated observer callbacks from freezing the page.

**Validation:**

- `node --check main.js` passed.
- `node --check scripts/features/mobile-ui.js` passed.
- `git diff --check` passed.
- The page now completes loading without becoming unresponsive.

**Preserved:**

- Existing setlist loading and application state.
- Existing backend/API contracts.
- Existing desktop layout and legacy mobile navigation compatibility.
- Existing catalogue filtering, setlist, authentication, audio, and cache behavior.

### 2026-09-09 - Phase 2B Focused Functional Verification

**Status:** Complete; one Select-mode regression fixed.

**Viewports tested:**

- 360px
- 375px
- 412px
- 1024px desktop

**Normal Songs mode results:**

- Search: passed; search results populated for `Ajeeb`.
- New/Old: passed; New showed 552 songs and Old showed 263 songs.
- Key filter: passed; selecting `C` narrowed the catalogue.
- Genre filter: passed.
- Mood filter: passed.
- Artist filter: passed.
- Sort: passed; `A-Z` was applied.
- Favorites: passed; Favorites view rendered 111 songs in the authenticated session.
- Song Preview: passed; selecting a catalogue row opened the existing preview for the selected song.
- Single-song add/remove: passed through the existing setlist API path and was reversed after testing.
- Edit/delete permissions: passed for the authenticated admin session; Edit and Delete controls were visible and existing modal behavior opened.

**Select mode results:**

- Explicit Select mode entered and exited correctly.
- Row checkboxes selected and unselected correctly.
- Selected-row styling updated correctly.
- Filtering while selections existed preserved the selected IDs even when rows were no longer visible.
- Batch add to the active `Framish (My)` setlist succeeded for two filtered-out selections.
- Selection mode cleaned up after the successful add.
- Both temporary test additions were removed afterward; the tested songs returned to Add state.

**Catalogue/state results:**

- Active setlist remained selected while Songs continued showing the complete catalogue.
- Selecting an active setlist did not switch mobile Songs into the legacy setlist view; the mobile path returned to All Songs while retaining the selection.
- Filter and Select controls toggled once per click, confirming no duplicate listener behavior in the tested path.
- Mobile modern shell and catalogue controls were visible only at mobile widths.
- Desktop at 1024px retained the existing catalogue controls and did not display the mobile toolbar, sheet, or selection bar.
- No new console errors were observed during the authenticated verification. Existing non-fatal loop/resource warnings may still appear depending on available audio metadata.

**Regression fixed during verification:**

- `scripts/features/mobile-ui.js` previously tried to batch-add selected songs by finding their visible DOM rows. Filtering could remove those rows, so no additions occurred.
- `main.js` now exposes the existing `addToSpecificSetlist()` function to the mobile controller.
- The mobile batch action now delegates every selected song ID directly to that existing function, preserving API and permission behavior.

**Validation commands:**

- `node --check scripts/features/mobile-ui.js` passed.
- `node --check main.js` passed.
- `git diff --check` passed.

### 2026-09-09 - Phase 2C: Mobile Song Preview Shell and Action Hierarchy

**Status:** Implemented and verified.

**Files changed:**

- `scripts/features/song-preview-ui.js`
  - Added mobile-only preview context showing `Setlist · Active` and the selected setlist name.
  - Added a mobile recommendation icon that delegates to the existing Suggested Songs drawer.
  - Added the mobile action hierarchy: `Setlist`, `AUTO`, and `More`.
  - Delegated Setlist to the existing preview setlist action.
  - Delegated AUTO to the existing global auto-scroll control.
  - Used More to reveal existing Edit/Delete controls only; no new song actions or APIs were created.
  - Kept existing lyrics/chord rendering, metadata, transpose, loop initialization, recommendation algorithm, and permissions unchanged.

- `styles.css`
  - Added mobile-only Song Preview hierarchy, active-setlist context, recommendation icon, and action styling.
  - Hid the legacy global Auto-scroll control on mobile so AUTO appears exactly once.
  - Explicitly hid all new mobile preview elements at desktop widths.
  - Preserved the original desktop preview action row and styling.

**Intentionally not changed:**

- Backend/API contracts
- Database schema
- Recommendation algorithm or weights
- Transpose semantics
- Rhythm/Loop audio engine
- Offline/cache behavior
- Desktop preview layout and controls
- Existing Song Preview renderer and panel/state architecture

### 2026-09-09 - Phase 2C verification

**Viewports tested:**

- 360px
- 375px
- 412px
- 1024px desktop

**Results:**

- Song Preview opened from the existing Songs catalogue at all mobile widths.
- Title, favorite control, metadata, active-setlist context, and lyrics remained visible.
- Mobile context displayed the active setlist name `Framish`.
- Mobile action hierarchy rendered exactly as `Setlist`, `AUTO`, and `More`.
- Recommendation icon was visible and populated the existing Suggested Songs drawer content.
- AUTO delegated to the existing auto-scroll control and could be started/stopped.
- More opened the existing Edit/Delete actions for the authenticated admin session.
- Desktop kept the original preview action row; new mobile context, action row, and recommendation icon were hidden at 1024px.
- No backend/API or desktop implementation changes were made.
- `node --check scripts/features/song-preview-ui.js` passed.
- `node --check scripts/features/mobile-ui.js` passed.
- `node --check main.js` passed.
- `git diff --check` passed.

**Presentation correction during verification:**

- Added desktop defaults hiding the new mobile preview elements.
- Hid the legacy global Auto-scroll button itself on mobile, leaving the new preview AUTO action as the only visible auto-scroll control.

### 2026-09-09 - Phase 2C Approval and Phase 2D Scope

**Status:** Phase 2C accepted.

The mobile Song Preview shell was approved because it modernizes presentation while preserving the existing song functionality underneath it.

Phase 2D is limited to exposing verified Song-level secondary actions through mobile More. No new functionality may be invented, simplified, or substituted for an existing implementation.

### 2026-09-09 - Phase 2D: Mobile Song-level More

**Status:** Implemented and verified.

**Existing actions exposed:**

- Song Information - delegates to the existing metadata expansion control.
- Edit Song - delegates to the existing permission-aware edit flow.
- Reset Transpose - delegates to the existing personal transpose reset.
- Delete Song - shown only for the existing admin-permitted path and delegates to the existing delete modal.
- Rhythm / Loop - scrolls to the existing rhythm pad container when present.

No backend/API, database, recommendation, transpose, audio, cache, routing, or desktop behavior was changed.

### 2026-09-09 - Phase 2D verification

**Viewports tested:**

- 360px
- 375px
- 412px
- 1024px desktop

**Results:**

- Mobile More opened and closed without changing the underlying Song Preview.
- Menu exposed only existing actions: Song Information, Edit Song, Reset Transpose, Delete Song for the authenticated admin, and Rhythm / Loop.
- Song Information delegated to the existing metadata expansion and revealed secondary metadata.
- Reset Transpose delegated to the existing personal transpose reset.
- Edit Song opened the existing edit modal.
- Delete Song opened the existing permission-aware delete modal; the test was cancelled without deleting data.
- Rhythm / Loop action targeted the existing loop-player container.
- Desktop hid the mobile More menu and retained the original preview actions.
- No backend/API, database, recommendation, transpose, audio, cache, routing, or desktop behavior changed.

**Regression fixed during verification:**

- Moved the `hasSongInformation` calculation below `chordsDisplay` initialization to prevent a preview initialization error.

**Validation commands:**

- `node --check scripts/features/song-preview-ui.js` passed.
- `node --check main.js` passed.
- `git diff --check` passed.

### 2026-09-09 - Phase 2E: Integration Verification and Mobile Panel Sizing

**Status:** Implemented and verified.

Phase 2E remained integration verification only. The only regression fix was the unequal mobile Home/Songs panel sizing.

**Sizing fix:**

- Mobile modern mode now gives `.sidebar` and `.songs-section` the same automatic width: `min(88vw, 360px)`.
- The existing persisted `sidebarWidth` and `songsPanelWidth` settings remain unchanged for desktop and non-modern layouts.
- No routing, panel/state architecture, backend/API, or business logic changed.

**Verification:**

- Confirmed both mobile panels resolve to the same computed width at 360px, 375px, and 412px.
- Confirmed desktop sizing remains governed by the existing settings at 1024px.
- Confirmed Home drawer, Songs catalogue, Song Preview, Song-level More, active setlist context, and legacy navigation continue to use the existing integration paths.
- `node --check scripts/features/song-preview-ui.js` passed.
- `node --check scripts/features/mobile-ui.js` passed.
- `node --check main.js` passed.
- `git diff --check` passed.

### 2026-09-09 - Phase 2F: End-to-End State and Context Verification

**Status:** Complete; no implementation regression fix required.

**Scope:**

- Home -> Songs -> Song Preview -> Song-level More -> Songs flow.
- Current song, active setlist, search, filters, sort, selected tab, transpose, recommendation context, panel visibility, and practical scroll-state preservation.
- Equal automatic mobile panel sizing at 360px, 375px, and 412px.
- Desktop preservation at 1024px.

No implementation changes are planned unless this verification discovers a concrete regression.

### 2026-09-09 - Phase 2F verification results

**Authenticated flow:** Existing admin session with loaded catalogue and active `Framish (My)` setlist.

**Connected flow results at 375px:**

- Songs opened from the mobile shell.
- Search `Ajeeb` and key filter `C` produced the expected filtered catalogue state.
- Home opened with the active-setlist card and preserved search, key filter, selected tab, and catalogue count after close.
- Song Preview opened without changing the active setlist.
- Preview retained the current song and displayed `Setlist · Active` with `Framish`.
- Song-level More opened the existing five verified actions and closed cleanly.
- Recommendations populated through the existing drawer path.
- Returning to Songs preserved the current song and Songs remained the catalogue view.
- No add, delete, edit, or other persistent data mutation was performed during this pass.

**Responsive results:**

- 360px: sidebar and Songs panel both computed to `316.797px`.
- 375px: sidebar and Songs panel both computed to `330px`.
- 412px: sidebar and Songs panel both computed to `360px`.
- 1024px: mobile shell and catalogue controls were hidden; existing desktop panel sizing and preview actions remained active.

**Integration results:**

- Active setlist remained context, not a Songs filter or setlist-only route.
- Current song survived Home, More, recommendation drawer close, and return to Songs.
- Existing panel/state architecture remained in use.
- No new console/page errors were observed in the authenticated verification flow.
- No implementation changes were required during Phase 2F.

**Test harness note:**

- For responsive verification, each viewport was selected before page reload so mobile initialization ran at the intended width. Resizing an already initialized desktop page in the browser harness does not reliably dispatch the app's resize lifecycle and is not representative of a fresh mobile load.

### 2026-09-09 - Phase 3 Setlist Inventory Approved

**Status:** Approved for implementation.

**Existing types:**

- Global Setlists: `/api/global-setlists`; admin mutation permissions.
- My Setlists: `/api/my-setlists`; authenticated user mutation permissions.
- Smart Setlists: `/api/smart-setlists`; condition-generated with creator/admin permissions.

**Existing state:**

- `currentViewingSetlist`
- `currentSetlistType` (`global`, `my`, or `smart`)
- `activeSetlistElementId`
- `setlistDropdown.value`
- `localStorage.selectedSetlist`
- `window.setlistResequenceMode`

**Existing actions to preserve:**

- Select/open: `populateSetlistDropdown()`, `selectDropdownOption()`, `showGlobalSetlistInMainSection()`, `showMySetlistInMainSection()`, `showSmartSetlistInMainSection()`
- Render: `renderGlobalSetlists()`, `renderMySetlists()`, `renderSmartSetlists()`, `displaySetlistSongs()`
- Add/remove: `addSongToCurrentSetlist()`, `addManualSongToSetlist()`, `addToSpecificSetlist()`, `removeSongFromSetlist()`, `removeFromSpecificSetlist()`
- Edit/delete: existing Global, My, and Smart handlers with their current permission checks
- Reorder: `window.setlistResequenceMode`, drag/drop rendering, and existing save sequence requests
- Smart actions: scan, refresh, edit, delete, and condition-based generation

**Approved mobile scope:**

- Add a mobile Setlist drawer/panel separate from the Songs catalogue.
- Preserve Global, My, and Smart setlists.
- Preserve ordered songs, New/Old grouping, preview, add, remove, edit, delete, reorder, refresh, and existing permission behavior.
- Closing the drawer must restore the underlying screen, current song, active setlist, search, filters, sort, selected tab, transpose, recommendation context, and practical scroll state.
- No new setlist behavior, API, schema, routing architecture, or permission model.

### 2026-09-09 - Phase 3: Mobile Setlist Drawer

**Status:** Implemented and verified.

**Files changed:**

- `index.html`
  - Added an `Open Setlist` action to the Home active-setlist card.
  - Added a mobile Setlist drawer, header, close control, backdrop, and DOM placeholder.

- `scripts/features/mobile-ui.js`
  - Added mobile Setlist drawer open/close state handling.
  - Relocates the existing `#setlistSection` into the drawer while open instead of duplicating its markup or handlers.
  - Restores the section to its original Songs-panel position on close.
  - Preserves sidebar/Songs visibility and Preview scroll state.
  - Hooks existing Global, My, and Smart folder clicks to open the drawer after their existing setlist handlers run.

- `styles.css`
  - Added mobile-only Setlist drawer, backdrop, header, active-setlist entry button, and dark-mode styling.
  - Desktop drawer remains hidden and existing desktop setlist presentation is unchanged.

- `main.js`
  - Exposed existing current setlist identity to the mobile controller only.

**Existing behavior preserved:**

- Global, My, and Smart setlist rendering.
- New/Old setlist tabs.
- Ordered song rows and song preview navigation.
- Add, remove, manual add, edit, delete, reorder, refresh, and existing More/actions.
- Existing permission checks and API calls.
- Existing `window.setlistResequenceMode` and save-sequence behavior.

**Verification:**

- 360px: drawer opened with 7 New and 4 Old songs; panel widths matched at `316.8px`.
- 375px: drawer opened with 7 New and 4 Old songs; panel widths matched at `330px`.
- 412px: drawer opened with 7 New and 4 Old songs; panel widths matched at `360px`.
- 1024px: mobile drawer and shell remained hidden; existing desktop sizing remained active.
- Closing the drawer restored `#setlistSection` to the Songs panel and removed the mobile drawer state.
- No persistent setlist mutation was performed during this verification.
- `node --check scripts/features/mobile-ui.js` passed.
- `node --check main.js` passed.
- `git diff --check` passed.

**Scope note:**

- Phase 3 changes only the mobile presentation and integration boundary. No backend/API, schema, routing architecture, setlist semantics, or permission changes were made.

### 2026-09-09 - Phase 3 Correction: Performance Workflow

**Status:** Implemented and verified.

**Corrections made:**

- Setlist song taps close the mobile drawer automatically and open the existing Song Preview path immediately.
- Added mobile-only Previous/Next controls sourced from the ordered active setlist songs.
- Added mobile-only Back to Setlist control from Song Preview.
- Reopening the drawer highlights and scrolls to the current preview song.
- Restored the existing Global/My Add Song header action and connected it to the existing manual/existing-song modal flow.
- Smart Setlist taps use the extracted dependency-aware Smart handler instead of the duplicate legacy handler path.
- Fixed existing Smart Setlist hydration for primitive numeric song IDs so generated Smart songs render correctly.

**Verified workflow at 375px:**

- Home -> active Framish setlist -> drawer -> Pardes - Yeh Dil Deewana.
- Drawer closed automatically and Preview opened immediately.
- Next opened Kal Ho Naa Ho; Previous returned to Pardes - Yeh Dil Deewana.
- Back to Setlist reopened Framish and selected the current preview song.
- Global and My headers exposed existing edit/delete/reorder/save actions and Add Song.
- Smart Deepchandi exposed Update, Edit, and Delete actions and rendered 18 songs: New (10), Old (8).
- No persistent data mutation was performed during this correction verification.

**Desktop verification:**

- At 1024px the mobile Setlist drawer, Previous/Next controls, and Back to Setlist control were hidden.
- Existing desktop preview actions and setlist presentation remained active.

**Existing capability note:**

- Add existing song and manual song remain the existing modal flow behind `addManualSongBtn`, `selectExistingSong()`, and `addManualSongToSetlist()`; no replacement flow or new API was introduced.

**Validation:**

- `node --check scripts/features/setlists.js` passed.
- `node --check scripts/features/smart-setlists.js` passed.
- `node --check scripts/features/song-preview-ui.js` passed.
- `node --check scripts/features/mobile-ui.js` passed.
- `node --check main.js` passed.
- `git diff --check` passed.

### 2026-09-09 - Phase 3 Regression Review: Duplicate Screen and Stale Backdrop

**Status:** Complete; regressions corrected.

**Root causes confirmed:**

- `openMobileSetlistDrawer()` was moving `#setlistSection` into `#mobileSetlistDrawer`, creating a second full-screen presentation instead of using the existing Songs-panel section.
- Selecting a setlist from Home could leave the Home drawer lifecycle active while the setlist presentation opened, allowing a stale Home backdrop to dim Song Preview.

**Corrections:**

- `openMobileSetlistDrawer()` now acts as a mobile presentation bridge only. It closes Home, keeps `#setlistSection` in `.songs-section`, reveals the existing Songs panel, and explicitly clears Setlist overlay state.
- `closeMobileSetlistDrawer()` no longer hides or relocates the original setlist section when no mobile drawer state exists.
- Setlist row selection now closes all mobile overlay state before calling the existing `showPreview()` path.
- Smart Setlist taps use the extracted dependency-aware handler, avoiding the duplicate legacy handler error.
- Smart primitive song IDs are hydrated against the existing catalogue so Smart generated rows render correctly.

**Verification:**

- At 375px, selecting Framish left `#setlistSection` parented by `.songs-section`.
- Mobile Setlist drawer display was `none` after selection; Home and Setlist backdrops were both `display: none`.
- Tapping a setlist song opened the existing Preview with opacity `1` and no CSS filter.
- No extra click was needed to restore normal Preview interaction.
- Active setlist context remained visible in Preview.
- Smart Deepchandi rendered 18 songs with New (10) and Old (8) tabs.
- At 1024px, mobile drawer, backdrop, performance navigation, and return controls were hidden; desktop controls remained active.
- No backend/API/database, routing, recommendation, transpose, audio, cache, or desktop changes were made.

**Validation commands:**

- `node --check scripts/features/mobile-ui.js` passed.
- `node --check scripts/features/setlists.js` passed.
- `node --check scripts/features/smart-setlists.js` passed.
- `node --check scripts/features/song-preview-ui.js` passed.
- `node --check main.js` passed.
- `git diff --check` passed.

### 2026-09-09 - Phase 3B: Mobile Setlist Display Cleanup and Navigation Layer Correction

**Status:** Implemented and verified.

**Corrections:**

- Removed mobile `Back to Setlist` markup, styling, and event handling.
- Moved mobile active-setlist context below the Transpose block and reduced it to compact name/position text.
- Kept Previous/Next grouped above the compact context and tied to the existing ordered setlist state.
- Changed mobile setlist selection transition to use the existing Songs-panel `#setlistSection` without opening/reparenting a second drawer renderer.
- Closed Home state during setlist selection in capture phase to prevent stale backdrop/flicker.
- Kept the mobile bottom navigation above Home drawer layers.
- Added safe-area-aware notification clearance above the bottom navigation.

**Verification at 375px:**

- Setlist selection left `#setlistSection` parented by `.songs-section`.
- Mobile Setlist drawer and backdrops were `display: none` after selection.
- Song Preview opened immediately from the existing setlist row.
- Preview had opacity `1` and no filter/dimming.
- `Back to Setlist` was absent.
- Compact context rendered below Transpose as `Setlist · Framish / Song 1 of 11`.
- Previous/Next remained visible and functional.
- Home backdrop was cleared after setlist selection and song opening.
- Bottom navigation remained rendered with z-index `2500`.
- Notifications use `bottom: calc(76px + safe-area + 10px)` and z-index `2600` on mobile.

**Desktop verification:**

- At 1024px mobile drawer, mobile backdrop, mobile performance controls, compact notifier, and mobile navigation layers were hidden.
- Existing desktop Preview and Setlist presentation remained active.

**Preserved:**

- Existing setlist state, renderers, tabs, actions, ordering, permissions, Preview renderer, APIs, transpose, recommendations, audio, cache, and desktop behavior.

**Validation:**

- `node --check scripts/features/mobile-ui.js` passed.
- `node --check scripts/features/setlists.js` passed.
- `node --check scripts/features/smart-setlists.js` passed.
- `node --check scripts/features/song-preview-ui.js` passed.
- `node --check main.js` passed.
- `git diff --check` passed.

### 2026-09-09 - Phase 3C: Restore Original Setlist View and Remove Previous/Next

**Status:** Implemented and verified.

**Corrections:**

- Removed the inert Phase 3 mobile Setlist screen DOM/state/style remnants.
- Restored the original distinction between All Songs catalogue mode and specific Setlist Songs-panel mode.
- Mobile Global/My/Smart setlist selection now delegates once to the existing extracted setlist handler, closes Home, and leaves the existing `#setlistSection` visible inside `.songs-section`.
- All Songs continues to use the existing complete catalogue handler and closes Home cleanly.
- Removed the mobile Previous/Next implementation completely:
  - ordering helper
  - navigation helper
  - Previous/Next markup
  - position indicator
  - event listeners
  - related CSS
- Removed song position text from the compact Preview context.
- Kept compact `Setlist · <name>` context below Transpose.
- Preserved existing setlist song rendering, New/Old tabs, add/remove, edit/delete, reorder, Smart behavior, Preview, permissions, APIs, and desktop layout.

**Verification:**

- 360px: My setlist displayed in `.songs-section`; Preview opened; no Back/Previous/Next/position; no backdrop.
- 375px: All Songs showed the complete catalogue; My and Global showed their existing setlist rows; Smart showed generated rows through the existing renderer.
- 412px: specific setlist view remained in `.songs-section`; mobile panel widths remained equal.
- 1024px: original desktop setlist and Preview behavior remained active; mobile UI was hidden.
- Switching All Songs -> My -> All Songs -> Global -> All Songs -> Smart produced the correct view mode at each step.
- Setlist song selection opened the existing Preview immediately with opacity `1` and no filter/dimming.
- Active setlist context remained visible without a position counter.
- No duplicate mobile Setlist renderer or drawer element remains.
- No persistent data mutation was performed during verification.

**Validation:**

- `node --check scripts/features/mobile-ui.js` passed.
- `node --check scripts/features/song-preview-ui.js` passed.
- `node --check scripts/features/setlists.js` passed.
- `node --check scripts/features/smart-setlists.js` passed.
- `node --check main.js` passed.
- `git diff --check` passed.

### 2026-09-09 - Phase 3D: Remove Redundant Mobile Setlist View Layer

**Status:** Implemented and verified.

**Findings:**

- The visible `Setlist View` title and action bar were produced by the existing `#setlistSection`.
- The apparent duplicate was the existing Songs-panel `.sticky-header` catalogue controls remaining visible above that authoritative setlist section.
- No second song renderer remained after the earlier drawer correction.

**Corrections:**

- Added mobile-only `.mobile-setlist-mode` presentation state to the existing Songs panel.
- Specific Global/My/Smart setlist selection hides only the catalogue sticky header and leaves the original `#setlistSection` and its handlers active.
- All Songs removes `.mobile-setlist-mode` and restores the normal catalogue controls.
- Removed the remaining inert mobile Setlist screen DOM/state/style remnants.
- Removed the Previous/Next implementation, position indicator, and Back to Setlist control completely.
- Removed an accidental duplicate injected Global Add Song button.

**Verification:**

- All Songs: complete 552-song catalogue remained available with normal catalogue controls.
- Global Setlist: one Songs-panel setlist presentation with 73 New and 18 Old songs.
- My Setlist: one Songs-panel setlist presentation with its existing rows.
- Smart Setlist: one Songs-panel generated presentation with 10 New and 8 Old songs.
- Switching All Songs -> My -> All Songs -> Global -> All Songs -> Smart produced the correct view mode.
- Setlist song Preview opened immediately with no Back, Previous, Next, or position counter.
- Mobile setlist presentation remained inside `.songs-section`; no second drawer screen exists.
- No stale backdrop or greyed Preview appeared.
- 360px, 375px, and 412px mobile panel behavior remained intact.
- 1024px desktop behavior remained unchanged.

**Validation:**

- `node --check scripts/features/mobile-ui.js` passed.
- `node --check scripts/features/song-preview-ui.js` passed.
- `node --check scripts/features/setlists.js` passed.
- `node --check scripts/features/smart-setlists.js` passed.
- `node --check main.js` passed.
- `git diff --check` passed.

### 2026-09-09 - Phase 3E: Setlist Songs Panel State Model

**Status:** Implemented and verified.

**State correction:**

- Existing handlers now explicitly own the two Songs-panel modes:
  - `all` from the existing All Songs handler.
  - `setlist` from existing Global, My, and Smart setlist renderers.
- The mobile controller no longer forces `showAll()` when the setlist dropdown changes.
- The mobile controller no longer manually creates or maintains a separate setlist presentation.
- The original `#setlistSection` remains authoritative.
- `.mobile-setlist-mode` is presentation state derived from the explicit mode and only hides the catalogue sticky header on mobile.

**Verification:**

- All Songs at 360px and 412px: `mobile-setlist-mode` false, sticky catalogue header visible, `#setlistSection` hidden, 552 catalogue rows available.
- My Setlist at 360px and 412px: `mobile-setlist-mode` true, sticky catalogue header hidden, `#setlistSection` visible, 7 New and 4 Old rows.
- Global Setlist at 375px: existing `#setlistSection` visible with 73 New and 18 Old rows.
- Smart Setlist at 375px: existing `#setlistSection` visible with 10 New and 8 Old generated rows.
- All Songs transitions restore catalogue mode and hide the setlist section.
- No mobile Setlist drawer element remains.
- Setlist Preview still opens through the existing renderer with compact setlist context and no Previous/Next or Back control.
- At 1024px, the original desktop mode remains active; no mobile mode class or mobile presentation appears.

**Validation:**

- `node --check scripts/features/mobile-ui.js` passed.
- `node --check scripts/features/song-preview-ui.js` passed.
- `node --check scripts/features/setlists.js` passed.
- `node --check scripts/features/smart-setlists.js` passed.
- `node --check main.js` passed.
- `git diff --check` passed.

### 2026-09-09 - Favorites Panel Overlay Regression Review

**Status:** Complete; regression corrected.

**Root cause:**

- Favorites rendered correctly inside the Songs panel, but selecting Favorites from the Home drawer did not close the Home drawer lifecycle.
- `mobile-home-open` and `.mobile-home-backdrop.open` remained active, dimming the underlying Favorites panel.
- Favorites also did not explicitly reset the Songs view mode, so stale `mobile-setlist-mode` could remain after a prior setlist view.

**Correction:**

- Added the existing Home close lifecycle to the Favorites click path.
- Reset Songs view mode to `all` in the existing Favorites handler.
- Preserved existing Favorites rendering, search/catalogue state, authentication, and permissions.

**Verification at 375px:**

- Favorites rendered 111 songs.
- Favorites opacity was `1` and filter was `none`.
- Body no longer contained `mobile-home-open`.
- Home backdrop computed to `display: none`.
- Songs panel no longer retained `mobile-setlist-mode`.
- Bottom navigation remained visible.

**Validation:**

- `node --check scripts/features/mobile-ui.js` passed.
- `node --check main.js` passed.
- `git diff --check` passed.

### 2026-09-09 - Phase 3E: Mobile Bottom Navigation Content Clearance

**Status:** Implemented and verified.

**Correction:**

- Added shared mobile clearance variables based on the measured 65px fixed bottom navigation:
  - `--mobile-bottom-nav-height`
  - `--mobile-bottom-clearance`
- Applied the shared clearance to the actual mobile scroll containers:
  - `.sidebar`
  - `.songs-section`
  - `.preview-section`
- Updated mobile notifications to use the same safe-area-aware clearance.
- Kept the bottom navigation fixed and unchanged.
- No panel-specific arbitrary padding, feature behavior, or desktop layout changes were introduced.

**Fresh-load verification:**

- 360px, 375px, and 412px: fixed nav measured 65px and scroll-container clearance resolved to 77px (`65px + safe-area + 12px`).
- Preview final lyric content reached above the navigation; at 375px the final line bottom was `705px` while nav top was `735px`.
- Songs and Setlist panels received the same scroll clearance.
- Home sidebar received the same scroll clearance.
- Notifications resolve above the nav clearance.
- 1024px: mobile clearance variables were absent; desktop panel padding and notification positioning remained unchanged.

**Validation:**

- `node --check scripts/features/mobile-ui.js` passed.
- `node --check main.js` passed.
- `git diff --check` passed.

### 2026-09-09 - Mobile Primary Navigation: Home / Songs / Setlist

**Status:** Implemented and verified.

**Changes:**

- Replaced the mobile bottom-nav `More` destination with `Setlist`.
- Songs delegates to the existing `showAll` action and restores the complete catalogue.
- Setlist delegates to the existing selected-setlist state and Global/My/Smart renderers.
- When no setlist is selected, Setlist returns to the existing Home/setlist selection flow.
- Song-level More inside Song Preview remains unchanged.
- Home and existing Settings/preferences remain unchanged.

**Verification at 375px:**

- Bottom navigation labels are exactly Home, Songs, Setlist.
- Songs restored the complete 552-song catalogue with catalogue mode active.
- Setlist opened the selected existing setlist with 7 New and 4 Old rows.
- No Setlist drawer or duplicate renderer opened.
- Existing active setlist state was reused.

**Desktop verification:**

- Mobile navigation shell remains hidden at 1024px.
- Existing desktop layout and controls remain unchanged.

**Preserved:**

- Home/settings behavior.
- Catalogue search, filters, sort, favorites, Select mode, edit/delete, and add actions.
- Existing setlist state/renderers/actions.
- Song-level More, recommendations, transpose, auto-scroll, rhythm/loop, cache, and APIs.

### 2026-09-09 - Default Initial Global Setlist Selection

**Status:** Implemented and verified.

- When no `localStorage.selectedSetlist` exists, the existing setlist dropdown population path now defaults to the first available Global Setlist.
- Existing saved selection behavior remains unchanged.
- The existing initialization restore path displays the selected Global Setlist in `#setlistSection`.
- No new state, API, database, or renderer was introduced.

**Fresh-load verification:**

- Cleared `selectedSetlist` before reload.
- First Global Setlist selected: `Minor Flow`.
- Existing `selectedSetlist` key persisted as `global_68cfad9433e7101a8ee07d53`.
- Existing setlist section rendered with 73 New and 18 Old rows.

### 2026-09-09 - Smart Setlist Refresh Scan Error

**Status:** Fixed and verified.

**Root cause:**

- Existing Smart Setlist records can contain serialized condition strings such as `"moods":"[]"` and `"taals":"[Deepchandi],Deepchandi"`.
- `/api/songs/scan` assumed those fields were arrays and called `.map()` directly, producing `moods.map is not a function` and HTTP 500 during Smart refresh.

**Correction:**

- Added server-side normalization for Smart scan condition lists.
- Supports existing arrays, JSON-encoded arrays, comma-separated values, and mixed serialized values.
- Empty tempo bounds are normalized to `null` before the existing scan logic.
- No database schema, Smart Setlist model, scoring behavior, or frontend flow changed.

**Verification:**

- Reproduced the exact failing `Deepchandi` conditions before the fix: HTTP 500, `moods.map is not a function`.
- Restarted the local API with the corrected server code.
- Replayed the exact scan request: HTTP 200 with Smart Setlist song results.
- `node --check server.js` passed.

### 2026-09-09 - Mobile Setlist Dropdown Transition Overlay Fix

**Status:** Fixed and verified.

**Root cause:**

- Clicking `dropdownMainArea` correctly invoked the existing Global/My setlist renderer but did not close the mobile Home drawer or dropdown menu.
- The stale Home backdrop left the Songs-panel setlist view visually greyed and could intercept input.

**Correction:**

- `handleDropdownMainAreaClick()` now closes the existing dropdown menu and, on mobile only, closes the Home drawer before invoking the existing setlist renderer.
- No setlist renderer, state model, API, permission, or desktop behavior changed.

**Verification at 375px:**

- `dropdownMainArea` opened the selected Global setlist through the existing Songs-panel path.
- Home backdrop computed to `display: none`.
- Dropdown menu computed to `display: none`.
- `#setlistSection` remained inside `.songs-section` with `display: block`.
- Songs panel was visible and Preview opacity remained `1`.

**Validation:**

- `node --check scripts/features/setlists.js` passed.
- `node --check scripts/features/mobile-ui.js` passed.
- `node --check main.js` passed.
- `git diff --check` passed.

### 2026-09-09 - Song Preview More Menu Simplification

**Status:** Implemented and verified.

**Changes:**

- Removed redundant Song Information from Song-level More because the existing metadata `More Info` control already exposes it.
- Removed redundant Reset Transpose from Song-level More because the existing Transpose block already exposes Reset.
- Removed redundant Rhythm / Loop entry from Song-level More; the existing loop/audio controls remain available in Preview.
- Song-level More now exposes only the existing Edit Song and permission-aware Delete Song actions.
- Kept the primary mobile action row as Setlist, AUTO, and More.
- Kept AUTO connected to the existing auto-scroll implementation.
- Kept the existing metadata More Info and Transpose Reset controls unchanged.

**Verification at 375px:**

- Primary actions: Setlist, AUTO, More.
- Song-level More items: Edit Song, Delete Song.
- Song Information and Reset Transpose More items are absent.
- Existing metadata and transpose controls remain available.

**Validation:**

- `node --check scripts/features/song-preview-ui.js` passed.
- `node --check main.js` passed.
- `git diff --check` passed.

### 2026-09-09 - Mobile Panel Width Regression Fix and New Default

**Status:** Fixed and verified.

**Root cause:**

- Phase 2E's equal-width fix hardcoded `width: min(88vw, 360px)` on `.sidebar`/`.songs-section` in mobile-modern-mode, silently overriding the existing settings-driven `--sidebar-width`/`--songs-panel-width` CSS variables from the Panel Width setting.

**Correction:**

- Replaced the hardcoded value with `min(var(--sidebar-width), 88vw)` and `min(var(--songs-panel-width), 88vw)` so mobile panels honor the saved Panel Width setting again while still clamping to the viewport.
- Changed the first-load default (`loadSettings()` in `main.js`) from a 60%/20% mobile/desktop split to a single `70%` default for both `sidebarWidth` and `songsPanelWidth`.
- No setlist, catalogue, or desktop behavior changed; desktop continues to read the same CSS variables unmodified.

**Validation:**

- Confirmed the settings slider once again changes mobile Home/Songs panel width.
- Confirmed first-load (no saved setting) now resolves to 70%.
- `node --check main.js` passed.

### 2026-09-09 - Settings Modal Rendered Behind Home Drawer

**Status:** Fixed and verified.

**Root cause:**

- The shared `.modal` z-index (`2000`) was lower than the mobile Home drawer (`2200`) and its backdrop (`2100`), so Settings (and other modals) opened from Home rendered underneath the drawer.

**Correction:**

- Raised the shared `.modal` z-index to `2300`, above all existing mobile Home drawer layers.
- No modal markup, drawer markup, or desktop behavior changed.

**Validation:**

- Confirmed Settings now opens visibly above the Home drawer on mobile.

### 2026-09-09 - Song Preview Action Row Simplification

**Status:** Implemented and verified.

**Changes:**

- Removed the mobile-only `Setlist`/`More` action row and the `More` slide-out menu (Edit/Delete).
- Mobile Song Preview now renders the same `.song-preview-actions` row already used on desktop: `Add to Setlist`, `Edit`, and permission-aware `Delete`, directly in one row.
- Moved `AUTO` out of the action row entirely into a standalone floating circular button (`mobilePreviewFloatingAuto`) fixed above the bottom navigation, syncing its play/pause icon with existing auto-scroll state.

**Preserved:**

- Existing `previewSetlistBtn`, `previewEditBtn`, `previewDeleteBtn` handlers, admin-only Delete gating, and the existing `#toggleAutoScroll` auto-scroll implementation.
- Desktop preview action row and styling.

**Validation:**

- `node --check scripts/features/song-preview-ui.js` passed.
- `node --check main.js` passed.
- `git diff --check` passed.

### 2026-09-09 - Home Panel Favorites/Add New Song Button Readability

**Status:** Fixed and verified.

**Issues fixed:**

- `Favorites` and `Add New Song` button text was clipped (`white-space: nowrap`) on narrow phones, making the buttons appear empty.
- The favorites count markup mixed loose text nodes with an inline count `<span>`, which wrapped unpredictably (`Favorites 121 )` / `(` on two lines).
- Buttons were left-aligned and oversized for their short text content.

**Correction:**

- Restructured the favorites label markup into two atomic spans, `favorites-label` and `favorites-count-wrap` (the latter `white-space: nowrap`), so `(121)` never splits internally.
- Removed the extra `margin-left` between `(` and the count.
- Centered button text/icon (`justify-content`/`align-items`/`text-align: center`) and reduced `min-height` from 58-64px down to 46px now that the text reliably fits on one line.

**Validation:**

- `node --check main.js` passed.
- `git diff --check` passed.

### 2026-09-09 - Phase 6: Suggested Songs Drawer Mobile Presentation

**Status:** Implemented and verified.

**Files changed:**

- `styles.css`
  - Restyled `.suggested-songs-drawer` under `body.mobile-modern-mode` as a bottom-sheet (`min(78vh, 640px)`, rounded top corners, slide-up transform) instead of the legacy 55%-width sliver.
  - Added a tap-to-close backdrop using `body.mobile-modern-mode:has(.suggested-songs-drawer.open)::before`, consistent with the `:has()` pattern already used elsewhere in the stylesheet (e.g. `li:has(#showAll)`); no JS changes were needed since the existing outside-click/Escape handling in `scripts/shared/dom.js` already closes the drawer.
  - Restyled the header, close button, and `.suggested-song-item` rows to the mobile warm cream/olive theme with dark-mode colors and 44px-minimum touch targets.

**Preserved:**

- `getSuggestedSongs()` scoring/algorithm, `showSuggestedSongs()` rendering, and `closeSuggestedSongsDrawer()` lifecycle were not changed.
- Desktop drawer presentation is unchanged.

**Regression fixed during verification:**

- Tapping the mobile `mobilePreviewRecommendations` icon opened and then immediately closed the drawer. The icon's click handler forwarded a synthetic `.click()` to `#toggleSuggestedSongs` (which opened the drawer), but the original click event then continued bubbling to `document`, where the existing outside-click handler saw the icon was neither the toggle button nor inside the drawer and closed it again in the same tick.
- Fixed by calling `event.stopPropagation()` in the icon's click handler (`scripts/features/song-preview-ui.js`) so the original event no longer reaches the document-level outside-click listener.

**Validation:**

- `node --check scripts/features/song-preview-ui.js` passed.
- `git diff --check` passed.

### Environment limitation

The browser smoke check used an unauthenticated local file session. The existing application produced an authentication-related `401` warning while attempting protected data loading. This was not introduced by the mobile shell. Full authenticated checks still require a valid local session and running API environment.

## Current Risks and Open Questions

| ID | Question or risk | Consultation point |
|---|---|---|
| C-001 | Final breakpoint | Keep `768px`, or use a narrower mobile/tablet boundary? |
| C-002 | More behavior | Should Phase 2 app-level More open a drawer, sheet, or dedicated panel? |
| C-003 | Active setlist visibility | Should the active setlist summary persist in the shell, Home drawer, Song Preview, or both? |
| C-004 | Legacy navigation transition | When should swipe navigation and floating mobile controls be fully retired? |
| C-005 | Preview routing | Should Song Preview remain panel-based internally, or receive a mobile-only view-state wrapper? |
| C-006 | Safe-area and keyboard behavior | Which device/browser matrix should be the release baseline? |
| C-007 | Desktop protection | Is the current CSS-only isolation sufficient, or should desktop/mobile DOM containers be more explicitly separated? |

## Architect Review Feedback

Add feedback below without deleting the original implementation record.

### Review session: ____________________

**Architect:** ____________________

**Feedback:**

- 

**Approved changes:**

- 

**Rejected or deferred changes:**

- 

**New risks identified:**

- 

**Required validation:**

- 

## Future Change Entry Template

Copy this template for each approved follow-up:

```markdown
### YYYY-MM-DD - Change title

**Status:** Proposed / Approved / Implemented / Deferred

**Reason:**

**Files expected to change:**

- 

**Behavioral impact:**

- 

**Desktop impact:** None / Reviewed / Requires shared change

**Preserved contracts:**

- APIs:
- Permissions:
- State:
- Offline/cache:
- Audio:

**Validation performed:**

- 

**Architect feedback:**

- 
```

## Related Documents

- [Mobile Migration README](README.md)
- [Architecture Review](ARCHITECTURE_REVIEW.md)
- [Migration Plan](MIGRATION_PLAN.md)
- [Working Notes](WORKING_NOTES.md)
