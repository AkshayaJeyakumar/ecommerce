const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        price: Number,
        quantity: { type: Number, default: 1 },
        image: String,
    }],
    totalAmount: { type: Number, required: true },
    status: {
        type: String,
        enum: [
            'pending',          // just placed — waiting for admin
            'accepted',         // admin accepted
            'rejected',         // admin rejected
            'shipped',          // admin marked shipped
            'out_for_delivery', // admin marked out for delivery
            'delivered',        // user confirmed receipt
            'return_requested', // user requested return
            'returned',         // admin confirmed return
            'exchange_requested', // user requested exchange
            'exchanged',        // admin confirmed exchange
            'cancelled'         // cancelled
        ],
        default: 'pending'
    },
    paymentMethod: { type: String, default: 'card' },
    address: { street: String, city: String, state: String, pincode: String },
    adminNote: { type: String, default: '' },
    returnReason: { type: String, default: '' },
    exchangeReason: { type: String, default: '' },
    acceptedAt: Date,
    shippedAt: Date,
    outForDeliveryAt: Date,
    deliveredAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
