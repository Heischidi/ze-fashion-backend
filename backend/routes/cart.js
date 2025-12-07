const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_for_ze_fashion_brand_2024_production_ready';

// Middleware to check auth
const authMiddleware = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ error: 'Unauthorized' });
    const token = header.split(' ')[1];
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch (e) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Get Cart
router.get('/', authMiddleware, async (req, res) => {
    try {
        const db = await getDb();
        const cart = await db.get('SELECT * FROM carts WHERE user_id = ?', [req.user.id]);
        if (!cart) return res.json({ items: [] });
        res.json({ items: JSON.parse(cart.items || '[]') });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch cart' });
    }
});

// Update Cart
router.post('/', authMiddleware, async (req, res) => {
    const { items } = req.body;
    try {
        const db = await getDb();
        const existing = await db.get('SELECT id FROM carts WHERE user_id = ?', [req.user.id]);
        if (existing) {
            await db.run('UPDATE carts SET items = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [JSON.stringify(items), existing.id]);
        } else {
            await db.run('INSERT INTO carts (user_id, items, updated_at) VALUES (?,?,CURRENT_TIMESTAMP)', [req.user.id, JSON.stringify(items)]);
        }
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to update cart' });
    }
});

module.exports = router;
