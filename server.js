import express from 'express';
import cors from "cors";

import connect from "./database/connection.js";




const app = express(); // create express app
app.use(express.json());
app.use(cors());

const PORT = 5000 || process.env.PORT; // create local build port or get prod build port

app.get('/',(req,res) => {
  res.send('migara')
})



connect()
  .then(() => {
    try {
      app.listen(PORT, () => {
        console.log(`server connect on: ${PORT}`);
      });
    } catch (err) {
      console.log("server Connect Failed", err);
    }
  })
  .catch((err) => {
    console.log("Invalid Database connection", err);
  });
