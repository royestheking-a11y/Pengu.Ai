const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const { generateText } = require('ai');
const { createGoogleGenerativeAI } = require('@ai-sdk/google');
const ChatSession = require('../models/ChatSession');

// Initialize AI provider
const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// Configure multer for temporary local storage
const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('file'), async (req, res) => {
    try {
        const { jobDescription, sessionId, userId, cvText } = req.body;

        if (!jobDescription || !jobDescription.trim()) {
            return res.status(400).json({ error: 'Job Description is required' });
        }

        if (!req.file && (!cvText || !cvText.trim())) {
            return res.status(400).json({ error: 'CV text or file is required' });
        }

        let reportData = null;
        let fileBuffer = null;

        if (req.file) {
            console.log(`[JobPrep] Processing uploaded CV: ${req.file.originalname}`);

            // Upload CV to Cloudinary
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'pengu-ai-cvs',
                resource_type: 'auto'
            });

            // Clean up temp file
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            console.log(`[JobPrep] CV uploaded to Cloudinary: ${result.secure_url}`);

            const fileResponse = await fetch(result.secure_url);
            fileBuffer = await fileResponse.arrayBuffer();
        } else {
            console.log(`[JobPrep] Processing pasted CV text.`);
        }

        // Use Gemini 1.5 Pro to analyze the CV PDF and the Job Description
        try {

            const analysis = await generateText({
                model: google('gemini-2.5-flash'),
                system: `You are an expert Tech Recruiter with 15 years of industry experience.
                You will be provided with a candidate's CV (as a document or text) and a target Job Description.
                Your task is to analyze the candidate's fit for the role.
                You MUST return the output EXACTLY as a valid JSON object.
                Do not output any markdown formatting, no \`\`\`json, just the raw JSON object.
                The JSON object must EXACTLY match this structure:
                {
                  "matchRate": 78, // a number between 0 and 100
                  "shortlistChance": "High", // High, Medium, or Low
                  "missingKeywords": ["React Native", "Agile Management"], // array of crucial skills in the JD that are missing from the CV
                  "interviewQuestions": ["Tell me about a time you...", "How would you optimize..."], // array of 3-5 specific technical or behavioral questions based on the gaps or key aspects of the role
                  "emailDraft": "Dear Hiring Manager..." // a confident, professional cover letter email draft (150-200 words) tailored to the role and candidate's strengths
                }`,
                messages: fileBuffer ? [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: `Here is the Job Description:\n\n${jobDescription}\n\nPlease analyze my CV against this JD and return the JSON report.`
                            },
                            {
                                type: 'file',
                                data: Buffer.from(fileBuffer),
                                mimeType: 'application/pdf'
                            }
                        ]
                    }
                ] : [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: `Here is the Job Description:\n\n${jobDescription}\n\nHere is my CV text:\n\n${cvText}\n\nPlease analyze my CV against this JD and return the JSON report.`
                            }
                        ]
                    }
                ]
            });

            let reportJson = analysis.text.trim();

            // Safety cleanup if the LLM wrapped it in markdown
            if (reportJson.startsWith('```json')) {
                reportJson = reportJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (reportJson.startsWith('```')) {
                reportJson = reportJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }

            reportData = JSON.parse(reportJson);
            console.log(`[JobPrep] Report generated successfully with match rate: ${reportData.matchRate}%`);

        } catch (err) {
            console.error("[JobPrep] Gemini Analysis failed:", err);
            throw err;
        }

        // Save session context to history
        if (userId && sessionId && reportData) {
            try {
                const session = await ChatSession.findById(sessionId);
                if (session) {
                    session.messages.push({
                        role: 'user',
                        content: `Uploaded my CV and analyzed it against a Job Description.\n\nJob snippet: "${jobDescription.substring(0, 100)}..."`
                    });

                    session.messages.push({
                        role: 'assistant',
                        content: `I've analyzed your CV! You have a **${reportData.matchRate}% Match Rate** (${reportData.shortlistChance} chance of shortlisting).\n\n**Missing Keywords to add:** ${reportData.missingKeywords.join(', ') || 'None!'}`
                    });

                    await session.save();
                }
            } catch (dbErr) {
                console.error("[JobPrep] Failed to save to session history:", dbErr);
            }
        }

        res.json({ success: true, report: reportData });

    } catch (error) {
        console.error('[JobPrep Error]:', error);

        // Cleanup temp file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({ error: 'Failed to generate job prep analysis', details: error.message });
    }
});

module.exports = router;
