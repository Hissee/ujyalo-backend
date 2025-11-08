import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

let db;

export const connectDB = async () => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db("ujyaloDB"); // ← make sure this matches your DB name
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
};

export const getDB = () => {
  if (!db) throw new Error("Database not connected");
  return db;
};
