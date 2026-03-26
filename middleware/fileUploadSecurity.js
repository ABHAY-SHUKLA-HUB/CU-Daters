import path from 'path';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'audio/mpeg',
  'audio/mp4',
  'application/pdf'
]);

const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.gif',
  '.mp4', '.webm', '.mp3', '.m4a', '.pdf'
]);

const BLOCKED_DOUBLE_EXTENSIONS = ['.php.', '.js.', '.exe.', '.sh.', '.bat.'];

export const validateChatAttachment = (req, res, next) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ success: false, message: 'File upload required' });
  }

  const mime = String(file.mimetype || '').toLowerCase();
  const ext = path.extname(String(file.originalname || '').toLowerCase());
  const name = String(file.originalname || '').toLowerCase();

  if (!ALLOWED_MIME_TYPES.has(mime)) {
    return res.status(400).json({ success: false, message: 'Unsupported file type' });
  }

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return res.status(400).json({ success: false, message: 'Unsupported file extension' });
  }

  if (BLOCKED_DOUBLE_EXTENSIONS.some((token) => name.includes(token))) {
    return res.status(400).json({ success: false, message: 'Potentially unsafe filename' });
  }

  next();
};
