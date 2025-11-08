# Transactions Collection Implementation

## Overview
A new `transactions` collection has been created to store payment transaction details for all payment methods (eSewa, Khalti, and Cash on Delivery). This collection is connected to the `orders` collection via a foreign key relationship.

## Database Schema

### Collection: `transactions`

**Fields:**
- `_id`: ObjectId (Primary Key, auto-generated)
- `orderId`: ObjectId (Foreign Key → orders._id, Required)
- `userId`: ObjectId (Foreign Key → users._id, Required)
- `transactionId`: String (Unique, system-generated transaction ID)
- `paymentGateway`: String (Required, enum: "esewa", "khalti", "cash_on_delivery")
- `amount`: Number (Required, > 0, transaction amount)
- `currency`: String (Required, default: "NPR")
- `status`: String (Required, enum: "pending", "initiated", "processing", "completed", "failed", "cancelled", "refunded")
- `gatewayTransactionId`: String (Optional, payment gateway's transaction ID)
- `gatewayResponse`: Object (Optional, full response from payment gateway)
- `failureReason`: String (Optional, reason for failure if status is "failed")
- `initiatedAt`: Date (Optional, when payment was initiated)
- `completedAt`: Date (Optional, when payment was completed)
- `createdAt`: Date (Auto-generated, default: Date.now)
- `updatedAt`: Date (Auto-updated, default: Date.now)

## Files Created

### 1. `models/transaction.model.js`
- Defines transaction schema structure
- Provides helper functions:
  - `generateTransactionId()`: Creates unique transaction IDs
  - `TransactionStatus`: Enum for transaction statuses
  - `PaymentGateway`: Enum for payment gateways

### 2. `controllers/transactions.controller.js`
- `createTransaction()`: Creates a new transaction record when order is placed
- `updateTransaction()`: Updates transaction status and details
- `getTransactionByOrderId()`: Retrieves transaction by order ID
- `getTransactionByTransactionId()`: Retrieves transaction by system transaction ID
- `getUserTransactions()`: Gets all transactions for a user (API endpoint)
- `getTransactionById()`: Gets transaction details by ID (API endpoint)
- `updateEsewaTransaction()`: Updates eSewa transaction after payment verification
- `updateKhaltiTransaction()`: Updates Khalti transaction after payment verification

### 3. `routes/transactions.routes.js`
- `GET /api/transactions`: Get all transactions for authenticated user
- `GET /api/transactions/:id`: Get transaction details by ID

## Integration

### Orders Controller Integration
The `orders.controller.js` has been updated to:
1. **Create transaction** when an order is placed (in `placeOrder()` function)
2. **Update transaction** when Khalti payment is verified (in `verifyKhaltiPayment()` function)
3. **New endpoint**: `verifyEsewaPayment()` - Verifies eSewa payment and updates transaction

### Server Integration
The `server.js` has been updated to include the transactions routes:
```javascript
app.use("/api/transactions", transactionsRoutes);
```

## API Endpoints

### Get User Transactions
```
GET /api/transactions
Headers: Authorization: Bearer <token>
Response: Array of transaction objects
```

### Get Transaction by ID
```
GET /api/transactions/:id
Headers: Authorization: Bearer <token>
Response: Transaction object
```

### Verify eSewa Payment
```
POST /api/orders/verify-esewa
Headers: Authorization: Bearer <token>
Body: {
  orderId: string,
  esewaResponse: object
}
Response: {
  success: boolean,
  message: string,
  orderId: string,
  esewaTransactionId: string
}
```

## Transaction Flow

### 1. Order Placement
When an order is placed:
1. Order is created in `orders` collection
2. Transaction record is automatically created in `transactions` collection
3. Transaction status is set based on payment method:
   - COD: `pending`
   - eSewa/Khalti: `initiated`

### 2. Payment Verification
When payment is verified (eSewa/Khalti):
1. Payment gateway response is received
2. Transaction record is updated with:
   - Status: `completed` or `failed`
   - Gateway transaction ID
   - Full gateway response
   - Completion timestamp
3. Order payment status is updated accordingly

### 3. Transaction Status Flow
```
pending → initiated → processing → completed
   ↓           ↓           ↓
failed      failed      failed
   ↓
cancelled
   ↓
refunded (if applicable)
```

## Foreign Key Relationship

The `transactions` collection has a **one-to-many** relationship with `orders`:
- One order can have multiple transactions (for retry attempts)
- `transactions.orderId` references `orders._id`
- `transactions.userId` references `users._id`

## Database Indexes

Recommended indexes for the `transactions` collection:

```javascript
// Order ID index
db.transactions.createIndex({ "orderId": 1 });

// User ID index
db.transactions.createIndex({ "userId": 1 });

// Transaction ID index (unique)
db.transactions.createIndex({ "transactionId": 1 }, { unique: true });

// Status index
db.transactions.createIndex({ "status": 1 });

// Payment gateway index
db.transactions.createIndex({ "paymentGateway": 1 });

// Gateway transaction ID index
db.transactions.createIndex({ "gatewayTransactionId": 1 });

// Compound index for order transactions by status
db.transactions.createIndex({ "orderId": 1, "status": 1 });

// Created date index
db.transactions.createIndex({ "createdAt": -1 });

// Compound index for user transactions
db.transactions.createIndex({ "userId": 1, "createdAt": -1 });
```

## Usage Examples

### Creating a Transaction (Automatic)
Transactions are automatically created when orders are placed. No manual creation needed.

### Updating Transaction Status
```javascript
import { updateEsewaTransaction } from "./controllers/transactions.controller.js";

// After eSewa payment verification
await updateEsewaTransaction(orderId, esewaResponse, true);
```

### Querying Transactions
```javascript
import { getTransactionByOrderId } from "./controllers/transactions.controller.js";

// Get transaction for an order
const transaction = await getTransactionByOrderId(orderId);
```

## Benefits

1. **Audit Trail**: Complete record of all payment attempts
2. **Retry Support**: Multiple transactions per order for failed payments
3. **Gateway Response Storage**: Full payment gateway responses stored for debugging
4. **Better Analytics**: Track payment success rates, failure reasons, etc.
5. **Refund Support**: Transaction records can be updated for refunds
6. **Separation of Concerns**: Payment logic separated from order management

## Notes

- Transactions are created automatically when orders are placed
- Failed transactions can be retried (creates new transaction record)
- Transaction IDs are unique and system-generated
- Gateway responses are stored for audit purposes
- Transaction updates don't fail the order if they error (logged but continue)

