// src/backend/middleware/multer.js
/**
 * Multer Configuration
 * Handles file uploads (images, screenshots)
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../..', 'uploads', 'screenshots');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed MIME types
  const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG and PNG files are allowed'), false);
  }
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Error handler middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size exceeds 5MB limit' });
    }
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({ message: 'File is too large' });
    }
    return res.status(400).json({ message: err.message });
  }
  
  if (err.message) {
    return res.status(400).json({ message: err.message });
  }
  
  next();
};

module.exports = upload;
module.exports.handleMulterError = handleMulterError;
