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
    'https://oldandnew.onrender.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());
app.use(express.static('public'));

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

app.get('/api/songs', async (req, res) => {
  try {
    const songs = await songsCollection.find({}).toArray();
    res.json(songs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/songs', async (req, res) => {
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

app.put('/api/songs/:id', async (req, res) => {
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

app.delete('/api/songs/:id', async (req, res) => {
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

app.delete('/api/songs', async (req, res) => {
  try {
    await songsCollection.deleteMany({});
    res.json({ message: 'All songs deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/userdata', async (req, res) => {
  try {
    const doc = await db.collection('UserData').findOne({ _id: 'userdata' });
    res.json(doc || { favorites: [], NewSetlist: [], OldSetlist: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/userdata', async (req, res) => {
  try {
    const { favorites, NewSetlist, OldSetlist } = req.body;
    await db.collection('UserData').updateOne(
      { _id: 'userdata' },
      { $set: { favorites, NewSetlist, OldSetlist } },
      { upsert: true }
    );
    res.json({ message: 'User data updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/favorites', async (req, res) => {
  try {
    const doc = await db.collection('UserData').findOne({ _id: 'userdata' });
    res.json({ favorites: (doc && doc.favorites) || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/favorites', async (req, res) => {
  try {
    const { favorites } = req.body;
    await db.collection('UserData').updateOne(
      { _id: 'userdata' },
      { $set: { favorites } },
      { upsert: true }
    );
    res.json({ message: 'Favorites updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/setlists', async (req, res) => {
  try {
    const doc = await db.collection('UserData').findOne({ _id: 'userdata' });
    res.json({ NewSetlist: (doc && doc.NewSetlist) || [], OldSetlist: (doc && doc.OldSetlist) || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/setlists', async (req, res) => {
  try {
    const { NewSetlist, OldSetlist } = req.body;
    await db.collection('UserData').updateOne(
      { _id: 'userdata' },
      { $set: { NewSetlist, OldSetlist } },
      { upsert: true }
    );
    res.json({ message: 'Setlists updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

main().then(() => {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch((err) => {
  console.error('Error starting server:', err);
});