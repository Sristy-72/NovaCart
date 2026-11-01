import express from "express";
import editProfile from "../controllers/editProfile.js";
import auth from "../middleware/auth.js";

const Router = express.Router();

Router.patch("/", auth, editProfile);
export default Router;
