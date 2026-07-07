# Fieldstone & Co. — Simple E-commerce Store

A full-stack e-commerce demo built with **Express.js**, **SQLite** (via `better-sqlite3`), and vanilla **HTML/CSS/JavaScript**.

## Features

- 🛍️ Product listings with category filters and search
- 📄 Product detail pages
- 🛒 Shopping cart (add, update quantity, remove — persisted per user)
- 💳 Checkout / order processing with shipping details and stock deduction
- 👤 User registration and login (JWT-based auth, passwords hashed with bcrypt)
- 📦 Order history page
- 🗄️ SQLite database storing users, products, cart items, orders, and order items

## Project structure

```
ecommerce-app/
├── server.js              # Express app entry point
├── db.js                  # SQLite schema + seed data
├── middleware/
│   └── auth.js             # JWT auth middleware
├── routes/
│   ├── auth.js              # register / login / me
│   ├── products.js          # product listing / detail / categories
│   ├── cart.js               # cart CRUD (auth required)
│   └── orders.js             # checkout + order history (auth required)
├── public/                 # static frontend
│   ├── index.html            # product listing page
│   ├── product.html          # product detail page
│   ├── cart.html             # shopping cart
│   ├── checkout.html         # shipping form + place order
│   ├── login.html / register.html
│   ├── orders.html           # order history
│   ├── css/style.css
│   └── js/                   # api.js (shared fetch/auth helper) + per-page scripts
└── data/                   # store.db (SQLite file, created automatically)
```

## Setup

**Requirements:** Node.js 18+ and npm.

1. Install dependencies:
   ```bash
   cd ecommerce-app
   npm install
   ```

2. Copy the example environment file and set a real JWT secret:
   ```bash
   cp .env.example .env
   # then edit .env and set JWT_SECRET to a long random string
   ```

3. Start the server:
   ```bash
   npm start
   ```
   (or `npm run dev` if you install `nodemon` and want auto-restart on file changes)

4. Open your browser to **http://localhost:3000**

The SQLite database (`data/store.db`) is created automatically on first run, along with 12 seeded sample products.

## How it works

- **Auth:** On register/login, the server issues a JWT signed with `JWT_SECRET`. The frontend stores it in `localStorage` and sends it as a `Bearer` token on every cart/order request. Cart and order endpoints are protected by the `requireAuth` middleware.
- **Cart:** Stored server-side per user in the `cart_items` table, so it persists across devices/sessions as long as you're logged in.
- **Checkout:** `POST /api/orders` verifies stock, creates an `orders` row plus `order_items` rows in a single database transaction, decrements product stock, and empties the cart.
- **Database:** Plain SQLite file via `better-sqlite3` — no separate database server to install or configure. Swap in Postgres/MySQL later by replacing `db.js` if you need to scale.

## API reference

| Method | Endpoint                | Auth | Description |
|--------|--------------------------|------|--------------|
| POST   | `/api/auth/register`     | No   | Create an account |
| POST   | `/api/auth/login`        | No   | Log in, get a token |
| GET    | `/api/auth/me`           | Yes  | Get current user |
| GET    | `/api/products`          | No   | List products (`?category=&search=`) |
| GET    | `/api/products/categories` | No | List distinct categories |
| GET    | `/api/products/:id`      | No   | Product detail |
| GET    | `/api/cart`              | Yes  | Get current cart |
| POST   | `/api/cart`              | Yes  | Add item `{ productId, quantity }` |
| PUT    | `/api/cart/:itemId`      | Yes  | Update quantity `{ quantity }` |
| DELETE | `/api/cart/:itemId`      | Yes  | Remove item |
| POST   | `/api/orders`            | Yes  | Place order `{ shippingName, shippingAddress, shippingCity, shippingZip }` |
| GET    | `/api/orders`            | Yes  | Order history |
| GET    | `/api/orders/:id`        | Yes  | Order detail with line items |

## Notes / possible next steps

- This is a learning/demo project — for production you'd want rate limiting, CSRF protection, HTTPS, input sanitization hardening, and a real payment gateway (Stripe, etc.) instead of the simulated "place order" flow.
- Product images are pulled from Unsplash and photo availability may change over time; swap `image_url` values in `db.js` for your own hosted images if needed.
- To reset the store to a clean state, stop the server and delete `data/store.db` — it will be recreated and reseeded on next start.
