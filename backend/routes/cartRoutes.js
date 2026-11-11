import express from "express";
import addToCart from "../controllers/addToCart.js";
import auth from "../middleware/auth.js";
import removeFromCart from "../controllers/removeFromCart.js";
import viewCart from "../services/viewCart.js";
import checkoutPreview from "../controllers/checkoutPreview.js";

const Router = express.Router();

Router.post("/addToCart", auth, addToCart);
Router.post("/removeFromCart", auth, removeFromCart);
Router.post("/viewCart", auth, viewCart);
Router.post("/checkoutPreview", auth, checkoutPreview);

export default Router;
