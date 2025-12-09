const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_for_ze_fashion_brand_2024_production_ready';

// Cloudinary Config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'ze-fashion',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        public_id: (req, file) => uuidv4(),
    },
});

const adminMiddleware = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ error: 'Unauthorized' });
    const token = header.split(' ')[1];
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        if (payload.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
        req.user = payload;
        next();
    } catch (e) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

const upload = multer({ storage: storage });

// Create Product
router.post('/products', adminMiddleware, upload.array('images'), async (req, res) => {
    try {
        const { title, description, price, compare_at_price, category, bestseller, new_arrival } = req.body;
        // Cloudinary returns the full URL in `file.path`
        const images = req.files ? req.files.map(f => f.path) : [];
        const slug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

        const db = await getDb();
        // Look up category ID
        let categoryId = null;
        if (category) {
            const catRow = await db.get('SELECT id FROM categories WHERE slug = ?', [category.toLowerCase()]);
            if (catRow) categoryId = catRow.id;
        }

        await db.run(
            'INSERT INTO products (title, slug, description, price, compare_at_price, category_id, images, bestseller, new_arrival, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP) RETURNING id',
            [title, slug, description, price, compare_at_price || null, categoryId, JSON.stringify(images), bestseller === 'true' || bestseller === true ? 1 : 0, new_arrival === 'true' || new_arrival === true ? 1 : 0]
        );

        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

// Update Product
router.put('/products/:id', adminMiddleware, upload.array('images'), async (req, res) => {
    try {
        const { title, description, price, compare_at_price, category, bestseller, new_arrival } = req.body;
        const db = await getDb();

        // 1. Fetch existing product
        const existing = await db.get('SELECT images FROM products WHERE id = ?', [req.params.id]);
        if (!existing) return res.status(404).json({ error: 'Product not found' });

        let finalImages = existing.images;
        // If new images are uploaded, replace old ones (basic logic for now)
        if (req.files && req.files.length > 0) {
            // Cloudinary URL
            const newImages = req.files.map(f => f.path);
            finalImages = JSON.stringify(newImages);
        }

        // 2. Look up category ID
        let categoryId = null;
        if (category) {
            const catRow = await db.get('SELECT id FROM categories WHERE slug = ?', [category.toLowerCase()]);
            if (catRow) categoryId = catRow.id;
        }

        // 3. Update
        await db.run(
            `UPDATE products 
             SET title = ?, description = ?, price = ?, compare_at_price = ?, category_id = ?, images = ?, bestseller = ?, new_arrival = ?
             WHERE id = ?`,
            [
                title,
                description,
                price,
                compare_at_price || null,
                categoryId,
                finalImages,
                bestseller === 'true' || bestseller === true ? 1 : 0,
                new_arrival === 'true' || new_arrival === true ? 1 : 0,
                req.params.id
            ]
        );

        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// Get All Orders (Admin)
router.get('/orders', adminMiddleware, async (req, res) => {
    try {
        const db = await getDb();
        const orders = await db.all('SELECT * FROM orders ORDER BY created_at DESC');
        res.json(orders);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Update Order Status
router.put('/orders/:id/status', adminMiddleware, async (req, res) => {
    console.log(`[PUT] /orders/${req.params.id}/status`, req.body);
    const { status } = req.body;
    if (!status) {
        console.error('Status missing in body');
        return res.status(400).json({ error: 'Status is required' });
    }

    try {
        const db = await getDb();
        await db.run('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
        console.log('Order status updated in DB');
        res.json({ success: true });
    } catch (e) {
        console.error('DB Update Error:', e);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

// Delete Product
router.delete('/products/:id', adminMiddleware, async (req, res) => {
    try {
        const db = await getDb();
        await db.run('DELETE FROM products WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// Bulk Delete Products
router.post('/products/bulk-delete', adminMiddleware, async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'No product IDs provided' });
    }

    try {
        const db = await getDb();
        const placeholders = ids.map(() => '?').join(',');
        await db.run(`DELETE FROM products WHERE id IN (${placeholders})`, ids);
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to delete products' });
    }
});

module.exports = router;
