const mongoose = require('mongoose');

const profileSettingsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    major: {
        type: String,
        trim: true,
        default: ''
    },
    academicGoals: {
        type: String,
        trim: true,
        default: ''
    },
    preferredLearningStyle: {
        type: String,
        enum: ['visual', 'auditory', 'reading/writing', 'kinesthetic', ''],
        default: ''
    },
    themePreference: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

profileSettingsSchema.pre('save', function () {
    this.updatedAt = Date.now();
});

module.exports = mongoose.model('ProfileSettings', profileSettingsSchema);
