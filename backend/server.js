import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors);

const PORT = process.env.PORT;

app.get("/", (req, res) => {
  return res.send(`server is running on port ${PORT}`);
});
app.listen(PORT, (req, res) => {
  console.log("backend running");
});
