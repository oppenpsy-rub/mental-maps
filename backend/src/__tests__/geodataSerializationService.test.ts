import { describe, it, expect, beforeEach } from 'vitest';
import { GeodataSerializationService, CoordinateTransformOptions, MapBounds, CanvasBounds } from '../services/GeodataSerializationService';
import { DrawingElement, DrawingElementType } from '../models/DrawingElement';
import { MapDrawing } from '../models/MapDrawing';

describe('GeodataSerializationService', () => {
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
    describe('canvasToGeo', () => {
      it('should transform canvas coordinates to geographic coordinates', () => {
        const canvasCoords = { x: 500, y: 400 };
        const result = GeodataSerializationService.canvasToGeo(canvasCoords, mockTransformOptions);
        
        expect(result.lng).toBeCloseTo(13.5); // Middle of longitude range
        expect(result.lat).toBeCloseTo(51.5); // Middle of latitude range
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

    describe('geoToCanvas', () => {
      it('should transform geographic coordinates to canvas coordinates', () => {
        const geoCoords = { lng: 13.5, lat: 51.5 };
        const result = GeodataSerializationService.geoToCanvas(geoCoords, mockTransformOptions);
        
        expect(result.x).toBeCloseTo(500);
        expect(result.y).toBeCloseTo(400);
      });

      it('should be inverse of canvasToGeo', () => {
        const originalCanvas = { x: 300, y: 200 };
        const geo = GeodataSerializationService.canvasToGeo(originalCanvas, mockTransformOptions);
        const backToCanvas = GeodataSerializationService.geoToCanvas(geo, mockTransformOptions);
        
        expect(backToCanvas.x).toBeCloseTo(originalCanvas.x);
        expect(backToCanvas.y).toBeCloseTo(originalCanvas.y);
      });
    });
  });

  describe('GeoJSON Conversion', () => {
    const mockDrawingElements: DrawingElement[] = [
      {
        id: '1',
        mapDrawingId: 'drawing-1',
        elementType: 'point',
        geometry: JSON.stringify({
          type: 'Point',
          coordinates: [13.5, 51.5]
        }),
        styleProperties: {
          color: '#ff0000',
          strokeWidth: 2
        },
        metadata: {
          label: 'Test Point'
        },
        createdAt: new Date('2023-01-01T00:00:00Z')
      } as DrawingElement,
      {
        id: '2',
        mapDrawingId: 'drawing-1',
        elementType: 'line',
        geometry: JSON.stringify({
          type: 'LineString',
          coordinates: [[13.0, 52.0], [14.0, 51.0]]
        }),
        styleProperties: {
          strokeColor: '#00ff00',
          strokeWidth: 3
        },
        metadata: {},
        createdAt: new Date('2023-01-01T00:00:00Z')
      } as DrawingElement
    ];

    describe('elementsToGeoJSON', () => {
      it('should convert drawing elements to GeoJSON FeatureCollection', () => {
        const result = GeodataSerializationService.elementsToGeoJSON(mockDrawingElements);
        
        expect(result.type).toBe('FeatureCollection');
        expect(result.features).toHaveLength(2);
        
        const pointFeature = result.features[0];
        expect(pointFeature.id).toBe('1');
        expect(pointFeature.geometry.type).toBe('Point');
        expect(pointFeature.properties?.elementType).toBe('point');
        expect(pointFeature.properties?.style.color).toBe('#ff0000');
        
        const lineFeature = result.features[1];
        expect(lineFeature.id).toBe('2');
        expect(lineFeature.geometry.type).toBe('LineString');
        expect(lineFeature.properties?.elementType).toBe('line');
      });

      it('should handle invalid geometry gracefully', () => {
        const invalidElement = {
          ...mockDrawingElements[0],
          geometry: 'invalid-json'
        };
        
        expect(() => {
          GeodataSerializationService.elementsToGeoJSON([invalidElement]);
        }).toThrow('Invalid geometry for element');
      });
    });

    describe('geoJSONToElements', () => {
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

  describe('Drawing Serialization', () => {
    const mockMapDrawing: MapDrawing = {
      id: 'drawing-1',
      responseId: 'response-1',
      drawingData: {
        version: '1.0',
        metadata: {
          mapBounds: mockTransformOptions.mapBounds,
          zoomLevel: 10,
          canvasSize: mockTransformOptions.canvasBounds
        }
      },
      createdAt: new Date('2023-01-01T00:00:00Z')
    } as MapDrawing;

    describe('serializeDrawing', () => {
      it('should serialize a complete drawing', () => {
        const elements: DrawingElement[] = [
          {
            id: '1',
            mapDrawingId: 'drawing-1',
            elementType: 'point',
            geometry: JSON.stringify({
              type: 'Point',
              coordinates: [13.5, 51.5]
            }),
            styleProperties: { color: '#ff0000' },
            metadata: {},
            createdAt: new Date()
          } as DrawingElement
        ];

        const result = GeodataSerializationService.serializeDrawing(mockMapDrawing, elements);
        
        expect(result.id).toBe('drawing-1');
        expect(result.bounds).toEqual(mockTransformOptions.mapBounds);
        expect(result.geoJson.type).toBe('FeatureCollection');
        expect(result.geoJson.features).toHaveLength(1);
        expect(result.metadata).toEqual(mockMapDrawing.drawingData.metadata);
      });
    });

    describe('deserializeDrawing', () => {
      it('should deserialize a drawing from serialized format', () => {
        const serialized = {
          id: 'drawing-1',
          bounds: mockTransformOptions.mapBounds,
          geoJson: {
            type: 'FeatureCollection' as const,
            features: [
              {
                type: 'Feature' as const,
                geometry: {
                  type: 'Point' as const,
                  coordinates: [13.5, 51.5]
                },
                properties: {
                  elementType: 'point',
                  style: { color: '#ff0000' }
                }
              }
            ]
          },
          metadata: {
            zoomLevel: 10
          }
        };

        const result = GeodataSerializationService.deserializeDrawing(serialized, 'response-1');
        
        expect(result.mapDrawing.responseId).toBe('response-1');
        expect(result.mapDrawing.drawingData?.geoJsonData).toEqual(serialized.geoJson);
        expect(result.elements).toHaveLength(1);
        expect(result.elements[0].elementType).toBe('point');
      });
    });
  });

  describe('Fabric.js Integration', () => {
    describe('fabricObjectsToGeoJSON', () => {
      it('should convert Fabric.js circle to GeoJSON Point', () => {
        const fabricObjects = [
          {
            type: 'circle',
            left: 400,
            top: 300,
            radius: 50,
            fill: '#ff0000',
            id: 'circle-1'
          }
        ];

        const result = GeodataSerializationService.fabricObjectsToGeoJSON(fabricObjects, mockTransformOptions);
        
        expect(result.features).toHaveLength(1);
        const feature = result.features[0];
        expect(feature.geometry.type).toBe('Point');
        expect(feature.properties?.elementType).toBe('circle');
        expect(feature.properties?.style.color).toBe('#ff0000');
      });

      it('should convert Fabric.js line to GeoJSON LineString', () => {
        const fabricObjects = [
          {
            type: 'line',
            x1: 100,
            y1: 100,
            x2: 200,
            y2: 200,
            stroke: '#00ff00',
            strokeWidth: 2,
            id: 'line-1'
          }
        ];

        const result = GeodataSerializationService.fabricObjectsToGeoJSON(fabricObjects, mockTransformOptions);
        
        expect(result.features).toHaveLength(1);
        const feature = result.features[0];
        expect(feature.geometry.type).toBe('LineString');
        expect(feature.properties?.elementType).toBe('line');
        expect(feature.properties?.style.strokeColor).toBe('#00ff00');
      });

      it('should convert Fabric.js polygon to GeoJSON Polygon', () => {
        const fabricObjects = [
          {
            type: 'polygon',
            left: 100,
            top: 100,
            points: [
              { x: 0, y: 0 },
              { x: 100, y: 0 },
              { x: 100, y: 100 },
              { x: 0, y: 100 }
            ],
            fill: '#0000ff',
            id: 'polygon-1'
          }
        ];

        const result = GeodataSerializationService.fabricObjectsToGeoJSON(fabricObjects, mockTransformOptions);
        
        expect(result.features).toHaveLength(1);
        const feature = result.features[0];
        expect(feature.geometry.type).toBe('Polygon');
        expect(feature.properties?.elementType).toBe('polygon');
        
        // Check that polygon is properly closed
        const coordinates = (feature.geometry as GeoJSON.Polygon).coordinates[0];
        expect(coordinates[0]).toEqual(coordinates[coordinates.length - 1]);
      });
    });
  });

  describe('Validation', () => {
    describe('validateGeoJSON', () => {
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

      it('should warn about unknown element types', () => {
        const geoJSONWithUnknownType = {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [13.5, 51.5]
              },
              properties: {
                elementType: 'unknown_type'
              }
            }
          ]
        };

        const result = GeodataSerializationService.validateGeoJSON(geoJSONWithUnknownType);
        expect(result.isValid).toBe(true);
        expect(result.warnings?.some(warning => warning.includes('unknown elementType'))).toBe(true);
      });
    });

    describe('validateSerializedDrawing', () => {
      it('should validate correct serialized drawing', () => {
        const validSerialized = {
          id: 'drawing-1',
          bounds: mockTransformOptions.mapBounds,
          geoJson: {
            type: 'FeatureCollection' as const,
            features: []
          }
        };

        const result = GeodataSerializationService.validateSerializedDrawing(validSerialized);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should detect missing geoJson', () => {
        const invalidSerialized = {
          id: 'drawing-1',
          bounds: mockTransformOptions.mapBounds
        } as any;

        const result = GeodataSerializationService.validateSerializedDrawing(invalidSerialized);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => error.includes('geoJson'))).toBe(true);
      });

      it('should detect invalid bounds', () => {
        const invalidSerialized = {
          geoJson: {
            type: 'FeatureCollection' as const,
            features: []
          },
          bounds: {
            north: 'invalid',
            south: 51.0,
            east: 14.0,
            west: 13.0
          }
        } as any;

        const result = GeodataSerializationService.validateSerializedDrawing(invalidSerialized);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => error.includes('bounds'))).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty feature collections', () => {
      const emptyGeoJSON: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: []
      };

      const elements = GeodataSerializationService.geoJSONToElements(emptyGeoJSON, 'drawing-1');
      expect(elements).toHaveLength(0);
    });

    it('should handle extreme coordinate values', () => {
      const extremeOptions: CoordinateTransformOptions = {
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

    it('should handle polygon closure correctly', () => {
      const fabricPolygon = {
        type: 'polygon',
        left: 100,
        top: 100,
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 100 }
          // Intentionally not closed
        ],
        id: 'polygon-1'
      };

      const result = GeodataSerializationService.fabricObjectsToGeoJSON([fabricPolygon], mockTransformOptions);
      const coordinates = (result.features[0].geometry as GeoJSON.Polygon).coordinates[0];
      
      // Should be automatically closed
      expect(coordinates[0]).toEqual(coordinates[coordinates.length - 1]);
    });
  });
});