import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
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

interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface InteractiveMapProps {
  initialBounds?: MapBounds;
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  center?: [number, number];
  mapStyle?: MapStyle;
  // Touch and interaction settings
  enableTouchZoom?: boolean;
  enableTouchPan?: boolean;
  enableScrollWheelZoom?: boolean;
  enableDoubleClickZoom?: boolean;
  enableKeyboardNavigation?: boolean;
  // Zoom restrictions
  restrictToInitialBounds?: boolean;
  maxBounds?: MapBounds;
  // Event handlers
  onMapReady?: (map: L.Map) => void;
  onBoundsChange?: (bounds: L.LatLngBounds) => void;
  onZoomChange?: (zoom: number) => void;
  onStyleChange?: (style: MapStyle) => void;
  className?: string;
  style?: React.CSSProperties;
}

const MapWrapper = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  
  .leaflet-container {
    width: 100%;
    height: 100%;
    font-family: ${({ theme }) => theme.typography.fontFamily.sans.join(', ')};
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

// Component to handle map events and provide map instance to parent
const MapEventHandler: React.FC<{
  onMapReady?: (map: L.Map) => void;
  onBoundsChange?: (bounds: L.LatLngBounds) => void;
  onZoomChange?: (zoom: number) => void;
}> = ({ onMapReady, onBoundsChange, onZoomChange }) => {
  const map = useMap();

  useEffect(() => {
    if (onMapReady) {
      onMapReady(map);
    }

    const handleMoveEnd = () => {
      if (onBoundsChange) {
        onBoundsChange(map.getBounds());
      }
    };

    const handleZoomEnd = () => {
      if (onZoomChange) {
        onZoomChange(map.getZoom());
      }
    };

    map.on('moveend', handleMoveEnd);
    map.on('zoomend', handleZoomEnd);

    return () => {
      map.off('moveend', handleMoveEnd);
      map.off('zoomend', handleZoomEnd);
    };
  }, [map, onMapReady, onBoundsChange, onZoomChange]);

  return null;
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  initialBounds,
  initialZoom = 10,
  minZoom = 3,
  maxZoom = 18,
  center = [51.505, -0.09], // Default to London
  mapStyle = MapStyle.STANDARD,
  // Touch and interaction settings
  enableTouchZoom = true,
  enableTouchPan = true,
  enableScrollWheelZoom = true,
  enableDoubleClickZoom = true,
  enableKeyboardNavigation = true,
  // Zoom restrictions
  restrictToInitialBounds = false,
  maxBounds,
  // Event handlers
  onMapReady,
  onBoundsChange,
  onZoomChange,
  className,
  style,
}) => {
  const [mapBounds, setMapBounds] = useState<L.LatLngBounds | undefined>();
  const [currentMapStyle, setCurrentMapStyle] = useState<MapStyle>(mapStyle);

  useEffect(() => {
    if (initialBounds) {
      const bounds = L.latLngBounds(
        [initialBounds.south, initialBounds.west],
        [initialBounds.north, initialBounds.east]
      );
      setMapBounds(bounds);
    }
  }, [initialBounds]);

  useEffect(() => {
    setCurrentMapStyle(mapStyle);
  }, [mapStyle]);

  const layerConfig = getLayerConfig(currentMapStyle);
  const effectiveMaxZoom = Math.min(maxZoom, layerConfig.maxZoom || 18);

  // Calculate max bounds if provided
  const leafletMaxBounds = maxBounds ? L.latLngBounds(
    [maxBounds.south, maxBounds.west],
    [maxBounds.north, maxBounds.east]
  ) : undefined;

  return (
    <MapWrapper className={className} style={style}>
      <MapContainer
        center={center}
        zoom={initialZoom}
        minZoom={minZoom}
        maxZoom={effectiveMaxZoom}
        bounds={mapBounds}
        maxBounds={leafletMaxBounds}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={enableScrollWheelZoom}
        doubleClickZoom={enableDoubleClickZoom}
        dragging={enableTouchPan}
        touchZoom={enableTouchZoom}
        keyboard={enableKeyboardNavigation}
        bounceAtZoomLimits={true}
        maxBoundsViscosity={restrictToInitialBounds ? 1.0 : 0.0}
      >
        <TileLayer
          key={currentMapStyle} // Force re-render when style changes
          attribution={layerConfig.attribution}
          url={layerConfig.url}
          maxZoom={layerConfig.maxZoom}
          minZoom={layerConfig.minZoom}
          subdomains={layerConfig.subdomains}
        />
        
        <MapEventHandler
          onMapReady={onMapReady}
          onBoundsChange={onBoundsChange}
          onZoomChange={onZoomChange}
        />
      </MapContainer>
    </MapWrapper>
  );
};

export default InteractiveMap;