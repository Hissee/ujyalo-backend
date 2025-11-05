import express from "express";
import {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  deleteUser,
  getAllProducts,
  adminDeleteProduct,
  getAllOrders,
  adminUpdateOrderStatus
} from "../controllers/admin.controller.js";
import { verifyToken, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All admin routes require authentication and admin role
router.use(verifyToken);
router.use(requireRole("admin"));

// Dashboard
router.get("/dashboard/stats", getDashboardStats);

// User Management
router.get("/users", getAllUsers);
router.put("/users/:userId/status", updateUserStatus);
router.delete("/users/:userId", deleteUser);

// Product Management
router.get("/products", getAllProducts);
router.delete("/products/:productId", adminDeleteProduct);

// Order Management
router.get("/orders", getAllOrders);
router.put("/orders/:orderId/status", adminUpdateOrderStatus);

export default router;

