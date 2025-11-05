import { getDB } from "../db.js";
import { ObjectId } from "mongodb";
import { createNotification } from "./notifications.controller.js";

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
      // Store product snapshot (name, image) in order so it can be displayed even if product is deleted later
      orderProducts.push({ 
        productId: dbp._id, 
        quantity: p.quantity, 
        price: dbp.price,
        productName: dbp.name || 'Unknown Product',
        productImage: (dbp.images && dbp.images.length > 0) ? dbp.images[0] : (dbp.image || '')
      });
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
    const orderId = result.insertedId.toString();

    // Only reduce product quantity for Cash on Delivery orders immediately
    // For Khalti, wait for payment verification
    if (paymentMethod === "cash_on_delivery" || paymentStatus === "completed") {
      for (const p of orderProducts) {
        await db.collection("products").updateOne({ _id: p.productId }, { $inc: { quantity: -p.quantity } });
        await db.collection("products").updateOne({ _id: p.productId, quantity: { $lte: 0 } }, { $set: { status: "sold out" } });
      }
    }

    // Send email and notifications
    try {
      const { sendOrderPlacedEmailToConsumer, sendOrderPlacedEmailToFarmer } = await import("../services/email.service.js");

      // Get customer details
      const customer = await db.collection("users").findOne(
        { _id: new ObjectId(req.user.userId) },
        { projection: { name: 1, email: 1 } }
      );

      // Send email and notification to consumer
      if (customer) {
        try {
          await sendOrderPlacedEmailToConsumer(
            customer.email,
            customer.name,
            orderId,
            total,
            orderProducts,
            paymentMethod || "cash_on_delivery"
          );
        } catch (emailError) {
          console.error("Error sending email to consumer:", emailError);
        }

        await createNotification(
          req.user.userId,
          'order_placed',
          'Order Placed Successfully',
          `Your order has been placed successfully. Order ID: ${orderId}`,
          orderId
        );
      }

      // Get all farmers involved in this order
      const farmerIds = new Set();
      const farmerProductMap = new Map(); // Map farmerId to their products in this order
      
      for (const op of orderProducts) {
        const product = dbProducts.find(p => p._id.equals(op.productId));
        if (product && product.farmerId) {
          const farmerIdStr = product.farmerId.toString();
          farmerIds.add(farmerIdStr);
          
          if (!farmerProductMap.has(farmerIdStr)) {
            farmerProductMap.set(farmerIdStr, []);
          }
          farmerProductMap.get(farmerIdStr).push(op);
        }
      }

      // Send email and notification to each farmer
      for (const farmerId of farmerIds) {
        try {
          const farmer = await db.collection("users").findOne(
            { _id: new ObjectId(farmerId) },
            { projection: { name: 1, email: 1 } }
          );

          if (farmer) {
            // Send email to farmer
            try {
              await sendOrderPlacedEmailToFarmer(
                farmer.email,
                farmer.name,
                orderId,
                farmerProductMap.get(farmerId),
                customer?.name || 'Unknown',
                total
              );
            } catch (emailError) {
              console.error(`Error sending email to farmer ${farmerId}:`, emailError);
            }

            // Send notification to farmer
            await createNotification(
              farmerId,
              'order_placed',
              'New Order Received',
              `A new order has been placed for your products. Order ID: ${orderId}`,
              orderId
            );
          }
        } catch (farmerError) {
          console.error(`Error processing farmer ${farmerId}:`, farmerError);
        }
      }

      // Send notification to all admins
      try {
        const admins = await db.collection("users")
          .find({ role: "admin" }, { projection: { _id: 1 } })
          .toArray();

        for (const admin of admins) {
          await createNotification(
            admin._id.toString(),
            'order_placed',
            'New Order Placed',
            `A new order has been placed. Order ID: ${orderId}, Customer: ${customer?.name || 'Unknown'}, Total: Rs. ${total.toLocaleString('en-NP')}`,
            orderId
          );
        }
      } catch (adminNotifError) {
        console.error("Error creating admin notifications:", adminNotifError);
      }
    } catch (notifError) {
      console.error("Error sending notifications/emails:", notifError);
      // Don't fail the order if notification/email fails
    }

    res.status(201).json({ 
      message: "Order placed", 
      orderId: orderId,
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

    // Update order payment status
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

    // Send notifications
    try {
      // Consumer notification: Payment completed and order confirmed
      await createNotification(
        order.customerId.toString(),
        'order_payment_completed',
        'Payment Completed',
        `Your payment has been completed and order has been confirmed. Order ID: ${orderId}`,
        orderId
      );

      await createNotification(
        order.customerId.toString(),
        'order_confirmed',
        'Order Confirmed',
        `Your order has been confirmed. Order ID: ${orderId}`,
        orderId
      );

      // Notify farmers
      const farmerIds = new Set();
      for (const op of order.products) {
        const product = await db.collection("products").findOne({ _id: op.productId });
        if (product && product.farmerId) {
          farmerIds.add(product.farmerId.toString());
        }
      }
      
      for (const farmerId of farmerIds) {
        await createNotification(
          farmerId,
          'order_confirmed',
          'Order Confirmed',
          `Order ${orderId} has been confirmed and payment completed.`,
          orderId
        );
      }
    } catch (notifError) {
      console.error("Error creating notifications:", notifError);
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
