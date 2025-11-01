import { getDB, getClient } from "../db.js";
import { ObjectId } from "mongodb";

// Place Order
export const placeOrder = async (req, res) => {
  const session = getClient().startSession();

  try {
    session.startTransaction();
    const db = getDB();
    const { products, deliveryAddress } = req.body;

    if (!Array.isArray(products) || products.length === 0)
      return res.status(400).json({ message: "No products provided" });

    if (!deliveryAddress)
      return res.status(400).json({ message: "Delivery address is required" });

    const productIds = products.map(p => new ObjectId(p.productId));

    const dbProducts = await db.collection("products")
      .find({ _id: { $in: productIds }, status: "available" })
      .toArray();

    let total = 0;
    const orderProducts = [];

    for (const p of products) {
      const dbProduct = dbProducts.find(x => x._id.equals(new ObjectId(p.productId)));
      if (!dbProduct) {
        await session.abortTransaction();
        return res.status(400).json({ message: `Product not found: ${p.productId}` });
      }

      if (p.quantity <= 0) {
        await session.abortTransaction();
        return res.status(400).json({ message: `Quantity must be greater than zero for ${dbProduct.name}` });
      }

      if (dbProduct.quantity < p.quantity) {
        await session.abortTransaction();
        return res.status(400).json({ 
          message: `Insufficient stock for ${dbProduct.name}. Available: ${dbProduct.quantity}, Requested: ${p.quantity}` 
        });
      }

      const productTotal = dbProduct.price * p.quantity;
      total += productTotal;

      orderProducts.push({
        productId: dbProduct._id,
        productName: dbProduct.name,
        farmerId: dbProduct.farmerId,
        quantity: p.quantity,
        price: dbProduct.price,
        subtotal: productTotal
      });
    }

    const order = {
      customerId: new ObjectId(req.user.userId),
      customerName: req.user.name,
      products: orderProducts,
      totalAmount: total,
      status: "pending",
      deliveryAddress,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("orders").insertOne(order, { session });

    for (const p of orderProducts) {
      const updateResult = await db.collection("products").updateOne(
        { _id: p.productId, quantity: { $gte: p.quantity } },
        { $inc: { quantity: -p.quantity }, $set: { updatedAt: new Date() } },
        { session }
      );

      if (updateResult.modifiedCount === 0) {
        await session.abortTransaction();
        return res.status(400).json({ message: `Product quantity updated by another order. Try again: ${p.productName}` });
      }

      const updatedProduct = await db.collection("products").findOne({ _id: p.productId });
      if (updatedProduct.quantity <= 0) {
        await db.collection("products").updateOne(
          { _id: p.productId },
          { $set: { status: "sold out", updatedAt: new Date() } },
          { session }
        );
      }
    }

    await session.commitTransaction();

    res.status(201).json({ 
      message: "Order placed successfully",
      orderId: result.insertedId,
      totalAmount: total,
      products: orderProducts.map(p => ({ productName: p.productName, quantity: p.quantity, subtotal: p.subtotal }))
    });

  } catch (error) {
    await session.abortTransaction();
    console.error("Place order error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  } finally {
    session.endSession();
  }
};

// List User Orders
export const listUserOrders = async (req, res) => {
  try {
    const db = getDB();
    const orders = await db.collection("orders")
      .find({ customerId: new ObjectId(req.user.userId) })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(orders);
  } catch (error) {
    console.error("List orders error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Order Details
export const getOrderDetails = async (req, res) => {
  try {
    const db = getDB();
    const { orderId } = req.params;

    if (!ObjectId.isValid(orderId)) return res.status(400).json({ message: "Invalid order ID" });

    const order = await db.collection("orders").findOne({
      _id: new ObjectId(orderId),
      customerId: new ObjectId(req.user.userId)
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json(order);
  } catch (error) {
    console.error("Get order details error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Cancel Order
export const cancelOrder = async (req, res) => {
  const session = getClient().startSession();

  try {
    session.startTransaction();
    const db = getDB();
    const { orderId } = req.params;

    if (!ObjectId.isValid(orderId)) return res.status(400).json({ message: "Invalid order ID" });

    const order = await db.collection("orders").findOne({
      _id: new ObjectId(orderId),
      customerId: new ObjectId(req.user.userId)
    }, { session });

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "pending") {
      await session.abortTransaction();
      return res.status(400).json({ message: `Cannot cancel order with status: ${order.status}` });
    }

    for (const product of order.products) {
      await db.collection("products").updateOne(
        { _id: product.productId },
        { $inc: { quantity: product.quantity }, $set: { status: "available", updatedAt: new Date() } },
        { session }
      );
    }

    await db.collection("orders").updateOne(
      { _id: new ObjectId(orderId) },
      { $set: { status: "cancelled", updatedAt: new Date(), cancelledAt: new Date() } },
      { session }
    );

    await session.commitTransaction();

    res.json({ message: "Order cancelled successfully", orderId });
  } catch (error) {
    await session.abortTransaction();
    console.error("Cancel order error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  } finally {
    session.endSession();
  }
};
