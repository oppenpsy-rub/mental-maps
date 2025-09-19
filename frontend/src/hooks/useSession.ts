import { useState, useEffect, useCallback } from 'react';
import { sessionService, SessionData, SessionRecoveryData } from '../services/sessionService';
import { DrawingState } from '../types/drawing';
import { Question } from '../types';

export interface UseSessionReturn {
  session: SessionData | null;
  isLoading: boolean;
  connectionStatus: 'online' | 'offline';
  progressPercentage: number;
  hasRecoverableSession: boolean;
  recoveryData: SessionRecoveryData | null;
  
  // Actions
  initializeSession: (participantId: string, studyId: string, questions: Question[]) => Promise<void>;
  recoverSession: () => Promise<void>;
  updateDrawingState: (questionId: string, drawingState: DrawingState) => Promise<void>;
  updateResponse: (questionId: string, response: any) => Promise<void>;
  updateProgress: (progress: Partial<SessionData['progress']>) => Promise<void>;
  clearSession: () => Promise<void>;
  forceSave: () => Promise<void>;
  
  // Navigation helpers
  goToNextQuestion: () => Promise<void>;
  goToPreviousQuestion: () => Promise<void>;
  goToQuestion: (index: number) => Promise<void>;
  markQuestionComplete: (questionIndex: number) => Promise<void>;
}

export const useSession = (): UseSessionReturn => {
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline'>('online');
  const [recoveryData, setRecoveryData] = useState<SessionRecoveryData | null>(null);

  // Initialize session listener
  useEffect(() => {
    const unsubscribe = sessionService.addListener((updatedSession) => {
      setSession(updatedSession);
    });

    // Check for recoverable session on mount
    const checkRecovery = () => {
      const recovery = sessionService.checkForRecoverableSession();
      setRecoveryData(recovery);
    };

    // Monitor connection status
    const updateConnectionStatus = () => {
      setConnectionStatus(sessionService.getConnectionStatus());
    };

    // Initial checks
    checkRecovery();
    updateConnectionStatus();
    
    // Set up connection monitoring
    const connectionInterval = setInterval(updateConnectionStatus, 1000);

    return () => {
      unsubscribe();
      clearInterval(connectionInterval);
    };
  }, []);

  const initializeSession = useCallback(async (
    participantId: string, 
    studyId: string, 
    questions: Question[]
  ) => {
    setIsLoading(true);
    try {
      const newSession = await sessionService.initializeSession(participantId, studyId, questions);
      setSession(newSession);
      setRecoveryData(null); // Clear any recovery data
    } catch (error) {
      console.error('Failed to initialize session:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const recoverSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const recoveredSession = await sessionService.recoverSession();
      if (recoveredSession) {
        setSession(recoveredSession);
        setRecoveryData(null);
      }
    } catch (error) {
      console.error('Failed to recover session:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateDrawingState = useCallback(async (questionId: string, drawingState: DrawingState) => {
    try {
      await sessionService.updateDrawingState(questionId, drawingState);
    } catch (error) {
      console.error('Failed to update drawing state:', error);
      throw error;
    }
  }, []);

  const updateResponse = useCallback(async (questionId: string, response: any) => {
    try {
      await sessionService.updateResponse(questionId, response);
    } catch (error) {
      console.error('Failed to update response:', error);
      throw error;
    }
  }, []);

  const updateProgress = useCallback(async (progress: Partial<SessionData['progress']>) => {
    try {
      await sessionService.updateProgress(progress);
    } catch (error) {
      console.error('Failed to update progress:', error);
      throw error;
    }
  }, []);

  const clearSession = useCallback(async () => {
    try {
      await sessionService.clearSession();
      setSession(null);
      setRecoveryData(null);
    } catch (error) {
      console.error('Failed to clear session:', error);
      throw error;
    }
  }, []);

  const forceSave = useCallback(async () => {
    try {
      await sessionService.forceSave();
    } catch (error) {
      console.error('Failed to force save:', error);
      throw error;
    }
  }, []);

  // Navigation helpers
  const goToNextQuestion = useCallback(async () => {
    if (!session) return;

    const nextIndex = session.currentQuestionIndex + 1;
    if (nextIndex < session.progress.totalQuestions) {
      await sessionService.updateSession({
        currentQuestionIndex: nextIndex,
        progress: {
          ...session.progress,
          currentQuestion: nextIndex
        }
      });
    }
  }, [session]);

  const goToPreviousQuestion = useCallback(async () => {
    if (!session) return;

    const prevIndex = session.currentQuestionIndex - 1;
    if (prevIndex >= 0) {
      await sessionService.updateSession({
        currentQuestionIndex: prevIndex,
        progress: {
          ...session.progress,
          currentQuestion: prevIndex
        }
      });
    }
  }, [session]);

  const goToQuestion = useCallback(async (index: number) => {
    if (!session) return;

    if (index >= 0 && index < session.progress.totalQuestions) {
      await sessionService.updateSession({
        currentQuestionIndex: index,
        progress: {
          ...session.progress,
          currentQuestion: index
        }
      });
    }
  }, [session]);

  const markQuestionComplete = useCallback(async (questionIndex: number) => {
    if (!session) return;

    // Check if this question was already completed
    const wasCompleted = questionIndex < session.progress.completedQuestions;
    
    if (!wasCompleted) {
      const newCompletedCount = Math.max(session.progress.completedQuestions, questionIndex + 1);
      
      await sessionService.updateSession({
        progress: {
          ...session.progress,
          completedQuestions: newCompletedCount
        }
      });
    }
  }, [session]);

  // Computed values
  const progressPercentage = session ? sessionService.getProgressPercentage() : 0;
  const hasRecoverableSession = recoveryData?.isRecoverable ?? false;

  return {
    session,
    isLoading,
    connectionStatus,
    progressPercentage,
    hasRecoverableSession,
    recoveryData,
    
    // Actions
    initializeSession,
    recoverSession,
    updateDrawingState,
    updateResponse,
    updateProgress,
    clearSession,
    forceSave,
    
    // Navigation helpers
    goToNextQuestion,
    goToPreviousQuestion,
    goToQuestion,
    markQuestionComplete
  };
};