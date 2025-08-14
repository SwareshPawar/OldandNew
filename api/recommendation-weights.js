import { verifyToken } from '../utils/auth';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload || !payload.isAdmin) return res.status(403).json({ error: 'Admin access required' });

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const config = db.collection('config');
    if (req.method === 'GET') {
      const weights = await config.findOne({ _id: 'weights' });
      res.status(200).json(weights || {});
    } else if (req.method === 'PUT') {
      await config.updateOne({ _id: 'weights' }, { $set: req.body }, { upsert: true });
      res.status(200).json({ message: 'Weights updated' });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await client.close();
  }
}
