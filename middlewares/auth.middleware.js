import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

export const requireFarmer = (req, res, next) => {
  if (req.user.role !== "farmer") {
    return res.status(403).json({ message: "Farmer access required" });
  }
  next();
};

export const requireConsumer = (req, res, next) => {
  if (req.user.role !== "consumer") {
    return res.status(403).json({ message: "Consumer access required" });
  }
  next();
};