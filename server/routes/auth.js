const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ProfileSettings = require('../models/ProfileSettings');

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        // Basic validation
        if (!name || !email || !password || password.length < 8) {
            return res.status(400).json({ error: 'Invalid input data' });
        }

        // Create new user (In production, hash the password using bcrypt)
        const user = new User({ name, email, password });
        await user.save();

        // Create initial default profile settings for this user
        const profileSettings = new ProfileSettings({ userId: user._id });
        await profileSettings.save();

        res.status(201).json({
            message: 'User registered successfully',
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password (In production, use bcrypt.compare)
        if (user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        res.json({
            message: 'Login successful',
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

module.exports = router;
