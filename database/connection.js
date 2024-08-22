import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

async function connect() {
  try {
    // Connect to MongoDB using the DATABASE_URL from environment variables
    const db = await mongoose.connect(process.env.DATABASE_URL, {
      useNewUrlParser: true,   // Use the new MongoDB connection string parser
      useUnifiedTopology: true, // Use the new unified topology engine for MongoDB
    });
    console.log("Connected to MongoDB");
    return db;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message || error);
    process.exit(1); // Exit the process with failure
  }
}

export default connect;
