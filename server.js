import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { connectDB, getDB } from "./db.js";
import { ObjectId } from "mongodb";

// Routes
import authRoutes from "./routes/auth.routes.js";
import productsRoutes from "./routes/products.routes.js";
import ordersRoutes from "./routes/orders.routes.js";
import farmerRoutes from "./routes/farmer.routes.js";
import notificationsRoutes from "./routes/notifications.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import locationRoutes from "./routes/location.routes.js";
import commentsRoutes from "./routes/comments.routes.js";
import { initializePricePrediction } from "./services/pricePrediction.service.js";
import { initializeAdminUser } from "./utils/initAdmin.js";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";

const app = express();
app.use(express.json());
app.use(cors());

// Connect MongoDB
await connectDB();

// Initialize default admin user
await initializeAdminUser();

// Initialize price prediction models
await initializePricePrediction();

// ----------------- Customer Signup -----------------
app.post("/api/signup", async (req, res) => {
  try {
    const db = getDB();
    const { firstName, middleName, lastName, email, phone, province, city, street, password, role } = req.body;

    const existing = await db.collection("users").findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.collection("users").insertOne({
      firstName,
      middleName,
      lastName,
      name: [firstName, middleName, lastName].filter(Boolean).join(" "),
      email,
      phone,
      role,
      address: { province, city, street },
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.status(201).json({ message: "Signup successful", userId: result.insertedId });
  } catch (error) {
    console.error("Signup error:", error); // helpful for debugging
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ----------------- Routes -----------------
app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/farmer", farmerRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/comments", commentsRoutes);

// ----------------- Start Server -----------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
