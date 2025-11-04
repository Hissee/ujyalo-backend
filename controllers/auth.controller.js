// controllers/auth.controller.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDB } from "../db.js";
import { ObjectId } from "mongodb";
import { generateVerificationToken, sendVerificationEmail } from "../services/email.service.js";

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";

// Helper function to validate email
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Helper function to validate password
const validatePassword = (password) => {
  // At least 6 characters
  return password && password.length >= 6;
};

// Helper function to validate required fields
const validateSignupData = (data, role) => {
  const errors = [];

  if (!data.firstName || data.firstName.trim().length === 0) {
    errors.push("First name is required");
  }
  if (!data.email || !validateEmail(data.email)) {
    errors.push("Valid email is required");
  }
  if (!data.password || !validatePassword(data.password)) {
    errors.push("Password must be at least 6 characters");
  }
  if (!data.phone || data.phone.trim().length === 0) {
    errors.push("Phone number is required");
  }

  return errors;
};

// -------------------- Consumer Signup (Customer/Consumer) --------------------
export const signupConsumer = async (req, res) => {
  try {
    const db = getDB();
    const { firstName, middleName, lastName, email, phone, province, city, street, password } = req.body;

    // Validation
    const validationErrors = validateSignupData(req.body, 'consumer');
    if (validationErrors.length > 0) {
      return res.status(400).json({ message: "Validation failed", errors: validationErrors });
    }

    // Check if user already exists
    const existing = await db.collection("users").findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate email verification token
    const emailVerificationToken = generateVerificationToken();
    const emailVerificationTokenExpires = new Date();
    emailVerificationTokenExpires.setHours(emailVerificationTokenExpires.getHours() + 24); // 24 hours

    const userName = [firstName, middleName, lastName].filter(Boolean).join(" ").trim();
    const userEmail = email.toLowerCase().trim();

    // Create user
    const result = await db.collection("users").insertOne({
      firstName: firstName.trim(),
      middleName: middleName ? middleName.trim() : "",
      lastName: lastName ? lastName.trim() : "",
      name: userName,
      email: userEmail,
      phone: phone.trim(),
      role: "consumer", // Changed from "customer" to "consumer"
      address: {
        province: province ? province.trim() : "",
        city: city ? city.trim() : "",
        street: street ? street.trim() : ""
      },
      password: hashedPassword,
      emailVerified: false,
      emailVerificationToken: emailVerificationToken,
      emailVerificationTokenExpires: emailVerificationTokenExpires,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Send verification email
    try {
      await sendVerificationEmail(userEmail, userName, emailVerificationToken);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Continue with signup even if email fails
    }

    // Generate token for immediate login (but user needs to verify email)
    const token = jwt.sign(
      { userId: result.insertedId, role: "consumer", name: userName },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Consumer signup successful. Please check your email to verify your account.",
      token,
      user: {
        userId: result.insertedId,
        role: "consumer",
        name: userName,
        email: userEmail,
        emailVerified: false
      },
      requiresEmailVerification: true
    });
  } catch (error) {
    console.error("Consumer signup error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Farmer Signup --------------------
export const signupFarmer = async (req, res) => {
  try {
    const db = getDB();
    const { firstName, middleName, lastName, email, phone, province, city, street, password } = req.body;

    // Validation
    const validationErrors = validateSignupData(req.body, 'farmer');
    if (validationErrors.length > 0) {
      return res.status(400).json({ message: "Validation failed", errors: validationErrors });
    }

    // Check if user already exists
    const existing = await db.collection("users").findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate email verification token
    const emailVerificationToken = generateVerificationToken();
    const emailVerificationTokenExpires = new Date();
    emailVerificationTokenExpires.setHours(emailVerificationTokenExpires.getHours() + 24); // 24 hours

    const userName = [firstName, middleName, lastName].filter(Boolean).join(" ").trim();
    const userEmail = email.toLowerCase().trim();

    // Create farmer
    const result = await db.collection("users").insertOne({
      firstName: firstName.trim(),
      middleName: middleName ? middleName.trim() : "",
      lastName: lastName ? lastName.trim() : "",
      name: userName,
      email: userEmail,
      phone: phone.trim(),
      role: "farmer",
      address: {
        province: province ? province.trim() : "",
        city: city ? city.trim() : "",
        street: street ? street.trim() : ""
      },
      password: hashedPassword,
      emailVerified: false,
      emailVerificationToken: emailVerificationToken,
      emailVerificationTokenExpires: emailVerificationTokenExpires,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Send verification email
    try {
      await sendVerificationEmail(userEmail, userName, emailVerificationToken);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Continue with signup even if email fails
    }

    // Generate token for immediate login (but user needs to verify email)
    const token = jwt.sign(
      { userId: result.insertedId, role: "farmer", name: userName },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Farmer signup successful. Please check your email to verify your account.",
      token,
      user: {
        userId: result.insertedId,
        role: "farmer",
        name: userName,
        email: userEmail,
        emailVerified: false
      },
      requiresEmailVerification: true
    });
  } catch (error) {
    console.error("Farmer signup error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Login (Works for both Farmer and Consumer) --------------------
export const login = async (req, res) => {
  try {
    const db = getDB();
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Find user by email
    const user = await db.collection("users").findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(403).json({ 
        message: "Please verify your email address before logging in. Check your inbox for the verification link.",
        requiresEmailVerification: true,
        email: user.email
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
        name: user.name,
        email: user.email
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return user data (excluding password)
    res.json({
      message: "Login successful",
      token,
      user: {
        userId: user._id,
        role: user.role,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        emailVerified: user.emailVerified || false
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Get Current User Profile --------------------
export const getCurrentUser = async (req, res) => {
  try {
    const db = getDB();
    
    // req.user is set by verifyToken middleware
    const user = await db.collection("users").findOne(
      { _id: new ObjectId(req.user.userId) },
      { projection: { password: 0 } } // Exclude password
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user: {
        userId: user._id,
        role: user.role,
        name: user.name,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        address: user.address,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Update Password --------------------
export const updatePassword = async (req, res) => {
  try {
    const db = getDB();
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    // Get user
    const user = await db.collection("users").findOne({ _id: new ObjectId(req.user.userId) });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.collection("users").updateOne(
      { _id: new ObjectId(req.user.userId) },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date()
        }
      }
    );

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Update password error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Update Profile --------------------
export const updateProfile = async (req, res) => {
  try {
    const db = getDB();
    const { firstName, middleName, lastName, phone, province, city, street } = req.body;

    const updateData = {
      updatedAt: new Date()
    };

    if (firstName) updateData.firstName = firstName.trim();
    if (middleName !== undefined) updateData.middleName = middleName ? middleName.trim() : "";
    if (lastName) updateData.lastName = lastName.trim();
    if (phone) updateData.phone = phone.trim();
    
    // Update name if any name field changed
    if (firstName || middleName !== undefined || lastName) {
      const user = await db.collection("users").findOne({ _id: new ObjectId(req.user.userId) });
      const finalFirstName = firstName ? firstName.trim() : (user.firstName || "");
      const finalMiddleName = middleName !== undefined ? (middleName ? middleName.trim() : "") : (user.middleName || "");
      const finalLastName = lastName ? lastName.trim() : (user.lastName || "");
      updateData.name = [finalFirstName, finalMiddleName, finalLastName].filter(Boolean).join(" ").trim();
    }

    if (province !== undefined || city !== undefined || street !== undefined) {
      const user = await db.collection("users").findOne({ _id: new ObjectId(req.user.userId) });
      updateData.address = {
        province: province !== undefined ? province.trim() : (user.address?.province || ""),
        city: city !== undefined ? city.trim() : (user.address?.city || ""),
        street: street !== undefined ? street.trim() : (user.address?.street || "")
      };
    }

    // Update user
    await db.collection("users").updateOne(
      { _id: new ObjectId(req.user.userId) },
      { $set: updateData }
    );

    // Get updated user
    const updatedUser = await db.collection("users").findOne(
      { _id: new ObjectId(req.user.userId) },
      { projection: { password: 0 } }
    );

    res.json({
      message: "Profile updated successfully",
      user: {
        userId: updatedUser._id,
        role: updatedUser.role,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        firstName: updatedUser.firstName,
        middleName: updatedUser.middleName,
        lastName: updatedUser.lastName,
        address: updatedUser.address
      }
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Verify Token (Refresh User Info) --------------------
export const verifyToken = async (req, res) => {
  try {
    // If middleware passed, token is valid
    const db = getDB();
    const user = await db.collection("users").findOne(
      { _id: new ObjectId(req.user.userId) },
      { projection: { password: 0 } }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      valid: true,
      user: {
        userId: user._id,
        role: user.role,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address
      }
    });
  } catch (error) {
    console.error("Verify token error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Verify Email --------------------
export const verifyEmail = async (req, res) => {
  try {
    const db = getDB();
    const { token, email } = req.body;

    // Validation
    if (!token || !email) {
      return res.status(400).json({ message: "Token and email are required" });
    }

    // Find user by email
    const user = await db.collection("users").findOne({ 
      email: email.toLowerCase().trim(),
      emailVerificationToken: token
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid verification token or email" });
    }

    // Check if already verified
    if (user.emailVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    // Check if token expired
    if (user.emailVerificationTokenExpires && new Date() > new Date(user.emailVerificationTokenExpires)) {
      return res.status(400).json({ message: "Verification token has expired. Please request a new one." });
    }

    // Update user to verified
    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          emailVerified: true,
          updatedAt: new Date()
        },
        $unset: {
          emailVerificationToken: "",
          emailVerificationTokenExpires: ""
        }
      }
    );

    res.json({
      message: "Email verified successfully. You can now log in.",
      verified: true
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Resend Verification Email --------------------
export const resendVerificationEmail = async (req, res) => {
  try {
    const db = getDB();
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Find user by email
    const user = await db.collection("users").findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      // Don't reveal if email exists for security
      return res.json({ 
        message: "If an account with this email exists, a verification email has been sent." 
      });
    }

    // Check if already verified
    if (user.emailVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    // Generate new verification token
    const emailVerificationToken = generateVerificationToken();
    const emailVerificationTokenExpires = new Date();
    emailVerificationTokenExpires.setHours(emailVerificationTokenExpires.getHours() + 24); // 24 hours

    // Update user with new token
    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          emailVerificationToken: emailVerificationToken,
          emailVerificationTokenExpires: emailVerificationTokenExpires,
          updatedAt: new Date()
        }
      }
    );

    // Send verification email
    try {
      await sendVerificationEmail(user.email, user.name, emailVerificationToken);
      res.json({ 
        message: "Verification email sent successfully. Please check your inbox." 
      });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      res.status(500).json({ 
        message: "Failed to send verification email. Please try again later." 
      });
    }
  } catch (error) {
    console.error("Resend verification email error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Legacy support - Keep customer endpoint for backward compatibility
export const signupCustomer = signupConsumer;
