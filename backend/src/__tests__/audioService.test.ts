import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AudioService, AudioUploadData } from '../services/AudioService';
import { repositories } from '../repositories';
import { ApiError } from '../types/errors';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock dependencies
vi.mock('../repositories');
vi.mock('fs/promises');

describe('AudioService', () => {
  let audioService: AudioService;
  let mockQuestionRepository: any;
  let mockAudioRepository: any;

  beforeEach(() => {
    audioService = new AudioService();
    mockQuestionRepository = {
      findById: vi.fn()
    };
    mockAudioRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByQuestionId: vi.fn(),
      updateMetadata: vi.fn(),
      delete: vi.fn()
    };

    (repositories as any).questions = mockQuestionRepository;
    (repositories as any).audio = mockAudioRepository;

    // Mock fs operations
    vi.mocked(fs.access).mockResolvedValue(undefined);
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    vi.mocked(fs.readFile).mockResolvedValue(Buffer.from('mock audio data'));
    vi.mocked(fs.unlink).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadAudio', () => {
    const validUploadData: AudioUploadData = {
      questionId: '123e4567-e89b-12d3-a456-426614174000',
      filename: 'test-audio.mp3',
      buffer: Buffer.from('mock audio data'),
      mimetype: 'audio/mpeg',
      size: 1024,
      metadata: {
        speaker: 'John Doe',
        dialect: 'Standard German'
      }
    };

    it('should upload audio file successfully', async () => {
      // Arrange
      const mockQuestion = { id: validUploadData.questionId, title: 'Test Question' };
      const mockAudioStimulus = {
        id: 'audio-123',
        questionId: validUploadData.questionId,
        filename: validUploadData.filename,
        filePath: expect.any(String),
        fileSize: validUploadData.size,
        durationSeconds: undefined,
        metadata: {
          format: validUploadData.mimetype,
          ...validUploadData.metadata
        },
        createdAt: new Date()
      };

      mockQuestionRepository.findById.mockResolvedValue(mockQuestion);
      mockAudioRepository.create.mockResolvedValue(mockAudioStimulus);

      // Act
      const result = await audioService.uploadAudio(validUploadData);

      // Assert
      expect(mockQuestionRepository.findById).toHaveBeenCalledWith(validUploadData.questionId);
      expect(mockAudioRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        questionId: validUploadData.questionId,
        filename: validUploadData.filename,
        fileSize: validUploadData.size,
        metadata: expect.objectContaining({
          format: validUploadData.mimetype,
          speaker: 'John Doe',
          dialect: 'Standard German'
        })
      }));
      expect(fs.writeFile).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        id: 'audio-123',
        filename: validUploadData.filename,
        questionId: validUploadData.questionId
      }));
    });

    it('should throw error if question not found', async () => {
      // Arrange
      mockQuestionRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(audioService.uploadAudio(validUploadData)).rejects.toThrow(ApiError);
      expect(mockQuestionRepository.findById).toHaveBeenCalledWith(validUploadData.questionId);
    });

    it('should validate file mimetype', async () => {
      // Arrange
      const invalidUploadData = {
        ...validUploadData,
        mimetype: 'image/jpeg'
      };

      // Act & Assert
      await expect(audioService.uploadAudio(invalidUploadData)).rejects.toThrow(ApiError);
    });

    it('should validate file size', async () => {
      // Arrange
      const largeFileData = {
        ...validUploadData,
        size: 60 * 1024 * 1024 // 60MB
      };

      // Act & Assert
      await expect(audioService.uploadAudio(largeFileData)).rejects.toThrow(ApiError);
    });

    it('should validate empty file', async () => {
      // Arrange
      const emptyFileData = {
        ...validUploadData,
        buffer: Buffer.alloc(0)
      };

      // Act & Assert
      await expect(audioService.uploadAudio(emptyFileData)).rejects.toThrow(ApiError);
    });

    it('should clean up file if database operation fails', async () => {
      // Arrange
      const mockQuestion = { id: validUploadData.questionId, title: 'Test Question' };
      mockQuestionRepository.findById.mockResolvedValue(mockQuestion);
      mockAudioRepository.create.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(audioService.uploadAudio(validUploadData)).rejects.toThrow('Database error');
      expect(fs.unlink).toHaveBeenCalled();
    });
  });

  describe('getAudioFile', () => {
    it('should return audio file data', async () => {
      // Arrange
      const audioId = 'audio-123';
      const mockAudioStimulus = {
        id: audioId,
        filename: 'test-audio.mp3',
        filePath: '/path/to/audio.mp3',
        metadata: { format: 'audio/mpeg' }
      };
      const mockBuffer = Buffer.from('mock audio data');

      mockAudioRepository.findById.mockResolvedValue(mockAudioStimulus);
      vi.mocked(fs.readFile).mockResolvedValue(mockBuffer);

      // Act
      const result = await audioService.getAudioFile(audioId);

      // Assert
      expect(result).toEqual({
        buffer: mockBuffer,
        mimetype: 'audio/mpeg',
        filename: 'test-audio.mp3'
      });
    });

    it('should throw error if audio not found', async () => {
      // Arrange
      mockAudioRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(audioService.getAudioFile('nonexistent')).rejects.toThrow(ApiError);
    });

    it('should throw error if file not accessible', async () => {
      // Arrange
      const mockAudioStimulus = {
        id: 'audio-123',
        filename: 'test-audio.mp3',
        filePath: '/path/to/audio.mp3',
        metadata: { format: 'audio/mpeg' }
      };

      mockAudioRepository.findById.mockResolvedValue(mockAudioStimulus);
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'));

      // Act & Assert
      await expect(audioService.getAudioFile('audio-123')).rejects.toThrow(ApiError);
    });
  });

  describe('updateAudioMetadata', () => {
    it('should update metadata successfully', async () => {
      // Arrange
      const audioId = 'audio-123';
      const existingAudio = {
        id: audioId,
        metadata: { speaker: 'John Doe', dialect: 'Standard German' }
      };
      const updatedAudio = {
        ...existingAudio,
        metadata: { speaker: 'Jane Doe', dialect: 'Standard German', region: 'Bavaria' }
      };
      const newMetadata = { speaker: 'Jane Doe', region: 'Bavaria' };

      mockAudioRepository.findById.mockResolvedValue(existingAudio);
      mockAudioRepository.updateMetadata.mockResolvedValue(updatedAudio);

      // Act
      const result = await audioService.updateAudioMetadata(audioId, newMetadata);

      // Assert
      expect(mockAudioRepository.updateMetadata).toHaveBeenCalledWith(audioId, {
        speaker: 'Jane Doe',
        dialect: 'Standard German',
        region: 'Bavaria'
      });
      expect(result).toEqual(expect.objectContaining({
        id: audioId
      }));
    });

    it('should throw error if audio not found', async () => {
      // Arrange
      mockAudioRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(audioService.updateAudioMetadata('nonexistent', {})).rejects.toThrow(ApiError);
    });
  });

  describe('deleteAudio', () => {
    it('should delete audio file and database record', async () => {
      // Arrange
      const audioId = 'audio-123';
      const mockAudioStimulus = {
        id: audioId,
        filePath: '/path/to/audio.mp3'
      };

      mockAudioRepository.findById.mockResolvedValue(mockAudioStimulus);

      // Act
      await audioService.deleteAudio(audioId);

      // Assert
      expect(fs.unlink).toHaveBeenCalledWith('/path/to/audio.mp3');
      expect(mockAudioRepository.delete).toHaveBeenCalledWith(audioId);
    });

    it('should throw error if audio not found', async () => {
      // Arrange
      mockAudioRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(audioService.deleteAudio('nonexistent')).rejects.toThrow(ApiError);
    });

    it('should continue with database deletion even if file deletion fails', async () => {
      // Arrange
      const audioId = 'audio-123';
      const mockAudioStimulus = {
        id: audioId,
        filePath: '/path/to/audio.mp3'
      };

      mockAudioRepository.findById.mockResolvedValue(mockAudioStimulus);
      vi.mocked(fs.unlink).mockRejectedValue(new Error('File not found'));

      // Act
      await audioService.deleteAudio(audioId);

      // Assert
      expect(mockAudioRepository.delete).toHaveBeenCalledWith(audioId);
    });
  });

  describe('getAudiosByQuestion', () => {
    it('should return audio files for a question', async () => {
      // Arrange
      const questionId = 'question-123';
      const mockAudioStimuli = [
        {
          id: 'audio-1',
          questionId,
          filename: 'audio1.mp3',
          filePath: '/path/to/audio1.mp3',
          fileSize: 1024,
          metadata: {},
          createdAt: new Date()
        },
        {
          id: 'audio-2',
          questionId,
          filename: 'audio2.mp3',
          filePath: '/path/to/audio2.mp3',
          fileSize: 2048,
          metadata: {},
          createdAt: new Date()
        }
      ];

      mockAudioRepository.findByQuestionId.mockResolvedValue(mockAudioStimuli);

      // Act
      const result = await audioService.getAudiosByQuestion(questionId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expect.objectContaining({
        id: 'audio-1',
        filename: 'audio1.mp3'
      }));
      expect(result[1]).toEqual(expect.objectContaining({
        id: 'audio-2',
        filename: 'audio2.mp3'
      }));
    });
  });
});