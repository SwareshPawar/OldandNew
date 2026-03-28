# Old & New Songs Application

A web application for managing a song catalog, setlists, and live musical performances. Built for musicians, worship teams, and music directors. Features chord display and transposition, rhythm loop playback with melodic pads, smart setlist generation, and a full admin toolkit for loop and rhythm-set management.

---

## Quick Start

### Prerequisites
- Node.js v14 or higher
- MongoDB Atlas account or local MongoDB instance
- Git

### Installation

```bash
git clone <repository-url>
cd OldandNew
npm install
node setup-git-hooks.js   # installs pre-commit documentation reminder hook
```

### Configure environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Key variables:

```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/OldNewSongs
JWT_SECRET=<strong random secret, min 64 chars>
PORT=3001
```

### Run

```bash
node server.js            # API server at http://localhost:3001
node static-server.js     # static file server at http://localhost:8080 (for admin pages)
```

Open the main app at `http://localhost:3001` or the admin pages at `http://localhost:8080`.

---

## Environments

This app runs in two environments. API URL resolution is centralized in `scripts/core/api-base.js` — there is no duplication.

| Environment | Frontend URL | API URL |
|---|---|---|
| **Local dev** | `http://localhost:3001` or `http://localhost:8080` | `http://localhost:3001` |
| **Production** | `https://swareshpawar.github.io/OldandNew/` | `https://oldand-new.vercel.app` |

**How it works (`scripts/core/api-base.js`):**
- Any `localhost` or `127.0.0.1` hostname → API goes to `http://localhost:3001`
- Any `*.github.io` hostname → API goes to `https://oldand-new.vercel.app`
- Any other origin (self-hosted) → API goes to `origin` (same domain)
- Override at runtime by setting `window.__API_BASE_URL__` or `localStorage.apiBaseUrl`

The GitHub Pages site is **static only** — it has no server. All API calls are routed to the Vercel deployment which hosts the Node/Express backend connected to MongoDB Atlas.

**CORS**: `server.js` allows `https://swareshpawar.github.io`, `https://oldand-new.vercel.app`, and all `localhost:*` origins.

---

## Project Overview

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla JavaScript, HTML5, CSS3 (no framework, no bundler) |
| Backend | Node.js + Express |
| Database | MongoDB Atlas |
| Auth | JWT (7-day tokens, stored in localStorage) |
| Audio | Web Audio API (loop player + melodic pads) |
| Deployment | Vercel (frontend + serverless), MongoDB Atlas |

### Core Features

- **Song catalog** — full CRUD with lyrics, chords, taal, BPM, key, genre tagging
- **Chord transposition** — real-time transpose with accidental normalization
- **Auto-scroll** — configurable speed for live performance
- **Setlists** — global, personal, and smart (condition-based auto-generation)
- **Recommendation weights** — admin-configurable signal weights for smart setlist matching
- **Rhythm loop player** — deterministic 6-pad playback (3 loops + 3 fills) resolved by `rhythmSetId`
- **Melodic pads** — atmosphere and tanpura samples organized by musical key with seamless crossfade looping
- **Admin tools** — rhythm set lifecycle management, loop uploads, song-to-rhythm-set mapping
- **Rhythm set profile learning** — AI-driven song suggestions based on profile analysis of 191 songs across 13 rhythm sets
- **Loop management** — swap loops between slots, select existing loops, duplicate rhythm sets with real-time validation
- **CLI suggestion tools** — profile-based song matching scripts for automated rhythm set assignments
- **Delta sync** — incremental song cache refresh (~90% faster than full reload)
- **PWA** — installable, minimal service worker
- **Mobile UI** — collapsible panels, touch navigation, responsive breakpoints

---

## Architecture

### Module System

The frontend uses an **IIFE + `window.*` namespace** pattern — there is no bundler and no ES6 `import`/`export`. This allows plain `<script>` tag loading while still achieving code isolation and reuse across pages.

```
index.html loads scripts in this order:
  1. scripts/core/         — foundational utilities (api-base, auth-client)
  2. scripts/shared/       — cross-page helpers (admin-page, rhythm-set, chord-normalization, dom)
  3. scripts/features/     — domain-specific UI modules (auth, songs, setlists, etc.)
  4. main.js               — app bootstrap and orchestration
  5. loop-player-pad.js    — audio engine
  6. loop-player-pad-ui.js — loop player UI integration
```

Each module in `scripts/` wraps its code in an IIFE and writes its public API to `window.*`:

```javascript
(function initAppApiBase(global) {
    global.AppApiBase = { resolve() { ... } };
})(window);
```

`main.js` consumes these via `window.AppApiBase.resolve()`, `window.AppAuth.configure(...)`, `window.RhythmSetUtils.*`, etc.

### Backend

`server.js` is the Express backend. Responsibilities:
- MongoDB lifecycle and collection management
- JWT auth middleware and admin enforcement
- All REST API routes (songs, setlists, rhythm sets, loops, users, admin)
- Loop file upload (multer) and metadata persistence
- Melodic loop file management

`api/index.js` is a thin Vercel serverless wrapper that re-exports `server.js`.

Shared backend utilities under `utils/`:
- `utils/auth.js` — register, authenticate, JWT sign/verify, OTP flows
- `utils/chord-normalization.js` — canonical chord/key normalization (shared with migration scripts)
- `utils/rhythm-set.js` — rhythm family/category normalization and ID building

---

## File Structure

```
OldandNew/
│
├── index.html                      # Main SPA entry point
├── main.js                         # App bootstrap, orchestration, global state
├── styles.css                      # Application styles
├── server.js                       # Express backend + all API routes
├── service-worker.js               # Minimal PWA (install/activate only)
│
├── scripts/                        # Extracted frontend modules (IIFE + window.* pattern)
│   ├── core/
│   │   ├── api-base.js             # window.AppApiBase — API URL resolution
│   │   └── auth-client.js          # window.AppAuth — token access, authFetch, 401 handling
│   ├── shared/
│   │   ├── admin-page.js           # window.AdminPage — alerts, auth banner, audio preview
│   │   ├── rhythm-set.js           # window.RhythmSetUtils — family/ID normalization
│   │   ├── chord-normalization.js  # window.ChordNormalization — accidental normalization
│   │   └── dom.js                  # window.DOMHelpers — modal, search history, highlightText
│   └── features/
│       ├── auth-ui.js              # window.AuthUI — login/register/logout button state
│       ├── password-reset.js       # window.PasswordResetUI — OTP flow
│       ├── songs-ui.js             # window.SongsUI — song list load/render/count
│       ├── song-crud-ui.js         # window.SongCRUDUI — edit/delete modal flows
│       ├── song-preview-ui.js      # window.SongPreviewUI — preview, transpose, auto-scroll
│       ├── setlists.js             # window.SetlistsUI — global/personal setlist CRUD
│       ├── smart-setlists.js       # window.SmartSetlistsUI — server-backed smart setlists
│       ├── rhythm-sets.js          # window.RhythmSetsUI — rhythm-set admin tab
│       ├── admin-ui.js             # window.AdminUI — user management, recommendation weights
│       └── mobile-ui.js            # window.MobileUI — touch nav, draggable panels
│
├── loop-player-pad.js              # Web Audio API loop engine (6 pads + melodic crossfade)
├── loop-player-pad-ui.js           # Loop player UI: pad interface, resolution, metadata cache
│
├── loop-manager.html               # Admin: rhythm loop upload/replace
├── loop-manager.js                 # Rhythm loop upload management
├── loop-rhythm-manager.html        # Admin: rhythm set lifecycle (create/edit/delete/slots/swap/duplicate)
├── loop-rhythm-manager.js          # Rhythm set workspace (slots, player, swap, select, duplicate)
├── melodic-loops-manager.html      # Admin: melodic pad sample management
├── melodic-loops-manager.js        # Melodic sample upload by key
├── rhythm-mapper.html              # Admin: batch song-to-rhythm-set assignment
├── rhythm-mapper.js                # Song mapper, bulk select, assign/unassign
│
├── scripts/
│   ├── core/                       # Core utility scripts
│   │   ├── api-base.js             # API URL resolution
│   │   ├── auth-client.js          # JWT token management
│   │   ├── build-rhythm-set-profiles.js        # NEW: Initial profile generation (276 lines)
│   │   ├── rhythm-set-profile-manager.js       # NEW: Profile update logic (378 lines)
│   │   ├── suggest-rhythm-assignments.js       # NEW: AI-driven song suggestions (219 lines)
│   │   └── check-rhythm-set-songs.js           # NEW: Quick rhythm set song lookup (44 lines)
│
├── utils/
│   ├── auth.js                     # Backend auth helpers (JWT, OTP, bcrypt)
│   ├── chord-normalization.js      # Backend chord normalization (shared with migration scripts)
│   └── rhythm-set.js               # Backend rhythm-set helpers
│
├── api/
│   └── index.js                    # Vercel serverless entry (re-exports server.js)
│
├── loops/
│   ├── loops-metadata.json         # Rhythm loop file registry and conditions
│   └── melodies/                   # Melodic samples: atmosphere_*.wav, tanpura_*.wav
│
├── uploads/
│   └── loops/                      # Uploaded rhythm loop audio files (.wav/.mp3)
│
├── legacy/
│   └── runtime/                    # Archived deprecated files (Phase 5 audit)
│                                   # loop-player.js, rhythm-sets-manager.js, etc.
│
├── docs/
│   ├── CODEBASE_GUIDE.md           # Architecture overview, data flow, API surface, admin features
│   ├── FUNCTION_INVENTORY.md       # Per-file function inventory for all active JS files
│   ├── CODE_ISSUES_AND_DUPLICATION.md  # Technical debt, duplication, cleanup backlog
│   └── REFACTOR_PLAN.md            # Phased refactor implementation log (Phases 1–6 complete)
│
├── backups/                        # Manual code backups (not part of runtime)
├── scripts/ (migration)            # One-off migration and validation scripts at root level
└── vercel.json                     # Vercel deployment config
```

---

## Key Subsystems

### Loop Player

The active runtime uses a **deterministic `rhythmSetId` resolution** model:

1. Songs are stored with `rhythmFamily`, `rhythmSetNo`, and computed `rhythmSetId` (e.g., `"keherwa_1"`)
2. `loop-player-pad-ui.js` resolves the playable loop set by matching `song.rhythmSetId` against loop metadata
3. `loop-player-pad.js` plays up to 6 web-audio buffers (3 loops + 3 fills) with seamless switching
4. If no matching set exists, the player UI is hidden — the user must map the song first

Melodic pads (atmosphere/tanpura) use a **recursive crossfade scheduling chain** — each loop boundary creates a new source that fades in while the old one fades out (2.0 s start/stop, 1.5 s crossfade). Audio graph: `Source → sourceGain → pad.gainNode → destination`.

See [LOOP_PLAYER_DOCUMENTATION.md](LOOP_PLAYER_DOCUMENTATION.md) for the full reference.

### Admin Workflow (Two-Screen Design)

Loop and rhythm-set administration is split across two standalone pages:

| Page | Purpose |
|---|---|
| `loop-rhythm-manager.html` | Create, rename, delete rhythm sets; upload/replace individual loop slots; test with integrated player |
| `rhythm-mapper.html` | Batch assign or unassign songs to rhythm sets (multi-select, bulk PUT) |

Both pages load only the shared scripts they need (`scripts/core/`, `scripts/shared/admin-page.js`, `scripts/shared/rhythm-set.js`) and enforce read-only mode for unauthenticated users.

Loop slot naming convention: `{taal}_{time_signature}_{tempo}_{genre}_{TYPE}{number}.wav`
Loop set API response includes: `availableFiles` (slot names, no extension), `files` (slot→filename map), `conditionsHint` (taal/tempo/genre/time).

### Authentication

- JWT tokens signed with `JWT_SECRET`, 7-day expiry, stored in `localStorage`
- `scripts/core/auth-client.js` (`window.AppAuth`) handles token reads, `Authorization` header injection, 60-second request timeout, and centralized 401 redirect
- Backend validates token on every protected route via `verifyToken` middleware in `utils/auth.js`
- Password reset uses a time-limited OTP flow (email or SMS)

### Song ID Contract

Songs use a numeric `id` field (not MongoDB's `_id`):
- All comparison code uses `parseInt()` for type safety: `parseInt(s.id) === parseInt(songId)`
- `_id` (MongoDB ObjectId) also exists but is never used by frontend code
- Assigned sequentially by `migrate-song-ids.js`

---

## API Reference (Major Endpoints)

| Group | Endpoints |
|---|---|
| Auth | `POST /api/register`, `POST /api/login`, `POST /api/forgot-password`, `POST /api/reset-password` |
| Users | `GET /api/users`, `PUT /api/users/:id/admin`, `DELETE /api/users/:id/remove-admin` |
| Songs | `GET/POST /api/songs`, `GET/PUT/DELETE /api/songs/:id`, `PUT /api/songs/:id/rhythm-set`, `GET /api/songs/scan` |
| Setlists | `GET/POST /api/global-setlists`, `/api/global-setlists/add-song`, `/api/global-setlists/remove-song` |
| Personal setlists | `GET/POST /api/my-setlists`, add/remove-song variants |
| Smart setlists | `GET/POST/PUT/DELETE /api/smart-setlists` |
| Recommendation weights | `GET/PUT /api/recommendation-weights` |
| Rhythm sets | `GET/POST /api/rhythm-sets`, `PUT/DELETE /api/rhythm-sets/:rhythmSetId`, `POST /api/rhythm-sets/:rhythmSetId/recompute`, `POST /api/rhythm-sets/duplicate` |
| Rhythm loop files | `GET /api/loops/metadata`, `POST /api/loops/upload-single`, `DELETE /api/loops/:loopId`, `POST /api/loops/:loopId/replace` |
| Rhythm set loop slots | `DELETE /api/rhythm-sets/:rhythmSetId/loops/:loopType`, `POST /api/rhythm-sets/loops/swap`, `POST /api/rhythm-sets/loops/assign`, `POST /api/rhythm-sets/loops/copy` |
| Rhythm set profiles | `GET /api/rhythm-set-profiles`, `GET /api/rhythm-set-profiles/:rhythmSetId` (Profile learning system) |
| Melodic loops | `GET/POST /api/melodic-loops`, `POST /api/melodic-loops/upload`, `POST /api/melodic-loops/:id/replace`, `DELETE /api/melodic-loops/:id` |
| Metadata | `GET /api/song-metadata`, `GET /api/debug/db` |

---

## Documentation

### Canonical docs (start here)

| File | Contents |
|---|---|
| [docs/CODEBASE_GUIDE.md](docs/CODEBASE_GUIDE.md) | Architecture, module map, data flow, API surface, admin feature contracts |
| [docs/FUNCTION_INVENTORY.md](docs/FUNCTION_INVENTORY.md) | Per-file function and method inventory for all active JS files |
| [docs/CODE_ISSUES_AND_DUPLICATION.md](docs/CODE_ISSUES_AND_DUPLICATION.md) | Technical debt, duplicate helpers, cleanup backlog |
| [docs/REFACTOR_PLAN.md](docs/REFACTOR_PLAN.md) | Phased refactor log — all 6 phases complete |

### Supporting reference docs (subsystem detail)

| File | Contents |
|---|---|
| [LOOP_PLAYER_DOCUMENTATION.md](LOOP_PLAYER_DOCUMENTATION.md) | Loop player subsystem: crossfade architecture, file naming, matching logic, API contracts, function reference |
| [CHORD_ACCIDENTAL_NORMALIZATION.md](CHORD_ACCIDENTAL_NORMALIZATION.md) | Chord accidental normalization policy and conversion tables |
| [RHYTHM_SET_PROFILE_LEARNING_PLAN.md](RHYTHM_SET_PROFILE_LEARNING_PLAN.md) | Rhythm set profile learning system: implementation plan, profile schema, scoring algorithm, CLI tools |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Development workflow, coding standards, commit process |

### Documentation lookup order

1. `docs/CODEBASE_GUIDE.md` — understand structure and find the right file/module
2. `docs/FUNCTION_INVENTORY.md` — locate the exact function
3. `docs/CODE_ISSUES_AND_DUPLICATION.md` — check if there's a known issue or debt item
4. Subsystem-specific docs for loop player or chord normalization detail

---

## Security

Phase 6 (completed March 2026) hardened all standalone admin pages against XSS injection:

- All dynamic values are HTML-escaped or transported via `data-*` attributes (`encodeURIComponent` → `decodeURIComponent` at handler site)
- Inline `onclick`/`oninput`/`onchange` handler attributes have been removed from all generated HTML in `loop-manager.js`, `loop-rhythm-manager.js`, `melodic-loops-manager.js`, and `rhythm-mapper.js`
- DOM nodes for table rows, loop slots, and player controls are now built with `createElement` + `textContent` instead of `innerHTML` string interpolation
- `renderLoopSlots()` returns a `DocumentFragment` — no raw HTML strings with dynamic content remain
- Auth is enforced on all mutating API routes; admin-only routes use a separate `requireAdmin` middleware

---

## Development Workflow

### Before coding

1. Read `docs/CODEBASE_GUIDE.md` to understand which module/file is involved
2. Check `docs/FUNCTION_INVENTORY.md` for exact function locations
3. Check `docs/CODE_ISSUES_AND_DUPLICATION.md` for related debt

### Before committing

Update the relevant canonical doc in `docs/`. The git pre-commit hook will prompt you to confirm documentation is up to date.

### Commit message format

```
Short description of change

Updates docs/CODEBASE_GUIDE.md to reflect <what changed>.
```

---

## Testing

```bash
node test-api.js                     # API endpoint smoke tests
node test-jwt-validation.js          # JWT validation tests
node test-mood-recommendations.js    # Recommendation algorithm tests
node test-setlist-creation.js        # Setlist generation tests
```

Manual testing checklist:
- Song CRUD (add, edit, delete, search)
- Setlist create/add/remove
- Authentication and password reset OTP flow
- Loop player: play, switch loop, adjust volume/tempo
- Admin pages: rhythm set create/edit/delete, slot upload, mapper assign/unassign
- Loop management: swap loops, select existing loops, duplicate rhythm sets
- Profile-based song suggestions via CLI tools

---

## CLI Tools for Rhythm Set Management

### Profile Building & Song Suggestions

```bash
# Build initial rhythm set profiles from existing song assignments
node scripts/core/build-rhythm-set-profiles.js

# Find similar songs for a specific rhythm set (by reference song)
node scripts/core/suggest-rhythm-assignments.js "Sweetheart Hain" --min-score=45

# Find only unassigned similar songs
node scripts/core/suggest-rhythm-assignments.js "Song Title" --unassigned --min-score=50

# Auto-apply assignments for high-confidence matches
node scripts/core/suggest-rhythm-assignments.js "Song Title" --min-score=70 --apply

# Check what songs are currently assigned to a rhythm set
node scripts/core/check-rhythm-set-songs.js "keherwa_1"
```

### Profile Learning System Features

- **13 Active Profiles**: Built from 191 songs across rhythm sets
- **6-Dimension Scoring**: Mood, genre, taal, time signature, BPM, rhythm category
- **Configurable Weights**: Adjustable scoring weights via ProfileScoringConfig collection
- **Automated Updates**: Profiles refresh automatically on song assignments
- **Markdown Reports**: Generates detailed suggestion reports with match reasons
- **Batch Processing**: Optional auto-apply mode for bulk assignments

---

## Deployment

### Vercel

1. Connect repository to Vercel
2. Set environment variables in Vercel dashboard: `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV=production`
3. `api/index.js` is the Vercel serverless entry point (auto-detected)

### Local / self-hosted

```bash
NODE_ENV=production node server.js
```

---

## Common Issues

| Symptom | Check |
|---|---|
| Server won't start | `.env` exists with valid `JWT_SECRET` and `MONGODB_URI`; port not already in use |
| Songs not loading | Server is running; browser console for API errors; check network tab |
| Loop player hidden | Song has no `rhythmSetId` — map it via `rhythm-mapper.html` first |
| Admin page shows read-only | Token missing or expired — log in from the main app |
| Git hook not prompting | Run `node setup-git-hooks.js` to reinstall; check `.git/hooks/pre-commit` exists |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for full guidelines.

Quick rules:
1. Update `docs/CODEBASE_GUIDE.md` for any architectural change
2. Update `docs/FUNCTION_INVENTORY.md` when the active JS function surface changes
3. Follow existing IIFE + `window.*` module pattern for any new shared script
4. No inline `onclick`/`oninput`/`onchange` in generated HTML — use `addEventListener` and `data-*` attributes
5. Escape all dynamic values before HTML context; use `textContent` over `innerHTML` wherever possible
