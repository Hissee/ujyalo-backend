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

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";

const app = express();
app.use(express.json());
app.use(cors());

// Connect MongoDB
await connectDB();

// ----------------- Consumer Signup -----------------
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

// ----------------- Start Server -----------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
