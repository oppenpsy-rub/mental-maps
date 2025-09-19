import multer from 'multer';
import { Request } from 'express';
import { ApiError } from '../types/errors';

// Configure multer for audio file uploads
const storage = multer.memoryStorage(); // Store files in memory for processing

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    'audio/mpeg',     // MP3
    'audio/wav',      // WAV
    'audio/ogg',      // OGG
    'audio/mp4',      // M4A
    'audio/x-wav',    // Alternative WAV
    'audio/vorbis'    // OGG Vorbis
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(
      `Unsupported audio format: ${file.mimetype}. Allowed formats: ${allowedMimeTypes.join(', ')}`,
      400,
      'INVALID_FILE_TYPE'
    ));
  }
};

export const audioUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1 // Only one file at a time
  }
});

// Middleware to handle multer errors
export const handleUploadError = (error: any, req: Request, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          type: 'FILE_TOO_LARGE',
          message: 'File too large. Maximum size: 50MB'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          type: 'TOO_MANY_FILES',
          message: 'Only one file allowed per upload'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          type: 'UNEXPECTED_FIELD',
          message: 'Unexpected file field'
        });
      default:
        return res.status(400).json({
          type: 'UPLOAD_ERROR',
          message: error.message
        });
    }
  }
  
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      type: error.type,
      message: error.message
    });
  }

  next(error);
};