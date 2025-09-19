import { describe, it, expect } from 'vitest';

// Simple test to verify the map types are working
import { MapBounds, MapStyle, DrawingTool } from '../../../types/map';

describe('Map Types', () => {
  it('should define MapBounds interface correctly', () => {
    const bounds: MapBounds = {
      north: 52.0,
      south: 51.0,
      east: 14.0,
      west: 13.0
    };
    
    expect(bounds.north).toBe(52.0);
    expect(bounds.south).toBe(51.0);
    expect(bounds.east).toBe(14.0);
    expect(bounds.west).toBe(13.0);
  });

  it('should define MapStyle enum correctly', () => {
    expect(MapStyle.STANDARD).toBe('standard');
    expect(MapStyle.SATELLITE).toBe('satellite');
    expect(MapStyle.TERRAIN).toBe('terrain');
    expect(MapStyle.DARK).toBe('dark');
    expect(MapStyle.LIGHT).toBe('light');
  });

  it('should define DrawingTool enum correctly', () => {
    expect(DrawingTool.PEN).toBe('pen');
    expect(DrawingTool.LINE).toBe('line');
    expect(DrawingTool.POLYGON).toBe('polygon');
    expect(DrawingTool.CIRCLE).toBe('circle');
    expect(DrawingTool.TEXT).toBe('text');
    expect(DrawingTool.HEATMAP).toBe('heatmap');
    expect(DrawingTool.MARKER).toBe('marker');
  });
});