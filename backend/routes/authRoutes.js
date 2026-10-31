import { loginController } from "../controllers/loginController.js";
import { registerController } from "../controllers/registerController.js";

import express from "express";
const Router = express.Router();
Router.post("/register", registerController);
Router.post("/login", loginController);

export default Router;
