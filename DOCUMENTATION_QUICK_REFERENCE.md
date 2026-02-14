# 📝 DOCUMENTATION QUICK REFERENCE CARD

**⚠️ PRINT THIS AND KEEP IT VISIBLE WHILE CODING ⚠️**

---

## THE GOLDEN RULE

**ALL code changes MUST be documented in `CODE_DOCUMENTATION.md` before commit**

---

## QUICK WORKFLOW

### 1️⃣ Before Coding
```
☑️ Read CODE_DOCUMENTATION.md (understand current state)
☑️ Create feature/bugfix branch
☑️ Take notes as you work
```

### 2️⃣ During Coding
```
☑️ Note files modified
☑️ Note why you're making changes
☑️ Note important decisions
☑️ Test thoroughly
```

### 3️⃣ Before Committing
```
☑️ Update CODE_DOCUMENTATION.md
   → Bug fix? Add to Section 8: BUGS ENCOUNTERED & RESOLVED
   → New feature? Add to Section 9: DEVELOPMENT SESSIONS
   → Security? Update SECURITY VULNERABILITIES section
☑️ Follow the template format (see CONTRIBUTING.md)
☑️ Include code snippets for critical changes
☑️ Update version number if significant
☑️ Update "Last Updated" timestamp
```

### 4️⃣ Committing
```bash
git add [your-code-files.js]
git add CODE_DOCUMENTATION.md  # ← CRITICAL!
git commit -m "Description (Bug #X or Session #X)"
```

The Git hook will:
- ✓ Check if you modified code
- ✓ Verify documentation is staged
- ✓ Confirm documentation was modified
- ✓ Ask you to verify completeness
- ✓ Allow commit only after verification

---

## HOOK BYPASS (Emergencies Only!)

```bash
git commit --no-verify
```

**Then document IMMEDIATELY after!**

---

## DOCUMENTATION TEMPLATES

### Bug Fix Template
```markdown
### Bug #X: [Title]
**Date:** YYYY-MM-DD
**Severity:** [Low/Medium/High/Critical]
**Status:** ✅ RESOLVED

**Description:** [What was broken?]
**Root Cause:** [Why it happened]
**Solution:** [How you fixed it]
**Files Modified:** [List with line numbers]
**Testing:** [How to verify]
```

### Feature/Session Template
```markdown
### Session #X: [Feature Name]
**Date:** YYYY-MM-DD
**Status:** ✅ COMPLETED

**Problem:** [What problem does this solve?]
**Solution:** [High-level approach]
**Implementation:** [Technical details]
**Files Modified:** [List with line numbers]
**Testing:** [How to test]
**Performance:** [Benchmarks if applicable]
```

---

## COMMIT MESSAGE FORMAT

```
Brief description (Bug #X or Session #X)

See CODE_DOCUMENTATION.md Section Y for full details.
```

**Good:**
- `Fix loader timing issue (Bug #2)`
- `Implement delta sync (Session #1)`
- `Add rate limiting (Security)`

**Bad:**
- `Fixed stuff`
- `WIP`
- `Changes`

---

## SETUP NEW MACHINE

```bash
git clone <repo>
cd OldandNew
npm install
node setup-git-hooks.js  # ← Install documentation hook
cp .env.example .env      # Configure environment
node server.js            # Start server
```

---

## COMMON QUESTIONS

**Q: Do typo fixes need documentation?**  
A: Code typos = yes. Comment typos = no.

**Q: Hook is blocking my commit?**  
A: Good! Update documentation, then commit.

**Q: Can I document later?**  
A: No. The hook enforces it now.

**Q: Multiple small commits?**  
A: Document each commit or consolidate documentation.

---

## FILES TO KNOW

| File | Purpose |
|------|---------|
| `CODE_DOCUMENTATION.md` | 📝 SINGLE SOURCE OF TRUTH |
| `CONTRIBUTING.md` | Full contribution guide |
| `README.md` | Project setup instructions |
| `setup-git-hooks.js` | Installs documentation hook |

---

## HELPFUL COMMANDS

```bash
# Check what you've changed
git status
git diff

# See your commits
git log --oneline

# Reinstall hook if broken
node setup-git-hooks.js

# Bypass hook (emergency only)
git commit --no-verify
```

---

## REMEMBER

✅ Documentation is not overhead  
✅ Documentation is how we build maintainable software  
✅ Future you will thank present you  
✅ Team members rely on this information  

❌ Undocumented code = technical debt  
❌ "I'll document later" = never happens  
❌ "It's obvious" = not in 6 months  

---

**🔑 MANTRA: If it's not documented, it didn't happen.**

---

**Keep this visible. Check it before every commit. ✅**
