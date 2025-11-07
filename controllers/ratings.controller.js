// controllers/ratings.controller.js
import { getDB } from "../db.js";
import { ObjectId } from "mongodb";

// ----------------- Add/Update Rating -----------------
export const addOrUpdateRating = async (req, res) => {
  try {
    const db = getDB();
    const { productId, rating } = req.body;
    const userId = req.user.userId;

    // Validation
    if (!productId || rating === undefined) {
      return res.status(400).json({ message: "Product ID and rating are required" });
    }

    if (!ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    // Validate rating (1-5)
    const ratingNum = parseInt(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    // Check if product exists
    const product = await db.collection("products").findOne({ _id: new ObjectId(productId) });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if user has already rated this product
    const existingRating = await db.collection("ratings").findOne({
      productId: new ObjectId(productId),
      userId: new ObjectId(userId)
    });

    // Get user info
    const user = await db.collection("users").findOne(
      { _id: new ObjectId(userId) },
      { projection: { name: 1, email: 1 } }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous';

    if (existingRating) {
      // Update existing rating
      await db.collection("ratings").updateOne(
        { _id: existingRating._id },
        {
          $set: {
            rating: ratingNum,
            updatedAt: new Date()
          }
        }
      );

      // Recalculate average rating for product
      await updateProductAverageRating(productId);

      res.json({
        message: "Rating updated successfully",
        rating: {
          _id: existingRating._id.toString(),
          productId: productId,
          userId: userId,
          userName: userName,
          rating: ratingNum,
          createdAt: existingRating.createdAt,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new rating
      const ratingData = {
        productId: new ObjectId(productId),
        userId: new ObjectId(userId),
        userName: userName,
        rating: ratingNum,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await db.collection("ratings").insertOne(ratingData);

      // Recalculate average rating for product
      await updateProductAverageRating(productId);

      res.status(201).json({
        message: "Rating added successfully",
        rating: {
          _id: result.insertedId.toString(),
          productId: productId,
          userId: userId,
          userName: userName,
          rating: ratingNum,
          createdAt: ratingData.createdAt,
          updatedAt: ratingData.updatedAt
        }
      });
    }
  } catch (error) {
    console.error("Add/Update rating error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ----------------- Get Ratings by Product ID -----------------
export const getRatingsByProduct = async (req, res) => {
  try {
    const db = getDB();
    const { productId } = req.params;

    if (!ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    // Get all ratings for the product
    const ratings = await db.collection("ratings")
      .find({ productId: new ObjectId(productId) })
      .sort({ createdAt: -1 })
      .toArray();

    // Calculate statistics
    const totalRatings = ratings.length;
    const averageRating = totalRatings > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
      : 0;

    // Count ratings by star
    const ratingDistribution = {
      5: ratings.filter(r => r.rating === 5).length,
      4: ratings.filter(r => r.rating === 4).length,
      3: ratings.filter(r => r.rating === 3).length,
      2: ratings.filter(r => r.rating === 2).length,
      1: ratings.filter(r => r.rating === 1).length
    };

    // Remove sensitive information
    const sanitizedRatings = ratings.map(rating => ({
      _id: rating._id,
      productId: rating.productId.toString(),
      userId: rating.userId.toString(),
      userName: rating.userName,
      rating: rating.rating,
      createdAt: rating.createdAt,
      updatedAt: rating.updatedAt
    }));

    res.json({
      success: true,
      data: sanitizedRatings,
      statistics: {
        totalRatings,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        ratingDistribution
      }
    });
  } catch (error) {
    console.error("Get ratings error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ----------------- Get User Rating for Product -----------------
export const getUserRating = async (req, res) => {
  try {
    const db = getDB();
    const { productId } = req.params;
    const userId = req.user.userId;

    if (!ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const rating = await db.collection("ratings").findOne({
      productId: new ObjectId(productId),
      userId: new ObjectId(userId)
    });

    if (!rating) {
      return res.json({
        success: true,
        data: null
      });
    }

    res.json({
      success: true,
      data: {
        _id: rating._id,
        productId: rating.productId.toString(),
        userId: rating.userId.toString(),
        userName: rating.userName,
        rating: rating.rating,
        createdAt: rating.createdAt,
        updatedAt: rating.updatedAt
      }
    });
  } catch (error) {
    console.error("Get user rating error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ----------------- Delete Rating -----------------
export const deleteRating = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const userId = req.user.userId;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid rating ID" });
    }

    // Check if rating exists
    const rating = await db.collection("ratings").findOne({ _id: new ObjectId(id) });
    
    if (!rating) {
      return res.status(404).json({ message: "Rating not found" });
    }

    // Check permission: user can delete their own rating
    if (rating.userId.toString() !== userId) {
      return res.status(403).json({ message: "You don't have permission to delete this rating" });
    }

    const productId = rating.productId.toString();

    // Delete rating
    await db.collection("ratings").deleteOne({ _id: new ObjectId(id) });

    // Recalculate average rating for product
    await updateProductAverageRating(productId);

    res.json({
      message: "Rating deleted successfully"
    });
  } catch (error) {
    console.error("Delete rating error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Helper function to update product average rating
async function updateProductAverageRating(productId) {
  try {
    const db = getDB();
    const ratings = await db.collection("ratings")
      .find({ productId: new ObjectId(productId) })
      .toArray();

    const totalRatings = ratings.length;
    const averageRating = totalRatings > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
      : 0;

    // Update product with average rating
    await db.collection("products").updateOne(
      { _id: new ObjectId(productId) },
      {
        $set: {
          averageRating: Math.round(averageRating * 10) / 10,
          totalRatings: totalRatings,
          updatedAt: new Date()
        }
      }
    );
  } catch (error) {
    console.error("Error updating product average rating:", error);
    // Don't throw error, just log it
  }
}

