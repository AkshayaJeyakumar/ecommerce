const mongoose = require('mongoose');

const PriceHistorySchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    price: { type: Number, required: true },
    reason: { type: String, default: 'AI adjustment' },
    factors: [{ label: String, impact: String }],
    demand: Number,
    sentiment: Number,
    inventory: Number,
}, { timestamps: true });

module.exports = mongoose.model('PriceHistory', PriceHistorySchema);
