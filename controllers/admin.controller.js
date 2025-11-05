// controllers/admin.controller.js
import { getDB } from "../db.js";
import { ObjectId } from "mongodb";

// -------------------- Admin Dashboard Stats --------------------
export const getDashboardStats = async (req, res) => {
  try {
    const db = getDB();

    // Get counts
    const [
      totalUsers,
      totalFarmers,
      totalConsumers,
      totalProducts,
      totalOrders,
      totalRevenue,
      recentOrders,
      recentUsers
    ] = await Promise.all([
      db.collection("users").countDocuments(),
      db.collection("users").countDocuments({ role: "farmer" }),
      db.collection("users").countDocuments({ role: "consumer" }),
      db.collection("products").countDocuments(),
      db.collection("orders").countDocuments(),
      db.collection("orders").aggregate([
        { $match: { status: { $in: ["completed", "delivered"] } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]).toArray(),
      db.collection("orders").find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray(),
      db.collection("users").find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray()
    ]);

    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

    // Get orders by status
    const ordersByStatus = await db.collection("orders").aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]).toArray();

    const statusCounts = {
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      completed: 0,
      cancelled: 0
    };

    ordersByStatus.forEach(item => {
      if (statusCounts.hasOwnProperty(item._id)) {
        statusCounts[item._id] = item.count;
      }
    });

    // Populate customer names for recent orders
    const recentOrdersWithCustomer = await Promise.all(
      recentOrders.map(async (order) => {
        let customerName = "Unknown";
        if (order.customerId) {
          const customer = await db.collection("users").findOne(
            { _id: order.customerId },
            { projection: { name: 1 } }
          );
          if (customer) {
            customerName = customer.name || "Unknown";
          }
        }
        return {
          _id: order._id,
          orderNumber: order._id.toString(), // Use order ID as order number
          customerName: customerName,
          totalAmount: order.totalAmount,
          status: order.status,
          createdAt: order.createdAt
        };
      })
    );

    res.json({
      stats: {
        totalUsers,
        totalFarmers,
        totalConsumers,
        totalProducts,
        totalOrders,
        totalRevenue: revenue,
        ordersByStatus: statusCounts
      },
      recentOrders: recentOrdersWithCustomer,
      recentUsers: recentUsers.map(user => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }))
    });
  } catch (error) {
    console.error("Admin dashboard stats error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Get All Users --------------------
export const getAllUsers = async (req, res) => {
  try {
    const db = getDB();
    const { role, search, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [users, total] = await Promise.all([
      db.collection("users")
        .find(query, { projection: { password: 0 } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .toArray(),
      db.collection("users").countDocuments(query)
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Update User Status --------------------
export const updateUserStatus = async (req, res) => {
  try {
    const db = getDB();
    const { userId } = req.params;
    const { deactivated, emailVerified } = req.body;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const updateData = { $set: { updatedAt: new Date() } };
    if (deactivated !== undefined) {
      updateData.$set.deactivated = deactivated;
      if (deactivated) {
        updateData.$set.deactivatedAt = new Date();
      } else {
        if (!updateData.$unset) updateData.$unset = {};
        updateData.$unset.deactivatedAt = "";
      }
    }
    if (emailVerified !== undefined) {
      updateData.$set.emailVerified = emailVerified;
    }

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      updateData
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = await db.collection("users").findOne(
      { _id: new ObjectId(userId) },
      { projection: { password: 0 } }
    );

    res.json({
      message: "User status updated successfully",
      user
    });
  } catch (error) {
    console.error("Update user status error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Delete User --------------------
export const deleteUser = async (req, res) => {
  try {
    const db = getDB();
    const { userId } = req.params;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Check for active orders
    const activeOrders = await db.collection("orders").findOne({
      $or: [
        { customerId: userId },
        { "products.farmerId": userId }
      ],
      status: { $in: ["pending", "confirmed", "processing", "shipped"] }
    });

    if (activeOrders) {
      return res.status(400).json({
        message: "Cannot delete user with active orders"
      });
    }

    await db.collection("users").deleteOne({ _id: new ObjectId(userId) });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Get All Products --------------------
export const getAllProducts = async (req, res) => {
  try {
    const db = getDB();
    const { category, search, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [products, total] = await Promise.all([
      db.collection("products")
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .toArray(),
      db.collection("products").countDocuments(query)
    ]);

    // Populate farmer info
    const productsWithFarmer = await Promise.all(
      products.map(async (product) => {
        if (product.farmerId) {
          const farmer = await db.collection("users").findOne(
            { _id: new ObjectId(product.farmerId) },
            { projection: { name: 1, email: 1, phone: 1 } }
          );
          return { ...product, farmer };
        }
        return product;
      })
    );

    res.json({
      products: productsWithFarmer,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Get all products error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Delete Product (Admin) --------------------
export const adminDeleteProduct = async (req, res) => {
  try {
    const db = getDB();
    const { productId } = req.params;

    if (!ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    // Check for active orders
    const activeOrders = await db.collection("orders").findOne({
      "products.productId": new ObjectId(productId),
      status: { $in: ["pending", "confirmed", "processing", "shipped"] }
    });

    if (activeOrders) {
      return res.status(400).json({
        message: "Cannot delete product with active orders"
      });
    }

    await db.collection("products").deleteOne({ _id: new ObjectId(productId) });

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Admin delete product error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Get All Orders --------------------
export const getAllOrders = async (req, res) => {
  try {
    const db = getDB();
    const { status, search, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    
    // Handle search - search by order ID or customer name
    let customerIds = [];
    if (search) {
      // First, try to find customers matching the search term
      const matchingCustomers = await db.collection("users").find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } }
        ]
      }, { projection: { _id: 1 } }).toArray();
      
      customerIds = matchingCustomers.map(c => c._id);
      
      // Also check if search term matches an order ID (ObjectId format)
      const searchQuery = {
        $or: []
      };
      
      if (ObjectId.isValid(search)) {
        searchQuery.$or.push({ _id: new ObjectId(search) });
      }
      
      if (customerIds.length > 0) {
        searchQuery.$or.push({ customerId: { $in: customerIds } });
      }
      
      if (searchQuery.$or.length > 0) {
        Object.assign(query, searchQuery);
      } else {
        // If no matches found, return empty result
        return res.json({
          orders: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0
          }
        });
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [orders, total] = await Promise.all([
      db.collection("orders")
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .toArray(),
      db.collection("orders").countDocuments(query)
    ]);

    // Populate customer names for all orders
    const ordersWithCustomer = await Promise.all(
      orders.map(async (order) => {
        let customerName = "Unknown";
        if (order.customerId) {
          const customer = await db.collection("users").findOne(
            { _id: order.customerId },
            { projection: { name: 1, email: 1 } }
          );
          if (customer) {
            customerName = customer.name || "Unknown";
          }
        }
        return {
          ...order,
          orderNumber: order._id.toString(), // Use order ID as order number
          customerName: customerName
        };
      })
    );

    res.json({
      orders: ordersWithCustomer,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Get all orders error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Update Order Status (Admin) --------------------
export const adminUpdateOrderStatus = async (req, res) => {
  try {
    const db = getDB();
    const { orderId } = req.params;
    const { status } = req.body;

    if (!ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const validStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await db.collection("orders").findOne({ _id: new ObjectId(orderId) });
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const result = await db.collection("orders").updateOne(
      { _id: new ObjectId(orderId) },
      { $set: { status, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Send email and notifications
    try {
      const { createNotification } = await import("./notifications.controller.js");
      const { sendOrderStatusUpdateEmail } = await import("../services/email.service.js");

      // Get customer details
      const customer = await db.collection("users").findOne(
        { _id: order.customerId },
        { projection: { name: 1, email: 1 } }
      );

      // Get all farmers involved in this order
      const farmerIds = new Set();
      for (const orderProduct of order.products || []) {
        const product = await db.collection("products").findOne(
          { _id: orderProduct.productId },
          { projection: { farmerId: 1 } }
        );
        if (product && product.farmerId) {
          farmerIds.add(product.farmerId.toString());
        }
      }

      // Get farmer details
      const farmers = [];
      for (const farmerId of farmerIds) {
        const farmer = await db.collection("users").findOne(
          { _id: new ObjectId(farmerId) },
          { projection: { _id: 1, name: 1, email: 1 } }
        );
        if (farmer) {
          farmers.push(farmer);
        }
      }

      // Send email and notification to consumer
      if (customer) {
        try {
          await sendOrderStatusUpdateEmail(customer.email, customer.name, orderId, status, "admin");
        } catch (emailError) {
          console.error("Error sending email to consumer:", emailError);
        }

        await createNotification(
          order.customerId.toString(),
          'order_status_updated',
          `Order Status Updated to ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          `Your order status has been updated to ${status} by an administrator. Order ID: ${orderId}`,
          orderId
        );
      }

      // Send email and notification to all farmers involved
      for (const farmer of farmers) {
        try {
          await sendOrderStatusUpdateEmail(farmer.email, farmer.name, orderId, status, "admin");
        } catch (emailError) {
          console.error(`Error sending email to farmer ${farmer._id}:`, emailError);
        }

        await createNotification(
          farmer._id.toString(),
          'order_status_updated',
          `Order Status Updated to ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          `Order ${orderId} status has been updated to ${status} by an administrator.`,
          orderId
        );
      }
    } catch (notifError) {
      console.error("Error sending notifications/emails:", notifError);
      // Don't fail the status update if notification/email fails
    }

    const updatedOrder = await db.collection("orders").findOne({ _id: new ObjectId(orderId) });

    res.json({
      message: "Order status updated successfully",
      order: updatedOrder
    });
  } catch (error) {
    console.error("Admin update order status error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

