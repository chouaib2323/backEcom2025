const db = require('../config/db');
const jwt = require("jsonwebtoken");

exports.createOrder = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const {
    cartItems,
    totalPrice,
    shippingAddress,
    billingAddress,
    paymentMethod,
    guest_name,
    guest_email,
    guest_phone
  } = req.body;

  let userId = null;

  try {
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    }

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // ✅ Insert order
    const [orderResult] = await db.query(
      `INSERT INTO orders 
       (user_id, total_price, shipping_address, billing_address, payment_method, guest_name, guest_email, guest_phone) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        totalPrice,
        shippingAddress || null,
        billingAddress || null,
        paymentMethod || "cash_on_delivery",
        guest_name || null,
        guest_email || null,
        guest_phone || null,
      ]
    );

    const orderId = orderResult.insertId;

    // ✅ Insert order items
    for (const item of cartItems) {
      let variantId = item.variantId;

      // If variant not provided, find it by size & color
      if (!variantId && item.selectedColor && item.selectedSize) {
        const [variant] = await db.query(
          "SELECT id FROM product_variants WHERE product_id = ? AND color = ? AND size = ? LIMIT 1",
          [item.id, item.selectedColor, item.selectedSize]
        );

        if (variant.length > 0) {
          variantId = variant[0].id;
        } else {
          return res.status(400).json({
            message: `Variant not found for product ${item.id}`,
          });
        }
      }

      // Save item
      await db.query(
        `INSERT INTO order_items (order_id, product_variant_id, quantity, price) 
         VALUES (?, ?, ?, ?)`,
        [orderId, variantId, item.quantity, item.price]
      );

      // ✅ Update stock
      await db.query(
        `UPDATE product_variants 
         SET stock_quantity = stock_quantity - ? 
         WHERE id = ?`,
        [item.quantity, variantId]
      );
    }

    res.json({ success: true, orderId });
  } catch (error) {
    console.error("❌ CreateOrder Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
