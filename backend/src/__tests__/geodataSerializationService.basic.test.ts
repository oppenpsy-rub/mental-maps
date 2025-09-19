import { describe, it, expect } from 'vitest';
import { GeodataSerializationService } from '../services/GeodataSerializationService.simple';

describe('GeodataSerializationService Basic Functions', () => {
  const mockTransformOptions = {
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

    it('should handle corner coordinates correctly', () => {
      // Top-left corner
      const topLeft = GeodataSerializationService.canvasToGeo({ x: 0, y: 0 }, mockTransformOptions);
      expect(topLeft.lng).toBeCloseTo(13.0);
      expect(topLeft.lat).toBeCloseTo(52.0);

      // Bottom-right corner
      const bottomRight = GeodataSerializationService.canvasToGeo({ x: 1000, y: 800 }, mockTransformOptions);
      expect(bottomRight.lng).toBeCloseTo(14.0);
      expect(bottomRight.lat).toBeCloseTo(51.0);
    });
  });
});