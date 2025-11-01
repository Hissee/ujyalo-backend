import express from "express";
import {
  addProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getFarmerProducts,
  getProductsByFarmerId
} from "../controllers/products.controller.js";
import { authenticateToken, requireFarmer } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public routes (no authentication required)
router.get("/", getAllProducts);
router.get("/:id", getProductById);
router.get("/farmer/:farmerId", getProductsByFarmerId);

// Protected farmer routes (require farmer role)
router.post("/", authenticateToken, requireFarmer, addProduct);
router.get("/farmer/my/products", authenticateToken, requireFarmer, getFarmerProducts);
router.put("/:id", authenticateToken, requireFarmer, updateProduct);
router.delete("/:id", authenticateToken, requireFarmer, deleteProduct);

export default router;