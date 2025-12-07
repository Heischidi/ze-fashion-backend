// backend/server.js
require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const fs = require("fs");

const PORT = process.env.PORT || 4000;
const FRONTEND_DIR = path.join(__dirname, "..", "ze-fashion-brand");
const IMAGES_DIR = path.join(FRONTEND_DIR, "images");

const app = express();
const session = require('express-session');
const passport = require('./config/passport');

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Session config
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Serve static frontend files and images
app.use("/", express.static(FRONTEND_DIR));
app.use("/images", express.static(IMAGES_DIR));
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/profile', require('./routes/profile'));

// Health check
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Fallback to index.html for SPA-like navigation (if needed) or just serve files
app.get("*", (req, res) => {
  const f = path.join(FRONTEND_DIR, req.path);
  if (fs.existsSync(f) && fs.statSync(f).isFile()) {
    return res.sendFile(f);
  }
  return res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
