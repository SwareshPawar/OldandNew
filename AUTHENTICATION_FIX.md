# Authentication Fix - Quick Troubleshooting Guide

## Issue Fixed
**Problem:** Unable to open rhythm-mapper.html or loop-rhythm-manager.html - pages redirect back to index.html

**Root Cause:** The new pages were looking for `token` in localStorage, but the main app stores it as `jwtToken`

**Solution:** Updated both files to use `jwtToken` (matching the main app)

---

## ✅ Fixed Files
1. `rhythm-mapper.js` - Changed `localStorage.getItem('token')` → `localStorage.getItem('jwtToken')`
2. `loop-rhythm-manager.js` - Changed `localStorage.getItem('token')` → `localStorage.getItem('jwtToken')`

---

## 🔧 How to Access the Pages

### Step 1: Login First
1. Open: http://localhost:3001/index.html
2. Click the **Login** button (or **Register** if you don't have an account)
3. Enter your credentials
4. Once logged in, you'll see your songs

### Step 2: Access New Pages
Now you can access:
- **Rhythm Mapper:** http://localhost:3001/rhythm-mapper.html
- **Loop & Rhythm Manager:** http://localhost:3001/loop-rhythm-manager.html

The pages will remember your login!

---

## 🚨 Troubleshooting

### Problem: "Please login first" alert appears
**Solution:** 
1. Go back to http://localhost:3001/index.html
2. Click Login button
3. Enter username and password
4. After successful login, try accessing the new pages again

### Problem: "Session expired" alert appears
**Solution:**
1. Your JWT token has expired
2. Login again at http://localhost:3001/index.html
3. Then access the new pages

### Problem: Still redirecting to index.html
**Check these:**
1. **Are you logged in?**
   - Open browser console (F12)
   - Type: `localStorage.getItem('jwtToken')`
   - Should show a long token string, not `null`

2. **Clear cache and reload:**
   - Press Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or clear browser cache

3. **Check server is running:**
   - Look for: `Server running on port 3001` in terminal
   - If not, run: `npm start`

---

## 🔐 Authentication Flow

```
1. User visits rhythm-mapper.html or loop-rhythm-manager.html
                    ↓
2. JavaScript checks localStorage for 'jwtToken'
                    ↓
        ┌───────────┴───────────┐
        │                       │
    Token EXISTS           Token MISSING
        │                       │
        ↓                       ↓
3. Load page data      Show alert & redirect
   (songs, rhythm      to index.html
   sets, etc.)         (login page)
        │
        ↓
4. Display interface
   (tables, buttons,
   forms, etc.)
```

---

## 💡 Pro Tips

### Stay Logged In
- JWT token is stored in localStorage
- Remains valid until you logout or it expires
- No need to login every time you visit

### Navigation Between Screens
Once logged in, you can freely navigate:
```
index.html (main app)
    ↓
rhythm-mapper.html
    ↓
loop-rhythm-manager.html
    ↓
Back to index.html
```

All screens share the same JWT token!

### Quick Test
Open browser console (F12) and run:
```javascript
// Check if logged in
console.log('Token:', localStorage.getItem('jwtToken'));

// Should see something like:
// Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

If you see `null`, you need to login first.

---

## 📋 Testing Checklist

- [ ] Login at index.html works
- [ ] Token stored in localStorage
- [ ] Can access rhythm-mapper.html
- [ ] Can access loop-rhythm-manager.html
- [ ] No "Please login first" alert
- [ ] Data loads correctly (songs, rhythm sets)
- [ ] Navigation buttons work

---

## 🔍 Detailed Authentication Check

### 1. Open Browser Console (F12)
Press F12 or right-click → Inspect → Console tab

### 2. Check Token
```javascript
localStorage.getItem('jwtToken')
```

**Expected Output:**
```
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NTc..."
```

**If you see `null`:**
- Not logged in
- Need to login at index.html first

### 3. Check Token Validity
```javascript
// Copy your token from above
const token = localStorage.getItem('jwtToken');

// Decode payload (middle part)
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('User ID:', payload.userId);
console.log('Expires:', new Date(payload.exp * 1000));
```

**Expected Output:**
```
User ID: 657a1b2c3d4e5f6g7h8i9j0k
Expires: Fri Mar 22 2026 12:34:56 GMT...
```

If expired, login again!

---

## 🛠️ Manual Fix (If Needed)

If still having issues, try this in browser console:

```javascript
// Clear old token
localStorage.removeItem('token');
localStorage.removeItem('jwtToken');

// Refresh page
location.reload();

// Now login at index.html
```

---

## ✅ Verification

After the fix, you should be able to:

1. **Login at index.html** ✓
2. **Navigate to rhythm-mapper.html** ✓
3. **See songs table** ✓
4. **Navigate to loop-rhythm-manager.html** ✓
5. **See rhythm sets table** ✓
6. **No redirect to index.html** ✓

---

## 📞 Still Need Help?

If you're still having issues:

1. **Check server logs:**
   - Look at terminal where `npm start` is running
   - Check for any errors

2. **Check browser console:**
   - Press F12
   - Look for red error messages
   - Share the error for debugging

3. **Try incognito/private window:**
   - Sometimes cached files cause issues
   - Open in incognito mode to test

4. **Restart server:**
   ```bash
   # Stop server (Ctrl+C)
   # Start again
   npm start
   ```

---

## 🎉 Success!

Once you login, you should see:
- ✅ Rhythm Mapper loads with songs table
- ✅ Loop & Rhythm Manager loads with rhythm sets
- ✅ No more redirects
- ✅ All features work

Happy rhythm mapping! 🎵
