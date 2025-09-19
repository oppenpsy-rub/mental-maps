import { AppDataSource } from '../database/connection';
import { Response } from '../models/Response';
import { BaseRepository } from './BaseRepository';
import { ApiError } from '../types/errors';

export class ResponseRepository extends BaseRepository<Response> {
  constructor() {
    super(AppDataSource.getRepository(Response));
  }

  async findByParticipant(participantId: string): Promise<Response[]> {
    try {
      return await this.repository.find({
        where: { participantId },
        relations: ['question'],
        order: { createdAt: 'ASC' }
      });
    } catch (error) {
      throw new ApiError('Failed to find responses by participant', 500, 'DATABASE_ERROR', error);
    }
  }

  async findByQuestion(questionId: string): Promise<Response[]> {
    try {
      return await this.repository.find({
        where: { questionId },
        relations: ['participant', 'mapDrawings'],
        order: { createdAt: 'ASC' }
      });
    } catch (error) {
      throw new ApiError('Failed to find responses by question', 500, 'DATABASE_ERROR', error);
    }
  }

  async findByStudy(studyId: string): Promise<Response[]> {
    try {
      return await this.repository
        .createQueryBuilder('response')
        .leftJoinAndSelect('response.participant', 'participant')
        .leftJoinAndSelect('response.question', 'question')
        .leftJoinAndSelect('response.mapDrawings', 'mapDrawings')
        .where('participant.studyId = :studyId', { studyId })
        .orderBy('response.createdAt', 'ASC')
        .getMany();
    } catch (error) {
      throw new ApiError('Failed to find responses by study', 500, 'DATABASE_ERROR', error);
    }
  }

  async findWithMapDrawings(id: string): Promise<Response | null> {
    try {
      return await this.repository.findOne({
        where: { id },
        relations: ['mapDrawings', 'mapDrawings.elements']
      });
    } catch (error) {
      throw new ApiError('Failed to find response with map drawings', 500, 'DATABASE_ERROR', error);
    }
  }

  async findByParticipantAndQuestion(participantId: string, questionId: string): Promise<Response | null> {
    try {
      return await this.repository.findOne({
        where: { participantId, questionId },
        relations: ['mapDrawings']
      });
    } catch (error) {
      throw new ApiError('Failed to find response by participant and question', 500, 'DATABASE_ERROR', error);
    }
  }

  async getResponseStatistics(studyId: string): Promise<any> {
    try {
      const result = await this.repository
        .createQueryBuilder('response')
        .leftJoin('response.participant', 'participant')
        .leftJoin('response.question', 'question')
        .select([
          'COUNT(DISTINCT response.id) as totalResponses',
          'COUNT(DISTINCT participant.id) as uniqueParticipants',
          'COUNT(DISTINCT question.id) as questionsAnswered',
          'AVG(response.responseTimeMs) as avgResponseTime',
          'MIN(response.createdAt) as firstResponse',
          'MAX(response.createdAt) as lastResponse'
        ])
        .where('participant.studyId = :studyId', { studyId })
        .getRawOne();

      return {
        totalResponses: parseInt(result.totalResponses) || 0,
        uniqueParticipants: parseInt(result.uniqueParticipants) || 0,
        questionsAnswered: parseInt(result.questionsAnswered) || 0,
        avgResponseTime: parseFloat(result.avgResponseTime) || 0,
        firstResponse: result.firstResponse,
        lastResponse: result.lastResponse
      };
    } catch (error) {
      throw new ApiError('Failed to get response statistics', 500, 'DATABASE_ERROR', error);
    }
  }

  async findIncompleteResponses(studyId: string): Promise<Response[]> {
    try {
      return await this.repository
        .createQueryBuilder('response')
        .leftJoinAndSelect('response.participant', 'participant')
        .leftJoinAndSelect('response.question', 'question')
        .where('participant.studyId = :studyId', { studyId })
        .andWhere('participant.completedAt IS NULL')
        .orderBy('response.updatedAt', 'DESC')
        .getMany();
    } catch (error) {
      throw new ApiError('Failed to find incomplete responses', 500, 'DATABASE_ERROR', error);
    }
  }

  async exportResponses(studyId: string, format: 'json' | 'csv' = 'json'): Promise<any[]> {
    try {
      const responses = await this.repository
        .createQueryBuilder('response')
        .leftJoinAndSelect('response.participant', 'participant')
        .leftJoinAndSelect('response.question', 'question')
        .leftJoinAndSelect('response.mapDrawings', 'mapDrawings')
        .leftJoinAndSelect('mapDrawings.elements', 'elements')
        .where('participant.studyId = :studyId', { studyId })
        .orderBy('participant.startedAt', 'ASC')
        .addOrderBy('question.orderIndex', 'ASC')
        .getMany();

      if (format === 'csv') {
        // Flatten data for CSV export
        return responses.map(response => ({
          responseId: response.id,
          participantId: response.participantId,
          questionId: response.questionId,
          questionText: response.question?.questionText,
          questionType: response.question?.questionType,
          responseData: JSON.stringify(response.responseData),
          responseTimeMs: response.responseTimeMs,
          createdAt: response.createdAt,
          participantStartedAt: response.participant?.startedAt,
          participantCompletedAt: response.participant?.completedAt,
          demographicData: JSON.stringify(response.participant?.demographicData),
          mapDrawingsCount: response.mapDrawings?.length || 0
        }));
      }

      return responses;
    } catch (error) {
      throw new ApiError('Failed to export responses', 500, 'DATABASE_ERROR', error);
    }
  }

  async findByStudyWithFilters(studyId: string, filters?: any): Promise<Response[]> {
    try {
      let query = this.repository
        .createQueryBuilder('response')
        .leftJoinAndSelect('response.participant', 'participant')
        .leftJoinAndSelect('response.question', 'question')
        .leftJoinAndSelect('response.mapDrawings', 'mapDrawings')
        .where('participant.studyId = :studyId', { studyId });

      if (filters?.questionType) {
        query = query.andWhere('question.questionType = :questionType', { questionType: filters.questionType });
      }

      if (filters?.hasMapDrawing !== undefined) {
        if (filters.hasMapDrawing) {
          query = query.andWhere('mapDrawings.id IS NOT NULL');
        } else {
          query = query.andWhere('mapDrawings.id IS NULL');
        }
      }

      if (filters?.dateFrom) {
        query = query.andWhere('response.createdAt >= :dateFrom', { dateFrom: filters.dateFrom });
      }

      if (filters?.dateTo) {
        query = query.andWhere('response.createdAt <= :dateTo', { dateTo: filters.dateTo });
      }

      return await query
        .orderBy('response.createdAt', 'DESC')
        .getMany();
    } catch (error) {
      throw new ApiError('Failed to find responses by study with filters', 500, 'DATABASE_ERROR', error);
    }
  }

}