const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const db = new Database(path.join(dataDir, 'store.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ---------- Schema ----------
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  image_url TEXT,
  category TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cart_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  shipping_name TEXT,
  shipping_address TEXT,
  shipping_city TEXT,
  shipping_zip TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price REAL NOT NULL
);
`);

// ---------- Seed products (only if table empty) ----------
const productCount = db.prepare('SELECT COUNT(*) AS count FROM products').get().count;

if (productCount === 0) {
  const insert = db.prepare(`
    INSERT INTO products (name, description, price, image_url, category, stock)
    VALUES (@name, @description, @price, @image_url, @category, @stock)
  `);

  const products = [
    {
      name: 'Classic Cotton T-Shirt',
      description: 'A soft, breathable 100% cotton t-shirt perfect for everyday wear. Available in a relaxed fit.',
      price: 19.99,
      image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
      category: 'Apparel',
      stock: 120
    },
    {
      name: 'Wireless Bluetooth Headphones',
      description: 'Over-ear headphones with active noise cancellation, 30-hour battery life, and rich bass.',
      price: 79.99,
      image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
      category: 'Electronics',
      stock: 45
    },
    {
      name: 'Stainless Steel Water Bottle',
      description: 'Double-walled insulated bottle that keeps drinks cold for 24 hours or hot for 12 hours. 750ml.',
      price: 24.5,
      image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500',
      category: 'Home & Kitchen',
      stock: 200
    },
    {
      name: 'Leather Laptop Backpack',
      description: 'Water-resistant backpack with padded laptop compartment, fits up to 15.6" laptops.',
      price: 54.99,
      image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
      category: 'Accessories',
      stock: 60
    },
    {
      name: 'Smart Fitness Watch',
      description: 'Track your heart rate, sleep, and workouts with this lightweight smart watch. 7-day battery.',
      price: 129.0,
      image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
      category: 'Electronics',
      stock: 30
    },
    {
      name: 'Ceramic Coffee Mug Set (4-pack)',
      description: 'Microwave and dishwasher safe ceramic mugs, 12oz each, in assorted matte colors.',
      price: 29.99,
      image_url: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=500',
      category: 'Home & Kitchen',
      stock: 80
    },
    {
      name: 'Running Shoes',
      description: 'Lightweight running shoes with breathable mesh upper and responsive cushioning.',
      price: 89.95,
      image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
      category: 'Footwear',
      stock: 75
    },
    {
      name: 'Aromatherapy Essential Oil Diffuser',
      description: 'Ultrasonic diffuser with 7-color LED light and auto shut-off. Whisper-quiet operation.',
      price: 34.99,
      image_url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=500',
      category: 'Home & Kitchen',
      stock: 55
    },
    {
      name: 'Mechanical Keyboard',
      description: 'RGB backlit mechanical keyboard with hot-swappable switches, ideal for gaming and typing.',
      price: 69.99,
      image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500',
      category: 'Electronics',
      stock: 40
    },
    {
      name: 'Yoga Mat',
      description: 'Extra-thick non-slip yoga mat with carrying strap, perfect for yoga, pilates, and stretching.',
      price: 22.0,
      image_url: 'https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=500',
      category: 'Fitness',
      stock: 100
    },
    {
      name: 'Sunglasses - Polarized',
      description: 'UV400 polarized sunglasses with a durable lightweight frame and scratch-resistant lenses.',
      price: 27.5,
      image_url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500',
      category: 'Accessories',
      stock: 90
    },
    {
      name: 'Portable Bluetooth Speaker',
      description: 'Compact waterproof speaker with 360-degree sound and 12-hour playtime.',
      price: 44.99,
      image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500',
      category: 'Electronics',
      stock: 65
    }
  ];

  const insertMany = db.transaction((rows) => {
    for (const row of rows) insert.run(row);
  });
  insertMany(products);

  console.log(`Seeded ${products.length} products.`);
}

module.exports = db;
