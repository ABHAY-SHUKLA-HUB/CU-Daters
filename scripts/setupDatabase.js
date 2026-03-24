// scripts/setupDatabase.js
/**
 * Database Setup Script
 * 
 * This script sets up the MongoDB database for the subscription system
 * Run with: node scripts/setupDatabase.js
 * 
 * It will:
 * 1. Connect to MongoDB
 * 2. Create collections if they don't exist
 * 3. Create indexes for optimal query performance
 * 4. Seed initial data (subscription plans)
 * 5. Log all actions
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Subscription = require('../src/backend/models/Subscription');
const SubscriptionRequest = require('../src/backend/models/SubscriptionRequest');
const PaymentsAudit = require('../src/backend/models/PaymentsAudit');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campus-connect';

async function setupDatabase() {
  console.log('🚀 Starting database setup...\n');

  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    // Create indexes
    console.log('📑 Creating indexes...');
    
    // Subscription indexes
    console.log('  - subscription_id (unique)');
    await Subscription.collection.createIndex({ subscription_id: 1 }, { unique: true });
    
    console.log('  - user_id');
    await Subscription.collection.createIndex({ user_id: 1 });
    
    console.log('  - status');
    await Subscription.collection.createIndex({ status: 1 });
    
    console.log('  - expiry_date (with TTL: 30 days)');
    await Subscription.collection.createIndex(
      { expiry_date: 1 },
      { expireAfterSeconds: 2592000 }
    );
    
    console.log('  - user_id + status compound');
    await Subscription.collection.createIndex({ user_id: 1, status: 1 });
    
    console.log('  - user_id + expiry_date compound');
    await Subscription.collection.createIndex({ user_id: 1, expiry_date: 1 });
    
    // SubscriptionRequest indexes
    console.log('  - request_id (unique)');
    await SubscriptionRequest.collection.createIndex({ request_id: 1 }, { unique: true });
    
    console.log('  - user_id');
    await SubscriptionRequest.collection.createIndex({ user_id: 1 });
    
    console.log('  - status');
    await SubscriptionRequest.collection.createIndex({ status: 1 });
    
    console.log('  - payment_id (unique sparse)');
    await SubscriptionRequest.collection.createIndex(
      { payment_id: 1 },
      { unique: true, sparse: true }
    );
    
    console.log('  - fraud_score');
    await SubscriptionRequest.collection.createIndex({ fraud_score: 1 });
    
    console.log('  - created_at');
    await SubscriptionRequest.collection.createIndex({ created_at: 1 });
    
    console.log('  - user_id + created_at compound');
    await SubscriptionRequest.collection.createIndex({ user_id: 1, created_at: -1 });
    
    console.log('  - status + created_at compound');
    await SubscriptionRequest.collection.createIndex({ status: 1, created_at: -1 });
    
    console.log('  - fraud_score + status compound');
    await SubscriptionRequest.collection.createIndex({ fraud_score: -1, status: 1 });
    
    // PaymentsAudit indexes
    console.log('  - audit_id (unique)');
    await PaymentsAudit.collection.createIndex({ audit_id: 1 }, { unique: true });
    
    console.log('  - request_id');
    await PaymentsAudit.collection.createIndex({ request_id: 1 });
    
    console.log('  - user_id');
    await PaymentsAudit.collection.createIndex({ user_id: 1 });
    
    console.log('  - admin_id');
    await PaymentsAudit.collection.createIndex({ admin_id: 1 });
    
    console.log('  - action');
    await PaymentsAudit.collection.createIndex({ action: 1 });
    
    console.log('  - timestamp');
    await PaymentsAudit.collection.createIndex({ timestamp: 1 });
    
    console.log('  - request_id + timestamp compound');
    await PaymentsAudit.collection.createIndex({ request_id: 1, timestamp: -1 });
    
    console.log('  - user_id + timestamp compound');
    await PaymentsAudit.collection.createIndex({ user_id: 1, timestamp: -1 });
    
    console.log('  - admin_id + timestamp compound');
    await PaymentsAudit.collection.createIndex({ admin_id: 1, timestamp: -1 });
    
    console.log('✅ All indexes created successfully\n');

    // Seed initial data
    console.log('🌱 Seeding initial data...');
    
    // Check if subscription_plans collection exists and has data
    const plansCollection = mongoose.connection.collection('subscription_plans');
    const existingPlans = await plansCollection.findOne({});
    
    if (!existingPlans) {
      const plans = [
        {
          plan_id: 'monthly',
          name: 'Monthly Premium',
          amount: 4.99,
          currency: 'INR',
          duration_days: 30,
          description: 'Monthly access to premium features',
          features: [
            'Unlimited chats',
            'No ads',
            'Verified badge',
            'Priority matching'
          ],
          created_at: new Date()
        },
        {
          plan_id: 'yearly',
          name: 'Yearly Premium',
          amount: 39.99,
          currency: 'INR',
          duration_days: 365,
          description: 'Yearly access with 33% savings',
          features: [
            'Unlimited chats',
            'No ads',
            'Verified badge',
            'Priority matching',
            'Save 33% vs monthly'
          ],
          created_at: new Date()
        }
      ];

      await plansCollection.insertMany(plans);
      console.log('  ✅ Inserted subscription plans');
    } else {
      console.log('  ⚙️  Plans already exist, skipping seed');
    }

    console.log('\n✅ Database setup completed successfully!\n');

    // Display summary
    console.log('📊 Database Summary:');
    const subCount = await Subscription.countDocuments();
    const reqCount = await SubscriptionRequest.countDocuments();
    const auditCount = await PaymentsAudit.countDocuments();
    
    console.log(`  - Subscriptions: ${subCount}`);
    console.log(`  - Subscription Requests: ${reqCount}`);
    console.log(`  - Audit Logs: ${auditCount}`);
    console.log(`  - Subscription Plans: 2\n`);

    // Display indexes
    const subscriptionIndexes = await Subscription.collection.getIndexes();
    console.log(`📑 Indexes Created: ${Object.keys(subscriptionIndexes).length + Object.keys(await SubscriptionRequest.collection.getIndexes()).length + Object.keys(await PaymentsAudit.collection.getIndexes()).length - 3}\n`);

    console.log('🎉 Ready to use!\n');

  } catch (error) {
    console.error('\n❌ Database setup failed:');
    console.error(error);
    process.exit(1);
  } finally {
    // Close connection
    await mongoose.disconnect();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run setup
setupDatabase();
