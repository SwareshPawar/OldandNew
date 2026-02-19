# Old & New Songs Application

A comprehensive web application for managing song collections, setlists, and musical performances. Designed for musicians, worship teams, and music directors.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd OldandNew
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup Git hooks (IMPORTANT!)**
   ```bash
   node setup-git-hooks.js
   ```
   This installs a pre-commit hook that reminds you to update documentation.

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set:
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - Strong random secret (min 32 chars)
   - `PORT` - Server port (default: 3000)

5. **Start the server**
   ```bash
   node server.js
   ```

6. **Open the application**
   Navigate to `http://localhost:3000` in your browser

---

## 📝 **CRITICAL: Documentation Requirements**

**⚠️ BEFORE YOU START CODING - READ THIS!**

This project uses **mandatory documentation** via the Documentation Maintenance Hook.

### The Rule
**Every code change MUST be documented in `CODE_DOCUMENTATION.md` before the commit.**

### What to Document
- Bug fixes → Section 8: BUGS ENCOUNTERED & RESOLVED
- New features → Section 9: DEVELOPMENT SESSIONS  
- Security fixes → SECURITY VULNERABILITIES section
- Architecture changes → Update relevant sections
- Performance changes → Include benchmarks

### How It Works
1. **Git Hook**: Pre-commit hook checks if you modified code files
2. **Reminder**: Prompts you to verify documentation was updated
3. **Manual Check**: You confirm documentation is complete
4. **Commit Proceeds**: Only after documentation verification

### Full Documentation Guide
See the **"DOCUMENTATION MAINTENANCE HOOK"** section at the top of `CODE_DOCUMENTATION.md`

**Why This Matters:**
- Future you will thank present you
- Team members can understand changes
- Maintenance becomes possible
- Knowledge doesn't disappear

---

## 📚 Key Documentation Files

- **`CODE_DOCUMENTATION.md`** - Single source of truth for ALL code changes
- **`CONTRIBUTING.md`** - How to contribute (includes documentation workflow)
- **`MIGRATION_SONG_ID_FIX.md`** - Song ID standardization migration
- **`MULTISELECT_ANALYSIS.md`** - Multiselect consolidation analysis

---

## 🛠️ Development Workflow

### Making Changes

1. **Before coding:**
   - Read `CODE_DOCUMENTATION.md` to understand current state
   - Check for related bugs/sessions already documented

2. **During coding:**
   - Take notes of files modified and why
   - Note any important decisions or tradeoffs

3. **Before committing:**
   - Update `CODE_DOCUMENTATION.md` with your changes
   - Follow the format of existing sessions/bugs
   - Update version number if needed
   - Update "Last Updated" timestamp

4. **Commit:**
   - Git hook will verify you've documented
   - Write clear commit message
   - Reference documentation section in commit

### Example Commit Message
```
Fix loader timing issue (Bug #2)

Ensures loader appears at 0% and hides at 100% of initialization.
See CODE_DOCUMENTATION.md Section 9, Session #1 for details.
```

---

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Atlas)
- **Authentication**: JWT tokens
- **Deployment**: Vercel (frontend), MongoDB Atlas (database)

### Key Features
- Song management with lyrics & chords
- Smart setlist generation
- Chord transposition
- Auto-scroll for lyrics
- **Loop Player System:**
  - Automatic loop matching (Taal, Time Signature, Genre, Tempo)
  - Rhythm loops with fills and variations
  - Melodic pads (Tanpura, Atmosphere) organized by musical key
  - Tempo control with SoundTouch.js
  - Admin interfaces for uploading/managing loops
- Floating stop button for global playback control
- Admin panel
- PWA support (offline use)
- Delta sync (90%+ faster loads)
- Mobile-optimized UI with collapsible sections

### File Structure
```
├── main.js                        # Core application (~11,700 lines)
├── server.js                      # Backend API
├── index.html                     # Main HTML
├── styles.css                     # Styles (~6,700 lines)
├── service-worker.js              # PWA functionality
├── spinner.html                   # Loading overlay
├── CODE_DOCUMENTATION.md          # 📝 SINGLE SOURCE OF TRUTH
├── loop-player-pad.js             # Loop player audio engine (Web Audio API)
├── loop-player-pad-ui.js          # Loop player UI (v2.0 - pad-based interface)
├── loop-player-pad-soundtouch.js  # SoundTouch.js integration for tempo control
├── loop-player-pad-tonejs.js      # Tone.js integration (alternative)
├── loop-player-ui.DEPRECATED.js   # ⚠️ Old loop player UI (deprecated Feb 2026)
├── melodic-loops-manager.html     # Admin interface for melodic samples
├── melodic-loops-manager.js       # Melodic sample upload/management
├── loop-manager.html              # Admin interface for rhythm loops
├── loop-manager.js                # Rhythm loop upload/management
├── api/
│   └── index.js                   # Vercel serverless functions
├── utils/
│   └── auth.js                    # JWT utilities
├── loops/
│   ├── loops-metadata.json        # Loop metadata (taal, tempo, genre)
│   └── melodies/                  # Melodic samples by key (tanpura/atmosphere)
├── uploads/
│   └── loops/                     # Uploaded rhythm loop audio files
└── backups/                       # Code backups
```

---

## 🧪 Testing

### Manual Testing
- Open application in Chrome DevTools (mobile view)
- Test song CRUD operations
- Test setlist management
- Test authentication flow
- Test offline functionality

### Test Files
- `test-api.js` - API endpoint tests
- `test-jwt-validation.js` - JWT validation tests
- `test-mood-recommendations.js` - Recommendation algorithm tests
- `test-setlist-creation.js` - Setlist generation tests

---

## 🚨 Common Issues

### Server won't start
- **Check**: `.env` file exists and has valid `JWT_SECRET`
- **Check**: MongoDB connection string is correct
- **Check**: No other process using port 3000

### Songs not loading
- **Check**: Server is running
- **Check**: Browser console for errors
- **Check**: Network tab shows successful API calls

### Documentation hook not working
- **Run**: `node setup-git-hooks.js` to reinstall
- **Check**: `.git/hooks/pre-commit` file exists and is executable

---

## 📦 Deployment

### Vercel Deployment
1. Connect repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

### Environment Variables (Production)
- `MONGODB_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - Strong cryptographic secret (128+ chars)
- `NODE_ENV=production`

---

## 🤝 Contributing

See `CONTRIBUTING.md` for detailed contribution guidelines.

**Quick rules:**
1. Document ALL changes in `CODE_DOCUMENTATION.md`
2. Follow existing code style
3. Test thoroughly before committing
4. Write clear commit messages
5. Reference documentation in commits

---

## 📄 License

[Add your license here]

---

## 🔗 Links

- **Documentation**: See `CODE_DOCUMENTATION.md`
- **Security**: See "SECURITY VULNERABILITIES" section in documentation
- **Architecture**: See Section 14 in documentation

---

## 👥 Authors

[Add authors here]

---

**Remember**: 📝 If it's not documented in `CODE_DOCUMENTATION.md`, it didn't happen!