import 'dotenv/config';
import mongoose from 'mongoose';
import AdminSession from './models/AdminSession.js';

async function debugMongo() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('Connection readyState:', mongoose.connection.readyState);
    
    // Check if collection exists
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    // Try to insert a test document with required fields
    console.log('Inserting test admin session...');
    const testSession = new AdminSession({
      adminId: new mongoose.Types.ObjectId(),
      token: 'debug-token-' + Date.now(),
      csrfTokenHash: 'debug-csrf-hash',
      refreshTokenHash: 'debug-refresh-hash',
      role: 'admin',
      expiresAt: new Date(Date.now() + 3600000)
    });
    await testSession.save();
    console.log('Success: Inserted test document with ID:', testSession._id);

    // Count documents
    const count = await AdminSession.countDocuments();
    console.log('Total documents in adminsessions:', count);

    // Show recent documents
    const recent = await AdminSession.find().sort({ createdAt: -1 }).limit(2);
    console.log('Recent sessions:', JSON.stringify(recent, null, 2));

  } catch (err) {
    console.error('DEBUG ERROR:', err);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

debugMongo();
