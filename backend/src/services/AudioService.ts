import { AudioStimulus, AudioMetadata } from '../models/AudioStimulus';
import { repositories } from '../repositories';
import { ApiError } from '../types/errors';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface AudioUploadData {
  questionId: string;
  filename: string;
  buffer: Buffer;
  mimetype: string;
  size: number;
  metadata?: Partial<AudioMetadata>;
}

export interface AudioFileInfo {
  id: string;
  filename: string;
  filePath: string;
  fileSize: number;
  durationSeconds?: number;
  metadata: AudioMetadata;
  questionId: string;
  createdAt: Date;
}

export class AudioService {
  private readonly uploadDir: string;
  private readonly allowedMimeTypes = [
    'audio/mpeg',     // MP3
    'audio/wav',      // WAV
    'audio/ogg',      // OGG
    'audio/mp4',      // M4A
    'audio/x-wav',    // Alternative WAV
    'audio/vorbis'    // OGG Vorbis
  ];
  private readonly maxFileSize = 50 * 1024 * 1024; // 50MB

  constructor() {
    this.uploadDir = process.env.AUDIO_UPLOAD_DIR || path.join(process.cwd(), 'uploads', 'audio');
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async uploadAudio(data: AudioUploadData): Promise<AudioFileInfo> {
    // Validate file
    this.validateAudioFile(data);

    // Verify question exists
    const question = await repositories.questions.findById(data.questionId);
    if (!question) {
      throw ApiError.notFound('Question not found');
    }

    // Generate unique filename
    const fileExtension = this.getFileExtension(data.mimetype);
    const uniqueFilename = `${uuidv4()}_${Date.now()}${fileExtension}`;
    const filePath = path.join(this.uploadDir, uniqueFilename);

    try {
      // Save file to disk
      await fs.writeFile(filePath, data.buffer);

      // Get audio duration (simplified - in production you'd use a library like ffprobe)
      const durationSeconds = await this.getAudioDuration(filePath);

      // Create database record
      const audioStimulus = await repositories.audio.create({
        questionId: data.questionId,
        filename: data.filename,
        filePath: filePath,
        fileSize: data.size,
        durationSeconds,
        metadata: {
          format: data.mimetype,
          ...data.metadata
        }
      });

      return this.mapToAudioFileInfo(audioStimulus);
    } catch (error) {
      // Clean up file if database operation fails
      try {
        await fs.unlink(filePath);
      } catch {
        // Ignore cleanup errors
      }
      throw error;
    }
  }

  async getAudioFile(id: string): Promise<{ buffer: Buffer; mimetype: string; filename: string }> {
    const audioStimulus = await repositories.audio.findById(id);
    if (!audioStimulus) {
      throw ApiError.notFound('Audio file not found');
    }

    try {
      const buffer = await fs.readFile(audioStimulus.filePath);
      return {
        buffer,
        mimetype: audioStimulus.metadata.format || 'audio/mpeg',
        filename: audioStimulus.filename
      };
    } catch (error) {
      throw ApiError.internal('Audio file not accessible');
    }
  }

  async getAudioMetadata(id: string): Promise<AudioFileInfo> {
    const audioStimulus = await repositories.audio.findById(id);
    if (!audioStimulus) {
      throw ApiError.notFound('Audio file not found');
    }

    return this.mapToAudioFileInfo(audioStimulus);
  }

  async updateAudioMetadata(id: string, metadata: Partial<AudioMetadata>): Promise<AudioFileInfo> {
    const audioStimulus = await repositories.audio.findById(id);
    if (!audioStimulus) {
      throw ApiError.notFound('Audio file not found');
    }

    const updatedMetadata = {
      ...audioStimulus.metadata,
      ...metadata
    };

    const updated = await repositories.audio.updateMetadata(id, updatedMetadata);
    if (!updated) {
      throw ApiError.internal('Failed to update metadata');
    }

    return this.mapToAudioFileInfo(updated);
  }

  async deleteAudio(id: string): Promise<void> {
    const audioStimulus = await repositories.audio.findById(id);
    if (!audioStimulus) {
      throw ApiError.notFound('Audio file not found');
    }

    try {
      // Delete file from disk
      await fs.unlink(audioStimulus.filePath);
    } catch (error) {
      console.warn(`Failed to delete audio file from disk: ${audioStimulus.filePath}`, error);
    }

    // Delete database record
    await repositories.audio.delete(id);
  }

  async getAudiosByQuestion(questionId: string): Promise<AudioFileInfo[]> {
    const audioStimuli = await repositories.audio.findByQuestionId(questionId);
    return audioStimuli.map(audio => this.mapToAudioFileInfo(audio));
  }

  private validateAudioFile(data: AudioUploadData): void {
    if (!this.allowedMimeTypes.includes(data.mimetype)) {
      throw ApiError.badRequest(
        `Unsupported audio format. Allowed formats: ${this.allowedMimeTypes.join(', ')}`
      );
    }

    if (data.size > this.maxFileSize) {
      throw ApiError.badRequest(
        `File too large. Maximum size: ${this.maxFileSize / (1024 * 1024)}MB`
      );
    }

    if (!data.buffer || data.buffer.length === 0) {
      throw ApiError.badRequest('Empty file not allowed');
    }
  }

  private getFileExtension(mimetype: string): string {
    const extensions: Record<string, string> = {
      'audio/mpeg': '.mp3',
      'audio/wav': '.wav',
      'audio/x-wav': '.wav',
      'audio/ogg': '.ogg',
      'audio/vorbis': '.ogg',
      'audio/mp4': '.m4a'
    };
    return extensions[mimetype] || '.mp3';
  }

  private async getAudioDuration(filePath: string): Promise<number | undefined> {
    // Simplified duration detection - in production use ffprobe or similar
    // For now, return undefined and let the frontend handle duration detection
    return undefined;
  }

  private mapToAudioFileInfo(audioStimulus: AudioStimulus): AudioFileInfo {
    return {
      id: audioStimulus.id,
      filename: audioStimulus.filename,
      filePath: audioStimulus.filePath,
      fileSize: audioStimulus.fileSize || 0,
      durationSeconds: audioStimulus.durationSeconds ? Number(audioStimulus.durationSeconds) : undefined,
      metadata: audioStimulus.metadata,
      questionId: audioStimulus.questionId,
      createdAt: audioStimulus.createdAt
    };
  }
}