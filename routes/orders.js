const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

// POST /api/orders - checkout: converts current cart into an order
router.post('/', (req, res) => {
  const { shippingName, shippingAddress, shippingCity, shippingZip } = req.body || {};

  if (!shippingName || !shippingAddress || !shippingCity || !shippingZip) {
    return res.status(400).json({ error: 'Full shipping details are required to place an order.' });
  }

  const cartItems = db
    .prepare(
      `SELECT ci.id AS cart_item_id, ci.quantity, p.id AS product_id, p.name, p.price, p.stock
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = ?`
    )
    .all(req.user.id);

  if (cartItems.length === 0) {
    return res.status(400).json({ error: 'Your cart is empty.' });
  }

  // Verify stock before committing
  for (const item of cartItems) {
    if (item.quantity > item.stock) {
      return res.status(400).json({ error: `Not enough stock for "${item.name}".` });
    }
  }

  const total = Math.round(cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100) / 100;

  const placeOrder = db.transaction(() => {
    const orderResult = db
      .prepare(
        `INSERT INTO orders (user_id, total, status, shipping_name, shipping_address, shipping_city, shipping_zip)
         VALUES (?, ?, 'placed', ?, ?, ?, ?)`
      )
      .run(req.user.id, total, shippingName, shippingAddress, shippingCity, shippingZip);

    const orderId = orderResult.lastInsertRowid;

    const insertItem = db.prepare(
      `INSERT INTO order_items (order_id, product_id, product_name, quantity, price)
       VALUES (?, ?, ?, ?, ?)`
    );
    const updateStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');

    for (const item of cartItems) {
      insertItem.run(orderId, item.product_id, item.name, item.quantity, item.price);
      updateStock.run(item.quantity, item.product_id);
    }

    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);

    return orderId;
  });

  const orderId = placeOrder();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);

  res.status(201).json({ order, items });
});

// GET /api/orders - order history for logged-in user
router.get('/', (req, res) => {
  const orders = db
    .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.user.id);
  res.json({ orders });
});

// GET /api/orders/:id - a single order with its line items
router.get('/:id', (req, res) => {
  const order = db
    .prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  res.json({ order, items });
});

module.exports = router;
