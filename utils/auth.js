const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

async function getUserCollection(db) {
  return db.collection('Users');
}

async function registerUser(db, { username, password, isAdmin = false }) {
  const users = await getUserCollection(db);
  const existing = await users.findOne({ username });
  if (existing) throw new Error('User already exists');
  const hash = await bcrypt.hash(password, 10);
  const result = await users.insertOne({ username, password: hash, isAdmin });
  return { id: result.insertedId, username, isAdmin };
}

async function authenticateUser(db, { username, password }) {
  const users = await getUserCollection(db);
  const user = await users.findOne({ username });
  if (!user) throw new Error('Invalid credentials');
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error('Invalid credentials');
  const token = jwt.sign({ id: user._id, username: user.username, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '7d' });
  return { token, user: { id: user._id, username: user.username, isAdmin: user.isAdmin } };
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

module.exports = { registerUser, authenticateUser, verifyToken };
