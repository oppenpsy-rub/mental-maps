import { Router, Request, Response, NextFunction } from 'express';
import { AudioService } from '../services/AudioService';
import { audioUpload, handleUploadError } from '../middleware/upload';
import { validateRequest } from '../middleware/validation';
import { audioUploadSchema, updateAudioMetadataSchema, audioQuerySchema } from '../validation/audioValidation';
import { ApiError } from '../types/errors';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const audioService = new AudioService();

// Audio management routes
router.get('/', (req, res) => {
  res.json({
    message: 'Audio management endpoints',
    endpoints: {
      'POST /upload': 'Upload audio file',
      'GET /': 'List audio files by question',
      'GET /:id': 'Download audio file',
      'GET /:id/metadata': 'Get audio metadata',
      'PUT /:id/metadata': 'Update audio metadata',
      'DELETE /:id': 'Delete audio file',
      'GET /:id/stream': 'Stream audio file',
    },
  });
});

// Upload audio file
router.post('/upload', 
  authenticateToken,
  audioUpload.single('audio'),
  handleUploadError,
  validateRequest(audioUploadSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw ApiError.badRequest('No audio file provided');
      }

      const { questionId, metadata } = req.body;

      const audioFileInfo = await audioService.uploadAudio({
        questionId,
        filename: req.file.originalname,
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
        size: req.file.size,
        metadata: metadata ? JSON.parse(metadata) : undefined
      });

      res.status(201).json({
        message: 'Audio file uploaded successfully',
        data: audioFileInfo
      });
    } catch (error) {
      next(error);
    }
  }
);

// List audio files by question
router.get('/by-question/:questionId',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { questionId } = req.params;
      const audioFiles = await audioService.getAudiosByQuestion(questionId);

      res.json({
        message: 'Audio files retrieved successfully',
        data: audioFiles
      });
    } catch (error) {
      next(error);
    }
  }
);

// Download audio file
router.get('/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { buffer, mimetype, filename } = await audioService.getAudioFile(id);

      res.set({
        'Content-Type': mimetype,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString()
      });

      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
);

// Stream audio file
router.get('/:id/stream',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { buffer, mimetype } = await audioService.getAudioFile(id);

      res.set({
        'Content-Type': mimetype,
        'Accept-Ranges': 'bytes',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=3600'
      });

      // Handle range requests for audio streaming
      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : buffer.length - 1;
        const chunksize = (end - start) + 1;
        const chunk = buffer.slice(start, end + 1);

        res.status(206);
        res.set({
          'Content-Range': `bytes ${start}-${end}/${buffer.length}`,
          'Content-Length': chunksize.toString()
        });
        res.send(chunk);
      } else {
        res.send(buffer);
      }
    } catch (error) {
      next(error);
    }
  }
);

// Get audio metadata
router.get('/:id/metadata',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const audioFileInfo = await audioService.getAudioMetadata(id);

      res.json({
        message: 'Audio metadata retrieved successfully',
        data: audioFileInfo
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update audio metadata
router.put('/:id/metadata',
  authenticateToken,
  validateRequest(updateAudioMetadataSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const metadata = req.body;

      const audioFileInfo = await audioService.updateAudioMetadata(id, metadata);

      res.json({
        message: 'Audio metadata updated successfully',
        data: audioFileInfo
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete audio file
router.delete('/:id',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await audioService.deleteAudio(id);

      res.json({
        message: 'Audio file deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as audioRoutes };