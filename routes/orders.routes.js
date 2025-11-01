import express from "express";
import { placeOrder, listUserOrders, getOrderDetails, cancelOrder } from "../controllers/orders.controller.js";
import { authenticateToken, requireConsumer } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", authenticateToken, requireConsumer, placeOrder);
router.get("/my-orders", authenticateToken, requireConsumer, listUserOrders);
router.get("/:orderId", authenticateToken, requireConsumer, getOrderDetails);
router.patch("/:orderId/cancel", authenticateToken, requireConsumer, cancelOrder);

export default router;
