import mongoose from 'mongoose';
import dns from 'node:dns';

export const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/seeu-daters';

  try {
    console.log(`\n🔍 Attempting to connect to MongoDB...`);
    console.log(`📍 URI: ${mongoURI.includes('localhost') ? 'LOCALHOST' : 'ATLAS (Cloud)'}`);
    console.log(`📍 Full URI: ${mongoURI.substring(0, 60)}...`);

    if (mongoURI.startsWith('mongodb+srv://')) {
      const dnsServers = (process.env.MONGODB_DNS_SERVERS || '8.8.8.8,1.1.1.1')
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);

      if (dnsServers.length > 0) {
        dns.setServers(dnsServers);
        console.log(`📍 DNS Resolvers: ${dnsServers.join(', ')}`);
      }
    }
    
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
    console.log(`✓ Database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`⚠️ MongoDB Connection Error: ${error.message}`);
    throw error;
  }
};

export default connectDB;
