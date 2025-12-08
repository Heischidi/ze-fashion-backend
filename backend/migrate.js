// backend/migrate.js
require("dotenv").config();
const { getDb } = require("./db");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const FRONTEND_DIR = path.join(__dirname, "..", "ze-fashion-brand");
const IMAGES_DIR = path.join(FRONTEND_DIR, "images");

async function seed() {
  const db = await getDb();

  console.log("Starting migration to PostgreSQL...");

  // 1. Users
  await db.exec(`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    password_hash TEXT,
    name TEXT,
    google_id TEXT,
    is_verified INTEGER DEFAULT 0,
    verification_token TEXT,
    role VARCHAR(50) DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`);

  // 2. Categories
  await db.exec(`CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    slug VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`);

  // 3. Products
  await db.exec(`CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    slug VARCHAR(255) UNIQUE,
    description TEXT,
    price DECIMAL(10, 2),
    compare_at_price DECIMAL(10, 2) DEFAULT NULL,
    category_id INTEGER,
    images TEXT, 
    variants TEXT,
    stock INTEGER DEFAULT 0,
    bestseller INTEGER DEFAULT 0,
    new_arrival INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`);

  // 4. Product Reviews
  await db.exec(`CREATE TABLE IF NOT EXISTS product_reviews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER,
    user_id INTEGER,
    rating INTEGER,
    title TEXT,
    body TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`);

  // 5. Carts
  await db.exec(`CREATE TABLE IF NOT EXISTS carts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    items TEXT,
    updated_at TIMESTAMP
  );`);

  // 6. Orders
  await db.exec(`CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    items TEXT,
    total DECIMAL(10, 2),
    shipping_address TEXT,
    status VARCHAR(50),
    is_gift INTEGER DEFAULT 0,
    gift_message TEXT,
    recipient_email TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`);

  console.log("Tables created.");

  // --- Seed Admin ---
  const adminEmail = process.env.ADMIN_EMAIL || "admin@noir123.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  // Note: Postgres uses $1, but our wrapper expects ? for consistent external API usually,
  // BUT here we are using db.get/run which use the wrapper that transforms ?.
  // Checking if admin exists
  const existingAdmin = await db.get("SELECT id FROM users WHERE email = ?", [adminEmail]);
  if (!existingAdmin) {
    const hashed = bcrypt.hashSync(adminPassword, 10);
    await db.run(
      "INSERT INTO users (name, email, password_hash, role, is_verified) VALUES (?,?,?,?, 1)",
      ["Admin User", adminEmail, hashed, "admin"]
    );
    console.log("Admin user created:", adminEmail);
  }

  // --- Seed Categories ---
  const categories = [
    { name: "Wardrobe", slug: "wardrobe" },
    { name: "Curations", slug: "curations" },
    { name: "Accents", slug: "accents" },
    { name: "Sale", slug: "sale" },
    { name: "New Arrivals", slug: "new-arrivals" },
    { name: "Bestsellers", slug: "bestsellers" },
    { name: "Men", slug: "men" },
    { name: "Women", slug: "women" },
    { name: "Kids", slug: "kids" }
  ];

  for (const cat of categories) {
    const existing = await db.get("SELECT id FROM categories WHERE slug = ?", [cat.slug]);
    if (!existing) {
      await db.run("INSERT INTO categories (name, slug) VALUES (?,?)", [cat.name, cat.slug]);
    }
  }
  console.log("Categories seeded");

  // --- Seed Products (if empty) ---
  const countRow = await db.get("SELECT COUNT(*) as c FROM products");
  // For postgres, count(*) returns a string/bigint, need to parse. 
  // Wrapper returns rows[0], so rows[0].c
  if (parseInt(countRow.c) === 0) {
    console.log("Seeding products from images...");
    let images = [];
    try {
      images = fs.readdirSync(IMAGES_DIR).filter((f) => f.match(/\.(png|jpe?g|webp|gif)$/i));
    } catch (e) { }

    const cats = await db.all("SELECT id, slug FROM categories");

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const title = img.replace(/[-_]/g, " ").replace(/\.(png|jpe?g|webp|gif)$/i, "").trim();
      const price = (Math.floor(Math.random() * 50) + 20) * 1000;
      const comparePrice = Math.random() > 0.7 ? price * 1.2 : null;
      const cat = cats[Math.floor(Math.random() * cats.length)];
      const stock = Math.floor(Math.random() * 50) + 5;
      const bestseller = Math.random() > 0.8 ? 1 : 0;
      const variants = JSON.stringify([
        { size: "S", color: "Black", stock: 10 },
        { size: "M", color: "Black", stock: 10 },
        { size: "L", color: "Black", stock: 10 }
      ]);

      await db.run(
        `INSERT INTO products (
          title, slug, description, price, compare_at_price, category_id, images, variants, stock, bestseller
        ) VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [
          title,
          title.toLowerCase().replace(/\s+/g, "-") + "-" + (i + 1),
          "Luxurious fashion item crafted for elegance.",
          price,
          comparePrice,
          cat.id,
          JSON.stringify([`https://ze-fashion-backend.onrender.com/images/${img}`]), // Use absolute path simulation or relative
          variants,
          stock,
          bestseller
        ]
      );
    }
    console.log(`Seeded ${images.length} products`);
  } else {
    console.log("Products already exist, skipping seed");
  }

  // db.close() isn't strictly necessary if process exits, but good practice
  // However, db wrapper might be singular. Backend runs persistently.
  // This script runs once.
  await db.close();
  console.log("Migration & Seeding complete");
}

if (require.main === module) {
  seed().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { seed };
