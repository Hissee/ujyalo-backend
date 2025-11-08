// controllers/transactions.controller.js
import { getDB } from "../db.js";
import { ObjectId } from "mongodb";
import { generateTransactionId, TransactionStatus, PaymentGateway } from "../models/transaction.model.js";

/**
 * Create a new transaction record
 * This is called when an order is placed and payment is initiated
 */
export const createTransaction = async (orderId, userId, paymentGateway, amount, currency = "NPR") => {
  try {
    const db = getDB();
    
    // Validate inputs
    if (!ObjectId.isValid(orderId) || !ObjectId.isValid(userId)) {
      throw new Error("Invalid orderId or userId");
    }

    if (![PaymentGateway.ESEWA, PaymentGateway.KHALTI, PaymentGateway.CASH_ON_DELIVERY].includes(paymentGateway)) {
      throw new Error("Invalid payment gateway");
    }

    if (!amount || amount <= 0) {
      throw new Error("Amount must be greater than zero");
    }

    // Generate unique transaction ID
    const transactionId = generateTransactionId(orderId);

    // Create transaction document
    const transaction = {
      orderId: new ObjectId(orderId),
      userId: new ObjectId(userId),
      transactionId: transactionId,
      paymentGateway: paymentGateway,
      amount: amount,
      currency: currency,
      status: paymentGateway === PaymentGateway.CASH_ON_DELIVERY 
        ? TransactionStatus.PENDING 
        : TransactionStatus.INITIATED,
      gatewayTransactionId: null,
      gatewayResponse: null,
      failureReason: null,
      initiatedAt: new Date(),
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert transaction
    const result = await db.collection("transactions").insertOne(transaction);
    
    return {
      transactionId: result.insertedId,
      systemTransactionId: transactionId,
      status: transaction.status
    };
  } catch (error) {
    console.error("Error creating transaction:", error);
    throw error;
  }
};

/**
 * Update transaction status (for eSewa payment verification)
 */
export const updateTransaction = async (transactionId, updateData) => {
  try {
    const db = getDB();
    
    if (!ObjectId.isValid(transactionId)) {
      throw new Error("Invalid transaction ID");
    }

    const updateFields = {
      ...updateData,
      updatedAt: new Date()
    };

    // If status is completed, set completedAt
    if (updateData.status === TransactionStatus.COMPLETED && !updateData.completedAt) {
      updateFields.completedAt = new Date();
    }

    const result = await db.collection("transactions").updateOne(
      { _id: new ObjectId(transactionId) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      throw new Error("Transaction not found");
    }

    return result;
  } catch (error) {
    console.error("Error updating transaction:", error);
    throw error;
  }
};

/**
 * Get transaction by order ID
 */
export const getTransactionByOrderId = async (orderId) => {
  try {
    const db = getDB();
    
    if (!ObjectId.isValid(orderId)) {
      throw new Error("Invalid order ID");
    }

    const transaction = await db.collection("transactions").findOne({
      orderId: new ObjectId(orderId)
    });

    return transaction;
  } catch (error) {
    console.error("Error fetching transaction:", error);
    throw error;
  }
};

/**
 * Get transaction by system transaction ID
 */
export const getTransactionByTransactionId = async (transactionId) => {
  try {
    const db = getDB();

    const transaction = await db.collection("transactions").findOne({
      transactionId: transactionId
    });

    return transaction;
  } catch (error) {
    console.error("Error fetching transaction:", error);
    throw error;
  }
};

/**
 * Get all transactions for a user
 */
export const getUserTransactions = async (req, res) => {
  try {
    const db = getDB();
    const userId = req.user.userId;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const transactions = await db.collection("transactions")
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(transactions);
  } catch (error) {
    console.error("Error fetching user transactions:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Get transaction details by ID
 */
export const getTransactionById = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid transaction ID" });
    }

    const transaction = await db.collection("transactions").findOne({
      _id: new ObjectId(id)
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Verify user owns this transaction (unless admin)
    if (req.user.role !== "admin" && transaction.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(transaction);
  } catch (error) {
    console.error("Error fetching transaction:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Update eSewa transaction after payment verification
 */
export const updateEsewaTransaction = async (orderId, esewaResponse, isSuccess) => {
  try {
    const db = getDB();
    
    if (!ObjectId.isValid(orderId)) {
      throw new Error("Invalid order ID");
    }

    // Find transaction by orderId
    const transaction = await db.collection("transactions").findOne({
      orderId: new ObjectId(orderId),
      paymentGateway: PaymentGateway.ESEWA
    });

    if (!transaction) {
      throw new Error("Transaction not found for this order");
    }

    const updateData = {
      gatewayResponse: esewaResponse,
      updatedAt: new Date()
    };

    if (isSuccess) {
      updateData.status = TransactionStatus.COMPLETED;
      updateData.completedAt = new Date();
      updateData.gatewayTransactionId = esewaResponse.transaction_uuid || esewaResponse.transaction_uuid || null;
    } else {
      updateData.status = TransactionStatus.FAILED;
      updateData.failureReason = esewaResponse.message || "Payment verification failed";
    }

    await db.collection("transactions").updateOne(
      { _id: transaction._id },
      { $set: updateData }
    );

    return transaction._id;
  } catch (error) {
    console.error("Error updating eSewa transaction:", error);
    throw error;
  }
};

/**
 * Update Khalti transaction after payment verification
 */
export const updateKhaltiTransaction = async (orderId, khaltiResponse, isSuccess) => {
  try {
    const db = getDB();
    
    if (!ObjectId.isValid(orderId)) {
      throw new Error("Invalid order ID");
    }

    // Find transaction by orderId
    const transaction = await db.collection("transactions").findOne({
      orderId: new ObjectId(orderId),
      paymentGateway: PaymentGateway.KHALTI
    });

    if (!transaction) {
      throw new Error("Transaction not found for this order");
    }

    const updateData = {
      gatewayResponse: khaltiResponse,
      updatedAt: new Date()
    };

    if (isSuccess) {
      updateData.status = TransactionStatus.COMPLETED;
      updateData.completedAt = new Date();
      updateData.gatewayTransactionId = khaltiResponse.idx || khaltiResponse.id || null;
    } else {
      updateData.status = TransactionStatus.FAILED;
      updateData.failureReason = khaltiResponse.detail || "Payment verification failed";
    }

    await db.collection("transactions").updateOne(
      { _id: transaction._id },
      { $set: updateData }
    );

    return transaction._id;
  } catch (error) {
    console.error("Error updating Khalti transaction:", error);
    throw error;
  }
};

