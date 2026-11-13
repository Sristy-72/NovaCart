import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./config/db.js";
import imageRoutes from "./routes/imageRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import cookieParser from "cookie-parser";
import profileUpdateRoute from "./routes/profileUpdateRoute.js";
import cartRoutes from "./routes/cartRoutes.js";
import addressRoutes from "./routes/addressRoutes.js";

dotenv.config();

const app = express();

//middleware
app.use(express.json());
app.use(cors());
app.use(cookieParser());

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

// product routes include add, delete and update product
app.use("/api/product", productRoutes);
app.use("/api/upload", imageRoutes);

// authentication
app.use("/api/auth", authRoutes);

// updating profile

app.use("/api/editProfile", profileUpdateRoute);

// cart route include add , remove , cartCheckout , view cart
app.use("/api/cart", cartRoutes);

// address route --> add , remove , edit

app.use("/api/address", addressRoutes);

//server running
app.listen(PORT, () => {
  console.log("backend running");
});
