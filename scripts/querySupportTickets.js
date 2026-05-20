
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const SupportTicketSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  category: String,
  status: String,
  created_at: { type: Date, default: Date.now },
  description: String
});

const SupportTicket = mongoose.model("SupportTicket", SupportTicketSchema);

async function checkTickets() {
  try {
    if (!process.env.MONGODB_URI) {
       console.error("MONGODB_URI not found in environment.");
       process.exit(1);
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");
    const tickets = await SupportTicket.find().sort({ created_at: -1 }).limit(10);
    if (tickets.length === 0) {
      console.log("No support tickets found.");
    } else {
      console.log(`Found ${tickets.length} Support Tickets:`);
      console.log(JSON.stringify(tickets, null, 2));
    }
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkTickets();
