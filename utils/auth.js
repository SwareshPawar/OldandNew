const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

async function getUserCollection(db) {
  return db.collection('Users');
}

async function registerUser(db, { firstName, lastName, username, email, phone, password, isAdmin = false }) {
  const users = await getUserCollection(db);
  if (!firstName || !lastName || !username || !email || !phone || !password) {
    throw new Error('All fields are required');
  }
  // Check for existing username or email (case-insensitive)
  const existing = await users.findOne({
    $or: [
      { username: username.toLowerCase() },
      { email: email.toLowerCase() }
    ]
  });
  if (existing) throw new Error('User or email already exists');
  const hash = await bcrypt.hash(password, 10);
  const result = await users.insertOne({
    firstName,
    lastName,
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    phone,
    password: hash,
    isAdmin
  });
  return { id: result.insertedId, firstName, lastName, username, email, phone, isAdmin };
}

async function authenticateUser(db, { loginInput, password }) {
  const users = await getUserCollection(db);
  // Find by username or email, case-insensitive
  const user = await users.findOne({
    $or: [
      { username: loginInput },
      { email: loginInput }
    ]
  });
  if (!user) throw new Error('Invalid credentials');
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error('Invalid credentials');
  const token = jwt.sign({
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    email: user.email,
    phone: user.phone,
    isAdmin: user.isAdmin
  }, JWT_SECRET, { expiresIn: '7d' });
  return {
  token,
  user: {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    email: user.email,
    phone: user.phone,
    isAdmin: user.isAdmin
  }
};
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

module.exports = { registerUser, authenticateUser, verifyToken };
