import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AudioRepository } from '../repositories/AudioRepository';
import { AudioStimulus, AudioMetadata } from '../models/AudioStimulus';
import { AppDataSource } from '../database/connection';

// Mock TypeORM
vi.mock('../database/connection');

describe('AudioRepository', () => {
  let audioRepository: AudioRepository;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      find: vi.fn(),
      findOne: vi.fn(),
      save: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      remove: vi.fn()
    };

    vi.mocked(AppDataSource.getRepository).mockReturnValue(mockRepository);
    audioRepository = new AudioRepository();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('findByQuestionId', () => {
    it('should find audio stimuli by question ID', async () => {
      // Arrange
      const questionId = 'question-123';
      const mockAudioStimuli = [
        {
          id: 'audio-1',
          questionId,
          filename: 'audio1.mp3',
          filePath: '/path/to/audio1.mp3',
          createdAt: new Date('2023-01-01')
        },
        {
          id: 'audio-2',
          questionId,
          filename: 'audio2.mp3',
          filePath: '/path/to/audio2.mp3',
          createdAt: new Date('2023-01-02')
        }
      ];

      mockRepository.find.mockResolvedValue(mockAudioStimuli);

      // Act
      const result = await audioRepository.findByQuestionId(questionId);

      // Assert
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { questionId },
        order: { createdAt: 'ASC' }
      });
      expect(result).toEqual(mockAudioStimuli);
    });

    it('should return empty array if no audio stimuli found', async () => {
      // Arrange
      mockRepository.find.mockResolvedValue([]);

      // Act
      const result = await audioRepository.findByQuestionId('nonexistent');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('findByFilename', () => {
    it('should find audio stimulus by filename', async () => {
      // Arrange
      const filename = 'test-audio.mp3';
      const mockAudioStimulus = {
        id: 'audio-123',
        filename,
        filePath: '/path/to/test-audio.mp3'
      };

      mockRepository.findOne.mockResolvedValue(mockAudioStimulus);

      // Act
      const result = await audioRepository.findByFilename(filename);

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { filename }
      });
      expect(result).toEqual(mockAudioStimulus);
    });

    it('should return null if audio stimulus not found', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await audioRepository.findByFilename('nonexistent.mp3');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('updateMetadata', () => {
    it('should update audio metadata', async () => {
      // Arrange
      const audioId = 'audio-123';
      const metadata: AudioMetadata = {
        speaker: 'John Doe',
        dialect: 'Standard German',
        region: 'Bavaria'
      };
      const updatedAudio = {
        id: audioId,
        metadata,
        filename: 'test-audio.mp3'
      };

      mockRepository.update.mockResolvedValue({ affected: 1 });
      
      // Mock the findById method from BaseRepository
      const mockFindById = vi.fn().mockResolvedValue(updatedAudio);
      audioRepository.findById = mockFindById;

      // Act
      const result = await audioRepository.updateMetadata(audioId, metadata);

      // Assert
      expect(mockRepository.update).toHaveBeenCalledWith(audioId, { metadata });
      expect(mockFindById).toHaveBeenCalledWith(audioId);
      expect(result).toEqual(updatedAudio);
    });

    it('should return null if audio not found after update', async () => {
      // Arrange
      const audioId = 'nonexistent';
      const metadata: AudioMetadata = { speaker: 'John Doe' };

      mockRepository.update.mockResolvedValue({ affected: 0 });
      
      const mockFindById = vi.fn().mockResolvedValue(null);
      audioRepository.findById = mockFindById;

      // Act
      const result = await audioRepository.updateMetadata(audioId, metadata);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('deleteByQuestionId', () => {
    it('should delete all audio stimuli for a question', async () => {
      // Arrange
      const questionId = 'question-123';
      mockRepository.delete.mockResolvedValue({ affected: 2 });

      // Act
      await audioRepository.deleteByQuestionId(questionId);

      // Assert
      expect(mockRepository.delete).toHaveBeenCalledWith({ questionId });
    });
  });

  describe('findWithQuestion', () => {
    it('should find audio stimulus with question relation', async () => {
      // Arrange
      const audioId = 'audio-123';
      const mockAudioWithQuestion = {
        id: audioId,
        filename: 'test-audio.mp3',
        question: {
          id: 'question-123',
          questionText: 'Test question'
        }
      };

      mockRepository.findOne.mockResolvedValue(mockAudioWithQuestion);

      // Act
      const result = await audioRepository.findWithQuestion(audioId);

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: audioId },
        relations: ['question']
      });
      expect(result).toEqual(mockAudioWithQuestion);
    });

    it('should return null if audio not found', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await audioRepository.findWithQuestion('nonexistent');

      // Assert
      expect(result).toBeNull();
    });
  });
});