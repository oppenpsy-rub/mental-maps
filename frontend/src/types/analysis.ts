// Analysis types for the dashboard
export interface HeatmapPoint {
  x?: number;
  y?: number;
  lat?: number;
  lng?: number;
  intensity: number;
  metadata?: Record<string, any>;
}

export interface HeatmapData {
  points: HeatmapPoint[];
  radius: number;
  maxIntensity: number;
  gradient: HeatmapGradient;
  blur: number;
}

export interface HeatmapGradient {
  [key: number]: string;
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

export interface AnalysisFilters {
  participantIds?: string[];
  questionIds?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  demographicFilters?: Record<string, any>;
  responseTimeRange?: {
    min: number;
    max: number;
  };
}

export interface StudyStatistics {
  totalResponses: number;
  totalParticipants: number;
  averageResponseTime: number;
  averageElementsPerResponse: number;
  completionRate: number;
  responsesByQuestion: Record<string, number>;
  responsesByDay: Array<{
    date: string;
    count: number;
  }>;
}

export interface ClusterResult {
  id: string;
  centerLat: number;
  centerLng: number;
  points: HeatmapPoint[];
  averageIntensity: number;
  participantCount: number;
}

export interface HotspotRegion {
  id: string;
  centerLat: number;
  centerLng: number;
  radius: number;
  intensity: number;
  pointCount: number;
}

export interface OverlayAnalysis {
  id: string;
  name: string;
  responseIds: string[];
  combinedHeatmap: HeatmapData;
  statistics: StudyStatistics;
  clusters?: ClusterResult[];
  hotspots?: HotspotRegion[];
}

export interface AnalysisExportOptions {
  format: 'json' | 'geojson' | 'csv' | 'png' | 'pdf';
  includeStatistics?: boolean;
  includeClusters?: boolean;
  includeHotspots?: boolean;
  includeRawData?: boolean;
}

export interface DemographicSegment {
  id: string;
  name: string;
  filters: Record<string, any>;
  participantCount: number;
  responseCount: number;
  averageResponseTime: number;
}

export interface ComparisonAnalysis {
  segments: DemographicSegment[];
  comparisons: Array<{
    segmentA: string;
    segmentB: string;
    similarities: number;
    differences: number;
    statisticalSignificance?: number;
  }>;
}