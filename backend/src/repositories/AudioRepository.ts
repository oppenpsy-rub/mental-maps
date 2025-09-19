import { Repository } from 'typeorm';
import { AppDataSource } from '../database/connection';
import { AudioStimulus, AudioMetadata } from '../models/AudioStimulus';
import { BaseRepository } from './BaseRepository';

export class AudioRepository extends BaseRepository<AudioStimulus> {
  private audioRepository: Repository<AudioStimulus>;

  constructor() {
    const repository = AppDataSource.getRepository(AudioStimulus);
    super(repository);
    this.audioRepository = repository;
  }

  async findByQuestionId(questionId: string): Promise<AudioStimulus[]> {
    return this.audioRepository.find({
      where: { questionId },
      order: { createdAt: 'ASC' }
    });
  }

  async findByFilename(filename: string): Promise<AudioStimulus | null> {
    return this.audioRepository.findOne({
      where: { filename }
    });
  }

  async updateMetadata(id: string, metadata: AudioMetadata): Promise<AudioStimulus | null> {
    await this.audioRepository.update(id, { metadata });
    return this.findById(id);
  }

  async deleteByQuestionId(questionId: string): Promise<void> {
    await this.audioRepository.delete({ questionId });
  }

  async findWithQuestion(id: string): Promise<AudioStimulus | null> {
    return this.audioRepository.findOne({
      where: { id },
      relations: ['question']
    });
  }
}