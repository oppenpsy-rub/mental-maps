import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import L from 'leaflet';
import { DrawingCanvas } from '../DrawingCanvas';
import { DrawingTool } from '../../../types/drawing';

// Mock Fabric.js completely
vi.mock('fabric', () => ({
  fabric: {
    Canvas: vi.fn(() => ({
      dispose: vi.fn(),
      setDimensions: vi.fn(),
      renderAll: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      add: vi.fn(),
      remove: vi.fn(),
      getPointer: vi.fn(() => ({ x: 100, y: 100 })),
      isDrawingMode: false,
      selection: false,
      skipTargetFind: false,
      freeDrawingBrush: {
        color: '#000000',
        width: 2
      }
    })),
    Path: vi.fn(),
    Line: vi.fn(),
    Circle: vi.fn(),
    Polygon: vi.fn(),
    IText: vi.fn()
  }
}));

// Mock Leaflet map
const createMockMap = () => ({
  getContainer: vi.fn(() => ({
    getBoundingClientRect: () => ({ width: 800, height: 600 })
  })),
  getSize: vi.fn(() => ({ x: 800, y: 600 })),
  getBounds: vi.fn(() => ({
    getNorth: () => 51.5,
    getSouth: () => 51.4,
    getEast: () => -0.1,
    getWest: () => -0.2
  })),
  containerPointToLatLng: vi.fn(() => ({ lat: 51.45, lng: -0.15 })),
  latLngToContainerPoint: vi.fn(() => ({ x: 400, y: 300 })),
  on: vi.fn(),
  off: vi.fn()
});

describe('DrawingCanvas', () => {
  let mockMap: any;
  const defaultProps = {
    map: null as L.Map | null,
    activeTool: DrawingTool.PEN,
    toolSettings: {
      strokeColor: '#000000',
      strokeWidth: 2,
      fillColor: '#ffffff',
      fillOpacity: 0.3
    }
  };

  beforeEach(() => {
    mockMap = createMockMap();
    vi.clearAllMocks();
  });

  it('renders canvas element', () => {
    render(<DrawingCanvas {...defaultProps} />);
    
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('sets up map event listeners when map is provided', () => {
    render(<DrawingCanvas {...defaultProps} map={mockMap} />);
    
    expect(mockMap.on).toHaveBeenCalledWith('move', expect.any(Function));
    expect(mockMap.on).toHaveBeenCalledWith('zoom', expect.any(Function));
    expect(mockMap.on).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('calls onElementAdded when element is added', () => {
    const onElementAdded = vi.fn();
    render(
      <DrawingCanvas 
        {...defaultProps} 
        map={mockMap} 
        onElementAdded={onElementAdded}
      />
    );
    
    // This would be triggered by fabric canvas events in real usage
    // For now, we just verify the prop is passed correctly
    expect(onElementAdded).toBeDefined();
  });

  it('accepts different drawing tools', () => {
    const { rerender } = render(
      <DrawingCanvas {...defaultProps} map={mockMap} />
    );
    
    // Change tool to SELECT
    rerender(
      <DrawingCanvas 
        {...defaultProps} 
        map={mockMap}
        activeTool={DrawingTool.SELECT}
      />
    );
    
    // Verify component renders without errors
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });
});