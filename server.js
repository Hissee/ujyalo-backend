// server.js
import express from "express";
import bcrypt from "bcryptjs";
import cors from "cors";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { connectDB, getDB, ObjectId } from "./db.js";


dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

await connectDB();
const JWT_SECRET = process.env.JWT_SECRET;

// ----------------- Signup -----------------
app.post("/api/signup", async (req, res) => {
  try {
    const db = getDB();
    const { firstName, middleName, lastName, email, phone, province, city, street, password, role } = req.body;

    if (!role || !["customer", "farmer"].includes(role))
      return res.status(400).json({ message: "Role must be 'customer' or 'farmer'" });

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
    console.log("Inserted user:", result);

    res.status(201).json({ message: "Signup successful", userId: result.insertedId, role });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ----------------- Login -----------------
app.post("/api/login", async (req, res) => {
  try {
    const db = getDB();
    const { email, password } = req.body;

    const user = await db.collection("users").findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ message: "Login successful", token, role: user.role, userId: user._id });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ----------------- Auth Middleware -----------------
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

// ----------------- Product Routes (Farmers only) -----------------

// Add Product
app.post("/api/products", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "farmer") return res.status(403).json({ message: "Only farmers can add products" });

    const db = getDB();
    const { name, description, category, price, quantity, images } = req.body;

    const result = await db.collection("products").insertOne({
      farmerId: req.user.id,
      name,
      description,
      category,
      price,
      quantity,
      images: images || [],
      status: "available",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.status(201).json({ message: "Product added", productId: result.insertedId });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update Product
app.put("/api/products/:id", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "farmer") return res.status(403).json({ message: "Only farmers can update products" });

    const db = getDB();
    const productId = req.params.id;
    const { name, description, category, price, quantity, images } = req.body;

    const product = await db.collection("products").findOne({ _id: new ObjectId(productId) });
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (product.farmerId !== req.user.id) return res.status(403).json({ message: "Cannot update others' products" });

    await db.collection("products").updateOne(
      { _id: new ObjectId(productId) },
      { $set: { name, description, category, price, quantity, images, updatedAt: new Date() } }
    );

    res.json({ message: "Product updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete Product
app.delete("/api/products/:id", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "farmer") return res.status(403).json({ message: "Only farmers can delete products" });

    const db = getDB();
    const productId = req.params.id;

    const product = await db.collection("products").findOne({ _id: new ObjectId(productId) });
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (product.farmerId !== req.user.id) return res.status(403).json({ message: "Cannot delete others' products" });

    await db.collection("products").deleteOne({ _id: new ObjectId(productId) });
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ----------------- Get Products -----------------

// Get all products
app.get("/api/products", async (req, res) => {
  try {
    const db = getDB();
    const products = await db.collection("products").find({ status: "available" }).toArray();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get products by farmer ID
app.get("/api/products/farmer/:farmerId", async (req, res) => {
  try {
    const db = getDB();
    const { farmerId } = req.params;

    const products = await db
      .collection("products")
      .find({ farmerId: farmerId, status: "available" })
      .toArray();

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ----------------- Orders Route (Customers only) -----------------
app.post("/api/orders", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "customer") return res.status(403).json({ message: "Only customers can place orders" });

    const db = getDB();
    const { products, deliveryAddress } = req.body;
    const totalAmount = products.reduce((sum, p) => sum + p.price * p.quantity, 0);

    const result = await db.collection("orders").insertOne({
      customerId: req.user.id,
      products,
      totalAmount,
      status: "pending",
      deliveryAddress,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.status(201).json({ message: "Order placed", orderId: result.insertedId });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ----------------- Start Server -----------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
