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
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'], // <-- Add 'Authorization' if not present
}));
app.use(express.json());
app.use(express.static('public'));

const { registerUser, authenticateUser, verifyToken } = require('./utils/auth');

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

async function main() {
  try {
    await client.connect();
    db = client.db('OldNewSongs');
    songsCollection = db.collection('OldNewSongs');
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  }
}

function requireAdmin(req, res, next) {
  if (req.user && req.user.isAdmin) return next();
  return res.status(403).json({ error: 'Admin access required' });
}
// User registration
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, isAdmin } = req.body;
    const user = await registerUser(db, { username, password, isAdmin });
    res.status(201).json({ message: 'User registered', user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const { token, user } = await authenticateUser(db, { username, password });
    res.json({ token, user });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

app.get('/api/songs', async (req, res) => {
  try {
    const songs = await songsCollection.find({}).toArray();
    res.json(songs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Protected: only logged-in users can add, update, or delete songs
app.post('/api/songs', authMiddleware, requireAdmin, async (req, res) => {
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

app.put('/api/songs/:id', authMiddleware, requireAdmin, async (req, res) => {
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

app.get('/api/userdata', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const doc = await db.collection('UserData').findOne({ _id: userId });
  res.json(doc || { favorites: [], NewSetlist: [], OldSetlist: [] });
});

app.put('/api/userdata', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { favorites, NewSetlist, OldSetlist, name, email } = req.body;
  await db.collection('UserData').updateOne(
    { _id: userId },
    { $set: { favorites, NewSetlist, OldSetlist, name, email } },
    { upsert: true }
  );
  res.json({ message: 'User data updated' });
});


main().then(() => {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch((err) => {
  console.error('Error starting server:', err);
});