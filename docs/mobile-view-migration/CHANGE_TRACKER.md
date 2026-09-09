# Mobile View Migration - Change Tracker

**Purpose:** Consultation record for the New&Old mobile modern mode.

**Current stage:** Phase 2B complete: mobile Songs catalogue.

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
