// routes/products.routes.js
import express from "express";


import {
  addProduct,
  getAllProducts,
  getProductById,
} from "../controllers/products.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Farmer adds a new product
router.post("/", verifyToken, addProduct);

// Get all products (public)
router.get("/", getAllProducts);

// Get a specific product
router.get("/:id", getProductById);

export default router;
