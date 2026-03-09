const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

// ─── GET my orders ─────────────────────────────────────────────────────────
router.get('/my', protect, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .populate('items.product', 'name image category')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── GET all orders (admin) ────────────────────────────────────────────────
router.get('/all', protect, adminOnly, async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('user', 'name email')
            .populate('items.product', 'name image category stock inventory')
            .sort({ createdAt: -1 })
            .limit(200);
        res.json(orders);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── POST create order ─────────────────────────────────────────────────────
router.post('/', protect, async (req, res) => {
    try {
        const { items, address, paymentMethod } = req.body;
        let totalAmount = 0;
        const enrichedItems = [];

        for (const item of items) {
            const productId = item.product || item.productId;
            const product = await Product.findById(productId);
            if (!product) continue;
            const qty = item.quantity || 1;
            const price = item.price || product.aiPrice;
            totalAmount += price * qty;
            enrichedItems.push({
                product: product._id,
                name: item.name || product.name,
                price,
                quantity: qty,
                image: item.image || product.image,
            });
        }

        if (enrichedItems.length === 0) {
            return res.status(400).json({ message: 'No valid items in order' });
        }

        const order = await Order.create({
            user: req.user._id,
            items: enrichedItems,
            totalAmount,
            address: address || { street: 'My Address', city: 'City', state: 'State', pincode: '000000' },
            paymentMethod: paymentMethod || 'card',
            status: 'pending',  // ← always start as pending
        });

        // Decrement stock immediately when ordered
        for (const item of enrichedItems) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: -item.quantity, inventory: -item.quantity }
            });
        }

        // Mark user as verified customer
        await User.findByIdAndUpdate(req.user._id, { verifiedCustomer: true });
        res.status(201).json({ success: true, order });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── ADMIN: Accept order ───────────────────────────────────────────────────
router.put('/:id/accept', protect, adminOnly, async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(req.params.id,
            { status: 'accepted', acceptedAt: new Date(), adminNote: req.body.note || '' },
            { new: true }
        ).populate('user', 'name email');
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json({ success: true, order });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── ADMIN: Reject order ───────────────────────────────────────────────────
router.put('/:id/reject', protect, adminOnly, async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(req.params.id,
            { status: 'rejected', adminNote: req.body.note || 'Order rejected by admin' },
            { new: true }
        );
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json({ success: true, order });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── ADMIN: Mark shipped ───────────────────────────────────────────────────
router.put('/:id/ship', protect, adminOnly, async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(req.params.id,
            { status: 'shipped', shippedAt: new Date() },
            { new: true }
        );
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json({ success: true, order });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── ADMIN: Mark out for delivery ─────────────────────────────────────────
router.put('/:id/out-for-delivery', protect, adminOnly, async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(req.params.id,
            { status: 'out_for_delivery', outForDeliveryAt: new Date() },
            { new: true }
        );
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json({ success: true, order });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── USER: Confirm delivery ─────────────────────────────────────────────────
router.put('/:id/confirm-delivery', protect, async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (!['shipped', 'out_for_delivery'].includes(order.status)) {
            return res.status(400).json({ message: 'Order is not yet out for delivery' });
        }
        order.status = 'delivered';
        order.deliveredAt = new Date();
        await order.save();

        // Decrement stock for each product
        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: -item.quantity, inventory: -item.quantity }
            });
        }

        res.json({ success: true, order });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── USER: Request return ───────────────────────────────────────────────────
router.put('/:id/return', protect, async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (order.status !== 'delivered') {
            return res.status(400).json({ message: 'Can only return a delivered order' });
        }
        order.status = 'return_requested';
        order.returnReason = req.body.reason || 'Customer requested return';
        await order.save();
        res.json({ success: true, order });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── USER: Request exchange ─────────────────────────────────────────────────
router.put('/:id/exchange', protect, async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (order.status !== 'delivered') {
            return res.status(400).json({ message: 'Can only exchange a delivered order' });
        }
        order.status = 'exchange_requested';
        order.exchangeReason = req.body.reason || 'Customer requested exchange';
        await order.save();
        res.json({ success: true, order });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── ADMIN: Confirm return ──────────────────────────────────────────────────
router.put('/:id/confirm-return', protect, adminOnly, async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(req.params.id,
            { status: 'returned' }, { new: true }
        );
        // Restock inventory
        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: item.quantity, inventory: item.quantity }
            });
        }
        res.json({ success: true, order });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── ADMIN: Confirm exchange ────────────────────────────────────────────────
router.put('/:id/confirm-exchange', protect, adminOnly, async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(req.params.id,
            { status: 'exchanged' }, { new: true }
        );
        res.json({ success: true, order });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── WISHLIST — toggle ──────────────────────────────────────────────────────
router.post('/wishlist/:productId', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const pid = req.params.productId;
        const idx = user.wishlist.findIndex(id => id.toString() === pid);
        if (idx > -1) user.wishlist.splice(idx, 1);
        else user.wishlist.push(pid);
        await user.save();
        res.json({ success: true, wishlist: user.wishlist });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── GET wishlist ───────────────────────────────────────────────────────────
router.get('/wishlist', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('wishlist');
        res.json(user.wishlist);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
