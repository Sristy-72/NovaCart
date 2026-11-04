import express from "express";

import deleteProduct from "../controllers/deleteProduct.js";
import auth from "../middleware/auth.js";
import addProduct from "../controllers/addProduct.js";
import adminMiddleware from "../middleware/admin.js";
import editProductDetails from "../controllers/editProductDetails.js";

const Router = express.Router();

// auth for checking whether user is logged in and adminMiddelware is to check whether role of the user is admin or  not

Router.post("/addProduct", auth, adminMiddleware, addProduct);
Router.delete("/:product_id", auth, adminMiddleware, deleteProduct);
Router.patch("/:product_id", auth, adminMiddleware, editProductDetails);

// editProductDetails
// updateProductStatus

export default Router;
