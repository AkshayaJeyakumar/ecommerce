const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

// GET reviews for a product
router.get('/product/:productId', async (req, res) => {
    try {
        const reviews = await Review.find({ product: req.params.productId })
            .populate('user', 'name').sort({ createdAt: -1 });
        const pos = reviews.filter(r => r.sentiment === 'positive').length;
        const neg = reviews.filter(r => r.sentiment === 'negative').length;
        const neu = reviews.filter(r => r.sentiment === 'neutral').length;
        const score = reviews.length ? Math.round((pos / reviews.length) * 100) : 0;
        res.json({ reviews, summary: { positive: pos, negative: neg, neutral: neu, total: reviews.length, score } });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET all reviews (for sentiment dashboard) - supports ?productId=xxx filter
router.get('/', async (req, res) => {
    try {
        const { productId } = req.query;
        let query = Review.find();
        if (productId) query = query.where('product').equals(productId);
        const reviews = await query
            .populate('user', 'name')
            .populate('product', 'name category')
            .sort({ createdAt: -1 })
            .limit(100);
        const pos = reviews.filter(r => r.sentiment === 'positive').length;
        const neg = reviews.filter(r => r.sentiment === 'negative').length;
        const neu = reviews.filter(r => r.sentiment === 'neutral').length;
        res.json({ reviews, summary: { positive: pos, negative: neg, neutral: neu, total: reviews.length, score: reviews.length ? Math.round(pos / reviews.length * 100) : 0 } });
    } catch (err) { res.status(500).json({ message: err.message }); }
});


// POST create review (must be logged in)
router.post('/', protect, async (req, res) => {
    try {
        const { productId, rating, reviewText } = req.body;
        // Check if user purchased this product
        const order = await Order.findOne({ user: req.user._id, 'items.product': productId, status: 'delivered' });
        const verifiedPurchase = !!order;
        const review = await Review.create({
            product: productId, user: req.user._id,
            rating: Number(rating), reviewText, verifiedPurchase
        });
        // Update product rating
        const allReviews = await Review.find({ product: productId });
        const avgRating = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
        const sentScore = Math.round((allReviews.filter(r => r.sentiment === 'positive').length / allReviews.length) * 100);
        await Product.findByIdAndUpdate(productId, { rating: Math.round(avgRating * 10) / 10, reviewCount: allReviews.length, sentimentScore: sentScore });
        const populated = await review.populate('user', 'name');
        res.status(201).json({ success: true, review: populated });
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ message: 'You already reviewed this product' });
        res.status(500).json({ message: err.message });
    }
});

// PUT edit review
router.put('/:id', protect, async (req, res) => {
    try {
        const review = await Review.findOne({ _id: req.params.id, user: req.user._id });
        if (!review) return res.status(404).json({ message: 'Review not found or not yours' });
        review.rating = req.body.rating || review.rating;
        review.reviewText = req.body.reviewText || review.reviewText;
        await review.save();
        res.json({ success: true, review });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE review
router.delete('/:id', protect, async (req, res) => {
    try {
        const review = await Review.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!review) return res.status(404).json({ message: 'Review not found or not yours' });
        res.json({ success: true, message: 'Review deleted' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
