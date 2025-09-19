import React, { useEffect, useRef, useCallback, useState } from 'react';
import { fabric } from 'fabric';
import L from 'leaflet';
import styled from 'styled-components';
import { DrawingTool, ToolSettings, DrawingElement, CoordinateTransform, HeatmapData } from '../../types/drawing';
import HeatmapCanvas from './HeatmapCanvas';

interface DrawingCanvasProps {
  map: L.Map | null;
  activeTool: DrawingTool;
  toolSettings: ToolSettings;
  onElementAdded?: (element: DrawingElement) => void;
  onElementModified?: (element: DrawingElement) => void;
  onElementRemoved?: (elementId: string) => void;
  className?: string;
}

const CanvasContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
  
  canvas {
    pointer-events: auto;
  }
`;

const HeatmapLayer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: auto;
  z-index: 1001;
`;

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  map,
  activeTool,
  toolSettings,
  onElementAdded,
  onElementModified,
  onElementRemoved,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<fabric.Path | null>(null);
  const coordinateTransformRef = useRef<CoordinateTransform | null>(null);
  const elementsMapRef = useRef<Map<string, DrawingElement>>(new Map());
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [heatmapData, setHeatmapData] = useState<HeatmapData>({
    points: [],
    radius: toolSettings.heatmapRadius || 20,
    maxIntensity: toolSettings.heatmapIntensity || 1,
    gradient: toolSettings.heatmapGradient || {
      0.0: 'rgba(0, 0, 255, 0)',
      0.2: 'rgba(0, 0, 255, 0.5)',
      0.4: 'rgba(0, 255, 255, 0.7)',
      0.6: 'rgba(0, 255, 0, 0.8)',
      0.8: 'rgba(255, 255, 0, 0.9)',
      1.0: 'rgba(255, 0, 0, 1.0)'
    },
    blur: toolSettings.heatmapBlur || 0
  });

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current || !map) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: false,
      selection: activeTool === DrawingTool.SELECT,
      backgroundColor: 'transparent',
      renderOnAddRemove: true,
      skipTargetFind: activeTool !== DrawingTool.SELECT,
    });

    fabricCanvasRef.current = canvas;

    // Set up coordinate transformation
    const updateCoordinateTransform = () => {
      coordinateTransformRef.current = {
        canvasToGeo: (x: number, y: number) => {
          const point = L.point(x, y);
          const latLng = map.containerPointToLatLng(point);
          return { lat: latLng.lat, lng: latLng.lng };
        },
        geoToCanvas: (lat: number, lng: number) => {
          const latLng = L.latLng(lat, lng);
          const point = map.latLngToContainerPoint(latLng);
          return { x: point.x, y: point.y };
        }
      };
    };

    updateCoordinateTransform();

    // Update canvas size to match map container
    const resizeCanvas = () => {
      const mapContainer = map.getContainer();
      const rect = mapContainer.getBoundingClientRect();
      
      canvas.setDimensions({
        width: rect.width,
        height: rect.height
      });
      
      setCanvasSize({ width: rect.width, height: rect.height });
      updateCoordinateTransform();
    };

    resizeCanvas();

    // Listen to map events
    const handleMapMove = () => {
      updateCoordinateTransform();
      // Redraw all elements with updated coordinates
      canvas.renderAll();
    };

    const handleMapResize = () => {
      resizeCanvas();
    };

    map.on('move', handleMapMove);
    map.on('zoom', handleMapMove);
    map.on('resize', handleMapResize);

    // Set up drawing event handlers
    setupDrawingEvents(canvas);

    return () => {
      map.off('move', handleMapMove);
      map.off('zoom', handleMapMove);
      map.off('resize', handleMapResize);
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, [map]);

  // Update canvas settings when tool or settings change
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = activeTool === DrawingTool.PEN;
    canvas.selection = activeTool === DrawingTool.SELECT;
    canvas.skipTargetFind = activeTool !== DrawingTool.SELECT && activeTool !== DrawingTool.HEATMAP;

    if (activeTool === DrawingTool.PEN) {
      canvas.freeDrawingBrush.color = toolSettings.strokeColor;
      canvas.freeDrawingBrush.width = toolSettings.strokeWidth;
    }

    // Update heatmap settings
    if (activeTool === DrawingTool.HEATMAP) {
      setHeatmapData(prev => ({
        ...prev,
        radius: toolSettings.heatmapRadius || 20,
        gradient: toolSettings.heatmapGradient || prev.gradient,
        blur: toolSettings.heatmapBlur || 0,
        heatmapIntensity: toolSettings.heatmapIntensity || 1
      }));
    }

    canvas.renderAll();
  }, [activeTool, toolSettings]);

  const setupDrawingEvents = useCallback((canvas: fabric.Canvas) => {
    // Free drawing (pen tool)
    canvas.on('path:created', (e: any) => {
      if (activeTool === DrawingTool.PEN && e.path) {
        const element = createDrawingElement(DrawingTool.PEN, e.path);
        onElementAdded?.(element);
      }
    });

    // Mouse events for other tools
    let startPoint: fabric.IPoint | null = null;
    
    canvas.on('mouse:down', (e) => {
      if (activeTool === DrawingTool.SELECT || activeTool === DrawingTool.PEN) return;
      
      const pointer = canvas.getPointer(e.e);
      startPoint = pointer;
      
      switch (activeTool) {
        case DrawingTool.LINE:
          setIsDrawing(true);
          startDrawingLine(canvas, pointer);
          break;
        case DrawingTool.CIRCLE:
          setIsDrawing(true);
          startDrawingCircle(canvas, pointer);
          break;
        case DrawingTool.POLYGON:
          // Polygon uses click-to-add-point, not drag
          startDrawingPolygon(canvas, pointer);
          break;
        case DrawingTool.TEXT:
          addTextElement(canvas, pointer);
          break;
      }
    });

    canvas.on('mouse:move', (e) => {
      if (!isDrawing || !startPoint || activeTool === DrawingTool.SELECT || activeTool === DrawingTool.PEN) return;
      
      const pointer = canvas.getPointer(e.e);
      
      switch (activeTool) {
        case DrawingTool.LINE:
          updateDrawingLine(canvas, pointer);
          break;
        case DrawingTool.CIRCLE:
          updateDrawingCircle(canvas, pointer, startPoint);
          break;
      }
    });

    canvas.on('mouse:up', () => {
      if (!isDrawing) return;
      
      setIsDrawing(false);
      finishDrawing();
      startPoint = null;
    });

    // Object modification events
    canvas.on('object:modified', (e) => {
      if (e.target) {
        const element = findElementByFabricObject(e.target);
        if (element) {
          // Update the element with new coordinates
          const updatedElement = {
            ...element,
            geoCoordinates: coordinateTransformRef.current 
              ? extractCoordinatesFromFabricObject(e.target).map(coord => 
                  coordinateTransformRef.current!.canvasToGeo(coord.x, coord.y)
                )
              : element.geoCoordinates
          };
          
          // Update the stored element
          elementsMapRef.current.set(element.id, updatedElement);
          
          onElementModified?.(updatedElement);
        }
      }
    });

    // Object selection events
    canvas.on('selection:created', (e) => {
      if (activeTool === DrawingTool.SELECT && e.selected && e.selected.length > 0) {
        // Handle selection - could be used for showing selection UI
        console.log('Objects selected:', e.selected.length);
      }
    });

    canvas.on('selection:cleared', () => {
      if (activeTool === DrawingTool.SELECT) {
        // Handle deselection
        console.log('Selection cleared');
      }
    });

    // Keyboard event handling for delete
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && activeTool === DrawingTool.SELECT) {
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length > 0) {
          activeObjects.forEach(obj => {
            const element = findElementByFabricObject(obj);
            if (element) {
              canvas.remove(obj);
              elementsMapRef.current.delete(element.id);
              onElementRemoved?.(element.id);
            }
          });
          canvas.discardActiveObject();
          canvas.renderAll();
        }
      }
    };

    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };

  }, [activeTool, toolSettings, isDrawing, onElementAdded, onElementModified, onElementRemoved]);

  const createDrawingElement = (type: DrawingTool, fabricObject: fabric.Object): DrawingElement => {
    const id = `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store element ID in fabric object for later reference
    (fabricObject as any).elementId = id;
    
    // Convert canvas coordinates to geo coordinates if transform is available
    let geoCoordinates: { lat: number; lng: number }[] | undefined;
    
    if (coordinateTransformRef.current && fabricObject) {
      // Extract coordinates based on object type
      const coords = extractCoordinatesFromFabricObject(fabricObject);
      geoCoordinates = coords.map(coord => 
        coordinateTransformRef.current!.canvasToGeo(coord.x, coord.y)
      );
    }

    const element: DrawingElement = {
      id,
      type,
      fabricObject,
      geoCoordinates,
      metadata: {
        strokeColor: toolSettings.strokeColor,
        strokeWidth: toolSettings.strokeWidth,
        fillColor: toolSettings.fillColor,
        fillOpacity: toolSettings.fillOpacity,
        createdAt: new Date().toISOString()
      }
    };

    // Store element in map for quick lookup
    elementsMapRef.current.set(id, element);
    
    return element;
  };

  const extractCoordinatesFromFabricObject = (obj: fabric.Object): { x: number; y: number }[] => {
    const coords: { x: number; y: number }[] = [];
    
    if (obj instanceof fabric.Path) {
      // For paths, we'd need to parse the path data - simplified for now
      coords.push({ x: obj.left || 0, y: obj.top || 0 });
    } else if (obj instanceof fabric.Line) {
      coords.push(
        { x: obj.x1 || 0, y: obj.y1 || 0 },
        { x: obj.x2 || 0, y: obj.y2 || 0 }
      );
    } else if (obj instanceof fabric.Circle) {
      coords.push({ x: obj.left || 0, y: obj.top || 0 });
    } else if (obj instanceof fabric.Polygon) {
      const points = (obj as any).points || [];
      coords.push(...points.map((p: any) => ({ x: p.x, y: p.y })));
    } else {
      // Default: use object position
      coords.push({ x: obj.left || 0, y: obj.top || 0 });
    }
    
    return coords;
  };

  const findElementByFabricObject = (fabricObject: fabric.Object): DrawingElement | null => {
    const elementId = (fabricObject as any).elementId;
    if (elementId && elementsMapRef.current.has(elementId)) {
      return elementsMapRef.current.get(elementId) || null;
    }
    return null;
  };

  // Drawing tool implementations
  const startDrawingLine = (canvas: fabric.Canvas, pointer: fabric.IPoint) => {
    const line = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
      stroke: toolSettings.strokeColor,
      strokeWidth: toolSettings.strokeWidth,
      selectable: false,
    });
    
    canvas.add(line);
    setCurrentPath(line as any);
  };

  const updateDrawingLine = (canvas: fabric.Canvas, pointer: fabric.IPoint) => {
    if (currentPath instanceof fabric.Line) {
      currentPath.set({
        x2: pointer.x,
        y2: pointer.y
      });
      canvas.renderAll();
    }
  };

  const startDrawingCircle = (canvas: fabric.Canvas, pointer: fabric.IPoint) => {
    const circle = new fabric.Circle({
      left: pointer.x,
      top: pointer.y,
      radius: 1,
      stroke: toolSettings.strokeColor,
      strokeWidth: toolSettings.strokeWidth,
      fill: toolSettings.fillColor || 'transparent',
      opacity: toolSettings.fillOpacity || 1,
      selectable: false,
    });
    
    canvas.add(circle);
    setCurrentPath(circle as any);
  };

  const updateDrawingCircle = (canvas: fabric.Canvas, pointer: fabric.IPoint, startPoint: fabric.IPoint) => {
    if (currentPath instanceof fabric.Circle) {
      const radius = Math.sqrt(
        Math.pow(pointer.x - startPoint.x, 2) + 
        Math.pow(pointer.y - startPoint.y, 2)
      );
      
      currentPath.set({ radius });
      canvas.renderAll();
    }
  };

  const startDrawingPolygon = (canvas: fabric.Canvas, pointer: fabric.IPoint) => {
    // For polygon, we'll collect points on each click
    // This is a simplified implementation - in a full version, you'd handle double-click to finish
    const points = [{ x: pointer.x, y: pointer.y }];
    
    const polygon = new fabric.Polygon(points, {
      stroke: toolSettings.strokeColor,
      strokeWidth: toolSettings.strokeWidth,
      fill: toolSettings.fillColor || 'transparent',
      opacity: toolSettings.fillOpacity || 1,
      selectable: false,
    });
    
    canvas.add(polygon);
    setCurrentPath(polygon as any);
  };

  const addTextElement = (canvas: fabric.Canvas, pointer: fabric.IPoint) => {
    const text = new fabric.IText('Text', {
      left: pointer.x,
      top: pointer.y,
      fontSize: toolSettings.fontSize || 16,
      fontFamily: toolSettings.fontFamily || 'Arial',
      fill: toolSettings.strokeColor,
    });
    
    canvas.add(text);
    const element = createDrawingElement(DrawingTool.TEXT, text);
    onElementAdded?.(element);
  };

  const finishDrawing = () => {
    if (currentPath) {
      currentPath.set({ selectable: activeTool === DrawingTool.SELECT });
      const element = createDrawingElement(activeTool, currentPath);
      onElementAdded?.(element);
      setCurrentPath(null);
    }
  };

  const handleHeatmapDataChange = useCallback((newData: HeatmapData) => {
    setHeatmapData(newData);
    
    // Create a drawing element for the heatmap data
    if (newData.points.length > 0) {
      // Convert heatmap points to geo coordinates
      const geoCoordinates = coordinateTransformRef.current 
        ? newData.points.map(point => 
            coordinateTransformRef.current!.canvasToGeo(point.x, point.y)
          )
        : undefined;

      // Create a virtual fabric object to represent the heatmap
      const heatmapObject = new fabric.Rect({
        left: 0,
        top: 0,
        width: canvasSize.width,
        height: canvasSize.height,
        fill: 'transparent',
        selectable: false,
        evented: false
      });

      const element: DrawingElement = {
        id: `heatmap_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        type: DrawingTool.HEATMAP,
        fabricObject: heatmapObject,
        geoCoordinates,
        metadata: {
          heatmapData: newData,
          createdAt: new Date().toISOString()
        }
      };

      onElementAdded?.(element);
    }
  }, [canvasSize, onElementAdded]);

  return (
    <CanvasContainer className={className}>
      <canvas ref={canvasRef} />
      {activeTool === DrawingTool.HEATMAP && (
        <HeatmapLayer>
          <HeatmapCanvas
            width={canvasSize.width}
            height={canvasSize.height}
            data={heatmapData}
            onDataChange={handleHeatmapDataChange}
            isDrawing={activeTool === DrawingTool.HEATMAP}
          />
        </HeatmapLayer>
      )}
    </CanvasContainer>
  );
};

export default DrawingCanvas;