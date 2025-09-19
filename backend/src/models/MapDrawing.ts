import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Response } from './Response';
import { DrawingElement } from './DrawingElement';

export interface DrawingMetadata {
  mapBounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  zoomLevel?: number;
  mapStyle?: string;
  drawingDuration?: number;
  totalElements?: number;
  canvasSize?: {
    width: number;
    height: number;
  };
  projection?: string;
}

export interface DrawingData {
  version?: string;
  canvasData?: any; // Fabric.js canvas data
  geoJsonData?: GeoJSON.FeatureCollection;
  metadata?: DrawingMetadata;
}

@Entity('map_drawings')
export class MapDrawing {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'response_id' })
  responseId!: string;

  @Column({ 
    type: 'geometry',
    spatialFeatureType: 'Polygon',
    srid: 4326,
    nullable: true
  })
  bounds?: string; // PostGIS geometry

  @Column({ type: 'jsonb', default: {}, name: 'drawing_data' })
  drawingData!: DrawingData;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // Relations
  @ManyToOne(() => Response, response => response.mapDrawings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'response_id' })
  response!: Response;

  @OneToMany(() => DrawingElement, drawingElement => drawingElement.mapDrawing)
  elements!: DrawingElement[];
}