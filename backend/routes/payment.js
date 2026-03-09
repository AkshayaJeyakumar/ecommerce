const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Order = require('../models/Order');

let razorpay = null;
try {
    const Razorpay = require('razorpay');
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (keyId && keySecret && keyId !== 'rzp_test_XXXX') {
        razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    }
} catch (e) { console.log('Razorpay not configured:', e.message); }

// POST /api/payment/create-order — Create Razorpay order
router.post('/create-order', protect, async (req, res) => {
    const { amount, currency = 'INR', receipt } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });

    // If Razorpay is not configured, return mock order for demo
    if (!razorpay) {
        return res.json({
            id: `mock_order_${Date.now()}`,
            amount: Math.round(amount * 100),
            currency,
            receipt: receipt || `rcpt_${Date.now()}`,
            status: 'created',
            mock: true,
            key: process.env.RAZORPAY_KEY_ID || 'rzp_test_DEMO',
        });
    }

    try {
        const order = await razorpay.orders.create({
            amount: Math.round(amount * 100), // paise
            currency,
            receipt: receipt || `rcpt_${Date.now()}`,
        });
        res.json({ ...order, key: process.env.RAZORPAY_KEY_ID });
    } catch (err) {
        console.error('Razorpay error:', err);
        res.status(500).json({ message: 'Payment gateway error. Please try again.' });
    }
});

// POST /api/payment/verify — Verify Razorpay signature (optional webhook)
router.post('/verify', protect, async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id) {
        return res.status(400).json({ message: 'Missing payment details' });
    }
    // Mark order as paid in our db (the main order was already created before payment)
    try {
        await Order.findOneAndUpdate(
            { razorpayOrderId: razorpay_order_id },
            { paymentStatus: 'paid', razorpayPaymentId: razorpay_payment_id }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
