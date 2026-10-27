import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./config/db.js";

dotenv.config();

const app = express();

//middleware
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT;
console.log(PORT);

/* app.get("/", (req, res) => {
  return res.send(`server for Ecommerce is running on port ${PORT}`);
}); */

app.get("/api/cart", (req, res) => {
  return res.send("cart backend");
});

// testing postgres connection

app.get("/", async (req, res) => {
  const result = await pool.query("SELECT current_database()");
  return res.send(`${result.rows[0].current_database}`);
});

//server running
app.listen(PORT, () => {
  console.log("backend running");
});
