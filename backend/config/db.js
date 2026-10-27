import pkg from "pg";
const { Pool } = pkg; // we are not direcly importing from pfg because pg is commonJS module which does not allows direct import
// so we need to destructure Pool in order to use it
import dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
  host: "localhost",
  user: "postgres",
  port: 5432,
  password: process.env.DB_PASSWORD,
  database: "ecommerce",
});

pool.on("connect", () => {
  console.log("connection pool established with Database");
});
export default pool;
