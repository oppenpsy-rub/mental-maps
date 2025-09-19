import { useState, useCallback, useRef } from 'react';
import { DrawingTool, ToolSettings, DrawingElement, DrawingState, DrawingAction } from '../types/drawing';

const DEFAULT_TOOL_SETTINGS: ToolSettings = {
  strokeColor: '#000000',
  strokeWidth: 2,
  fillColor: '#ffffff',
  fillOpacity: 0.3,
  fontSize: 16,
  fontFamily: 'Arial',
  heatmapRadius: 20,
  heatmapIntensity: 1,
  heatmapBlur: 0,
  heatmapGradient: {
    0.0: 'rgba(0, 0, 255, 0)',
    0.2: 'rgba(0, 0, 255, 0.5)',
    0.4: 'rgba(0, 255, 255, 0.7)',
    0.6: 'rgba(0, 255, 0, 0.8)',
    0.8: 'rgba(255, 255, 0, 0.9)',
    1.0: 'rgba(255, 0, 0, 1.0)'
  }
};

export const useDrawing = () => {
  const [drawingState, setDrawingState] = useState<DrawingState>({
    elements: [],
    activeTool: DrawingTool.PEN,
    toolSettings: DEFAULT_TOOL_SETTINGS,
    isDrawing: false,
    canUndo: false,
    canRedo: false
  });

  const historyRef = useRef<DrawingAction[]>([]);
  const historyIndexRef = useRef<number>(-1);

  // This function is not used directly but kept for potential future use
  // const addToHistory = useCallback((action: DrawingAction) => {
  //   // Remove any actions after current index (when undoing then doing new action)
  //   historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
  //   
  //   // Add new action
  //   historyRef.current.push(action);
  //   historyIndexRef.current = historyRef.current.length - 1;
  //   
  //   // Update undo/redo state
  //   setDrawingState(prev => ({
  //     ...prev,
  //     canUndo: historyRef.current.length > 0,
  //     canRedo: false
  //   }));
  // }, []);

  const setActiveTool = useCallback((tool: DrawingTool) => {
    setDrawingState(prev => ({
      ...prev,
      activeTool: tool
    }));
  }, []);

  const updateToolSettings = useCallback((settings: Partial<ToolSettings>) => {
    setDrawingState(prev => ({
      ...prev,
      toolSettings: {
        ...prev.toolSettings,
        ...settings
      }
    }));
  }, []);

  const addElement = useCallback((element: DrawingElement) => {
    setDrawingState(prev => {
      const newElements = [...prev.elements, element];
      
      // Add to history
      const action: DrawingAction = {
        type: 'ADD',
        element
      };
      
      // Remove any actions after current index (when undoing then doing new action)
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
      
      // Add new action
      historyRef.current.push(action);
      historyIndexRef.current = historyRef.current.length - 1;
      
      return {
        ...prev,
        elements: newElements,
        canUndo: historyRef.current.length > 0,
        canRedo: false
      };
    });
  }, []);

  const removeElement = useCallback((elementId: string) => {
    setDrawingState(prev => {
      const elementIndex = prev.elements.findIndex(el => el.id === elementId);
      if (elementIndex === -1) return prev;
      
      const element = prev.elements[elementIndex];
      const newElements = prev.elements.filter(el => el.id !== elementId);
      
      // Add to history
      const action: DrawingAction = {
        type: 'REMOVE',
        element
      };
      
      // Remove any actions after current index (when undoing then doing new action)
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
      
      // Add new action
      historyRef.current.push(action);
      historyIndexRef.current = historyRef.current.length - 1;
      
      return {
        ...prev,
        elements: newElements,
        canUndo: historyRef.current.length > 0,
        canRedo: false
      };
    });
  }, []);

  const modifyElement = useCallback((elementId: string, updates: Partial<DrawingElement>) => {
    setDrawingState(prev => {
      const elementIndex = prev.elements.findIndex(el => el.id === elementId);
      if (elementIndex === -1) return prev;
      
      const oldElement = prev.elements[elementIndex];
      const newElement = { ...oldElement, ...updates };
      const newElements = [...prev.elements];
      newElements[elementIndex] = newElement;
      
      // Add to history
      const action: DrawingAction = {
        type: 'MODIFY',
        element: newElement,
        previousState: oldElement
      };
      
      // Remove any actions after current index (when undoing then doing new action)
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
      
      // Add new action
      historyRef.current.push(action);
      historyIndexRef.current = historyRef.current.length - 1;
      
      return {
        ...prev,
        elements: newElements,
        canUndo: historyRef.current.length > 0,
        canRedo: false
      };
    });
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current < 0) return;
    
    const action = historyRef.current[historyIndexRef.current];
    historyIndexRef.current--;
    
    setDrawingState(prev => {
      let newElements = [...prev.elements];
      
      switch (action.type) {
        case 'ADD':
          // Remove the added element
          newElements = newElements.filter(el => el.id !== action.element.id);
          break;
        case 'REMOVE':
          // Add back the removed element
          newElements.push(action.element);
          break;
        case 'MODIFY':
          // Restore previous state
          if (action.previousState) {
            const index = newElements.findIndex(el => el.id === action.element.id);
            if (index !== -1) {
              newElements[index] = action.previousState;
            }
          }
          break;
      }
      
      return {
        ...prev,
        elements: newElements,
        canUndo: historyIndexRef.current >= 0,
        canRedo: true
      };
    });
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    
    historyIndexRef.current++;
    const action = historyRef.current[historyIndexRef.current];
    
    setDrawingState(prev => {
      let newElements = [...prev.elements];
      
      switch (action.type) {
        case 'ADD':
          // Add the element back
          newElements.push(action.element);
          break;
        case 'REMOVE':
          // Remove the element again
          newElements = newElements.filter(el => el.id !== action.element.id);
          break;
        case 'MODIFY':
          // Apply the modification again
          const index = newElements.findIndex(el => el.id === action.element.id);
          if (index !== -1) {
            newElements[index] = action.element;
          }
          break;
      }
      
      return {
        ...prev,
        elements: newElements,
        canUndo: true,
        canRedo: historyIndexRef.current < historyRef.current.length - 1
      };
    });
  }, []);

  const clearAll = useCallback(() => {
    setDrawingState(prev => {
      if (prev.elements.length === 0) return prev;
      
      // Add all current elements as remove actions to history
      prev.elements.forEach(element => {
        const action: DrawingAction = {
          type: 'REMOVE',
          element
        };
        
        // Remove any actions after current index
        historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
        
        // Add new action
        historyRef.current.push(action);
        historyIndexRef.current = historyRef.current.length - 1;
      });
      
      return {
        ...prev,
        elements: [],
        canUndo: true,
        canRedo: false
      };
    });
  }, []);

  const setIsDrawing = useCallback((isDrawing: boolean) => {
    setDrawingState(prev => ({
      ...prev,
      isDrawing
    }));
  }, []);

  const removeElementById = useCallback((elementId: string) => {
    removeElement(elementId);
  }, [removeElement]);

  return {
    drawingState,
    setActiveTool,
    updateToolSettings,
    addElement,
    removeElement,
    removeElementById,
    modifyElement,
    undo,
    redo,
    clearAll,
    setIsDrawing
  };
};