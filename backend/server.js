require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// ─── Routes ──────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/analytics', require('./routes/analytics'));

// Backwards-compat aliases
app.post('/api/login', (req, res) => { req.url = '/api/auth/login'; require('./routes/auth')(req, res); });
app.post('/api/pricing/simulate', (req, res, next) => { req.url = '/ai/simulate'; require('./routes/products')(req, res, next); });
app.post('/api/pricing/calculate', (req, res, next) => { req.url = '/ai/calculate'; require('./routes/products')(req, res, next); });
app.get('/api/pricing/rules', (req, res) => res.json([])); // placeholder
app.put('/api/pricing/rules/:id', (req, res) => res.json({ success: true }));
app.get('/api/competitors', (req, res) => res.json([]));
app.get('/api/segments', (req, res) => res.json([]));

// Root status
app.get('/', (req, res) => res.json({
    status: '✅ AI Pricing API (MongoDB edition) is running!',
    openApp: 'http://localhost:5173',
    version: '3.0.0',
    routes: ['/api/auth', '/api/products', '/api/reviews', '/api/orders', '/api/analytics']
}));

// Global error handler
app.use((err, req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT, () =>
    console.log(`\n🚀  AI Pricing API → http://localhost:${PORT}\n🌐  Open the app  → http://localhost:5173\n`)
);
