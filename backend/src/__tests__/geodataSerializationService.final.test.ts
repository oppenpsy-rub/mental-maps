import { describe, it, expect } from 'vitest';
import { GeodataSerializationService } from '../services/GeodataSerializationService.minimal';

describe('GeodataSerializationService - Task 11.2 Implementation', () => {
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

  describe('GeoJSON Export/Import for Drawings', () => {
    it('should export drawing elements to GeoJSON format', () => {
      const geoJson: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [13.5, 51.5]
            },
            properties: {
              elementType: 'point',
              style: { color: '#ff0000', radius: 5 },
              metadata: { label: 'Test Point' }
            }
          },
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[[13.0, 52.0], [14.0, 52.0], [14.0, 51.0], [13.0, 51.0], [13.0, 52.0]]]
            },
            properties: {
              elementType: 'polygon',
              style: { fillColor: '#00ff00', fillOpacity: 0.5 },
              metadata: { label: 'Test Area' }
            }
          }
        ]
      };

      const elements = GeodataSerializationService.geoJSONToElements(geoJson, 'drawing-1');
      
      expect(elements).toHaveLength(2);
      expect(elements[0].elementType).toBe('point');
      expect(elements[0].styleProperties).toEqual({ color: '#ff0000', radius: 5 });
      expect(elements[0].metadata).toEqual({ label: 'Test Point' });
      
      expect(elements[1].elementType).toBe('polygon');
      expect(elements[1].styleProperties).toEqual({ fillColor: '#00ff00', fillOpacity: 0.5 });
      expect(elements[1].metadata).toEqual({ label: 'Test Area' });
    });

    it('should import GeoJSON and convert to drawing elements', () => {
      const geoJson: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [[13.0, 52.0], [13.5, 51.5], [14.0, 51.0]]
            },
            properties: {
              elementType: 'line',
              style: { strokeColor: '#0000ff', strokeWidth: 3 }
            }
          }
        ]
      };

      const elements = GeodataSerializationService.geoJSONToElements(geoJson, 'drawing-2');
      
      expect(elements).toHaveLength(1);
      expect(elements[0].mapDrawingId).toBe('drawing-2');
      expect(elements[0].elementType).toBe('line');
      expect(JSON.parse(elements[0].geometry)).toEqual({
        type: 'LineString',
        coordinates: [[13.0, 52.0], [13.5, 51.5], [14.0, 51.0]]
      });
    });
  });

  describe('Coordinate Transformation between Canvas and Geo-coordinates', () => {
    it('should transform canvas coordinates to geographic coordinates', () => {
      const canvasCoords = { x: 500, y: 400 };
      const result = GeodataSerializationService.canvasToGeo(canvasCoords, mockTransformOptions);
      
      // Middle of the map bounds
      expect(result.lng).toBeCloseTo(13.5);
      expect(result.lat).toBeCloseTo(51.5);
    });

    it('should transform geographic coordinates to canvas coordinates', () => {
      const geoCoords = { lng: 13.5, lat: 51.5 };
      const result = GeodataSerializationService.geoToCanvas(geoCoords, mockTransformOptions);
      
      // Middle of the canvas
      expect(result.x).toBeCloseTo(500);
      expect(result.y).toBeCloseTo(400);
    });

    it('should handle coordinate transformation for complex shapes', () => {
      // Test polygon coordinates transformation
      const polygonPoints = [
        { x: 0, y: 0 },      // Top-left
        { x: 1000, y: 0 },   // Top-right
        { x: 1000, y: 800 }, // Bottom-right
        { x: 0, y: 800 }     // Bottom-left
      ];

      const geoPoints = polygonPoints.map(point => 
        GeodataSerializationService.canvasToGeo(point, mockTransformOptions)
      );

      expect(geoPoints[0]).toEqual({ lng: 13.0, lat: 52.0 }); // Top-left
      expect(geoPoints[1]).toEqual({ lng: 14.0, lat: 52.0 }); // Top-right
      expect(geoPoints[2]).toEqual({ lng: 14.0, lat: 51.0 }); // Bottom-right
      expect(geoPoints[3]).toEqual({ lng: 13.0, lat: 51.0 }); // Bottom-left
    });

    it('should maintain precision in coordinate transformations', () => {
      const originalCanvas = { x: 250, y: 200 };
      const geo = GeodataSerializationService.canvasToGeo(originalCanvas, mockTransformOptions);
      const backToCanvas = GeodataSerializationService.geoToCanvas(geo, mockTransformOptions);
      
      expect(backToCanvas.x).toBeCloseTo(originalCanvas.x, 10);
      expect(backToCanvas.y).toBeCloseTo(originalCanvas.y, 10);
    });
  });

  describe('Data Validation for Geodata', () => {
    it('should validate correct GeoJSON structure', () => {
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
      expect(result.errors.some(error => error.includes('FeatureCollection'))).toBe(true);
    });

    it('should detect invalid coordinate formats', () => {
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

    it('should validate polygon coordinate structure', () => {
      const validPolygonGeoJSON = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[[13.0, 52.0], [14.0, 52.0], [14.0, 51.0], [13.0, 51.0], [13.0, 52.0]]]
            },
            properties: {}
          }
        ]
      };

      const result = GeodataSerializationService.validateGeoJSON(validPolygonGeoJSON);
      expect(result.isValid).toBe(true);
    });

    it('should detect incomplete polygon coordinates', () => {
      const invalidPolygonGeoJSON = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[[13.0, 52.0], [14.0, 52.0]]] // Not enough points for polygon
            },
            properties: {}
          }
        ]
      };

      const result = GeodataSerializationService.validateGeoJSON(invalidPolygonGeoJSON);
      expect(result.isValid).toBe(false);
    });
  });

  describe('Fabric.js Canvas Integration', () => {
    it('should convert Fabric.js objects to GeoJSON with coordinate transformation', () => {
      const fabricObjects = [
        {
          type: 'circle',
          left: 400,
          top: 300,
          radius: 50,
          fill: '#ff0000',
          id: 'circle-1'
        },
        {
          type: 'line',
          x1: 100,
          y1: 100,
          x2: 900,
          y2: 700,
          stroke: '#00ff00',
          strokeWidth: 2,
          id: 'line-1'
        }
      ];

      const result = GeodataSerializationService.fabricObjectsToGeoJSON(fabricObjects, mockTransformOptions);
      
      expect(result.type).toBe('FeatureCollection');
      expect(result.features).toHaveLength(2);
      
      // Circle should be converted to Point
      const circleFeature = result.features[0];
      expect(circleFeature.geometry.type).toBe('Point');
      expect(circleFeature.properties?.elementType).toBe('circle');
      expect(circleFeature.properties?.style.color).toBe('#ff0000');
      
      // Line should be converted to LineString
      const lineFeature = result.features[1];
      expect(lineFeature.geometry.type).toBe('LineString');
      expect(lineFeature.properties?.elementType).toBe('line');
      expect(lineFeature.properties?.style.strokeColor).toBe('#00ff00');
    });

    it('should handle polygon objects with proper coordinate closure', () => {
      const fabricPolygon = {
        type: 'polygon',
        left: 100,
        top: 100,
        points: [
          { x: 0, y: 0 },
          { x: 200, y: 0 },
          { x: 200, y: 200 },
          { x: 0, y: 200 }
          // Intentionally not closed
        ],
        fill: '#0000ff',
        id: 'polygon-1'
      };

      const result = GeodataSerializationService.fabricObjectsToGeoJSON([fabricPolygon], mockTransformOptions);
      const polygonFeature = result.features[0];
      
      expect(polygonFeature.geometry.type).toBe('Polygon');
      
      // Check that polygon is automatically closed
      const coordinates = (polygonFeature.geometry as GeoJSON.Polygon).coordinates[0];
      expect(coordinates[0]).toEqual(coordinates[coordinates.length - 1]);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty feature collections', () => {
      const emptyGeoJSON: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: []
      };

      const elements = GeodataSerializationService.geoJSONToElements(emptyGeoJSON, 'drawing-1');
      expect(elements).toHaveLength(0);
    });

    it('should handle extreme coordinate values', () => {
      const extremeOptions = {
        mapBounds: {
          north: 85,
          south: -85,
          east: 180,
          west: -180
        },
        canvasBounds: {
          width: 1000,
          height: 1000
        }
      };

      const canvasCoords = { x: 0, y: 0 };
      const geoCoords = GeodataSerializationService.canvasToGeo(canvasCoords, extremeOptions);
      
      expect(geoCoords.lng).toBe(-180);
      expect(geoCoords.lat).toBe(85);
    });

    it('should infer element types from geometry when not specified', () => {
      const geoJsonWithoutTypes: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [13.5, 51.5] },
            properties: {}
          },
          {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: [[13.0, 52.0], [14.0, 51.0]] },
            properties: {}
          },
          {
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [[[13.0, 52.0], [14.0, 52.0], [14.0, 51.0], [13.0, 51.0], [13.0, 52.0]]] },
            properties: {}
          }
        ]
      };

      const elements = GeodataSerializationService.geoJSONToElements(geoJsonWithoutTypes, 'drawing-1');
      
      expect(elements[0].elementType).toBe('point');
      expect(elements[1].elementType).toBe('line');
      expect(elements[2].elementType).toBe('polygon');
    });
  });
});