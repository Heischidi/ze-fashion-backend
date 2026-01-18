require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.set('trust proxy', 1); // Trust first proxy (Render/Heroku/etc)
const { seed } = require('./migrate');
seed().catch(err => console.error("Migration failed:", err));

const PORT = process.env.PORT || 4000;
const IMAGES_DIR = path.join(__dirname, "images");


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

const paymentRoutes = require('./routes/payment');
app.use('/api/payment', paymentRoutes);

// Serve static frontend files and images
// Serve images if available (e.g. uploads), but disable full frontend serving for production API
// app.use("/", express.static(FRONTEND_DIR));
app.use("/images", express.static(IMAGES_DIR));
if (!fs.existsSync(IMAGES_DIR)) {
  // Try to create it silently or ignore
  try { fs.mkdirSync(IMAGES_DIR, { recursive: true }); } catch (e) { }
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/waitlist', require('./routes/waitlist'));

// Health check
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Root route - Just say API is running
app.get("/", (req, res) => {
  res.send("Ze Fashion Backend API is running. Access endpoints at /api/...");
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
