import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Card } from '../../../components/UI/Card';
// import { Button } from '../../../components/UI/Button'; // Not used yet
import { MapStyle } from '../../../types/map';
import { InteractiveMap } from '../../../components/Map/InteractiveMap';

interface MapConfiguration {
  initialBounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  center?: [number, number];
  mapStyle?: MapStyle;
  enabledTools?: string[];
}

interface MapConfigurationEditorProps {
  configuration: MapConfiguration;
  onConfigurationChange: (config: MapConfiguration) => void;
  className?: string;
}

const ConfigContainer = styled(Card)`
  padding: 24px;
  margin-bottom: 24px;
`;

const ConfigTitle = styled.h3`
  margin: 0 0 20px 0;
  color: ${({ theme }) => theme.colors.gray[900]};
  font-size: 18px;
  font-weight: 600;
`;

const HelpText = styled.div`
  background: ${({ theme }) => theme.colors.primary[50]};
  border: 1px solid ${({ theme }) => theme.colors.primary[200]};
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 20px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.primary[800]};
  
  strong {
    color: ${({ theme }) => theme.colors.primary[900]};
  }
`;

const ConfigGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
`;

const ConfigSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.gray[700]};
  font-size: 14px;
`;

const Input = styled.input`
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: 6px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary[500]};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary[100]};
  }
`;

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: 6px;
  font-size: 14px;
  background: white;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary[500]};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary[100]};
  }
`;

const MapPreview = styled.div`
  height: 300px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
`;

const ToolsSection = styled.div`
  grid-column: 1 / -1;
`;

const ToolsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
`;

const ToolCheckbox = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
  }
  
  input {
    margin: 0;
  }
`;

const availableTools = [
  { id: 'pen', label: 'Stift' },
  { id: 'line', label: 'Linie' },
  { id: 'polygon', label: 'Polygon' },
  { id: 'circle', label: 'Kreis' },
  { id: 'text', label: 'Text' },
  { id: 'heatmap', label: 'Heatmap' }
];

export const MapConfigurationEditor: React.FC<MapConfigurationEditorProps> = ({
  configuration,
  onConfigurationChange,
  className
}) => {
  const [config, setConfig] = useState<MapConfiguration>({
    center: [51.1657, 10.4515], // Germany center
    initialZoom: 6,
    minZoom: 3,
    maxZoom: 18,
    mapStyle: MapStyle.STANDARD,
    enabledTools: ['pen', 'line', 'polygon'],
    ...configuration
  });

  // Debounced save to prevent constant "saved" notifications
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.log('MapConfigurationEditor: Calling onConfigurationChange with:', config);
      onConfigurationChange(config);
    }, 1000); // Wait 1 second after last change

    return () => clearTimeout(timeoutId);
  }, [config, onConfigurationChange]);

  const handleInputChange = (field: keyof MapConfiguration, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCenterChange = (index: number, value: string) => {
    const newCenter = [...(config.center || [51.1657, 10.4515])];
    newCenter[index] = parseFloat(value) || 0;
    handleInputChange('center', newCenter as [number, number]);
  };

  const handleToolToggle = (toolId: string) => {
    const currentTools = config.enabledTools || [];
    const newTools = currentTools.includes(toolId)
      ? currentTools.filter(t => t !== toolId)
      : [...currentTools, toolId];
    
    handleInputChange('enabledTools', newTools);
  };

  return (
    <ConfigContainer className={className}>
      <ConfigTitle>Karten-Konfiguration</ConfigTitle>
      
      <HelpText>
        <strong>💡 Tipp:</strong> Verwenden Sie die interaktive Kartenvorschau unten, um die Einstellungen zu konfigurieren. 
        Verschieben und zoomen Sie die Karte - die Werte werden automatisch übernommen!
      </HelpText>
      
      <ConfigGrid>
        <ConfigSection>
          <FormGroup>
            <Label>Kartenstil</Label>
            <Select
              value={config.mapStyle || MapStyle.STANDARD}
              onChange={(e) => handleInputChange('mapStyle', e.target.value as MapStyle)}
            >
              <option value={MapStyle.STANDARD}>Standard</option>
              <option value={MapStyle.SATELLITE}>Satellit</option>
              <option value={MapStyle.TERRAIN}>Gelände</option>
              <option value={MapStyle.DARK}>Dunkel</option>
              <option value={MapStyle.LIGHT}>Hell</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Zentrum (Breitengrad) - wird durch Karteninteraktion aktualisiert</Label>
            <Input
              type="number"
              step="0.0001"
              value={config.center?.[0]?.toFixed(4) || 51.1657}
              onChange={(e) => handleCenterChange(0, e.target.value)}
              title="Tipp: Verschieben Sie die Karte unten, um das Zentrum zu ändern"
            />
          </FormGroup>

          <FormGroup>
            <Label>Zentrum (Längengrad) - wird durch Karteninteraktion aktualisiert</Label>
            <Input
              type="number"
              step="0.0001"
              value={config.center?.[1]?.toFixed(4) || 10.4515}
              onChange={(e) => handleCenterChange(1, e.target.value)}
              title="Tipp: Verschieben Sie die Karte unten, um das Zentrum zu ändern"
            />
          </FormGroup>
        </ConfigSection>

        <ConfigSection>
          <FormGroup>
            <Label>Anfangs-Zoom - wird durch Karteninteraktion aktualisiert</Label>
            <Input
              type="number"
              min="1"
              max="20"
              value={config.initialZoom || 6}
              onChange={(e) => handleInputChange('initialZoom', parseInt(e.target.value))}
              title="Tipp: Zoomen Sie in der Karte unten, um den Zoom-Level zu ändern"
            />
          </FormGroup>

          <FormGroup>
            <Label>Minimum Zoom</Label>
            <Input
              type="number"
              min="1"
              max="20"
              value={config.minZoom || 3}
              onChange={(e) => handleInputChange('minZoom', parseInt(e.target.value))}
            />
          </FormGroup>

          <FormGroup>
            <Label>Maximum Zoom</Label>
            <Input
              type="number"
              min="1"
              max="20"
              value={config.maxZoom || 18}
              onChange={(e) => handleInputChange('maxZoom', parseInt(e.target.value))}
            />
          </FormGroup>
        </ConfigSection>

        <ToolsSection>
          <Label>Verfügbare Zeichenwerkzeuge</Label>
          <ToolsGrid>
            {availableTools.map(tool => (
              <ToolCheckbox key={tool.id}>
                <input
                  type="checkbox"
                  checked={config.enabledTools?.includes(tool.id) || false}
                  onChange={() => handleToolToggle(tool.id)}
                />
                {tool.label}
              </ToolCheckbox>
            ))}
          </ToolsGrid>
        </ToolsSection>
      </ConfigGrid>

      <Label>Kartenvorschau (interaktiv - Änderungen werden automatisch übernommen)</Label>
      <MapPreview>
        <InteractiveMap
          center={config.center}
          initialZoom={config.initialZoom}
          minZoom={config.minZoom}
          maxZoom={config.maxZoom}
          mapStyle={config.mapStyle}
          onMapReady={() => {
            // Map is ready, we can listen to events
            console.log('Map ready for configuration');
          }}
          onBoundsChange={(bounds) => {
            // Update center based on map bounds
            const center = bounds.getCenter();
            setConfig(prev => ({
              ...prev,
              center: [center.lat, center.lng]
            }));
          }}
          onZoomChange={(zoom) => {
            // Update zoom based on map interaction
            setConfig(prev => ({
              ...prev,
              initialZoom: zoom
            }));
          }}
        />
      </MapPreview>
    </ConfigContainer>
  );
};

export default MapConfigurationEditor;