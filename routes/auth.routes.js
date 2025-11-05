import express from "express";
import {
  signupConsumer,
  signupFarmer,
  signupCustomer, // Legacy support
  login,
  getCurrentUser,
  updatePassword,
  updateProfile,
  verifyToken as verifyTokenEndpoint,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  verifyOTP,
  resendOTP,
  resendPasswordResetOTP,
  deactivateAccount,
  deleteAccount
} from "../controllers/auth.controller.js";
import { verifyToken, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public routes
router.post("/signup/consumer", signupConsumer);
router.post("/signup/farmer", signupFarmer);
router.post("/signup/customer", signupCustomer); // Legacy - redirects to consumer
router.post("/login", login);
router.post("/verify-email", verifyEmail); // Verify email address
router.post("/resend-verification", resendVerificationEmail); // Resend verification email
router.post("/forgot-password", forgotPassword); // Request password reset OTP
router.post("/reset-password", resetPassword); // Reset password with OTP
router.post("/resend-password-reset-otp", resendPasswordResetOTP); // Resend password reset OTP
router.post("/verify-otp", verifyOTP); // Verify OTP and complete signup
router.post("/resend-otp", resendOTP); // Resend OTP
router.get("/verify", verifyToken, verifyTokenEndpoint); // Verify token validity

// Protected routes - require authentication
router.get("/me", verifyToken, getCurrentUser); // Get current user profile
router.put("/password", verifyToken, updatePassword); // Update password
router.put("/profile", verifyToken, updateProfile); // Update profile
router.post("/deactivate", verifyToken, deactivateAccount); // Deactivate account
router.post("/delete-account", verifyToken, deleteAccount); // Delete account

export default router;
