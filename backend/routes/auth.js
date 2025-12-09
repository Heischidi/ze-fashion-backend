const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_for_ze_fashion_brand_2024_production_ready';

const { sendVerificationEmail } = require('../utils/email');
const crypto = require('crypto');
const passport = require('passport');

// Register
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const hashed = bcrypt.hashSync(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    try {
        const db = await getDb();
        const result = await db.run(
            'INSERT INTO users (name, email, password_hash, is_verified, verification_token) VALUES (?,?,?,?,?) RETURNING id',
            [name || '', email, hashed, 1, verificationToken] // Auto-verify: is_verified = 1
        );
        const user = { id: result.lastID, name: name || '', email, role: 'customer' };

        // Generate dynamic link based on current request host (works for localhost and production)
        const protocol = req.protocol;
        const host = req.get('host');
        const verificationLink = `${protocol}://${host}/api/auth/verify?token=${verificationToken}`;

        // Send verification email (Optional now, but good to keep logic if SMTP is added later)
        // await sendVerificationEmail(email, verificationLink); 

        // For DEV/DEMO purposes: Return the link in the response
        res.json({
            message: 'Registration successful.',
            devLink: verificationLink
        });
    } catch (e) {
        if (e.code === '23505' || e.message.includes('duplicate key value')) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        console.error(e);
        res.status(500).json({ error: 'Database error' });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    try {
        const db = await getDb();
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        const valid = bcrypt.compareSync(password, user.password_hash);
        if (!valid) return res.status(400).json({ error: 'Invalid credentials' });

        // Check verification status - DISABLED for now to allow login without SMTP
        // if (user.is_verified === 0) {
        //     return res.status(403).json({ error: 'Please verify your email address before logging in.' });
        // }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Auth error' });
    }
});

// Verify Email
router.get('/verify', async (req, res) => {
    const { token } = req.query;
    if (!token) return res.status(400).send('Invalid token');

    try {
        const db = await getDb();
        const user = await db.get('SELECT * FROM users WHERE verification_token = ?', [token]);

        if (!user) {
            return res.redirect('http://localhost:3000/verify-email.html?status=error&message=Invalid token');
        }

        await db.run('UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = ?', [user.id]);

        // Redirect to frontend success page
        // Assuming frontend is running on same host/port or configured URL
        // Since we serve static files from root, we can redirect relatively or absolute
        res.redirect('/verify-email.html?status=success');
    } catch (e) {
        console.error(e);
        res.status(500).send('Server error');
    }
});

// Google Auth Routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/signin.html' }),
    (req, res) => {
        // Successful authentication
        const user = req.user;
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        // Redirect to frontend with token
        res.redirect(`/index.html?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
    }
);

module.exports = router;
