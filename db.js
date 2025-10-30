// db.js
import { MongoClient, ObjectId as MongoObjectId } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

let db;

export const connectDB = async () => {
  if (db) return db;
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db("ujyaloDB");
    client.db();
    console.log("✅ MongoDB connected successfully");
    return db;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export const getDB = () => {
  if (!db) throw new Error("Database not connected");
  return db;
};

// Export ObjectId for server.js
export const ObjectId = MongoObjectId;
