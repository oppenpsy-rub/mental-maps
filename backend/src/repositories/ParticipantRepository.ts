import { AppDataSource } from '../database/connection';
import { Participant } from '../models/Participant';
import { BaseRepository } from './BaseRepository';
import { ApiError } from '../types/errors';
import { IsNull, Not } from 'typeorm';

export class ParticipantRepository extends BaseRepository<Participant> {
    constructor() {
        super(AppDataSource.getRepository(Participant));
    }

    async findBySessionToken(sessionToken: string): Promise<Participant | null> {
        try {
            return await this.repository.findOne({
                where: { sessionToken },
                relations: ['responses']
            });
        } catch (error) {
            throw new ApiError('Failed to find participant by session token', 500, 'DATABASE_ERROR', error);
        }
    }

    async findByStudyId(studyId: string): Promise<Participant[]> {
        try {
            return await this.repository.find({
                where: { studyId },
                relations: ['responses'],
                order: { startedAt: 'DESC' }
            });
        } catch (error) {
            throw new ApiError('Failed to find participants by study ID', 500, 'DATABASE_ERROR', error);
        }
    }

    async findByStudy(studyId: string): Promise<Participant[]> {
        // Alias for findByStudyId to maintain consistency with other services
        return this.findByStudyId(studyId);
    }

    async findActiveParticipants(studyId: string): Promise<Participant[]> {
        try {
            return await this.repository.find({
                where: {
                    studyId,
                    completedAt: IsNull() // Not completed yet
                },
                relations: ['responses'],
                order: { startedAt: 'DESC' }
            });
        } catch (error) {
            throw new ApiError('Failed to find active participants', 500, 'DATABASE_ERROR', error);
        }
    }

    async findCompletedParticipants(studyId: string): Promise<Participant[]> {
        try {
            return await this.repository
                .createQueryBuilder('participant')
                .where('participant.studyId = :studyId', { studyId })
                .andWhere('participant.completedAt IS NOT NULL')
                .leftJoinAndSelect('participant.responses', 'responses')
                .orderBy('participant.completedAt', 'DESC')
                .getMany();
        } catch (error) {
            throw new ApiError('Failed to find completed participants', 500, 'DATABASE_ERROR', error);
        }
    }

    async countParticipantsByStudy(studyId: string): Promise<{
        total: number;
        active: number;
        completed: number;
    }> {
        try {
            const [total, completed] = await Promise.all([
                this.repository.count({ where: { studyId } }),
                this.repository.count({
                    where: {
                        studyId,
                        completedAt: Not(IsNull())
                    }
                })
            ]);

            return {
                total,
                completed,
                active: total - completed
            };
        } catch (error) {
            throw new ApiError('Failed to count participants', 500, 'DATABASE_ERROR', error);
        }
    }

    async findWithResponses(participantId: string): Promise<Participant | null> {
        try {
            return await this.repository.findOne({
                where: { id: participantId },
                relations: ['responses', 'responses.mapDrawing', 'responses.question']
            });
        } catch (error) {
            throw new ApiError('Failed to find participant with responses', 500, 'DATABASE_ERROR', error);
        }
    }

    async deleteExpiredSessions(cutoffDate: Date): Promise<number> {
        try {
            const result = await this.repository
                .createQueryBuilder()
                .delete()
                .from(Participant)
                .where('startedAt < :cutoffDate', { cutoffDate })
                .andWhere('completedAt IS NULL') // Only delete incomplete sessions
                .execute();

            return result.affected || 0;
        } catch (error) {
            throw new ApiError('Failed to delete expired sessions', 500, 'DATABASE_ERROR', error);
        }
    }

    async findByDemographicCriteria(
        studyId: string,
        criteria: Record<string, any>
    ): Promise<Participant[]> {
        try {
            const queryBuilder = this.repository
                .createQueryBuilder('participant')
                .where('participant.studyId = :studyId', { studyId });

            // Add demographic filters
            Object.entries(criteria).forEach(([key, value], index) => {
                if (value !== null && value !== undefined) {
                    queryBuilder.andWhere(
                        `participant.demographicData ->> :key${index} = :value${index}`,
                        { [`key${index}`]: key, [`value${index}`]: value }
                    );
                }
            });

            return await queryBuilder
                .leftJoinAndSelect('participant.responses', 'responses')
                .orderBy('participant.startedAt', 'DESC')
                .getMany();
        } catch (error) {
            throw new ApiError('Failed to find participants by demographic criteria', 500, 'DATABASE_ERROR', error);
        }
    }

    async getParticipantStatistics(studyId: string): Promise<{
        totalParticipants: number;
        completedParticipants: number;
        averageCompletionTime: number | null;
        demographicBreakdown: Record<string, Record<string, number>>;
    }> {
        try {
            const participants = await this.repository.find({
                where: { studyId },
                select: ['id', 'startedAt', 'completedAt', 'demographicData']
            });

            const completed = participants.filter(p => p.completedAt);

            // Calculate average completion time
            let averageCompletionTime: number | null = null;
            if (completed.length > 0) {
                const totalTime = completed.reduce((sum, p) => {
                    return sum + (p.completedAt!.getTime() - p.startedAt.getTime());
                }, 0);
                averageCompletionTime = totalTime / completed.length;
            }

            // Calculate demographic breakdown
            const demographicBreakdown: Record<string, Record<string, number>> = {};
            participants.forEach(participant => {
                if (participant.demographicData) {
                    Object.entries(participant.demographicData).forEach(([key, value]) => {
                        if (!demographicBreakdown[key]) {
                            demographicBreakdown[key] = {};
                        }
                        const stringValue = String(value);
                        demographicBreakdown[key][stringValue] = (demographicBreakdown[key][stringValue] || 0) + 1;
                    });
                }
            });

            return {
                totalParticipants: participants.length,
                completedParticipants: completed.length,
                averageCompletionTime,
                demographicBreakdown
            };
        } catch (error) {
            throw new ApiError('Failed to get participant statistics', 500, 'DATABASE_ERROR', error);
        }
    }
}