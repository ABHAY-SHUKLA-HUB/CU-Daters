import('./models/SupportTicket.js').then(async (module) => {
  const SupportTicket = module.default;
  const SupportMessage = (await import('./models/SupportMessage.js')).default;
  
  // Get all support tickets
  const tickets = await SupportTicket.find()
    .populate('user_id', 'name email')
    .sort({ created_at: -1 })
    .lean();

  console.log('📋 Support Tickets Found:', tickets.length);
  console.log(JSON.stringify(tickets, null, 2));

  // Get messages  
  for (const ticket of tickets) {
    const messages = await SupportMessage.find({ support_ticket_id: ticket._id }).lean();
    console.log(`\n💬 Messages for Ticket ${ticket._id}:`);
    console.log(JSON.stringify(messages, null, 2));
  }

  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
