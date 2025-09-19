import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AudioService } from '../services/AudioService';
import { repositories } from '../repositories';

// Mock dependencies
vi.mock('../repositories');
vi.mock('fs/promises', () => ({
  access: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockResolvedValue(Buffer.from('mock audio data')),
  unlink: vi.fn().mockResolvedValue(undefined)
}));

describe('Audio-Question Linking Tests', () => {
  let audioService: AudioService;

  beforeEach(() => {
    audioService = new AudioService();
    vi.clearAllMocks();
  });

  describe('Audio Stimuli Association with Questions', () => {
    it('should link audio files to questions correctly', async () => {
      // Arrange
      const questionId = 'question-123';
      const mockQuestion = {
        id: questionId,
        questionText: 'Listen to this audio and mark the dialect region',
        questionType: 'audio_response',
        configuration: {
          audioRequired: true,
          allowReplay: true,
          maxReplays: 3,
          responseType: 'area_selection'
        }
      };

      const mockAudioStimulus = {
        id: 'audio-123',
        questionId,
        filename: 'dialect-sample.mp3',
        filePath: '/uploads/audio/dialect-sample.mp3',
        fileSize: 2048000,
        durationSeconds: 45.5,
        metadata: {
          speaker: 'Native Speaker',
          dialect: 'Bavarian',
          region: 'Munich',
          recordingLocation: 'University of Munich',
          recordingDate: '2023-06-15',
          quality: 'high' as const,
          sampleRate: 44100,
          bitRate: 128,
          channels: 1,
          format: 'audio/mpeg',
          tags: ['dialect', 'bavarian', 'munich']
        },
        createdAt: new Date()
      };

      (repositories.questions.findById as any).mockResolvedValue(mockQuestion);
      (repositories.audio.create as any).mockResolvedValue(mockAudioStimulus);

      const uploadData = {
        questionId,
        filename: 'dialect-sample.mp3',
        buffer: Buffer.from('mock audio data'),
        mimetype: 'audio/mpeg',
        size: 2048000,
        metadata: {
          speaker: 'Native Speaker',
          dialect: 'Bavarian',
          region: 'Munich',
          recordingLocation: 'University of Munich',
          recordingDate: '2023-06-15',
          quality: 'high' as const,
          sampleRate: 44100,
          bitRate: 128,
          channels: 1,
          tags: ['dialect', 'bavarian', 'munich']
        }
      };

      // Act
      const result = await audioService.uploadAudio(uploadData);

      // Assert
      expect(repositories.questions.findById).toHaveBeenCalledWith(questionId);
      expect(repositories.audio.create).toHaveBeenCalledWith(expect.objectContaining({
        questionId,
        filename: 'dialect-sample.mp3',
        fileSize: 2048000,
        metadata: expect.objectContaining({
          format: 'audio/mpeg',
          speaker: 'Native Speaker',
          dialect: 'Bavarian',
          region: 'Munich'
        })
      }));
      expect(result.questionId).toBe(questionId);
      expect(result.metadata.speaker).toBe('Native Speaker');
      expect(result.metadata.dialect).toBe('Bavarian');
    });

    it('should retrieve all audio stimuli for a question', async () => {
      // Arrange
      const questionId = 'question-123';
      const mockAudioStimuli = [
        {
          id: 'audio-1',
          questionId,
          filename: 'sample1.mp3',
          filePath: '/uploads/audio/sample1.mp3',
          fileSize: 1024000,
          durationSeconds: 30.0,
          metadata: {
            speaker: 'Speaker A',
            dialect: 'Standard German',
            format: 'audio/mpeg'
          },
          createdAt: new Date('2023-01-01')
        },
        {
          id: 'audio-2',
          questionId,
          filename: 'sample2.mp3',
          filePath: '/uploads/audio/sample2.mp3',
          fileSize: 1536000,
          durationSeconds: 45.0,
          metadata: {
            speaker: 'Speaker B',
            dialect: 'Bavarian',
            format: 'audio/mpeg'
          },
          createdAt: new Date('2023-01-02')
        }
      ];

      (repositories.audio.findByQuestionId as any).mockResolvedValue(mockAudioStimuli);

      // Act
      const result = await audioService.getAudiosByQuestion(questionId);

      // Assert
      expect(repositories.audio.findByQuestionId).toHaveBeenCalledWith(questionId);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('audio-1');
      expect(result[0].metadata.speaker).toBe('Speaker A');
      expect(result[1].id).toBe('audio-2');
      expect(result[1].metadata.speaker).toBe('Speaker B');
    });

    it('should handle questions with no audio stimuli', async () => {
      // Arrange
      const questionId = 'question-without-audio';
      (repositories.audio.findByQuestionId as any).mockResolvedValue([]);

      // Act
      const result = await audioService.getAudiosByQuestion(questionId);

      // Assert
      expect(result).toHaveLength(0);
    });

    it('should prevent uploading audio to non-existent questions', async () => {
      // Arrange
      (repositories.questions.findById as any).mockResolvedValue(null);

      const uploadData = {
        questionId: 'nonexistent-question',
        filename: 'test.mp3',
        buffer: Buffer.from('mock audio data'),
        mimetype: 'audio/mpeg',
        size: 1024
      };

      // Act & Assert
      await expect(audioService.uploadAudio(uploadData)).rejects.toThrow('Question not found');
    });
  });

  describe('Audio Metadata Management for Questions', () => {
    it('should update audio metadata with linguistic information', async () => {
      // Arrange
      const audioId = 'audio-123';
      const existingAudio = {
        id: audioId,
        questionId: 'question-123',
        metadata: {
          speaker: 'Unknown',
          format: 'audio/mpeg'
        }
      };

      const linguisticMetadata = {
        speaker: 'Dr. Maria Schmidt',
        dialect: 'Upper Bavarian',
        region: 'Rosenheim',
        recordingLocation: 'LMU Phonetics Lab',
        recordingDate: '2023-07-20',
        quality: 'high' as const,
        sampleRate: 48000,
        bitRate: 192,
        channels: 2,
        tags: ['upper-bavarian', 'rosenheim', 'female-speaker']
      };

      const updatedAudio = {
        ...existingAudio,
        metadata: {
          ...existingAudio.metadata,
          ...linguisticMetadata
        }
      };

      (repositories.audio.findById as any).mockResolvedValue(existingAudio);
      (repositories.audio.updateMetadata as any).mockResolvedValue(updatedAudio);

      // Act
      const result = await audioService.updateAudioMetadata(audioId, linguisticMetadata);

      // Assert
      expect(repositories.audio.updateMetadata).toHaveBeenCalledWith(audioId, {
        speaker: 'Dr. Maria Schmidt',
        dialect: 'Upper Bavarian',
        region: 'Rosenheim',
        recordingLocation: 'LMU Phonetics Lab',
        recordingDate: '2023-07-20',
        quality: 'high',
        sampleRate: 48000,
        bitRate: 192,
        channels: 2,
        tags: ['upper-bavarian', 'rosenheim', 'female-speaker'],
        format: 'audio/mpeg'
      });
      expect(result.metadata.speaker).toBe('Dr. Maria Schmidt');
      expect(result.metadata.dialect).toBe('Upper Bavarian');
      expect(result.metadata.tags).toContain('upper-bavarian');
    });

    it('should preserve existing metadata when updating', async () => {
      // Arrange
      const audioId = 'audio-123';
      const existingAudio = {
        id: audioId,
        metadata: {
          speaker: 'John Doe',
          dialect: 'Standard German',
          format: 'audio/mpeg',
          sampleRate: 44100
        }
      };

      const partialUpdate = {
        region: 'Berlin',
        recordingDate: '2023-08-01'
      };

      const updatedAudio = {
        ...existingAudio,
        metadata: {
          ...existingAudio.metadata,
          ...partialUpdate
        }
      };

      (repositories.audio.findById as any).mockResolvedValue(existingAudio);
      (repositories.audio.updateMetadata as any).mockResolvedValue(updatedAudio);

      // Act
      const result = await audioService.updateAudioMetadata(audioId, partialUpdate);

      // Assert
      expect(repositories.audio.updateMetadata).toHaveBeenCalledWith(audioId, {
        speaker: 'John Doe',
        dialect: 'Standard German',
        format: 'audio/mpeg',
        sampleRate: 44100,
        region: 'Berlin',
        recordingDate: '2023-08-01'
      });
      expect(result.metadata.speaker).toBe('John Doe'); // Preserved
      expect(result.metadata.dialect).toBe('Standard German'); // Preserved
      expect(result.metadata.region).toBe('Berlin'); // Updated
      expect(result.metadata.recordingDate).toBe('2023-08-01'); // Updated
    });
  });

  describe('Audio Streaming for Questions', () => {
    it('should provide streaming capability for audio stimuli', async () => {
      // Arrange
      const audioId = 'audio-123';
      const mockAudioData = {
        buffer: Buffer.from('mock audio stream data'),
        mimetype: 'audio/mpeg',
        filename: 'dialect-sample.mp3'
      };

      const mockAudioStimulus = {
        id: audioId,
        questionId: 'question-123',
        filename: 'dialect-sample.mp3',
        filePath: '/uploads/audio/dialect-sample.mp3',
        metadata: { format: 'audio/mpeg' }
      };

      (repositories.audio.findById as any).mockResolvedValue(mockAudioStimulus);

      // Act
      const result = await audioService.getAudioFile(audioId);

      // Assert
      expect(result.mimetype).toBe('audio/mpeg');
      expect(result.filename).toBe('dialect-sample.mp3');
      expect(Buffer.isBuffer(result.buffer)).toBe(true);
    });
  });
});