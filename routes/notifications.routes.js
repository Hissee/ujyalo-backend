import express from "express";
import {
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} from "../controllers/notifications.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All notification routes require authentication
router.get("/", verifyToken, getUserNotifications);
router.get("/unread-count", verifyToken, getUnreadCount);
router.put("/:id/read", verifyToken, markNotificationAsRead);
router.put("/read-all", verifyToken, markAllNotificationsAsRead);
router.delete("/:id", verifyToken, deleteNotification);

export default router;

