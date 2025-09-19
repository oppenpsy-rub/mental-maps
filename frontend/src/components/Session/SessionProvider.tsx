import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession, UseSessionReturn } from '../../hooks/useSession';
import { SessionRecoveryModal } from './SessionRecoveryModal';
import { Question } from '../../types';

interface SessionContextType extends UseSessionReturn {
  isInitialized: boolean;
  showRecoveryModal: boolean;
  dismissRecoveryModal: () => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

interface SessionProviderProps {
  children: React.ReactNode;
  participantId?: string;
  studyId?: string;
  questions?: Question[];
  autoInitialize?: boolean;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({
  children,
  participantId,
  studyId,
  questions,
  autoInitialize = false
}) => {
  const sessionHook = useSession();
  const [isInitialized, setIsInitialized] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryHandled, setRecoveryHandled] = useState(false);

  // Check for recoverable session on mount
  useEffect(() => {
    if (!recoveryHandled && sessionHook.hasRecoverableSession) {
      setShowRecoveryModal(true);
    }
  }, [sessionHook.hasRecoverableSession, recoveryHandled]);

  // Auto-initialize session if parameters are provided
  useEffect(() => {
    if (
      autoInitialize &&
      participantId &&
      studyId &&
      questions &&
      !sessionHook.session &&
      !showRecoveryModal &&
      !isInitialized
    ) {
      sessionHook.initializeSession(participantId, studyId, questions)
        .then(() => setIsInitialized(true))
        .catch(console.error);
    }
  }, [
    autoInitialize,
    participantId,
    studyId,
    questions,
    sessionHook.session,
    showRecoveryModal,
    isInitialized,
    sessionHook
  ]);

  const handleRecoverSession = async () => {
    try {
      await sessionHook.recoverSession();
      setShowRecoveryModal(false);
      setRecoveryHandled(true);
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to recover session:', error);
    }
  };

  const handleDiscardSession = async () => {
    try {
      await sessionHook.clearSession();
      setShowRecoveryModal(false);
      setRecoveryHandled(true);
      
      // Initialize new session if auto-initialize is enabled
      if (autoInitialize && participantId && studyId && questions) {
        await sessionHook.initializeSession(participantId, studyId, questions);
        setIsInitialized(true);
      }
    } catch (error) {
      console.error('Failed to discard session:', error);
    }
  };

  const dismissRecoveryModal = () => {
    setShowRecoveryModal(false);
    setRecoveryHandled(true);
  };

  const contextValue: SessionContextType = {
    ...sessionHook,
    isInitialized,
    showRecoveryModal,
    dismissRecoveryModal
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
      
      {showRecoveryModal && sessionHook.recoveryData && (
        <SessionRecoveryModal
          recoveryData={sessionHook.recoveryData}
          onRecover={handleRecoverSession}
          onDiscard={handleDiscardSession}
          isLoading={sessionHook.isLoading}
        />
      )}
    </SessionContext.Provider>
  );
};

export const useSessionContext = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSessionContext must be used within a SessionProvider');
  }
  return context;
};