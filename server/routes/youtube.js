const express = require('express');
const router = express.Router();
const { YoutubeTranscript } = require('youtube-transcript');

// GET /api/youtube/transcript?videoId=...
router.get('/transcript', async (req, res) => {
    try {
        const { videoId } = req.query;

        if (!videoId) {
            return res.status(400).json({ error: 'Missing videoId parameter' });
        }

        const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);

        // Combine all text items into a single string
        const fullText = transcriptItems.map(item => item.text).join(' ');

        res.json({
            videoId,
            transcript: fullText
        });

    } catch (error) {
        console.error('YouTube Transcript Error:', error);

        // The youtube-transcript package throws specific errors if captions are disabled
        let errorMessage = 'Failed to fetch transcript';
        if (error.message.includes('Transcript is disabled')) {
            errorMessage = 'Transcripts are disabled for this video.';
        } else if (error.message.includes('No transcripts are available')) {
            errorMessage = 'No transcripts are available for this video.';
        }

        res.status(500).json({ error: errorMessage, details: error.message });
    }
});

module.exports = router;
