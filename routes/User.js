const express = require("express");
const router = express.Router();
const User = require("../models/User"); // adjust path if needed
const bcrypt = require("bcryptjs");

// POST /api/users/register
router.post("/register", async (req, res) => {
  try {
    const { firstName, middleName, lastName, email, phoneNumber, province, city, street, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      full_name: `${firstName} ${middleName} ${lastName}`.trim(),
      email,
      password_hash: hashedPassword,
      phone: phoneNumber,
      role: "consumer", // default role
      address: `${street}, ${city}, ${province}`,
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
