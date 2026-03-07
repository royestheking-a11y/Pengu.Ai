const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Configure multer for temporary local storage
const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'pengu-ai',
            resource_type: 'auto'
        });

        // Delete the temporary file
        fs.unlinkSync(req.file.path);

        res.json({
            url: result.secure_url,
            format: result.format,
            public_id: result.public_id
        });
    } catch (error) {
        console.error('Upload Error:', error);

        // Attempt to clean up temp file if upload failed
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({ error: 'Failed to upload file to Cloudinary' });
    }
});

module.exports = router;
