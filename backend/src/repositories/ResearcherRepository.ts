import { AppDataSource } from '../database/connection';
import { Researcher } from '../models/Researcher';
import { BaseRepository } from './BaseRepository';
import { ApiError } from '../types/errors';

export class ResearcherRepository extends BaseRepository<Researcher> {
  constructor() {
    super(AppDataSource.getRepository(Researcher));
  }

  async findByEmail(email: string): Promise<Researcher | null> {
    try {
      return await this.repository.findOne({ where: { email } });
    } catch (error) {
      throw new ApiError('Failed to find researcher by email', 500, 'DATABASE_ERROR', error);
    }
  }

  async findByEmailOrFail(email: string): Promise<Researcher> {
    const researcher = await this.findByEmail(email);
    if (!researcher) {
      throw ApiError.notFound(`Researcher with email ${email} not found`);
    }
    return researcher;
  }

  async emailExists(email: string): Promise<boolean> {
    try {
      const count = await this.repository.count({ where: { email } });
      return count > 0;
    } catch (error) {
      throw new ApiError('Failed to check email existence', 500, 'DATABASE_ERROR', error);
    }
  }

  async findWithStudies(id: string): Promise<Researcher | null> {
    try {
      return await this.repository.findOne({
        where: { id },
        relations: ['studies']
      });
    } catch (error) {
      throw new ApiError('Failed to find researcher with studies', 500, 'DATABASE_ERROR', error);
    }
  }

  async searchByName(name: string, limit: number = 10): Promise<Researcher[]> {
    try {
      return await this.repository
        .createQueryBuilder('researcher')
        .where('researcher.name ILIKE :name', { name: `%${name}%` })
        .limit(limit)
        .getMany();
    } catch (error) {
      throw new ApiError('Failed to search researchers by name', 500, 'DATABASE_ERROR', error);
    }
  }

  async findByInstitution(institution: string): Promise<Researcher[]> {
    try {
      return await this.repository.find({
        where: { institution }
      });
    } catch (error) {
      throw new ApiError('Failed to find researchers by institution', 500, 'DATABASE_ERROR', error);
    }
  }
}