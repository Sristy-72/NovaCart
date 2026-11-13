import express from "express";
import postAddress from "../controllers/addressController.js";
import auth from "../middleware/auth.js";

const Router = express.Router();

Router.post("/", auth, postAddress);

export default Router;
