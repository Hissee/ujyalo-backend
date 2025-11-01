import express from "express";
import { signupCustomer, signupFarmer, login } from "../controllers/auth.controller.js";

const router = express.Router();

// Customer signup
router.post("/signup/customer", signupCustomer);

// Farmer signup
router.post("/signup/farmer", signupFarmer);

// Login
router.post("/login", login);

export default router;
