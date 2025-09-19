import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styled from 'styled-components';
import { DrawingTool, ToolSettings } from '../../types/drawing';
import { MapStyle } from '../../types/map';
import { tileLayerConfigs } from '../../config/mapLayers';
import { ShapeRecognizer } from '../../utils/shapeRecognition';

// Define a simplified drawing element interface for this component
interface SimpleDrawingElement {
  id: string;
  type: 'polyline' | 'polygon' | 'circle';
  coordinates: number[][];
  properties?: {
    color?: string;
    weight?: number;
    fillColor?: string;
    fillOpacity?: number;
    radius?: number;
  };
}

// Fix Leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface ProfessionalMapWithDrawingProps {
  center?: [number, number];
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  mapStyle?: MapStyle;
  enableDrawing?: boolean;
  initialTool?: DrawingTool;
  onDrawingChange?: (elements: SimpleDrawingElement[]) => void;
  drawingData?: SimpleDrawingElement[];
  style?: React.CSSProperties;
  className?: string;
  // External toolbar and settings props
  onToolChange?: (tool: DrawingTool) => void;
  onToolSettingsChange?: (settings: ToolSettings) => void;
  renderExternalControls?: (props: {
    activeTool: DrawingTool;
    toolSettings: ToolSettings;
    elements: SimpleDrawingElement[];
    onToolChange: (tool: DrawingTool) => void;
    onToolSettingsChange: (settings: ToolSettings) => void;
    onUndo: () => void;
    onClear: () => void;
    onElementDelete: (id: string) => void;
    canUndo: boolean;
  }) => React.ReactNode;
}

const MapWrapper = styled.div<{ $isDrawing?: boolean }>`
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 400px;
  
  .leaflet-container {
    width: 100%;
    height: 100%;
    z-index: 1;
    cursor: ${props => props.$isDrawing ? 'crosshair' : 'grab'};
  }
  
  .leaflet-container:active {
    cursor: ${props => props.$isDrawing ? 'crosshair' : 'grabbing'};
  }
`;

const ShapeRecognitionFeedback = styled.div`
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  background: rgba(59, 130, 246, 0.9);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
  
  &.visible {
    opacity: 1;
  }
`;



// Light simplification function for better shape preservation
const lightSimplification = (points: L.LatLng[]): [number, number][] => {
  if (points.length <= 20) {
    // Keep all points for small drawings
    return points.map(p => [p.lat, p.lng]);
  }
  
  // For larger drawings, keep every 2nd or 3rd point but preserve corners
  const simplified: L.LatLng[] = [points[0]]; // Always keep first point
  
  for (let i = 2; i < points.length - 2; i += 2) { // Skip every other point
    const prev = points[i - 2];
    const curr = points[i];
    const next = points[i + 2];
    
    // Calculate angle to detect corners
    const v1 = { lat: curr.lat - prev.lat, lng: curr.lng - prev.lng };
    const v2 = { lat: next.lat - curr.lat, lng: next.lng - curr.lng };
    
    const dot = v1.lat * v2.lat + v1.lng * v2.lng;
    const mag1 = Math.sqrt(v1.lat * v1.lat + v1.lng * v1.lng);
    const mag2 = Math.sqrt(v2.lat * v2.lat + v2.lng * v2.lng);
    
    if (mag1 > 0 && mag2 > 0) {
      const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
      const angle = Math.acos(cosAngle);
      
      // Always keep corners (significant direction changes)
      if (angle > 0.3) {
        simplified.push(points[i - 1]); // Add the point before the corner
        simplified.push(curr); // Add the corner point
      } else {
        simplified.push(curr); // Add regular point
      }
    } else {
      simplified.push(curr);
    }
  }
  
  // Always keep last point
  simplified.push(points[points.length - 1]);
  
  return simplified.map(p => [p.lat, p.lng]);
};

// Drawing handler component
const DrawingHandler: React.FC<{
  activeTool: DrawingTool;
  toolSettings: ToolSettings;
  onElementAdd: (element: SimpleDrawingElement) => void;
  isDrawingMode: boolean;
  onShapeRecognized?: (shapeName: string) => void;
}> = ({ activeTool, toolSettings, onElementAdd, isDrawingMode, onShapeRecognized }) => {
  const map = useMap();
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<L.LatLng[]>([]);
  const [tempLayer, setTempLayer] = useState<L.Layer | null>(null);

  // Clean up temp layer on unmount
  useEffect(() => {
    return () => {
      if (tempLayer) {
        map.removeLayer(tempLayer);
      }
    };
  }, [map, tempLayer]);

  useMapEvents({
    mousedown: (e) => {
      if (!isDrawingMode || activeTool === DrawingTool.SELECT) return;
      
      // Prevent map dragging when drawing
      e.originalEvent.preventDefault();
      e.originalEvent.stopPropagation();
      
      setIsDrawing(true);
      setCurrentPath([e.latlng]);

      if (activeTool === DrawingTool.CIRCLE) {
        const element: SimpleDrawingElement = {
          id: `circle_${Date.now()}`,
          type: 'circle',
          coordinates: [[e.latlng.lat, e.latlng.lng]],
          properties: {
            radius: 1000,
            color: toolSettings.strokeColor || '#3b82f6',
            weight: toolSettings.strokeWidth || 3,
            fillColor: toolSettings.fillColor || '#3b82f6',
            fillOpacity: toolSettings.fillOpacity || 0.2
          }
        };
        onElementAdd(element);
        setIsDrawing(false);
      }
    },

    mousemove: (e) => {
      if (!isDrawing || !isDrawingMode) return;

      // Prevent map dragging during drawing
      e.originalEvent.preventDefault();
      e.originalEvent.stopPropagation();

      if (activeTool === DrawingTool.PEN) {
        setCurrentPath(prev => [...prev, e.latlng]);
        
        // Show temporary line - clean up previous first
        if (tempLayer) {
          try {
            map.removeLayer(tempLayer);
          } catch (e) {
            console.warn('Previous temp layer already removed');
          }
        }
        
        // Only create temp layer if we have enough points
        if (currentPath.length > 1) {
          const newTempLayer = L.polyline(currentPath, {
            color: toolSettings.strokeColor || '#22c55e',
            weight: toolSettings.strokeWidth || 3,
            opacity: 0.5,
            dashArray: '5, 5' // Dashed line to show it's temporary
          }).addTo(map);
          setTempLayer(newTempLayer);
        }
      }
    },

    mouseup: (e) => {
      if (!isDrawing || !isDrawingMode) return;
      
      setIsDrawing(false);
      
      // Clean up temp layer FIRST
      if (tempLayer) {
        try {
          map.removeLayer(tempLayer);
        } catch (e) {
          console.warn('Temp layer already removed:', e);
        }
        setTempLayer(null);
      }
      
      // Clear current path to prevent lingering references
      const pathToProcess = [...currentPath];
      setCurrentPath([]);

      if (activeTool === DrawingTool.PEN && pathToProcess.length > 1) {
        // Use shape recognition for pen tool
        const recognizedShape = ShapeRecognizer.recognizeShape(pathToProcess);
        console.log('Shape recognition result:', recognizedShape);
        
        let element: SimpleDrawingElement;
        
        if (recognizedShape.confidence > 0.3) { // Higher threshold - only convert clear shapes
          // Show feedback to user
          const shapeNames: Record<string, string> = {
            circle: 'Perfekter Kreis erkannt',
            ellipse: 'Oval erkannt',
            rectangle: 'Rechteck erkannt',
            line: 'Gerade Linie erkannt',
            polygon: 'Polygon erkannt',
            freeform: 'Freihandzeichnung beibehalten'
          };
          onShapeRecognized?.(shapeNames[recognizedShape.type] || 'Form erkannt');
          
          // Create recognized geometric shape
          switch (recognizedShape.type) {
            case 'circle':
              element = {
                id: `recognized_circle_${Date.now()}`,
                type: 'circle',
                coordinates: [recognizedShape.geometry.center!],
                properties: {
                  radius: recognizedShape.geometry.radius || 1000,
                  color: toolSettings.strokeColor || '#3b82f6',
                  weight: toolSettings.strokeWidth || 3,
                  fillColor: toolSettings.fillColor || '#3b82f6',
                  fillOpacity: toolSettings.fillOpacity || 0.2
                }
              };
              break;
            case 'ellipse':
              // For ellipses, keep the original shape but smooth it
              element = {
                id: `recognized_ellipse_${Date.now()}`,
                type: 'polygon',
                coordinates: recognizedShape.originalShape || recognizedShape.geometry.points!,
                properties: {
                  color: toolSettings.strokeColor || '#3b82f6',
                  weight: toolSettings.strokeWidth || 3,
                  fillColor: toolSettings.fillColor || '#3b82f6',
                  fillOpacity: toolSettings.fillOpacity || 0.2
                }
              };
              break;
            case 'rectangle':
              const bounds = recognizedShape.geometry.bounds!;
              element = {
                id: `recognized_rectangle_${Date.now()}`,
                type: 'polygon',
                coordinates: [
                  [bounds[0][0], bounds[0][1]], // top-left
                  [bounds[0][0], bounds[1][1]], // top-right
                  [bounds[1][0], bounds[1][1]], // bottom-right
                  [bounds[1][0], bounds[0][1]], // bottom-left
                  [bounds[0][0], bounds[0][1]]  // close the polygon
                ],
                properties: {
                  color: toolSettings.strokeColor || '#3b82f6',
                  weight: toolSettings.strokeWidth || 3,
                  fillColor: toolSettings.fillColor || '#3b82f6',
                  fillOpacity: toolSettings.fillOpacity || 0.2
                }
              };
              break;
            case 'freeform':
              // Keep the original drawing exactly as drawn
              element = {
                id: `freeform_${Date.now()}`,
                type: 'polyline',
                coordinates: recognizedShape.originalShape || pathToProcess.map(p => [p.lat, p.lng]),
                properties: {
                  color: toolSettings.strokeColor || '#3b82f6',
                  weight: toolSettings.strokeWidth || 3
                }
              };
              break;
            case 'line':
              element = {
                id: `recognized_line_${Date.now()}`,
                type: 'polyline',
                coordinates: recognizedShape.geometry.points!,
                properties: {
                  color: toolSettings.strokeColor || '#3b82f6',
                  weight: toolSettings.strokeWidth || 3
                }
              };
              break;
            case 'polygon':
              // FLOM-style: Create filled polygon from recognized shape
              element = {
                id: `polygon_${Date.now()}`,
                type: 'polygon',
                coordinates: recognizedShape.geometry.points!,
                properties: {
                  color: toolSettings.strokeColor || '#3b82f6',
                  weight: toolSettings.strokeWidth || 3,
                  fillColor: toolSettings.fillColor || '#3b82f6',
                  fillOpacity: toolSettings.fillOpacity || 0.2
                }
              };
              break;
            default:
              // FLOM-style: Always create a polygon from any drawing
              // Use light simplification to preserve shape better
              const simplifiedPath = lightSimplification(pathToProcess);
              element = {
                id: `flom_polygon_${Date.now()}`,
                type: 'polygon',
                coordinates: simplifiedPath,
                properties: {
                  color: toolSettings.strokeColor || '#22c55e',
                  weight: toolSettings.strokeWidth || 3,
                  fillColor: toolSettings.fillColor || '#22c55e',
                  fillOpacity: toolSettings.fillOpacity || 0.2
                }
              };
          }
        } else {
          // FLOM-style: Even low confidence gets converted to polygon
          // Use light simplification to preserve shape better
          const simplifiedPath = lightSimplification(pathToProcess);
          element = {
            id: `flom_polygon_${Date.now()}`,
            type: 'polygon',
            coordinates: simplifiedPath,
            properties: {
              color: toolSettings.strokeColor || '#22c55e',
              weight: toolSettings.strokeWidth || 3,
              fillColor: toolSettings.fillColor || '#22c55e',
              fillOpacity: toolSettings.fillOpacity || 0.2
            }
          };
        }
        
        onElementAdd(element);
      } else if (activeTool === DrawingTool.LINE && pathToProcess.length >= 1) {
        const element: SimpleDrawingElement = {
          id: `line_${Date.now()}`,
          type: 'polyline',
          coordinates: [
            [pathToProcess[0].lat, pathToProcess[0].lng],
            [e.latlng.lat, e.latlng.lng]
          ],
          properties: {
            color: toolSettings.strokeColor || '#3b82f6',
            weight: toolSettings.strokeWidth || 3
          }
        };
        onElementAdd(element);
      } else if (activeTool === DrawingTool.POLYGON && pathToProcess.length >= 3) {
        const element: SimpleDrawingElement = {
          id: `polygon_${Date.now()}`,
          type: 'polygon',
          coordinates: currentPath.map(p => [p.lat, p.lng]),
          properties: {
            color: toolSettings.strokeColor || '#3b82f6',
            weight: toolSettings.strokeWidth || 3,
            fillColor: toolSettings.fillColor || '#3b82f6',
            fillOpacity: toolSettings.fillOpacity || 0.2
          }
        };
        onElementAdd(element);
      }
    },

    dblclick: (e) => {
      if (!isDrawingMode || activeTool !== DrawingTool.POLYGON) return;
      
      e.originalEvent.preventDefault();
      
      if (currentPath.length >= 3) {
        const element: SimpleDrawingElement = {
          id: `polygon_${Date.now()}`,
          type: 'polygon',
          coordinates: currentPath.map(p => [p.lat, p.lng]),
          properties: {
            color: toolSettings.strokeColor || '#3b82f6',
            weight: toolSettings.strokeWidth || 3,
            fillColor: toolSettings.fillColor || '#3b82f6',
            fillOpacity: toolSettings.fillOpacity || 0.2
          }
        };
        onElementAdd(element);
        setCurrentPath([]);
        setIsDrawing(false);
      }
    }
  });

  return null;
};

// Elements renderer component
const ElementsRenderer: React.FC<{
  elements: SimpleDrawingElement[];
  selectedElement: string | null;
  onElementSelect: (id: string) => void;
}> = ({ elements, selectedElement, onElementSelect }) => {
  const map = useMap();
  const layersRef = useRef<Map<string, L.Layer>>(new Map());

  useEffect(() => {
    // Clear existing layers
    layersRef.current.forEach(layer => {
      map.removeLayer(layer);
    });
    layersRef.current.clear();

    // Add new layers
    elements.forEach(element => {
      let layer: L.Layer | null = null;

      if (element.type === 'polyline') {
        layer = L.polyline(
          element.coordinates as [number, number][],
          {
            color: element.properties?.color || '#3b82f6',
            weight: element.properties?.weight || 3,
            opacity: selectedElement === element.id ? 1 : 0.8
          }
        );
      } else if (element.type === 'polygon') {
        layer = L.polygon(
          element.coordinates as [number, number][],
          {
            color: element.properties?.color || '#3b82f6',
            weight: element.properties?.weight || 3,
            fillColor: element.properties?.fillColor || '#3b82f6',
            fillOpacity: element.properties?.fillOpacity || 0.2,
            opacity: selectedElement === element.id ? 1 : 0.8
          }
        );
      } else if (element.type === 'circle') {
        const center = element.coordinates[0] as [number, number];
        layer = L.circle(center, {
          radius: element.properties?.radius || 1000,
          color: element.properties?.color || '#3b82f6',
          weight: element.properties?.weight || 3,
          fillColor: element.properties?.fillColor || '#3b82f6',
          fillOpacity: element.properties?.fillOpacity || 0.2,
          opacity: selectedElement === element.id ? 1 : 0.8
        });
      }

      if (layer) {
        layer.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          onElementSelect(element.id);
        });
        layer.addTo(map);
        layersRef.current.set(element.id, layer);
      }
    });

    return () => {
      layersRef.current.forEach(layer => {
        map.removeLayer(layer);
      });
      layersRef.current.clear();
    };
  }, [elements, selectedElement, map, onElementSelect]);

  return null;
};

export const ProfessionalMapWithDrawing: React.FC<ProfessionalMapWithDrawingProps> = ({
  center = [52.52, 13.405],
  initialZoom = 10,
  minZoom = 3,
  maxZoom = 18,
  mapStyle = MapStyle.SATELLITE,
  enableDrawing = true,
  initialTool = DrawingTool.SELECT,
  onDrawingChange,
  drawingData = [],
  style,
  className,
  onToolChange,
  onToolSettingsChange,
  renderExternalControls
}) => {
  const [activeTool, setActiveTool] = useState<DrawingTool>(initialTool);
  const [toolSettings, setToolSettings] = useState<ToolSettings>({
    strokeColor: '#22c55e',
    strokeWidth: 3,
    fillColor: '#22c55e',
    fillOpacity: 0.2
  });
  const [elements, setElements] = useState<SimpleDrawingElement[]>(drawingData);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [recognitionFeedback, setRecognitionFeedback] = useState<string | null>(null);

  const layerConfig = tileLayerConfigs[mapStyle] || tileLayerConfigs[MapStyle.SATELLITE];

  const handleElementAdd = useCallback((element: SimpleDrawingElement) => {
    setElements(prev => {
      const newElements = [...prev, element];
      onDrawingChange?.(newElements);
      return newElements;
    });
  }, [onDrawingChange]);

  const handleElementDelete = useCallback((elementId: string) => {
    setElements(prev => {
      const newElements = prev.filter(el => el.id !== elementId);
      onDrawingChange?.(newElements);
      return newElements;
    });
    setSelectedElement(null);
  }, [onDrawingChange]);

  const handleShapeRecognized = useCallback((shapeName: string) => {
    setRecognitionFeedback(shapeName);
    setTimeout(() => setRecognitionFeedback(null), 2000);
  }, []);

  const handleToolChange = useCallback((tool: DrawingTool) => {
    setActiveTool(tool);
    setIsDrawingMode(tool !== DrawingTool.SELECT);
    setSelectedElement(null);
    
    // Clean up any ongoing drawing when switching tools
    // Note: currentPath and isDrawing are managed in the DrawingHandler component
    
    onToolChange?.(tool);
  }, [onToolChange]);

  const handleToolSettingsChange = useCallback((newSettings: ToolSettings) => {
    setToolSettings(newSettings);
    onToolSettingsChange?.(newSettings);
  }, [onToolSettingsChange]);

  const handleUndo = useCallback(() => {
    setElements(prev => {
      if (prev.length === 0) return prev;
      const newElements = prev.slice(0, -1);
      onDrawingChange?.(newElements);
      return newElements;
    });
  }, [onDrawingChange]);

  const handleClear = useCallback(() => {
    setElements([]);
    onDrawingChange?.([]);
    setSelectedElement(null);
  }, [onDrawingChange]);

  useEffect(() => {
    setElements(drawingData);
  }, [drawingData]);

  // Sync with external tool changes
  useEffect(() => {
    if (initialTool !== activeTool) {
      setActiveTool(initialTool);
      setIsDrawingMode(initialTool !== DrawingTool.SELECT);
    }
  }, [initialTool, activeTool]);

  return (
    <MapWrapper style={style} className={className} $isDrawing={isDrawingMode}>
      <MapContainer
        center={center}
        zoom={initialZoom}
        minZoom={minZoom}
        maxZoom={maxZoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
        dragging={!isDrawingMode}
        doubleClickZoom={!isDrawingMode}
        touchZoom={true}
      >
        <TileLayer
          attribution={layerConfig.attribution}
          url={layerConfig.url}
          maxZoom={layerConfig.maxZoom}
        />
        
        <DrawingHandler
          activeTool={activeTool}
          toolSettings={toolSettings}
          onElementAdd={handleElementAdd}
          isDrawingMode={isDrawingMode}
          onShapeRecognized={handleShapeRecognized}
        />
        
        <ElementsRenderer
          elements={elements}
          selectedElement={selectedElement}
          onElementSelect={setSelectedElement}
        />
      </MapContainer>

      {enableDrawing && renderExternalControls && renderExternalControls({
        activeTool,
        toolSettings,
        elements,
        onToolChange: handleToolChange,
        onToolSettingsChange: handleToolSettingsChange,
        onUndo: handleUndo,
        onClear: handleClear,
        onElementDelete: handleElementDelete,
        canUndo: elements.length > 0
      })}
      
      {/* Shape Recognition Feedback */}
      <ShapeRecognitionFeedback className={recognitionFeedback ? 'visible' : ''}>
        {recognitionFeedback}
      </ShapeRecognitionFeedback>
    </MapWrapper>
  );
};

export default ProfessionalMapWithDrawing;