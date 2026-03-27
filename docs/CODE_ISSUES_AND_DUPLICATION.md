# Code Issues And Duplication

Generated: 2026-03-27

This is one of the three canonical documentation files for the current codebase.

## Summary

The codebase is functional, but it has accumulated a large amount of structural duplication and transitional code. The main risk is not one isolated bug. The main risk is maintenance cost: multiple modules reimplement the same helpers, runtime behavior is spread across large global scripts, and older approaches are still present beside newer ones.

## Highest-Priority Structural Issues

### 1. main.js is a monolith

Observed state:

- 276 declared functions in a single file
- Mixed concerns: bootstrap, auth, rendering, setlists, smart setlists, admin UI, password reset, transpose, mobile gestures, draggable controls, rhythm-set UI
- Heavy use of shared mutable global state

Why it matters:

- Changes are harder to reason about
- Feature interactions are easy to break
- Testing and reuse are difficult
- Duplicate event-listener and initialization problems are more likely

Recommended direction:

- Split by domain first, not by arbitrary size
- Suggested first cuts: auth/session, songs/rendering, setlists, smart setlists, admin/rhythm tools, music utilities, UI/mobile helpers

### 2. Cross-file helper duplication

Several helpers are reimplemented in multiple places instead of being shared.

Most important duplicates:

- authFetch
  - main.js
  - loop-rhythm-manager.js
  - rhythm-mapper.js
- buildRhythmSetId and rhythm-family normalization logic
  - loop-manager.js
  - loop-rhythm-manager.js
  - server.js
- API base URL resolution
  - loop-manager.js
  - loop-rhythm-manager.js
  - melodic-loops-manager.js uses a third inline variant
- chord/key normalization helpers
  - main.js
  - server.js
  - migrate-chord-accidentals.js
- admin-page status helpers
  - isAuthenticated
  - showAuthenticationWarning
  - showAlert
  - playAudio
  - updateStats
  - duplicated across loop-manager.js and melodic-loops-manager.js

Why it matters:

- Bug fixes have to be repeated in several places
- Frontend and backend can drift on normalization rules
- Auth and API behavior are inconsistent across pages

Recommended direction:

- Create shared browser utilities for auth fetch, API base URL, alerts, auth gating, and rhythm-set formatting
- Create shared server/browser-safe normalization modules for rhythm-set IDs and chord normalization where practical

### 3. Legacy and active implementations overlap

Files showing overlap or transitional state:

- loop-player.js and loop-player-ui.DEPRECATED.js remain beside the active pad-based player
- loop-player-pad-soundtouch.js and loop-player-pad-tonejs.js provide alternate engines but are not clearly documented as active, optional, or experimental
- rhythm-mapper.js is active, while rhythm-sets-manager.js is empty and .old files are still present

Why it matters:

- It is harder to know which path is authoritative
- New contributors may edit the wrong file
- Duplicate names such as initializeLoopPlayer and getLoopPlayerHTML already exist across old and new player UIs

Recommended direction:

- Mark active versus legacy files explicitly in code comments and docs
- Move legacy implementations to an archive or legacy directory when safe
- Delete empty files once references are removed

### 4. DOM rendering relies heavily on innerHTML

Observed state:

- main.js contains extensive innerHTML usage for songs, setlists, admin tables, modals, multiselects, and preview fragments
- Existing security docs already flag XSS exposure for user-controlled values

Why it matters:

- Increases XSS risk when user-controlled strings are interpolated into markup
- Makes DOM logic harder to audit and refactor

Recommended direction:

- Convert user-data rendering paths to textContent or element creation APIs
- Introduce a small shared escaping/sanitization strategy for the remaining HTML-templated paths

### 5. Session state is duplicated between memory and localStorage

Observed state:

- jwtToken and currentUser are loaded and refreshed in several places
- Several modules read localStorage directly instead of going through one session layer

Why it matters:

- Session expiry and logout behavior can become inconsistent
- Admin tool pages each maintain their own auth checks and redirect patterns

Recommended direction:

- Centralize browser session handling in one shared module
- Make all admin pages use the same token retrieval, 401 handling, and redirect behavior

### 6. PWA implementation is minimal

Observed state:

- service-worker.js has install and fetch handlers, but no real caching logic

Why it matters:

- The repo advertises PWA support, but offline functionality is limited
- Future contributors may assume stronger offline guarantees than currently exist

Recommended direction:

- Either implement a real cache strategy or document the current PWA scope as installability-only

## Duplicate Hotspots

### Auth and request handling

- main.js: authFetch
- loop-rhythm-manager.js: authFetch
- rhythm-mapper.js: authFetch

Cleanup target:

- One browser-side request client with token injection, timeout, and 401 handling

### Rhythm-set identifier logic

- main.js: buildRhythmSetIdValue and normalization helpers
- loop-manager.js: buildRhythmSetId, normalizeRhythmFamily
- loop-rhythm-manager.js: buildRhythmSetId, normalizeRhythmFamily
- server.js: buildRhythmSetId, normalizeRhythmFamily, parseRhythmSetId

Cleanup target:

- One shared canonical rhythm-set ID policy consumed by both browser and server code

### Loop admin page helpers

- loop-manager.js
- melodic-loops-manager.js

Repeated patterns include:

- auth checks
- warning banners
- alert rendering
- audio preview playback
- stats refresh

Cleanup target:

- One shared admin-page utility layer for upload screens

### Chord and key normalization

- main.js
- server.js
- migrate-chord-accidentals.js

Cleanup target:

- One canonical implementation for runtime normalization, one migration wrapper if needed

## Files That Need Explicit Status Decisions

### Keep and treat as active

- main.js
- server.js
- loop-player-pad.js
- loop-player-pad-ui.js
- loop-manager.js
- loop-rhythm-manager.js
- melodic-loops-manager.js
- rhythm-mapper.js
- utils/auth.js

### Review and likely archive or remove later

- loop-player.js
- loop-player-ui.DEPRECATED.js
- rhythm-sets-manager.js
- rhythm-sets-manager.js.old
- rhythm-sets-manager.html.old

### Review and label clearly as optional engines

- loop-player-pad-soundtouch.js
- loop-player-pad-tonejs.js

## Signs Of Historical Accretion Inside main.js

The file contains comments indicating prior duplicate cleanup and initialization fixes, for example:

- duplicate loading prevention state
- comments noting removed duplicate load calls
- comments noting removed duplicate showAdminPanelModal logic
- repeated guard patterns to avoid duplicate listeners

This is a useful signal: the file has already grown beyond comfortable maintenance limits, and the code is compensating with defensive patterns.

## Suggested Cleanup Sequence

### Phase 1: Low-risk consolidation

1. Extract shared browser utilities
2. Normalize API base URL logic across all admin pages
3. Centralize authFetch behavior
4. Delete or archive empty and deprecated files once references are confirmed absent

### Phase 2: Runtime boundary cleanup

1. Split main.js into domain modules
2. Move transpose and chord-normalization logic into dedicated music utilities
3. Move password reset into an auth module
4. Move smart-setlist UI into its own feature module

### Phase 3: Security and render hardening

1. Audit and reduce innerHTML usage
2. Remove direct localStorage token reads from feature modules
3. Revisit token storage strategy
4. Align PWA claims with actual offline behavior

## Documentation Use

Use this file as the backlog reference for cleanup work. Use docs/CODEBASE_GUIDE.md for architecture context and docs/FUNCTION_INVENTORY.md when you need to locate exact functions by file.

For a concrete extraction sequence and file-by-file implementation order, use docs/REFACTOR_PLAN.md.