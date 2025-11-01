import express from "express";
import { addProduct, getAllProducts, getProductById } from "../controllers/products.controller.js";
import { verifyToken, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Only farmers can add products
router.post("/", verifyToken, requireRole("farmer"), addProduct);

// Public routes
router.get("/", getAllProducts);
router.get("/:id", getProductById);

export default router;
