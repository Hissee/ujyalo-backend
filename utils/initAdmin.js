// utils/initAdmin.js
import { getDB } from "../db.js";
import bcrypt from "bcryptjs";

/**
 * Initialize default admin user if it doesn't exist
 */
export const initializeAdminUser = async () => {
  try {
    const db = getDB();
    
    // Default admin credentials
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@ujyalokhet.com";
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123";
    const ADMIN_NAME = process.env.ADMIN_NAME || "System Administrator";

    // Check if admin user already exists
    const existingAdmin = await db.collection("users").findOne({ 
      email: ADMIN_EMAIL.toLowerCase().trim(),
      role: "admin"
    });

    if (existingAdmin) {
      console.log("✅ Admin user already exists");
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    // Create admin user
    const adminUser = {
      firstName: "System",
      middleName: "",
      lastName: "Administrator",
      name: ADMIN_NAME,
      email: ADMIN_EMAIL.toLowerCase().trim(),
      phone: "0000000000",
      role: "admin",
      password: hashedPassword,
      emailVerified: true, // Admin email is pre-verified
      deactivated: false,
      address: {
        province: "",
        city: "",
        street: ""
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection("users").insertOne(adminUser);

    console.log("✅ Default admin user created successfully");
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log("   ⚠️  Please change the default password after first login!");
    
  } catch (error) {
    console.error("❌ Error initializing admin user:", error);
  }
};

