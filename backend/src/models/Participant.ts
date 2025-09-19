import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Study } from './Study';
import { Response } from './Response';

export interface DemographicData {
  age?: number;
  ageRange?: 'under-18' | '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+';
  gender?: string;
  education?: 'primary' | 'secondary' | 'high_school' | 'vocational' | 'bachelor' | 'master' | 'doctorate' | 'other';
  occupation?: string;
  nativeLanguage?: string;
  otherLanguages?: string[];
  birthPlace?: {
    city?: string;
    region?: string;
    country?: string;
    coordinates?: [number, number]; // [longitude, latitude]
  };
  currentResidence?: {
    city?: string;
    region?: string;
    country?: string;
    coordinates?: [number, number];
  };
  dialectBackground?: string;
  languageExposure?: {
    language: string;
    proficiency: 'basic' | 'intermediate' | 'advanced' | 'native';
    yearsOfExposure?: number;
  }[];
}

@Entity('participants')
export class Participant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'study_id' })
  studyId!: string;

  @Column({ type: 'varchar', length: 255, unique: true, name: 'session_token' })
  sessionToken!: string;

  @Column({ type: 'timestamp with time zone', nullable: true, name: 'expires_at' })
  expiresAt?: Date;

  @Column({ type: 'boolean', default: false, name: 'consent_given' })
  consentGiven!: boolean;

  @Column({ type: 'jsonb', default: {}, name: 'demographic_data' })
  demographicData!: DemographicData;

  @CreateDateColumn({ name: 'started_at' })
  startedAt!: Date;

  @Column({ type: 'timestamp with time zone', nullable: true, name: 'completed_at' })
  completedAt?: Date;

  @Column({ type: 'inet', nullable: true, name: 'ip_address' })
  ipAddress?: string;

  @Column({ type: 'text', nullable: true, name: 'user_agent' })
  userAgent?: string;

  @Column({ type: 'jsonb', nullable: true, name: 'session_data' })
  sessionData?: string;

  @Column({ type: 'timestamp with time zone', nullable: true, name: 'last_active_at' })
  lastActiveAt?: Date;

  @Column({ type: 'jsonb', nullable: true, name: 'metadata' })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Study, study => study.participants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'study_id' })
  study!: Study;

  @OneToMany(() => Response, response => response.participant)
  responses!: Response[];

  // Methods
  get isCompleted(): boolean {
    return this.completedAt !== null && this.completedAt !== undefined;
  }

  get duration(): number | null {
    if (!this.completedAt) return null;
    return this.completedAt.getTime() - this.startedAt.getTime();
  }
}