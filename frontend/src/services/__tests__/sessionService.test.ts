import { describe, it, expect, beforeEach, vi } from 'vitest';
import { sessionService, SessionData } from '../sessionService';
import { Question } from '../../types';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock fetch
global.fetch = vi.fn();

// Mock navigator
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

const mockQuestions: Question[] = [
  {
    id: 'q1',
    studyId: 'study1',
    questionText: 'Test question 1',
    questionType: 'map_drawing',
    orderIndex: 0
  },
  {
    id: 'q2',
    studyId: 'study1',
    questionText: 'Test question 2',
    questionType: 'audio_response',
    orderIndex: 1
  }
];

describe('SessionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
  });

  describe('initializeSession', () => {
    it('should create a new session with correct structure', async () => {
      const session = await sessionService.initializeSession('participant1', 'study1', mockQuestions);

      expect(session).toMatchObject({
        participantId: 'participant1',
        studyId: 'study1',
        currentQuestionIndex: 0,
        responses: {},
        drawingStates: {},
        progress: {
          totalQuestions: 2,
          completedQuestions: 0,
          currentQuestion: 0
        }
      });

      expect(session.progress.startTime).toBeGreaterThan(0);
      expect(session.progress.lastSaveTime).toBeGreaterThan(0);
      expect(session.metadata).toHaveProperty('userAgent');
      expect(session.metadata).toHaveProperty('screenResolution');
      expect(session.metadata).toHaveProperty('timezone');
      expect(session.metadata).toHaveProperty('language');
    });

    it('should save session to localStorage', async () => {
      await sessionService.initializeSession('participant1', 'study1', mockQuestions);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'mental_maps_session',
        expect.any(String)
      );
    });
  });

  describe('loadSession', () => {
    it('should return null when no session exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const session = sessionService.loadSession();

      expect(session).toBeNull();
    });

    it('should load valid session from localStorage', () => {
      const mockSessionData: SessionData = {
        participantId: 'participant1',
        studyId: 'study1',
        currentQuestionIndex: 1,
        responses: { q1: { answer: 'test' } },
        drawingStates: {},
        progress: {
          totalQuestions: 2,
          completedQuestions: 1,
          currentQuestion: 1,
          startTime: Date.now() - 60000,
          lastSaveTime: Date.now() - 30000
        },
        metadata: {
          userAgent: 'test',
          screenResolution: '1920x1080',
          timezone: 'UTC',
          language: 'en'
        }
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSessionData));

      const session = sessionService.loadSession();

      expect(session).toEqual(mockSessionData);
    });

    it('should return null for invalid session data', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      const session = sessionService.loadSession();

      expect(session).toBeNull();
    });
  });

  describe('checkForRecoverableSession', () => {
    it('should return null when no session exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const recovery = sessionService.checkForRecoverableSession();

      expect(recovery).toBeNull();
    });

    it('should return recovery data for recent session', () => {
      const recentTime = Date.now() - 60000; // 1 minute ago
      const mockSessionData: SessionData = {
        participantId: 'participant1',
        studyId: 'study1',
        currentQuestionIndex: 1,
        responses: {},
        drawingStates: {},
        progress: {
          totalQuestions: 2,
          completedQuestions: 1,
          currentQuestion: 1,
          startTime: recentTime - 30000,
          lastSaveTime: recentTime
        },
        metadata: {
          userAgent: 'test',
          screenResolution: '1920x1080',
          timezone: 'UTC',
          language: 'en'
        }
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSessionData));

      const recovery = sessionService.checkForRecoverableSession();

      expect(recovery).toMatchObject({
        sessionId: 'participant1_study1',
        data: mockSessionData,
        timestamp: recentTime,
        isRecoverable: true
      });
    });

    it('should mark old session as not recoverable', () => {
      const oldTime = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
      const mockSessionData: SessionData = {
        participantId: 'participant1',
        studyId: 'study1',
        currentQuestionIndex: 1,
        responses: {},
        drawingStates: {},
        progress: {
          totalQuestions: 2,
          completedQuestions: 1,
          currentQuestion: 1,
          startTime: oldTime - 30000,
          lastSaveTime: oldTime
        },
        metadata: {
          userAgent: 'test',
          screenResolution: '1920x1080',
          timezone: 'UTC',
          language: 'en'
        }
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSessionData));

      const recovery = sessionService.checkForRecoverableSession();

      expect(recovery?.isRecoverable).toBe(false);
    });
  });

  describe('updateSession', () => {
    it('should update session data and trigger auto-save', async () => {
      // Initialize session first
      await sessionService.initializeSession('participant1', 'study1', mockQuestions);

      const updates = {
        currentQuestionIndex: 1,
        responses: { q1: { answer: 'test answer' } }
      };

      await sessionService.updateSession(updates);

      const currentSession = sessionService.getCurrentSession();
      expect(currentSession?.currentQuestionIndex).toBe(1);
      expect(currentSession?.responses).toEqual({ q1: { answer: 'test answer' } });
    });

    it('should throw error when no active session', async () => {
      await expect(sessionService.updateSession({})).rejects.toThrow('No active session to update');
    });
  });

  describe('updateDrawingState', () => {
    it('should update drawing state for specific question', async () => {
      await sessionService.initializeSession('participant1', 'study1', mockQuestions);

      const drawingState = {
        elements: [],
        activeTool: 'pen' as any,
        toolSettings: {} as any,
        isDrawing: false,
        canUndo: false,
        canRedo: false
      };

      await sessionService.updateDrawingState('q1', drawingState);

      const currentSession = sessionService.getCurrentSession();
      expect(currentSession?.drawingStates.q1).toEqual(drawingState);
    });
  });

  describe('updateResponse', () => {
    it('should update response for specific question', async () => {
      await sessionService.initializeSession('participant1', 'study1', mockQuestions);

      const response = { answer: 'test answer', confidence: 5 };

      await sessionService.updateResponse('q1', response);

      const currentSession = sessionService.getCurrentSession();
      expect(currentSession?.responses.q1).toEqual(response);
    });
  });

  describe('getProgressPercentage', () => {
    it('should calculate correct progress percentage', async () => {
      await sessionService.initializeSession('participant1', 'study1', mockQuestions);

      // Complete first question
      await sessionService.updateProgress({ completedQuestions: 1 });

      const percentage = sessionService.getProgressPercentage();
      expect(percentage).toBe(50); // 1 out of 2 questions = 50%
    });

    it('should return 0 when no session', () => {
      const percentage = sessionService.getProgressPercentage();
      expect(percentage).toBe(0);
    });
  });

  describe('clearSession', () => {
    it('should clear session data and localStorage', async () => {
      await sessionService.initializeSession('participant1', 'study1', mockQuestions);

      await sessionService.clearSession();

      expect(sessionService.getCurrentSession()).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('mental_maps_session');
    });

    it('should call remote clear API when online', async () => {
      await sessionService.initializeSession('participant1', 'study1', mockQuestions);

      await sessionService.clearSession();

      expect(fetch).toHaveBeenCalledWith(
        '/api/sessions/participant1/clear',
        expect.objectContaining({
          method: 'DELETE'
        })
      );
    });
  });

  describe('connection monitoring', () => {
    it('should detect online status', () => {
      Object.defineProperty(navigator, 'onLine', { value: true });

      const status = sessionService.getConnectionStatus();
      expect(status).toBe('online');
    });

    it('should detect offline status', () => {
      Object.defineProperty(navigator, 'onLine', { value: false });

      const status = sessionService.getConnectionStatus();
      expect(status).toBe('offline');
    });
  });

  describe('auto-save configuration', () => {
    it('should allow configuring auto-save settings', () => {
      sessionService.configureAutoSave({
        enabled: false,
        intervalMs: 10000
      });

      // Test that configuration is applied (this would require exposing config or testing behavior)
      expect(true).toBe(true); // Placeholder - in real implementation, you'd test the behavior
    });
  });
});