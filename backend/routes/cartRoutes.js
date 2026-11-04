import express from "express";
import addToCart from "../controllers/addToCart.js";
import auth from "../middleware/auth.js";
import removeFromCart from "../controllers/removeFromCart.js";

const Router = express.Router();

Router.post("/addToCart", auth, addToCart);
Router.post("/removeFromCart", auth, removeFromCart);

export default Router;
