// routes/transactions.routes.js
import express from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
  getUserTransactions,
  getTransactionById
} from "../controllers/transactions.controller.js";

const router = express.Router();

/**
 * @route   GET /api/transactions
 * @desc    Get all transactions for the authenticated user
 * @access  Private
 */
router.get("/", verifyToken, getUserTransactions);

/**
 * @route   GET /api/transactions/:id
 * @desc    Get transaction details by ID
 * @access  Private
 */
router.get("/:id", verifyToken, getTransactionById);

export default router;

