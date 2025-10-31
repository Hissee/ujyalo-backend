import express from "express";
import { placeOrder, listUserOrders } from "../controllers/orders.controller.js";
import { verifyToken, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Only customers can place orders
router.post("/", verifyToken, requireRole("customer"), placeOrder);

// List orders for logged-in customer
router.get("/my", verifyToken, requireRole("customer"), listUserOrders);

export default router;
