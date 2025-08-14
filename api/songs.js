import { verifyToken } from '../utils/auth';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI;

export default async function handler(req, res) {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const songs = db.collection('Songs');
    if (req.method === 'GET') {
      const allSongs = await songs.find({}).toArray();
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
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await client.close();
  }
}
