import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB, getDB } from "./db.js";
import { ObjectId } from "mongodb";

// Routes
import authRoutes from "./routes/auth.routes.js";
import productsRoutes from "./routes/Products.routes.js";
import ordersRoutes from "./routes/orders.routes.js";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";

const app = express();
app.use(express.json());
app.use(cors());

// Connect MongoDB
await connectDB();

// ----------------- Routes -----------------
app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/orders", ordersRoutes);

// ----------------- Start Server -----------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
