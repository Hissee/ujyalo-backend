const { MongoClient } = require('mongodb');

// Replace with your MongoDB cluster connection string
const uri = "mongodb+srv://maharjanhissee_db_user:y9qUBjTySaaQINon@ujyalokhetcluster.ebzkrq3.mongodb.net/";

const client = new MongoClient(uri);

async function connectDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");
    return client;
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}

// Export so other files can use it
module.exports = { connectDB, client };
