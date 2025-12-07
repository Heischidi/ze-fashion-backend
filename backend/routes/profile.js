const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

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

// Get Profile
router.get('/', authMiddleware, async (req, res) => {
    try {
        const db = await getDb();
        const user = await db.get('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [req.user.id]);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Update Profile
router.put('/', authMiddleware, async (req, res) => {
    console.log('[PUT] /api/profile', req.body);
    const { name, email, password } = req.body;
    try {
        const db = await getDb();
        const updates = [];
        const params = [];

        if (name) {
            updates.push('name = ?');
            params.push(name);
        }
        if (email) {
            updates.push('email = ?');
            params.push(email);
        }
        if (password) {
            const hashed = bcrypt.hashSync(password, 10);
            updates.push('password_hash = ?');
            params.push(hashed);
        }

        if (updates.length === 0) {
            console.log('No updates provided');
            return res.json({ success: true });
        }

        params.push(req.user.id);
        const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
        console.log('Executing SQL:', sql, params);

        await db.run(sql, params);
        console.log('Update executed');

        // Fetch updated user
        const user = await db.get('SELECT id, name, email, role FROM users WHERE id = ?', [req.user.id]);
        console.log('Updated user fetched:', user);

        res.json({ success: true, user });
    } catch (e) {
        console.error('Profile Update Error:', e);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

module.exports = router;
