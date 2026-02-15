require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
let db;
let songsCollection;
let deletedSongsCollection;

// Create uploads directory (use /tmp in serverless environments)
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
const uploadsDir = isServerless 
  ? path.join('/tmp', 'loops')
  : path.join(__dirname, 'uploads', 'loops');

if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch (err) {
    console.warn('Could not create uploads directory:', err.message);
  }
}

// Configure multer for audio file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename: songId_loopType_timestamp.ext
    const songId = req.params.id || 'temp';
    const loopType = req.body.loopType || 'main';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${songId}_${loopType}_${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit per file
  },
  fileFilter: function (req, file, cb) {
    //Accept only audio files
    const allowedMimes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/wave', 'audio/x-m4a', 'audio/mp4'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files (MP3, WAV, M4A) are allowed'));
    }
  }
});

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:5501',
    'http://localhost:5501',
    'https://oldandnew.onrender.com',
    'https://swareshpawar.github.io',
    'https://oldand-new.vercel.app' // Vercel production URL
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'], // <-- Add 'Authorization' if not present
}));
app.use(express.json({ limit: '50mb' })); // Increase JSON payload limit for Smart Setlists
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Also increase URL-encoded limit
app.use(express.static('.'));

// Initialize connection for serverless
let isConnected = false;

async function connectToDatabase() {
  if (isConnected && db) {
    return;
  }
  
  try {
    
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    await client.connect();
    db = client.db('OldNewSongs');
    songsCollection = db.collection('OldNewSongs');
    deletedSongsCollection = db.collection('DeletedSongs');
    isConnected = true;
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    isConnected = false;
    db = null;
    throw err;
  }
}

// Middleware to ensure DB connection - MUST be before routes
app.use(async (req, res, next) => {
  try {
    // Skip connection attempt if we're in local development and already connected
    if (process.env.NODE_ENV !== 'production' && db) {
      return next();
    }
    
    await connectToDatabase();
    if (!db) {
      throw new Error('Database connection failed - db is still undefined');
    }
    next();
  } catch (err) {
    console.error('Database connection middleware error:', err);
    res.status(500).json({ error: 'Database connection failed', details: err.message });
  }
});

const { 
  registerUser, 
  authenticateUser, 
  verifyToken,
  generateOTP,
  storeOTP,
  sendEmailOTP,
  sendSMSOTP,
  findUserForPasswordReset,
  resetUserPassword
} = require('./utils/auth');

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Invalid or expired token' });
  req.user = payload;
  next();
}

// Get recommendation weights config (requires authentication)
app.get('/api/recommendation-weights', authMiddleware, async (req, res) => {
  try {
    const config = await db.collection('config').findOne({ _id: 'weights' });
    if (!config) {
      // Default if not set
      return res.json({
        language: 10,
        scale: 18,
        timeSignature: 18,
        taal: 18,
        tempo: 5,
        genre: 13,
        vocal: 8,
        mood: 10,
        lastModified: null
      });
    }
    // Remove _id for frontend, include lastModified
    const { _id, ...weights } = config;
    res.json(weights);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update recommendation weights config (admin only)
app.put('/api/recommendation-weights', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { language, scale, timeSignature, taal, tempo, genre, vocal, mood } = req.body;
    if ([language, scale, timeSignature, taal, tempo, genre, vocal, mood].some(v => typeof v !== 'number')) {
      return res.status(400).json({ error: 'All weights must be numbers' });
    }
    const total = language + scale + timeSignature + taal + tempo + genre + vocal + mood;
    if (total !== 100) {
      return res.status(400).json({ error: 'Total must be 100' });
    }
    const lastModified = new Date().toISOString();
    await db.collection('config').updateOne(
      { _id: 'weights' },
      { $set: { language, scale, timeSignature, taal, tempo, genre, vocal, mood, lastModified } },
      { upsert: true }
    );
    res.json({ message: 'Recommendation weights updated', lastModified });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Do NOT use global auth middleware
// Only use authMiddleware on protected routes below

// Get all users (admin only)
app.get('/api/users', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const users = await db.collection('Users').find({}, { projection: { password: 0 } }).toArray();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark user as admin (admin only)
app.patch('/api/users/:id/admin', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const result = await db.collection('Users').updateOne(
      { _id: new (require('mongodb').ObjectId)(userId) },
      { $set: { isAdmin: true } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User marked as admin' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove admin role from user
app.patch('/api/users/:id/remove-admin', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Prevent removing admin from yourself
    if (req.user.id === userId) {
      return res.status(400).json({ error: 'Cannot remove admin role from yourself' });
    }
    
    // Update user to remove admin role
    const result = await db.collection('Users').updateOne(
      { _id: new (require('mongodb').ObjectId)(userId) },
      { $set: { isAdmin: false } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'Admin role removed successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove admin role' });
  }
});

// Database connection will be handled by connectToDatabase() function

/**
 * Middleware to require admin privileges for protected routes
 * Uses strict boolean comparison (===) to ensure type safety
 * Only accepts boolean true, rejects string "true" or other truthy values
 * JWT tokens from authenticateUser() contain boolean isAdmin values
 */
function requireAdmin(req, res, next) {
  if (req.user && req.user.isAdmin === true) return next();
  return res.status(403).json({ error: 'Admin access required' });
}
// User registration
app.post('/api/register', async (req, res) => {
  try {
    let { firstName, lastName, username, email, phone, password, isAdmin } = req.body;
    if (!firstName || !lastName || !username || !email || !phone || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    username = username.trim().toLowerCase(); // store username as lowercase
    email = email.trim().toLowerCase();
    // Convert isAdmin to boolean (critical for type safety)
    // Handles: boolean true/false, string "true"/"false", undefined, null
    // Important: Prevents Boolean("false") bug which would incorrectly return true
    // Only string "true" or boolean true will result in true, everything else becomes false
    isAdmin = isAdmin === true || isAdmin === 'true';
    // Pass all fields to registerUser (isAdmin already converted to boolean)
    const user = await registerUser(db, { firstName, lastName, username, email, phone, password, isAdmin });
    res.status(201).json({ message: 'User registered', user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Debug endpoint to check database connection (admin only for security)
app.get('/api/debug/db', authMiddleware, requireAdmin, async (req, res) => {
  try {
    res.json({ 
      dbConnected: !!db,
      isConnected,
      mongoUri: process.env.MONGODB_URI ? 'Set' : 'Not Set',
      collections: db ? await db.listCollections().toArray() : 'DB not available'
    });
  } catch (err) {
    res.status(500).json({ error: err.message, dbStatus: !!db });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  try {
    // Additional debug logging
    if (!db) {
      console.error('Database not connected in login endpoint');
      return res.status(500).json({ error: 'Database connection not available' });
    }
    
    let { usernameOrEmail, username, password } = req.body;
    if ((!usernameOrEmail && !username) || !password) {
      return res.status(400).json({ error: 'Username/email and password required' });
    }
    let loginInput = (usernameOrEmail || username).trim().toLowerCase();
    const { token, user } = await authenticateUser(db, { loginInput, password });
    res.json({ token, user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(401).json({ error: err.message });
  }
});

// Initiate password reset (send OTP)
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { identifier, method } = req.body; // identifier can be email or phone, method is 'email' or 'sms'
    
    if (!identifier || !method) {
      return res.status(400).json({ error: 'Email/phone and method are required' });
    }
    
    if (!['email', 'sms'].includes(method)) {
      return res.status(400).json({ error: 'Method must be email or sms' });
    }
    
    // Find user
    const user = await findUserForPasswordReset(db, identifier);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP in database
    await storeOTP(db, identifier, otp, method);
    
    // Send OTP based on method
    if (method === 'email') {
      if (!user.email) {
        return res.status(400).json({ error: 'No email associated with this account' });
      }
      await sendEmailOTP(user.email, otp, user.firstName);
    } else if (method === 'sms') {
      if (!user.phone) {
        return res.status(400).json({ error: 'No phone number associated with this account' });
      }
      await sendSMSOTP(user.phone, otp, user.firstName);
    }
    
    res.json({ 
      message: `OTP sent successfully via ${method}`,
      method,
      maskedIdentifier: method === 'email' 
        ? user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
        : user.phone.replace(/(\+?\d{2})(\d*)(\d{2})/, '$1***$3')
    });
    
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: err.message || 'Failed to send OTP' });
  }
});

// Verify OTP and reset password
app.post('/api/reset-password', async (req, res) => {
  try {
    const { identifier, otp, newPassword } = req.body;
    
    if (!identifier || !otp || !newPassword) {
      return res.status(400).json({ error: 'Identifier, OTP, and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    const result = await resetUserPassword(db, identifier, newPassword, otp);
    res.json(result);
    
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(400).json({ error: err.message || 'Failed to reset password' });
  }
});

// Get list of deleted song IDs since a timestamp (for delta sync)
app.get('/api/songs/deleted', authMiddleware, async (req, res) => {
  try {
    const { since } = req.query;
    if (!since) {
      return res.json([]); // No timestamp provided, return empty array
    }
    
    // Find all deleted songs with deletedAt > since
    const deletedSongs = await deletedSongsCollection.find({
      deletedAt: { $gt: since }
    }).toArray();
    
    // Return just the song IDs
    const deletedIds = deletedSongs.map(doc => doc.songId);
    res.json(deletedIds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/songs', authMiddleware, async (req, res) => {
  try {
    // Support delta fetching: if ?since=TIMESTAMP is provided, only return songs updated after that
    const { since } = req.query;
    let query = {};
    if (since) {
      // updatedAt or createdAt newer than 'since'
      query = {
        $or: [
          { updatedAt: { $gt: since } },
          { createdAt: { $gt: since } }
        ]
      };
    }
    const songs = await songsCollection.find(query).toArray();
    
    // Validate all songs have numeric IDs (log warning if not)
    const songsWithoutId = songs.filter(s => typeof s.id !== 'number');
    if (songsWithoutId.length > 0) {
      console.warn(`⚠️  Found ${songsWithoutId.length} songs without numeric ID:`, 
        songsWithoutId.map(s => ({ title: s.title, _id: s._id })));
    }
    
    res.json(songs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Protected: only logged-in users can add, update, or delete songs
app.post('/api/songs', authMiddleware, async (req, res) => {
  try {
    
    // Ensure song has a numeric ID
    if (typeof req.body.id !== 'number') {
      const last = await songsCollection.find().sort({ id: -1 }).limit(1).toArray();
      req.body.id = last.length ? last[0].id + 1 : 1;
    }
    
    // Validate ID is a positive integer
    if (!Number.isInteger(req.body.id) || req.body.id <= 0) {
      return res.status(400).json({ error: 'Song ID must be a positive integer' });
    }
    
    // Check for duplicate ID
    const existingSong = await songsCollection.findOne({ id: req.body.id });
    if (existingSong) {
      return res.status(409).json({ error: `Song with ID ${req.body.id} already exists` });
    }
    
    // Add createdBy and createdAt if not present
    // Always use createdBy and createdAt from request if present, else fallback to user/date
    if (!req.body.createdBy && req.user) {
      if (req.user.firstName) {
        // Capitalize first letter of firstName
        const cap = str => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
        req.body.createdBy = cap(req.user.firstName);
      } else if (req.user.username) {
        req.body.createdBy = req.user.username;
      }
    }
    if (!req.body.createdAt) {
      req.body.createdAt = new Date().toISOString();
    }
    
    // Ensure artistDetails and mood fields are included
    if (!req.body.artistDetails) {
      req.body.artistDetails = '';
    }
    if (!req.body.mood) {
      req.body.mood = '';
    }
    
    const result = await songsCollection.insertOne(req.body);
    const insertedSong = await songsCollection.findOne({ _id: result.insertedId });
    res.status(201).json(insertedSong);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/songs/:id', authMiddleware, async (req, res) => {
  console.log('DEBUG /api/songs/:id req.user:', req.user);
  try {
    const { id } = req.params;
    // Always set updatedAt to now on edit
    req.body.updatedAt = new Date().toISOString();
    if (req.user && req.user.firstName) {
      // Capitalize first letter of firstName only
      const cap = str => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
      req.body.updatedBy = cap(req.user.firstName);
    } else if (req.user && req.user.username) {
      // Fallback to capitalized username
      const cap = str => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
      req.body.updatedBy = cap(req.user.username);
    }
    const update = { $set: req.body };
    const result = await songsCollection.updateOne({ id: parseInt(id) }, update);
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Song not found' });
    }
    // Fetch and return the updated song object
    const updatedSong = await songsCollection.findOne({ id: parseInt(id) });
    res.json(updatedSong);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/songs/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const songId = parseInt(id);
    const result = await songsCollection.deleteOne({ id: songId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Song not found' });
    }
    
    // Track deletion for delta sync
    await deletedSongsCollection.insertOne({
      songId: songId,
      deletedAt: new Date().toISOString(),
      deletedBy: req.user.email || req.user.username
    });
    
    res.json({ message: 'Song deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/songs', authMiddleware, requireAdmin, async (req, res) => {
  try {
    // Get all song IDs before deleting
    const allSongs = await songsCollection.find({}, { projection: { id: 1 } }).toArray();
    const deletionTimestamp = new Date().toISOString();
    
    // Delete all songs
    await songsCollection.deleteMany({});
    
    // Track all deletions for delta sync
    if (allSongs.length > 0) {
      const deletionRecords = allSongs.map(song => ({
        songId: song.id,
        deletedAt: deletionTimestamp,
        deletedBy: req.user.email || req.user.username
      }));
      await deletedSongsCollection.insertMany(deletionRecords);
    }
    
    res.json({ message: 'All songs deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Scan songs based on multiple filter conditions (requires authentication)
app.post('/api/songs/scan', authMiddleware, async (req, res) => {
  try {
    const { keys, tempoMin, tempoMax, times, taals, moods, genres, categories } = req.body;
    
    let query = {};
    
    // Debug: First let's see what some tempo values look like in the database
    const sampleSongs = await songsCollection.find({}).limit(5).toArray();
    
    // Handle array conditions (use $in for matching any)
    if (keys && keys.length > 0) {
      query.key = { $in: keys };
    }
    
    // Use 'time' field (not 'timeSignature')
    if (times && times.length > 0) {
      query.time = { $in: times };  
    }
    
    if (taals && taals.length > 0) {
      query.taal = { $in: taals };
    }
    
    // Mood is stored as comma-separated string, so use regex to match any of the selected moods
    if (moods && moods.length > 0) {
      const moodRegex = moods.map(mood => mood.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
      query.mood = { $regex: `(${moodRegex})`, $options: 'i' };
    }
    
    // Genres is stored as array, so use $in
    if (genres && genres.length > 0) {
      query.genres = { $in: genres };
    }
    
    if (categories && categories.length > 0) {
      query.category = { $in: categories };
    }
    
    // Handle tempo range - convert strings to numbers
    console.log('Tempo values received:', { tempoMin, tempoMax, tempoMinType: typeof tempoMin, tempoMaxType: typeof tempoMax });
    
    if (tempoMin !== null || tempoMax !== null) {
      // Use aggregation pipeline to handle string-to-number conversion
      const pipeline = [];
      
      // First, add all the regular match conditions
      if (Object.keys(query).length > 0) {
        pipeline.push({ $match: query });
      }
      
      // Add tempo filtering with proper type conversion
      const tempoMatch = {};
      if (tempoMin !== null) {
        const minTempo = parseInt(tempoMin);
      }
      if (tempoMax !== null) {
        const maxTempo = parseInt(tempoMax);
      }
      
      // Add stage to convert tempo to number and filter
      if (tempoMin !== null || tempoMax !== null) {
        const tempoConditions = [];
        
        if (tempoMin !== null && tempoMax !== null) {
          const minTempo = parseInt(tempoMin);
          const maxTempo = parseInt(tempoMax);
          if (!isNaN(minTempo) && !isNaN(maxTempo)) {
            tempoConditions.push({
              $and: [
                { $gte: [{ $toDouble: { $cond: { if: { $or: [{ $eq: ['$tempo', ''] }, { $eq: ['$tempo', null] }] }, then: '0', else: '$tempo' } } }, minTempo] },
                { $lte: [{ $toDouble: { $cond: { if: { $or: [{ $eq: ['$tempo', ''] }, { $eq: ['$tempo', null] }] }, then: '0', else: '$tempo' } } }, maxTempo] }
              ]
            });
          }
        } else if (tempoMin !== null) {
          const minTempo = parseInt(tempoMin);
          if (!isNaN(minTempo)) {
            tempoConditions.push({ $gte: [{ $toDouble: { $cond: { if: { $or: [{ $eq: ['$tempo', ''] }, { $eq: ['$tempo', null] }] }, then: '0', else: '$tempo' } } }, minTempo] });
          }
        } else if (tempoMax !== null) {
          const maxTempo = parseInt(tempoMax);
          if (!isNaN(maxTempo)) {
            tempoConditions.push({ $lte: [{ $toDouble: { $cond: { if: { $or: [{ $eq: ['$tempo', ''] }, { $eq: ['$tempo', null] }] }, then: '0', else: '$tempo' } } }, maxTempo] });
          }
        }
        
        if (tempoConditions.length > 0) {
          pipeline.push({
            $match: {
              $expr: tempoConditions.length === 1 ? tempoConditions[0] : { $and: tempoConditions }
            }
          });
        }
      }
      
      console.log('Aggregation pipeline:', JSON.stringify(pipeline));
      
      // Execute aggregation pipeline
      let songs;
      try {
        songs = await songsCollection.aggregate(pipeline).toArray();
      } catch (aggregationError) {
        console.log('Aggregation error, falling back to simpler approach:', aggregationError.message);
        
        // Fallback: Filter out documents with invalid tempo first, then apply range filter
        const fallbackPipeline = [];
        
        // First add regular filters
        if (Object.keys(query).length > 0) {
          fallbackPipeline.push({ $match: query });
        }
        
        // Filter out invalid tempo values
        fallbackPipeline.push({
          $match: {
            tempo: { $exists: true, $ne: '', $ne: null, $regex: /^[0-9]+$/ }
          }
        });
        
        // Add tempo range filter using simpler string comparison
        if (tempoMin !== null && tempoMax !== null) {
          const minTempo = parseInt(tempoMin);
          const maxTempo = parseInt(tempoMax);
          if (!isNaN(minTempo) && !isNaN(maxTempo)) {
            // Use a combination of string length and string comparison for numerical range
            fallbackPipeline.push({
              $match: {
                $expr: {
                  $and: [
                    { $gte: [{ $toInt: '$tempo' }, minTempo] },
                    { $lte: [{ $toInt: '$tempo' }, maxTempo] }
                  ]
                }
              }
            });
          }
        } else if (tempoMin !== null) {
          const minTempo = parseInt(tempoMin);
          if (!isNaN(minTempo)) {
            fallbackPipeline.push({
              $match: { $expr: { $gte: [{ $toInt: '$tempo' }, minTempo] } }
            });
          }
        } else if (tempoMax !== null) {
          const maxTempo = parseInt(tempoMax);
          if (!isNaN(maxTempo)) {
            fallbackPipeline.push({
              $match: { $expr: { $lte: [{ $toInt: '$tempo' }, maxTempo] } }
            });
          }
        }
        
        console.log('Fallback pipeline:', JSON.stringify(fallbackPipeline));
        songs = await songsCollection.aggregate(fallbackPipeline).toArray();
      }
      
      // Only return essential fields to reduce payload size for Smart Setlists
      songs = songs.map(song => ({
        id: song.id,
        title: song.title,
        songNumber: song.songNumber,
        key: song.key,
        mood: song.mood,
        tempo: song.tempo,
        artistDetails: song.artistDetails,
        artist: song.artist,
        category: song.category,
        genre: song.genre,
        genres: song.genres,
        taal: song.taal,
        time: song.time,
        timeSignature: song.timeSignature
      }));
      
      // Sort by song number
      songs.sort((a, b) => {
        const aNum = parseInt(a.songNumber) || 0;
        const bNum = parseInt(b.songNumber) || 0;
        return aNum - bNum;
      });
      
      console.log(`Found ${songs.length} songs matching criteria`);
      
      res.json(songs);
      return;
    }
    
    console.log('Scan query:', JSON.stringify(query));
    
    // Execute query
    let songs = await songsCollection.find(query).toArray();
    
    // Only return essential fields to reduce payload size for Smart Setlists
    songs = songs.map(song => ({
      id: song.id,
      title: song.title,
      songNumber: song.songNumber,
      key: song.key,
      mood: song.mood,
      tempo: song.tempo,
      artistDetails: song.artistDetails,
      artist: song.artist,
      category: song.category,
      genre: song.genre,
      genres: song.genres,
      taal: song.taal,
      time: song.time,
      timeSignature: song.timeSignature
    }));
    
    // Sort by song number
    songs.sort((a, b) => {
      const aNum = parseInt(a.songNumber) || 0;
      const bNum = parseInt(b.songNumber) || 0;
      return aNum - bNum;
    });
    
    console.log(`Found ${songs.length} songs matching criteria`);
    
    // Add debug info about first few songs if none found
    if (songs.length === 0) {
      const sampleSongs = await songsCollection.find({}).limit(2).toArray();
      console.log('Sample songs for debugging:');
      sampleSongs.forEach((song, index) => {
        console.log(`Song ${index + 1}:`, {
          title: song.title,
          key: song.key,
          time: song.time,
          timeSignature: song.timeSignature,
          taal: song.taal,
          mood: song.mood,
          genres: song.genres,
          genre: song.genre,
          category: song.category
        });
      });
    }
    
    res.json(songs);
  } catch (err) {
    console.error('Scan error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ===== LOOP PLAYER ENDPOINTS =====

// Upload loop audio file for a song
app.post('/api/songs/:id/loops/upload', authMiddleware, upload.single('audioFile'), async (req, res) => {
  try {
    const { id } = req.params;
    const { loopType } = req.body; // 'main', 'variation1', 'variation2', 'variation3', 'fillin'
    
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded' });
    }
    
    if (!['main', 'variation1', 'variation2', 'variation3', 'fillin'].includes(loopType)) {
      return res.status(400).json({ error: 'Invalid loop type' });
    }
    
    // Get the song to update
    const song = await songsCollection.findOne({ id: parseInt(id) });
    if (!song) {
      // Clean up uploaded file if song doesn't exist
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Song not found' });
    }
    
    // Initialize loopPlayer object if it doesn't exist
    const loopPlayer = song.loopPlayer || {
      loops: {},
      pattern: ['main', 'variation1', 'variation2', 'variation3', 'fillin'],
      enabled: false
    };
    
    // Delete old file if it exists
    if (loopPlayer.loops[loopType]) {
      const oldFilePath = path.join(__dirname, loopPlayer.loops[loopType]);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }
    
    // Store relative path for the new file
    const relativePath = `/uploads/loops/${req.file.filename}`;
    loopPlayer.loops[loopType] = relativePath;
    
    // Update  song in database
    const result = await songsCollection.updateOne(
      { id: parseInt(id) },
      { 
        $set: { 
          loopPlayer: loopPlayer,
          updatedAt: new Date().toISOString(),
          updatedBy: req.user.firstName || req.user.username
        }
      }
    );
    
    res.json({
      success: true,
      loopType,
      filePath: relativePath,
      filename: req.file.filename,
      size: req.file.size
    });
    
  } catch (err) {
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Loop upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get loop player data for a song
app.get('/api/songs/:id/loops', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const song = await songsCollection.findOne({ id: parseInt(id) });
    
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }
    
    const loopPlayer = song.loopPlayer || {
      loops: {},
      pattern: ['main', 'variation1', 'variation2', 'variation3', 'fillin'],
      enabled: false
    };
    
    res.json(loopPlayer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update loop player configuration (pattern, enabled status)
app.put('/api/songs/:id/loops/config', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { pattern, enabled } = req.body;
    
    const song = await songsCollection.findOne({ id: parseInt(id) });
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }
    
    const loopPlayer = song.loopPlayer || { loops: {}, pattern: [], enabled: false };
    
    if (pattern !== undefined) {
      // Validate pattern array
      if (!Array.isArray(pattern)) {
        return res.status(400).json({ error: 'Pattern must be an array' });
      }
      const validTypes = ['main', 'variation1', 'variation2', 'variation3', 'fillin'];
      for (const type of pattern) {
        if (!validTypes.includes(type)) {
          return res.status(400).json({ error: `Invalid loop type in pattern: ${type}` });
        }
      }
      loopPlayer.pattern = pattern;
    }
    
    if (enabled !== undefined) {
      loopPlayer.enabled = Boolean(enabled);
    }
    
    await songsCollection.updateOne(
      { id: parseInt(id) },
      { 
        $set: { 
          loopPlayer: loopPlayer,
          updatedAt: new Date().toISOString(),
          updatedBy: req.user.firstName || req.user.username
        }
      }
    );
    
    res.json({ success: true, loopPlayer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a specific loop file
app.delete('/api/songs/:id/loops/:loopType', authMiddleware, async (req, res) => {
  try {
    const { id, loopType } = req.params;
    
    const song = await songsCollection.findOne({ id: parseInt(id) });
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }
    
    if (!song.loopPlayer || !song.loopPlayer.loops[loopType]) {
      return res.status(404).json({ error: 'Loop file not found' });
    }
    
    // Delete the file
    const filePath = path.join(__dirname, song.loopPlayer.loops[loopType]);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Remove from database
    delete song.loopPlayer.loops[loopType];
    
    await songsCollection.updateOne(
      { id: parseInt(id) },
      { 
        $set: { 
          loopPlayer: song.loopPlayer,
          updatedAt: new Date().toISOString(),
          updatedBy: req.user.firstName || req.user.username
        }
      }
    );
    
    res.json({ success: true, message: 'Loop file deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve loop files from /loops/ folder
const loopsDir = path.join(__dirname, 'loops');
app.use('/loops', express.static(loopsDir));

// Serve uploaded loop files (legacy)
app.use('/uploads/loops', express.static(uploadsDir));

// ============================================================================
// LOOP MANAGER API ENDPOINTS
// ============================================================================

/**
 * GET /api/song-metadata
 * Get song metadata arrays (taals, times, genres) from frontend
 * This syncs with main.js automatically
 */
app.get('/api/song-metadata', (req, res) => {
  try {
    // Read main.js and extract the arrays
    const mainJsPath = path.join(__dirname, 'main.js');
    const mainJsContent = fs.readFileSync(mainJsPath, 'utf8');

    // Extract GENRES array
    const genresMatch = mainJsContent.match(/const GENRES = \[([\s\S]*?)\];/);
    const genres = genresMatch ? 
      genresMatch[1]
        .split(',')
        .map(g => g.trim().replace(/['"]/g, ''))
        .filter(g => g) : 
      [];

    // Extract TAALS array
    const taalsMatch = mainJsContent.match(/const TAALS = \[([\s\S]*?)\];/);
    const taals = taalsMatch ? 
      taalsMatch[1]
        .split(',')
        .map(t => t.trim().replace(/['"]/g, ''))
        .filter(t => t) : 
      [];

    // Extract TIMES array
    const timesMatch = mainJsContent.match(/const TIMES = \[([\s\S]*?)\];/);
    const times = timesMatch ? 
      timesMatch[1]
        .split(',')
        .map(t => t.trim().replace(/['"]/g, ''))
        .filter(t => t) : 
      [];

    // Extract TIME_GENRE_MAP
    const timeGenreMapMatch = mainJsContent.match(/const TIME_GENRE_MAP = \{([\s\S]*?)\n\};/);
    let timeGenreMap = {};
    if (timeGenreMapMatch) {
      const mapContent = timeGenreMapMatch[1];
      const lines = mapContent.split('\n');
      
      for (const line of lines) {
        const match = line.match(/"([^"]+)":\s*\[([\s\S]*?)\]/);
        if (match) {
          const timeSignature = match[1];
          const taalsList = match[2]
            .split(',')
            .map(t => t.trim().replace(/['"]/g, ''))
            .filter(t => t);
          timeGenreMap[timeSignature] = taalsList;
        }
      }
    }

    // Categorize genres for loop system
    const musicalGenres = genres.filter(g => 
      !['New', 'Old', 'Mid', 'Hindi', 'Marathi', 'English', 'Female', 'Male', 'Duet'].includes(g)
    );

    res.json({
      genres: genres,
      musicalGenres: musicalGenres,
      taals: taals,
      times: times,
      timeGenreMap: timeGenreMap,
      vocalTags: ['Male', 'Female', 'Duet'],
      languageTags: ['Hindi', 'Marathi', 'English'],
      eraSettings: ['New', 'Old', 'Mid']
    });
  } catch (error) {
    console.error('Error reading song metadata:', error);
    res.status(500).json({ error: 'Failed to read song metadata' });
  }
});

/**
 * GET /api/loops/metadata
 * Get loops metadata JSON
 */
app.get('/api/loops/metadata', async (req, res) => {
  try {
    const metadataPath = path.join(loopsDir, 'loops-metadata.json');
    
    if (!fs.existsSync(metadataPath)) {
      // Get song metadata to populate defaults
      const mainJsPath = path.join(__dirname, 'main.js');
      const mainJsContent = fs.readFileSync(mainJsPath, 'utf8');

      // Extract TAALS
      const taalsMatch = mainJsContent.match(/const TAALS = \[([\s\S]*?)\];/);
      const taals = taalsMatch ? 
        taalsMatch[1]
          .split(',')
          .map(t => t.trim().replace(/['"]/g, '').toLowerCase())
          .filter(t => t) : 
        ['keherwa', 'dadra', 'rupak', 'jhaptal', 'teental', 'ektaal'];

      // Extract GENRES (musical ones only)
      const genresMatch = mainJsContent.match(/const GENRES = \[([\s\S]*?)\];/);
      const allGenres = genresMatch ? 
        genresMatch[1]
          .split(',')
          .map(g => g.trim().replace(/['"]/g, ''))
          .filter(g => g) : 
        [];
      
      const musicalGenres = allGenres
        .filter(g => !['New', 'Old', 'Mid', 'Hindi', 'Marathi', 'English', 'Female', 'Male', 'Duet'].includes(g))
        .map(g => g.toLowerCase());

      // Extract TIMES
      const timesMatch = mainJsContent.match(/const TIMES = \[([\s\S]*?)\];/);
      const times = timesMatch ? 
        timesMatch[1]
          .split(',')
          .map(t => t.trim().replace(/['"]/g, ''))
          .filter(t => t) : 
        ['4/4', '3/4', '6/8', '7/8'];

      // Return default empty structure with dynamic values
      return res.json({
        version: '2.0',
        loops: [],
        tempoRanges: {
          slow: { min: 0, max: 80, label: 'Slow' },
          medium: { min: 80, max: 120, label: 'Medium' },
          fast: { min: 120, max: 999, label: 'Fast' }
        },
        supportedTaals: taals,
        supportedGenres: musicalGenres.length > 0 ? musicalGenres : ['acoustic', 'rock', 'rd pattern', 'qawalli', 'blues'],
        supportedTimeSignatures: times
      });
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    
    // Sync supported arrays with main.js if they don't exist or are outdated
    if (!metadata.supportedTaals || metadata.supportedTaals.length === 0) {
      const mainJsPath = path.join(__dirname, 'main.js');
      const mainJsContent = fs.readFileSync(mainJsPath, 'utf8');

      // Extract and update arrays
      const taalsMatch = mainJsContent.match(/const TAALS = \[([\s\S]*?)\];/);
      if (taalsMatch) {
        metadata.supportedTaals = taalsMatch[1]
          .split(',')
          .map(t => t.trim().replace(/['"]/g, '').toLowerCase())
          .filter(t => t);
      }

      const genresMatch = mainJsContent.match(/const GENRES = \[([\s\S]*?)\];/);
      if (genresMatch) {
        const allGenres = genresMatch[1]
          .split(',')
          .map(g => g.trim().replace(/['"]/g, ''))
          .filter(g => g);
        
        metadata.supportedGenres = allGenres
          .filter(g => !['New', 'Old', 'Mid', 'Hindi', 'Marathi', 'English', 'Female', 'Male', 'Duet'].includes(g))
          .map(g => g.toLowerCase());
      }

      const timesMatch = mainJsContent.match(/const TIMES = \[([\s\S]*?)\];/);
      if (timesMatch) {
        metadata.supportedTimeSignatures = timesMatch[1]
          .split(',')
          .map(t => t.trim().replace(/['"]/g, ''))
          .filter(t => t);
      }

      // Save updated metadata (skip in serverless - ephemeral file system)
      try {
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
      } catch (err) {
        console.warn('Could not write metadata (serverless mode):', err.message);
      }
    }

    res.json(metadata);
  } catch (error) {
    console.error('Error loading loops metadata:', error);
    res.status(500).json({ error: 'Failed to load loops metadata' });
  }
});

/**
 * Multer configuration for loop uploads
 */
const loopUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, loopsDir);
    },
    filename: (req, file, cb) => {
      // Keep original filename (should already be in correct format)
      cb(null, file.originalname);
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'audio/wav' || file.mimetype === 'audio/x-wav') {
      cb(null, true);
    } else {
      cb(new Error('Only WAV files are allowed'));
    }
  }
});

app.post('/api/loops/upload', authMiddleware, loopUpload.array('loopFiles', 6), async (req, res) => {
  try {
    const { taal, timeSignature, tempo, genre, description } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    if (files.length !== 6) {
      return res.status(400).json({ error: 'Expected 6 files (3 loops + 3 fills)' });
    }

    // Load existing metadata
    const metadataPath = path.join(loopsDir, 'loops-metadata.json');
    let metadata;

    if (fs.existsSync(metadataPath)) {
      metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    } else {
      metadata = {
        version: '2.0',
        loops: [],
        tempoRanges: {
          slow: { min: 0, max: 80, label: 'Slow' },
          medium: { min: 80, max: 120, label: 'Medium' },
          fast: { min: 120, max: 999, label: 'Fast' }
        },
        supportedTaals: ['keherwa', 'dadra', 'rupak', 'jhaptal', 'teental', 'ektaal'],
        supportedGenres: ['acoustic', 'rock', 'rd', 'qawalli', 'blues'],
        supportedTimeSignatures: ['4/4', '3/4', '6/8', '7/8']
      };
    }

    // Generate expected filename pattern
    const timeFormatted = timeSignature.replace('/', '_');
    const basePattern = `${taal}_${timeFormatted}_${tempo}_${genre}`;

    // Rename uploaded files to correct format and add to metadata
    const uploadedFiles = [];
    
    for (const file of files) {
      // Determine type and number from original filename
      const originalName = file.originalname;
      let type, number;

      if (originalName.toUpperCase().includes('LOOP')) {
        type = 'loop';
        const match = originalName.match(/LOOP(\d+)/i);
        number = match ? parseInt(match[1]) : 1;
      } else if (originalName.toUpperCase().includes('FILL')) {
        type = 'fill';
        const match = originalName.match(/FILL(\d+)/i);
        number = match ? parseInt(match[1]) : 1;
      } else {
        continue; // Skip invalid files
      }

      const correctFilename = `${basePattern}_${type.toUpperCase()}${number}.wav`;
      const oldPath = file.path;
      const newPath = path.join(loopsDir, correctFilename);

      // Rename file
      if (oldPath !== newPath) {
        fs.renameSync(oldPath, newPath);
      }

      // Create metadata entry
      const loopEntry = {
        id: `${basePattern}_${type}${number}`,
        filename: correctFilename,
        type: type,
        number: number,
        conditions: {
          taal: taal,
          timeSignature: timeSignature,
          tempo: tempo,
          genre: genre
        },
        metadata: {
          duration: 0,
          uploadedAt: new Date().toISOString(),
          description: description || ''
        }
      };

      // Remove existing entry with same ID if exists
      metadata.loops = metadata.loops.filter(loop => loop.id !== loopEntry.id);
      
      // Add new entry
      metadata.loops.push(loopEntry);
      uploadedFiles.push(correctFilename);
    }

    // Save updated metadata (skip in serverless - ephemeral file system)
    try {
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    } catch (err) {
      console.warn('Could not write metadata (serverless mode):', err.message);
    }

    res.json({
      success: true,
      uploaded: uploadedFiles.length,
      files: uploadedFiles,
      pattern: basePattern
    });
  } catch (error) {
    console.error('Error uploading loops:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/loops/upload-single
 * Upload a single loop/fill file with automatic renaming
 */
app.post('/api/loops/upload-single', authMiddleware, loopUpload.single('file'), async (req, res) => {
  try {
    const { taal, timeSignature, tempo, genre, type, number, description } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate required fields
    if (!taal || !timeSignature || !tempo || !genre || !type || !number) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Load existing metadata
    const metadataPath = path.join(loopsDir, 'loops-metadata.json');
    let metadata;

    if (fs.existsSync(metadataPath)) {
      metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    } else {
      metadata = {
        version: '2.0',
        loops: [],
        tempoRanges: {
          slow: { min: 0, max: 80, label: 'Slow' },
          medium: { min: 80, max: 120, label: 'Medium' },
          fast: { min: 120, max: 999, label: 'Fast' }
        },
        supportedTaals: ['keherwa', 'dadra', 'rupak', 'jhaptal', 'teental', 'ektaal'],
        supportedGenres: ['acoustic', 'rock', 'rd', 'qawalli', 'blues'],
        supportedTimeSignatures: ['4/4', '3/4', '6/8', '7/8']
      };
    }

    // Generate correct filename based on naming convention v2.0
    const timeFormatted = timeSignature.replace('/', '_');
    const basePattern = `${taal}_${timeFormatted}_${tempo}_${genre}`;
    const typeUpper = type.toUpperCase();
    const correctFilename = `${basePattern}_${typeUpper}${number}.wav`;

    // Rename uploaded file
    const oldPath = file.path;
    const newPath = path.join(loopsDir, correctFilename);

    // If file with same name exists, delete it first
    if (fs.existsSync(newPath) && oldPath !== newPath) {
      fs.unlinkSync(newPath);
    }

    // Rename file
    if (oldPath !== newPath) {
      fs.renameSync(oldPath, newPath);
    }

    // Create metadata entry
    const loopId = `${basePattern}_${type}${number}`;
    const loopEntry = {
      id: loopId,
      filename: correctFilename,
      type: type,
      number: parseInt(number),
      conditions: {
        taal: taal,
        timeSignature: timeSignature,
        tempo: tempo,
        genre: genre
      },
      metadata: {
        duration: 0,
        uploadedAt: new Date().toISOString(),
        description: description || ''
      },
      files: {
        [`${type}${number}`]: correctFilename
      }
    };

    // Remove existing entry with same ID if exists
    metadata.loops = metadata.loops.filter(loop => loop.id !== loopId);
    
    // Add new entry
    metadata.loops.push(loopEntry);

    // Save updated metadata (skip in serverless - ephemeral file system)
    try {
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    } catch (err) {
      console.warn('Could not write metadata (serverless mode):', err.message);
    }

    res.json({
      success: true,
      filename: correctFilename,
      id: loopId,
      pattern: basePattern
    });
  } catch (error) {
    console.error('Error uploading single loop:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/loops/:loopId
 * Delete a loop file and its metadata
 */
app.delete('/api/loops/:loopId', authMiddleware, async (req, res) => {
  try {
    const { loopId } = req.params;
    const metadataPath = path.join(loopsDir, 'loops-metadata.json');

    if (!fs.existsSync(metadataPath)) {
      return res.status(404).json({ error: 'Metadata file not found' });
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    const loopEntry = metadata.loops.find(loop => loop.id === loopId);

    if (!loopEntry) {
      return res.status(404).json({ error: 'Loop not found' });
    }

    // Delete actual file (skip in serverless - ephemeral file system)
    const filePath = path.join(loopsDir, loopEntry.filename);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.warn('Could not delete file (serverless mode):', err.message);
    }

    // Remove from metadata
    metadata.loops = metadata.loops.filter(loop => loop.id !== loopId);

    // Save updated metadata (skip in serverless - ephemeral file system)
    try {
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    } catch (err) {
      console.warn('Could not write metadata (serverless mode):', err.message);
    }

    res.json({ success: true, deleted: loopEntry.filename });
  } catch (error) {
    console.error('Error deleting loop:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// END LOOP MANAGER API
// ============================================================================

app.get('/api/userdata', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const doc = await db.collection('UserData').findOne({ _id: userId });
  res.json(doc || { favorites: [], transpose: {} });
});

app.put('/api/userdata', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { favorites, name, email, transpose } = req.body;
  // Always use firstName and lastName from authenticated user
  const firstName = req.user.firstName;
  const lastName = req.user.lastName;
  // Update Activitydate for each activity
  const Activitydate = new Date().toISOString();
  await db.collection('UserData').updateOne(
    { _id: userId },
    { $set: { favorites, name, email, transpose, firstName, lastName, Activitydate } },
    { upsert: true }
  );
  res.json({ message: 'User data updated' });
});

// Global Setlist endpoints (requires authentication to view, admin to modify)
app.get('/api/global-setlists', authMiddleware, async (req, res) => {
  try {
    const setlists = await db.collection('GlobalSetlists').find({}).toArray();
    res.json(setlists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/global-setlists', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { name, description, songs } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Setlist name is required' });
    }
    
    const setlist = {
      name,
      description: description || '',
      songs: songs || [],
      createdBy: req.user.firstName || req.user.username,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const result = await db.collection('GlobalSetlists').insertOne(setlist);
    const insertedSetlist = await db.collection('GlobalSetlists').findOne({ _id: result.insertedId });
    res.status(201).json(insertedSetlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/global-setlists/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, songs } = req.body;
    
    const update = {
      $set: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(songs && { songs }),
        updatedBy: req.user.firstName || req.user.username,
        updatedAt: new Date().toISOString()
      }
    };
    
    const result = await db.collection('GlobalSetlists').updateOne(
      { _id: new (require('mongodb').ObjectId)(id) },
      update
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Global setlist not found' });
    }
    res.json({ message: 'Global setlist updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/global-setlists/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.collection('GlobalSetlists').deleteOne({
      _id: new (require('mongodb').ObjectId)(id)
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Global setlist not found' });
    }
    res.json({ message: 'Global setlist deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save transpose for a song in global setlist (admin only)
app.put('/api/global-setlists/:id/transpose', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { songId, transpose, newKey } = req.body;
    
    if (!songId || typeof transpose !== 'number') {
      return res.status(400).json({ error: 'Song ID and transpose value are required' });
    }
    
    // Initialize songTransposes if it doesn't exist, then set the transpose for this song
    const result = await db.collection('GlobalSetlists').updateOne(
      { _id: new (require('mongodb').ObjectId)(id) },
      { 
        $set: { 
          [`songTransposes.${songId}`]: transpose,
          updatedAt: new Date().toISOString(),
          updatedBy: req.user.firstName || req.user.username
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Global setlist not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Transpose saved for global setlist',
      songId,
      transpose,
      newKey
    });
  } catch (err) {
    console.error('Error saving global setlist transpose:', err);
    res.status(500).json({ error: err.message });
  }
});

// My Setlist endpoints (user specific)
app.get('/api/my-setlists', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const setlists = await db.collection('MySetlists').find({ userId }).toArray();
    res.json(setlists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/my-setlists', authMiddleware, async (req, res) => {
  try {
    const { name, description, songs } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Setlist name is required' });
    }
    
    const setlist = {
      name,
      description: description || '',
      songs: songs || [],
      userId: req.user.id,
      createdBy: req.user.firstName || req.user.username,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const result = await db.collection('MySetlists').insertOne(setlist);
    const insertedSetlist = await db.collection('MySetlists').findOne({ _id: result.insertedId });
    res.status(201).json(insertedSetlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/my-setlists/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, songs } = req.body;
    const userId = req.user.id;
    
    const update = {
      $set: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(songs && { songs }),
        updatedBy: req.user.firstName || req.user.username,
        updatedAt: new Date().toISOString()
      }
    };
    
    const result = await db.collection('MySetlists').updateOne(
      { _id: new (require('mongodb').ObjectId)(id), userId },
      update
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'My setlist not found' });
    }
    res.json({ message: 'My setlist updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/my-setlists/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const result = await db.collection('MySetlists').deleteOne({
      _id: new (require('mongodb').ObjectId)(id),
      userId
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'My setlist not found' });
    }
    res.json({ message: 'My setlist deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add song to global setlist
app.post('/api/global-setlists/add-song', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { setlistId, songId, manualSong } = req.body;
    if (!setlistId || !songId) {
      return res.status(400).json({ error: 'Setlist ID and song ID are required' });
    }
    
    // If it's a manual song, store the full song object, otherwise just the ID
    const songToAdd = manualSong ? manualSong : songId;
    
    const result = await db.collection('GlobalSetlists').updateOne(
      { _id: new (require('mongodb').ObjectId)(setlistId) },
      { 
        $addToSet: { songs: songToAdd },
        $set: { updatedAt: new Date().toISOString() }
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Global setlist not found' });
    }
    
    res.json({ success: true, message: 'Song added to global setlist' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove song from global setlist
app.post('/api/global-setlists/remove-song', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { setlistId, songId } = req.body;
    console.log('Removing song from global setlist:', { setlistId, songId });
    if (!setlistId || !songId) {
      return res.status(400).json({ error: 'Setlist ID and song ID are required' });
    }
    
    // First, let's check what the setlist looks like before removal
    const setlistBefore = await db.collection('GlobalSetlists').findOne(
      { _id: new (require('mongodb').ObjectId)(setlistId) }
    );
    console.log('Setlist before removal:', setlistBefore ? setlistBefore.songs : 'not found');
    
    // Try to remove song ID directly (for new format)
    let result = await db.collection('GlobalSetlists').updateOne(
      { _id: new (require('mongodb').ObjectId)(setlistId) },
      { 
        $pull: { songs: songId },
        $set: { updatedAt: new Date().toISOString() }
      }
    );
    
    // If no modification happened, try to remove song object (for old format)
    if (result.modifiedCount === 0) {
      result = await db.collection('GlobalSetlists').updateOne(
        { _id: new (require('mongodb').ObjectId)(setlistId) },
        { 
          $pull: { songs: { id: songId } },
          $set: { updatedAt: new Date().toISOString() }
        }
      );
    }
    
    console.log('Remove result:', result);
    
    // Check what the setlist looks like after removal
    const setlistAfter = await db.collection('GlobalSetlists').findOne(
      { _id: new (require('mongodb').ObjectId)(setlistId) }
    );
    console.log('Setlist after removal:', setlistAfter ? setlistAfter.songs : 'not found');
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Global setlist not found' });
    }
    
    res.json({ success: true, message: 'Song removed from global setlist' });
  } catch (err) {
    console.error('Error removing song from global setlist:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add song to personal setlist
app.post('/api/my-setlists/add-song', authMiddleware, async (req, res) => {
  try {
    const { setlistId, songId, manualSong } = req.body;
    const userId = req.user.id;
    
    if (!setlistId || !songId) {
      return res.status(400).json({ error: 'Setlist ID and song ID are required' });
    }
    
    // If it's a manual song, store the full song object, otherwise just the ID
    const songToAdd = manualSong ? manualSong : songId;
    
    const result = await db.collection('MySetlists').updateOne(
      { 
        _id: new (require('mongodb').ObjectId)(setlistId),
        userId 
      },
      { 
        $addToSet: { songs: songToAdd },
        $set: { updatedAt: new Date().toISOString() }
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Personal setlist not found' });
    }
    
    res.json({ success: true, message: 'Song added to personal setlist' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove song from personal setlist
app.post('/api/my-setlists/remove-song', authMiddleware, async (req, res) => {
  try {
    const { setlistId, songId } = req.body;
    const userId = req.user.id;
    console.log('Removing song from personal setlist:', { setlistId, songId, userId });
    
    if (!setlistId || !songId) {
      return res.status(400).json({ error: 'Setlist ID and song ID are required' });
    }
    
    // First, let's check what the setlist looks like before removal
    const setlistBefore = await db.collection('MySetlists').findOne(
      { _id: new (require('mongodb').ObjectId)(setlistId), userId }
    );
    console.log('Personal setlist before removal:', setlistBefore ? setlistBefore.songs : 'not found');
    
    // Try to remove song ID directly (for new format)
    let result = await db.collection('MySetlists').updateOne(
      { 
        _id: new (require('mongodb').ObjectId)(setlistId),
        userId 
      },
      { 
        $pull: { songs: songId },
        $set: { updatedAt: new Date().toISOString() }
      }
    );
    
    // If no modification happened, try to remove song object (for old format)
    if (result.modifiedCount === 0) {
      result = await db.collection('MySetlists').updateOne(
        { 
          _id: new (require('mongodb').ObjectId)(setlistId),
          userId 
        },
        { 
          $pull: { songs: { id: songId } },
          $set: { updatedAt: new Date().toISOString() }
        }
      );
    }
    
    console.log('Remove result:', result);
    
    // Check what the setlist looks like after removal
    const setlistAfter = await db.collection('MySetlists').findOne(
      { _id: new (require('mongodb').ObjectId)(setlistId), userId }
    );
    console.log('Personal setlist after removal:', setlistAfter ? setlistAfter.songs : 'not found');
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Personal setlist not found' });
    }
    
    res.json({ success: true, message: 'Song removed from personal setlist' });
  } catch (err) {
    console.error('Error removing song from personal setlist:', err);
    res.status(500).json({ error: err.message });
  }
});

// Smart Setlists endpoints
app.get('/api/smart-setlists', authMiddleware, async (req, res) => {
  try {
    await connectToDatabase();
    const userId = req.user.id;
    const username = req.user.username;
    console.log(`📋 Loading Smart Setlists for user: ${userId} (${username})`);
    
    // Return:
    // 1. All admin-created smart setlists (visible to everyone)
    // 2. User's own smart setlists (visible only to creator)
    let smartSetlists = await db.collection('SmartSetlists').find({
      $or: [
        { isAdminCreated: true },        // All admin-created setlists
        { createdBy: userId }             // User's own setlists
      ]
    }).sort({ createdAt: -1 }).toArray();
    
    console.log(`📋 Found ${smartSetlists.length} Smart Setlists (admin-created + user's own)`);
    
    if (smartSetlists.length > 0) {
      console.log('📋 Smart Setlist names:', smartSetlists.map(s => `"${s.name}" (createdBy: ${s.createdBy}, isAdminCreated: ${s.isAdminCreated})`));
    }
    
    res.json(smartSetlists);
  } catch (err) {
    console.error('Error fetching smart setlists:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/smart-setlists', authMiddleware, async (req, res) => {
  try {
    await connectToDatabase();
    const { name, description, conditions, songs } = req.body;
    const userId = req.user.id;
    const isAdmin = req.user.isAdmin === true;
    
    console.log(`📋 Creating Smart Setlist "${name}" for user ID: ${userId} (${req.user.username}), isAdmin: ${isAdmin}`);
    console.log(`📋 Smart Setlist will have ${songs ? songs.length : 0} songs`);
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Smart setlist name is required' });
    }

    const smartSetlist = {
      _id: `smart_${Date.now()}`,
      name: name.trim(),
      description: description || '',
      conditions: conditions || {},
      songs: songs || [],
      createdAt: new Date().toISOString(),
      createdBy: userId, // Using user ID for consistency
      createdByUsername: req.user.username,
      isAdminCreated: isAdmin, // Track if created by admin
      updatedAt: new Date().toISOString()
    };

    console.log(`📋 Saving Smart Setlist with createdBy: ${smartSetlist.createdBy}, isAdminCreated: ${smartSetlist.isAdminCreated}`);
    const result = await db.collection('SmartSetlists').insertOne(smartSetlist);
    const insertedSetlist = await db.collection('SmartSetlists').findOne({ _id: result.insertedId });
    
    console.log(`📋 Smart Setlist "${name}" created successfully with ID: ${insertedSetlist._id}`);
    res.status(201).json(insertedSetlist);
  } catch (err) {
    console.error('Error creating smart setlist:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/smart-setlists/:id', authMiddleware, async (req, res) => {
  try {
    await connectToDatabase();
    const setlistId = req.params.id;
    const { name, description, conditions, songs } = req.body;
    const userId = req.user.id;
    const isAdmin = req.user.isAdmin === true;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Smart setlist name is required' });
    }

    // Get the existing setlist to check permissions
    const existingSetlist = await db.collection('SmartSetlists').findOne({ _id: setlistId });
    if (!existingSetlist) {
      return res.status(404).json({ error: 'Smart setlist not found' });
    }

    // Allow edit if: user is creator OR (user is admin AND setlist was created by admin)
    const canEdit = existingSetlist.createdBy === userId || (isAdmin && existingSetlist.isAdminCreated);
    if (!canEdit) {
      return res.status(403).json({ error: 'You do not have permission to edit this smart setlist' });
    }

    const updateData = {
      name: name.trim(),
      description: description || '',
      conditions: conditions || {},
      songs: songs || [],
      updatedAt: new Date().toISOString()
    };

    const result = await db.collection('SmartSetlists').updateOne(
      { _id: setlistId },
      { $set: updateData }
    );

    const updatedSetlist = await db.collection('SmartSetlists').findOne({ _id: setlistId });
    res.json(updatedSetlist);
  } catch (err) {
    console.error('Error updating smart setlist:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/smart-setlists/:id', authMiddleware, async (req, res) => {
  try {
    await connectToDatabase();
    const setlistId = req.params.id;
    const userId = req.user.id;
    const isAdmin = req.user.isAdmin === true;

    // Get the existing setlist to check permissions
    const existingSetlist = await db.collection('SmartSetlists').findOne({ _id: setlistId });
    if (!existingSetlist) {
      return res.status(404).json({ error: 'Smart setlist not found' });
    }

    // Allow delete if: user is creator OR (user is admin AND setlist was created by admin)
    const canDelete = existingSetlist.createdBy === userId || (isAdmin && existingSetlist.isAdminCreated);
    if (!canDelete) {
      return res.status(403).json({ error: 'You do not have permission to delete this smart setlist' });
    }

    const result = await db.collection('SmartSetlists').deleteOne({
      _id: setlistId
    });

    res.json({ success: true, message: 'Smart setlist deleted successfully' });
  } catch (err) {
    console.error('Error deleting smart setlist:', err);
    res.status(500).json({ error: err.message });
  }
});

// For local development - initialize database first
if (process.env.NODE_ENV !== 'production') {
  async function startLocalServer() {
    try {
      await connectToDatabase();
      const PORT = process.env.PORT || 3001;
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    } catch (err) {
      console.error('Failed to start server:', err);
      process.exit(1);
    }
  }
  startLocalServer();
}

// Export for Vercel
module.exports = app;