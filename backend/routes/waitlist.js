const express = require('express');
const router = express.Router();
const { sendWaitlistWelcome } = require('../utils/email');

// POST /api/waitlist
router.post('/', async (req, res) => {
    const { email, firstName, lastName } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    // Generate Ticket ID (8 chars alphanumeric)
    const ticketId = Math.random().toString(36).substring(2, 10).toUpperCase();

    // Ideally save to DB here (e.g., Waitlist table)
    // For now, just send the email

    try {
        const sent = await sendWaitlistWelcome(email, firstName, lastName, ticketId);
        if (sent) {
            res.json({ success: true, message: 'Joined waitlist successfully' });
        } else {
            res.status(500).json({ error: 'Failed to send confirmation email' });
        }
    } catch (error) {
        console.error('Waitlist API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
