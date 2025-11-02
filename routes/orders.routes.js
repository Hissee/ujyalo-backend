import express from "express";
import { placeOrder, listUserOrders, verifyKhaltiPayment } from "../controllers/orders.controller.js";
import { verifyToken, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Only customers can place orders
router.post("/", verifyToken, requireRole("customer"), placeOrder);

// List orders for logged-in customer
router.get("/my", verifyToken, requireRole("customer"), listUserOrders);

// Verify Khalti payment
router.post("/verify-khalti", verifyToken, requireRole("customer"), verifyKhaltiPayment);

export default router;
