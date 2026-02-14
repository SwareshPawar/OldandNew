# Contributing to Old & New Songs Application

Thank you for considering contributing to this project! This guide will help you understand our workflow and requirements.

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Documentation Requirements](#documentation-requirements)
3. [Development Workflow](#development-workflow)
4. [Code Standards](#code-standards)
5. [Testing](#testing)
6. [Commit Guidelines](#commit-guidelines)
7. [Pull Request Process](#pull-request-process)

---

## 🚀 Getting Started

### First Time Setup

1. **Fork and clone the repository**
   ```bash
   git clone <your-fork-url>
   cd OldandNew
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Git hooks (CRITICAL!)**
   ```bash
   node setup-git-hooks.js
   ```
   This installs a pre-commit hook that enforces documentation standards.

4. **Setup environment**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI and JWT secret
   ```

5. **Read the documentation**
   ```bash
   # Open and read CODE_DOCUMENTATION.md
   # Pay special attention to the "DOCUMENTATION MAINTENANCE HOOK" section
   ```

6. **Run the application**
   ```bash
   node server.js
   # Open http://localhost:3000
   ```

---

## 📝 Documentation Requirements

### ⚠️ CRITICAL: All code changes MUST be documented

This is **not optional**. The project uses a Documentation Maintenance Hook to ensure all changes are tracked.

### What to Document

**Every change must be added to `CODE_DOCUMENTATION.md` in the appropriate section:**

| Change Type | Documentation Section | Format |
|-------------|----------------------|--------|
| Bug fix | Section 8: BUGS ENCOUNTERED & RESOLVED | Bug #X format |
| New feature | Section 9: DEVELOPMENT SESSIONS | Session #X format |
| Security fix | SECURITY VULNERABILITIES | Update severity status |
| Architecture change | Relevant architecture sections | Update with details |
| Performance improvement | Development Sessions | Include benchmarks |
| API change | Update API documentation | List endpoints |

### Documentation Template for Bug Fixes

```markdown
### Bug #X: [Brief Title]
**Date Discovered:** YYYY-MM-DD  
**Severity:** [Low/Medium/High/Critical]  
**Status:** ✅ RESOLVED

**Description:**  
[What was broken? What was the user-facing issue?]

**Reproduction Steps:**
1. Step one
2. Step two
3. Expected vs Actual behavior

**Root Cause:**
[Technical explanation of why it happened]

**Solution:**
[How you fixed it]

**Code Changes:**
[List files modified with line numbers and key code snippets]

**Testing:**
[How to verify the fix works]
```

### Documentation Template for Features/Sessions

```markdown
### Session #X: [Feature Name]
**Date:** YYYY-MM-DD  
**Status:** ✅ COMPLETED / 🚧 IN PROGRESS  

**Problem Statement:**
[What problem does this solve? Why is it needed?]

**Solution Overview:**
[High-level description of your approach]

**Implementation Details:**
[Detailed technical explanation]

**Code Changes:**
[Files modified with line numbers and key snippets]

**Testing:**
[How to test the feature]

**Performance Impact:**
[Benchmarks if applicable]
```

### The Git Hook Process

When you commit code changes:

1. **Pre-commit hook runs automatically**
2. **Checks if you modified code files** (`.js`, `.html`, `.css`)
3. **Verifies `CODE_DOCUMENTATION.md` is also staged**
4. **Confirms documentation was actually modified** (not just staged unchanged)
5. **Asks you to verify documentation is complete**
6. **Only then allows the commit**

---

## 🔄 Development Workflow

### Before Starting Work

1. **Check existing documentation**
   - Read `CODE_DOCUMENTATION.md` for current state
   - Look for related bugs/features already documented
   - Understand the architecture sections

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b bugfix/bug-description
   ```

### During Development

1. **Take notes as you work**
   - Files you're modifying
   - Why you're making changes
   - Important decisions or tradeoffs
   - Alternative approaches considered

2. **Test thoroughly**
   - Manual testing in browser
   - Test on mobile view (responsive design)
   - Check console for errors
   - Test edge cases

### Before Committing

1. **Update CODE_DOCUMENTATION.md**
   - Add your changes in the appropriate section
   - Follow the template format
   - Include code snippets for critical changes
   - Update version number if significant change
   - Update "Last Updated" timestamp

2. **Stage your changes**
   ```bash
   git add main.js server.js  # Your code files
   git add CODE_DOCUMENTATION.md  # CRITICAL!
   ```

3. **Commit**
   ```bash
   git commit -m "Brief description (Bug #X or Session #X)"
   ```
   The Git hook will verify documentation and ask for confirmation.

4. **Push to your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

---

## 💻 Code Standards

### JavaScript Style

- **Indentation**: 4 spaces
- **Semicolons**: Use them
- **Quotes**: Single quotes for strings
- **Comments**: JSDoc format for functions
- **Error handling**: Try-catch blocks for risky operations

### Function Documentation

```javascript
/**
 * Brief description of what the function does
 * 
 * @param {string} param1 - Description of param1
 * @param {number} param2 - Description of param2
 * @returns {boolean} Description of return value
 */
function exampleFunction(param1, param2) {
    // Implementation
}
```

### Code Organization

- Keep functions focused (single responsibility)
- Avoid deep nesting (max 3 levels)
- Use descriptive variable names
- Add comments for complex logic
- Group related functions together

### Security Considerations

- Never log sensitive data (passwords, tokens)
- Validate all user input
- Use parameterized queries (no string concatenation)
- Sanitize data before inserting into DOM
- Follow principle of least privilege

---

## 🧪 Testing

### Manual Testing Checklist

Before committing, test:

- [ ] Feature works as intended
- [ ] No console errors
- [ ] Responsive design (mobile view)
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari)
- [ ] Error handling (invalid input, network failures)
- [ ] Loading states
- [ ] User notifications appear correctly

### Test Files

Run existing tests if modifying related functionality:

```bash
node test-api.js              # API endpoint tests
node test-jwt-validation.js   # Authentication tests
```

### Testing Documentation

In your documentation, include:

- Steps to reproduce the scenario
- Expected behavior
- Screenshots/GIFs if UI change
- Edge cases tested

---

## 📤 Commit Guidelines

### Commit Message Format

```
Brief description (Bug #X or Session #X)

Longer explanation if needed. Reference the documentation
section where details can be found.

See CODE_DOCUMENTATION.md Section 8, Bug #2 for full details.
```

### Good Commit Messages

✅ `Fix loader timing issue (Bug #2)`  
✅ `Implement delta sync system (Session #1)`  
✅ `Add documentation maintenance hook`  
✅ `Update authentication to use httpOnly cookies (Security)`

### Bad Commit Messages

❌ `Fixed stuff`  
❌ `WIP`  
❌ `Updated file`  
❌ `Changes`

---

## 🔀 Pull Request Process

### Before Creating PR

1. **Ensure all commits have documentation**
   ```bash
   # Review your commits
   git log --oneline
   
   # Each commit modifying code should have corresponding documentation
   ```

2. **Update main documentation if multiple commits**
   - Consolidate small changes into one documentation entry
   - Ensure version number reflects all changes

3. **Test the complete feature**
   - Fresh clone and test setup
   - Full user flow testing
   - Performance testing if applicable

### Creating the PR

1. **Title**: Clear, descriptive summary
   ```
   [Feature] Implement delta sync for faster page loads
   [Bug] Fix loader not appearing at 0% progress
   [Security] Migrate JWT to httpOnly cookies
   ```

2. **Description**: Include:
   ```markdown
   ## Summary
   [Brief overview of changes]
   
   ## Documentation
   - See CODE_DOCUMENTATION.md Section X
   - Bug #X or Session #X
   
   ## Testing
   - [ ] Manual testing completed
   - [ ] No console errors
   - [ ] Mobile responsive
   - [ ] Documentation updated
   
   ## Performance Impact
   [If applicable, include benchmarks]
   
   ## Breaking Changes
   [If any, describe and provide migration guide]
   ```

3. **Reference issues**: Link to related issues if any

### PR Review Checklist

Reviewers will check:

- [ ] CODE_DOCUMENTATION.md updated appropriately
- [ ] Code follows style guidelines
- [ ] No obvious security issues
- [ ] Performance is acceptable
- [ ] Testing is adequate
- [ ] Commit messages are clear
- [ ] No breaking changes (or properly documented)

---

## 🚫 What NOT To Do

### ❌ Never commit without documentation

```bash
# This will fail the Git hook
git add main.js
git commit -m "Made changes"
```

Documentation is **mandatory** for code changes.

### ❌ Never use --no-verify unless absolutely necessary

```bash
# Only use in emergencies (hotfixes, reverts)
git commit --no-verify
```

If you bypass the hook, you **must** document immediately after.

### ❌ Never modify CODE_DOCUMENTATION.md without code changes

Documentation should reflect actual code. Don't document future plans or ideas in this file.

### ❌ Never commit sensitive data

- API keys, passwords, tokens
- MongoDB connection strings
- Personal data
- Database exports with real user data

---

## 🤔 FAQ

### Q: Do I need to document trivial changes like typo fixes?

**A:** For typos in comments or documentation, no. For typos in user-facing text or code logic, yes.

### Q: What if my change is too small to warrant a full Session?

**A:** Add it to an existing session or create a brief entry. Even small changes should be tracked.

### Q: Can I make multiple commits before documenting?

**A:** The Git hook checks each commit. You should document incrementally, but you can consolidate documentation if doing exploratory work.

### Q: What if I forget to document before committing?

**A:** The Git hook will block your commit. Document first, then commit again.

### Q: How do I bypass the hook in emergencies?

**A:** Use `git commit --no-verify`, but document your changes ASAP after.

### Q: The hook is annoying, can I disable it?

**A:** The hook exists because documentation is critical for maintainability. If you're contributing, please respect this requirement.

---

## 📞 Questions?

- Read `CODE_DOCUMENTATION.md` first
- Check if your question is answered in this document
- Look at existing bug/session documentation for examples
- Contact project maintainers

---

## 📜 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

**Remember: Quality documentation is not overhead - it's how we build maintainable software. Future you will be grateful. 📝**
