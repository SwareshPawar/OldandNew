// ...existing code...

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const ExcelJS = require('exceljs');
const { jsonToExcelBuffer } = require('./utils/exportUtils');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
let db;
let songsCollection;
let configCollection;

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
    'https://swareshpawar.github.io'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
// Export all data as JSON
app.get('/api/export/json', localAuthMiddleware, requireAdmin, async (req, res) => {
  try {
    const songs = await songsCollection.find({}).toArray();
    const users = await usersCollection.find({}, { projection: { password: 0 } }).toArray();
    const config = await configCollection.find({}).toArray();
    res.setHeader('Content-Disposition', 'attachment; filename="oldandnew_export.json"');
    res.setHeader('Content-Type', 'application/json');
    res.json({ songs, users, config });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export all data as Excel
app.get('/api/export/excel', localAuthMiddleware, requireAdmin, async (req, res) => {
  try {
    const songs = await songsCollection.find({}).toArray();
    const users = await usersCollection.find({}, { projection: { password: 0 } }).toArray();
    const config = await configCollection.find({}).toArray();
    const workbook = new ExcelJS.Workbook();
    // Songs sheet
    const songsSheet = workbook.addWorksheet('Songs');
    if (songs.length > 0) {
      songsSheet.columns = Object.keys(songs[0]).map(key => ({ header: key, key }));
      songs.forEach(row => songsSheet.addRow(row));
    }
    // Users sheet
    const usersSheet = workbook.addWorksheet('Users');
    if (users.length > 0) {
      usersSheet.columns = Object.keys(users[0]).map(key => ({ header: key, key }));
      users.forEach(row => usersSheet.addRow(row));
    }
    // Config sheet
    const configSheet = workbook.addWorksheet('Config');
    if (config.length > 0) {
      configSheet.columns = Object.keys(config[0]).map(key => ({ header: key, key }));
      config.forEach(row => configSheet.addRow(row));
    }
    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Disposition', 'attachment; filename="oldandnew_export.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.use(express.json());
app.use(express.static('public'));


// JWT secret for local auth
const JWT_SECRET = process.env.JWT_SECRET || 'changeme_secret';

// Local auth middleware
function localAuthMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Malformed token' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}


async function main() {
  try {
    await client.connect();
  db = client.db('OldNewSongs');
  songsCollection = db.collection('OldNewSongs');
  usersCollection = db.collection('Users');
  configCollection = db.collection('Config');
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  }
}


// Local admin check (add 'role' to JWT payload)
function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Admin access required' });
}

// User registration
app.post('/api/register', async (req, res) => {
  const { username, password, email, role } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  const existing = await usersCollection.findOne({ username });
  if (existing) return res.status(409).json({ error: 'Username already exists' });
  const hash = await bcrypt.hash(password, 10);
  const user = { username, password: hash, email, role: role || 'user' };
  await usersCollection.insertOne(user);
  res.status(201).json({ message: 'User registered' });
});

// User login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  const user = await usersCollection.findOne({ username });
  console.log('Login attempt:', { username, user });
  if (!user) {
    console.log('User not found');
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const valid = await bcrypt.compare(password, user.password);
  console.log('Password compare result:', valid, 'Input password:', password, 'User hash:', user.password);
  if (!valid) {
    console.log('Password invalid');
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  // Issue JWT
  const token = jwt.sign({ username: user.username, role: user.role || 'user', email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});


// Songs endpoints
app.get('/api/songs', async (req, res) => {
  try {
    const songs = await songsCollection.find({}).toArray();
    res.json(songs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Only logged-in users can add, update, or delete songs
app.post('/api/songs', localAuthMiddleware, async (req, res) => {
  try {
    if (typeof req.body.id !== 'number') {
      const last = await songsCollection.find().sort({ id: -1 }).limit(1).toArray();
      req.body.id = last.length ? last[0].id + 1 : 1;
    }
    const result = await songsCollection.insertOne(req.body);
    const insertedSong = await songsCollection.findOne({ _id: result.insertedId });
    res.status(201).json(insertedSong);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/songs/:id', localAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const update = { $set: req.body };
    const result = await songsCollection.updateOne({ id: parseInt(id) }, update);
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Song not found' });
    }
    res.json({ message: 'Song updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/songs/:id', localAuthMiddleware, requireAdmin, async (req, res) => {
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

app.delete('/api/songs', localAuthMiddleware, requireAdmin, async (req, res) => {
  try {
    await songsCollection.deleteMany({});
    res.json({ message: 'All songs deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User data endpoints (require login)
app.get('/api/userdata', localAuthMiddleware, async (req, res) => {
  const userId = req.user.username;
  const doc = await db.collection('UserData').findOne({ _id: userId });
  res.json(doc || { favorites: [], NewSetlist: [], OldSetlist: [] });
});

app.put('/api/userdata', localAuthMiddleware, async (req, res) => {
  const userId = req.user.username;
  const { favorites, NewSetlist, OldSetlist, name, email } = req.body;
  await db.collection('UserData').updateOne(
    { _id: userId },
    { $set: { favorites, NewSetlist, OldSetlist, name, email } },
    { upsert: true }
  );
  res.json({ message: 'User data updated' });
});



// Password reset endpoint
app.post('/api/reset-password', async (req, res) => {
  const { username, newPassword } = req.body;
  if (!username || !newPassword) {
    return res.status(400).json({ error: 'Username and new password required' });
  }
  const user = await usersCollection.findOne({ username });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const hash = await bcrypt.hash(newPassword, 10);
  await usersCollection.updateOne(
    { username },
    { $set: { password: hash } }
  );
  res.json({ message: 'Password reset successful' });
});

main().then(() => {
// === Admin Panel Endpoints ===
// Get all users (admin only)
app.get('/api/admin/users', localAuthMiddleware, requireAdmin, async (req, res) => {
  const users = await usersCollection.find({}, { projection: { password: 0 } }).toArray();
  res.json(users);
});

// Promote user to admin (admin only)
app.put('/api/admin/users/:username/promote', localAuthMiddleware, requireAdmin, async (req, res) => {
  const { username } = req.params;
  const result = await usersCollection.updateOne({ username }, { $set: { role: 'admin' } });
  if (result.matchedCount === 0) return res.status(404).json({ error: 'User not found' });
  res.json({ message: 'User promoted to admin' });
});

// Delete user (admin only)
app.delete('/api/admin/users/:username', localAuthMiddleware, requireAdmin, async (req, res) => {
  const { username } = req.params;
  const result = await usersCollection.deleteOne({ username });
  if (result.deletedCount === 0) return res.status(404).json({ error: 'User not found' });
  res.json({ message: 'User deleted' });
});
// Endpoint to check if a user is admin by username
app.get('/api/is-admin/:username', async (req, res) => {
  const { username } = req.params;
  if (!username) return res.status(400).json({ error: 'Username required' });
  const user = await usersCollection.findOne({ username });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ isAdmin: user.role === 'admin' });
});

// === Config Endpoints (Admin Only) ===
// Get recommendation weights
app.get('/api/config/weights', localAuthMiddleware, requireAdmin, async (req, res) => {
  let config = await configCollection.findOne({ _id: 'weights' });
  if (!config) {
    // Default weights if not set
    config = {
      _id: 'weights',
      language: 20,
      scale: 30,
      timeSignature: 25,
      taal: 15,
      tempo: 5,
      genre: 5
    };
    await configCollection.insertOne(config);
  }
  res.json(config);
});

// Update recommendation weights
app.put('/api/config/weights', localAuthMiddleware, requireAdmin, async (req, res) => {
  const { language, scale, timeSignature, taal, tempo, genre } = req.body;
  const update = {
    language: Number(language),
    scale: Number(scale),
    timeSignature: Number(timeSignature),
    taal: Number(taal),
    tempo: Number(tempo),
    genre: Number(genre)
  };
  await configCollection.updateOne(
    { _id: 'weights' },
    { $set: update },
    { upsert: true }
  );
  res.json({ message: 'Weights updated', weights: update });
});

  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch((err) => {
  console.error('Error starting server:', err);
});