import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { connectDB, getDB } from "../db.js";
import { ObjectId } from "mongodb";

// Routes
import authRoutes from "../routes/auth.routes.js";
import productsRoutes from "../routes/products.routes.js";
import ordersRoutes from "../routes/orders.routes.js";
import farmerRoutes from "../routes/farmer.routes.js";
import notificationsRoutes from "../routes/notifications.routes.js";
import adminRoutes from "../routes/admin.routes.js";
import uploadRoutes from "../routes/upload.routes.js";
import locationRoutes from "../routes/location.routes.js";
import commentsRoutes from "../routes/comments.routes.js";
import { initializeAdminUser } from "../utils/initAdmin.js";
import { initializePricePrediction } from "../services/pricePrediction.service.js";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";

const app = express();

// CORS configuration - must be before other middleware
// Allow all origins for now (can be restricted later)
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'https://ujyalo-khet.vercel.app',
      'https://ujyalo-khet-git-main-hissee.vercel.app',
      'https://ujyalo-khet-*.vercel.app', // Vercel preview deployments
      'http://localhost:4200',
      'http://localhost:3000'
    ];
    
    // Check if origin matches any allowed pattern
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed.includes('*')) {
        const pattern = allowed.replace('*', '.*');
        return new RegExp(pattern).test(origin);
      }
      return allowed === origin;
    });
    
    if (isAllowed || !origin) {
      callback(null, true);
    } else {
      // For debugging - log the origin
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow all for now to debug
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'Content-Type']
}));

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

app.use(express.json());

// Add request logging for debugging (before routes)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Origin:', req.headers.origin);
  next();
});

// Initialize database connection (lazy initialization for serverless)
let dbInitialized = false;
let initPromise = null;

const ensureDBInitialized = async () => {
  if (dbInitialized) return;
  
  if (!initPromise) {
    initPromise = (async () => {
      try {
        await connectDB();
        // Initialize admin user (only once, idempotent)
        await initializeAdminUser();
        // Initialize price prediction (lazy, can be async)
        initializePricePrediction().catch(err => {
          console.error("Price prediction initialization error (non-critical):", err);
        });
        dbInitialized = true;
      } catch (error) {
        console.error("Database initialization error:", error);
        throw error;
      }
    })();
  }
  
  return initPromise;
};

// Middleware to ensure DB is initialized before handling requests
app.use(async (req, res, next) => {
  try {
    await ensureDBInitialized();
    next();
  } catch (error) {
    console.error("Database initialization error:", error);
    res.status(500).json({ 
      message: "Database connection failed", 
      error: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
    });
  }
});

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
    console.error("Signup error:", error);
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

// Health check endpoint (works without DB)
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "unknown",
    hasMongoUri: !!process.env.MONGODB_URI
  });
});

// Simple test endpoint (no DB required)
app.get("/test", (req, res) => {
  res.json({ 
    message: "Serverless function is working!",
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "UjyaloKhet Backend API", 
    status: "running",
    timestamp: new Date().toISOString() 
  });
});

// Error handling middleware (must be after all routes)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.path
  });
});

// Export as serverless function for Vercel
export default app;

