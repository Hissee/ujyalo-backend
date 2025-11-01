import express from "express";
import { signupConsumer, signupFarmer, login } from "../controllers/auth.controller.js";

const router = express.Router();

// Consumer signup
router.post("/signup/consumer", signupConsumer);

// Farmer signup
router.post("/signup/farmer", signupFarmer);

// Login
router.post("/login", login);

export default router;
