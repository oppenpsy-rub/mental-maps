import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AudioService } from '../services/AudioService';
import { AudioRepository } from '../repositories/AudioRepository';
import { repositories } from '../repositories';

// Mock file system operations
vi.mock('fs/promises', () => ({
  access: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockResolvedValue(Buffer.from('mock audio data')),
  unlink: vi.fn().mockResolvedValue(undefined)
}));

// Mock repositories
vi.mock('../repositories', () => ({
  repositories: {
    questions: {
      findById: vi.fn()
    },
    audio: {
      create: vi.fn(),
      findById: vi.fn(),
      findByQuestionId: vi.fn(),
      updateMetadata: vi.fn(),
      delete: vi.fn()
    }
  }
}));

describe('Audio Integration Tests', () => {
  let audioService: AudioService;

  beforeEach(() => {
    audioService = new AudioService();
    vi.clearAllMocks();
  });

  describe('Audio Upload Flow', () => {
    it('should complete full upload workflow', async () => {
      // Arrange
      const mockQuestion = { id: 'question-123', title: 'Test Question' };
      const mockAudioStimulus = {
        id: 'audio-123',
        questionId: 'question-123',
        filename: 'test-audio.mp3',
        filePath: expect.any(String),
        fileSize: 1024,
        durationSeconds: undefined,
        metadata: {
          format: 'audio/mpeg',
          speaker: 'John Doe'
        },
        createdAt: new Date()
      };

      (repositories.questions.findById as any).mockResolvedValue(mockQuestion);
      (repositories.audio.create as any).mockResolvedValue(mockAudioStimulus);

      const uploadData = {
        questionId: 'question-123',
        filename: 'test-audio.mp3',
        buffer: Buffer.from('mock audio data'),
        mimetype: 'audio/mpeg',
        size: 1024,
        metadata: { speaker: 'John Doe' }
      };

      // Act
      const result = await audioService.uploadAudio(uploadData);

      // Assert
      expect(repositories.questions.findById).toHaveBeenCalledWith('question-123');
      expect(repositories.audio.create).toHaveBeenCalledWith(expect.objectContaining({
        questionId: 'question-123',
        filename: 'test-audio.mp3',
        fileSize: 1024,
        metadata: expect.objectContaining({
          format: 'audio/mpeg',
          speaker: 'John Doe'
        })
      }));
      expect(result.id).toBe('audio-123');
      expect(result.filename).toBe('test-audio.mp3');
    });
  });

  describe('Audio Retrieval Flow', () => {
    it('should retrieve audio files by question', async () => {
      // Arrange
      const mockAudioFiles = [
        {
          id: 'audio-1',
          questionId: 'question-123',
          filename: 'audio1.mp3',
          filePath: '/path/to/audio1.mp3',
          fileSize: 1024,
          metadata: {},
          createdAt: new Date()
        }
      ];

      (repositories.audio.findByQuestionId as any).mockResolvedValue(mockAudioFiles);

      // Act
      const result = await audioService.getAudiosByQuestion('question-123');

      // Assert
      expect(repositories.audio.findByQuestionId).toHaveBeenCalledWith('question-123');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('audio-1');
    });
  });

  describe('Audio Metadata Management', () => {
    it('should update audio metadata', async () => {
      // Arrange
      const existingAudio = {
        id: 'audio-123',
        metadata: { speaker: 'John Doe' }
      };
      const updatedAudio = {
        ...existingAudio,
        metadata: { speaker: 'Jane Doe', region: 'Bavaria' }
      };

      (repositories.audio.findById as any).mockResolvedValue(existingAudio);
      (repositories.audio.updateMetadata as any).mockResolvedValue(updatedAudio);

      // Act
      const result = await audioService.updateAudioMetadata('audio-123', { speaker: 'Jane Doe', region: 'Bavaria' });

      // Assert
      expect(repositories.audio.updateMetadata).toHaveBeenCalledWith('audio-123', {
        speaker: 'Jane Doe',
        region: 'Bavaria'
      });
      expect(result.id).toBe('audio-123');
    });
  });

  describe('File Validation', () => {
    it('should validate supported audio formats', async () => {
      const validFormats = ['audio/mpeg', 'audio/wav', 'audio/ogg'];
      
      for (const mimetype of validFormats) {
        const mockQuestion = { id: 'question-123' };
        (repositories.questions.findById as any).mockResolvedValue(mockQuestion);
        (repositories.audio.create as any).mockResolvedValue({ id: 'audio-123' });

        const uploadData = {
          questionId: 'question-123',
          filename: `test.${mimetype.split('/')[1]}`,
          buffer: Buffer.from('mock audio data'),
          mimetype,
          size: 1024
        };

        // Should not throw
        await expect(audioService.uploadAudio(uploadData)).resolves.toBeDefined();
      }
    });

    it('should reject unsupported formats', async () => {
      const uploadData = {
        questionId: 'question-123',
        filename: 'test.txt',
        buffer: Buffer.from('mock data'),
        mimetype: 'text/plain',
        size: 1024
      };

      await expect(audioService.uploadAudio(uploadData)).rejects.toThrow('Unsupported audio format');
    });

    it('should reject files that are too large', async () => {
      const uploadData = {
        questionId: 'question-123',
        filename: 'test.mp3',
        buffer: Buffer.from('mock data'),
        mimetype: 'audio/mpeg',
        size: 60 * 1024 * 1024 // 60MB
      };

      await expect(audioService.uploadAudio(uploadData)).rejects.toThrow('File too large');
    });
  });
});