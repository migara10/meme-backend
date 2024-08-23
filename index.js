import express from 'express';
import cors from "cors";
import dotenv from 'dotenv';

import connect from "./database/connection.js";
import auth from './routes/auth.js'; // Import auth route

// Load environment variables from .env file
dotenv.config();

const app = express(); // Create express app
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000; // Use port from environment variables or default to 5000

// Health check route or default route
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Use the auth route
app.use('/auth', auth);

// Connect to MongoDB and start the server
connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port: ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Invalid Database connection:", err);
  });
