import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Unique } from 'typeorm';
import { Participant } from './Participant';
import { Question } from './Question';
import { MapDrawing } from './MapDrawing';

export interface ResponseData {
  textResponse?: string;
  ratingValue?: number;
  selectedOptions?: string[];
  demographicResponses?: Record<string, any>;
  audioPlayCount?: number;
  audioTotalListenTime?: number;
  interactionEvents?: {
    timestamp: number;
    event: string;
    data?: any;
  }[];
}

@Entity('responses')
@Unique(['participantId', 'questionId'])
export class Response {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'participant_id' })
  participantId!: string;

  @Column({ type: 'uuid', name: 'question_id' })
  questionId!: string;

  @Column({ type: 'jsonb', default: {}, name: 'response_data' })
  responseData!: ResponseData;

  @Column({ type: 'integer', nullable: true, name: 'response_time_ms' })
  responseTimeMs?: number;

  @Column({ type: 'boolean', default: false, name: 'is_temporary' })
  isTemporary!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Participant, participant => participant.responses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'participant_id' })
  participant!: Participant;

  @ManyToOne(() => Question, question => question.responses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question!: Question;

  @OneToMany(() => MapDrawing, mapDrawing => mapDrawing.response)
  mapDrawings!: MapDrawing[];
}