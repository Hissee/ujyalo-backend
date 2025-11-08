// models/transaction.model.js
// Transaction Schema Definition for MongoDB
// This file defines the structure for the transactions collection

/**
 * Transaction Schema
 * 
 * Fields:
 * - _id: ObjectId (Primary Key, auto-generated)
 * - orderId: ObjectId (Foreign Key → orders._id, Required)
 * - userId: ObjectId (Foreign Key → users._id, Required)
 * - transactionId: String (Unique, system-generated transaction ID)
 * - paymentGateway: String (Required, enum: "esewa", "khalti", "cash_on_delivery")
 * - amount: Number (Required, > 0, transaction amount)
 * - currency: String (Required, default: "NPR")
 * - status: String (Required, enum: "pending", "initiated", "processing", "completed", "failed", "cancelled", "refunded")
 * - gatewayTransactionId: String (Optional, payment gateway's transaction ID)
 * - gatewayResponse: Object (Optional, full response from payment gateway)
 * - failureReason: String (Optional, reason for failure if status is "failed")
 * - initiatedAt: Date (Optional, when payment was initiated)
 * - completedAt: Date (Optional, when payment was completed)
 * - createdAt: Date (Auto-generated, default: Date.now)
 * - updatedAt: Date (Auto-updated, default: Date.now)
 */

export const transactionSchema = {
  // This is a reference schema for documentation
  // Actual validation is done in the controller
};

/**
 * Generate unique transaction ID
 * Format: TXN-YYYY-MMDD-HHMMSS-{orderId.substring(0,8)}
 */
export const generateTransactionId = (orderId) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const orderIdShort = orderId.toString().substring(0, 8);
  
  return `TXN-${year}-${month}${day}-${hours}${minutes}${seconds}-${orderIdShort}`;
};

/**
 * Transaction Status Enum
 */
export const TransactionStatus = {
  PENDING: 'pending',
  INITIATED: 'initiated',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

/**
 * Payment Gateway Enum
 */
export const PaymentGateway = {
  ESEWA: 'esewa',
  KHALTI: 'khalti',
  CASH_ON_DELIVERY: 'cash_on_delivery'
};

