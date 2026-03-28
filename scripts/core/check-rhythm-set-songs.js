/**
 * Check songs assigned to a specific rhythm set
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

async function checkRhythmSetSongs() {
  const rhythmSetId = process.argv[2];
  
  if (!rhythmSetId) {
    console.error('Usage: node check-rhythm-set-songs.js <rhythmSetId>');
    process.exit(1);
  }
  
  const mongoUri = process.env.MONGODB_URI;
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const db = client.db('OldNewSongs');
    const songsCollection = db.collection('OldNewSongs');
    
    // Find songs with this rhythm set
    const songs = await songsCollection.find({ 
      rhythmSetId: { $regex: new RegExp(rhythmSetId, 'i') }
    }).toArray();
    
    console.log(`\nFound ${songs.length} songs with rhythm set matching "${rhythmSetId}":\n`);
    
    songs.forEach((song, i) => {
      console.log(`${i + 1}. ${song.title}`);
      console.log(`   ID: ${song.id}`);
      console.log(`   Rhythm Set: ${song.rhythmSetId}`);
      console.log(`   Mood: ${song.mood || 'none'}`);
      console.log(`   Genre: ${song.genre || 'none'}`);
      console.log(`   Taal: ${song.taal || 'none'}`);
      console.log(`   Tempo: ${song.tempo || 'none'}`);
      console.log(`   Time: ${song.timeSignature || song.time || 'none'}`);
      console.log(`   Rhythm Category: ${song.rhythmCategory || 'none'}`);
      console.log('');
    });
    
  } finally {
    await client.close();
  }
}

checkRhythmSetSongs().catch(console.error);
