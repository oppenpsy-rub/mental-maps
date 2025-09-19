import { Repository, FindOptionsWhere, FindManyOptions, DeepPartial, ObjectLiteral } from 'typeorm';
import { ApiError } from '../types/errors';

export abstract class BaseRepository<T extends ObjectLiteral> {
  protected repository: Repository<T>;

  constructor(repository: Repository<T>) {
    this.repository = repository;
  }

  async findById(id: string): Promise<T | null> {
    try {
      return await this.repository.findOne({ where: { id } as any });
    } catch (error) {
      throw new ApiError('Failed to find entity by ID', 500, 'DATABASE_ERROR', error);
    }
  }

  async findByIdOrFail(id: string): Promise<T> {
    const entity = await this.findById(id);
    if (!entity) {
      throw ApiError.notFound(`Entity with ID ${id} not found`);
    }
    return entity;
  }

  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    try {
      return await this.repository.find(options);
    } catch (error) {
      throw new ApiError('Failed to find entities', 500, 'DATABASE_ERROR', error);
    }
  }

  async findOne(where: FindOptionsWhere<T>): Promise<T | null> {
    try {
      return await this.repository.findOne({ where });
    } catch (error) {
      throw new ApiError('Failed to find entity', 500, 'DATABASE_ERROR', error);
    }
  }

  async findMany(where: FindOptionsWhere<T>, options?: FindManyOptions<T>): Promise<T[]> {
    try {
      return await this.repository.find({ where, ...options });
    } catch (error) {
      throw new ApiError('Failed to find entities', 500, 'DATABASE_ERROR', error);
    }
  }

  async create(data: DeepPartial<T>): Promise<T> {
    try {
      const entity = this.repository.create(data);
      return await this.repository.save(entity);
    } catch (error) {
      throw new ApiError('Failed to create entity', 500, 'DATABASE_ERROR', error);
    }
  }

  async update(id: string, data: DeepPartial<T>): Promise<T> {
    try {
      const entity = await this.findByIdOrFail(id);
      const updatedEntity = this.repository.merge(entity, data);
      return await this.repository.save(updatedEntity);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to update entity', 500, 'DATABASE_ERROR', error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const result = await this.repository.delete(id);
      if (result.affected === 0) {
        throw ApiError.notFound(`Entity with ID ${id} not found`);
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to delete entity', 500, 'DATABASE_ERROR', error);
    }
  }

  async count(where?: FindOptionsWhere<T>): Promise<number> {
    try {
      return await this.repository.count({ where });
    } catch (error) {
      throw new ApiError('Failed to count entities', 500, 'DATABASE_ERROR', error);
    }
  }

  async exists(where: FindOptionsWhere<T>): Promise<boolean> {
    try {
      const count = await this.repository.count({ where });
      return count > 0;
    } catch (error) {
      throw new ApiError('Failed to check entity existence', 500, 'DATABASE_ERROR', error);
    }
  }
}