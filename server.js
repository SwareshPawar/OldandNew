require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
let db;
let songsCollection;

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
    'https://swareshpawar.github.io' // <-- Add this line
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

// Get recommendation weights config
app.get('/api/recommendation-weights', async (req, res) => {
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

function requireAdmin(req, res, next) {
  if (req.user && req.user.isAdmin) return next();
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
    // Pass all fields to registerUser
    const user = await registerUser(db, { firstName, lastName, username, email, phone, password, isAdmin });
    res.status(201).json({ message: 'User registered', user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Debug endpoint to check database connection
app.get('/api/debug/db', async (req, res) => {
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

app.get('/api/songs', async (req, res) => {
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
    const result = await songsCollection.deleteOne({ id: parseInt(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Song not found' });
    }
    res.json({ message: 'Song deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/songs', authMiddleware, requireAdmin, async (req, res) => {
  try {
    await songsCollection.deleteMany({});
    res.json({ message: 'All songs deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Scan songs based on multiple filter conditions
app.post('/api/songs/scan', async (req, res) => {
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

// Global Setlist endpoints (admin only)
app.get('/api/global-setlists', async (req, res) => {
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
    const isAdmin = req.user.isAdmin || false;
    
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
    const isAdmin = req.user.isAdmin || false;

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
    const isAdmin = req.user.isAdmin || false;

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