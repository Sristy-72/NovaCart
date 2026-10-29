import express from "express";
import { Router } from "express";
import addProducts from "../controllers/productController";

Router.post("/products", addProducts);

export default Router;
