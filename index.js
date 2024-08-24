import express from 'express';
import cors from "cors";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url'; // Import to handle __dirname in ES modules

import connect from "./database/connection.js";
import auth from './routes/auth.js'; // Import auth route

// Initialize environment variables from .env file
dotenv.config();

// Get the __filename and __dirname equivalents in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express(); // Create express app

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));

app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000; // Use port from environment variables or default to 5000

// Health check route or default route
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Use the auth route
app.use('/auth', auth);

// Serve the index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

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
