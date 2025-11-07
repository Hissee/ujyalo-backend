// routes/ratings.routes.js
import express from "express";
import { 
  addOrUpdateRating, 
  getRatingsByProduct, 
  getUserRating,
  deleteRating 
} from "../controllers/ratings.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public route - get ratings for a product
router.get("/product/:productId", getRatingsByProduct);

// Protected routes - require authentication
router.post("/", verifyToken, addOrUpdateRating);
router.get("/product/:productId/user", verifyToken, getUserRating);
router.delete("/:id", verifyToken, deleteRating);

export default router;

