const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/products?category=&search=
router.get('/', (req, res) => {
  const { category, search } = req.query;

  let query = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (search) {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  query += ' ORDER BY created_at DESC';

  const products = db.prepare(query).all(...params);
  res.json({ products });
});

// GET /api/products/categories - list distinct categories
router.get('/categories', (req, res) => {
  const rows = db.prepare('SELECT DISTINCT category FROM products ORDER BY category').all();
  res.json({ categories: rows.map((r) => r.category) });
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  res.json({ product });
});

module.exports = router;
