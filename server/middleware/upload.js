const multer = require('multer');
const path = require('node:path');
const crypto = require('node:crypto');
const fs = require('node:fs');

const isVercel = Boolean(process.env.VERCEL);
const uploadDir = isVercel ? '/tmp/uploads' : path.join(__dirname, '../../uploads');

try {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
} catch (e) {
    // Silently handle read-only filesystems in serverless
}

// Allowed MIME types and extensions
const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/svg+xml',
    'image/gif',
    'video/mp4',
    'video/webm'
]);

const ALLOWED_EXTENSIONS = new Set([
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
    '.svg',
    '.gif',
    '.mp4',
    '.webm'
]);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const safeBaseName = crypto.randomUUID();
        cb(null, `${Date.now()}-${safeBaseName}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype.toLowerCase();

    if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME_TYPES.has(mime)) {
        return cb(new Error('Unsupported file format. Allowed: JPG, PNG, WEBP, SVG, GIF, MP4, WEBM'));
    }
    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 25 * 1024 * 1024, // 25 MB max
        files: 20 // max 20 files at once
    }
});

module.exports = upload;
