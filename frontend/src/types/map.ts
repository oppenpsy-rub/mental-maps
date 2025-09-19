import L from 'leaflet';

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapConfiguration {
  initialBounds?: MapBounds;
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  center?: [number, number];
  mapStyle?: MapStyle;
  enabledTools?: DrawingTool[];
  customLayers?: CustomLayer[];
}

export enum MapStyle {
  STANDARD = 'standard',
  SATELLITE = 'satellite',
  TERRAIN = 'terrain',
  DARK = 'dark',
  LIGHT = 'light'
}

export enum DrawingTool {
  PEN = 'pen',
  LINE = 'line',
  POLYGON = 'polygon',
  CIRCLE = 'circle',
  TEXT = 'text',
  HEATMAP = 'heatmap',
  MARKER = 'marker'
}

export interface CustomLayer {
  id: string;
  name: string;
  url: string;
  attribution: string;
  maxZoom?: number;
  minZoom?: number;
}

export interface MapEventHandlers {
  onMapReady?: (map: L.Map) => void;
  onBoundsChange?: (bounds: L.LatLngBounds) => void;
  onZoomChange?: (zoom: number) => void;
  onClick?: (event: L.LeafletMouseEvent) => void;
  onDoubleClick?: (event: L.LeafletMouseEvent) => void;
  onMouseMove?: (event: L.LeafletMouseEvent) => void;
}

export interface MapState {
  isLoaded: boolean;
  currentZoom: number;
  currentBounds: L.LatLngBounds | null;
  currentCenter: L.LatLng | null;
  mapInstance: L.Map | null;
}

// Utility type for coordinate pairs
export type Coordinates = [number, number]; // [lat, lng]

// Geographic bounds utility
export interface GeoBounds {
  northEast: Coordinates;
  southWest: Coordinates;
}

export const createLatLngBounds = (bounds: MapBounds): L.LatLngBounds => {
  return L.latLngBounds(
    [bounds.south, bounds.west],
    [bounds.north, bounds.east]
  );
};

export const boundsToMapBounds = (bounds: L.LatLngBounds): MapBounds => {
  return {
    north: bounds.getNorth(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    west: bounds.getWest()
  };
};