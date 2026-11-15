import express from "express";
import auth from "../middleware/auth.js";
import addressController from "../controllers/addressController.js";

const Router = express.Router();

Router.post("/", auth, addressController.postAddress);
Router.get("/", auth, addressController.getAddress);
Router.patch("/:id", auth, addressController.updateAddress);
Router.delete("/:id", auth, addressController.deleteAddress);

export default Router;
