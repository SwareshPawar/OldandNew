# New&Old Mobile Modern Mode - Architecture Review

## 1. Existing Architecture

New&Old is a vanilla JavaScript single-page application backed by Node/Express and MongoDB. The main runtime is `index.html`, `main.js`, and `styles.css`, with extracted IIFE modules under `scripts/`.

Existing responsibilities include:

- Song catalogue and filtering
- Song preview with lyrics, chords, and transpose
- Global, personal, and smart setlists
- Favorites and authentication
- Recommendation scoring
- Auto-scroll
- Rhythm loops and melodic pads
- Admin tools
- LocalStorage caching and delta synchronization
- Minimal install-oriented PWA support

The application currently uses a three-panel model: sidebar/navigation, songs catalogue, and song preview. The mobile redesign should change layout, navigation, and presentation while preserving these behavior owners.

## 2. Existing Mobile UI

The current mobile experience hides and shows the sidebar, songs panel, and preview using CSS classes, floating panel buttons, swipe gestures, and `scripts/features/mobile-ui.js`.

Current mobile behavior includes:

- Floating sidebar and songs navigation controls
- Swipe-based panel navigation
- Single-panel display at smaller widths
- Responsive song filters
- Full-width song preview
- Floating auto-scroll control
- Existing mobile-friendly touch targets
- Setlist and recommendation drawers/modals

The current model is functional but feels like the desktop three-panel application compressed onto mobile. The reference image suggests a better structure:

- Persistent three-item bottom navigation
- Home as an application drawer
- Songs as the full catalogue
- Song Preview as the primary performance surface
- Setlists, recommendations, transpose, and rhythm tools as overlays or focused panels
- More as a secondary action menu

## 3. Functionality Inventory

### Navigation and Home

Current entry points include the sidebar in `index.html`, `createMobileNavButtons()`, `addMobileTouchNavigation()`, and `goBackToSidebar()`.

The existing sidebar actions cover authentication, theme, favorites, setlists, admin access, and adding songs. The mobile Home drawer should reuse those actions and surface the active setlist prominently.

### Songs Catalogue

Existing functionality includes New/Old tabs, search, key/genre/mood/artist filters, sorting, favorites, metadata, add/edit/delete, and preview selection.

Relevant owners:

- `renderSongs()`
- `filterAndDisplaySongs()`
- `updateSongCount()`
- `scripts/features/songs-ui.js`
- `scripts/features/song-crud-ui.js`
- `scripts/features/setlists.js`

Songs should always mean the full catalogue. Selecting an active setlist must not convert the Songs screen into a setlist-only screen.

### Song Preview and Performance

Existing functionality includes title and metadata, favorites, lyrics/chord rendering, chord extraction, personal transpose, auto-scroll, setlist membership, and recommendation access.

Relevant owners:

- `showPreview()`
- `formatLyricsWithChords()`
- `extractDistinctChords()`
- `transposeChord()`
- `transposeSingleChord()`
- `updatePreviewWithTransposition()`
- `setupAutoScroll()`
- `startAutoScroll()`
- `toggleAutoScroll()`
- `scripts/features/song-preview-ui.js`

Lyrics/chords remain authoritative and visually dominant. The existing auto-scroll control should be relabeled `AUTO` or `Auto-scroll`; it must not be presented as music playback.

### Recommendations

Recommendations are implemented in `main.js`. Existing functions include `getSuggestedSongs()`, `showSuggestedSongs()`, `toggleSuggestedSongsDrawer()`, and `closeSuggestedSongsDrawer()`.

The algorithm scores existing song metadata including key/scale, language, tempo, time signature, genre, mood, vocal tags, and rhythm category. The mobile work must expose this behavior without changing the scoring algorithm.

### Setlists

The application supports Global Setlists, My Setlists, and Smart Setlists. `scripts/features/setlists.js` owns selection, descriptions, add/remove, edit/delete, ordering, and setlist UI synchronization. `scripts/features/smart-setlists.js` owns smart setlist conditions and scans.

Setlists should become a focused drawer or overlay. Collapse must return to the exact underlying screen without changing the current song, active setlist, filters, or route unnecessarily.

### Transpose

Transpose is handled by the preview module and persisted through user data and LocalStorage, including `transposeCache` and `/api/userdata`.

The mobile UI must distinguish:

- Original song key
- The current user's personal transpose
- Permission-aware global setlist transpose

Personal transpose must remain user-specific and must not modify the global song.

### Rhythm and Loop

The active runtime uses `loop-player-pad.js` for Web Audio behavior and `loop-player-pad-ui.js` for UI integration. The current implementation includes rhythm loops, fills, melodic atmosphere/tanpura pads, tempo, volume, and rhythm-set resolution.

The mobile UI should provide a dedicated Rhythm / Loop panel while reusing the active engine and preserving its capabilities.

### Authentication and Permissions

Authentication is JWT-based, with shared handling in `scripts/core/auth-client.js` and UI flows in `scripts/features/auth-ui.js`.

Permissions affect admin access, global setlists, song edit/delete, recommendation weights, rhythm administration, and global transpose. The mobile UI must not bypass or duplicate these rules.

### Offline and Caching

Existing behavior includes LocalStorage song caching, user-data caching, setlist caching, delta song synchronization, transpose caching, and service-worker registration.

The service worker is currently minimal and install-oriented. The redesign should preserve existing cache and sync behavior and should not imply full offline network caching until that is separately implemented.

## 4. Proposed Mobile Architecture

### Primary Navigation

Use exactly three persistent mobile destinations:

1. Home
2. Songs
3. More

Song Preview is not a fourth primary destination. It opens from Songs and becomes the focused performance surface.

### Current UI -> New Mobile UI -> Existing Function

| Current UI | New Mobile UI | Existing Functionality |
|---|---|---|
| Floating panel controls | Persistent bottom navigation | Existing mobile panel switching and state |
| Sidebar | Home drawer | Auth, theme, favorites, setlists, admin, add-song actions |
| Songs panel | Songs screen | `renderSongs()`, filters, sorting, search, favorites |
| Preview section | Performance view | `showPreview()`, lyrics/chords, transpose, auto-scroll |
| Setlist section/modal | Setlist drawer | Setlist rendering, add/remove/edit/reorder functions |
| Suggested Songs drawer | Recommendation drawer | `getSuggestedSongs()`, `showSuggestedSongs()` |
| Floating Auto-scroll button | Preview `AUTO` control | Existing auto-scroll logic |
| Song action buttons | More menu | Existing edit/delete/info/tool actions |
| Loop player UI | Rhythm / Loop panel | `loop-player-pad.js` and `loop-player-pad-ui.js` |
| Transpose controls | Transpose panel | Existing preview transpose and user-data persistence |
| Sidebar setlist selector | Active Setlist summary in Home | Existing setlist selection state |

### Home Drawer

The Home drawer should contain Admin Panel when permitted, All Songs, Favorites, active setlist summary, Global/My/Smart Setlists, Add New Song, Theme, Settings where supported, and Logout.

### Songs Screen

Songs remains the complete catalogue regardless of active setlist state. Mobile additions may include direct add-to-active-setlist behavior and explicit multi-selection mode, while preserving existing single-song add behavior.

### Performance Screen

The preview hierarchy should be:

1. Song title
2. Favorite
3. Recommendations
4. Song metadata
5. Setlist action
6. Transpose
7. Lyrics/chords
8. Auto-scroll
9. Secondary tools

### More Menu

Expose only verified existing capabilities. Candidate groups are Song Information, Edit Song, Reset Transpose, Delete Song when permitted, Rhythm / Loop, and other existing musical tools. Do not add fake placeholders for unavailable tools.

## 5. Files Likely To Change

- `index.html` - Mobile shell, bottom navigation, drawers, and contextual controls.
- `styles.css` - Mobile-only layout and reference-inspired visual treatment.
- `scripts/features/mobile-ui.js` - Three-destination mobile controller while preserving desktop panel behavior.
- `main.js` - Minimal mobile state bridges and event wiring; retain compatibility wrappers.
- `scripts/features/song-preview-ui.js` - Mobile control placement, auto-scroll labeling, and state restoration only.
- `scripts/features/songs-ui.js` - Mobile selection mode and catalogue presentation.
- `scripts/features/setlists.js` - Mobile drawer lifecycle and state-preserving collapse.
- `loop-player-pad-ui.js` - Only if panel lifecycle or responsive hooks are required.
- Documentation and focused regression checks.

## 6. Files That Should Remain Untouched

Unless an integration issue is proven, keep these unchanged:

- `server.js`
- `scripts/core/auth-client.js`
- `scripts/shared/chord-normalization.js`
- `scripts/shared/rhythm-set.js`
- `loop-player-pad.js`
- `scripts/features/auth-ui.js`
- `scripts/features/song-crud-ui.js`
- Standalone admin pages and their manager scripts
- `service-worker.js`

These files contain backend contracts, domain logic, authentication, audio behavior, or independent admin workflows.

## 7. Risks

- Shared panel classes may regress the desktop layout.
- Drawer close actions may accidentally reset song, filters, setlist, transpose, or scroll state.
- Active setlist state may be confused with catalogue filtering.
- Extracted modules and compatibility wrappers may receive duplicate event listeners.
- Recommendation context may be lost when changing songs from the drawer.
- Personal transpose may be confused with global setlist transpose.
- Touch resequencing may be unreliable without a button-based fallback.
- The six-pad loop player needs testing on narrow screens.
- The service worker does not currently provide full offline asset caching.
- Broad changes to `main.js` would carry high regression risk.

## 8. Implementation Phases

1. Baseline current desktop/mobile behavior.
2. Add the mobile shell and three-item bottom navigation.
3. Convert the sidebar into the Home drawer.
4. Preserve the full Songs catalogue and add mobile multi-selection.
5. Reorder the Song Preview around performance use.
6. Add the state-preserving Setlist drawer.
7. Expose the existing Recommendation drawer from Song Preview.
8. Add the More menu, Transpose panel, and Rhythm / Loop panel.
9. Apply mobile-only responsive styling.
10. Test narrow widths, dark mode, permissions, state preservation, loops, cache behavior, and desktop stability.

## 9. Decisions Needed Before Coding

1. Use the existing approximately `768px` breakpoint, or introduce a narrower breakpoint so tablets retain the current desktop-style panels?
2. Should mobile multi-select use an explicit `Select` mode only, or also support long-press selection?
