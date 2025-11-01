import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

let db;
let client;

export const connectDB = async () => {
  try {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db("ujyaloDB"); // ← your DB name
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
};

export const getDB = () => {
  if (!db) throw new Error("Database not connected");
  return db;
};

export const getClient = () => {
  if (!client) throw new Error("MongoClient not initialized");
  return client;
};
