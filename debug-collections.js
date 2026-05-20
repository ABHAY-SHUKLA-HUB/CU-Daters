import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cu-daters';

async function listCollections() {
  try {
    await mongoose.connect(MONGO_URI);
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections in database:');
    collections.forEach(c => console.log(' - ' + c.name));
    
    const sessionLike = collections.filter(c => c.name.toLowerCase().includes('session'));
    for (const coll of sessionLike) {
      const count = await mongoose.connection.db.collection(coll.name).countDocuments();
      console.log(`\nCollection ${coll.name} contains ${count} documents.`);
      if (count > 0) {
          const sample = await mongoose.connection.db.collection(coll.name).findOne();
          console.log('Sample document:', JSON.stringify(sample, null, 2));
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

listCollections();
