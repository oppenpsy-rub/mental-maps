import { AppDataSource } from '../database/connection';
import { Study } from '../models/Study';
import { BaseRepository } from './BaseRepository';
import { ApiError } from '../types/errors';

export class StudyRepository extends BaseRepository<Study> {
  constructor() {
    super(AppDataSource.getRepository(Study));
  }

  async findByResearcher(researcherId: string): Promise<Study[]> {
    try {
      return await this.repository.find({
        where: { researcherId },
        order: { createdAt: 'DESC' }
      });
    } catch (error) {
      throw new ApiError('Failed to find studies by researcher', 500, 'DATABASE_ERROR', error);
    }
  }

  async findActiveStudies(): Promise<Study[]> {
    try {
      return await this.repository.find({
        where: { active: true },
        order: { createdAt: 'DESC' }
      });
    } catch (error) {
      throw new ApiError('Failed to find active studies', 500, 'DATABASE_ERROR', error);
    }
  }

  async findWithQuestions(id: string): Promise<Study | null> {
    try {
      return await this.repository.findOne({
        where: { id },
        relations: ['questions'],
        order: {
          questions: { orderIndex: 'ASC' }
        }
      });
    } catch (error) {
      throw new ApiError('Failed to find study with questions', 500, 'DATABASE_ERROR', error);
    }
  }

  async findWithParticipants(id: string): Promise<Study | null> {
    try {
      return await this.repository.findOne({
        where: { id },
        relations: ['participants']
      });
    } catch (error) {
      throw new ApiError('Failed to find study with participants', 500, 'DATABASE_ERROR', error);
    }
  }

  async findWithFullData(id: string): Promise<Study | null> {
    try {
      return await this.repository.findOne({
        where: { id },
        relations: [
          'questions',
          'questions.audioStimuli',
          'participants',
          'participants.responses'
        ],
        order: {
          questions: { orderIndex: 'ASC' }
        }
      });
    } catch (error) {
      throw new ApiError('Failed to find study with full data', 500, 'DATABASE_ERROR', error);
    }
  }

  async findByStatus(status: string): Promise<Study[]> {
    try {
      return await this.repository.find({
        where: { status: status as any },
        order: { createdAt: 'DESC' }
      });
    } catch (error) {
      throw new ApiError('Failed to find studies by status', 500, 'DATABASE_ERROR', error);
    }
  }

  async findByStatusAndResearcher(status: string, researcherId: string): Promise<Study[]> {
    try {
      return await this.repository.find({
        where: { 
          status: status as any,
          researcherId 
        },
        order: { createdAt: 'DESC' }
      });
    } catch (error) {
      throw new ApiError('Failed to find studies by status and researcher', 500, 'DATABASE_ERROR', error);
    }
  }

  async searchByTitle(title: string, researcherId?: string): Promise<Study[]> {
    try {
      const queryBuilder = this.repository
        .createQueryBuilder('study')
        .where('study.title ILIKE :title', { title: `%${title}%` });

      if (researcherId) {
        queryBuilder.andWhere('study.researcherId = :researcherId', { researcherId });
      }

      return await queryBuilder
        .orderBy('study.createdAt', 'DESC')
        .getMany();
    } catch (error) {
      throw new ApiError('Failed to search studies by title', 500, 'DATABASE_ERROR', error);
    }
  }

  async getStudyStatistics(id: string): Promise<any> {
    try {
      const result = await this.repository
        .createQueryBuilder('study')
        .leftJoin('study.participants', 'participant')
        .leftJoin('participant.responses', 'response')
        .leftJoin('study.questions', 'question')
        .select([
          'study.id',
          'study.title',
          'study.active',
          'COUNT(DISTINCT participant.id) as participantCount',
          'COUNT(DISTINCT response.id) as responseCount',
          'COUNT(DISTINCT question.id) as questionCount'
        ])
        .where('study.id = :id', { id })
        .groupBy('study.id, study.title, study.active')
        .getRawOne();

      return {
        ...result,
        participantCount: parseInt(result.participantCount) || 0,
        responseCount: parseInt(result.responseCount) || 0,
        questionCount: parseInt(result.questionCount) || 0
      };
    } catch (error) {
      throw new ApiError('Failed to get study statistics', 500, 'DATABASE_ERROR', error);
    }
  }
}