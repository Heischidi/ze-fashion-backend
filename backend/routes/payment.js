const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_for_ze_fashion_brand_2024_production_ready';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_PLACEHOLDER'; // TODO: User needs to update this

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

// Initialize Payment
router.post('/initialize', authMiddleware, async (req, res) => {
    const { email, amount } = req.body; // Amount in Naira

    try {
        const response = await axios.post('https://api.paystack.co/transaction/initialize', {
            email,
            amount: Math.round(amount * 100), // Convert to kobo, ensure integer
            callback_url: '', // Inline popup handles callback usually, but good practice
            metadata: {
                user_id: req.user.id
            }
        }, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        res.json(response.data.data);
    } catch (error) {
        console.error('Paystack Init Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Payment initialization failed' });
    }
});

// Verify Payment
router.get('/verify/:reference', authMiddleware, async (req, res) => {
    const { reference } = req.params;

    try {
        const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
            }
        });

        const data = response.data.data;
        if (data.status === 'success') {
            res.json({ success: true, data: data });
        } else {
            res.status(400).json({ success: false, message: 'Transaction not successful' });
        }
    } catch (error) {
        console.error('Paystack Verify Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Payment verification failed' });
    }
});

module.exports = router;
