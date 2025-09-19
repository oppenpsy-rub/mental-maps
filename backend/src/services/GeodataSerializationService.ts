// Import types only to avoid circular dependencies during testing
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
  intensity?: number;
  confidence?: number;
  tags?: string[];
  userNotes?: string;
  createdWith?: string;
  editHistory?: Array<{
    timestamp: number;
    action: 'created' | 'modified' | 'moved' | 'styled';
    changes?: any;
  }>;
}

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
  canvasData?: any;
  geoJsonData?: GeoJSON.FeatureCollection;
  metadata?: DrawingMetadata;
}

// Simplified interfaces for testing
export interface DrawingElement {
  id: string;
  mapDrawingId: string;
  elementType: DrawingElementType;
  geometry: string;
  styleProperties: ElementStyle;
  metadata: ElementMetadata;
  createdAt: Date;
}

export interface MapDrawing {
  id: string;
  responseId: string;
  bounds?: string;
  drawingData: DrawingData;
  createdAt: Date;
}

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
  projection?: string; // Default: 'EPSG:4326' (WGS84)
}

export interface SerializedDrawing {
  id?: string;
  bounds?: MapBounds;
  geoJson: GeoJSON.FeatureCollection;
  canvasData?: any;
  metadata?: DrawingMetadata;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export class GeodataSerializationService {
  /**
   * Transform canvas coordinates to geographic coordinates
   */
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

  /**
   * Transform geographic coordinates to canvas coordinates
   */
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

  /**
   * Convert drawing elements to GeoJSON FeatureCollection
   */
  static elementsToGeoJSON(
    elements: DrawingElement[],
    options?: CoordinateTransformOptions
  ): GeoJSON.FeatureCollection {
    const features: GeoJSON.Feature[] = elements.map(element => {
      let geometry: GeoJSON.Geometry;
      
      try {
        // Parse PostGIS geometry (assuming it's already in GeoJSON format)
        if (typeof element.geometry === 'string') {
          geometry = JSON.parse(element.geometry);
        } else {
          geometry = element.geometry as any;
        }
      } catch (error) {
        throw new Error(`Invalid geometry for element ${element.id}: ${error}`);
      }

      return {
        type: 'Feature',
        id: element.id,
        geometry,
        properties: {
          elementType: element.elementType,
          style: element.styleProperties,
          metadata: element.metadata,
          createdAt: element.createdAt.toISOString()
        }
      };
    });

    return {
      type: 'FeatureCollection',
      features
    };
  }

  /**
   * Convert GeoJSON FeatureCollection to drawing elements
   */
  static geoJSONToElements(
    geoJson: GeoJSON.FeatureCollection,
    mapDrawingId: string
  ): Partial<DrawingElement>[] {
    this.validateGeoJSON(geoJson);

    return geoJson.features.map(feature => {
      const properties = feature.properties || {};
      
      return {
        mapDrawingId,
        elementType: properties.elementType || this.inferElementTypeFromGeometry(feature.geometry),
        geometry: JSON.stringify(feature.geometry),
        styleProperties: properties.style || {},
        metadata: properties.metadata || {}
      };
    });
  }

  /**
   * Serialize a complete drawing to a portable format
   */
  static serializeDrawing(
    mapDrawing: MapDrawing,
    elements: DrawingElement[]
  ): SerializedDrawing {
    const geoJson = this.elementsToGeoJSON(elements);
    
    let bounds: MapBounds | undefined;
    if (mapDrawing.drawingData?.metadata?.mapBounds) {
      bounds = mapDrawing.drawingData.metadata.mapBounds;
    }

    return {
      id: mapDrawing.id,
      bounds,
      geoJson,
      canvasData: mapDrawing.drawingData?.canvasData,
      metadata: mapDrawing.drawingData?.metadata
    };
  }

  /**
   * Deserialize a drawing from portable format
   */
  static deserializeDrawing(
    serialized: SerializedDrawing,
    responseId: string
  ): { mapDrawing: Partial<MapDrawing>; elements: Partial<DrawingElement>[] } {
    this.validateSerializedDrawing(serialized);

    const drawingData: DrawingData = {
      version: '1.0',
      canvasData: serialized.canvasData,
      geoJsonData: serialized.geoJson,
      metadata: serialized.metadata
    };

    const mapDrawing: Partial<MapDrawing> = {
      responseId,
      drawingData,
      bounds: serialized.bounds ? this.boundsToPostGISPolygon(serialized.bounds) : undefined
    };

    const elements = this.geoJSONToElements(serialized.geoJson, serialized.id || '');

    return { mapDrawing, elements };
  }

  /**
   * Convert Fabric.js canvas objects to GeoJSON
   */
  static fabricObjectsToGeoJSON(
    fabricObjects: any[],
    options: CoordinateTransformOptions
  ): GeoJSON.FeatureCollection {
    const features: GeoJSON.Feature[] = fabricObjects.map(obj => {
      const geometry = this.fabricObjectToGeometry(obj, options);
      
      return {
        type: 'Feature',
        id: obj.id || obj.uuid,
        geometry,
        properties: {
          elementType: this.inferElementTypeFromFabricObject(obj),
          style: this.extractStyleFromFabricObject(obj),
          metadata: obj.metadata || {}
        }
      };
    });

    return {
      type: 'FeatureCollection',
      features
    };
  }

  /**
   * Validate GeoJSON data
   */
  static validateGeoJSON(geoJson: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!geoJson || typeof geoJson !== 'object') {
      errors.push('GeoJSON must be an object');
      return { isValid: false, errors, warnings };
    }

    if (geoJson.type !== 'FeatureCollection') {
      errors.push('GeoJSON must be a FeatureCollection');
    }

    if (!Array.isArray(geoJson.features)) {
      errors.push('GeoJSON features must be an array');
    } else {
      geoJson.features.forEach((feature: any, index: number) => {
        if (!feature || typeof feature !== 'object') {
          errors.push(`Feature at index ${index} must be an object`);
          return;
        }

        if (feature.type !== 'Feature') {
          errors.push(`Feature at index ${index} must have type 'Feature'`);
        }

        if (!feature.geometry || typeof feature.geometry !== 'object') {
          errors.push(`Feature at index ${index} must have a geometry object`);
        } else {
          const validGeometryTypes = [
            'Point', 'LineString', 'Polygon', 'MultiPoint', 
            'MultiLineString', 'MultiPolygon', 'GeometryCollection'
          ];
          
          if (!validGeometryTypes.includes(feature.geometry.type)) {
            errors.push(`Feature at index ${index} has invalid geometry type: ${feature.geometry.type}`);
          }

          // Validate coordinates based on geometry type
          if (!this.validateGeometryCoordinates(feature.geometry)) {
            errors.push(`Feature at index ${index} has invalid coordinates`);
          }
        }

        // Check for required properties
        if (feature.properties && feature.properties.elementType) {
          const validElementTypes: DrawingElementType[] = [
            'point', 'line', 'polygon', 'circle', 'text', 'heatmap_point'
          ];
          
          if (!validElementTypes.includes(feature.properties.elementType)) {
            warnings.push(`Feature at index ${index} has unknown elementType: ${feature.properties.elementType}`);
          }
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate serialized drawing data
   */
  static validateSerializedDrawing(serialized: SerializedDrawing): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!serialized || typeof serialized !== 'object') {
      errors.push('Serialized drawing must be an object');
      return { isValid: false, errors, warnings };
    }

    if (!serialized.geoJson) {
      errors.push('Serialized drawing must contain geoJson data');
    } else {
      const geoJsonValidation = this.validateGeoJSON(serialized.geoJson);
      errors.push(...geoJsonValidation.errors);
      if (geoJsonValidation.warnings) {
        warnings.push(...geoJsonValidation.warnings);
      }
    }

    if (serialized.bounds) {
      if (!this.validateMapBounds(serialized.bounds)) {
        errors.push('Invalid map bounds');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Private helper methods
  private static inferElementTypeFromGeometry(geometry: GeoJSON.Geometry): DrawingElementType {
    switch (geometry.type) {
      case 'Point':
        return 'point';
      case 'LineString':
      case 'MultiLineString':
        return 'line';
      case 'Polygon':
      case 'MultiPolygon':
        return 'polygon';
      default:
        return 'point';
    }
  }

  private static inferElementTypeFromFabricObject(obj: any): DrawingElementType {
    switch (obj.type) {
      case 'circle':
        return 'circle';
      case 'line':
        return 'line';
      case 'polygon':
        return 'polygon';
      case 'text':
      case 'i-text':
        return 'text';
      case 'path':
        return 'line';
      default:
        return 'point';
    }
  }

  private static fabricObjectToGeometry(obj: any, options: CoordinateTransformOptions): GeoJSON.Geometry {
    const { left, top, width, height, type } = obj;

    switch (type) {
      case 'circle':
        const centerCanvas = { x: left + obj.radius, y: top + obj.radius };
        const centerGeo = this.canvasToGeo(centerCanvas, options);
        return {
          type: 'Point',
          coordinates: [centerGeo.lng, centerGeo.lat]
        };

      case 'line':
        const startGeo = this.canvasToGeo({ x: obj.x1, y: obj.y1 }, options);
        const endGeo = this.canvasToGeo({ x: obj.x2, y: obj.y2 }, options);
        return {
          type: 'LineString',
          coordinates: [[startGeo.lng, startGeo.lat], [endGeo.lng, endGeo.lat]]
        };

      case 'polygon':
        if (obj.points && Array.isArray(obj.points)) {
          const coordinates = obj.points.map((point: any) => {
            const canvasCoords = { x: left + point.x, y: top + point.y };
            const geoCoords = this.canvasToGeo(canvasCoords, options);
            return [geoCoords.lng, geoCoords.lat];
          });
          // Close the polygon if not already closed
          if (coordinates.length > 0 && 
              (coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
               coordinates[0][1] !== coordinates[coordinates.length - 1][1])) {
            coordinates.push(coordinates[0]);
          }
          return {
            type: 'Polygon',
            coordinates: [coordinates]
          };
        }
        break;

      case 'text':
      case 'i-text':
        const textCenterGeo = this.canvasToGeo({ x: left + width / 2, y: top + height / 2 }, options);
        return {
          type: 'Point',
          coordinates: [textCenterGeo.lng, textCenterGeo.lat]
        };

      default:
        // Default to point geometry
        const defaultGeo = this.canvasToGeo({ x: left, y: top }, options);
        return {
          type: 'Point',
          coordinates: [defaultGeo.lng, defaultGeo.lat]
        };
    }

    // Fallback
    const fallbackGeo = this.canvasToGeo({ x: left, y: top }, options);
    return {
      type: 'Point',
      coordinates: [fallbackGeo.lng, fallbackGeo.lat]
    };
  }

  private static extractStyleFromFabricObject(obj: any): ElementStyle {
    return {
      color: obj.fill || obj.color,
      strokeColor: obj.stroke,
      strokeWidth: obj.strokeWidth,
      opacity: obj.opacity,
      fillOpacity: obj.fillOpacity || obj.opacity,
      fontSize: obj.fontSize,
      fontFamily: obj.fontFamily,
      fontWeight: obj.fontWeight,
      radius: obj.radius
    };
  }

  private static validateGeometryCoordinates(geometry: GeoJSON.Geometry): boolean {
    try {
      switch (geometry.type) {
        case 'Point':
          return Array.isArray(geometry.coordinates) && 
                 geometry.coordinates.length >= 2 &&
                 typeof geometry.coordinates[0] === 'number' &&
                 typeof geometry.coordinates[1] === 'number';

        case 'LineString':
          return Array.isArray(geometry.coordinates) &&
                 geometry.coordinates.length >= 2 &&
                 geometry.coordinates.every(coord => 
                   Array.isArray(coord) && coord.length >= 2 &&
                   typeof coord[0] === 'number' && typeof coord[1] === 'number'
                 );

        case 'Polygon':
          return Array.isArray(geometry.coordinates) &&
                 geometry.coordinates.length >= 1 &&
                 geometry.coordinates.every(ring =>
                   Array.isArray(ring) && ring.length >= 4 &&
                   ring.every(coord =>
                     Array.isArray(coord) && coord.length >= 2 &&
                     typeof coord[0] === 'number' && typeof coord[1] === 'number'
                   )
                 );

        default:
          return true; // For other geometry types, assume valid
      }
    } catch {
      return false;
    }
  }

  private static validateMapBounds(bounds: MapBounds): boolean {
    return typeof bounds.north === 'number' &&
           typeof bounds.south === 'number' &&
           typeof bounds.east === 'number' &&
           typeof bounds.west === 'number' &&
           bounds.north > bounds.south &&
           bounds.east > bounds.west &&
           bounds.north <= 90 && bounds.south >= -90 &&
           bounds.east <= 180 && bounds.west >= -180;
  }

  private static boundsToPostGISPolygon(bounds: MapBounds): string {
    // Create a polygon from bounds for PostGIS
    const coordinates = [
      [bounds.west, bounds.south],
      [bounds.east, bounds.south],
      [bounds.east, bounds.north],
      [bounds.west, bounds.north],
      [bounds.west, bounds.south] // Close the polygon
    ];

    return JSON.stringify({
      type: 'Polygon',
      coordinates: [coordinates]
    });
  }
}