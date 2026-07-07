const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// All cart routes require a logged-in user
router.use(requireAuth);

function getCartWithDetails(userId) {
  const rows = db
    .prepare(
      `SELECT ci.id AS cart_item_id, ci.quantity, p.id AS product_id, p.name, p.price, p.image_url, p.stock
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = ?
       ORDER BY ci.id ASC`
    )
    .all(userId);

  const subtotal = rows.reduce((sum, r) => sum + r.price * r.quantity, 0);
  return { items: rows, subtotal: Math.round(subtotal * 100) / 100 };
}

// GET /api/cart
router.get('/', (req, res) => {
  res.json(getCartWithDetails(req.user.id));
});

// POST /api/cart  { productId, quantity }
router.post('/', (req, res) => {
  const { productId, quantity = 1 } = req.body || {};
  const qty = Math.max(1, parseInt(quantity, 10) || 1);

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  if (product.stock < qty) {
    return res.status(400).json({ error: `Only ${product.stock} units of "${product.name}" are in stock.` });
  }

  const existing = db
    .prepare('SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?')
    .get(req.user.id, productId);

  if (existing) {
    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(existing.quantity + qty, existing.id);
  } else {
    db.prepare('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)').run(
      req.user.id,
      productId,
      qty
    );
  }

  res.status(201).json(getCartWithDetails(req.user.id));
});

// PUT /api/cart/:itemId  { quantity }
router.put('/:itemId', (req, res) => {
  const { quantity } = req.body || {};
  const qty = parseInt(quantity, 10);

  const item = db
    .prepare('SELECT * FROM cart_items WHERE id = ? AND user_id = ?')
    .get(req.params.itemId, req.user.id);

  if (!item) {
    return res.status(404).json({ error: 'Cart item not found.' });
  }

  if (!qty || qty <= 0) {
    db.prepare('DELETE FROM cart_items WHERE id = ?').run(item.id);
    return res.json(getCartWithDetails(req.user.id));
  }

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
  if (product.stock < qty) {
    return res.status(400).json({ error: `Only ${product.stock} units of "${product.name}" are in stock.` });
  }

  db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(qty, item.id);
  res.json(getCartWithDetails(req.user.id));
});

// DELETE /api/cart/:itemId
router.delete('/:itemId', (req, res) => {
  const item = db
    .prepare('SELECT * FROM cart_items WHERE id = ? AND user_id = ?')
    .get(req.params.itemId, req.user.id);

  if (!item) {
    return res.status(404).json({ error: 'Cart item not found.' });
  }

  db.prepare('DELETE FROM cart_items WHERE id = ?').run(item.id);
  res.json(getCartWithDetails(req.user.id));
});

module.exports = router;
