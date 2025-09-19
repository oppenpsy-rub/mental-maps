import { describe, it, expect } from 'vitest';

describe('GeodataSerializationService Basic Test', () => {
  it('should import the service correctly', async () => {
    const { GeodataSerializationService } = await import('../services/GeodataSerializationService');
    expect(GeodataSerializationService).toBeDefined();
    expect(typeof GeodataSerializationService.canvasToGeo).toBe('function');
    expect(typeof GeodataSerializationService.geoToCanvas).toBe('function');
  });

  it('should perform basic coordinate transformation', async () => {
    const { GeodataSerializationService } = await import('../services/GeodataSerializationService');
    
    const transformOptions = {
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

    const canvasCoords = { x: 500, y: 400 };
    const result = GeodataSerializationService.canvasToGeo(canvasCoords, transformOptions);
    
    expect(result.lng).toBeCloseTo(13.5);
    expect(result.lat).toBeCloseTo(51.5);
  });

  it('should validate GeoJSON correctly', async () => {
    const { GeodataSerializationService } = await import('../services/GeodataSerializationService');
    
    const validGeoJSON = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [13.5, 51.5]
          },
          properties: {}
        }
      ]
    };

    const result = GeodataSerializationService.validateGeoJSON(validGeoJSON);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});