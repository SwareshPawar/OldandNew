const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
let db;
let songsCollection;

const uri = "mongodb+srv://genericuser:Swar%40123@cluster0.ovya99h.mongodb.net/OldNewSongs?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const app = express();
app.use(cors());
app.use(express.json());


async function main() {
  await client.connect();
  db = client.db('OldNewSongs');
  songsCollection = db.collection('OldNewSongs');
  console.log('Connected to MongoDB');
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
    // Ensure id is a number and unique
    if (typeof req.body.id !== 'number') {
      // Find max id and increment
      const last = await songsCollection.find().sort({ id: -1 }).limit(1).toArray();
      req.body.id = last.length ? last[0].id + 1 : 1;
    }
    const result = await songsCollection.insertOne(req.body);
    res.status(201).json(result.ops ? result.ops[0] : req.body);
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

// Only start server after DB is connected!
async function main() {
  await client.connect();
  db = client.db('OldNewSongs'); // Assign db here
  songsCollection = db.collection('OldNewSongs');
  console.log('Connected to MongoDB');
}

app.get('/api/userdata', async (req, res) => {
  try {
    const doc = await db.collection('UserData').findOne({ _id: 'userdata' });
    res.json(doc || { favorites: [], NewSetlist: [], OldSetlist: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT all user data (favorites and setlists)
app.put('/api/userdata', async (req, res) => {
  try {
    console.log('PUT /api/userdata', req.body); // Add this line
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

// For backward compatibility, you can keep these (optional):
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
}).catch(console.error);

