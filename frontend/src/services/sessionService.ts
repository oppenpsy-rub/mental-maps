import { DrawingState } from '../types/drawing';
import { Question } from '../types';

export interface SessionData {
  participantId: string;
  studyId: string;
  currentQuestionIndex: number;
  responses: Record<string, any>;
  drawingStates: Record<string, DrawingState>;
  progress: {
    totalQuestions: number;
    completedQuestions: number;
    currentQuestion: number;
    startTime: number;
    lastSaveTime: number;
  };
  metadata: {
    userAgent: string;
    screenResolution: string;
    timezone: string;
    language: string;
  };
}

export interface AutoSaveConfig {
  enabled: boolean;
  intervalMs: number;
  maxRetries: number;
  retryDelayMs: number;
}

export interface SessionRecoveryData {
  sessionId: string;
  data: SessionData;
  timestamp: number;
  isRecoverable: boolean;
}

class SessionService {
  private sessionKey: string = 'mental_maps_session';
  private autoSaveInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private autoSaveConfig: AutoSaveConfig = {
    enabled: true,
    intervalMs: 5000, // Save every 5 seconds
    maxRetries: 3,
    retryDelayMs: 1000
  };
  private currentSession: SessionData | null = null;
  private saveQueue: Array<() => Promise<void>> = [];
  private participantToken: string | null = null;
  private isSaving: boolean = false;
  private connectionStatus: 'online' | 'offline' = 'online';
  private listeners: Array<(session: SessionData) => void> = [];

  constructor() {
    this.initializeConnectionMonitoring();
    this.initializeMetadata();
  }

  /**
   * Set the participant token for authentication
   */
  setParticipantToken(token: string): void {
    this.participantToken = token;
  }

  /**
   * Initialize a new session for a participant
   */
  async initializeSession(
    participantId: string, 
    studyId: string, 
    questions: Question[]
  ): Promise<SessionData> {
    const sessionData: SessionData = {
      participantId,
      studyId,
      currentQuestionIndex: 0,
      responses: {},
      drawingStates: {},
      progress: {
        totalQuestions: questions.length,
        completedQuestions: 0,
        currentQuestion: 0,
        startTime: Date.now(),
        lastSaveTime: Date.now()
      },
      metadata: {
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language
      }
    };

    this.currentSession = sessionData;
    await this.saveSessionLocally(sessionData);
    this.startAutoSave();
    this.startHeartbeat();
    
    return sessionData;
  }

  /**
   * Load existing session from local storage
   */
  loadSession(): SessionData | null {
    try {
      const stored = localStorage.getItem(this.sessionKey);
      if (!stored) return null;

      const sessionData: SessionData = JSON.parse(stored);
      
      // Validate session data structure
      if (this.isValidSessionData(sessionData)) {
        this.currentSession = sessionData;
        return sessionData;
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    }
    
    return null;
  }

  /**
   * Check if there's a recoverable session
   */
  checkForRecoverableSession(): SessionRecoveryData | null {
    const session = this.loadSession();
    if (!session) return null;

    const timeSinceLastSave = Date.now() - session.progress.lastSaveTime;
    const isRecoverable = timeSinceLastSave < 24 * 60 * 60 * 1000; // 24 hours

    return {
      sessionId: `${session.participantId}_${session.studyId}`,
      data: session,
      timestamp: session.progress.lastSaveTime,
      isRecoverable
    };
  }

  /**
   * Recover session from local storage
   */
  async recoverSession(): Promise<SessionData | null> {
    const recoveryData = this.checkForRecoverableSession();
    if (!recoveryData || !recoveryData.isRecoverable) {
      return null;
    }

    this.currentSession = recoveryData.data;
    this.startAutoSave();
    this.startHeartbeat();
    
    return recoveryData.data;
  }

  /**
   * Update current session data
   */
  async updateSession(updates: Partial<SessionData>): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active session to update');
    }

    this.currentSession = {
      ...this.currentSession,
      ...updates,
      progress: {
        ...this.currentSession.progress,
        ...updates.progress,
        lastSaveTime: Date.now()
      }
    };

    // Notify listeners
    this.notifyListeners(this.currentSession);

    // Queue auto-save
    if (this.autoSaveConfig.enabled) {
      await this.queueSave();
    }
  }

  /**
   * Update drawing state for a specific question
   */
  async updateDrawingState(questionId: string, drawingState: DrawingState): Promise<void> {
    if (!this.currentSession) return;

    await this.updateSession({
      drawingStates: {
        ...this.currentSession.drawingStates,
        [questionId]: drawingState
      }
    });
  }

  /**
   * Update response for a specific question
   */
  async updateResponse(questionId: string, response: any): Promise<void> {
    if (!this.currentSession) return;

    await this.updateSession({
      responses: {
        ...this.currentSession.responses,
        [questionId]: response
      }
    });
  }

  /**
   * Update progress information
   */
  async updateProgress(progress: Partial<SessionData['progress']>): Promise<void> {
    if (!this.currentSession) return;

    await this.updateSession({
      progress: {
        ...this.currentSession.progress,
        ...progress
      }
    });
  }

  /**
   * Get current session data
   */
  getCurrentSession(): SessionData | null {
    return this.currentSession;
  }

  /**
   * Get progress percentage
   */
  getProgressPercentage(): number {
    if (!this.currentSession) return 0;
    
    const { completedQuestions, totalQuestions } = this.currentSession.progress;
    return totalQuestions > 0 ? (completedQuestions / totalQuestions) * 100 : 0;
  }

  /**
   * Clear current session
   */
  async clearSession(): Promise<void> {
    this.stopAutoSave();
    this.stopHeartbeat();
    
    // Clear session on server if we have one
    if (this.currentSession && this.connectionStatus === 'online') {
      try {
        await fetch(`/api/sessions/${this.currentSession.participantId}/clear`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.participantToken || localStorage.getItem('token') || ''}`
          }
        });
      } catch (error) {
        console.warn('Failed to clear session on server:', error);
      }
    }
    
    this.currentSession = null;
    localStorage.removeItem(this.sessionKey);
  }

  /**
   * Configure auto-save settings
   */
  configureAutoSave(config: Partial<AutoSaveConfig>): void {
    this.autoSaveConfig = { ...this.autoSaveConfig, ...config };
    
    if (this.currentSession) {
      this.stopAutoSave();
      this.stopHeartbeat();
      if (this.autoSaveConfig.enabled) {
        this.startAutoSave();
        this.startHeartbeat();
      }
    }
  }

  /**
   * Add session change listener
   */
  addListener(listener: (session: SessionData) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): 'online' | 'offline' {
    return this.connectionStatus;
  }

  /**
   * Force save current session
   */
  async forceSave(): Promise<void> {
    if (!this.currentSession) return;
    
    await this.saveSessionLocally(this.currentSession);
    
    if (this.connectionStatus === 'online') {
      await this.saveSessionRemotely(this.currentSession);
    }
  }

  /**
   * Load session from remote server
   */
  async loadSessionFromRemote(participantId: string): Promise<SessionData | null> {
    try {
      const response = await fetch(`/api/sessions/${participantId}/load`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.participantToken || localStorage.getItem('token') || ''}`
        }
      });

      if (response.status === 404) {
        return null; // No session found
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to load session');
      }

      return result.data;

    } catch (error) {
      console.error('Failed to load session from remote:', error);
      return null;
    }
  }

  /**
   * Send heartbeat to keep session alive
   */
  async sendHeartbeat(): Promise<void> {
    if (!this.currentSession || this.connectionStatus === 'offline') return;

    try {
      const response = await fetch(`/api/sessions/${this.currentSession.participantId}/heartbeat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.participantToken || localStorage.getItem('token') || ''}`
        }
      });

      if (!response.ok) {
        console.warn('Heartbeat failed:', response.status, response.statusText);
      }

    } catch (error) {
      console.warn('Failed to send heartbeat:', error);
    }
  }

  // Private methods

  private async saveSessionLocally(sessionData: SessionData): Promise<void> {
    try {
      localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
    } catch (error) {
      console.error('Failed to save session locally:', error);
      throw error;
    }
  }

  private async saveSessionRemotely(sessionData: SessionData): Promise<void> {
    try {
      const response = await fetch(`/api/sessions/${sessionData.participantId}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.participantToken || localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          sessionData,
          incrementalUpdate: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to save session');
      }

    } catch (error) {
      console.error('Failed to save session remotely:', error);
      throw error;
    }
  }

  private async queueSave(): Promise<void> {
    if (!this.currentSession) return;

    const saveOperation = async () => {
      if (this.currentSession) {
        await this.saveSessionLocally(this.currentSession);
        
        if (this.connectionStatus === 'online') {
          await this.saveSessionRemotely(this.currentSession);
        }
      }
    };

    this.saveQueue.push(saveOperation);
    
    if (!this.isSaving) {
      await this.processSaveQueue();
    }
  }

  private async processSaveQueue(): Promise<void> {
    if (this.isSaving || this.saveQueue.length === 0) return;

    this.isSaving = true;

    while (this.saveQueue.length > 0) {
      const saveOperation = this.saveQueue.shift();
      if (saveOperation) {
        try {
          await this.retrySave(saveOperation);
        } catch (error) {
          console.error('Failed to save after retries:', error);
        }
      }
    }

    this.isSaving = false;
  }

  private async retrySave(saveOperation: () => Promise<void>): Promise<void> {
    let retries = 0;
    
    while (retries < this.autoSaveConfig.maxRetries) {
      try {
        await saveOperation();
        return;
      } catch (error) {
        retries++;
        if (retries < this.autoSaveConfig.maxRetries) {
          await new Promise(resolve => 
            setTimeout(resolve, this.autoSaveConfig.retryDelayMs * retries)
          );
        } else {
          throw error;
        }
      }
    }
  }

  private startAutoSave(): void {
    if (!this.autoSaveConfig.enabled || this.autoSaveInterval) return;

    this.autoSaveInterval = setInterval(async () => {
      if (this.currentSession) {
        await this.queueSave();
      }
    }, this.autoSaveConfig.intervalMs);
  }

  private stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  private startHeartbeat(): void {
    if (this.heartbeatInterval) return;

    // Send heartbeat every 30 seconds
    this.heartbeatInterval = setInterval(async () => {
      await this.sendHeartbeat();
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private initializeConnectionMonitoring(): void {
    const updateConnectionStatus = () => {
      this.connectionStatus = navigator.onLine ? 'online' : 'offline';
      
      // If we're back online, try to sync any pending saves
      if (this.connectionStatus === 'online' && this.currentSession) {
        this.queueSave();
      }
    };

    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);
    
    // Initial status
    updateConnectionStatus();
  }

  private initializeMetadata(): void {
    // Any additional metadata initialization can go here
  }

  private isValidSessionData(data: any): data is SessionData {
    return (
      data &&
      typeof data.participantId === 'string' &&
      typeof data.studyId === 'string' &&
      typeof data.currentQuestionIndex === 'number' &&
      data.responses &&
      data.drawingStates &&
      data.progress &&
      data.metadata
    );
  }

  private notifyListeners(session: SessionData): void {
    this.listeners.forEach(listener => {
      try {
        listener(session);
      } catch (error) {
        console.error('Error in session listener:', error);
      }
    });
  }
}

export const sessionService = new SessionService();