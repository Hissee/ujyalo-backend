const { ObjectId } = require("mongodb");
const { getDB } = require("../db");

exports.placeOrder = async (req, res) => {
  try {
    const db = getDB();
    const { products, deliveryAddress } = req.body;
    if (!Array.isArray(products) || products.length === 0) return res.status(400).json({ message: "No products provided" });

    // fetch DB products
    const productIds = products.map(p => ObjectId(p.productId));
    const dbProducts = await db.collection("products").find({ _id: { $in: productIds } }).toArray();

    let total = 0;
    const orderProducts = [];

    for (const p of products) {
      const dbp = dbProducts.find(x => x._id.equals(ObjectId(p.productId)));
      if (!dbp) return res.status(400).json({ message: `Product not found: ${p.productId}` });
      if (dbp.quantity < p.quantity) return res.status(400).json({ message: `Insufficient stock for ${dbp.name}` });
      total += dbp.price * p.quantity;
      orderProducts.push({ productId: dbp._id, quantity: p.quantity, price: dbp.price });
    }

    const order = {
      customerId: ObjectId(req.user.userId),
      products: orderProducts,
      totalAmount: total,
      status: "pending",
      deliveryAddress,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection("orders").insertOne(order);

    // update quantities (simple approach; for production use transactions)
    for (const p of orderProducts) {
      await db.collection("products").updateOne({ _id: p.productId }, { $inc: { quantity: -p.quantity } });
      await db.collection("products").updateOne({ _id: p.productId, quantity: { $lte: 0 } }, { $set: { status: "sold out" } });
    }

    res.status(201).json({ message: "Order placed", orderId: result.insertedId });
  } catch (err) {
    console.error("Place order error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.listUserOrders = async (req, res) => {
  try {
    const db = getDB();
    const orders = await db.collection("orders").find({ customerId: ObjectId(req.user.userId) }).toArray();
    res.json(orders);
  } catch (err) {
    console.error("List orders error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
