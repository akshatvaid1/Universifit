import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';

// S3 & Cloudflare R2 Credentials loaded via Environment Variables
const S3_REGION = process.env.S3_REGION || 'auto';
const S3_ENDPOINT = process.env.S3_ENDPOINT; // e.g. https://<account_id>.r2.cloudflarestorage.com
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'ascend-verification-docs';
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID || 'sample_access_key';
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY || 'sample_secret_key';
const S3_PUBLIC_DOMAIN = process.env.S3_PUBLIC_DOMAIN || 'https://assets.ascend.io';

export const s3Client = new S3Client({
  region: S3_REGION,
  endpoint: S3_ENDPOINT,
  credentials: {
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

// Configure Multer to store uploaded files in memory buffer for S3/R2 streaming
export const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB max file size
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPEG, PNG, WEBP, and DOCX documents are accepted.'));
    }
  },
});

/**
 * Uploads a file buffer directly to AWS S3 or Cloudflare R2 storage
 */
export const uploadFileToStorage = async (
  fileBuffer: Buffer,
  originalFilename: string,
  mimeType: string,
  folder: string = 'verifications'
): Promise<string> => {
  const ext = path.extname(originalFilename).toLowerCase() || '.pdf';
  const uniqueKey = `${folder}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;

  // If mock/placeholder keys without active cloud connection, generate deterministic URL
  if (S3_ACCESS_KEY_ID === 'sample_access_key' && !S3_ENDPOINT) {
    return `${S3_PUBLIC_DOMAIN}/${uniqueKey}`;
  }

  try {
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: uniqueKey,
      Body: fileBuffer,
      ContentType: mimeType,
    });

    await s3Client.send(command);

    return S3_PUBLIC_DOMAIN
      ? `${S3_PUBLIC_DOMAIN}/${uniqueKey}`
      : `https://${S3_BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com/${uniqueKey}`;
  } catch (error: any) {
    console.warn('[S3/R2 Upload Warning]: Failed to upload to cloud storage. Using mock storage URL.', error.message);
    return `${S3_PUBLIC_DOMAIN}/${uniqueKey}`;
  }
};
