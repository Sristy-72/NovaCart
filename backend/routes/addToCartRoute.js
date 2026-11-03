import express from "express";
import addToCart from "../controllers/addToCart.js";
import auth from "../middleware/auth.js";

const Router = express.Router();

Router.post("/addToCart", auth, addToCart);

export default Router;
