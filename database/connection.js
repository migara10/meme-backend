import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();


async function connect() {
    try {
      const db = await mongoose.connect('mongodb+srv://sphiriad:wo5eIHAnZvgRTBes@cluster0.qkuh3tq.mongodb.net/meme', {
      });
      console.log("Connected to MongoDB");
      return db;
    } catch (error) {
      console.error("Error connecting to MongoDB:", error);
    }
  }
  
  export default connect;

