# DOCUMENTATION TEMPLATES

Copy the appropriate template below when documenting your changes in CODE_DOCUMENTATION.md

---

## BUG FIX TEMPLATE

Copy this to Section 8: BUGS ENCOUNTERED & RESOLVED

```markdown
### Bug #X: [Brief Descriptive Title]
**Date Discovered:** [YYYY-MM-DD]  
**Severity:** [Low / Medium / High / Critical]  
**Status:** ✅ RESOLVED  

**Description:**  
[What was the issue? What did users experience? Be specific and clear.]

**Affected Components:**
- [Component 1 - e.g., Mobile navigation]
- [Component 2 - e.g., Setlist rendering]
- [Component 3 - e.g., Back button handler]

**Reproduction Steps:**
1. [Step 1 - e.g., Open application on mobile]
2. [Step 2 - e.g., Navigate to a setlist]
3. [Step 3 - e.g., Click back button]
4. **Expected:** [What should happen]
5. **Actual:** [What actually happens]

**Root Cause Analysis:**

[Detailed technical explanation of WHY the bug occurred. Not just what was broken, but the underlying reason.]

**Debug Process:**

[How did you figure out what was wrong? What tools did you use? What did console logs reveal?]

```javascript
// Example debug code if applicable
console.log('Debugging step:', value);
```

**Console Output:**
```
[Any relevant console logs that helped identify the issue]
```

**Initial Attempted Fixes (Failed):**
1. ❌ [Approach 1 - e.g., Added CSS class] - Why it failed
2. ❌ [Approach 2 - e.g., Changed event timing] - Why it failed

**Final Solution:**

[Clear explanation of the fix that worked]

```javascript
// Before (BUGGY):
function example() {
    // buggy code
}

// After (FIXED):
function example(event) {
    if (event) {
        event.stopPropagation(); // Fix
    }
    // corrected code
}
```

**Updated Code Locations:**
1. `[filename.js]` line [XXX]: [What changed]
2. `[filename.html]` line [YYY]: [What changed]
3. `[filename.css]` line [ZZZ]: [What changed]

**Testing:**
- [x] [Test case 1 - e.g., Mobile back button works]
- [x] [Test case 2 - e.g., Desktop navigation unaffected]
- [x] [Test case 3 - e.g., Edge cases tested]

**Lessons Learned:**
1. [Lesson 1 - e.g., Event bubbling can cause race conditions]
2. [Lesson 2 - e.g., stopPropagation() is cleaner than exclusions]
3. [Lesson 3 - e.g., Always check element state during event flow]

**Related Issues:**
- [Reference to related bugs or features if any]

---
```

---

## FEATURE/SESSION TEMPLATE

Copy this to Section 9: DEVELOPMENT SESSIONS

```markdown
### Session #X: [Feature Name]
**Date:** [YYYY-MM-DD]  
**Duration:** [~X hours]  
**Status:** ✅ COMPLETED / 🚧 IN PROGRESS / ⏸️ PAUSED  
**Version:** [1.X]

#### Problem Statement

**Issue 1 - [Problem Name]:**
[Detailed description of the problem this feature solves. What was the pain point?]

**Issue 2 - [Another Problem if applicable]:**
[Additional problems addressed by this feature]

#### Solution Overview

[High-level description of your approach. What strategy did you use?]

**Key Design Decisions:**
1. [Decision 1] - Rationale
2. [Decision 2] - Rationale
3. [Decision 3] - Rationale

---

#### Implementation Part 1: [Component Name]

##### Backend Changes ([filename.js])

**1. [Change Description]**
```javascript
// Code snippet showing the change
// Include before/after if it's a modification
```

**Purpose:** [Why this change was needed]

**2. [Another Change]**
```javascript
// Another code snippet
```

##### Frontend Changes ([filename.js])

**1. [Change Description]**
```javascript
// Code snippet
```

**2. [Another Change]**
```javascript
// Code snippet
```

##### Performance Impact

**Before:**
- Metric 1: [e.g., Initial load: ~2.5 seconds]
- Metric 2: [e.g., Bandwidth: ~500KB]
- Metric 3: [e.g., Server queries: Full scan]

**After:**
- Metric 1: [e.g., Initial load: ~0.3 seconds]
- Metric 2: [e.g., Bandwidth: ~50KB]
- Metric 3: [e.g., Server queries: Indexed]

**Improvement: [X%] faster/smaller/better**

---

#### Implementation Part 2: [Another Component if applicable]

[Same structure as Part 1]

---

#### Files Modified

**Backend:**
1. `[filename.js]`
   - Line [XXX]: [Description of change]
   - Lines [YYY-ZZZ]: [Description of change]

**Frontend:**
1. `[filename.js]`
   - Lines [AAA-BBB]: [Description of change]
   - Line [CCC]: [Description of change]

2. `[filename.html]`
   - Line [DDD]: [Description of change]

---

#### Testing & Validation

**Manual Testing:**
- [ ] [Test case 1]
- [ ] [Test case 2]
- [ ] [Test case 3]
- [ ] [Edge cases]
- [ ] [Error handling]
- [ ] [Mobile responsive]

**Automated Testing:**
- [ ] [Test file name] - [What it tests]

**Performance Testing:**
- [ ] Benchmarked before/after
- [ ] Load testing completed
- [ ] Memory usage checked

---

#### Lessons Learned

1. **[Lesson 1 Title]:** [Description of what you learned]
2. **[Lesson 2 Title]:** [Another insight]
3. **[Lesson 3 Title]:** [Technical discovery]

---

#### Known Limitations & Future Improvements

**Current Limitations:**
- [Limitation 1 - e.g., Relies on server timestamps]
- [Limitation 2 - e.g., No conflict resolution beyond server-wins]

**Future Improvements:**
1. [Improvement 1 - e.g., Add WebSocket for real-time updates]
2. [Improvement 2 - e.g., Implement proper conflict resolution]
3. [Improvement 3 - e.g., Add analytics tracking]

**Recommendations:**
- [Action item 1]
- [Action item 2]

---
```

---

## SECURITY FIX TEMPLATE

For updates to the SECURITY VULNERABILITIES section

```markdown
#### X. ✅ [Vulnerability Name] - FIXED
**Date:** [YYYY-MM-DD]
- **Location**: `[filename.js]` line [XXX]
- **Issue**: [What was vulnerable]
- **Risk**: [What could happen]
- **Impact**: [Severity of the issue]
- **Fix Applied**:
  - ✅ [Change 1]
  - ✅ [Change 2]
  - ✅ [Change 3]
- **Testing**: [How to verify fix]
- **Code**:
  ```javascript
  // OLD (VULNERABLE):
  [vulnerable code]
  
  // NEW (SECURE):
  [fixed code]
  ```
```

---

## PERFORMANCE OPTIMIZATION TEMPLATE

```markdown
### Performance Optimization: [Feature/Component]
**Date:** [YYYY-MM-DD]
**Target:** [What you're optimizing]

**Before:**
- [Metric 1]: [Value]
- [Metric 2]: [Value]
- **Problem**: [What was slow/inefficient]

**After:**
- [Metric 1]: [Value]
- [Metric 2]: [Value]
- **Improvement**: [X%] faster/smaller

**Implementation:**
```javascript
// Show key optimization code
```

**Files Modified:**
- `[filename]` lines [XXX-YYY]

**Testing:**
- Benchmarked with [tool/method]
- Tested under [conditions]
```

---

## QUICK TIPS

### When Writing Documentation:

1. **Be Specific**: Don't say "fixed a bug", say "fixed loader appearing at 9% instead of 0%"
2. **Include Context**: Future you won't remember the details
3. **Show Code**: Snippets are more helpful than descriptions
4. **Explain Why**: Not just what changed, but why it needed to change
5. **Add Testing Steps**: How can someone verify this works?
6. **Link Related Items**: Reference related bugs/sessions
7. **Update Version**: Increment version number for significant changes
8. **Update Timestamp**: Always update "Last Updated" in header

### Don't Forget:

- [ ] Update version number in header
- [ ] Update "Last Updated" timestamp
- [ ] Add entry to "Recent Major Changes History"
- [ ] Reference in commit message
- [ ] Cross-reference related bugs/sessions

---

## VERSION NUMBERING

- **Major version (X.0)**: Complete rewrites, breaking changes
- **Minor version (1.X)**: New features, significant functionality
- **Patch** (append when needed): Small bug fixes

Current version is in header of CODE_DOCUMENTATION.md

---

**Copy these templates and fill them in completely. Good documentation helps everyone! 📝**
