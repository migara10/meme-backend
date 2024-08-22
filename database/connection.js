import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();


async function connect() {
    try {
      const db = await mongoose.connect(process.env.DATABASE_URL, {
      });
      console.log("Connected to MongoDB");
      return db;
    } catch (error) {
      console.error("Error connecting to MongoDB:", error);
    }
  }
  
  export default connect;

