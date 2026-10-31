import express from "express";
const Router = express.Router();
import pool from "../config/db.js";
import bcrypt from "bcrypt";

Router.post("/", async (req, res) => {
  const { name, email, password } = req.body;

  let client;

  try {
    const hashedpass = await bcrypt.hash(password, 10);
    client = await pool.connect();
    await client.query("BEGIN");

    // id user already exists
    const existingUser = await client.query(
      ` select id from users where email = $1`,
      [email],
    );

    if (existingUser.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "User already exists",
      });
    }
    const registeredUser = await client.query(
      `insert into users 
    (name , email , hashedpass) values
    ($1 , $2, $3) 
    returning id , name , email`,
      [name, email, hashedpass],
    );
    await client.query("COMMIT");

    return res.status(201).json({
      message: "sucessfully registered",
    });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK");
    }
    return res.status(400).json({
      error: error.message,
    });
  } finally {
    if (client) {
      client.release(); // Always release the client back to the pool
    }
  }
});

export default Router;
