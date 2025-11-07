import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

let db;
let client;

// Connection state
let isConnecting = false;
let connectionPromise = null;

export const connectDB = async () => {
  // If already connected, return
  if (db && client) {
    return db;
  }

  // If connection is in progress, wait for it
  if (isConnecting && connectionPromise) {
    return connectionPromise;
  }

  // Start new connection
  isConnecting = true;
  connectionPromise = (async () => {
    try {
      // Reuse existing client if available (for serverless connection reuse)
      if (!client) {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
          throw new Error("MONGODB_URI environment variable is not set");
        }
        
        client = new MongoClient(uri, {
          // Connection pool options for serverless
          maxPoolSize: 10,
          minPoolSize: 1,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        });
      }

      // Connect (MongoDB driver's connect() is idempotent - safe to call multiple times)
      await client.connect();

      db = client.db("ujyaloDB"); // ← make sure this matches your DB name
      console.log("✅ MongoDB connected");
      isConnecting = false;
      return db;
    } catch (err) {
      isConnecting = false;
      console.error("❌ MongoDB connection error:", err);
      throw err;
    }
  })();

  return connectionPromise;
};

export const getDB = () => {
  if (!db) {
    throw new Error("Database not connected. Call connectDB() first.");
  }
  return db;
};

// Graceful shutdown (useful for serverless)
export const closeDB = async () => {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log("✅ MongoDB connection closed");
  }
};
