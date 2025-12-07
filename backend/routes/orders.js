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

const { sendGiftNotification } = require('../utils/email');

// Create Order
router.post('/', authMiddleware, async (req, res) => {
    const { items, total, shipping_address, is_gift, gift_message, recipient_email } = req.body;
    try {
        const db = await getDb();
        await db.run(
            'INSERT INTO orders (user_id, items, total, shipping_address, status, is_gift, gift_message, recipient_email) VALUES (?,?,?,?,?,?,?,?)',
            [req.user.id, JSON.stringify(items), total, JSON.stringify(shipping_address), 'pending', is_gift ? 1 : 0, gift_message || null, recipient_email || null]
        );
        // Clear cart
        await db.run('DELETE FROM carts WHERE user_id = ?', [req.user.id]);

        // Send Gift Email
        if (is_gift && recipient_email) {
            // Fetch sender name
            const user = await db.get('SELECT name FROM users WHERE id = ?', [req.user.id]);
            const senderName = user ? user.name : 'A Friend';

            // Send email asynchronously (don't await to avoid blocking response)
            sendGiftNotification(recipient_email, gift_message, senderName, items).catch(err => console.error('Failed to send gift email:', err));
        }

        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Get Orders
router.get('/', authMiddleware, async (req, res) => {
    try {
        const db = await getDb();
        const orders = await db.all('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
        const parsed = orders.map(o => ({
            ...o,
            items: JSON.parse(o.items || '[]'),
            shipping_address: JSON.parse(o.shipping_address || '{}')
        }));
        res.json(parsed);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Get Order by ID
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const db = await getDb();
        const order = await db.get('SELECT * FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        order.items = JSON.parse(order.items || '[]');
        order.shipping_address = JSON.parse(order.shipping_address || '{}');

        res.json(order);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

// Get Received Gifts
router.get('/received/gifts', authMiddleware, async (req, res) => {
    try {
        const db = await getDb();
        // Find orders where recipient_email matches current user's email
        // Logic assumes req.user.email is available in token payload
        const orders = await db.all('SELECT * FROM orders WHERE recipient_email = ? ORDER BY created_at DESC', [req.user.email]);

        const parsed = orders.map(o => ({
            ...o,
            items: JSON.parse(o.items || '[]'),
            shipping_address: JSON.parse(o.shipping_address || '{}')
        }));
        res.json(parsed);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch gifts' });
    }
});

module.exports = router;
