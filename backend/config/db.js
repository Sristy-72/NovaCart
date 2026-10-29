import pkg from "pg";
const { Pool, Client } = pkg; // we are not direcly importing from pfg because pg is commonJS module which does not allows direct import
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

// const client = new Client({ ...config });
// Client.connect().then(() => console.log("connected "));  this is when we will use Client Client is used for only one connection

pool.on("connect", () => {
  console.log("connection pool established with Database");
});
export default pool;
