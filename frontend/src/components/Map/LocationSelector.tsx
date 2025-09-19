import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styled from 'styled-components';
import { MapStyle } from '../../types/map';
import { getLayerConfig } from '../../config/mapLayers';

// Fix for default markers in Leaflet with Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface LocationSelectorProps {
  onLocationSelect?: (coordinates: [number, number]) => void;
  selectedLocation?: [number, number] | null;
  center?: [number, number];
  zoom?: number;
  mapStyle?: MapStyle;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

const MapWrapper = styled.div<{ height?: string | number }>`
  width: 100%;
  height: ${props => typeof props.height === 'number' ? `${props.height}px` : props.height || '300px'};
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  
  .leaflet-container {
    width: 100%;
    height: 100%;
    font-family: ${({ theme }) => theme.typography.fontFamily.sans.join(', ')};
    cursor: crosshair;
  }
  
  .leaflet-control-zoom {
    border: none;
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
  
  .leaflet-control-zoom a {
    background-color: ${({ theme }) => theme.colors.gray[50]};
    color: ${({ theme }) => theme.colors.gray[900]};
    border: 1px solid ${({ theme }) => theme.colors.gray[200]};
    
    &:hover {
      background-color: ${({ theme }) => theme.colors.gray[100]};
    }
  }
`;

const Instructions = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.95);
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #495057;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

// Component to handle map clicks
const LocationClickHandler: React.FC<{
  onLocationSelect?: (coordinates: [number, number]) => void;
}> = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      if (onLocationSelect) {
        onLocationSelect([e.latlng.lng, e.latlng.lat]);
      }
    },
  });

  return null;
};

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  onLocationSelect,
  selectedLocation,
  center = [51.1657, 10.4515], // Center of Germany
  zoom = 6,
  mapStyle = MapStyle.STANDARD,
  height = '300px',
  className,
  style,
}) => {
  const [currentMapStyle, setCurrentMapStyle] = useState<MapStyle>(mapStyle);

  useEffect(() => {
    setCurrentMapStyle(mapStyle);
  }, [mapStyle]);

  const layerConfig = getLayerConfig(currentMapStyle);

  // Convert coordinates for Leaflet (lat, lng format)
  const markerPosition = selectedLocation ? [selectedLocation[1], selectedLocation[0]] as [number, number] : null;

  return (
    <MapWrapper height={height} className={className} style={style}>
      <Instructions>
        Klicken Sie auf die Karte, um einen Ort auszuwählen
      </Instructions>
      
      <MapContainer
        center={center}
        zoom={zoom}
        minZoom={3}
        maxZoom={18}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        dragging={true}
        touchZoom={true}
      >
        <TileLayer
          key={currentMapStyle}
          attribution={layerConfig.attribution}
          url={layerConfig.url}
          maxZoom={layerConfig.maxZoom}
          minZoom={layerConfig.minZoom}
          subdomains={layerConfig.subdomains}
        />
        
        <LocationClickHandler onLocationSelect={onLocationSelect} />
        
        {markerPosition && (
          <Marker position={markerPosition} />
        )}
      </MapContainer>
    </MapWrapper>
  );
};

export default LocationSelector;