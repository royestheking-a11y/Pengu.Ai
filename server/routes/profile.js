const express = require('express');
const router = express.Router();
const ProfileSettings = require('../models/ProfileSettings');

// GET /api/profile/:userId
router.get('/:userId', async (req, res) => {
    try {
        const settings = await ProfileSettings.findOne({ userId: req.params.userId }).populate('userId', 'name email');
        if (!settings) {
            return res.status(404).json({ error: 'Profile settings not found' });
        }
        res.json(settings);
    } catch (error) {
        console.error('Fetch profile error:', error);
        res.status(500).json({ error: 'Server error fetching profile settings' });
    }
});

// PUT /api/profile/:userId
router.put('/:userId', async (req, res) => {
    try {
        const updates = req.body;
        // Only allow updating specific fields
        const allowedUpdates = {
            major: updates.major,
            academicGoals: updates.academicGoals,
            preferredLearningStyle: updates.preferredLearningStyle,
            themePreference: updates.themePreference
        };

        // Remove undefined fields
        Object.keys(allowedUpdates).forEach(key => allowedUpdates[key] === undefined && delete allowedUpdates[key]);

        const settings = await ProfileSettings.findOneAndUpdate(
            { userId: req.params.userId },
            { $set: allowedUpdates },
            { new: true, runValidators: true }
        );

        if (!settings) {
            return res.status(404).json({ error: 'Profile settings not found' });
        }

        res.json({
            message: 'Profile settings updated',
            settings
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Server error updating profile settings' });
    }
});

module.exports = router;
