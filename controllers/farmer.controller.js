import { getDB } from "../db.js";
import { ObjectId } from "mongodb";

// Get Farmer's Products
export const getFarmerProducts = async (req, res) => {
  try {
    const db = getDB();
    const farmerId = req.user.userId;

    const products = await db.collection("products")
      .find({ farmerId: farmerId })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(products);
  } catch (error) {
    console.error("Get farmer products error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Farmer's Orders (orders containing farmer's products)
export const getFarmerOrders = async (req, res) => {
  try {
    const db = getDB();
    const farmerId = req.user.userId;

    // First, get all product IDs owned by this farmer
    const farmerProducts = await db.collection("products")
      .find({ farmerId: farmerId })
      .project({ _id: 1 })
      .toArray();

    const farmerProductIds = farmerProducts.map(p => p._id);

    if (farmerProductIds.length === 0) {
      return res.json([]);
    }

    // Find all orders that contain products from this farmer
    const allOrders = await db.collection("orders").find({}).toArray();

    // Filter orders that contain farmer's products and enrich with product details
    const farmerOrders = [];
    
    for (const order of allOrders) {
      const orderProducts = order.products || [];
      const farmerOrderProducts = [];
      let farmerOrderTotal = 0;

      for (const orderProduct of orderProducts) {
        if (farmerProductIds.some(id => id.equals(orderProduct.productId))) {
          // Get product details
          const product = await db.collection("products").findOne({ _id: orderProduct.productId });
          if (product) {
            farmerOrderProducts.push({
              productId: orderProduct.productId,
              productName: product.name,
              quantity: orderProduct.quantity,
              price: orderProduct.price,
              total: orderProduct.quantity * orderProduct.price
            });
            farmerOrderTotal += orderProduct.quantity * orderProduct.price;
          }
        }
      }

      if (farmerOrderProducts.length > 0) {
        // Get customer details
        const customer = await db.collection("users").findOne({ _id: order.customerId });

        farmerOrders.push({
          _id: order._id,
          orderId: order._id,
          customerId: order.customerId,
          customerName: customer?.name || "Unknown",
          customerEmail: customer?.email || "",
          customerPhone: customer?.phone || "",
          products: farmerOrderProducts,
          totalAmount: farmerOrderTotal,
          orderTotalAmount: order.totalAmount,
          status: order.status,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          deliveryAddress: order.deliveryAddress,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt
        });
      }
    }

    // Sort by creation date (newest first)
    farmerOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(farmerOrders);
  } catch (error) {
    console.error("Get farmer orders error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Farmer Dashboard Statistics
export const getFarmerDashboardStats = async (req, res) => {
  try {
    const db = getDB();
    const farmerId = req.user.userId;

    // Get farmer's products
    const farmerProducts = await db.collection("products")
      .find({ farmerId: farmerId })
      .toArray();

    const farmerProductIds = farmerProducts.map(p => p._id);

    // Get all orders
    const allOrders = await db.collection("orders").find({}).toArray();

    // Calculate statistics
    let totalRevenue = 0;
    let totalOrders = 0;
    let pendingOrders = 0;
    let confirmedOrders = 0;
    let deliveredOrders = 0;
    let totalProductsSold = 0;
    const recentOrders = [];

    for (const order of allOrders) {
      const orderProducts = order.products || [];
      let hasFarmerProduct = false;
      let orderValue = 0;

      for (const orderProduct of orderProducts) {
        if (farmerProductIds.some(id => id.equals(orderProduct.productId))) {
          hasFarmerProduct = true;
          orderValue += orderProduct.quantity * orderProduct.price;
          totalProductsSold += orderProduct.quantity;
        }
      }

      if (hasFarmerProduct) {
        totalOrders++;
        totalRevenue += orderValue;

        if (order.status === "pending") pendingOrders++;
        else if (order.status === "confirmed") confirmedOrders++;
        else if (order.status === "delivered") deliveredOrders++;

        // Get customer info for recent orders
        if (recentOrders.length < 10) {
          const customer = await db.collection("users").findOne({ _id: order.customerId });
          recentOrders.push({
            orderId: order._id,
            customerName: customer?.name || "Unknown",
            totalAmount: orderValue,
            status: order.status,
            paymentStatus: order.paymentStatus,
            createdAt: order.createdAt
          });
        }
      }
    }

    // Product statistics
    const totalProducts = farmerProducts.length;
    const availableProducts = farmerProducts.filter(p => p.status === "available").length;
    const soldOutProducts = farmerProducts.filter(p => p.status === "sold out").length;
    const totalStock = farmerProducts.reduce((sum, p) => sum + (p.quantity || 0), 0);

    res.json({
      overview: {
        totalRevenue,
        totalOrders,
        totalProducts,
        totalProductsSold
      },
      orders: {
        pending: pendingOrders,
        confirmed: confirmedOrders,
        delivered: deliveredOrders,
        total: totalOrders
      },
      products: {
        total: totalProducts,
        available: availableProducts,
        soldOut: soldOutProducts,
        totalStock
      },
      recentOrders: recentOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    });
  } catch (error) {
    console.error("Get farmer dashboard stats error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update Order Status (for farmers to mark as delivered, etc.)
export const updateOrderStatus = async (req, res) => {
  try {
    const db = getDB();
    const { orderId } = req.params;
    const { status } = req.body;
    const farmerId = req.user.userId;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    // Valid statuses
    const validStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    }

    // Verify the order contains products from this farmer
    const order = await db.collection("orders").findOne({ _id: new ObjectId(orderId) });
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if order contains farmer's products
    const farmerProducts = await db.collection("products")
      .find({ farmerId: farmerId })
      .project({ _id: 1 })
      .toArray();

    const farmerProductIds = farmerProducts.map(p => p._id);
    const hasFarmerProduct = order.products.some(p => 
      farmerProductIds.some(id => id.equals(p.productId))
    );

    if (!hasFarmerProduct) {
      return res.status(403).json({ message: "You don't have permission to update this order" });
    }

    // Update order status
    await db.collection("orders").updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          status: status,
          updatedAt: new Date()
        }
      }
    );

    res.json({
      message: "Order status updated successfully",
      orderId: orderId,
      status: status
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Farmer Revenue Report
export const getFarmerRevenue = async (req, res) => {
  try {
    const db = getDB();
    const farmerId = req.user.userId;

    // Get date range from query params (default: last 30 days)
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get farmer's products
    const farmerProducts = await db.collection("products")
      .find({ farmerId: farmerId })
      .project({ _id: 1 })
      .toArray();

    const farmerProductIds = farmerProducts.map(p => p._id);

    // Get orders within date range
    const orders = await db.collection("orders")
      .find({
        createdAt: { $gte: startDate },
        paymentStatus: "completed"
      })
      .toArray();

    // Calculate revenue
    const revenueByDate = {};
    let totalRevenue = 0;

    for (const order of orders) {
      let orderValue = 0;
      for (const orderProduct of order.products || []) {
        if (farmerProductIds.some(id => id.equals(orderProduct.productId))) {
          orderValue += orderProduct.quantity * orderProduct.price;
        }
      }

      if (orderValue > 0) {
        totalRevenue += orderValue;
        const dateKey = order.createdAt.toISOString().split('T')[0];
        revenueByDate[dateKey] = (revenueByDate[dateKey] || 0) + orderValue;
      }
    }

    res.json({
      period: {
        days: days,
        startDate: startDate,
        endDate: new Date()
      },
      totalRevenue,
      revenueByDate
    });
  } catch (error) {
    console.error("Get farmer revenue error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

