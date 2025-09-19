import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SessionManagementService, SessionData } from '../services/SessionManagementService';
import { ParticipantRepository } from '../repositories/ParticipantRepository';
import { ResponseRepository } from '../repositories/ResponseRepository';
import { StudyRepository } from '../repositories/StudyRepository';
import { ApiError } from '../types/errors';

// Mock repositories
vi.mock('../repositories/ParticipantRepository');
vi.mock('../repositories/ResponseRepository');
vi.mock('../repositories/StudyRepository');
vi.mock('../database/connection');

const mockParticipantRepository = new ParticipantRepository() as any;
const mockResponseRepository = new ResponseRepository() as any;
const mockStudyRepository = new StudyRepository() as any;

// Mock query runner
const mockQueryRunner = {
  connect: vi.fn(),
  startTransaction: vi.fn(),
  commitTransaction: vi.fn(),
  rollbackTransaction: vi.fn(),
  release: vi.fn(),
  manager: {
    update: vi.fn(),
    findOne: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
    query: vi.fn()
  }
};

// Mock AppDataSource
vi.mock('../database/connection', () => ({
  AppDataSource: {
    createQueryRunner: () => mockQueryRunner
  }
}));

describe('SessionManagementService', () => {
  let sessionService: SessionManagementService;

  const mockParticipant = {
    id: 'participant1',
    studyId: 'study1',
    sessionToken: 'token123',
    sessionData: null,
    lastActiveAt: new Date(),
    completedAt: null,
    metadata: {}
  };

  const mockSessionData: SessionData = {
    participantId: 'participant1',
    studyId: 'study1',
    currentQuestionIndex: 1,
    responses: {
      q1: { answer: 'test answer' }
    },
    drawingStates: {
      q1: {
        elements: [],
        activeTool: 'pen',
        toolSettings: {},
        isDrawing: false,
        canUndo: false,
        canRedo: false
      }
    },
    progress: {
      totalQuestions: 3,
      completedQuestions: 1,
      currentQuestion: 1,
      startTime: Date.now() - 60000,
      lastSaveTime: Date.now()
    },
    metadata: {
      userAgent: 'test-agent',
      screenResolution: '1920x1080',
      timezone: 'UTC',
      language: 'en'
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    sessionService = new SessionManagementService();
    
    // Reset query runner mocks
    mockQueryRunner.connect.mockResolvedValue(undefined);
    mockQueryRunner.startTransaction.mockResolvedValue(undefined);
    mockQueryRunner.commitTransaction.mockResolvedValue(undefined);
    mockQueryRunner.rollbackTransaction.mockResolvedValue(undefined);
    mockQueryRunner.release.mockResolvedValue(undefined);
    mockQueryRunner.manager.update.mockResolvedValue(undefined);
    mockQueryRunner.manager.insert.mockResolvedValue(undefined);
    mockQueryRunner.manager.delete.mockResolvedValue(undefined);
    mockQueryRunner.manager.query.mockResolvedValue([]);
    
    // Mock repository methods
    mockParticipantRepository.findById = vi.fn();
    mockParticipantRepository.findByStudy = vi.fn();
    mockResponseRepository.findByParticipant = vi.fn();
  });

  describe('saveSession', () => {
    it('should save session data successfully', async () => {
      mockParticipantRepository.findById.mockResolvedValue(mockParticipant);
      mockQueryRunner.manager.findOne.mockResolvedValue(null); // No existing responses

      await sessionService.saveSession({
        sessionData: mockSessionData,
        incrementalUpdate: false
      });

      expect(mockParticipantRepository.findById).toHaveBeenCalledWith('participant1');
      expect(mockQueryRunner.manager.update).toHaveBeenCalledWith(
        'participants',
        'participant1',
        expect.objectContaining({
          sessionData: JSON.stringify(mockSessionData),
          metadata: mockSessionData.metadata
        })
      );
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should throw error if participant not found', async () => {
      mockParticipantRepository.findById.mockResolvedValue(null);

      await expect(sessionService.saveSession({
        sessionData: mockSessionData
      })).rejects.toThrow(ApiError);

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw error if session already completed', async () => {
      const completedParticipant = {
        ...mockParticipant,
        completedAt: new Date()
      };
      mockParticipantRepository.findById.mockResolvedValue(completedParticipant);

      await expect(sessionService.saveSession({
        sessionData: mockSessionData
      })).rejects.toThrow(ApiError);

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should handle incremental updates', async () => {
      mockParticipantRepository.findById.mockResolvedValue(mockParticipant);

      await sessionService.saveSession({
        sessionData: { ...mockSessionData, responses: {} },
        incrementalUpdate: true
      });

      expect(mockQueryRunner.manager.update).toHaveBeenCalledWith(
        'participants',
        'participant1',
        expect.any(Object)
      );
    });
  });

  describe('loadSession', () => {
    it('should load session data successfully', async () => {
      const participantWithSession = {
        ...mockParticipant,
        sessionData: JSON.stringify(mockSessionData)
      };
      
      mockParticipantRepository.findById.mockResolvedValue(participantWithSession);
      mockResponseRepository.findByParticipant.mockResolvedValue([]);
      mockQueryRunner.manager.query.mockResolvedValue([]);

      const result = await sessionService.loadSession('participant1');

      expect(result).toMatchObject({
        participantId: 'participant1',
        studyId: 'study1',
        currentQuestionIndex: 1
      });
      expect(mockParticipantRepository.findById).toHaveBeenCalledWith('participant1');
    });

    it('should return null if no session data exists', async () => {
      mockParticipantRepository.findById.mockResolvedValue(mockParticipant);

      const result = await sessionService.loadSession('participant1');

      expect(result).toBeNull();
    });

    it('should return null if participant not found', async () => {
      mockParticipantRepository.findById.mockResolvedValue(null);

      const result = await sessionService.loadSession('participant1');

      expect(result).toBeNull();
    });
  });

  describe('checkSessionRecovery', () => {
    it('should return recovery info for recoverable session', async () => {
      const recentTime = new Date(Date.now() - 60000); // 1 minute ago
      const participantWithSession = {
        ...mockParticipant,
        sessionData: JSON.stringify(mockSessionData),
        lastActiveAt: recentTime
      };
      
      mockParticipantRepository.findById.mockResolvedValue(participantWithSession);

      const result = await sessionService.checkSessionRecovery('participant1');

      expect(result).toMatchObject({
        sessionId: 'participant1_study1',
        lastSaveTime: recentTime.getTime(),
        isRecoverable: true
      });
    });

    it('should mark old session as not recoverable', async () => {
      const oldTime = new Date(Date.now() - (25 * 60 * 60 * 1000)); // 25 hours ago
      const participantWithSession = {
        ...mockParticipant,
        sessionData: JSON.stringify(mockSessionData),
        lastActiveAt: oldTime
      };
      
      mockParticipantRepository.findById.mockResolvedValue(participantWithSession);

      const result = await sessionService.checkSessionRecovery('participant1');

      expect(result?.isRecoverable).toBe(false);
    });

    it('should return null for completed session', async () => {
      const completedParticipant = {
        ...mockParticipant,
        sessionData: JSON.stringify(mockSessionData),
        completedAt: new Date()
      };
      
      mockParticipantRepository.findById.mockResolvedValue(completedParticipant);

      const result = await sessionService.checkSessionRecovery('participant1');

      expect(result).toBeNull();
    });
  });

  describe('clearSession', () => {
    it('should clear session data successfully', async () => {
      await sessionService.clearSession('participant1');

      expect(mockQueryRunner.manager.update).toHaveBeenCalledWith(
        'participants',
        'participant1',
        expect.objectContaining({
          sessionData: null
        })
      );
      expect(mockQueryRunner.manager.delete).toHaveBeenCalledWith(
        'responses',
        expect.objectContaining({
          participantId: 'participant1',
          isTemporary: true
        })
      );
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should handle errors during clear', async () => {
      mockQueryRunner.manager.update.mockRejectedValue(new Error('Database error'));

      await expect(sessionService.clearSession('participant1')).rejects.toThrow(ApiError);

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('getSessionStatistics', () => {
    it('should calculate session statistics correctly', async () => {
      const participants = [
        {
          ...mockParticipant,
          id: 'p1',
          sessionData: JSON.stringify(mockSessionData),
          completedAt: null,
          lastActiveAt: new Date(Date.now() - 30000) // 30 seconds ago
        },
        {
          ...mockParticipant,
          id: 'p2',
          sessionData: JSON.stringify(mockSessionData),
          completedAt: new Date(),
          lastActiveAt: new Date(Date.now() - 60000)
        },
        {
          ...mockParticipant,
          id: 'p3',
          sessionData: JSON.stringify(mockSessionData),
          completedAt: null,
          lastActiveAt: new Date(Date.now() - (2 * 60 * 60 * 1000)) // 2 hours ago
        }
      ];

      mockParticipantRepository.findByStudy.mockResolvedValue(participants);

      const stats = await sessionService.getSessionStatistics('study1');

      expect(stats).toMatchObject({
        totalParticipants: 3,
        activeParticipants: 1, // Only p1 is active (within 1 hour)
        completedParticipants: 1, // Only p2 is completed
        recoverableSessions: 2 // p1 and p3 are recoverable (within 24 hours)
      });
    });

    it('should handle empty participant list', async () => {
      mockParticipantRepository.findByStudy.mockResolvedValue([]);

      const stats = await sessionService.getSessionStatistics('study1');

      expect(stats).toMatchObject({
        totalParticipants: 0,
        activeParticipants: 0,
        completedParticipants: 0,
        averageSessionDuration: 0,
        averageProgress: 0,
        recoverableSessions: 0
      });
    });
  });
});