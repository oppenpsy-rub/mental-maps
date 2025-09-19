import { ParticipantRepository } from '../repositories/ParticipantRepository';
import { ResponseRepository } from '../repositories/ResponseRepository';
import { StudyRepository } from '../repositories/StudyRepository';
import { ApiError } from '../types/errors';
import { AppDataSource } from '../database/connection';

export interface SessionData {
  participantId: string;
  studyId: string;
  currentQuestionIndex: number;
  responses: Record<string, any>;
  drawingStates: Record<string, any>;
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

export interface SessionSaveRequest {
  sessionData: SessionData;
  incrementalUpdate?: boolean;
}

export interface SessionRecoveryInfo {
  sessionId: string;
  lastSaveTime: number;
  progress: SessionData['progress'];
  isRecoverable: boolean;
}

export class SessionManagementService {
  private participantRepository: ParticipantRepository;
  private responseRepository: ResponseRepository;
  private studyRepository: StudyRepository;

  constructor() {
    this.participantRepository = new ParticipantRepository();
    this.responseRepository = new ResponseRepository();
    this.studyRepository = new StudyRepository();
  }

  /**
   * Save session data to the database
   */
  async saveSession(request: SessionSaveRequest): Promise<void> {
    const { sessionData, incrementalUpdate = false } = request;
    const queryRunner = AppDataSource.createQueryRunner();
    
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate participant exists and session is active
      const participant = await this.participantRepository.findById(sessionData.participantId);
      if (!participant) {
        throw new ApiError('Participant not found', 404, 'PARTICIPANT_NOT_FOUND');
      }

      if (participant.completedAt) {
        throw new ApiError('Session has already been completed', 400, 'SESSION_COMPLETED');
      }

      // Update participant with session metadata
      await queryRunner.manager.update('participants', participant.id, {
        sessionData: JSON.stringify(sessionData),
        lastActiveAt: new Date(),
        metadata: sessionData.metadata
      });

      // Save individual responses if they exist
      if (!incrementalUpdate || Object.keys(sessionData.responses).length > 0) {
        await this.saveResponses(queryRunner, sessionData);
      }

      // Save drawing states
      if (!incrementalUpdate || Object.keys(sessionData.drawingStates).length > 0) {
        await this.saveDrawingStates(queryRunner, sessionData);
      }

      await queryRunner.commitTransaction();

    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to save session', 500, 'SESSION_SAVE_ERROR', error);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Load session data from the database
   */
  async loadSession(participantId: string): Promise<SessionData | null> {
    try {
      const participant = await this.participantRepository.findById(participantId);
      if (!participant || !participant.sessionData) {
        return null;
      }

      // Parse stored session data
      const sessionData: SessionData = JSON.parse(participant.sessionData);

      // Load associated responses and drawing states
      const responses = await this.loadResponses(participantId);
      const drawingStates = await this.loadDrawingStates(participantId);

      return {
        ...sessionData,
        responses,
        drawingStates,
        progress: {
          ...sessionData.progress,
          lastSaveTime: participant.lastActiveAt?.getTime() || sessionData.progress.lastSaveTime
        }
      };

    } catch (error) {
      console.error('Failed to load session:', error);
      return null;
    }
  }

  /**
   * Check if a session is recoverable
   */
  async checkSessionRecovery(participantId: string): Promise<SessionRecoveryInfo | null> {
    try {
      const participant = await this.participantRepository.findById(participantId);
      if (!participant || !participant.sessionData || participant.completedAt) {
        return null;
      }

      const sessionData: SessionData = JSON.parse(participant.sessionData);
      const lastSaveTime = participant.lastActiveAt?.getTime() || sessionData.progress.lastSaveTime;
      
      // Consider session recoverable if it's less than 24 hours old
      const isRecoverable = (Date.now() - lastSaveTime) < 24 * 60 * 60 * 1000;

      return {
        sessionId: `${participantId}_${sessionData.studyId}`,
        lastSaveTime,
        progress: sessionData.progress,
        isRecoverable
      };

    } catch (error) {
      console.error('Failed to check session recovery:', error);
      return null;
    }
  }

  /**
   * Clear session data
   */
  async clearSession(participantId: string): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();
    
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Clear session data from participant
      await queryRunner.manager.update('participants', participantId, {
        sessionData: null,
        lastActiveAt: new Date()
      });

      // Optionally clear temporary response data
      // (Keep completed responses, clear only draft/temporary ones)
      await queryRunner.manager.delete('responses', {
        participantId,
        isTemporary: true
      });

      await queryRunner.commitTransaction();

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new ApiError('Failed to clear session', 500, 'SESSION_CLEAR_ERROR', error);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Create a new participant session
   */
  async createSession(sessionInfo: {
    studyId: string;
    sessionToken: string;
    expiresAt: string;
    metadata: any;
    consentGiven: boolean;
    startedAt: string;
  }): Promise<string> {
    try {
      const participant = await this.participantRepository.create({
        studyId: sessionInfo.studyId,
        sessionToken: sessionInfo.sessionToken,
        expiresAt: new Date(sessionInfo.expiresAt),
        metadata: sessionInfo.metadata,
        consentGiven: sessionInfo.consentGiven,
        startedAt: new Date(sessionInfo.startedAt),
        demographicData: {}
      });
      
      return participant.id;
    } catch (error) {
      throw new ApiError('Failed to create session', 500, 'SESSION_CREATE_ERROR', error);
    }
  }

  /**
   * Validate session token
   */
  async validateSessionToken(sessionToken: string): Promise<any> {
    try {
      const participant = await this.participantRepository.findBySessionToken(sessionToken);
      return participant;
    } catch (error) {
      console.error('Failed to validate session token:', error);
      return null;
    }
  }

  /**
   * Complete a session
   */
  async completeSession(participantId: string, completionData: { completedAt: string }): Promise<void> {
    try {
      await this.participantRepository.update(participantId, {
        completedAt: new Date(completionData.completedAt),
        updatedAt: new Date()
      });
    } catch (error) {
      throw new ApiError('Failed to complete session', 500, 'SESSION_COMPLETE_ERROR', error);
    }
  }

  /**
   * Save session data
   */
  async saveSessionData(participantId: string, sessionData: any): Promise<void> {
    try {
      await this.participantRepository.update(participantId, {
        sessionData: JSON.stringify(sessionData),
        lastActiveAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      throw new ApiError('Failed to save session data', 500, 'SESSION_DATA_SAVE_ERROR', error);
    }
  }

  /**
   * Get session data
   */
  async getSessionData(participantId: string): Promise<any> {
    try {
      const participant = await this.participantRepository.findById(participantId);
      if (!participant || !participant.sessionData) {
        return null;
      }
      return JSON.parse(participant.sessionData);
    } catch (error) {
      console.error('Failed to get session data:', error);
      return null;
    }
  }

  /**
   * Update session heartbeat
   */
  async updateSessionHeartbeat(participantId: string): Promise<void> {
    try {
      await this.participantRepository.update(participantId, {
        lastActiveAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      throw new ApiError('Failed to update heartbeat', 500, 'HEARTBEAT_ERROR', error);
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStatistics(studyId: string): Promise<any> {
    try {
      const participants = await this.participantRepository.findByStudy(studyId);
      
      const stats = {
        totalParticipants: participants.length,
        activeParticipants: 0,
        completedParticipants: 0,
        averageSessionDuration: 0,
        averageProgress: 0,
        recoverableSessions: 0
      };

      let totalDuration = 0;
      let totalProgress = 0;
      let activeSessions = 0;

      for (const participant of participants) {
        if (participant.completedAt) {
          stats.completedParticipants++;
          
          if (participant.sessionData) {
            const sessionData: SessionData = JSON.parse(participant.sessionData);
            const duration = participant.completedAt.getTime() - sessionData.progress.startTime;
            totalDuration += duration;
          }
        } else if (participant.sessionData) {
          const sessionData: SessionData = JSON.parse(participant.sessionData);
          const lastActiveTime = participant.lastActiveAt?.getTime() || sessionData.progress.lastSaveTime;
          
          // Consider active if last activity was within 1 hour
          if ((Date.now() - lastActiveTime) < 60 * 60 * 1000) {
            stats.activeParticipants++;
            activeSessions++;
          }
          
          // Check if recoverable (within 24 hours)
          if ((Date.now() - lastActiveTime) < 24 * 60 * 60 * 1000) {
            stats.recoverableSessions++;
          }
          
          totalProgress += (sessionData.progress.completedQuestions / sessionData.progress.totalQuestions) * 100;
        }
      }

      if (stats.completedParticipants > 0) {
        stats.averageSessionDuration = totalDuration / stats.completedParticipants;
      }

      if (activeSessions > 0) {
        stats.averageProgress = totalProgress / activeSessions;
      }

      return stats;

    } catch (error) {
      throw new ApiError('Failed to get session statistics', 500, 'SESSION_STATS_ERROR', error);
    }
  }

  // Private helper methods

  private async saveResponses(queryRunner: any, sessionData: SessionData): Promise<void> {
    for (const [questionId, responseData] of Object.entries(sessionData.responses)) {
      if (!responseData) continue;

      // Check if response already exists
      const existingResponse = await queryRunner.manager.findOne('responses', {
        where: {
          participantId: sessionData.participantId,
          questionId: questionId
        }
      });

      if (existingResponse) {
        // Update existing response
        await queryRunner.manager.update('responses', existingResponse.id, {
          responseData: responseData,
          isTemporary: true, // Mark as temporary until session is completed
          updatedAt: new Date()
        });
      } else {
        // Create new temporary response
        await queryRunner.manager.insert('responses', {
          participantId: sessionData.participantId,
          questionId: questionId,
          responseData: responseData,
          isTemporary: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }
  }

  private async saveDrawingStates(queryRunner: any, sessionData: SessionData): Promise<void> {
    for (const [questionId, drawingState] of Object.entries(sessionData.drawingStates)) {
      if (!drawingState) continue;

      // Store drawing state as JSON in a separate table or as part of response data
      await queryRunner.manager.query(`
        INSERT INTO drawing_sessions (participant_id, question_id, drawing_state, updated_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (participant_id, question_id) 
        DO UPDATE SET drawing_state = $3, updated_at = $4
      `, [
        sessionData.participantId,
        questionId,
        JSON.stringify(drawingState),
        new Date()
      ]);
    }
  }

  private async loadResponses(participantId: string): Promise<Record<string, any>> {
    const responses = await this.responseRepository.findByParticipant(participantId);
    const responseMap: Record<string, any> = {};

    responses.forEach(response => {
      responseMap[response.questionId] = response.responseData;
    });

    return responseMap;
  }

  private async loadDrawingStates(participantId: string): Promise<Record<string, any>> {
    const queryRunner = AppDataSource.createQueryRunner();
    
    try {
      const drawingStates = await queryRunner.manager.query(`
        SELECT question_id, drawing_state 
        FROM drawing_sessions 
        WHERE participant_id = $1
      `, [participantId]);

      const stateMap: Record<string, any> = {};
      
      drawingStates.forEach((row: any) => {
        stateMap[row.question_id] = JSON.parse(row.drawing_state);
      });

      return stateMap;

    } finally {
      await queryRunner.release();
    }
  }
}