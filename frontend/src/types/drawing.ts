export enum DrawingTool {
  PEN = 'pen',
  LINE = 'line',
  POLYGON = 'polygon',
  CIRCLE = 'circle',
  TEXT = 'text',
  HEATMAP = 'heatmap',
  SELECT = 'select'
}

export interface ToolSettings {
  strokeColor: string;
  strokeWidth: number;
  fillColor?: string;
  fillOpacity?: number;
  fontSize?: number;
  fontFamily?: string;
  // Heatmap-specific settings
  heatmapRadius?: number;
  heatmapIntensity?: number;
  heatmapGradient?: HeatmapGradient;
  heatmapBlur?: number;
}

export interface HeatmapGradient {
  [key: number]: string;
}

export interface HeatmapPoint {
  x: number;
  y: number;
  intensity: number;
  lat?: number;
  lng?: number;
}

export interface HeatmapData {
  points: HeatmapPoint[];
  radius: number;
  maxIntensity: number;
  gradient: HeatmapGradient;
  blur: number;
}

export interface DrawingElement {
  id: string;
  type: DrawingTool;
  fabricObject: fabric.Object;
  geoCoordinates?: {
    lat: number;
    lng: number;
  }[];
  metadata?: Record<string, any>;
}

export interface DrawingState {
  elements: DrawingElement[];
  activeTool: DrawingTool;
  toolSettings: ToolSettings;
  isDrawing: boolean;
  canUndo: boolean;
  canRedo: boolean;
}

export interface DrawingAction {
  type: 'ADD' | 'REMOVE' | 'MODIFY';
  element: DrawingElement;
  previousState?: DrawingElement;
}

export interface CoordinateTransform {
  canvasToGeo: (x: number, y: number) => { lat: number; lng: number };
  geoToCanvas: (lat: number, lng: number) => { x: number; y: number };
}