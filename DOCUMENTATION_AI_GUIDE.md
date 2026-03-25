# Documentation Guide - Simplified Structure

## 📚 Documentation Files

### Core Documentation (Always Update These)

1. **`CODE_DOCUMENTATION.md`** - Single Source of Truth (6500+ lines)
   - **Section 8**: All bugs encountered and resolved
   - **Section 9**: Development sessions and features
   - **Security**: Vulnerability tracking
   - **Update**: After EVERY code change

2. **`LOOP_PLAYER_DOCUMENTATION.md`** - Technical Reference (590 lines)
   - Loop system architecture and matching logic
   - Song data structure (genres array, BPM conversion)
   - File naming conventions
   - API reference and troubleshooting
   - **Update**: When changing loop system

### Supporting Documentation

3. **`README.md`** - Getting Started (265 lines)
   - Installation instructions
   - Quick start guide
   - Project overview
   - **Update**: When adding major features

4. **`CONTRIBUTING.md`** - Development Guidelines (454 lines)
   - Git workflow
   - Documentation requirements
   - Code style guide
   - **Update**: When changing development process

5. **`DOCUMENTATION_AI_GUIDE.md`** - This file
   - How AI assistants should use documentation
   - Where to add what type of content
   - **Update**: When documentation structure changes

6. **`CHORD_ACCIDENTAL_NORMALIZATION.md`** - Accidental policy guide
   - Eb/Bb canonicalization implementation details
   - Rollback checklist for D#/A# policy

### Archived Documentation

- Historical, one-off, and migration-specific markdown files are kept in `docs/archive/`.
- Treat archive files as reference-only unless user explicitly asks to revive/move content.

---

## 🤖 For AI Assistants: Quick Guide

### Documentation Structure
```
📚 Active Documentation (6 files):

CODE_DOCUMENTATION.md           → Complete change history, bugs, sessions (6500+ lines)
├── Section 8: BUGS             → All bugs ever fixed
└── Section 9: SESSIONS         → Development sessions and features

LOOP_PLAYER_DOCUMENTATION.md    → Loop system technical reference (590 lines)
├── Song Data Structure         → How data is stored
├── Matching Logic              → How loops match songs
└── Troubleshooting            → Common issues

README.md                       → User-facing quickstart (265 lines)
CONTRIBUTING.md                 → Development workflow (454 lines)
DOCUMENTATION_AI_GUIDE.md       → This file (for AI assistants)
CHORD_ACCIDENTAL_NORMALIZATION.md → Chord accidental canonicalization policy

docs/archive/*                  → Historical documentation archive (read-only)
```

### When User Reports a Bug

1. **Check if already documented**:
   - Search `CODE_DOCUMENTATION.md` Section 8 for similar bugs
   - Search `LOOP_PLAYER_DOCUMENTATION.md` Troubleshooting section

2. **Gather context**:
   - What component? (Loop player, setlists, transpose, etc.)
   - Error messages?
   - Reproduction steps?

3. **Fix the bug**:
   - Make code changes
   - Test thoroughly

4. **Document in CODE_DOCUMENTATION.md Section 8**:
   ```markdown
   ### Bug #X: [Title]
   **Date:** [Date]
   **Severity:** Critical/High/Medium/Low
   **Status:** ✅ RESOLVED
   
   **Description:** [What went wrong]
   **Root Cause:** [Why it happened]
   **Solution:** [What was changed]
   **Files Modified:** [List with line numbers]
   **Testing:** [How to verify fix]
   **Lessons Learned:** [What we learned]
   ```

### When User Asks About Loop System

**Primary source**: `LOOP_PLAYER_DOCUMENTATION.md`

Key sections to reference:
- **Song Data Structure** (line ~85): How songs store taal, bpm, genres
- **Tempo BPM-to-Category** (line ~105): How BPM converts to slow/medium/fast
- **Matching Logic** (line ~150): How songs match loops (required vs optional)
- **Troubleshooting** (line ~390): Common issues and solutions

### Data Structure Quick Reference

**Songs** (MongoDB):
```javascript
{
  id: 805,
  taal: "Keherwa",              // String (any case)
  time: "4/4",                   // String OR timeSignature
  bpm: 121,                      // Number (actual BPM)
  genres: ["Old", "Qawalli"]     // Array (multi-select)
}
```

**Loop Files** (filesystem):
```
{taal}_{time}_{tempo}_{genre}_{TYPE}{number}.wav
keherwa_4_4_fast_qawalli_LOOP1.wav
```

**Matching Rules**:
- **Required**: Taal + Time must match (filters)
- **Optional**: Tempo + Genre boost score
- **Tempo**: BPM auto-converted (<80=slow, 80-120=medium, >120=fast)
- **Genre**: ANY genre in array can match

### When Creating New Documentation

**DON'T**: Create separate markdown files for each issue in repo root
**DO**: Update existing main documents:
- Bug? → `CODE_DOCUMENTATION.md` Section 8
- New feature? → `CODE_DOCUMENTATION.md` Section 9
- Loop system change? → `LOOP_PLAYER_DOCUMENTATION.md`
- Major feature docs? → Update `README.md` overview

**If a one-off note is still needed**: Put it under `docs/archive/`.

**Why**: Keep active docs minimal and centralized.

### File Change Protocol

1. **Make code changes**
2. **Test changes**
3. **Update `CODE_DOCUMENTATION.md`** (mandatory)
4. **Update feature-specific docs** if needed:
   - Loop changes → `LOOP_PLAYER_DOCUMENTATION.md`
5. **Update version number** in header
6. **Commit with descriptive message**

### Quick Search Tips

```bash
# Find bug documentation
grep -n "Bug #" CODE_DOCUMENTATION.md

# Find loop system info
grep -n "Matching Logic" LOOP_PLAYER_DOCUMENTATION.md

# Find recent changes
head -100 CODE_DOCUMENTATION.md  # Check version and last updated

# Find specific feature
grep -r "feature_name" *.md
```

---

## 🎯 Current State (Feb 28, 2026)

### Documentation Cleanup
- **Consolidated from 33 files → 6 files** (82% reduction!)
- Deleted 27 redundant/obsolete documentation files
- All content preserved in main docs

### Recent Changes
- **Version 1.17.3** (Feb 28, 2026, 11:50 PM)
- **Loop Player v2.0.3**
- **Last Major Fix**: Genre array matching bug (Bug #5)

### Known Issues
- None critical (see CODE_DOCUMENTATION.md Section 8 for resolved bugs)

### Active Features
- Loop player with 6-pad interface
- Smart setlists
- Transpose system
- Multi-select genres
- BPM-to-category tempo matching

---

## 📋 Quick Checklist for AI

Before answering questions:
- [ ] Check CODE_DOCUMENTATION.md for history
- [ ] Check feature-specific docs (LOOP_PLAYER, etc.)
- [ ] Verify current version numbers
- [ ] Look at actual code if docs unclear

After making changes:
- [ ] Update CODE_DOCUMENTATION.md
- [ ] Update feature-specific docs if needed
- [ ] Update version number
- [ ] Include file paths and line numbers
- [ ] Add testing instructions

---

## 💡 Tips for Better Understanding

1. **Start with CODE_DOCUMENTATION.md** - Has complete project history
2. **For loop issues** → LOOP_PLAYER_DOCUMENTATION.md has all details
3. **Data structures matter** - Songs use arrays/numbers, loops use strings/categories
4. **Only 6 files to check** - Much easier to find information now!
5. **When in doubt, check actual code** - Documentation explains the "why"

---

**Last Updated**: February 28, 2026  
**Documentation Count**: 6 files (down from 33)  
**Status**: Consolidated and cleaned up ✅
