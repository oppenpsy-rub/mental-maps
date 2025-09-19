import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import L from 'leaflet';
import { InteractiveMap, InteractiveMapProps } from './InteractiveMap';
import { DrawingCanvas } from '../Drawing/DrawingCanvas';
import { useDrawing } from '../../hooks/useDrawing';
import { DrawingTool, DrawingElement } from '../../types/drawing';

interface InteractiveMapWithDrawingProps extends InteractiveMapProps {
  enableDrawing?: boolean;
  initialTool?: DrawingTool;
  onDrawingChange?: (elements: DrawingElement[]) => void;
}

const MapContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

export const InteractiveMapWithDrawing: React.FC<InteractiveMapWithDrawingProps> = ({
  enableDrawing = true,
  initialTool = DrawingTool.PEN,
  onDrawingChange,
  ...mapProps
}) => {
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const {
    drawingState,
    setActiveTool,
    addElement,
    removeElement,
    modifyElement
  } = useDrawing();

  // Initialize with the specified tool
  React.useEffect(() => {
    setActiveTool(initialTool);
  }, [initialTool, setActiveTool]);

  // Use ref to track previous elements to prevent unnecessary calls
  const prevElementsRef = React.useRef<DrawingElement[]>([]);
  
  React.useEffect(() => {
    // Only call onDrawingChange if elements actually changed
    if (onDrawingChange && drawingState.elements !== prevElementsRef.current) {
      const elementsChanged = 
        drawingState.elements.length !== prevElementsRef.current.length ||
        drawingState.elements.some((el, index) => el !== prevElementsRef.current[index]);
      
      if (elementsChanged) {
        prevElementsRef.current = drawingState.elements;
        onDrawingChange(drawingState.elements);
      }
    }
  }, [drawingState.elements, onDrawingChange]);

  const handleMapReady = useCallback((map: L.Map) => {
    setMapInstance(map);
    
    // Call parent's onMapReady if provided
    if (mapProps.onMapReady) {
      mapProps.onMapReady(map);
    }
  }, [mapProps.onMapReady]);

  const handleElementAdded = useCallback((element: DrawingElement) => {
    addElement(element);
  }, [addElement]);

  const handleElementModified = useCallback((element: DrawingElement) => {
    modifyElement(element.id, element);
  }, [modifyElement]);

  const handleElementRemoved = useCallback((elementId: string) => {
    removeElement(elementId);
  }, [removeElement]);

  return (
    <MapContainer>
      <InteractiveMap
        {...mapProps}
        onMapReady={handleMapReady}
      />
      
      {enableDrawing && mapInstance && (
        <DrawingCanvas
          map={mapInstance}
          activeTool={drawingState.activeTool}
          toolSettings={drawingState.toolSettings}
          onElementAdded={handleElementAdded}
          onElementModified={handleElementModified}
          onElementRemoved={handleElementRemoved}
        />
      )}
    </MapContainer>
  );
};

export default InteractiveMapWithDrawing;