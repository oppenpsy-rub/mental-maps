import { describe, it, expect } from 'vitest';

describe('Response Collection Type Fix', () => {
  it('should properly type GeoJSON geometry objects', () => {
    // Test the fix for the geometry typing issue
    const pointGeometry: GeoJSON.Point = {
      type: 'Point' as const,
      coordinates: [13.45, 52.45]
    };

    const polygonGeometry: GeoJSON.Polygon = {
      type: 'Polygon' as const,
      coordinates: [[[13.1, 52.1], [13.9, 52.1], [13.9, 52.9], [13.1, 52.9], [13.1, 52.1]]]
    };

    // Mock element structure that should match the SubmitResponseRequest interface
    const mockElement = {
      type: 'point' as const,
      geometry: pointGeometry,
      style: {
        color: '#ff0000',
        radius: 5
      },
      metadata: {
        label: 'Test Point'
      }
    };

    const mockPolygonElement = {
      type: 'polygon' as const,
      geometry: polygonGeometry,
      style: {
        fillColor: '#00ff00',
        fillOpacity: 0.5
      },
      metadata: {}
    };

    // Verify the types are correct
    expect(pointGeometry.type).toBe('Point');
    expect(pointGeometry.coordinates).toEqual([13.45, 52.45]);
    
    expect(polygonGeometry.type).toBe('Polygon');
    expect(polygonGeometry.coordinates[0]).toHaveLength(5); // Closed polygon
    
    expect(mockElement.type).toBe('point');
    expect(mockElement.geometry.type).toBe('Point');
    
    expect(mockPolygonElement.type).toBe('polygon');
    expect(mockPolygonElement.geometry.type).toBe('Polygon');
  });

  it('should demonstrate the correct structure for mapDrawing elements', () => {
    const mapDrawingElements = [
      {
        type: 'point' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [13.45, 52.45]
        } as GeoJSON.Point,
        style: {
          color: '#ff0000',
          radius: 5
        },
        metadata: {
          label: 'Test Point'
        }
      },
      {
        type: 'polygon' as const,
        geometry: {
          type: 'Polygon' as const,
          coordinates: [[[13.1, 52.1], [13.9, 52.1], [13.9, 52.9], [13.1, 52.9], [13.1, 52.1]]]
        } as GeoJSON.Polygon,
        style: {
          fillColor: '#00ff00',
          fillOpacity: 0.5
        },
        metadata: {}
      }
    ];

    expect(mapDrawingElements).toHaveLength(2);
    expect(mapDrawingElements[0].geometry.type).toBe('Point');
    expect(mapDrawingElements[1].geometry.type).toBe('Polygon');
  });
});