import { getDB } from "../db.js";
import { ObjectId } from "mongodb";


// ----------------- Add Product -----------------
export const addProduct = async (req, res) => {
  try {
    const db = getDB();
    const { name, description, category, price, quantity, images, harvestDate, organic } = req.body;

    // Input validation
    if (!name || !price || !quantity) {
      return res.status(400).json({ message: "Name, price, and quantity are required" });
    }
    if (price <= 0 || quantity <= 0) {
      return res.status(400).json({ message: "Price and quantity must be greater than zero" });
    }

    const productData = {
      farmerId: req.user.userId, // updated to match JWT payload
      name,
      description: description || "",
      category: category || "general",
      price,
      quantity,
      images: images || [],
      status: "available",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add optional fields if provided
    if (harvestDate) {
      productData.harvestDate = harvestDate;
    }
    if (organic !== undefined) {
      productData.organic = organic;
    }

    const result = await db.collection("products").insertOne(productData);
    
      console.log("Product inserted:", result.insertedId);
    

    res.status(201).json({
      message: "Product added successfully",
      productId: result.insertedId,
      farmerId: req.user.userId
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ----------------- Get All Products -----------------
export const getAllProducts = async (req, res) => {
  try {
    const db = getDB();
    const products = await db.collection("products")
      .find({ status: "available" })
      .toArray();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ----------------- Get Product by ID -----------------
export const getProductById = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    console.log('Fetching product with ID:', id);

    if (!ObjectId.isValid(id)) {
      console.log('Invalid product ID format:', id);
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await db.collection("products").findOne({
      _id: new ObjectId(id),
      status: "available"
    });

    if (!product) {
      console.log('Product not found or not available:', id);
      // Check if product exists but has different status
      const productAnyStatus = await db.collection("products").findOne({
        _id: new ObjectId(id)
      });
      if (productAnyStatus) {
        console.log('Product exists but status is:', productAnyStatus.status);
      }
      return res.status(404).json({ message: "Product not found or not available" });
    }

    console.log('Product found:', product.name);
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
