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

// ----------------- Update Product -----------------
export const updateProduct = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const { name, description, category, price, quantity, images, harvestDate, organic } = req.body;
    const farmerId = req.user.userId;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    // Check if product exists and belongs to this farmer
    const product = await db.collection("products").findOne({ _id: new ObjectId(id) });
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Verify the product belongs to this farmer
    if (product.farmerId.toString() !== farmerId) {
      return res.status(403).json({ message: "You don't have permission to update this product" });
    }

    // Input validation
    if (!name || !price || !quantity) {
      return res.status(400).json({ message: "Name, price, and quantity are required" });
    }
    if (price <= 0 || quantity <= 0) {
      return res.status(400).json({ message: "Price and quantity must be greater than zero" });
    }

    const updateData = {
      name,
      description: description || "",
      category: category || "general",
      price,
      quantity,
      images: images || [],
      updatedAt: new Date(),
    };

    // Add optional fields if provided
    if (harvestDate) {
      updateData.harvestDate = harvestDate;
    }
    if (organic !== undefined) {
      updateData.organic = organic;
    }

    // Update status based on quantity
    if (quantity <= 0) {
      updateData.status = "sold out";
    } else if (product.status === "sold out" && quantity > 0) {
      updateData.status = "available";
    }

    await db.collection("products").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    res.json({
      message: "Product updated successfully",
      productId: id
    });

  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ----------------- Delete Product -----------------
export const deleteProduct = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const farmerId = req.user.userId;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    // Check if product exists and belongs to this farmer
    const product = await db.collection("products").findOne({ _id: new ObjectId(id) });
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Verify the product belongs to this farmer
    if (product.farmerId.toString() !== farmerId) {
      return res.status(403).json({ message: "You don't have permission to delete this product" });
    }

    // Check if product has active orders
    const activeOrders = await db.collection("orders").findOne({
      "products.productId": new ObjectId(id),
      status: { $in: ["pending", "confirmed", "processing", "shipped"] }
    });

    if (activeOrders) {
      return res.status(400).json({ 
        message: "Cannot delete product with active orders. Please cancel or complete orders first." 
      });
    }

    // Delete the product
    await db.collection("products").deleteOne({ _id: new ObjectId(id) });

    res.json({
      message: "Product deleted successfully",
      productId: id
    });

  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};