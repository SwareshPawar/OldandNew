# Mobile View Migration Plan

## Objective

Create a mobile-specific New&Old experience that feels like a professional digital songbook and rehearsal workstation while preserving existing functionality, state, permissions, APIs, audio behavior, and desktop presentation.

## Non-Negotiable Constraints

- Exactly three primary mobile destinations: Home, Songs, More.
- Song Preview remains the main performance surface, not a fourth primary tab.
- Songs always represents the full catalogue.
- Preserve single-song add-to-setlist behavior.
- Add multi-selection without removing existing actions.
- Preserve recommendation scoring and current-song context.
- Preserve personal transpose semantics and global setlist transpose rules.
- Reuse the active rhythm/loop implementation.
- Preserve cache, LocalStorage, delta-sync, and authentication behavior.
- Keep desktop layout and controls unchanged.
- Do not change the database schema or backend contracts for this UI migration.

## Phase 0 - Baseline and Guardrails

### Work

- Capture the current desktop layout at a representative desktop width.
- Capture current mobile behavior at approximately 360px, 375px, and 412px.
- Verify login/logout, catalogue loading, filtering, preview, favorites, transpose, auto-scroll, setlists, recommendations, loops, and theme switching.
- Confirm the current desktop breakpoint and panel behavior before changing CSS.
- Confirm all mobile event listeners are initialized once.

### Acceptance

- A short manual baseline exists.
- Existing user changes in the worktree are understood.
- Desktop and mobile screenshots or notes are available for comparison.

## Phase 1 - Mobile Shell and Navigation

### Work

- Add a mobile-only shell around the existing application regions.
- Add persistent bottom navigation with Home, Songs, and More.
- Replace mobile floating navigation as the primary mobile route.
- Keep existing desktop panel controls and layout active outside the mobile breakpoint.
- Introduce explicit mobile view state without replacing existing song/setlist state.

### Acceptance

- Bottom navigation appears only on mobile.
- There are exactly three primary destinations.
- Desktop remains visually and behaviorally unchanged.
- Switching destinations does not reload the application.

## Phase 2 - Home Drawer

### Work

- Reuse the current sidebar actions inside a mobile Home drawer.
- Show active setlist name and song count prominently.
- Preserve All Songs, Favorites, Global/My/Smart Setlists, Add New Song, Theme, Settings, Admin Panel, and Logout where permitted.
- Keep permission-aware visibility for admin actions.

### Acceptance

- Home opens and closes without losing current song or filters.
- Active setlist remains selected after drawer interactions.
- Admin controls are visible only to permitted users.
- Logout and theme behavior still use existing flows.

## Phase 3 - Songs Catalogue

### Work

- Make Songs the full catalogue regardless of active setlist selection.
- Preserve New/Old tabs, search, key, genre, mood, artist, sorting, favorites, metadata, preview, edit, delete, and add actions.
- Add an explicit mobile multi-select mode.
- Reuse existing add-to-setlist functions for each selected song.
- Show a contextual action such as `Add 3 songs to Minor Flow` when an active setlist exists.
- Preserve the existing selection flow when no active setlist exists.

### Acceptance

- Active setlist selection does not filter the catalogue.
- Single-song add still works.
- Multi-selection adds the intended songs in one action.
- Existing filters and search survive opening/closing drawers.
- Edit/delete remain permission-aware.

## Phase 4 - Song Preview Performance Surface

### Work

- Keep the existing lyrics/chord rendering logic.
- Reorder mobile content around title, favorite, recommendation, metadata, setlist action, transpose, lyrics/chords, auto-scroll, and secondary tools.
- Add `+ Setlist`, `AUTO`, and `More` as the main action row.
- Ensure Auto-scroll appears once and is not represented as music playback.
- Preserve preview scroll position where practical.

### Acceptance

- Lyrics and chords remain readable and dominant.
- Auto-scroll starts, pauses, stops, and restores existing behavior.
- The current song remains selected after mobile panel interactions.
- No duplicate Play/Auto controls appear.

## Phase 5 - Setlist Drawer

### Work

- Add a mobile setlist drawer using existing Global, My, and Smart setlist data.
- Preserve name, type, count, ordered songs, add, edit, reorder, remove, and relevant actions.
- Preserve existing collapse behavior.
- Provide touch-safe reorder controls if drag-and-drop is unreliable.

### Acceptance

- Collapsing the drawer returns to the exact underlying view.
- Current song, active setlist, filters, and transpose are unchanged.
- Setlist mutations refresh existing state correctly.
- Global permissions remain enforced.

## Phase 6 - Suggested Songs Drawer

### Work

- Keep the existing recommendation algorithm and weights.
- Add a visible recommendation/shuffle action to the mobile preview header.
- Reuse the existing drawer lifecycle and current-song lookup.
- Show existing title, key, tempo, time signature, mood, and score data.
- Select a recommendation through the existing preview flow and recalculate from the new song.

### Acceptance

- Recommendations open from Song Preview without hiding the feature in More.
- The drawer identifies the current-song context.
- Selecting a recommendation opens it immediately.
- Closing the drawer returns to the correct underlying song/state.

## Phase 7 - More Menu and Musical Tools

### Work

- Add a song-specific More menu.
- Expose existing Song Information, Edit Song, Reset Transpose, and permission-aware Delete Song actions.
- Expose Rhythm / Loop through a focused panel.
- Add other tools only after confirming the existing implementation exists.

### Acceptance

- Edit/delete are removed from the primary preview row but remain accessible.
- Unavailable tools are not represented by fake controls.
- Existing modals and permission checks still run.

## Phase 8 - Transpose and Rhythm / Loop Panels

### Work

- Add a focused transpose panel showing Original Key, Your Key, current level, decrement, increment, and reset.
- Explain that personal transpose does not change the original song.
- Reuse the existing transpose cache and user-data update path.
- Add a focused Rhythm / Loop panel around the active six-pad player, tempo, volume, fills, melodic pads, and supported controls.
- Do not replace or simplify the Web Audio engine.

### Acceptance

- Personal transpose remains user-specific.
- Global setlist transpose remains separate and permission-aware.
- Transpose survives preview updates and expected panel interactions.
- Loop playback works on supported mobile browsers without changing rhythm behavior.

## Phase 9 - Mobile Visual System

### Work

- Apply the reference direction only within mobile styles:
  - Warm cream and beige surfaces
  - Dark green/olive accents
  - Subtle gold highlights
  - Strong readable typography
  - High-contrast performance controls
  - Rounded cards only where useful
  - Complete dark-mode treatment
- Preserve stable dimensions for controls, bottom navigation, tiles, and drawer headers.
- Test narrow screens for text overflow and control overlap.

### Acceptance

- The mobile interface reads as a professional songbook/workstation.
- Lyrics/chords remain high contrast in light and dark modes.
- Controls do not overlap or resize unexpectedly.
- Desktop colors and layouts remain unchanged.

## Phase 10 - Regression and Release Checks

### Functional checks

- Login, logout, registration, and admin visibility
- Home drawer state preservation
- Songs search, filters, sorting, tabs, favorites, and selection
- Single and multi-song setlist add
- Song Preview and lyrics/chords
- Personal transpose and reset
- Auto-scroll
- Recommendations and current-song recalculation
- Global/My/Smart setlists
- Setlist collapse and reorder
- Rhythm/Loop playback
- Theme switching
- Cached song loading and delta synchronization

### Responsive checks

- 360px phone
- 375px phone
- 412px phone
- Tablet boundary around the selected breakpoint
- Desktop width with the existing panel layout

### Release criteria

- No new console errors.
- No new syntax or runtime errors.
- Desktop behavior remains unchanged.
- Mobile navigation has exactly three primary destinations.
- No business logic or API contract was changed solely for presentation.
