import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSession } from '../useSession';
import { sessionService } from '../../services/sessionService';
import { Question } from '../../types';

// Mock the session service
vi.mock('../../services/sessionService');

const mockSessionService = sessionService as any;

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

describe('useSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock session service methods
    mockSessionService.initializeSession = vi.fn();
    mockSessionService.recoverSession = vi.fn();
    mockSessionService.updateDrawingState = vi.fn();
    mockSessionService.updateResponse = vi.fn();
    mockSessionService.updateProgress = vi.fn();
    mockSessionService.clearSession = vi.fn();
    mockSessionService.forceSave = vi.fn();
    mockSessionService.updateSession = vi.fn();
    mockSessionService.getProgressPercentage = vi.fn().mockReturnValue(50);
    mockSessionService.checkForRecoverableSession = vi.fn().mockReturnValue(null);
    mockSessionService.getConnectionStatus = vi.fn().mockReturnValue('online');
    mockSessionService.addListener = vi.fn().mockReturnValue(() => {});
  });

  it('should initialize session correctly', async () => {
    const mockSession = {
      participantId: 'participant1',
      studyId: 'study1',
      currentQuestionIndex: 0,
      responses: {},
      drawingStates: {},
      progress: {
        totalQuestions: 2,
        completedQuestions: 0,
        currentQuestion: 0,
        startTime: Date.now(),
        lastSaveTime: Date.now()
      },
      metadata: {
        userAgent: 'test',
        screenResolution: '1920x1080',
        timezone: 'UTC',
        language: 'en'
      }
    };

    mockSessionService.initializeSession.mockResolvedValue(mockSession);

    const { result } = renderHook(() => useSession());

    await act(async () => {
      await result.current.initializeSession('participant1', 'study1', mockQuestions);
    });

    expect(mockSessionService.initializeSession).toHaveBeenCalledWith(
      'participant1',
      'study1',
      mockQuestions
    );
  });

  it('should update drawing state', async () => {
    const { result } = renderHook(() => useSession());

    const drawingState = {
      elements: [],
      activeTool: 'pen' as any,
      toolSettings: {} as any,
      isDrawing: false,
      canUndo: false,
      canRedo: false
    };

    await act(async () => {
      await result.current.updateDrawingState('q1', drawingState);
    });

    expect(mockSessionService.updateDrawingState).toHaveBeenCalledWith('q1', drawingState);
  });

  it('should update response', async () => {
    const { result } = renderHook(() => useSession());

    const response = { answer: 'test answer' };

    await act(async () => {
      await result.current.updateResponse('q1', response);
    });

    expect(mockSessionService.updateResponse).toHaveBeenCalledWith('q1', response);
  });

  it('should navigate to next question', async () => {
    const mockSession = {
      participantId: 'participant1',
      studyId: 'study1',
      currentQuestionIndex: 0,
      responses: {},
      drawingStates: {},
      progress: {
        totalQuestions: 2,
        completedQuestions: 0,
        currentQuestion: 0,
        startTime: Date.now(),
        lastSaveTime: Date.now()
      },
      metadata: {
        userAgent: 'test',
        screenResolution: '1920x1080',
        timezone: 'UTC',
        language: 'en'
      }
    };

    const { result } = renderHook(() => useSession());
    
    // Set up the session
    act(() => {
      (result.current as any).session = mockSession;
    });

    await act(async () => {
      await result.current.goToNextQuestion();
    });

    expect(mockSessionService.updateSession).toHaveBeenCalledWith({
      currentQuestionIndex: 1,
      progress: {
        ...mockSession.progress,
        currentQuestion: 1
      }
    });
  });

  it('should mark question as complete', async () => {
    const mockSession = {
      participantId: 'participant1',
      studyId: 'study1',
      currentQuestionIndex: 0,
      responses: {},
      drawingStates: {},
      progress: {
        totalQuestions: 2,
        completedQuestions: 0,
        currentQuestion: 0,
        startTime: Date.now(),
        lastSaveTime: Date.now()
      },
      metadata: {
        userAgent: 'test',
        screenResolution: '1920x1080',
        timezone: 'UTC',
        language: 'en'
      }
    };

    const { result } = renderHook(() => useSession());
    
    // Set up the session
    act(() => {
      (result.current as any).session = mockSession;
    });

    await act(async () => {
      await result.current.markQuestionComplete(0);
    });

    expect(mockSessionService.updateSession).toHaveBeenCalledWith({
      progress: {
        ...mockSession.progress,
        completedQuestions: 1
      }
    });
  });

  it('should handle session recovery', async () => {
    const recoveryData = {
      sessionId: 'participant1_study1',
      data: {
        participantId: 'participant1',
        studyId: 'study1',
        currentQuestionIndex: 1,
        responses: { q1: { answer: 'previous answer' } },
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
      },
      timestamp: Date.now() - 30000,
      isRecoverable: true
    };

    mockSessionService.checkForRecoverableSession.mockReturnValue(recoveryData);
    mockSessionService.recoverSession.mockResolvedValue(recoveryData.data);

    const { result } = renderHook(() => useSession());

    expect(result.current.hasRecoverableSession).toBe(true);
    expect(result.current.recoveryData).toEqual(recoveryData);

    await act(async () => {
      await result.current.recoverSession();
    });

    expect(mockSessionService.recoverSession).toHaveBeenCalled();
  });

  it('should clear session', async () => {
    const { result } = renderHook(() => useSession());

    await act(async () => {
      await result.current.clearSession();
    });

    expect(mockSessionService.clearSession).toHaveBeenCalled();
  });

  it('should force save session', async () => {
    const { result } = renderHook(() => useSession());

    await act(async () => {
      await result.current.forceSave();
    });

    expect(mockSessionService.forceSave).toHaveBeenCalled();
  });
});