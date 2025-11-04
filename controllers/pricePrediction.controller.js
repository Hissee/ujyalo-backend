// controllers/pricePrediction.controller.js
import { getPriceSuggestion, getCategoryStats } from "../services/pricePrediction.service.js";

/**
 * Get price suggestion for a product
 * POST /api/products/suggest-price
 */
export const suggestPrice = async (req, res) => {
  try {
    const { category, quantity, organic, location } = req.body;

    // Validation
    if (!category) {
      return res.status(400).json({ 
        message: "Category is required",
        success: false 
      });
    }

    const suggestion = await getPriceSuggestion({
      category,
      quantity: quantity || 1,
      organic: organic || false,
      location: location || null
    });

    res.json(suggestion);

  } catch (error) {
    console.error("Price suggestion error:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message,
      success: false 
    });
  }
};

/**
 * Get market statistics for a category
 * GET /api/products/category-stats/:category
 */
export const getCategoryMarketStats = async (req, res) => {
  try {
    const { category } = req.params;

    if (!category) {
      return res.status(400).json({ 
        message: "Category is required",
        success: false 
      });
    }

    const stats = await getCategoryStats(category);

    if (!stats) {
      return res.status(404).json({ 
        message: "No statistics available for this category",
        success: false 
      });
    }

    res.json({
      success: true,
      ...stats
    });

  } catch (error) {
    console.error("Category stats error:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message,
      success: false 
    });
  }
};

