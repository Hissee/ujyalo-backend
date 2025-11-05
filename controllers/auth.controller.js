// controllers/auth.controller.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDB } from "../db.js";
import { ObjectId } from "mongodb";
import { generateVerificationToken, generateOTP, sendVerificationEmail, sendPasswordResetEmail, sendOTPEmail, sendPasswordResetOTPEmail } from "../services/email.service.js";

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

// -------------------- Consumer Signup (Customer/Consumer) - Send OTP --------------------
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

    const userEmail = email.toLowerCase().trim();
    const userName = [firstName, middleName, lastName].filter(Boolean).join(" ").trim();

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date();
    otpExpires.setMinutes(otpExpires.getMinutes() + 10); // 10 minutes expiry

    // Generate verification token for link-based verification (alternative method)
    const emailVerificationToken = generateVerificationToken();
    const emailVerificationTokenExpires = new Date();
    emailVerificationTokenExpires.setHours(emailVerificationTokenExpires.getHours() + 24); // 24 hours expiry

    // Hash password for temporary storage
    const hashedPassword = await bcrypt.hash(password, 10);

    // Store signup data temporarily in pending_signups collection
    // Remove any existing pending signup for this email
    await db.collection("pending_signups").deleteOne({ email: userEmail });

    await db.collection("pending_signups").insertOne({
      firstName: firstName.trim(),
      middleName: middleName ? middleName.trim() : "",
      lastName: lastName ? lastName.trim() : "",
      name: userName,
      email: userEmail,
      phone: phone.trim(),
      province: province ? province.trim() : "",
      city: city ? city.trim() : "",
      street: street ? street.trim() : "",
      password: hashedPassword,
      role: "consumer",
      otp: otp,
      otpExpires: otpExpires,
      emailVerificationToken: emailVerificationToken,
      emailVerificationTokenExpires: emailVerificationTokenExpires,
      createdAt: new Date()
    });

    // Send OTP email (includes both OTP and verification link)
    try {
      await sendOTPEmail(userEmail, userName, otp, emailVerificationToken);
      res.json({
        message: "OTP sent to your email. Please verify to complete signup.",
        email: userEmail,
        requiresOTPVerification: true
      });
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
      // Clean up pending signup if email fails
      await db.collection("pending_signups").deleteOne({ email: userEmail });
      res.status(500).json({ 
        message: "Failed to send OTP email. Please try again." 
      });
    }
  } catch (error) {
    console.error("Consumer signup error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Farmer Signup - Send OTP --------------------
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

    const userEmail = email.toLowerCase().trim();
    const userName = [firstName, middleName, lastName].filter(Boolean).join(" ").trim();

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date();
    otpExpires.setMinutes(otpExpires.getMinutes() + 10); // 10 minutes expiry

    // Generate verification token for link-based verification (alternative method)
    const emailVerificationToken = generateVerificationToken();
    const emailVerificationTokenExpires = new Date();
    emailVerificationTokenExpires.setHours(emailVerificationTokenExpires.getHours() + 24); // 24 hours expiry

    // Hash password for temporary storage
    const hashedPassword = await bcrypt.hash(password, 10);

    // Store signup data temporarily in pending_signups collection
    // Remove any existing pending signup for this email
    await db.collection("pending_signups").deleteOne({ email: userEmail });

    await db.collection("pending_signups").insertOne({
      firstName: firstName.trim(),
      middleName: middleName ? middleName.trim() : "",
      lastName: lastName ? lastName.trim() : "",
      name: userName,
      email: userEmail,
      phone: phone.trim(),
      province: province ? province.trim() : "",
      city: city ? city.trim() : "",
      street: street ? street.trim() : "",
      password: hashedPassword,
      role: "farmer",
      otp: otp,
      otpExpires: otpExpires,
      emailVerificationToken: emailVerificationToken,
      emailVerificationTokenExpires: emailVerificationTokenExpires,
      createdAt: new Date()
    });

    // Send OTP email (includes both OTP and verification link)
    try {
      await sendOTPEmail(userEmail, userName, otp, emailVerificationToken);
      res.json({
        message: "OTP sent to your email. Please verify to complete signup.",
        email: userEmail,
        requiresOTPVerification: true
      });
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
      // Clean up pending signup if email fails
      await db.collection("pending_signups").deleteOne({ email: userEmail });
      res.status(500).json({ 
        message: "Failed to send OTP email. Please try again." 
      });
    }
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

    // Check if account is deactivated
    if (user.deactivated) {
      // Reactivate account on login
      await db.collection("users").updateOne(
        { _id: user._id },
        {
          $set: {
            deactivated: false,
            updatedAt: new Date()
          },
          $unset: {
            deactivatedAt: ""
          }
        }
      );
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

    const userEmail = email.toLowerCase().trim();

    // First, check if this is a pending signup (user clicked link during signup)
    const pendingSignup = await db.collection("pending_signups").findOne({ 
      email: userEmail,
      emailVerificationToken: token
    });

    if (pendingSignup) {
      // Check if token expired
      if (pendingSignup.emailVerificationTokenExpires && new Date() > new Date(pendingSignup.emailVerificationTokenExpires)) {
        await db.collection("pending_signups").deleteOne({ email: userEmail });
        return res.status(400).json({ message: "Verification token has expired. Please sign up again." });
      }

      // Token verified - Create user account
      // Since verification link was clicked, email is already verified
      const userName = [pendingSignup.firstName, pendingSignup.middleName, pendingSignup.lastName]
        .filter(Boolean).join(" ").trim();

      // Create user with email already verified
      const result = await db.collection("users").insertOne({
        firstName: pendingSignup.firstName,
        middleName: pendingSignup.middleName || "",
        lastName: pendingSignup.lastName || "",
        name: userName,
        email: userEmail,
        phone: pendingSignup.phone,
        role: pendingSignup.role,
        address: {
          province: pendingSignup.province || "",
          city: pendingSignup.city || "",
          street: pendingSignup.street || ""
        },
        password: pendingSignup.password,
        emailVerified: true, // Email verified via link
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Remove pending signup
      await db.collection("pending_signups").deleteOne({ email: userEmail });

      // Generate JWT token
      const jwtToken = jwt.sign(
        { userId: result.insertedId, role: pendingSignup.role, name: userName, email: userEmail },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.json({
        message: "Email verified successfully! Your account has been created. You can now log in.",
        verified: true,
        token: jwtToken,
        user: {
          userId: result.insertedId,
          role: pendingSignup.role,
          name: userName,
          email: userEmail,
          emailVerified: true
        }
      });
    }

    // If not a pending signup, check existing users (for resend verification scenarios)
    const user = await db.collection("users").findOne({ 
      email: userEmail,
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

// -------------------- Forgot Password (Request Password Reset OTP) --------------------
export const forgotPassword = async (req, res) => {
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

    const userEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await db.collection("users").findOne({ email: userEmail });

    // Don't reveal if email exists for security reasons
    // Always return success message to prevent email enumeration
    if (!user) {
      return res.json({ 
        message: "If an account with this email exists, a password reset OTP has been sent." 
      });
    }

    // Generate OTP for password reset
    const otp = generateOTP();
    const otpExpires = new Date();
    otpExpires.setMinutes(otpExpires.getMinutes() + 10); // 10 minutes expiry

    // Update user with reset OTP
    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          passwordResetOTP: otp,
          passwordResetOTPExpires: otpExpires,
          updatedAt: new Date()
        }
      }
    );

    // Send password reset OTP email
    try {
      await sendPasswordResetOTPEmail(user.email, user.name, otp);
      res.json({ 
        message: "If an account with this email exists, a password reset OTP has been sent to your email.",
        requiresOTPVerification: true,
        email: userEmail
      });
    } catch (emailError) {
      console.error("Failed to send password reset OTP email:", emailError);
      // Clean up OTP if email fails
      await db.collection("users").updateOne(
        { _id: user._id },
        {
          $unset: {
            passwordResetOTP: "",
            passwordResetOTPExpires: ""
          }
        }
      );
      res.status(500).json({ 
        message: "Failed to send password reset OTP. Please try again later." 
      });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Reset Password (With OTP) --------------------
export const resetPassword = async (req, res) => {
  try {
    const db = getDB();
    const { email, otp, newPassword } = req.body;

    // Validation
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP, and new password are required" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const userEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await db.collection("users").findOne({ 
      email: userEmail
    });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Check if OTP exists
    if (!user.passwordResetOTP) {
      return res.status(400).json({ message: "No password reset request found. Please request a new OTP." });
    }

    // Check if OTP expired
    if (user.passwordResetOTPExpires && new Date() > new Date(user.passwordResetOTPExpires)) {
      await db.collection("users").updateOne(
        { _id: user._id },
        {
          $unset: {
            passwordResetOTP: "",
            passwordResetOTPExpires: ""
          }
        }
      );
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    // Verify OTP
    if (user.passwordResetOTP !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and remove reset OTP
    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date()
        },
        $unset: {
          passwordResetOTP: "",
          passwordResetOTPExpires: ""
        }
      }
    );

    res.json({
      message: "Password reset successfully. You can now log in with your new password."
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Verify OTP and Complete Signup --------------------
export const verifyOTP = async (req, res) => {
  try {
    const db = getDB();
    const { email, otp } = req.body;

    // Validation
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const userEmail = email.toLowerCase().trim();

    // Find pending signup
    const pendingSignup = await db.collection("pending_signups").findOne({ 
      email: userEmail 
    });

    if (!pendingSignup) {
      return res.status(400).json({ message: "No pending signup found. Please sign up again." });
    }

    // Check if OTP expired
    if (new Date() > new Date(pendingSignup.otpExpires)) {
      await db.collection("pending_signups").deleteOne({ email: userEmail });
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    // Verify OTP
    if (pendingSignup.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // OTP verified - Create user account
    // Since OTP was sent to email, email is already verified
    const userName = [pendingSignup.firstName, pendingSignup.middleName, pendingSignup.lastName]
      .filter(Boolean).join(" ").trim();

    // Create user with email already verified (OTP verification = email verification)
    const result = await db.collection("users").insertOne({
      firstName: pendingSignup.firstName,
      middleName: pendingSignup.middleName || "",
      lastName: pendingSignup.lastName || "",
      name: userName,
      email: userEmail,
      phone: pendingSignup.phone,
      role: pendingSignup.role,
      address: {
        province: pendingSignup.province || "",
        city: pendingSignup.city || "",
        street: pendingSignup.street || ""
      },
      password: pendingSignup.password,
      emailVerified: true, // Email verified via OTP
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Remove pending signup
    await db.collection("pending_signups").deleteOne({ email: userEmail });

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.insertedId, role: pendingSignup.role, name: userName, email: userEmail },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Signup successful! Your email has been verified via OTP.",
      token,
      user: {
        userId: result.insertedId,
        role: pendingSignup.role,
        name: userName,
        email: userEmail,
        emailVerified: true
      }
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Resend Password Reset OTP --------------------
export const resendPasswordResetOTP = async (req, res) => {
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

    const userEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await db.collection("users").findOne({ email: userEmail });

    if (!user) {
      // Don't reveal if email exists
      return res.json({ 
        message: "If an account with this email exists, a password reset OTP has been sent." 
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpires = new Date();
    otpExpires.setMinutes(otpExpires.getMinutes() + 10); // 10 minutes expiry

    // Update user with new reset OTP
    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          passwordResetOTP: otp,
          passwordResetOTPExpires: otpExpires,
          updatedAt: new Date()
        }
      }
    );

    // Send password reset OTP email
    try {
      await sendPasswordResetOTPEmail(user.email, user.name, otp);
      res.json({ 
        message: "Password reset OTP resent to your email. Please check your inbox.",
        email: userEmail
      });
    } catch (emailError) {
      console.error("Failed to send password reset OTP email:", emailError);
      res.status(500).json({ 
        message: "Failed to send password reset OTP. Please try again later." 
      });
    }
  } catch (error) {
    console.error("Resend password reset OTP error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Resend OTP --------------------
export const resendOTP = async (req, res) => {
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

    const userEmail = email.toLowerCase().trim();

    // Find pending signup
    const pendingSignup = await db.collection("pending_signups").findOne({ 
      email: userEmail 
    });

    if (!pendingSignup) {
      return res.status(400).json({ message: "No pending signup found. Please sign up again." });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpires = new Date();
    otpExpires.setMinutes(otpExpires.getMinutes() + 10); // 10 minutes expiry

    // Generate or reuse verification token
    let emailVerificationToken = pendingSignup.emailVerificationToken;
    let emailVerificationTokenExpires = pendingSignup.emailVerificationTokenExpires;
    
    // If token doesn't exist or is expired, generate a new one
    if (!emailVerificationToken || (emailVerificationTokenExpires && new Date() > new Date(emailVerificationTokenExpires))) {
      emailVerificationToken = generateVerificationToken();
      emailVerificationTokenExpires = new Date();
      emailVerificationTokenExpires.setHours(emailVerificationTokenExpires.getHours() + 24); // 24 hours expiry
    }

    // Update pending signup with new OTP and verification token
    await db.collection("pending_signups").updateOne(
      { email: userEmail },
      {
        $set: {
          otp: otp,
          otpExpires: otpExpires,
          emailVerificationToken: emailVerificationToken,
          emailVerificationTokenExpires: emailVerificationTokenExpires,
          updatedAt: new Date()
        }
      }
    );

    // Send OTP email (includes both OTP and verification link)
    try {
      await sendOTPEmail(userEmail, pendingSignup.name, otp, emailVerificationToken);
      res.json({
        message: "OTP resent to your email. Please check your inbox.",
        email: userEmail
      });
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
      res.status(500).json({ 
        message: "Failed to send OTP email. Please try again." 
      });
    }
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Deactivate Account --------------------
export const deactivateAccount = async (req, res) => {
  try {
    const db = getDB();
    const { password } = req.body;
    const userId = req.user.userId;

    // Validation
    if (!password) {
      return res.status(400).json({ message: "Password is required to deactivate account" });
    }

    // Get user
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    // Check if already deactivated
    if (user.deactivated) {
      return res.status(400).json({ message: "Account is already deactivated" });
    }

    // Deactivate account (soft delete - mark as deactivated)
    await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          deactivated: true,
          deactivatedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    res.json({
      message: "Account deactivated successfully. You can reactivate by logging in again."
    });
  } catch (error) {
    console.error("Deactivate account error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Delete Account --------------------
export const deleteAccount = async (req, res) => {
  try {
    const db = getDB();
    const { password } = req.body;
    const userId = req.user.userId;

    // Validation
    if (!password) {
      return res.status(400).json({ message: "Password is required to delete account" });
    }

    // Get user
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    // Check for active orders (for farmers)
    if (user.role === 'farmer') {
      // First, get all products owned by this farmer
      // Handle both string and ObjectId farmerId formats
      const farmerProducts = await db.collection("products").find({ 
        $or: [
          { farmerId: userId },
          { farmerId: new ObjectId(userId) }
        ]
      }).toArray();
      
      if (farmerProducts.length > 0) {
        const productIds = farmerProducts.map(p => p._id);
        
        // Check if any active orders contain these products
        const activeOrders = await db.collection("orders").findOne({
          "products.productId": { $in: productIds },
          status: { $in: ["pending", "confirmed", "processing", "shipped"] }
        });

        if (activeOrders) {
          return res.status(400).json({ 
            message: "Cannot delete account with active orders. Please complete or cancel all orders first." 
          });
        }
      }
    }

    // Check for pending orders (for consumers)
    if (user.role === 'consumer') {
      const pendingOrders = await db.collection("orders").findOne({
        $or: [
          { customerId: userId },
          { customerId: new ObjectId(userId) }
        ],
        status: { $in: ["pending", "confirmed", "processing", "shipped"] }
      });

      if (pendingOrders) {
        return res.status(400).json({ 
          message: "Cannot delete account with active orders. Please complete or cancel all orders first." 
        });
      }
    }

    // Delete account (hard delete)
    await db.collection("users").deleteOne({ _id: new ObjectId(userId) });

    // Also delete any pending signups for this email
    await db.collection("pending_signups").deleteOne({ email: user.email });

    res.json({
      message: "Account deleted successfully"
    });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Legacy support - Keep customer endpoint for backward compatibility
export const signupCustomer = signupConsumer;
