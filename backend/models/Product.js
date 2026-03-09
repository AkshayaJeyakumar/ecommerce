const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true, index: true },
    subCategory: { type: String },
    image: { type: String, default: '' },
    description: { type: String, default: '' },
    basePrice: { type: Number, required: true },
    currentPrice: { type: Number, required: true },
    aiPrice: { type: Number, required: true },
    competitorPrice: { type: Number, required: true },
    demand: { type: Number, default: 50, min: 0, max: 100 },
    stock: { type: Number, default: 100 },
    inventory: { type: Number, default: 100 },
    rating: { type: Number, default: 4.0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    sentimentScore: { type: Number, default: 65, min: 0, max: 100 },
    priceHistory: [{ price: Number, date: { type: Date, default: Date.now } }],
    tags: [String],
    active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
