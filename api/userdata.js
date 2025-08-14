import { verifyToken } from '../utils/auth';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI;

export default async function handler(req, res) {
      res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Invalid or expired token' });

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const users = db.collection('Users');
    if (req.method === 'GET') {
      const user = await users.findOne({ _id: new ObjectId(payload.id) });
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.status(200).json({ favorites: user.favorites || [], NewSetlist: user.NewSetlist || [], OldSetlist: user.OldSetlist || [], user: { username: user.username, isAdmin: user.isAdmin } });
    } else if (req.method === 'PUT') {
      const { favorites, NewSetlist, OldSetlist } = req.body;
      await users.updateOne({ _id: new ObjectId(payload.id) }, { $set: { favorites, NewSetlist, OldSetlist } });
      res.status(200).json({ message: 'User data updated' });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await client.close();
  }
}
