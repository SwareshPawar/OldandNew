# Documentation Index

Welcome to the Old & New Songs Application documentation. Start here to find information about the codebase, architecture, development guidelines, and known issues.

---

## 📚 Core Documentation

### Quick Start
- **[README.md](../README.md)** - Installation, setup, and quick start guide for new developers and users

### Architecture & Design
- **[CODEBASE_GUIDE.md](CODEBASE_GUIDE.md)** - Complete system architecture overview, runtime flow, and component responsibilities
  - Frontend entry points and module organization
  - Backend API routes and middleware
  - Database schema and collections
  - Authentication and authorization flow
  - **Start here for architecture understanding**

### Development Reference
- **[FUNCTION_INVENTORY.md](FUNCTION_INVENTORY.md)** - Exhaustive catalog of all 590+ functions in the codebase
  - Frontend functions by category (auth, songs, setlists, UI, etc.)
  - Backend API endpoints with parameters and responses
  - Helper functions and utilities
  - **Use this for finding specific functions and their signatures**

### Code Quality & Refactoring
- **[CODE_ISSUES_AND_DUPLICATION.md](CODE_ISSUES_AND_DUPLICATION.md)** - Known code issues, duplication, and technical debt
  - Potential bugs and their severity levels
  - Unused variables and dead code
  - Performance concerns and scalability issues
  - Security vulnerabilities (CRITICAL, HIGH, MEDIUM severity levels)
  - Recommended refactoring priorities
  - **Critical for identifying code problems to avoid**

### Implementation & Roadmap
- **[REFACTOR_PLAN.md](REFACTOR_PLAN.md)** - Ongoing refactoring and code extraction plan (6 phases)
  - Completed phases (1-6) with details on code extraction, hardening, and optimization
  - Archive of deprecated files moved to `/legacy/runtime/`
  - Future phases for continued cleanup
  - **Reference for understanding code organization decisions**

---

## 🎵 Feature-Specific Documentation

### Loop & Rhythm System
- **[LOOPS_ARCHITECTURE.md](LOOPS_ARCHITECTURE.md)** - Loop playback system architecture
  - Loop file structure and naming conventions
  - Metadata storage and lifecycle
  - Deterministic rhythm set matching algorithm
  - Admin tools and management interfaces
  - Production loop player system design
  - **Essential for loop system understanding**

- **[LOOP_PLAYER_DOCUMENTATION.md](LOOP_PLAYER_DOCUMENTATION.md)** - Technical reference for loop player subsystem
  - System components and initialization
  - Matching algorithm details with scoring logic
  - Song data structure requirements
  - Melody pad implementation (atmosphere, tanpura)
  - API endpoints for loop management
  - Troubleshooting and debugging guide
  - **Use for loop player specific questions**

### Chord System
- **[CHORD_ACCIDENTAL_NORMALIZATION.md](CHORD_ACCIDENTAL_NORMALIZATION.md)** - Chord accidental canonicalization (Eb/Bb policy)
  - Canonical chord spelling standards
  - Frontend normalization in main.js
  - Backend normalization utilities
  - Database migration strategy
  - Transpose behavior with normalized chords
  - **Reference for chord handling and normalization**

### Advanced Features
- **[RHYTHM_SET_PROFILE_LEARNING_PLAN.md](RHYTHM_SET_PROFILE_LEARNING_PLAN.md)** - AI-driven rhythm set profile matching system
  - Profile-based song recommendation algorithm
  - Implementation phases and data structures
  - Admin workflow for profile management
  - Planned features (collaborative filtering, machine learning)
  - **Future reference for AI features**

---

## 📝 Changelog & Git History

### Recent Changes
- **[CHANGELOG.md](CHANGELOG.md)** - Complete development history and change log
  - All bugs encountered and resolved with root causes
  - Development sessions with implementation details
  - Security vulnerabilities and their fixes
  - Performance optimizations with metrics
  - Version history and migration notes
  - **Reference for "what changed and why"**

### Bug Fixes & Hotfixes
- **[BUG_FIXES_ARCHIVE.md](BUG_FIXES_ARCHIVE.md)** - Archive of significant bug fixes
  - Loop replacement and duplicate metadata issues
  - Loop playback and audio caching fixes
  - Modal and UI interaction bugs
  - Database and authentication issues
  - **Historical reference for bug patterns**

### Git Commit Notes
- **[GIT_COMMIT_NOTES.md](GIT_COMMIT_NOTES.md)** - Summary of recent git commits
  - Commit messages with feature changes
  - Bug fixes and improvements
  - File modifications and their purposes
  - **For understanding git history**

### Development Guidelines
- **[DOCUMENTATION_GUIDE.md](DOCUMENTATION_GUIDE.md)** - How to write and maintain documentation
  - Documentation structure and organization
  - When to update which files
  - AI assistant guidelines for documentation
  - Best practices for clear documentation
  - **Follow this when updating documentation**

---

## Contributing

- **[CONTRIBUTING.md](../CONTRIBUTING.md)** - Contribution guidelines and development workflow
  - Getting started as a contributor
  - Documentation requirements
  - Development workflow and coding standards
  - Testing expectations
  - Pull request process
  - **Required reading for contributors**

---

## 📋 Documentation Organization

```
docs/
├── INDEX.md (this file)                     ← START HERE
├── CODEBASE_GUIDE.md                        ← Architecture overview
├── FUNCTION_INVENTORY.md                    ← Function reference
├── CODE_ISSUES_AND_DUPLICATION.md           ← Quality & debt
├── REFACTOR_PLAN.md                         ← Implementation roadmap
├── LOOPS_ARCHITECTURE.md                    ← Loop system design
├── LOOP_PLAYER_DOCUMENTATION.md             ← Loop player details
├── CHORD_ACCIDENTAL_NORMALIZATION.md        ← Chord standards
├── RHYTHM_SET_PROFILE_LEARNING_PLAN.md      ← AI features (planned)
├── CHANGELOG.md                             ← History & bugs
├── BUG_FIXES_ARCHIVE.md                     ← Past bug fixes
├── GIT_COMMIT_NOTES.md                      ← Recent commits
└── DOCUMENTATION_GUIDE.md                   ← Documentation standards

Root-level docs:
├── README.md                                ← Installation & quickstart
└── CONTRIBUTING.md                          ← Contribution guidelines
```

---

## 🎯 How to Use This Documentation

### I want to...

**Understand the application architecture**
→ Read [CODEBASE_GUIDE.md](CODEBASE_GUIDE.md) first, then reference [FUNCTION_INVENTORY.md](FUNCTION_INVENTORY.md) as needed

**Find a specific function**
→ Search [FUNCTION_INVENTORY.md](FUNCTION_INVENTORY.md) for the function name and signature

**Learn about the loop system**
→ Start with [LOOPS_ARCHITECTURE.md](LOOPS_ARCHITECTURE.md), then read [LOOP_PLAYER_DOCUMENTATION.md](LOOP_PLAYER_DOCUMENTATION.md) for details

**Understand chord handling**
→ Read [CHORD_ACCIDENTAL_NORMALIZATION.md](CHORD_ACCIDENTAL_NORMALIZATION.md) for the policy and implementation

**Know about known issues and bugs**
→ Check [CODE_ISSUES_AND_DUPLICATION.md](CODE_ISSUES_AND_DUPLICATION.md) for current issues, or [CHANGELOG.md](CHANGELOG.md) for past bug fixes

**Contribute to the project**
→ Start with [CONTRIBUTING.md](../CONTRIBUTING.md), then reference [DOCUMENTATION_GUIDE.md](DOCUMENTATION_GUIDE.md) for how to update docs

**Track project changes**
→ Review [CHANGELOG.md](CHANGELOG.md) for detailed session logs and [GIT_COMMIT_NOTES.md](GIT_COMMIT_NOTES.md) for recent commits

---

## 🔍 Quick Reference by Document

| Document | Type | Size | Best For |
|----------|------|------|----------|
| CODEBASE_GUIDE.md | Architecture | 31KB | Understanding overall system design |
| FUNCTION_INVENTORY.md | Reference | 22KB | Looking up specific functions |
| CODE_ISSUES_AND_DUPLICATION.md | Quality | 8KB | Finding bugs and technical debt |
| REFACTOR_PLAN.md | Roadmap | 26KB | Understanding code organization |
| LOOPS_ARCHITECTURE.md | Design | 7KB | Loop system high-level overview |
| LOOP_PLAYER_DOCUMENTATION.md | Technical | 28KB | Loop player implementation details |
| CHORD_ACCIDENTAL_NORMALIZATION.md | Policy | 6KB | Chord handling standards |
| RHYTHM_SET_PROFILE_LEARNING_PLAN.md | Feature Plan | 34KB | Future AI features |
| CHANGELOG.md | History | 314KB | Complete development history |
| BUG_FIXES_ARCHIVE.md | Bugs | 11KB | Past bug patterns and fixes |
| GIT_COMMIT_NOTES.md | Commits | 3KB | Recent git history |
| DOCUMENTATION_GUIDE.md | Standards | 7KB | Documentation best practices |

---

## 📞 Getting Help

- **For architecture questions** → See [CODEBASE_GUIDE.md](CODEBASE_GUIDE.md)
- **For API reference** → See [FUNCTION_INVENTORY.md](FUNCTION_INVENTORY.md)
- **For bugs** → See [CHANGELOG.md](CHANGELOG.md) then [CODE_ISSUES_AND_DUPLICATION.md](CODE_ISSUES_AND_DUPLICATION.md)
- **For loop system** → See [LOOPS_ARCHITECTURE.md](LOOPS_ARCHITECTURE.md)
- **For development** → See [CONTRIBUTING.md](../CONTRIBUTING.md)
- **For chord handling** → See [CHORD_ACCIDENTAL_NORMALIZATION.md](CHORD_ACCIDENTAL_NORMALIZATION.md)

---

**Last Updated:** March 28, 2026  
**Documentation Version:** 1.0  
**Organization Status:** ✅ Consolidated into docs/ folder
