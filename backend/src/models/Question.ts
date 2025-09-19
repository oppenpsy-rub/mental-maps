import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn, Unique } from 'typeorm';
import { Study } from './Study';
import { AudioStimulus } from './AudioStimulus';
import { Response } from './Response';

export type QuestionType = 'map_drawing' | 'audio_response' | 'demographic' | 'rating' | 'heatmap' | 'point_selection' | 'area_selection';

export interface PointCategory {
  id: string;
  label: string;
  color: string;
  icon?: string;
}

export interface AreaCategory {
  id: string;
  label: string;
  color: string;
  fillOpacity: number;
}

export interface RatingAspect {
  id: string;
  label: string;
  description?: string;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface QuestionConfiguration {
  // Common settings
  timeLimit?: number;
  required?: boolean;
  mapBounds?: MapBounds;
  
  // Map drawing specific
  allowedDrawingTools?: string[];
  colors?: string[];
  maxResponses?: number;
  
  // Heatmap specific
  heatmapSettings?: {
    radius?: number;
    maxIntensity?: number;
    gradient?: Record<string, string>;
  };
  intensityScale?: {
    min: number;
    max: number;
    step: number;
    labels?: string[];
  };
  
  // Point selection specific
  maxPoints?: number;
  allowMultiplePoints?: boolean;
  pointCategories?: PointCategory[];
  
  // Area selection specific
  maxAreas?: number;
  allowOverlapping?: boolean;
  areaCategories?: AreaCategory[];
  
  // Rating specific
  ratingScale?: {
    min: number;
    max: number;
    step: number;
    labels?: string[];
    scaleType: 'likert' | 'semantic_differential' | 'numeric';
  };
  ratingAspects?: RatingAspect[];
  
  // Audio response specific
  audioRequired?: boolean;
  allowReplay?: boolean;
  maxReplays?: number;
  responseType?: 'map_drawing' | 'point_selection' | 'area_selection' | 'rating';
  responseConfiguration?: Omit<QuestionConfiguration, 'audioRequired' | 'allowReplay' | 'maxReplays' | 'responseType' | 'responseConfiguration'>;
  
  // Demographic specific
  demographicFields?: {
    field: string;
    type: 'text' | 'select' | 'number' | 'date';
    options?: string[];
    required?: boolean;
  }[];
}

@Entity('questions')
@Unique(['studyId', 'orderIndex'])
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'study_id' })
  studyId!: string;

  @Column({ type: 'text', name: 'question_text' })
  questionText!: string;

  @Column({ 
    type: 'varchar', 
    length: 50, 
    name: 'question_type',
    enum: ['map_drawing', 'audio_response', 'demographic', 'rating', 'heatmap', 'point_selection', 'area_selection']
  })
  questionType!: QuestionType;

  @Column({ type: 'jsonb', default: {} })
  configuration!: QuestionConfiguration;

  @Column({ type: 'integer', name: 'order_index' })
  orderIndex!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // Relations
  @ManyToOne(() => Study, study => study.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'study_id' })
  study!: Study;

  @OneToMany(() => AudioStimulus, audioStimulus => audioStimulus.question)
  audioStimuli!: AudioStimulus[];

  @OneToMany(() => Response, response => response.question)
  responses!: Response[];
}