const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    reviewText: { type: String, required: true, minlength: 10 },
    sentiment: { type: String, enum: ['positive', 'neutral', 'negative'], default: 'neutral' },
    verifiedPurchase: { type: Boolean, default: false },
    helpful: { type: Number, default: 0 },
}, { timestamps: true });

// One review per user per product
ReviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Auto-detect sentiment from rating
ReviewSchema.pre('save', function () {
    if (this.rating >= 4) this.sentiment = 'positive';
    else if (this.rating === 3) this.sentiment = 'neutral';
    else this.sentiment = 'negative';
});

module.exports = mongoose.model('Review', ReviewSchema);
