
import { authenticateUser } from '../utils/auth';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5501');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing username or password' });
  }
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const { token, user } = await authenticateUser(db, { username, password });
    res.status(200).json({ token, user });
  } catch (err) {
    res.status(401).json({ error: err.message });
  } finally {
    await client.close();
  }
}
