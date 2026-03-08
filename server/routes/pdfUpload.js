const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const { Pinecone } = require('@pinecone-database/pinecone');
const cloudinary = require('cloudinary').v2;
const ChatSession = require('../models/ChatSession');

// Initialize Pinecone
const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY
});

// Use multer exclusively for temporarily handling the local PDF before sending it to Pinecone
const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('file'), async (req, res) => {
    try {
        const { sessionId, userId } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file provided.' });
        }

        console.log(`[Pinecone Upload] Processing textbook: ${req.file.originalname}`);

        // 1. Create a unique Pinecone Assistant
        const assistantName = `pdf-chat-${Date.now()}`;
        console.log(`[Pinecone Upload] Creating new assistant: ${assistantName}`);

        await pc.createAssistant({
            name: assistantName,
            instructions: "You are an expert tutor answering questions based EXCLUSIVELY on the uploaded textbook/PDF document. Do not use outside knowledge. Answer clearly, accurately, and mention which sections or themes you are pulling from if relevant.",
            timeout: 30
        });

        const assistant = pc.assistant(assistantName);

        // 2. Upload the chunked PDF directly into the Assistant
        console.log(`[Pinecone Upload] Uploading and vectorizing document into assistant: ${assistantName}`);
        await assistant.uploadFile({
            filePath: req.file.path,
            timeout: 120 // Allow 2 minutes for large textbook embedding
        });

        // 3. Simultaneously upload to Cloudinary for permanent storage
        console.log(`[Pinecone Upload] Uploading to Cloudinary for permanent storage...`);
        const cloudinaryResult = await cloudinary.uploader.upload(req.file.path, {
            folder: 'pengu-ai-textbooks',
            resource_type: 'raw' // PDF is 'raw' in Cloudinary to preserve format
        });
        const pdfUrl = cloudinaryResult.secure_url;
        console.log(`[Pinecone Upload] Cloudinary URL: ${pdfUrl}`);

        // Clean up the temporary local file early
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
            console.log(`[Pinecone Upload] Cleaned up temporary local file.`);
        }

        // 3. Connect to MongoDB Session
        let finalSessionId = sessionId;

        // If it's a new interaction entirely and we don't have a valid mongoose id, create one
        if (userId && (!sessionId || sessionId === 'new' || typeof sessionId !== 'string')) {
            const newSession = new ChatSession({
                userId,
                title: `PDF Chat: ${req.file.originalname.substring(0, 30)}`,
                sessionType: 'pdf_chat',
                pineconeAssistantId: assistantName,
                mediaItems: [{
                    originalName: req.file.originalname,
                    cloudinaryUrl: pdfUrl
                }],
                messages: [
                    {
                        role: 'user',
                        content: `I uploaded the textbook: ${req.file.originalname}`
                    },
                    {
                        role: 'assistant',
                        content: `I have thoroughly read and indexed the textbook *${req.file.originalname}* using our proprietary intelligence system! You can now ask me any specific questions about it, and I will instantly retrieve the relevant sections to answer you. What would you like to explore?`
                    }
                ]
            });
            await newSession.save();
            finalSessionId = newSession._id.toString();
        } else if (sessionId && typeof sessionId === 'string') {
            // Upgrading an existing empty session shell to a PDF chat
            const existingSession = await ChatSession.findById(sessionId);
            if (existingSession) {
                existingSession.sessionType = 'pdf_chat';
                existingSession.pineconeAssistantId = assistantName;
                existingSession.title = `PDF Chat: ${req.file.originalname.substring(0, 30)}`;
                existingSession.mediaItems.push({
                    originalName: req.file.originalname,
                    cloudinaryUrl: pdfUrl
                });
                existingSession.messages.push({
                    role: 'user',
                    content: `I uploaded the textbook: ${req.file.originalname}`
                });
                existingSession.messages.push({
                    role: 'assistant',
                    content: `I have thoroughly read and indexed the textbook *${req.file.originalname}* using our proprietary intelligence system! What would you like to explore?`
                });
                await existingSession.save();
            }
        }

        res.json({
            success: true,
            assistantId: assistantName,
            sessionId: finalSessionId
        });

    } catch (error) {
        console.error('[Pinecone Upload Error]:', error);

        // Ensure cleanup if an error occurs early
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({ error: 'Intelligent Indexing failed. Please check the file format.' });
    }
});

module.exports = router;
