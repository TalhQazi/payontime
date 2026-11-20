import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env.js';
import { AppError } from './errorHandler.js';

// Support serverless (e.g. Vercel, AWS Lambda) where root filesystem is read-only
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const uploadDir = isServerless
  ? path.join(os.tmpdir(), 'uploads')
  : path.resolve(env.UPLOAD_DIR);

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch {
  // Gracefully handle read-only environments
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
    } catch {}
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'image/tiff',
];

export const evidenceUpload = multer({
  storage,
  limits: {
    fileSize: env.MAX_FILE_SIZE_BYTES, // 10MB
    files: 5,
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(
        new AppError({
          statusCode: 400,
          code: 'UNSUPPORTED_FILE_TYPE',
          message:
            'Only JPEG, PNG, WEBP, PDF, and TIFF files are permitted for evidence documents.',
        })
      );
    }
    cb(null, true);
  },
});
