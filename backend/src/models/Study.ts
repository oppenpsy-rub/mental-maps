import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Researcher } from './Researcher';
import { Question } from './Question';
import { Participant } from './Participant';

export enum StudyStatus {
  DRAFT = 'draft',
  READY = 'ready',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}

export interface StudySettings {
  mapConfiguration?: {
    initialBounds?: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
    allowedZoomLevels?: [number, number];
    mapStyle?: string;
    enabledTools?: string[];
    customLayers?: any[];
  };
  participantSettings?: {
    allowAnonymous?: boolean;
    requireDemographics?: boolean;
    maxParticipants?: number;
  };
  dataCollection?: {
    collectIPAddress?: boolean;
    collectUserAgent?: boolean;
    autoSave?: boolean;
  };
}

export interface StudyStatusHistory {
  status: StudyStatus;
  timestamp: Date;
  reason?: string;
  changedBy: string;
}

@Entity('studies')
export class Study {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'researcher_id' })
  researcherId!: string;

  @Column({ type: 'varchar', length: 500 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', default: {} })
  settings!: StudySettings;

  @Column({ 
    type: 'enum', 
    enum: StudyStatus, 
    default: StudyStatus.DRAFT 
  })
  status!: StudyStatus;

  @Column({ type: 'boolean', default: false })
  active!: boolean;

  @Column({ type: 'jsonb', default: [] })
  statusHistory!: StudyStatusHistory[];

  @Column({ type: 'timestamp', nullable: true, name: 'activated_at' })
  activatedAt?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'deactivated_at' })
  deactivatedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Researcher, researcher => researcher.studies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'researcher_id' })
  researcher!: Researcher;

  @OneToMany(() => Question, question => question.study)
  questions!: Question[];

  @OneToMany(() => Participant, participant => participant.study)
  participants!: Participant[];
}