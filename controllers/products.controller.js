// controllers/products.controller.js
import Product from "../models/product.model.js";

// Add new product (Farmer only)
export const addProduct = async (req, res) => {
  try {
    const { name, description, category, price, quantity, images } = req.body;

    const newProduct = new Product({
      name,
      description,
      category,
      price,
      quantity,
      images,
      farmerId: req.user.id, // from token
    });

    await newProduct.save();
    res.status(201).json({ success: true, product: newProduct });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all products
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get product by ID
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
