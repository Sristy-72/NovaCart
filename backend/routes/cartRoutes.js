import express from "express";
import addToCart from "../controllers/addToCart.js";
import auth from "../middleware/auth.js";
import removeFromCart from "../controllers/removeFromCart.js";
import adminMiddleware from "../middleware/admin.js";

const Router = express.Router();

Router.post("/addToCart", auth, addToCart);
Router.post("/removeFromCart", auth, adminMiddleware, removeFromCart);

export default Router;
