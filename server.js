require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

require('./db'); // initializes DB + seeds products on first run

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// Serve frontend
app.use(express.static(path.join(__dirname, 'public')));

// Fallback 404 for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found.' });
});

// Generic error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

app.listen(PORT, () => {
  console.log(`Store running at http://localhost:${PORT}`);
});
