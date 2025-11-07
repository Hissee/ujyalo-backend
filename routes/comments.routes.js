// routes/comments.routes.js
import express from "express";
import { 
  addComment, 
  getCommentsByProduct, 
  updateComment, 
  deleteComment 
} from "../controllers/comments.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public route - get comments for a product
router.get("/product/:productId", getCommentsByProduct);

// Protected routes - require authentication
router.post("/", verifyToken, addComment);
router.put("/:id", verifyToken, updateComment);
router.delete("/:id", verifyToken, deleteComment);

export default router;

