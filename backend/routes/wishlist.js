const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_for_ze_fashion_brand_2024_production_ready';

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

// Get Wishlist
router.get('/', authMiddleware, async (req, res) => {
    try {
        const db = await getDb();
        // Check if wishlist table exists, if not create it (temporary fix for missing migration)
        await db.run(`CREATE TABLE IF NOT EXISTS wishlists (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            items TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        const wishlist = await db.get('SELECT * FROM wishlists WHERE user_id = ?', [req.user.id]);
        if (!wishlist) return res.json({ items: [] });
        res.json({ items: JSON.parse(wishlist.items || '[]') });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch wishlist' });
    }
});

// Update Wishlist
router.post('/', authMiddleware, async (req, res) => {
    const { items, product_id } = req.body;
    try {
        const db = await getDb();
        await db.run(`CREATE TABLE IF NOT EXISTS wishlists (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            items TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        let newItems = items;

        if (product_id) {
            // Fetch product
            const product = await db.get('SELECT * FROM products WHERE id = ?', [product_id]);
            if (!product) return res.status(404).json({ error: 'Product not found' });

            // Fetch current wishlist
            const currentEntry = await db.get('SELECT items FROM wishlists WHERE user_id = ?', [req.user.id]);
            let currentItems = currentEntry ? JSON.parse(currentEntry.items || '[]') : [];

            // Add if not exists
            if (!currentItems.find(i => i.product_id === product.id || i.id === product.id)) {
                // Ensure format matches what account.html expects (flat properties or object)
                // Account.html uses: item.product_id (for link), item.id (for removal?), item.title, item.price
                // We'll store the product with an explicit product_id field to be safe
                product.product_id = product.id;

                // Parse images if string (SQLite storage)
                try {
                    if (typeof product.images === 'string') {
                        product.images = JSON.parse(product.images);
                    }
                } catch (e) { }

                currentItems.push(product);
            }
            newItems = currentItems;
        }

        const existing = await db.get('SELECT id FROM wishlists WHERE user_id = ?', [req.user.id]);
        if (existing) {
            await db.run('UPDATE wishlists SET items = ? WHERE id = ?', [JSON.stringify(newItems), existing.id]);
        } else {
            await db.run('INSERT INTO wishlists (user_id, items) VALUES (?,?)', [req.user.id, JSON.stringify(newItems)]);
        }
        res.json({ success: true, items: newItems });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to update wishlist' });
    }
});

// Remove from Wishlist
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const db = await getDb();
        const existing = await db.get('SELECT * FROM wishlists WHERE user_id = ?', [req.user.id]);
        if (!existing) return res.status(404).json({ error: 'Wishlist not found' });

        let items = JSON.parse(existing.items || '[]');
        const idToRemove = parseInt(req.params.id);

        // Filter out the item
        const newItems = items.filter(i => i.id !== idToRemove && i.product_id !== idToRemove);

        await db.run('UPDATE wishlists SET items = ? WHERE id = ?', [JSON.stringify(newItems), existing.id]);
        res.json({ success: true, items: newItems });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to remove item' });
    }
});

module.exports = router;
