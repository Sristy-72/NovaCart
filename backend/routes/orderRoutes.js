import express from "express";
import auth from "../middleware/auth.js";
import placeOrder from "../controllers/placeOrder.js";

const Router = express.Router();

Router.post("/placeOrder", auth, placeOrder);

export default Router;
