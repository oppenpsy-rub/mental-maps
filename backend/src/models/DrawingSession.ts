import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Participant } from './Participant';

@Entity('drawing_sessions')
@Unique(['participantId', 'questionId'])
export class DrawingSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'participant_id' })
  participantId!: string;

  @Column({ type: 'uuid', name: 'question_id' })
  questionId!: string;

  @Column({ type: 'jsonb', default: {}, name: 'drawing_state' })
  drawingState!: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Participant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'participant_id' })
  participant!: Participant;
}