import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { MapDrawing } from './MapDrawing';

export type DrawingElementType = 'point' | 'line' | 'polygon' | 'circle' | 'text' | 'heatmap_point';

export interface ElementStyle {
  color?: string;
  fillColor?: string;
  strokeWidth?: number;
  strokeColor?: string;
  opacity?: number;
  fillOpacity?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: string;
  radius?: number;
  dashArray?: number[];
}

export interface ElementMetadata {
  label?: string;
  description?: string;
  intensity?: number; // For heatmap points
  confidence?: number;
  tags?: string[];
  userNotes?: string;
  createdWith?: string; // Tool used to create
  editHistory?: {
    timestamp: number;
    action: 'created' | 'modified' | 'moved' | 'styled';
    changes?: any;
  }[];
}

@Entity('drawing_elements')
export class DrawingElement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'map_drawing_id' })
  mapDrawingId!: string;

  @Column({ 
    type: 'varchar', 
    length: 50, 
    name: 'element_type',
    enum: ['point', 'line', 'polygon', 'circle', 'text', 'heatmap_point']
  })
  elementType!: DrawingElementType;

  @Column({ 
    type: 'geometry',
    spatialFeatureType: 'Geometry',
    srid: 4326
  })
  geometry!: string; // PostGIS geometry

  @Column({ type: 'jsonb', default: {}, name: 'style_properties' })
  styleProperties!: ElementStyle;

  @Column({ type: 'jsonb', default: {} })
  metadata!: ElementMetadata;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // Relations
  @ManyToOne(() => MapDrawing, mapDrawing => mapDrawing.elements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'map_drawing_id' })
  mapDrawing!: MapDrawing;
}