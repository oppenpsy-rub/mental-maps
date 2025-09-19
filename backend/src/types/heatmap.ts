export interface HeatmapPoint {
  x?: number;
  y?: number;
  lat?: number;
  lng?: number;
  intensity: number;
  metadata?: Record<string, any>;
}

export interface HeatmapGradient {
  [key: number]: string;
}

export interface HeatmapData {
  points: HeatmapPoint[];
  radius: number;
  maxIntensity: number;
  gradient: HeatmapGradient;
  blur: number;
}

export interface HeatmapOptions {
  radius?: number;
  blur?: number;
  gradient?: HeatmapGradient;
  aggregationMethod?: AggregationMethod;
  gridSize?: number;
  hotspotThreshold?: number;
  hotspotRadius?: number;
  minHotspotPoints?: number;
  enableClustering?: boolean;
  clusterRadius?: number;
}

export enum AggregationMethod {
  NONE = 'none',
  DENSITY = 'density',
  AVERAGE = 'average',
  SUM = 'sum',
  MAX = 'max'
}

export interface HeatmapAnalysisRequest {
  studyId: string;
  questionId?: string;
  options: HeatmapOptions;
  filters?: {
    participantIds?: string[];
    dateRange?: {
      start: Date;
      end: Date;
    };
    demographicFilters?: Record<string, any>;
  };
}

export interface HeatmapExportOptions {
  format: 'json' | 'geojson' | 'csv' | 'png';
  includeStatistics?: boolean;
  includeClusters?: boolean;
  includeHotspots?: boolean;
}