// services/pricePrediction.service.js
import { getDB } from "../db.js";

/**
 * Price Prediction Service using Regression Analysis
 * 
 * This service uses machine learning to predict appropriate product prices
 * based on historical data, category, quantity, organic status, and seasonality.
 */

// Category price multipliers (based on market value)
const CATEGORY_MULTIPLIERS = {
  'fruits': 1.2,
  'vegetables': 1.0,
  'grains': 0.8,
  'dairy': 1.3,
  'herbs': 1.5,
  'spices': 2.0,
  'other': 1.0
};

// Cache for trained models
let modelCache = {
  lastTraining: null,
  models: {},
  categoryAverages: {}
};

/**
 * Encode category to numeric value
 */
const encodeCategory = (category) => {
  const categories = ['fruits', 'vegetables', 'grains', 'dairy', 'herbs', 'spices', 'other'];
  return categories.indexOf(category?.toLowerCase() || 'other');
};

/**
 * Get seasonality factor based on current month
 */
const getSeasonalityFactor = () => {
  const month = new Date().getMonth() + 1; // 1-12
  // Spring (Mar-May): 1.0, Summer (Jun-Aug): 1.1, Fall (Sep-Nov): 1.05, Winter (Dec-Feb): 0.95
  if (month >= 3 && month <= 5) return 1.0;  // Spring
  if (month >= 6 && month <= 8) return 1.1;  // Summer
  if (month >= 9 && month <= 11) return 1.05; // Fall
  return 0.95; // Winter
};

/**
 * Prepare training data from products
 */
const prepareTrainingData = (products) => {
  const trainingData = {
    X: [], // Features: [category_encoded, quantity, organic, month]
    y: []  // Prices
  };

  products.forEach(product => {
    if (!product.price || !product.quantity || product.price <= 0 || product.quantity <= 0) {
      return; // Skip invalid data
    }

    const categoryEncoded = encodeCategory(product.category);
    const organic = product.organic ? 1 : 0;
    const month = product.createdAt ? new Date(product.createdAt).getMonth() + 1 : new Date().getMonth() + 1;
    
    // Features: [category, quantity, organic, month]
    trainingData.X.push([categoryEncoded, product.quantity, organic, month]);
    trainingData.y.push(product.price);
  });

  return trainingData;
};

/**
 * Train regression models for each category
 */
const trainCategoryModels = async () => {
  try {
    const db = getDB();
    
    // Fetch all products with valid prices
    const products = await db.collection("products")
      .find({ 
        price: { $gt: 0 },
        quantity: { $gt: 0 },
        status: { $ne: "sold out" }
      })
      .toArray();

    if (products.length < 10) {
      console.log("⚠️  Insufficient data for training. Using default pricing.");
      return null;
    }

    // Calculate category averages
    const categoryStats = {};
    products.forEach(product => {
      const cat = product.category?.toLowerCase() || 'other';
      if (!categoryStats[cat]) {
        categoryStats[cat] = { sum: 0, count: 0, prices: [] };
      }
      categoryStats[cat].sum += product.price;
      categoryStats[cat].count += 1;
      categoryStats[cat].prices.push(product.price);
    });

    // Calculate averages and standard deviations
    Object.keys(categoryStats).forEach(cat => {
      const stats = categoryStats[cat];
      stats.average = stats.sum / stats.count;
      
      // Calculate standard deviation
      const mean = stats.average;
      const variance = stats.prices.reduce((acc, price) => {
        return acc + Math.pow(price - mean, 2);
      }, 0) / stats.prices.length;
      stats.stdDev = Math.sqrt(variance);
    });

    modelCache.categoryAverages = categoryStats;
    modelCache.lastTraining = new Date();
    
    console.log("✅ Price prediction models trained successfully");
    return categoryStats;

  } catch (error) {
    console.error("❌ Error training models:", error);
    return null;
  }
};

/**
 * Predict price using multiple methods
 */
const predictPrice = (category, quantity, organic = false, location = null) => {
  const cat = category?.toLowerCase() || 'other';
  const categoryStats = modelCache.categoryAverages[cat];
  
  if (!categoryStats || categoryStats.count < 3) {
    // Fallback to default pricing if insufficient data
    return predictPriceFallback(category, quantity, organic);
  }

  // Method 1: Use category average as base
  let basePrice = categoryStats.average;
  
  // Method 2: Adjust for quantity (economies of scale)
  const quantityFactor = Math.max(0.7, Math.min(1.2, 1 - (quantity / 1000) * 0.1));
  
  // Method 3: Adjust for organic status
  const organicFactor = organic ? 1.3 : 1.0;
  
  // Method 4: Seasonality
  const seasonalityFactor = getSeasonalityFactor();
  
  // Method 5: Category multiplier
  const categoryMultiplier = CATEGORY_MULTIPLIERS[cat] || 1.0;
  
  // Calculate predicted price
  const predictedPrice = basePrice * quantityFactor * organicFactor * seasonalityFactor * categoryMultiplier;
  
  // Calculate confidence interval (±15% for standard deviation)
  const stdDev = categoryStats.stdDev || predictedPrice * 0.15;
  const minPrice = Math.max(0.1, predictedPrice - stdDev * 0.5);
  const maxPrice = predictedPrice + stdDev * 0.5;
  
  return {
    suggestedPrice: Math.round(predictedPrice * 100) / 100,
    minPrice: Math.round(minPrice * 100) / 100,
    maxPrice: Math.round(maxPrice * 100) / 100,
    confidence: categoryStats.count >= 10 ? 'high' : categoryStats.count >= 5 ? 'medium' : 'low',
    basedOn: `${categoryStats.count} similar products`,
    factors: {
      categoryAverage: Math.round(basePrice * 100) / 100,
      quantityFactor: Math.round(quantityFactor * 100) / 100,
      organicFactor: organicFactor,
      seasonalityFactor: seasonalityFactor,
      categoryMultiplier: categoryMultiplier
    }
  };
};

/**
 * Fallback pricing when insufficient data
 */
const predictPriceFallback = (category, quantity, organic) => {
  const cat = category?.toLowerCase() || 'other';
  const basePrices = {
    'fruits': 150,
    'vegetables': 120,
    'grains': 80,
    'dairy': 200,
    'herbs': 180,
    'spices': 300,
    'other': 100
  };

  const basePrice = basePrices[cat] || 100;
  const organicFactor = organic ? 1.3 : 1.0;
  const quantityFactor = Math.max(0.8, Math.min(1.1, 1 - (quantity / 2000) * 0.1));
  const predictedPrice = basePrice * quantityFactor * organicFactor;

  return {
    suggestedPrice: Math.round(predictedPrice * 100) / 100,
    minPrice: Math.round(predictedPrice * 0.85 * 100) / 100,
    maxPrice: Math.round(predictedPrice * 1.15 * 100) / 100,
    confidence: 'low',
    basedOn: 'market averages',
    factors: {
      categoryAverage: basePrice,
      quantityFactor: Math.round(quantityFactor * 100) / 100,
      organicFactor: organicFactor,
      seasonalityFactor: 1.0,
      categoryMultiplier: 1.0
    }
  };
};

/**
 * Get price suggestion for a product
 */
export const getPriceSuggestion = async (productData) => {
  try {
    const { category, quantity, organic, location } = productData;
    
    // Retrain models if cache is old (> 1 hour) or empty
    const shouldRetrain = !modelCache.lastTraining || 
      (Date.now() - new Date(modelCache.lastTraining).getTime()) > 3600000; // 1 hour
    
    if (shouldRetrain || Object.keys(modelCache.categoryAverages).length === 0) {
      await trainCategoryModels();
    }

    // Get prediction
    const prediction = predictPrice(category, quantity || 1, organic || false, location);
    
    return {
      success: true,
      ...prediction
    };

  } catch (error) {
    console.error("Error getting price suggestion:", error);
    return {
      success: false,
      suggestedPrice: 100,
      minPrice: 85,
      maxPrice: 115,
      confidence: 'low',
      basedOn: 'default pricing',
      error: error.message
    };
  }
};

/**
 * Initialize and train models on startup
 */
export const initializePricePrediction = async () => {
  console.log("🔄 Initializing price prediction models...");
  await trainCategoryModels();
};

/**
 * Get market statistics for a category
 */
export const getCategoryStats = async (category) => {
  try {
    const shouldRetrain = !modelCache.lastTraining || 
      (Date.now() - new Date(modelCache.lastTraining).getTime()) > 3600000;
    
    if (shouldRetrain || Object.keys(modelCache.categoryAverages).length === 0) {
      await trainCategoryModels();
    }

    const cat = category?.toLowerCase() || 'other';
    const stats = modelCache.categoryAverages[cat];

    if (!stats) {
      return {
        category,
        averagePrice: null,
        productCount: 0,
        priceRange: null,
        message: 'No data available for this category'
      };
    }

    return {
      category,
      averagePrice: Math.round(stats.average * 100) / 100,
      productCount: stats.count,
      priceRange: {
        min: Math.round(Math.min(...stats.prices) * 100) / 100,
        max: Math.round(Math.max(...stats.prices) * 100) / 100
      },
      standardDeviation: Math.round(stats.stdDev * 100) / 100
    };

  } catch (error) {
    console.error("Error getting category stats:", error);
    return null;
  }
};

