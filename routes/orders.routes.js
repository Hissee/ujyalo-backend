import express from "express";
import { placeOrder, listUserOrders, verifyKhaltiPayment, verifyEsewaPayment } from "../controllers/orders.controller.js";
import { verifyToken, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Only consumers/customers can place orders
router.post("/", verifyToken, requireRole("consumer", "customer"), placeOrder);

// List orders for logged-in consumer/customer
router.get("/my", verifyToken, requireRole("consumer", "customer"), listUserOrders);

// Verify Khalti payment
router.post("/verify-khalti", verifyToken, requireRole("consumer", "customer"), verifyKhaltiPayment);

// Verify eSewa payment
router.post("/verify-esewa", verifyToken, requireRole("consumer", "customer"), verifyEsewaPayment);

export default router;
