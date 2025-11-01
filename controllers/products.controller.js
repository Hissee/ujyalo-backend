import { getDB } from "../db.js";
import { ObjectId } from "mongodb";

// ----------------- Add Product -----------------
export const addProduct = async (req, res) => {
  try {
    const db = getDB();
    const { name, description, category, price, quantity, images } = req.body;

    // Check if user is a farmer
    if (req.user.role !== "farmer") {
      return res.status(403).json({ message: "Only farmers can add products" });
    }

    // Input validation
    if (!name || !price || !quantity) {
      return res.status(400).json({ message: "Name, price, and quantity are required" });
    }
    if (price <= 0 || quantity <= 0) {
      return res.status(400).json({ message: "Price and quantity must be greater than zero" });
    }

    const result = await db.collection("products").insertOne({
      farmerId: new ObjectId(req.user.userId),
      farmerName: req.user.name, // Store farmer name for easy display
      name,
      description: description || "",
      category: category || "general",
      price: parseFloat(price),
      quantity: parseInt(quantity),
      images: images || [],
      status: "available",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
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
      .sort({ createdAt: -1 })
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

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await db.collection("products").findOne({
      _id: new ObjectId(id),
      status: "available"
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ----------------- Update Product -----------------
export const updateProduct = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const { name, description, category, price, quantity, images, status } = req.body;

    // Check if user is a farmer
    if (req.user.role !== "farmer") {
      return res.status(403).json({ message: "Only farmers can update products" });
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    // Check if product exists and belongs to the farmer
    const existingProduct = await db.collection("products").findOne({
      _id: new ObjectId(id),
      farmerId: new ObjectId(req.user.userId)
    });

    if (!existingProduct) {
      return res.status(404).json({ 
        message: "Product not found or you don't have permission to update it" 
      });
    }

    // Build update object with only provided fields
    const updateFields = { updatedAt: new Date() };
    if (name) updateFields.name = name;
    if (description !== undefined) updateFields.description = description;
    if (category) updateFields.category = category;
    if (price !== undefined) {
      if (price <= 0) return res.status(400).json({ message: "Price must be greater than zero" });
      updateFields.price = parseFloat(price);
    }
    if (quantity !== undefined) {
      if (quantity < 0) return res.status(400).json({ message: "Quantity cannot be negative" });
      updateFields.quantity = parseInt(quantity);
    }
    if (images) updateFields.images = images;
    if (status) updateFields.status = status;

    const result = await db.collection("products").updateOne(
      { 
        _id: new ObjectId(id),
        farmerId: new ObjectId(req.user.userId) // Ensure only owner can update
      },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ 
        message: "Product not found or you don't have permission to update it" 
      });
    }

    res.json({ 
      message: "Product updated successfully",
      productId: id
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ----------------- Delete Product -----------------
export const deleteProduct = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    // Check if user is a farmer
    if (req.user.role !== "farmer") {
      return res.status(403).json({ message: "Only farmers can delete products" });
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    // Check if product exists and belongs to the farmer
    const existingProduct = await db.collection("products").findOne({
      _id: new ObjectId(id),
      farmerId: new ObjectId(req.user.userId)
    });

    if (!existingProduct) {
      return res.status(404).json({ 
        message: "Product not found or you don't have permission to delete it" 
      });
    }

    // Soft delete by setting status to "deleted"
    const result = await db.collection("products").updateOne(
      { 
        _id: new ObjectId(id),
        farmerId: new ObjectId(req.user.userId)
      },
      { 
        $set: { 
          status: "deleted",
          updatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ 
        message: "Product not found or you don't have permission to delete it" 
      });
    }

    res.json({ 
      message: "Product deleted successfully",
      productId: id
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ----------------- Get Farmer's Products -----------------
export const getFarmerProducts = async (req, res) => {
  try {
    const db = getDB();
    
    // Check if user is a farmer
    if (req.user.role !== "farmer") {
      return res.status(403).json({ message: "Only farmers can view their products" });
    }

    const products = await db.collection("products")
      .find({ 
        farmerId: new ObjectId(req.user.userId),
        status: { $ne: "deleted" } // Exclude deleted products
      })
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ----------------- Get Products by Farmer ID -----------------
export const getProductsByFarmerId = async (req, res) => {
  try {
    const db = getDB();
    const { farmerId } = req.params;

    if (!ObjectId.isValid(farmerId)) {
      return res.status(400).json({ message: "Invalid farmer ID" });
    }

    const products = await db.collection("products")
      .find({ 
        farmerId: new ObjectId(farmerId),
        status: "available"
      })
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};