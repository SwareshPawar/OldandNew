// update_songs_createdby.js
const { MongoClient } = require('mongodb');


require('dotenv').config();
const uri = process.env.MONGODB_URI;
const dbName = 'OldNewSongs'; // From your .env and server.js
const collectionName = 'OldNewSongs';

async function updateAllSongs() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const songs = db.collection(collectionName);

    const today = new Date();

    const result = await songs.updateMany(
      {},
      {
        $set: {
          createdBy: 'Swaresh',
          createdAt: today
        }
      }
    );
    console.log(`Updated ${result.modifiedCount} songs.`);
  } finally {
    await client.close();
  }
}

updateAllSongs().catch(console.error);