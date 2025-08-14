import { verifyToken } from '../utils/auth';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const songs = db.collection('Songs');

    
      if (req.method === 'GET') {
        const { updatedAfter } = req.query;
        let query = {};
        if (updatedAfter) {
          // Filter songs updated after the given timestamp
          const ts = Number(updatedAfter);
          query = {
            $or: [
              { updatedAt: { $gt: ts } },
              { createdAt: { $gt: ts } }
            ]
          };
        }
        const allSongs = await songs.find(query).toArray();
        res.status(200).json(allSongs);
    } else if (req.method === 'POST') {
      // Auth required
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
      }
      const token = authHeader.split(' ')[1];
      const payload = verifyToken(token);
      if (!payload) return res.status(401).json({ error: 'Invalid or expired token' });
      const newSong = req.body;
      await songs.insertOne(newSong);
      res.status(201).json({ message: 'Song added' });
    } else if (req.method === 'PUT') {
      // Auth required
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
      }
      const token = authHeader.split(' ')[1];
      const payload = verifyToken(token);
      if (!payload) return res.status(401).json({ error: 'Invalid or expired token' });
      const id = req.query.id || req.body.id;
      if (!id) return res.status(400).json({ error: 'Missing song id' });
      const updateFields = {};
      ['title','category','key','tempo','time','taal','genres','lyrics','updatedAt','updatedBy'].forEach(f => {
        if (req.body[f] !== undefined) updateFields[f] = req.body[f];
      });
      const result = await songs.updateOne({ _id: new ObjectId(id) }, { $set: updateFields });
      if (result.matchedCount === 0) return res.status(404).json({ error: 'Song not found' });
      res.status(200).json({ message: 'Song updated' });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await client.close();
  }
}
