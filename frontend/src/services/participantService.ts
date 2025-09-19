import { Study, Question } from '../types';
import { directDatabaseService } from './directDatabaseService';
import { sessionService } from './sessionService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

export interface ParticipantSessionData {
  participantId: string;
  studyId: string;
  sessionToken: string;
  expiresAt: string;
}

export interface StudyParticipationInfo {
  study: Study;
  questions: Question[];
  canParticipate: boolean;
  requiresConsent: boolean;
  estimatedDuration?: number;
}

export interface SubmitResponseRequest {
  questionId: string;
  responseType: 'map_drawing' | 'audio_response' | 'demographic' | 'heatmap';
  responseData: any;
  drawingData?: any;
  metadata?: {
    responseTime: number;
    deviceInfo: any;
    timestamp: number;
  };
}

class ParticipantService {
  private getHeaders(sessionToken?: string): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    if (sessionToken) {
      headers.Authorization = `Bearer ${sessionToken}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data || data;
  }

  /**
   * Get study information for participation
   */
  async getStudyForParticipation(studyId: string): Promise<StudyParticipationInfo> {
    const response = await fetch(`${API_BASE_URL}/participate/${studyId}/info`, {
      headers: this.getHeaders()
    });

    return this.handleResponse<StudyParticipationInfo>(response);
  }

  /**
   * Create a new participant session
   */
  async createParticipantSession(studyId: string, consentGiven: boolean = true): Promise<ParticipantSessionData> {
    const response = await fetch(`${API_BASE_URL}/participate/${studyId}/start`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        consentGiven,
        metadata: {
          userAgent: navigator.userAgent,
          screenResolution: `${screen.width}x${screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language,
          timestamp: Date.now()
        }
      })
    });

    return this.handleResponse<ParticipantSessionData>(response);
  }

  /**
   * Submit a response to a question
   */
  async submitResponse(sessionToken: string, request: any): Promise<void> {
    console.log('🔍 ParticipantService.submitResponse called with:', {
      token: sessionToken?.substring(0, 20) + '...',
      questionId: request.questionId,
      hasDrawingData: !!request.drawingData
    });

    try {
      console.log('📡 Attempting backend submission...');
      const response = await fetch(`${API_BASE_URL}/participate/responses`, {
        method: 'POST',
        headers: this.getHeaders(sessionToken),
        body: JSON.stringify(request)
      });

      console.log('📡 Backend response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Backend submission failed:', response.status, errorData);
        
        // If backend is broken, enable direct database mode
        console.warn('🔧 Backend response submission failed, switching to direct mode');
        directDatabaseService.enableDirectMode();
        
        // Extract participant ID from session
        const participantId = this.extractParticipantIdFromToken(sessionToken);
        console.log('🔧 Using participant ID:', participantId);
        
        const directResult = await directDatabaseService.submitResponseDirect({
          participantId: participantId,
          questionId: request.questionId,
          responseData: request.responseData,
          mapDrawing: request.drawingData,
          responseTimeMs: request.metadata?.responseTime || 0
        });
        
        console.log('✅ Direct submission result:', directResult);
        return;
      }

      console.log('✅ Backend submission successful');
      
    } catch (error) {
      console.error('❌ Network/fetch error:', error);
      
      // Network error - also try direct mode
      console.warn('🔧 Network error, trying direct database mode');
      directDatabaseService.enableDirectMode();
      
      try {
        const participantId = this.extractParticipantIdFromToken(sessionToken);
        console.log('🔧 Using participant ID for network fallback:', participantId);
        
        const directResult = await directDatabaseService.submitResponseDirect({
          participantId: participantId,
          questionId: request.questionId,
          responseData: request.responseData,
          mapDrawing: request.drawingData,
          responseTimeMs: request.metadata?.responseTime || 0
        });
        
        console.log('✅ Direct submission after network error:', directResult);
        return;
        
      } catch (directError) {
        console.error('❌ Both backend and direct submission failed:', directError);
        throw new Error('Both backend and direct database submission failed');
      }
    }
  }

  private extractParticipantIdFromToken(token: string): string {
    // Try to get from session service first
    const stored = sessionService.getCurrentSession();
    if (stored && stored.participantId) {
      return stored.participantId;
    }
    
    // Fallback: generate a temporary ID based on token
    const tempId = `participant_${token.substring(0, 8)}_${Date.now()}`;
    console.warn('⚠️ Using temporary participant ID:', tempId);
    return tempId;
  }

  /**
   * Submit demographic data
   */
  async submitDemographicData(sessionToken: string, demographicData: any): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/participate/demographics`, {
        method: 'POST',
        headers: this.getHeaders(sessionToken),
        body: JSON.stringify({
          demographicData,
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // If backend is broken, store demographic data locally
        console.warn('🔧 Backend demographic submission failed, storing locally');
        const participantId = this.extractParticipantIdFromToken(sessionToken);
        
        const demographicRecord = {
          participantId,
          demographicData,
          timestamp: new Date().toISOString(),
          synced: false
        };
        
        const storageKey = `demographic_${participantId}_${Date.now()}`;
        localStorage.setItem(storageKey, JSON.stringify(demographicRecord));
        
        // Add to index
        const indexKey = 'demographic_data_index';
        const existingIndex = JSON.parse(localStorage.getItem(indexKey) || '[]');
        existingIndex.push(storageKey);
        localStorage.setItem(indexKey, JSON.stringify(existingIndex));
        
        return;
      }
    } catch (error) {
      // Network error - store locally
      console.warn('🔧 Network error, storing demographic data locally');
      const participantId = this.extractParticipantIdFromToken(sessionToken);
      
      const demographicRecord = {
        participantId,
        demographicData,
        timestamp: new Date().toISOString(),
        synced: false
      };
      
      const storageKey = `demographic_${participantId}_${Date.now()}`;
      localStorage.setItem(storageKey, JSON.stringify(demographicRecord));
      
      // Add to index
      const indexKey = 'demographic_data_index';
      const existingIndex = JSON.parse(localStorage.getItem(indexKey) || '[]');
      existingIndex.push(storageKey);
      localStorage.setItem(indexKey, JSON.stringify(existingIndex));
    }
  }

  /**
   * Complete participation in a study
   */
  async completeParticipation(sessionToken: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/participate/complete`, {
      method: 'POST',
      headers: this.getHeaders(sessionToken),
      body: JSON.stringify({
        completedAt: Date.now()
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
  }

  /**
   * Validate participant session
   */
  async validateSession(sessionToken: string): Promise<{
    isValid: boolean;
    participantId?: string;
    studyId?: string;
    expiresAt?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/participate/validate`, {
        method: 'POST',
        headers: this.getHeaders(sessionToken)
      });

      return this.handleResponse(response);
    } catch (error) {
      return { isValid: false };
    }
  }

  /**
   * Get participant's current progress
   */
  async getParticipantProgress(sessionToken: string): Promise<{
    currentQuestionIndex: number;
    completedQuestions: number;
    totalQuestions: number;
    responses: Record<string, any>;
  }> {
    const response = await fetch(`${API_BASE_URL}/participate/progress`, {
      headers: this.getHeaders(sessionToken)
    });

    return this.handleResponse(response);
  }

  /**
   * Save session data to server
   */
  async saveSessionData(sessionToken: string, sessionData: any): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/participate/session/save`, {
      method: 'POST',
      headers: this.getHeaders(sessionToken),
      body: JSON.stringify({
        sessionData,
        timestamp: Date.now()
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
  }

  /**
   * Load session data from server
   */
  async loadSessionData(sessionToken: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/participate/session/load`, {
      headers: this.getHeaders(sessionToken)
    });

    if (response.status === 404) {
      return null; // No session data found
    }

    return this.handleResponse(response);
  }

  /**
   * Send heartbeat to keep session alive
   */
  async sendHeartbeat(sessionToken: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/participate/heartbeat`, {
        method: 'POST',
        headers: this.getHeaders(sessionToken)
      });

      if (!response.ok) {
        console.warn('Heartbeat failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.warn('Failed to send heartbeat:', error);
    }
  }
}

export const participantService = new ParticipantService();
export default participantService;