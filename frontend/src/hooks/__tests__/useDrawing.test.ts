import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useDrawing } from '../useDrawing';
import { DrawingTool, DrawingElement } from '../../types/drawing';

// Mock fabric object
const createMockFabricObject = () => ({
  left: 100,
  top: 100,
  set: vi.fn(),
  dispose: vi.fn()
});

describe('useDrawing', () => {
  it('initializes with default state', () => {
    const { result } = renderHook(() => useDrawing());
    
    expect(result.current.drawingState.elements).toEqual([]);
    expect(result.current.drawingState.activeTool).toBe(DrawingTool.PEN);
    expect(result.current.drawingState.isDrawing).toBe(false);
    expect(result.current.drawingState.canUndo).toBe(false);
    expect(result.current.drawingState.canRedo).toBe(false);
  });

  it('changes active tool', () => {
    const { result } = renderHook(() => useDrawing());
    
    act(() => {
      result.current.setActiveTool(DrawingTool.LINE);
    });
    
    expect(result.current.drawingState.activeTool).toBe(DrawingTool.LINE);
  });

  it('updates tool settings', () => {
    const { result } = renderHook(() => useDrawing());
    
    act(() => {
      result.current.updateToolSettings({
        strokeColor: '#ff0000',
        strokeWidth: 5
      });
    });
    
    expect(result.current.drawingState.toolSettings.strokeColor).toBe('#ff0000');
    expect(result.current.drawingState.toolSettings.strokeWidth).toBe(5);
  });

  it('adds element and enables undo', () => {
    const { result } = renderHook(() => useDrawing());
    
    const mockElement: DrawingElement = {
      id: 'test-1',
      type: DrawingTool.PEN,
      fabricObject: createMockFabricObject() as any,
      geoCoordinates: [{ lat: 51.5, lng: -0.1 }]
    };
    
    act(() => {
      result.current.addElement(mockElement);
    });
    
    expect(result.current.drawingState.elements).toHaveLength(1);
    expect(result.current.drawingState.elements[0]).toBe(mockElement);
    expect(result.current.drawingState.canUndo).toBe(true);
    expect(result.current.drawingState.canRedo).toBe(false);
  });

  it('removes element', () => {
    const { result } = renderHook(() => useDrawing());
    
    const mockElement: DrawingElement = {
      id: 'test-1',
      type: DrawingTool.PEN,
      fabricObject: createMockFabricObject() as any
    };
    
    // Add element first
    act(() => {
      result.current.addElement(mockElement);
    });
    
    // Then remove it
    act(() => {
      result.current.removeElement('test-1');
    });
    
    expect(result.current.drawingState.elements).toHaveLength(0);
    expect(result.current.drawingState.canUndo).toBe(true);
  });

  it('performs undo operation', () => {
    const { result } = renderHook(() => useDrawing());
    
    const mockElement: DrawingElement = {
      id: 'test-1',
      type: DrawingTool.PEN,
      fabricObject: createMockFabricObject() as any
    };
    
    // Add element
    act(() => {
      result.current.addElement(mockElement);
    });
    
    expect(result.current.drawingState.elements).toHaveLength(1);
    
    // Undo
    act(() => {
      result.current.undo();
    });
    
    expect(result.current.drawingState.elements).toHaveLength(0);
    expect(result.current.drawingState.canUndo).toBe(false);
    expect(result.current.drawingState.canRedo).toBe(true);
  });

  it('performs redo operation', () => {
    const { result } = renderHook(() => useDrawing());
    
    const mockElement: DrawingElement = {
      id: 'test-1',
      type: DrawingTool.PEN,
      fabricObject: createMockFabricObject() as any
    };
    
    // Add element, then undo, then redo
    act(() => {
      result.current.addElement(mockElement);
    });
    
    act(() => {
      result.current.undo();
    });
    
    act(() => {
      result.current.redo();
    });
    
    expect(result.current.drawingState.elements).toHaveLength(1);
    expect(result.current.drawingState.canUndo).toBe(true);
    expect(result.current.drawingState.canRedo).toBe(false);
  });

  it('clears all elements', () => {
    const { result } = renderHook(() => useDrawing());
    
    const mockElement1: DrawingElement = {
      id: 'test-1',
      type: DrawingTool.PEN,
      fabricObject: createMockFabricObject() as any
    };
    
    const mockElement2: DrawingElement = {
      id: 'test-2',
      type: DrawingTool.LINE,
      fabricObject: createMockFabricObject() as any
    };
    
    // Add multiple elements
    act(() => {
      result.current.addElement(mockElement1);
      result.current.addElement(mockElement2);
    });
    
    expect(result.current.drawingState.elements).toHaveLength(2);
    
    // Clear all
    act(() => {
      result.current.clearAll();
    });
    
    expect(result.current.drawingState.elements).toHaveLength(0);
    expect(result.current.drawingState.canUndo).toBe(true);
  });

  it('modifies element', () => {
    const { result } = renderHook(() => useDrawing());
    
    const mockElement: DrawingElement = {
      id: 'test-1',
      type: DrawingTool.PEN,
      fabricObject: createMockFabricObject() as any,
      metadata: { color: 'red' }
    };
    
    // Add element
    act(() => {
      result.current.addElement(mockElement);
    });
    
    // Modify element
    act(() => {
      result.current.modifyElement('test-1', {
        metadata: { color: 'blue' }
      });
    });
    
    expect(result.current.drawingState.elements[0].metadata?.color).toBe('blue');
    expect(result.current.drawingState.canUndo).toBe(true);
  });
});