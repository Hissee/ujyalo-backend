// controllers/comments.controller.js
import { getDB } from "../db.js";
import { ObjectId } from "mongodb";
import { createNotification } from "./notifications.controller.js";

// ----------------- Add Comment -----------------
export const addComment = async (req, res) => {
  try {
    const db = getDB();
    const { productId, text, replyTo } = req.body; // replyTo is optional - ID of parent comment
    const userId = req.user.userId;

    // Validation
    if (!productId || !text) {
      return res.status(400).json({ message: "Product ID and comment text are required" });
    }

    if (!ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    // Trim and validate comment text
    const trimmedText = text.trim();
    if (trimmedText.length === 0) {
      return res.status(400).json({ message: "Comment text cannot be empty" });
    }

    if (trimmedText.length > 1000) {
      return res.status(400).json({ message: "Comment text cannot exceed 1000 characters" });
    }

    // Check if product exists
    const product = await db.collection("products").findOne({ _id: new ObjectId(productId) });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // If this is a reply, validate the parent comment exists
    let parentComment = null;
    if (replyTo) {
      if (!ObjectId.isValid(replyTo)) {
        return res.status(400).json({ message: "Invalid reply comment ID" });
      }
      parentComment = await db.collection("comments").findOne({ _id: new ObjectId(replyTo) });
      if (!parentComment) {
        return res.status(404).json({ message: "Parent comment not found" });
      }
      // Ensure the parent comment belongs to the same product
      if (parentComment.productId.toString() !== productId) {
        return res.status(400).json({ message: "Parent comment does not belong to this product" });
      }
    }

    // Get user info
    const user = await db.collection("users").findOne(
      { _id: new ObjectId(userId) },
      { projection: { name: 1, email: 1, role: 1 } }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create comment
    const comment = {
      productId: new ObjectId(productId),
      userId: new ObjectId(userId),
      userName: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous',
      userEmail: user.email,
      text: trimmedText,
      replyTo: replyTo ? new ObjectId(replyTo) : null, // If this is a reply, store parent comment ID
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection("comments").insertOne(comment);

    // Get the created comment with populated user info
    const createdComment = await db.collection("comments").findOne(
      { _id: result.insertedId }
    );

    // Format response
    const formattedComment = {
      _id: createdComment._id,
      productId: createdComment.productId,
      userId: createdComment.userId.toString(),
      userName: createdComment.userName,
      text: createdComment.text,
      replyTo: createdComment.replyTo ? createdComment.replyTo.toString() : null,
      createdAt: createdComment.createdAt,
      updatedAt: createdComment.updatedAt
    };

    // Send notification to farmer if this is a top-level comment (not a reply)
    // Also send notification if farmer is replying to a consumer's comment
    try {
      const farmerId = product.farmerId.toString();
      
      // Only send notification if:
      // 1. It's a top-level comment (not a reply) - notify farmer about new comment
      // 2. It's a reply from a consumer to farmer's comment - notify farmer
      // 3. It's a reply from farmer - notify the original commenter
      
      if (!replyTo) {
        // Top-level comment - notify farmer
        if (farmerId !== userId) {
          await createNotification(
            farmerId,
            'product_comment',
            'New Comment on Your Product',
            `${user.name || 'A customer'} commented on your product "${product.name}": ${trimmedText.substring(0, 100)}${trimmedText.length > 100 ? '...' : ''}`,
            productId.toString()
          );
        }
      } else {
        // This is a reply
        const parentCommentUserId = parentComment.userId.toString();
        
        if (userId === farmerId) {
          // Farmer is replying - notify the original commenter
          if (parentCommentUserId !== farmerId) {
            await createNotification(
              parentCommentUserId,
              'comment_reply',
              'Farmer Replied to Your Comment',
              `The farmer replied to your comment on "${product.name}": ${trimmedText.substring(0, 100)}${trimmedText.length > 100 ? '...' : ''}`,
              productId.toString()
            );
          }
        } else {
          // Consumer is replying - if replying to farmer's comment, notify farmer
          if (parentCommentUserId === farmerId) {
            await createNotification(
              farmerId,
              'comment_reply',
              'Reply to Your Comment',
              `${user.name || 'A customer'} replied to your comment on "${product.name}": ${trimmedText.substring(0, 100)}${trimmedText.length > 100 ? '...' : ''}`,
              productId.toString()
            );
          } else {
            // Consumer replying to another consumer - notify the original commenter
            await createNotification(
              parentCommentUserId,
              'comment_reply',
              'Reply to Your Comment',
              `${user.name || 'A customer'} replied to your comment on "${product.name}": ${trimmedText.substring(0, 100)}${trimmedText.length > 100 ? '...' : ''}`,
              productId.toString()
            );
          }
        }
      }
    } catch (notifError) {
      console.error("Error creating notification:", notifError);
      // Don't fail the comment creation if notification fails
    }

    res.status(201).json({
      message: "Comment added successfully",
      comment: formattedComment
    });
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ----------------- Get Comments by Product ID -----------------
export const getCommentsByProduct = async (req, res) => {
  try {
    const db = getDB();
    const { productId } = req.params;

    if (!ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    // Check if product exists
    const product = await db.collection("products").findOne({ _id: new ObjectId(productId) });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Get all comments (top-level and replies) sorted by newest first
    const allComments = await db.collection("comments")
      .find({ productId: new ObjectId(productId) })
      .sort({ createdAt: -1 })
      .toArray();

    // Separate top-level comments and replies
    const topLevelComments = [];
    const repliesMap = new Map(); // Map of parent comment ID to array of replies

    allComments.forEach(comment => {
      const sanitizedComment = {
        _id: comment._id,
        productId: comment.productId,
        userId: comment.userId.toString(),
        userName: comment.userName,
        text: comment.text,
        replyTo: comment.replyTo ? comment.replyTo.toString() : null,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt
      };

      if (comment.replyTo) {
        // This is a reply
        const parentId = comment.replyTo.toString();
        if (!repliesMap.has(parentId)) {
          repliesMap.set(parentId, []);
        }
        repliesMap.get(parentId).push(sanitizedComment);
      } else {
        // This is a top-level comment
        topLevelComments.push(sanitizedComment);
      }
    });

    // Attach replies to their parent comments
    const sanitizedComments = topLevelComments.map(comment => ({
      ...comment,
      replies: repliesMap.get(comment._id.toString()) || []
    }));

    // Sort top-level comments by newest first, and replies within each comment by oldest first (conversation flow)
    sanitizedComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    sanitizedComments.forEach(comment => {
      if (comment.replies && comment.replies.length > 0) {
        comment.replies.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      }
    });

    res.json({
      success: true,
      data: sanitizedComments,
      count: sanitizedComments.length
    });
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ----------------- Update Comment -----------------
export const updateComment = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user.userId;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid comment ID" });
    }

    if (!text) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    // Trim and validate comment text
    const trimmedText = text.trim();
    if (trimmedText.length === 0) {
      return res.status(400).json({ message: "Comment text cannot be empty" });
    }

    if (trimmedText.length > 1000) {
      return res.status(400).json({ message: "Comment text cannot exceed 1000 characters" });
    }

    // Check if comment exists and belongs to user
    const comment = await db.collection("comments").findOne({ _id: new ObjectId(id) });
    
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.userId.toString() !== userId) {
      return res.status(403).json({ message: "You don't have permission to update this comment" });
    }

    // Update comment
    await db.collection("comments").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          text: trimmedText,
          updatedAt: new Date()
        }
      }
    );

    // Get updated comment
    const updatedComment = await db.collection("comments").findOne(
      { _id: new ObjectId(id) }
    );

    // Format response
    const formattedComment = {
      _id: updatedComment._id,
      productId: updatedComment.productId,
      userId: updatedComment.userId.toString(),
      userName: updatedComment.userName,
      text: updatedComment.text,
      createdAt: updatedComment.createdAt,
      updatedAt: updatedComment.updatedAt
    };

    res.json({
      message: "Comment updated successfully",
      comment: formattedComment
    });
  } catch (error) {
    console.error("Update comment error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ----------------- Delete Comment -----------------
export const deleteComment = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid comment ID" });
    }

    // Check if comment exists
    const comment = await db.collection("comments").findOne({ _id: new ObjectId(id) });
    
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check permission: user can delete their own comment, admin can delete any comment
    if (comment.userId.toString() !== userId && userRole !== "admin") {
      return res.status(403).json({ message: "You don't have permission to delete this comment" });
    }

    // Delete comment
    await db.collection("comments").deleteOne({ _id: new ObjectId(id) });

    res.json({
      message: "Comment deleted successfully"
    });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

