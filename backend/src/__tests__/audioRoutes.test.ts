import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { audioRoutes } from '../routes/audio';
import { AudioService } from '../services/AudioService';
import { authenticateToken } from '../middleware/auth';

// Mock dependencies
vi.mock('../services/AudioService');
vi.mock('../middleware/auth');
vi.mock('../middleware/validation', () => ({
    validateRequest: () => (req: any, res: any, next: any) => next()
}));
vi.mock('../middleware/upload', () => ({
    audioUpload: {
        single: () => (req: any, res: any, next: any) => {
            // Mock multer middleware
            req.file = {
                originalname: 'test-audio.mp3',
                buffer: Buffer.from('mock audio data'),
                mimetype: 'audio/mpeg',
                size: 1024
            };
            next();
        }
    },
    handleUploadError: (req: any, res: any, next: any) => next()
}));

describe('Audio Routes', () => {
    let app: express.Application;
    let mockAudioService: any;

    beforeEach(() => {
        app = express();
        app.use(express.json());

        // Mock authentication middleware
        vi.mocked(authenticateToken).mockImplementation(async (req: any, res: any, next: any) => {
            req.researcher = { id: 'researcher-123', email: 'test@example.com' };
            next();
        });

        // Create mock audio service
        mockAudioService = {
            uploadAudio: vi.fn(),
            getAudioFile: vi.fn(),
            getAudioMetadata: vi.fn(),
            updateAudioMetadata: vi.fn(),
            deleteAudio: vi.fn(),
            getAudiosByQuestion: vi.fn()
        };

        // Mock the AudioService constructor
        vi.mocked(AudioService).mockImplementation(() => mockAudioService);

        app.use('/audio', audioRoutes);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /', () => {
        it('should return API documentation', async () => {
            const response = await request(app)
                .get('/audio/')
                .expect(200);

            expect(response.body).toEqual({
                message: 'Audio management endpoints',
                endpoints: expect.any(Object)
            });
        });
    });

    describe('POST /upload', () => {
        it('should upload audio file successfully', async () => {
            // Arrange
            const mockAudioFileInfo = {
                id: 'audio-123',
                filename: 'test-audio.mp3',
                questionId: 'question-123',
                fileSize: 1024,
                metadata: {},
                createdAt: new Date()
            };

            mockAudioService.uploadAudio.mockResolvedValue(mockAudioFileInfo);

            // Act
            const response = await request(app)
                .post('/audio/upload')
                .field('questionId', 'question-123')
                .attach('audio', Buffer.from('mock audio data'), 'test-audio.mp3')
                .expect(201);

            // Assert
            expect(response.body).toEqual({
                message: 'Audio file uploaded successfully',
                data: mockAudioFileInfo
            });
            expect(mockAudioService.uploadAudio).toHaveBeenCalledWith(expect.objectContaining({
                questionId: 'question-123',
                filename: 'test-audio.mp3',
                mimetype: 'audio/mpeg',
                size: 1024
            }));
        });

        it('should return 400 if no file provided', async () => {
            // Create a simple app without the file mock to test the no-file scenario
            const testApp = express();
            testApp.use(express.json());

            // Mock auth middleware for this test
            testApp.use((req: any, res: any, next: any) => {
                req.researcher = { id: 'researcher-123', email: 'test@example.com' };
                next();
            });

            testApp.use('/audio', audioRoutes);

            const response = await request(testApp)
                .post('/audio/upload')
                .field('questionId', 'question-123')
                .expect(400);

            expect(response.body.message).toContain('No audio file provided');
        });
    });

    describe('GET /by-question/:questionId', () => {
        it('should return audio files for a question', async () => {
            // Arrange
            const questionId = 'question-123';
            const mockAudioFiles = [
                {
                    id: 'audio-1',
                    filename: 'audio1.mp3',
                    questionId,
                    fileSize: 1024,
                    metadata: {},
                    createdAt: new Date()
                }
            ];

            mockAudioService.getAudiosByQuestion.mockResolvedValue(mockAudioFiles);

            // Act
            const response = await request(app)
                .get(`/audio/by-question/${questionId}`)
                .expect(200);

            // Assert
            expect(response.body).toEqual({
                message: 'Audio files retrieved successfully',
                data: mockAudioFiles
            });
            expect(mockAudioService.getAudiosByQuestion).toHaveBeenCalledWith(questionId);
        });
    });

    describe('GET /:id', () => {
        it('should download audio file', async () => {
            // Arrange
            const audioId = 'audio-123';
            const mockAudioData = {
                buffer: Buffer.from('mock audio data'),
                mimetype: 'audio/mpeg',
                filename: 'test-audio.mp3'
            };

            mockAudioService.getAudioFile.mockResolvedValue(mockAudioData);

            // Act
            const response = await request(app)
                .get(`/audio/${audioId}`)
                .expect(200);

            // Assert
            expect(response.headers['content-type']).toBe('audio/mpeg');
            expect(response.headers['content-disposition']).toContain('attachment');
            expect(response.headers['content-disposition']).toContain('test-audio.mp3');
            expect(mockAudioService.getAudioFile).toHaveBeenCalledWith(audioId);
        });
    });

    describe('GET /:id/stream', () => {
        it('should stream audio file', async () => {
            // Arrange
            const audioId = 'audio-123';
            const mockAudioData = {
                buffer: Buffer.from('mock audio data'),
                mimetype: 'audio/mpeg',
                filename: 'test-audio.mp3'
            };

            mockAudioService.getAudioFile.mockResolvedValue(mockAudioData);

            // Act
            const response = await request(app)
                .get(`/audio/${audioId}/stream`)
                .expect(200);

            // Assert
            expect(response.headers['content-type']).toBe('audio/mpeg');
            expect(response.headers['accept-ranges']).toBe('bytes');
            expect(response.headers['cache-control']).toContain('public');
            expect(mockAudioService.getAudioFile).toHaveBeenCalledWith(audioId);
        });

        it('should handle range requests', async () => {
            // Arrange
            const audioId = 'audio-123';
            const mockBuffer = Buffer.from('mock audio data that is longer');
            const mockAudioData = {
                buffer: mockBuffer,
                mimetype: 'audio/mpeg',
                filename: 'test-audio.mp3'
            };

            mockAudioService.getAudioFile.mockResolvedValue(mockAudioData);

            // Act
            const response = await request(app)
                .get(`/audio/${audioId}/stream`)
                .set('Range', 'bytes=0-10')
                .expect(206);

            // Assert
            expect(response.headers['content-range']).toContain('bytes 0-10');
            expect(mockAudioService.getAudioFile).toHaveBeenCalledWith(audioId);
        });
    });

    describe('GET /:id/metadata', () => {
        it('should return audio metadata', async () => {
            // Arrange
            const audioId = 'audio-123';
            const mockMetadata = {
                id: audioId,
                filename: 'test-audio.mp3',
                fileSize: 1024,
                metadata: {
                    speaker: 'John Doe',
                    dialect: 'Standard German'
                },
                createdAt: new Date()
            };

            mockAudioService.getAudioMetadata.mockResolvedValue(mockMetadata);

            // Act
            const response = await request(app)
                .get(`/audio/${audioId}/metadata`)
                .expect(200);

            // Assert
            expect(response.body).toEqual({
                message: 'Audio metadata retrieved successfully',
                data: mockMetadata
            });
            expect(mockAudioService.getAudioMetadata).toHaveBeenCalledWith(audioId);
        });
    });

    describe('PUT /:id/metadata', () => {
        it('should update audio metadata', async () => {
            // Arrange
            const audioId = 'audio-123';
            const updateData = {
                speaker: 'Jane Doe',
                region: 'Bavaria'
            };
            const mockUpdatedMetadata = {
                id: audioId,
                filename: 'test-audio.mp3',
                metadata: {
                    speaker: 'Jane Doe',
                    dialect: 'Standard German',
                    region: 'Bavaria'
                }
            };

            mockAudioService.updateAudioMetadata.mockResolvedValue(mockUpdatedMetadata);

            // Act
            const response = await request(app)
                .put(`/audio/${audioId}/metadata`)
                .send(updateData)
                .expect(200);

            // Assert
            expect(response.body).toEqual({
                message: 'Audio metadata updated successfully',
                data: mockUpdatedMetadata
            });
            expect(mockAudioService.updateAudioMetadata).toHaveBeenCalledWith(audioId, updateData);
        });
    });

    describe('DELETE /:id', () => {
        it('should delete audio file', async () => {
            // Arrange
            const audioId = 'audio-123';
            mockAudioService.deleteAudio.mockResolvedValue(undefined);

            // Act
            const response = await request(app)
                .delete(`/audio/${audioId}`)
                .expect(200);

            // Assert
            expect(response.body).toEqual({
                message: 'Audio file deleted successfully'
            });
            expect(mockAudioService.deleteAudio).toHaveBeenCalledWith(audioId);
        });
    });
});