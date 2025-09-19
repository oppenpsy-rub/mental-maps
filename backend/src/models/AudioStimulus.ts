import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Question } from './Question';

export interface AudioMetadata {
  speaker?: string;
  dialect?: string;
  region?: string;
  recordingLocation?: string;
  recordingDate?: string;
  quality?: 'low' | 'medium' | 'high';
  sampleRate?: number;
  bitRate?: number;
  channels?: number;
  format?: string;
  tags?: string[];
  
  // Research-specific metadata
  recordingEquipment?: string;
  recordingConditions?: string;
  transcription?: string;
  phoneticTranscription?: string;
  linguisticFeatures?: string[];
  
  // Additional research fields
  notes?: string;
  researcherComments?: string;
  validationStatus?: 'pending' | 'validated' | 'rejected';
  [key: string]: any; // Allow additional custom metadata
}

@Entity('audio_stimuli')
export class AudioStimulus {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'question_id' })
  questionId!: string;

  @Column({ type: 'varchar', length: 255 })
  filename!: string;

  @Column({ type: 'varchar', length: 500, name: 'file_path' })
  filePath!: string;

  @Column({ type: 'bigint', nullable: true, name: 'file_size' })
  fileSize?: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true, name: 'duration_seconds' })
  durationSeconds?: number;

  @Column({ type: 'jsonb', default: {} })
  metadata!: AudioMetadata;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // Relations
  @ManyToOne(() => Question, question => question.audioStimuli, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question!: Question;
}