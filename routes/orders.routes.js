const express = require("express");
const router = express.Router();
const { authenticateToken, requireRole } = require("../middlewares/auth.middleware");
const { placeOrder, listUserOrders } = require("../controllers/orders.controller");

router.post("/", authenticateToken, requireRole("customer"), placeOrder);
router.get("/my", authenticateToken, listUserOrders);

module.exports = router;
