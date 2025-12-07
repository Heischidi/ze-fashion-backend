const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

// Get Products (PLP)
router.get('/', async (req, res) => {
    try {
        const db = await getDb();
        const { category, min, max, sort, page = 1, limit = 24, q, new_arrival } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM products WHERE 1=1';
        const params = [];

        if (category) {
            const cat = await db.get('SELECT id FROM categories WHERE slug = ?', [category.toLowerCase()]);
            if (cat) {
                query += ' AND category_id = ?';
                params.push(cat.id);
            }
        }

        if (new_arrival) {
            query += ' AND new_arrival = 1';
        }

        if (min) {
            query += ' AND price >= ?';
            params.push(min);
        }
        if (max) {
            query += ' AND price <= ?';
            params.push(max);
        }
        if (q) {
            query += ' AND (title LIKE ? OR description LIKE ?)';
            params.push(`%${q}%`, `%${q}%`);
        }

        if (sort === 'price_asc') query += ' ORDER BY price ASC';
        else if (sort === 'price_desc') query += ' ORDER BY price DESC';
        else if (sort === 'bestseller') query += ' ORDER BY bestseller DESC';
        else query += ' ORDER BY created_at DESC';

        query += ' LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const products = await db.all(query, params);

        // Parse JSON fields
        const items = products.map(p => ({
            ...p,
            images: JSON.parse(p.images || '[]'),
            variants: JSON.parse(p.variants || '[]'),
            stock_level: Math.floor(Math.random() * 20) + 1 // Mock stock level
        }));

        res.json({ items, page: parseInt(page), limit: parseInt(limit) });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Get Product Details (PDP)
router.get('/:id', async (req, res) => {
    try {
        const db = await getDb();
        const product = await db.get('SELECT * FROM products WHERE id = ? OR slug = ?', [req.params.id, req.params.id]);
        if (!product) return res.status(404).json({ error: 'Product not found' });

        product.images = JSON.parse(product.images || '[]');
        product.variants = JSON.parse(product.variants || '[]');

        // Fetch reviews
        const reviews = await db.all('SELECT * FROM product_reviews WHERE product_id = ? ORDER BY created_at DESC LIMIT 5', [product.id]);

        // Fetch recommended products (same category, excluding current)
        const recommended = await db.all('SELECT * FROM products WHERE category_id = ? AND id != ? LIMIT 4', [product.category_id, product.id]);
        const recommendedParsed = recommended.map(p => ({
            ...p,
            images: JSON.parse(p.images || '[]')
        }));

        res.json({
            ...product,
            reviews,
            recommended: recommendedParsed,
            stock_level: Math.floor(Math.random() * 10) + 1 // Mock stock level
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// Get Categories
router.get('/categories/all', async (req, res) => {
    try {
        const db = await getDb();
        const categories = await db.all('SELECT * FROM categories');
        res.json(categories);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

module.exports = router;
