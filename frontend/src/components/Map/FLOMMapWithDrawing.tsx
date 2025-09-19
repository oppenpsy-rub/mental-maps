import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styled from 'styled-components';
import { DrawingTool, ToolSettings } from '../../types/drawing';
import { MapStyle } from '../../types/map';
import { tileLayerConfigs } from '../../config/mapLayers';

// FLOM-style drawing element interface
interface FLOMDrawingElement {
  id: string;
  type: 'polygon';
  coordinates: number[][];
  properties?: {
    color?: string;
    weight?: number;
    fillColor?: string;
    fillOpacity?: number;
  };
}

// Fix Leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface FLOMMapWithDrawingProps {
  center?: [number, number];
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  mapStyle?: MapStyle;
  enableDrawing?: boolean;
  initialTool?: DrawingTool;
  onDrawingChange?: (elements: FLOMDrawingElement[]) => void;
  drawingData?: FLOMDrawingElement[];
  style?: React.CSSProperties;
  className?: string;
  onToolChange?: (tool: DrawingTool) => void;
  onToolSettingsChange?: (settings: ToolSettings) => void;
  renderExternalControls?: (props: {
    activeTool: DrawingTool;
    toolSettings: ToolSettings;
    elements: FLOMDrawingElement[];
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

const FLOMFeedback = styled.div`
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  background: rgba(34, 197, 94, 0.9);
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

// FLOM-style drawing handler (simplified version)
const FLOMDrawingHandler: React.FC<{
  activeTool: DrawingTool;
  toolSettings: ToolSettings;
  onElementAdd: (element: FLOMDrawingElement) => void;
  isDrawingMode: boolean;
  onFLOMFeedback?: (message: string) => void;
}> = ({ activeTool, toolSettings, onElementAdd, isDrawingMode, onFLOMFeedback }) => {
  const map = useMap();
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<L.LatLng[]>([]);
  const [tempLayer, setTempLayer] = useState<L.Layer | null>(null);

  useEffect(() => {
    return () => {
      if (tempLayer) {
        map.removeLayer(tempLayer);
      }
    };
  }, [map, tempLayer]);

  useMapEvents({
    mousedown: (e) => {
      if (!isDrawingMode || activeTool !== DrawingTool.PEN) return;
      
      e.originalEvent.preventDefault();
      e.originalEvent.stopPropagation();
      
      setIsDrawing(true);
      setCurrentPath([e.latlng]);
    },

    mousemove: (e) => {
      if (!isDrawing || !isDrawingMode) return;

      e.originalEvent.preventDefault();
      e.originalEvent.stopPropagation();

      setCurrentPath(prev => [...prev, e.latlng]);
      
      if (tempLayer) {
        map.removeLayer(tempLayer);
      }
      const newTempLayer = L.polyline(currentPath, {
        color: toolSettings.strokeColor || '#22c55e',
        weight: toolSettings.strokeWidth || 3,
        opacity: 0.7
      }).addTo(map);
      setTempLayer(newTempLayer);
    },

    mouseup: () => {
      if (!isDrawing || !isDrawingMode) return;
      
      setIsDrawing(false);
      
      if (tempLayer) {
        map.removeLayer(tempLayer);
        setTempLayer(null);
      }

      if (currentPath.length > 3) {
        const element: FLOMDrawingElement = {
          id: `flom_polygon_${Date.now()}`,
          type: 'polygon',
          coordinates: currentPath.map(p => [p.lat, p.lng]),
          properties: {
            color: toolSettings.strokeColor || '#22c55e',
            weight: toolSettings.strokeWidth || 3,
            fillColor: toolSettings.fillColor || '#22c55e',
            fillOpacity: toolSettings.fillOpacity || 0.2
          }
        };
        
        onElementAdd(element);
        onFLOMFeedback?.('FLOM-Polygon erstellt! 🎯');
      }
      
      setCurrentPath([]);
    }
  });

  return null;
};

// Elements renderer component
const ElementsRenderer: React.FC<{
  elements: FLOMDrawingElement[];
}> = ({ elements }) => {
  const map = useMap();
  const layersRef = useRef<Map<string, L.Layer>>(new Map());

  useEffect(() => {
    layersRef.current.forEach(layer => {
      map.removeLayer(layer);
    });
    layersRef.current.clear();

    elements.forEach(element => {
      if (element.type === 'polygon') {
        const layer = L.polygon(
          element.coordinates as [number, number][],
          {
            color: element.properties?.color || '#22c55e',
            weight: element.properties?.weight || 3,
            fillColor: element.properties?.fillColor || '#22c55e',
            fillOpacity: element.properties?.fillOpacity || 0.2
          }
        );
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
  }, [elements, map]);

  return null;
};

const FLOMMapWithDrawing: React.FC<FLOMMapWithDrawingProps> = ({
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
  const [elements, setElements] = useState<FLOMDrawingElement[]>(drawingData);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [flomFeedback, setFlomFeedback] = useState<string | null>(null);

  const layerConfig = tileLayerConfigs[mapStyle] || tileLayerConfigs[MapStyle.SATELLITE];

  const handleElementAdd = useCallback((element: FLOMDrawingElement) => {
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
  }, [onDrawingChange]);

  const handleFLOMFeedback = useCallback((message: string) => {
    setFlomFeedback(message);
    setTimeout(() => setFlomFeedback(null), 2000);
  }, []);

  const handleToolChange = useCallback((tool: DrawingTool) => {
    setActiveTool(tool);
    setIsDrawingMode(tool === DrawingTool.PEN);
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
  }, [onDrawingChange]);

  useEffect(() => {
    setElements(drawingData);
  }, [drawingData]);

  useEffect(() => {
    if (initialTool !== activeTool) {
      setActiveTool(initialTool);
      setIsDrawingMode(initialTool === DrawingTool.PEN);
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
        
        <FLOMDrawingHandler
          activeTool={activeTool}
          toolSettings={toolSettings}
          onElementAdd={handleElementAdd}
          isDrawingMode={isDrawingMode}
          onFLOMFeedback={handleFLOMFeedback}
        />
        
        <ElementsRenderer elements={elements} />
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
      
      <FLOMFeedback className={flomFeedback ? 'visible' : ''}>
        {flomFeedback}
      </FLOMFeedback>
    </MapWrapper>
  );
};

export default FLOMMapWithDrawing;