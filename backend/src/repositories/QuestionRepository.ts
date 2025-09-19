import { AppDataSource } from '../database/connection';
import { Question } from '../models/Question';
import { BaseRepository } from './BaseRepository';
import { ApiError } from '../types/errors';

export class QuestionRepository extends BaseRepository<Question> {
  constructor() {
    super(AppDataSource.getRepository(Question));
  }

  async findByStudy(studyId: string): Promise<Question[]> {
    try {
      return await this.repository.find({
        where: { studyId },
        order: { orderIndex: 'ASC' }
      });
    } catch (error) {
      throw new ApiError('Failed to find questions by study', 500, 'DATABASE_ERROR', error);
    }
  }

  async findByStudyWithAudio(studyId: string): Promise<Question[]> {
    try {
      return await this.repository.find({
        where: { studyId },
        relations: ['audioStimuli'],
        order: { orderIndex: 'ASC' }
      });
    } catch (error) {
      throw new ApiError('Failed to find questions with audio by study', 500, 'DATABASE_ERROR', error);
    }
  }

  async findWithResponses(id: string): Promise<Question | null> {
    try {
      return await this.repository.findOne({
        where: { id },
        relations: ['responses', 'responses.mapDrawings']
      });
    } catch (error) {
      throw new ApiError('Failed to find question with responses', 500, 'DATABASE_ERROR', error);
    }
  }

  async reorderQuestions(studyId: string, questionOrders: { id: string; orderIndex: number }[]): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const { id, orderIndex } of questionOrders) {
        await queryRunner.manager.update(Question, { id, studyId }, { orderIndex });
      }
      
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new ApiError('Failed to reorder questions', 500, 'DATABASE_ERROR', error);
    } finally {
      await queryRunner.release();
    }
  }

  async getNextOrderIndex(studyId: string): Promise<number> {
    try {
      const result = await this.repository
        .createQueryBuilder('question')
        .select('MAX(question.orderIndex)', 'maxOrder')
        .where('question.studyId = :studyId', { studyId })
        .getRawOne();

      return (result.maxOrder || 0) + 1;
    } catch (error) {
      throw new ApiError('Failed to get next order index', 500, 'DATABASE_ERROR', error);
    }
  }

  async findByType(studyId: string, questionType: string): Promise<Question[]> {
    try {
      return await this.repository.find({
        where: { studyId, questionType: questionType as any },
        order: { orderIndex: 'ASC' }
      });
    } catch (error) {
      throw new ApiError('Failed to find questions by type', 500, 'DATABASE_ERROR', error);
    }
  }

  async duplicateQuestion(id: string, newStudyId?: string): Promise<Question> {
    try {
      const originalQuestion = await this.repository.findOne({
        where: { id },
        relations: ['audioStimuli']
      });

      if (!originalQuestion) {
        throw ApiError.notFound(`Question with ID ${id} not found`);
      }

      const targetStudyId = newStudyId || originalQuestion.studyId;
      const nextOrderIndex = await this.getNextOrderIndex(targetStudyId);

      const newQuestion = new Question();
      newQuestion.studyId = targetStudyId;
      newQuestion.questionText = originalQuestion.questionText;
      newQuestion.questionType = originalQuestion.questionType;
      newQuestion.configuration = { ...originalQuestion.configuration };
      newQuestion.orderIndex = nextOrderIndex;

      return await this.repository.save(newQuestion);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to duplicate question', 500, 'DATABASE_ERROR', error);
    }
  }

  async findByIds(ids: string[]): Promise<Question[]> {
    try {
      return await this.repository.findByIds(ids);
    } catch (error) {
      throw new ApiError('Failed to find questions by IDs', 500, 'DATABASE_ERROR', error);
    }
  }

  async updateOrderIndex(id: string, orderIndex: number): Promise<void> {
    try {
      await this.repository.update({ id }, { orderIndex });
    } catch (error) {
      throw new ApiError('Failed to update question order index', 500, 'DATABASE_ERROR', error);
    }
  }

  async shiftQuestionsOrder(studyId: string, fromIndex: number, shift: number): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (shift > 0) {
        // Shifting up (making room for insertion)
        await queryRunner.manager
          .createQueryBuilder()
          .update(Question)
          .set({ orderIndex: () => `"order_index" + ${shift}` })
          .where('studyId = :studyId AND "order_index" >= :fromIndex', { studyId, fromIndex })
          .execute();
      } else {
        // Shifting down (filling gap after deletion)
        await queryRunner.manager
          .createQueryBuilder()
          .update(Question)
          .set({ orderIndex: () => `"order_index" ${shift}` })
          .where('studyId = :studyId AND "order_index" >= :fromIndex', { studyId, fromIndex })
          .execute();
      }
      
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new ApiError('Failed to shift questions order', 500, 'DATABASE_ERROR', error);
    } finally {
      await queryRunner.release();
    }
  }

  async reorderQuestion(questionId: string, oldIndex: number, newIndex: number): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const question = await queryRunner.manager.findOne(Question, { where: { id: questionId } });
      if (!question) {
        throw ApiError.notFound('Question not found');
      }

      if (oldIndex < newIndex) {
        // Moving down: shift questions between old and new position up
        await queryRunner.manager
          .createQueryBuilder()
          .update(Question)
          .set({ orderIndex: () => '"order_index" - 1' })
          .where('studyId = :studyId AND "order_index" > :oldIndex AND "order_index" <= :newIndex', {
            studyId: question.studyId,
            oldIndex,
            newIndex
          })
          .execute();
      } else if (oldIndex > newIndex) {
        // Moving up: shift questions between new and old position down
        await queryRunner.manager
          .createQueryBuilder()
          .update(Question)
          .set({ orderIndex: () => '"order_index" + 1' })
          .where('studyId = :studyId AND "order_index" >= :newIndex AND "order_index" < :oldIndex', {
            studyId: question.studyId,
            oldIndex,
            newIndex
          })
          .execute();
      }

      // Update the question's position
      await queryRunner.manager.update(Question, { id: questionId }, { orderIndex: newIndex });
      
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to reorder question', 500, 'DATABASE_ERROR', error);
    } finally {
      await queryRunner.release();
    }
  }
}