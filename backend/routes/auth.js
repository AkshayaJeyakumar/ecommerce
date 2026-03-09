const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { signToken, protect } = require('../middleware/auth');

// REGISTER
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password) return res.status(400).json({ success: false, message: 'All fields required' });

        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });

        const user = await User.create({ name, email, password, role: role === 'admin' ? 'admin' : 'customer' });
        const token = signToken(user._id);

        res.status(201).json({
            success: true,
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role, segment: user.segment }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const token = signToken(user._id);
        res.json({
            success: true,
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role, segment: user.segment }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET PROFILE
router.get('/me', protect, async (req, res) => {
    res.json({ success: true, user: req.user });
});

// UPDATE PROFILE
router.put('/me', protect, async (req, res) => {
    try {
        const { name, segment } = req.body;
        const user = await User.findByIdAndUpdate(req.user._id, { name, segment }, { new: true }).select('-password');
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
