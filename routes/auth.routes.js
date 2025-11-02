import express from "express";
import {
  signupConsumer,
  signupFarmer,
  signupCustomer, // Legacy support
  login,
  getCurrentUser,
  updatePassword,
  updateProfile,
  verifyToken as verifyTokenEndpoint
} from "../controllers/auth.controller.js";
import { verifyToken, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public routes
router.post("/signup/consumer", signupConsumer);
router.post("/signup/farmer", signupFarmer);
router.post("/signup/customer", signupCustomer); // Legacy - redirects to consumer
router.post("/login", login);
router.get("/verify", verifyToken, verifyTokenEndpoint); // Verify token validity

// Protected routes - require authentication
router.get("/me", verifyToken, getCurrentUser); // Get current user profile
router.put("/password", verifyToken, updatePassword); // Update password
router.put("/profile", verifyToken, updateProfile); // Update profile

export default router;
