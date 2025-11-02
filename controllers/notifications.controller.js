import { getDB } from "../db.js";

// Helper function to create notification
const createNotification = async (userId, type, title, message, orderId = null) => {
  try {
    const db = getDB();
    const notification = {
      userId: userId,
      type: type,
      title: title,
      message: message,
      orderId: orderId,
      read: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection("notifications").insertOne(notification);
    return result.insertedId;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

// Get all notifications for current user
export const getUserNotifications = async (req, res) => {
  try {
    const db = getDB();
    const userId = req.user.userId;

    const notifications = await db.collection("notifications")
      .find({ userId: userId })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(notifications);
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get unread notifications count
export const getUnreadCount = async (req, res) => {
  try {
    const db = getDB();
    const userId = req.user.userId;

    const count = await db.collection("notifications")
      .countDocuments({ userId: userId, read: false });

    res.json(count);
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const db = getDB();
    const userId = req.user.userId;
    const notificationId = req.params.id;

    const { ObjectId } = await import("mongodb");
    
    const result = await db.collection("notifications").updateOne(
      { _id: new ObjectId(notificationId), userId: userId },
      { $set: { read: true, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Mark notification as read error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const db = getDB();
    const userId = req.user.userId;

    await db.collection("notifications").updateMany(
      { userId: userId, read: false },
      { $set: { read: true, updatedAt: new Date() } }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all notifications as read error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const db = getDB();
    const userId = req.user.userId;
    const notificationId = req.params.id;

    const { ObjectId } = await import("mongodb");
    
    const result = await db.collection("notifications").deleteOne(
      { _id: new ObjectId(notificationId), userId: userId }
    );

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification deleted" });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Export helper function for use in other controllers
export { createNotification };

