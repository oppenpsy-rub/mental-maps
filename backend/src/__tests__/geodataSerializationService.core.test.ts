import { describe, it, expect } from 'vitest';
import { GeodataSerializationService, CoordinateTransformOptions } from '../services/GeodataSerializationService';

describe('GeodataSerializationService Core Functions', () => {
  const mockTransformOptions: CoordinateTransformOptions = {
    mapBounds: {
      north: 52.0,
      south: 51.0,
      east: 14.0,
      west: 13.0
    },
    canvasBounds: {
      width: 1000,
      height: 800
    }
  };

  describe('Coordinate Transformation', () => {
    it('should transform canvas coordinates to geographic coordinates', () => {
      const canvasCoords = { x: 500, y: 400 };
      const result = GeodataSerializationService.canvasToGeo(canvasCoords, mockTransformOptions);
      
      expect(result.lng).toBeCloseTo(13.5); // Middle of longitude range
      expect(result.lat).toBeCloseTo(51.5); // Middle of latitude range
    });

    it('should transform geographic coordinates to canvas coordinates', () => {
      const geoCoords = { lng: 13.5, lat: 51.5 };
      const result = GeodataSerializationService.geoToCanvas(geoCoords, mockTransformOptions);
      
      expect(result.x).toBeCloseTo(500);
      expect(result.y).toBeCloseTo(400);
    });

    it('should be inverse operations', () => {
      const originalCanvas = { x: 300, y: 200 };
      const geo = GeodataSerializationService.canvasToGeo(originalCanvas, mockTransformOptions);
      const backToCanvas = GeodataSerializationService.geoToCanvas(geo, mockTransformOptions);
      
      expect(backToCanvas.x).toBeCloseTo(originalCanvas.x);
      expect(backToCanvas.y).toBeCloseTo(originalCanvas.y);
    });
  });

  describe('GeoJSON Validation', () => {
    it('should validate correct GeoJSON', () => {
      const validGeoJSON = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [13.5, 51.5]
            },
            properties: {
              elementType: 'point'
            }
          }
        ]
      };

      const result = GeodataSerializationService.validateGeoJSON(validGeoJSON);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid GeoJSON structure', () => {
      const invalidGeoJSON = {
        type: 'InvalidType',
        features: 'not-an-array'
      };

      const result = GeodataSerializationService.validateGeoJSON(invalidGeoJSON);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect invalid geometry coordinates', () => {
      const invalidGeoJSON = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: ['invalid', 'coordinates']
            },
            properties: {}
          }
        ]
      };

      const result = GeodataSerializationService.validateGeoJSON(invalidGeoJSON);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('invalid coordinates'))).toBe(true);
    });
  });

  describe('GeoJSON Conversion', () => {
    it('should convert GeoJSON FeatureCollection to drawing elements', () => {
      const geoJson: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'test-1',
            geometry: {
              type: 'Point',
              coordinates: [13.5, 51.5]
            },
            properties: {
              elementType: 'point',
              style: { color: '#ff0000' },
              metadata: { label: 'Test' }
            }
          }
        ]
      };

      const result = GeodataSerializationService.geoJSONToElements(geoJson, 'drawing-1');
      
      expect(result).toHaveLength(1);
      expect(result[0].mapDrawingId).toBe('drawing-1');
      expect(result[0].elementType).toBe('point');
      expect(result[0].styleProperties).toEqual({ color: '#ff0000' });
      expect(result[0].metadata).toEqual({ label: 'Test' });
    });

    it('should infer element type from geometry when not provided', () => {
      const geoJson: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [[13.0, 52.0], [14.0, 51.0]]
            },
            properties: {}
          }
        ]
      };

      const result = GeodataSerializationService.geoJSONToElements(geoJson, 'drawing-1');
      expect(result[0].elementType).toBe('line');
    });
  });
});