const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'assistant', 'system', 'data'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    id: {
        type: String
    },
    toolInvocations: {
        type: Array,
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const chatSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        default: 'New Conversation'
    },
    sessionType: {
        type: String,
        enum: ['general_chat', 'study_prep', 'job_prep', 'pdf_chat'],
        default: 'general_chat'
    },
    pineconeAssistantId: {
        type: String,
        required: false
    },
    mediaItems: [{
        originalName: String,
        cloudinaryUrl: String,
        uploadedAt: { type: Date, default: Date.now }
    }],
    messages: [messageSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

chatSessionSchema.pre('save', function () {
    this.updatedAt = Date.now();
});

module.exports = mongoose.model('ChatSession', chatSessionSchema);
