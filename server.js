const express = require("express");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const { connectDB, getDB } = require("./db");

const app = express();
app.use(express.json());
app.use(cors());

connectDB();

// ----------------- Customer Signup -----------------
app.post("/api/signup", async (req, res) => {
  try {
    const db = getDB();
    const { firstName, middleName, lastName, email, phone, province, city, street, password } = req.body;

    // Check if email exists
    const existing = await db.collection("users").findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await db.collection("users").insertOne({
      firstName,
      middleName,
      lastName,
      name: [firstName, middleName, lastName].filter(Boolean).join(" "),
      email,
      phone,
      role: "customer",
      address: { province, city, street },
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.status(201).json({ message: "Signup successful", userId: result.insertedId });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// ----------------- Farmer Add Product -----------------
app.post("/api/products", async (req, res) => {
  try {
    const db = getDB();
    const { farmerId, name, description, category, price, quantity, images } = req.body;

    const result = await db.collection("products").insertOne({
      farmerId,
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
    res.status(500).json({ message: "Server error", error });
  }
});

// ----------------- Place Order -----------------
app.post("/api/orders", async (req, res) => {
  try {
    const db = getDB();
    const { customerId, products, deliveryAddress } = req.body;

    const totalAmount = products.reduce((sum, p) => sum + p.price * p.quantity, 0);

    const result = await db.collection("orders").insertOne({
      customerId,
      products,
      totalAmount,
      status: "pending",
      deliveryAddress,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.status(201).json({ message: "Order placed", orderId: result.insertedId });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// ----------------- Start Server -----------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
