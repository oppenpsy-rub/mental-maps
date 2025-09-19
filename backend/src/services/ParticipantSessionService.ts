import { v4 as uuidv4 } from 'uuid';
import { Participant } from '../models/Participant';
import { Study } from '../models/Study';
import { StudyRepository } from '../repositories/StudyRepository';
import { ParticipantRepository } from '../repositories/ParticipantRepository';
import { ApiError, ValidationError } from '../types/errors';

export interface CreateParticipantSessionRequest {
    studyId: string;
    demographicData?: Record<string, any>;
}

export interface ParticipantSession {
    participant: Participant;
    sessionToken: string;
    study: Study;
}

export interface SessionValidationResult {
    isValid: boolean;
    participant?: Participant;
    study?: Study;
    error?: string;
}

export class ParticipantSessionService {
    private studyRepository: StudyRepository;
    private participantRepository: ParticipantRepository;

    constructor() {
        this.studyRepository = new StudyRepository();
        this.participantRepository = new ParticipantRepository();
    }

    /**
     * Create a new anonymous participant session for a study
     */
    async createParticipantSession(request: CreateParticipantSessionRequest): Promise<ParticipantSession> {
        const { studyId, demographicData } = request;

        // Validate study exists and is active
        const study = await this.studyRepository.findById(studyId);
        if (!study) {
            throw ApiError.notFound('Study not found');
        }

        if (!study.active) {
            throw ApiError.badRequest('Study is not currently active');
        }

        // Generate unique session token
        const sessionToken = this.generateSessionToken();

        // Create participant record
        const participant = await this.participantRepository.create({
            studyId,
            sessionToken,
            demographicData: demographicData || {},
            startedAt: new Date()
        });

        return {
            participant,
            sessionToken,
            study
        };
    }

    /**
     * Validate a participant session token
     */
    async validateSession(sessionToken: string): Promise<SessionValidationResult> {
        try {
            if (!sessionToken) {
                return {
                    isValid: false,
                    error: 'Session token is required'
                };
            }

            // Find participant by session token
            const participant = await this.participantRepository.findBySessionToken(sessionToken);
            if (!participant) {
                return {
                    isValid: false,
                    error: 'Invalid session token'
                };
            }

            // Check if session has expired (24 hours by default)
            const sessionExpiryHours = 24;
            const expiryTime = new Date(participant.startedAt.getTime() + (sessionExpiryHours * 60 * 60 * 1000));

            if (new Date() > expiryTime) {
                return {
                    isValid: false,
                    error: 'Session has expired'
                };
            }

            // Get associated study
            const study = await this.studyRepository.findById(participant.studyId);
            if (!study) {
                return {
                    isValid: false,
                    error: 'Associated study not found'
                };
            }

            if (!study.active) {
                return {
                    isValid: false,
                    error: 'Study is no longer active'
                };
            }

            return {
                isValid: true,
                participant,
                study
            };
        } catch (error) {
            return {
                isValid: false,
                error: 'Session validation failed'
            };
        }
    }

    /**
     * Update participant demographic data
     */
    async updateDemographicData(sessionToken: string, demographicData: Record<string, any>): Promise<Participant> {
        const validation = await this.validateSession(sessionToken);

        if (!validation.isValid || !validation.participant) {
            throw ApiError.unauthorized(validation.error || 'Invalid session');
        }

        // Sanitize demographic data to remove any PII
        const sanitizedData = this.sanitizeDemographicData(demographicData);

        return await this.participantRepository.update(validation.participant.id, {
            demographicData: {
                ...validation.participant.demographicData,
                ...sanitizedData
            }
        });
    }

    /**
     * Complete a participant session
     */
    async completeSession(sessionToken: string): Promise<void> {
        const validation = await this.validateSession(sessionToken);

        if (!validation.isValid || !validation.participant) {
            throw ApiError.unauthorized(validation.error || 'Invalid session');
        }

        await this.participantRepository.update(validation.participant.id, {
            completedAt: new Date()
        });
    }

    /**
     * Get session info without sensitive data
     */
    async getSessionInfo(sessionToken: string): Promise<{
        participant: {
            id: string;
            studyId: string;
            demographicData: Record<string, any>;
            startedAt: Date;
            completedAt?: Date;
            isCompleted: boolean;
            duration: number | null;
        };
        study: Pick<Study, 'id' | 'title' | 'description'>;
    }> {
        const validation = await this.validateSession(sessionToken);

        if (!validation.isValid || !validation.participant || !validation.study) {
            throw ApiError.unauthorized(validation.error || 'Invalid session');
        }

        const participant = validation.participant;

        return {
            participant: {
                id: participant.id,
                studyId: participant.studyId,
                demographicData: participant.demographicData,
                startedAt: participant.startedAt,
                completedAt: participant.completedAt,
                isCompleted: participant.isCompleted,
                duration: participant.duration
            },
            study: {
                id: validation.study.id,
                title: validation.study.title,
                description: validation.study.description
            }
        };
    }

    /**
     * Generate a secure session token
     */
    private generateSessionToken(): string {
        // Generate a UUID-based session token with additional entropy
        const uuid = uuidv4();
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2);

        return `ps_${uuid}_${timestamp}_${random}`;
    }

    /**
     * Sanitize demographic data to ensure GDPR compliance
     */
    private sanitizeDemographicData(data: Record<string, any>): Record<string, any> {
        const sanitized: Record<string, any> = {};

        // Define allowed demographic fields
        const allowedFields = [
            'age',
            'ageRange',
            'gender',
            'education',
            'occupation',
            'nativeLanguage',
            'spokenLanguages',
            'regionOfOrigin',
            'yearsInCurrentLocation',
            'linguisticBackground'
        ];

        // Only include allowed fields and ensure no PII
        for (const [key, value] of Object.entries(data)) {
            if (allowedFields.includes(key) && value !== null && value !== undefined && value !== '') {
                // Additional sanitization for specific fields
                if (key === 'age' && typeof value === 'number') {
                    // Convert exact age to age range for privacy
                    if (value < 18) sanitized.ageRange = 'under-18';
                    else if (value < 25) sanitized.ageRange = '18-24';
                    else if (value < 35) sanitized.ageRange = '25-34';
                    else if (value < 45) sanitized.ageRange = '35-44';
                    else if (value < 55) sanitized.ageRange = '45-54';
                    else if (value < 65) sanitized.ageRange = '55-64';
                    else sanitized.ageRange = '65+';
                } else if (typeof value === 'string' && value.trim().length > 0) {
                    // Ensure string values are not too specific (potential PII)
                    sanitized[key] = value.trim().substring(0, 100);
                } else if (Array.isArray(value)) {
                    // Handle arrays (e.g., spoken languages)
                    sanitized[key] = value.filter(item =>
                        typeof item === 'string' && item.trim().length > 0
                    ).map(item => item.trim().substring(0, 50));
                } else {
                    sanitized[key] = value;
                }
            }
        }

        return sanitized;
    }

    /**
     * Extract session token from request headers
     */
    extractSessionTokenFromHeader(authHeader: string | undefined): string | null {
        if (!authHeader) {
            return null;
        }

        // Support both "Bearer" and "Session" prefixes
        const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/);
        const sessionMatch = authHeader.match(/^Session\s+(.+)$/);

        if (bearerMatch && bearerMatch[1].startsWith('ps_')) {
            return bearerMatch[1];
        }

        if (sessionMatch) {
            return sessionMatch[1];
        }

        return null;
    }

    /**
     * Clean up expired sessions (for maintenance)
     */
    async cleanupExpiredSessions(): Promise<number> {
        const expiryHours = 24;
        const cutoffDate = new Date(Date.now() - (expiryHours * 60 * 60 * 1000));

        return await this.participantRepository.deleteExpiredSessions(cutoffDate);
    }
}