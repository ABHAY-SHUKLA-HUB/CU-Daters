import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SupportTicket from './models/SupportTicket.js';
import SupportMessage from './models/SupportMessage.js';

dotenv.config();

const main = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ Connected to MongoDB\n');

    // Get all support tickets
    const tickets = await SupportTicket.find()
      .populate('user_id', 'name email')
      .sort({ created_at: -1 })
      .lean();

    console.log('📋 Support Tickets Found:', tickets.length);
    tickets.forEach((ticket, idx) => {
      console.log(`\n[${idx + 1}] Ticket ID: ${ticket._id}`);
      console.log(`    User: ${ticket.user_id?.name || 'Unknown'} (${ticket.user_id?.email})`);
      console.log(`    Category: ${ticket.category}`);
      console.log(`    Status: ${ticket.status}`);
      console.log(`    Created: ${new Date(ticket.created_at).toLocaleString()}`);
      console.log(`    Description: ${ticket.description.substring(0, 80)}...`);
    });

    // Get messages for each ticket
    for (const ticket of tickets) {
      const messages = await SupportMessage.find({ support_ticket_id: ticket._id }).lean();
      console.log(`\n💬 Messages for Ticket ${ticket._id.toString().slice(-8)}:`);
      if (messages.length === 0) {
        console.log('   (No messages)');
      } else {
        messages.forEach((msg, idx) => {
          console.log(`   [${idx + 1}] ${msg.sender_type}: ${msg.message.substring(0, 60)}...`);
          console.log(`       Time: ${new Date(msg.created_at).toLocaleString()}`);
        });
      }
    }

    console.log('\n✅ Check complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

main();
