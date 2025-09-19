import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import styled from 'styled-components';
import { MentalMapData, MentalMapElement } from '../../services/mentalMapsService';
import { MapStyle } from '../../types/map';
import { tileLayerConfigs } from '../../config/mapLayers';

interface MentalMapViewerProps {
  mentalMap: MentalMapData;
  mapStyle?: MapStyle;
  showParticipantInfo?: boolean;
  onElementClick?: (element: MentalMapElement) => void;
}

const ViewerContainer = styled.div`
  width: 100%;
  height: 400px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
`;

const InfoOverlay = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  padding: 12px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-size: 12px;
  max-width: 250px;
`;

const InfoTitle = styled.div`
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
`;

const InfoItem = styled.div`
  color: #6b7280;
  margin-bottom: 2px;
`;

const ElementsRenderer: React.FC<{
  elements: MentalMapElement[];
  onElementClick?: (element: MentalMapElement) => void;
}> = ({ elements, onElementClick }) => {
  const map = useMap();

  useEffect(() => {
    const layers: L.Layer[] = [];

    elements.forEach(element => {
      let layer: L.Layer | null = null;

      try {
        const coords = extractCoordinates(element.geometry);
        
        if (element.type === 'polygon' && coords.length > 0) {
          layer = L.polygon(coords as [number, number][], {
            color: element.style.strokeColor || element.style.color || '#22c55e',
            weight: element.style.strokeWidth || 3,
            fillColor: element.style.fillColor || element.style.color || '#22c55e',
            fillOpacity: element.style.fillOpacity || 0.2,
            opacity: element.style.opacity || 0.8
          });
        } else if (element.type === 'line' && coords.length > 1) {
          layer = L.polyline(coords as [number, number][], {
            color: element.style.strokeColor || element.style.color || '#22c55e',
            weight: element.style.strokeWidth || 3,
            opacity: element.style.opacity || 0.8
          });
        } else if (element.type === 'circle' && coords.length > 0) {
          layer = L.circle(coords[0] as [number, number], {
            radius: element.style.radius || 1000,
            color: element.style.strokeColor || element.style.color || '#22c55e',
            weight: element.style.strokeWidth || 3,
            fillColor: element.style.fillColor || element.style.color || '#22c55e',
            fillOpacity: element.style.fillOpacity || 0.2,
            opacity: element.style.opacity || 0.8
          });
        } else if (element.type === 'point' && coords.length > 0) {
          layer = L.marker(coords[0] as [number, number]);
        }

        if (layer) {
          // Add click handler
          layer.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            onElementClick?.(element);
          });

          // Add tooltip with metadata
          if (element.metadata?.label || element.metadata?.description) {
            const tooltipContent = [
              element.metadata.label && `<strong>${element.metadata.label}</strong>`,
              element.metadata.description && element.metadata.description,
              element.metadata.createdWith && `<em>Erstellt mit: ${element.metadata.createdWith}</em>`
            ].filter(Boolean).join('<br>');
            
            layer.bindTooltip(tooltipContent, {
              permanent: false,
              direction: 'top'
            });
          }

          layer.addTo(map);
          layers.push(layer);
        }
      } catch (error) {
        console.warn('Failed to render element:', element, error);
      }
    });

    // Fit map to show all elements
    if (layers.length > 0) {
      const group = new L.FeatureGroup(layers);
      try {
        map.fitBounds(group.getBounds(), { padding: [20, 20] });
      } catch (error) {
        console.warn('Failed to fit bounds:', error);
      }
    }

    return () => {
      layers.forEach(layer => {
        try {
          map.removeLayer(layer);
        } catch (error) {
          console.warn('Failed to remove layer:', error);
        }
      });
    };
  }, [elements, map, onElementClick]);

  return null;
};

const extractCoordinates = (geometry: GeoJSON.Geometry): number[][] => {
  switch (geometry.type) {
    case 'Point':
      return [geometry.coordinates as number[]];
    case 'LineString':
      return geometry.coordinates as number[][];
    case 'Polygon':
      return geometry.coordinates[0] as number[][];
    case 'MultiPolygon':
      return geometry.coordinates[0][0] as number[][];
    default:
      return [];
  }
};

export const MentalMapViewer: React.FC<MentalMapViewerProps> = ({
  mentalMap,
  mapStyle = MapStyle.SATELLITE,
  showParticipantInfo = true,
  onElementClick
}) => {
  const layerConfig = tileLayerConfigs[mapStyle] || tileLayerConfigs[MapStyle.SATELLITE];
  const elements = mentalMap.mapDrawing.elements || [];

  // Calculate center from elements or use default
  const getMapCenter = (): [number, number] => {
    if (elements.length === 0) return [52.52, 13.405];

    const allCoords = elements.flatMap(element => extractCoordinates(element.geometry));
    if (allCoords.length === 0) return [52.52, 13.405];

    const avgLat = allCoords.reduce((sum, coord) => sum + coord[0], 0) / allCoords.length;
    const avgLng = allCoords.reduce((sum, coord) => sum + coord[1], 0) / allCoords.length;
    
    return [avgLat, avgLng];
  };

  const formatResponseTime = (timeMs: number): string => {
    if (timeMs < 1000) return `${timeMs}ms`;
    if (timeMs < 60000) return `${Math.round(timeMs / 1000)}s`;
    return `${Math.round(timeMs / 60000)}min`;
  };

  return (
    <ViewerContainer>
      <MapContainer
        center={getMapCenter()}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution={layerConfig.attribution}
          url={layerConfig.url}
          maxZoom={layerConfig.maxZoom}
        />
        
        <ElementsRenderer 
          elements={elements}
          onElementClick={onElementClick}
        />
      </MapContainer>

      {showParticipantInfo && (
        <InfoOverlay>
          <InfoTitle>{mentalMap.questionTitle}</InfoTitle>
          <InfoItem><strong>Teilnehmer:</strong> {mentalMap.participantCode}</InfoItem>
          <InfoItem><strong>Elemente:</strong> {elements.length}</InfoItem>
          <InfoItem><strong>Antwortzeit:</strong> {formatResponseTime(mentalMap.responseTimeMs)}</InfoItem>
          <InfoItem><strong>Erstellt:</strong> {new Date(mentalMap.responseCreatedAt).toLocaleDateString('de-DE')}</InfoItem>
        </InfoOverlay>
      )}
    </ViewerContainer>
  );
};

export default MentalMapViewer;