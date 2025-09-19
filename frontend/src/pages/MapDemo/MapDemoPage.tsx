import React, { useState } from 'react';
import styled from 'styled-components';
import InteractiveMap from '../../components/Map/InteractiveMap';
import MapStyleSelector from '../../components/Map/MapStyleSelector';
import MapBoundsSelector from '../../components/Map/MapBoundsSelector';
import MapInteractionControls from '../../components/Map/MapInteractionControls';
import { useMap } from '../../hooks/useMap';
import { useMapInteraction } from '../../hooks/useMapInteraction';
import { MapBounds, MapStyle } from '../../types/map';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: ${({ theme }) => theme.spacing.md};
  gap: ${({ theme }) => theme.spacing.md};
`;

const MapContainer = styled.div`
  flex: 1;
  min-height: 500px;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  overflow: hidden;
`;

const ControlsPanel = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const InfoPanel = styled.div`
  background: ${({ theme }) => theme.colors.gray[50]};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing.sm};
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const Label = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const Value = styled.span`
  color: ${({ theme }) => theme.colors.gray[900]};
  font-family: ${({ theme }) => theme.typography.fontFamily.mono.join(', ')};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`;

const Button = styled.button`
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  background: ${({ theme }) => theme.colors.primary[500]};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.base};
  cursor: pointer;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  
  &:hover {
    background: ${({ theme }) => theme.colors.primary[600]};
  }
  
  &:disabled {
    background: ${({ theme }) => theme.colors.gray[300]};
    cursor: not-allowed;
  }
`;

export const MapDemoPage: React.FC = () => {
  const { mapState, handlers, actions } = useMap();
  const { deviceCapabilities, interactionSettings, toggleInteraction, resetToDefaults } = useMapInteraction(mapState.mapInstance);
  const [currentMapStyle, setCurrentMapStyle] = useState<MapStyle>(MapStyle.STANDARD);
  const [customBounds, setCustomBounds] = useState<MapBounds | undefined>();

  const handleFitGermany = () => {
    const germanyBounds: MapBounds = {
      north: 55.0584,
      south: 47.2701,
      east: 15.0419,
      west: 5.8663
    };
    actions.fitBounds(germanyBounds);
  };

  const handleFitEurope = () => {
    const europeBounds: MapBounds = {
      north: 71.1851,
      south: 34.5428,
      east: 40.2275,
      west: -31.2660
    };
    actions.fitBounds(europeBounds);
  };

  const handleGoToBerlin = () => {
    actions.flyTo([52.5200, 13.4050], 12);
  };

  const handleGoToMunich = () => {
    actions.flyTo([48.1351, 11.5820], 12);
  };

  const handleStyleChange = (style: MapStyle) => {
    setCurrentMapStyle(style);
  };

  const handleBoundsChange = (bounds: MapBounds) => {
    setCustomBounds(bounds);
    actions.fitBounds(bounds);
  };

  const formatBounds = (bounds: L.LatLngBounds | null) => {
    if (!bounds) return 'Not available';
    return `N: ${bounds.getNorth().toFixed(4)}, S: ${bounds.getSouth().toFixed(4)}, E: ${bounds.getEast().toFixed(4)}, W: ${bounds.getWest().toFixed(4)}`;
  };

  const formatCenter = (center: L.LatLng | null) => {
    if (!center) return 'Not available';
    return `${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`;
  };

  return (
    <PageContainer>
      <h1>Interactive Map Demo</h1>
      
      <ControlsPanel>
        <MapStyleSelector
          currentStyle={currentMapStyle}
          onStyleChange={handleStyleChange}
        />
        <MapBoundsSelector
          currentBounds={customBounds}
          onBoundsChange={handleBoundsChange}
        />
        <MapInteractionControls
          {...interactionSettings}
          onToggleInteraction={toggleInteraction}
          onResetToDefaults={resetToDefaults}
          deviceInfo={deviceCapabilities}
        />
      </ControlsPanel>
      
      <MapContainer>
        <InteractiveMap
          center={[51.1657, 10.4515]} // Center of Germany
          initialZoom={6}
          minZoom={3}
          maxZoom={18}
          mapStyle={currentMapStyle}
          initialBounds={customBounds}
          {...interactionSettings}
          {...handlers}
        />
      </MapContainer>

      <InfoPanel>
        <h3>Map Information</h3>
        <InfoGrid>
          <InfoItem>
            <Label>Status:</Label>
            <Value>{mapState.isLoaded ? 'Loaded' : 'Loading...'}</Value>
          </InfoItem>
          <InfoItem>
            <Label>Current Zoom:</Label>
            <Value>{mapState.currentZoom}</Value>
          </InfoItem>
          <InfoItem>
            <Label>Current Center:</Label>
            <Value>{formatCenter(mapState.currentCenter)}</Value>
          </InfoItem>
          <InfoItem>
            <Label>Current Bounds:</Label>
            <Value>{formatBounds(mapState.currentBounds)}</Value>
          </InfoItem>
          <InfoItem>
            <Label>Map Style:</Label>
            <Value>{currentMapStyle}</Value>
          </InfoItem>
        </InfoGrid>

        <h4>Navigation Controls</h4>
        <ButtonGroup>
          <Button onClick={handleFitGermany} disabled={!mapState.isLoaded}>
            Fit Germany
          </Button>
          <Button onClick={handleFitEurope} disabled={!mapState.isLoaded}>
            Fit Europe
          </Button>
          <Button onClick={handleGoToBerlin} disabled={!mapState.isLoaded}>
            Go to Berlin
          </Button>
          <Button onClick={handleGoToMunich} disabled={!mapState.isLoaded}>
            Go to Munich
          </Button>
        </ButtonGroup>
      </InfoPanel>
    </PageContainer>
  );
};

export default MapDemoPage;