// backend/migrate.js
require("dotenv").config();
const sqlite3 = require("sqlite3").verbose();
const { open } = require("sqlite");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");

const DB_FILE = process.env.DATABASE_FILE || "./db.sqlite";
const FRONTEND_DIR = path.join(__dirname, "..", "ze-fashion-brand");
const IMAGES_DIR = path.join(FRONTEND_DIR, "images");

async function seed() {
  const db = await open({ filename: DB_FILE, driver: sqlite3.Database });

  // 1. Users
  await db.exec(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password_hash TEXT,
    name TEXT,
    google_id TEXT,
    role TEXT DEFAULT 'customer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);

  // 2. Categories
  await db.exec(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    slug TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);

  // 3. Products
  await db.exec(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    slug TEXT UNIQUE,
    description TEXT,
    price REAL,
    compare_at_price REAL DEFAULT NULL,
    category_id INTEGER,
    images TEXT, 
    variants TEXT,
    stock INTEGER DEFAULT 0,
    bestseller INTEGER DEFAULT 0,
    new_arrival INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);

  // Ensure new_arrival column exists (for existing non-ephemeral DBs or failed migrations)
  try {
    await db.run("ALTER TABLE products ADD COLUMN new_arrival INTEGER DEFAULT 0");
  } catch (e) {
    // Ignore error if column already exists
  }

  // 4. Product Reviews
  await db.exec(`CREATE TABLE IF NOT EXISTS product_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    user_id INTEGER,
    rating INTEGER,
    title TEXT,
    body TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);

  // 5. Carts
  await db.exec(`CREATE TABLE IF NOT EXISTS carts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    items TEXT,
    updated_at DATETIME
  );`);

  // 6. Orders
  await db.exec(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    items TEXT,
    total REAL,
    shipping_address TEXT,
    status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);

  // --- Seed Admin ---
  const adminEmail = process.env.ADMIN_EMAIL || "admin@noir123.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const existingAdmin = await db.get("SELECT id FROM users WHERE email = ?", [adminEmail]);
  if (!existingAdmin) {
    const hashed = bcrypt.hashSync(adminPassword, 10);
    await db.run(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)",
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
  if (countRow.c === 0) {
    console.log("Seeding products from images...");
    let images = [];
    try {
      images = fs.readdirSync(IMAGES_DIR).filter((f) => f.match(/\.(png|jpe?g|webp|gif)$/i));
    } catch (e) { }

    const cats = await db.all("SELECT id, slug FROM categories");

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const title = img.replace(/[-_]/g, " ").replace(/\.(png|jpe?g|webp|gif)$/i, "").trim();
      const price = (Math.floor(Math.random() * 50) + 20) * 1000; // 20k - 70k
      const comparePrice = Math.random() > 0.7 ? price * 1.2 : null;
      const cat = cats[Math.floor(Math.random() * cats.length)];
      const stock = Math.floor(Math.random() * 50) + 5;
      const bestseller = Math.random() > 0.8 ? 1 : 0;

      // Mock variants
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
          JSON.stringify([img]), // Array of images
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

  await db.close();
  console.log("Migration & Seeding complete");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
}

module.exports = { seed };
