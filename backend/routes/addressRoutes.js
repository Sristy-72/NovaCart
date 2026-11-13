import express from "express";
import postAddress from "../controllers/addressController.js";
import auth from "../middleware/auth.js";
import addressController from "../controllers/addressController.js";

const Router = express.Router();

Router.post("/", auth, addressController.postAddress);
Router.get("/", auth, addressController.getAddress);

export default Router;
