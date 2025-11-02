import { getDB } from "../db.js";
import { ObjectId } from "mongodb";

// Place Order
export const placeOrder = async (req, res) => {
  try {
    const db = getDB();
    const { products, deliveryAddress, paymentMethod, paymentStatus } = req.body;
    
    if (!Array.isArray(products) || products.length === 0)
      return res.status(400).json({ message: "No products provided" });

    // Validate product IDs are valid ObjectIds
    const invalidProductIds = products.filter(p => !ObjectId.isValid(p.productId));
    if (invalidProductIds.length > 0) {
      return res.status(400).json({ 
        message: "Invalid product ID format", 
        invalidIds: invalidProductIds.map(p => p.productId)
      });
    }

    const productIds = products.map((p) => new ObjectId(p.productId));
    const dbProducts = await db.collection("products").find({ _id: { $in: productIds } }).toArray();

    let total = 0;
    const orderProducts = [];

    for (const p of products) {
      const productObjectId = new ObjectId(p.productId);
      const dbp = dbProducts.find((x) => x._id.equals(productObjectId));
      if (!dbp) return res.status(400).json({ message: `Product not found: ${p.productId}` });
      if (dbp.quantity < p.quantity) return res.status(400).json({ message: `Insufficient stock for ${dbp.name}. Available: ${dbp.quantity}, Requested: ${p.quantity}` });
      total += dbp.price * p.quantity;
      orderProducts.push({ productId: dbp._id, quantity: p.quantity, price: dbp.price });
    }

    const order = {
      customerId: new ObjectId(req.user.userId),
      products: orderProducts,
      totalAmount: total,
      status: "pending",
      deliveryAddress: deliveryAddress || {},
      paymentMethod: paymentMethod || "cash_on_delivery",
      paymentStatus: paymentStatus || "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("orders").insertOne(order);

    // Only reduce product quantity for Cash on Delivery orders immediately
    // For Khalti, wait for payment verification
    if (paymentMethod === "cash_on_delivery" || paymentStatus === "completed") {
      for (const p of orderProducts) {
        await db.collection("products").updateOne({ _id: p.productId }, { $inc: { quantity: -p.quantity } });
        await db.collection("products").updateOne({ _id: p.productId, quantity: { $lte: 0 } }, { $set: { status: "sold out" } });
      }
    }

    res.status(201).json({ 
      message: "Order placed", 
      orderId: result.insertedId.toString(),
      paymentMethod: order.paymentMethod
    });
  } catch (err) {
    console.error("Place order error:", err);
    console.error("Error stack:", err.stack);
    console.error("Request body:", req.body);
    console.error("User:", req.user);
    
    // Provide more detailed error message
    const errorMessage = err.message || "Unknown error occurred";
    res.status(500).json({ 
      message: "Server error", 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// List Orders
export const listUserOrders = async (req, res) => {
  try {
    const db = getDB();
    const orders = await db.collection("orders").find({ customerId: new ObjectId(req.user.userId) }).toArray();
    res.json(orders);
  } catch (err) {
    console.error("List orders error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Verify Khalti Payment
export const verifyKhaltiPayment = async (req, res) => {
  try {
    const db = getDB();
    const { token, amount, orderId } = req.body;

    if (!token || !amount || !orderId) {
      return res.status(400).json({ message: "Token, amount, and orderId are required" });
    }

    // Verify payment with Khalti API
    const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY || 'test_secret_key_f59e8b7d18b4499ca40f68195a846e9a';
    
    const response = await fetch('https://khalti.com/api/v2/payment/verify/', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${KHALTI_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token,
        amount: amount
      })
    });

    const khaltiResponse = await response.json();

    if (!response.ok || !khaltiResponse.idx) {
      return res.status(400).json({ 
        success: false,
        message: khaltiResponse.detail || "Payment verification failed" 
      });
    }

    // Find the order
    const order = await db.collection("orders").findOne({ _id: new ObjectId(orderId) });
    
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Check if amount matches
    if (khaltiResponse.amount !== order.totalAmount * 100) { // Khalti returns amount in paisa
      return res.status(400).json({ 
        success: false,
        message: "Payment amount mismatch" 
      });
    }

    // Update order status
    await db.collection("orders").updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          paymentStatus: "completed",
          status: "confirmed",
          khaltiPaymentId: khaltiResponse.idx,
          paymentVerifiedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    // Reduce product quantities
    for (const p of order.products) {
      await db.collection("products").updateOne(
        { _id: p.productId }, 
        { $inc: { quantity: -p.quantity } }
      );
      await db.collection("products").updateOne(
        { _id: p.productId, quantity: { $lte: 0 } }, 
        { $set: { status: "sold out" } }
      );
    }

    res.json({
      success: true,
      message: "Payment verified successfully",
      orderId: orderId,
      khaltiTransactionId: khaltiResponse.idx
    });
  } catch (err) {
    console.error("Khalti verification error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: err.message 
    });
  }
};
