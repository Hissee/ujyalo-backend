import express from "express";
import { addProduct, getAllProducts, getProductById, updateProduct, deleteProduct } from "../controllers/products.controller.js";
import { verifyToken, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Only farmers can add products
router.post("/", verifyToken, requireRole("farmer"), addProduct);

// Public routes
router.get("/", getAllProducts);
router.get("/:id", getProductById);

// Farmer-only routes - update and delete products
router.put("/:id", verifyToken, requireRole("farmer"), updateProduct);
router.delete("/:id", verifyToken, requireRole("farmer"), deleteProduct);

export default router;
