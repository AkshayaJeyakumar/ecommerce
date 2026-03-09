const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const PriceHistory = require('../models/PriceHistory');
const { protect, adminOnly } = require('../middleware/auth');

// GET all products (with optional category filter)
router.get('/', async (req, res) => {
    try {
        const { category, q, sort } = req.query;
        let query = Product.find({ active: true });
        if (category && category !== 'All') query = query.where('category').equals(category);
        if (q) query = query.where('name').regex(new RegExp(q, 'i'));
        if (sort === 'price_asc') query = query.sort({ aiPrice: 1 });
        else if (sort === 'price_desc') query = query.sort({ aiPrice: -1 });
        else if (sort === 'rating') query = query.sort({ rating: -1 });
        else query = query.sort({ createdAt: -1 });
        const products = await query.lean();
        res.json(products);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET single product
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET categories
router.get('/meta/categories', async (req, res) => {
    try {
        const categories = await Product.distinct('category');
        res.json(categories);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create product (admin)
router.post('/', protect, adminOnly, async (req, res) => {
    try {
        const base = Number(req.body.basePrice);
        const product = await Product.create({
            ...req.body,
            currentPrice: base, aiPrice: base,
            priceHistory: [{ price: base }]
        });
        res.status(201).json({ success: true, product });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT update product (admin)
router.put('/:id', protect, adminOnly, async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, product });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE product (admin)
router.delete('/:id', protect, adminOnly, async (req, res) => {
    try {
        await Product.findByIdAndUpdate(req.params.id, { active: false });
        res.json({ success: true, message: 'Product removed' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT restock product (admin)
router.put('/:id/restock', protect, adminOnly, async (req, res) => {
    try {
        const qty = parseInt(req.body.quantity) || 0;
        if (qty <= 0) return res.status(400).json({ message: 'Quantity must be positive' });
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { $inc: { stock: qty, inventory: qty } },
            { new: true }
        );
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json({ success: true, product, message: `Restocked ${qty} units. New stock: ${product.stock}` });
    } catch (err) { res.status(500).json({ message: err.message }); }
});


// POST run AI simulation on all products
router.post('/ai/simulate', async (req, res) => {
    try {
        const products = await Product.find({ active: true });
        const results = [];
        for (const p of products) {
            let price = p.currentPrice;
            const reasons = [];
            if (p.demand > 80) { price *= 1.08; reasons.push('High Demand +8%'); }
            if (p.stock < 20) { price *= 1.05; reasons.push('Low Stock +5%'); }
            if (p.demand < 40) { price *= 0.93; reasons.push('Low Demand -7%'); }
            if (price > p.competitorPrice * 1.10) { price = p.competitorPrice * 1.02; reasons.push('Competitor Match'); }
            price = Math.round((price * (1 + (Math.random() - 0.5) * 0.03)) * 100) / 100;
            p.demand = Math.min(100, Math.max(5, p.demand + Math.floor((Math.random() - 0.4) * 12)));
            p.aiPrice = price;
            p.priceHistory.push({ price });
            if (p.priceHistory.length > 10) p.priceHistory.shift();
            await p.save();
            await PriceHistory.create({ product: p._id, price, reason: reasons.join(', ') || 'Routine AI update', demand: p.demand });
            results.push({ ...p.toObject(), reasons });
        }
        res.json({ success: true, products: results });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST calculate AI price (simulator)
router.post('/ai/calculate', async (req, res) => {
    try {
        const { basePrice, demand, sentiment, competitorPrice, inventory } = req.body;
        let price = parseFloat(basePrice);
        const factors = [];
        if (demand > 80) { price *= 1.08; factors.push({ label: 'High Demand', impact: '+8%', color: 'green' }); }
        else if (demand < 40) { price *= 0.92; factors.push({ label: 'Low Demand', impact: '-8%', color: 'red' }); }
        if (sentiment > 70) { price *= 1.03; factors.push({ label: 'Positive Sentiment', impact: '+3%', color: 'green' }); }
        else if (sentiment < 40) { price *= 0.95; factors.push({ label: 'Negative Sentiment', impact: '-5%', color: 'red' }); }
        if (inventory < 20) { price *= 1.05; factors.push({ label: 'Scarcity Premium', impact: '+5%', color: 'green' }); }
        const comp = parseFloat(competitorPrice);
        if (price > comp * 1.10) { price = comp * 1.02; factors.push({ label: 'Competitor Adjusted', impact: '≈2% above', color: 'yellow' }); }
        price = Math.round(price * 100) / 100;
        const changePct = Math.round(((price - basePrice) / basePrice) * 1000) / 10;
        res.json({ originalPrice: basePrice, aiPrice: price, changePct, factors });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
