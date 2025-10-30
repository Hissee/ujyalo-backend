const { MongoClient } = require('mongodb');
require('dotenv').config();

async function main() {
  const uri = process.env.MONGODB_URI; // Your Atlas URI
  const client = new MongoClient(uri);

  try {
    // Connect to the client
    await client.connect();
    console.log('MongoDB connected successfully');

    // Get database instance
    const database = client.db("UjyaloKhetDB");
    const productsCollection = database.collection("products");

    // Example: find all products
    const products = await productsCollection.find({}).toArray();
    console.log(products);

  } catch (err) {
    console.error(err);
  } finally {
    await client.close(); // close connection
  }
}

main().catch(console.error);
