import forgotPassword from "../controllers/forgotPassword.js";
import {
  loginController,
  logoutController,
} from "../controllers/loginController.js";
import { registerController } from "../controllers/registerController.js";
import resetPassword from "../controllers/resetPassword.js";

import express from "express";
const Router = express.Router();

Router.post("/register", registerController);
Router.post("/login", loginController);
Router.post("/logout", logoutController);
Router.post("/forgotPassword", forgotPassword);
Router.post("/resetPassword", resetPassword);

export default Router;
