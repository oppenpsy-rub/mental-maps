export interface CanvasCoordinates {
  x: number;
  y: number;
}

export interface GeoCoordinates {
  lng: number;
  lat: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface CanvasBounds {
  width: number;
  height: number;
}

export interface CoordinateTransformOptions {
  mapBounds: MapBounds;
  canvasBounds: CanvasBounds;
}

export class GeodataSerializationService {
  static canvasToGeo(
    canvasCoords: CanvasCoordinates,
    options: CoordinateTransformOptions
  ): GeoCoordinates {
    const { mapBounds, canvasBounds } = options;
    
    // Normalize canvas coordinates (0-1)
    const normalizedX = canvasCoords.x / canvasBounds.width;
    const normalizedY = canvasCoords.y / canvasBounds.height;
    
    // Transform to geographic coordinates
    const lng = mapBounds.west + (normalizedX * (mapBounds.east - mapBounds.west));
    const lat = mapBounds.north - (normalizedY * (mapBounds.north - mapBounds.south));
    
    return { lng, lat };
  }

  static geoToCanvas(
    geoCoords: GeoCoordinates,
    options: CoordinateTransformOptions
  ): CanvasCoordinates {
    const { mapBounds, canvasBounds } = options;
    
    // Normalize geographic coordinates (0-1)
    const normalizedX = (geoCoords.lng - mapBounds.west) / (mapBounds.east - mapBounds.west);
    const normalizedY = (mapBounds.north - geoCoords.lat) / (mapBounds.north - mapBounds.south);
    
    // Transform to canvas coordinates
    const x = normalizedX * canvasBounds.width;
    const y = normalizedY * canvasBounds.height;
    
    return { x, y };
  }
}