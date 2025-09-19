import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import styled from 'styled-components';

const OverlayContainer = styled.div`
  width: 100%;
  height: 600px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
`;

const LayerControls = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1000;
  background: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  max-width: 300px;
  max-height: 400px;
  overflow-y: auto;
`;

const LayerItem = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px;
  border-radius: 4px;
  background: #f9fafb;
`;

const LayerCheckbox = styled.input`
  margin-right: 12px;
`;

const LayerInfo = styled.div`
  flex: 1;
`;

const LayerName = styled.div`
  font-weight: 500;
  font-size: 14px;
  color: #374151;
  margin-bottom: 4px;
`;

const LayerStats = styled.div`
  font-size: 12px;
  color: #6b7280;
`;

const ColorIndicator = styled.div<{ color: string }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: ${props => props.color};
  margin-left: 8px;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
`;

const OpacitySlider = styled.input`
  width: 100%;
  margin-top: 8px;
`;

interface ResponseLayer {
  id: string;
  name: string;
  participantCode: string;
  geoJsonData: GeoJSON.FeatureCollection;
  color: string;
  visible: boolean;
  opacity: number;
  elementCount: number;
  responseTime: number;
}

interface OverlayVisualizationProps {
  responses: any[];
  bounds?: L.LatLngBounds;
  onLayerToggle?: (layerId: string, visible: boolean) => void;
  onOpacityChange?: (layerId: string, opacity: number) => void;
}

const generateLayerColors = (count: number): string[] => {
  const colors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
    '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#84cc16'
  ];
  
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length]);
  }
  return result;
};

const responseToGeoJSON = (response: any): GeoJSON.FeatureCollection => {
  const features: GeoJSON.Feature[] = [];
  
  if (response.mapDrawing?.elements) {
    response.mapDrawing.elements.forEach((element: any, index: number) => {
      if (element.geometry) {
        features.push({
          type: 'Feature',
          geometry: element.geometry,
          properties: {
            id: element.id || `element-${index}`,
            type: element.type,
            style: element.style || {},
            metadata: element.metadata || {},
            participantCode: response.participantCode,
            responseId: response.responseId
          }
        });
      }
    });
  }
  
  return {
    type: 'FeatureCollection',
    features
  };
};

const OverlayVisualization: React.FC<OverlayVisualizationProps> = ({
  responses,
  bounds,
  onLayerToggle,
  onOpacityChange
}) => {
  const [layers, setLayers] = useState<ResponseLayer[]>([]);

  useEffect(() => {
    if (!responses || responses.length === 0) return;

    const colors = generateLayerColors(responses.length);
    
    const newLayers: ResponseLayer[] = responses.map((response, index) => ({
      id: response.responseId,
      name: `Response ${index + 1}`,
      participantCode: response.participantCode,
      geoJsonData: responseToGeoJSON(response),
      color: colors[index],
      visible: true,
      opacity: 0.7,
      elementCount: response.mapDrawing?.elements?.length || 0,
      responseTime: response.responseTimeMs || 0
    }));

    setLayers(newLayers);
  }, [responses]);

  const handleLayerToggle = (layerId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, visible: !layer.visible }
        : layer
    ));
    
    const layer = layers.find(l => l.id === layerId);
    if (layer && onLayerToggle) {
      onLayerToggle(layerId, !layer.visible);
    }
  };

  const handleOpacityChange = (layerId: string, opacity: number) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, opacity }
        : layer
    ));
    
    if (onOpacityChange) {
      onOpacityChange(layerId, opacity);
    }
  };

  const getFeatureStyle = (feature: any, layerColor: string, opacity: number) => {
    const defaultStyle = {
      color: layerColor,
      weight: 2,
      opacity: opacity,
      fillColor: layerColor,
      fillOpacity: opacity * 0.3
    };

    if (feature.properties?.style) {
      return {
        ...defaultStyle,
        ...feature.properties.style,
        opacity: opacity,
        fillOpacity: opacity * 0.3
      };
    }

    return defaultStyle;
  };

  const defaultCenter: [number, number] = bounds 
    ? [bounds.getCenter().lat, bounds.getCenter().lng]
    : [52.52, 13.405];

  const defaultZoom = bounds ? 12 : 10;

  return (
    <OverlayContainer>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
        bounds={bounds}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {layers
          .filter(layer => layer.visible)
          .map(layer => (
            <GeoJSON
              key={layer.id}
              data={layer.geoJsonData}
              style={(feature) => getFeatureStyle(feature, layer.color, layer.opacity)}
              onEachFeature={(feature, leafletLayer) => {
                leafletLayer.bindPopup(`
                  <div>
                    <strong>Participant:</strong> ${feature.properties.participantCode}<br/>
                    <strong>Element Type:</strong> ${feature.properties.type}<br/>
                    <strong>Response ID:</strong> ${feature.properties.responseId}
                  </div>
                `);
              }}
            />
          ))
        }
      </MapContainer>

      <LayerControls>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
          Response Layers ({layers.length})
        </h4>
        
        {layers.map(layer => (
          <LayerItem key={layer.id}>
            <LayerCheckbox
              type="checkbox"
              checked={layer.visible}
              onChange={() => handleLayerToggle(layer.id)}
            />
            <LayerInfo>
              <LayerName>{layer.participantCode}</LayerName>
              <LayerStats>
                {layer.elementCount} elements • {Math.round(layer.responseTime / 1000)}s
              </LayerStats>
              <OpacitySlider
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={layer.opacity}
                onChange={(e) => handleOpacityChange(layer.id, parseFloat(e.target.value))}
              />
            </LayerInfo>
            <ColorIndicator color={layer.color} />
          </LayerItem>
        ))}
      </LayerControls>
    </OverlayContainer>
  );
};

export default OverlayVisualization;