import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { getDB } from "../db.js";

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";

// ✅ Verify token middleware
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

    if (!token) {
      return res.status(403).json({ message: "Access denied: No token provided" });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Verify user still exists in database
      const db = getDB();
      const user = await db.collection("users").findOne({ _id: new ObjectId(decoded.userId) });
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Attach user info to request
      req.user = {
        userId: decoded.userId,
        role: decoded.role || user.role,
        name: decoded.name || user.name,
        email: decoded.email || user.email
      };
      
      next();
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expired" });
      } else if (err.name === "JsonWebTokenError") {
        return res.status(401).json({ message: "Invalid token" });
      }
      return res.status(401).json({ message: "Unauthorized: Token verification failed" });
    }
  } catch (error) {
    console.error("Verify token middleware error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ✅ Role-based access middleware
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: No user information found" });
    }
    
    // Support both "customer" and "consumer" roles
    const userRole = req.user.role;
    const normalizedRole = userRole === "customer" ? "consumer" : userRole;
    const normalizedRoles = roles.map(r => r === "customer" ? "consumer" : r);
    
    if (!normalizedRoles.includes(normalizedRole)) {
      return res.status(403).json({
        message: `Access denied: Required role(s): ${roles.join(", ")}`,
        userRole: userRole
      });
    }
    
    next();
  };
};
