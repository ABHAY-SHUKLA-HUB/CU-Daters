import fs from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';

const PRIVATE_VERIFICATION_DIR = path.join(process.cwd(), 'private_uploads', 'verification');

const MIME_EXTENSION_MAP = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',  // Some browsers send image/jpg instead of image/jpeg
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'application/pdf': 'pdf'
};

let ensured = false;

const ensurePrivateDir = async () => {
  if (ensured) return;
  await fs.mkdir(PRIVATE_VERIFICATION_DIR, { recursive: true });
  ensured = true;
};

export const parseDataUrl = (dataUrl) => {
  const value = String(dataUrl || '').trim();
  const match = value.match(/^data:([^;,]+)(?:;[^,]*)?,(.+)$/);
  if (!match) {
    throw new Error('Unsupported file format. Use base64 data URL.');
  }

  let mimeType = String(match[1] || '').toLowerCase().trim();
  const base64Payload = match[2] || '';

  // Remove charset if present
  if (mimeType.includes(';')) {
    mimeType = mimeType.split(';')[0].trim();
  }

  const buffer = Buffer.from(base64Payload, 'base64');

  if (!buffer.length) {
    throw new Error('Uploaded file is empty');
  }

  console.log('[PARSE] Detected MIME type:', mimeType);

  return { mimeType, buffer };
};

export const saveVerificationMediaFromDataUrl = async ({ userId, documentType, dataUrl, maxBytes = 8 * 1024 * 1024 }) => {
  try {
    await ensurePrivateDir();

    const { mimeType, buffer } = parseDataUrl(dataUrl);

    // Support multiple MIME type variants
    const allowedTypes = new Set([
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
      'application/pdf',
      'application/octet-stream' // Fallback: some browsers send this for valid images
    ]);

    // If octet-stream, try to validate by extension if storageKey has extension
    let finalMimeType = mimeType;
    const extensionMap = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'heic': 'image/heic',
      'heif': 'image/heif',
      'pdf': 'application/pdf'
    };

    if (!allowedTypes.has(mimeType)) {
      console.error('[STORAGE] Unsupported MIME type:', mimeType);
      console.error('[STORAGE] Allowed types:', Array.from(allowedTypes));
      throw new Error(`Unsupported file format: ${mimeType}. Allowed: JPG, PNG, WEBP, HEIC or PDF`);
    }

    if (buffer.length > maxBytes) {
      throw new Error('File is too large. Max allowed size is 8MB');
    }

    const extension = MIME_EXTENSION_MAP[finalMimeType] || (MIME_EXTENSION_MAP[mimeType] !== undefined ? MIME_EXTENSION_MAP[mimeType] : 'bin');
    const randomPart = randomBytes(12).toString('hex');
    const safeDocumentType = String(documentType || 'document').replace(/[^a-z0-9_-]/gi, '').toLowerCase();
    const safeUserId = String(userId || 'unknown').replace(/[^a-z0-9_-]/gi, '').toLowerCase();
    const relativeStorageKey = `${safeUserId}/${safeDocumentType}-${Date.now()}-${randomPart}.${extension}`;
    const absolutePath = path.join(PRIVATE_VERIFICATION_DIR, relativeStorageKey);

    console.log('[STORAGE] Saving file:', {
      mimeType,
      finalMimeType,
      extension,
      sizeBytes: buffer.length,
      path: relativeStorageKey
    });

    try {
      await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    } catch (mkdirErr) {
      console.error('[STORAGE] Failed to create directory:', path.dirname(absolutePath), mkdirErr);
      throw new Error('Unable to create storage directory. Please contact support.');
    }

    try {
      await fs.writeFile(absolutePath, buffer);
    } catch (writeErr) {
      console.error('[STORAGE] Failed to write file:', absolutePath, writeErr);
      throw new Error('Unable to save file. Please contact support.');
    }

    console.log(`[STORAGE] File saved successfully: ${relativeStorageKey}`);

    return {
      storageKey: relativeStorageKey,
      mimeType: finalMimeType,
      sizeBytes: buffer.length
    };
  } catch (err) {
    console.error('[STORAGE ERROR]', err.message);
    throw err;
  }
};

export const resolveVerificationMediaPath = (storageKey) => {
  const normalized = path.normalize(String(storageKey || '')).replace(/^([/\\])+/, '');
  if (!normalized || normalized.includes('..')) {
    throw new Error('Invalid storage key');
  }
  return path.join(PRIVATE_VERIFICATION_DIR, normalized);
};
