import express from "express";
import {
  getFarmerProducts,
  getFarmerOrders,
  getFarmerDashboardStats,
  updateOrderStatus,
  getFarmerRevenue
} from "../controllers/farmer.controller.js";
import { verifyToken, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication and farmer role
router.use(verifyToken);
router.use(requireRole("farmer"));

// Farmer products
router.get("/products", getFarmerProducts);

// Farmer orders
router.get("/orders", getFarmerOrders);

// Farmer dashboard statistics
router.get("/dashboard/stats", getFarmerDashboardStats);

// Farmer revenue
router.get("/revenue", getFarmerRevenue);

// Update order status
router.put("/orders/:orderId/status", updateOrderStatus);

export default router;

