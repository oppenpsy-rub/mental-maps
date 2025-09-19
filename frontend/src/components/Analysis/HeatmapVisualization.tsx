import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import styled from 'styled-components';
import { HeatmapData, HeatmapOptions, AggregationMethod } from '../../types/analysis';

// Extend Leaflet types for heatLayer
declare module 'leaflet' {
  function heatLayer(latlngs: any[], options?: any): any;
}

const HeatmapContainer = styled.div`
  width: 100%;
  height: 500px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const ControlsContainer = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
  background: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  min-width: 250px;
`;

const ControlGroup = styled.div`
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #374151;
`;

const RangeInput = styled.input`
  width: 100%;
  margin-bottom: 8px;
`;

const Select = styled.select`
  width: 100%;
  padding: 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
`;

const ValueDisplay = styled.span`
  font-size: 12px;
  color: #6b7280;
`;

const StatsContainer = styled.div`
  position: absolute;
  bottom: 10px;
  left: 10px;
  z-index: 1000;
  background: white;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  font-size: 12px;
`;

const StatItem = styled.div`
  margin-bottom: 4px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

interface HeatmapVisualizationProps {
  data: HeatmapData;
  options: HeatmapOptions;
  onOptionsChange: (options: HeatmapOptions) => void;
  bounds?: L.LatLngBounds;
  showControls?: boolean;
  showStats?: boolean;
}

// Component to handle heatmap layer
const HeatmapLayer: React.FC<{
  data: HeatmapData;
  options: HeatmapOptions;
}> = ({ data, options }) => {
  const map = useMap();
  const heatLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!data.points || data.points.length === 0) return;

    // Remove existing heat layer
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
    }

    // Convert points to leaflet heat format
    const heatPoints = data.points
      .filter(point => point.lat !== undefined && point.lng !== undefined)
      .map(point => [point.lat!, point.lng!, point.intensity]);

    // Create heat layer
    heatLayerRef.current = (L as any).heatLayer(heatPoints, {
      radius: options.radius || data.radius || 20,
      blur: options.blur || data.blur || 15,
      maxZoom: 18,
      max: data.maxIntensity || 1,
      gradient: options.gradient || data.gradient || {
        0.0: 'rgba(0, 0, 255, 0)',
        0.2: 'rgba(0, 0, 255, 0.5)',
        0.4: 'rgba(0, 255, 255, 0.7)',
        0.6: 'rgba(0, 255, 0, 0.8)',
        0.8: 'rgba(255, 255, 0, 0.9)',
        1.0: 'rgba(255, 0, 0, 1.0)'
      }
    });

    // Add to map
    heatLayerRef.current.addTo(map);

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [map, data, options]);

  return null;
};

const HeatmapVisualization: React.FC<HeatmapVisualizationProps> = ({
  data,
  options,
  onOptionsChange,
  bounds,
  showControls = true,
  showStats = true
}) => {
  const [localOptions, setLocalOptions] = useState<HeatmapOptions>(options);

  const handleOptionChange = (key: keyof HeatmapOptions, value: any) => {
    const newOptions = { ...localOptions, [key]: value };
    setLocalOptions(newOptions);
    onOptionsChange(newOptions);
  };

  const defaultCenter: [number, number] = bounds 
    ? [bounds.getCenter().lat, bounds.getCenter().lng]
    : [52.52, 13.405]; // Berlin default

  const defaultZoom = bounds ? 12 : 10;

  // Calculate statistics
  const stats = {
    totalPoints: data.points.length,
    maxIntensity: data.maxIntensity,
    averageIntensity: data.points.length > 0 
      ? data.points.reduce((sum, p) => sum + p.intensity, 0) / data.points.length 
      : 0
  };

  return (
    <div style={{ position: 'relative' }}>
      <HeatmapContainer>
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
          <HeatmapLayer data={data} options={localOptions} />
        </MapContainer>
      </HeatmapContainer>

      {showControls && (
        <ControlsContainer>
          <ControlGroup>
            <Label>Radius: <ValueDisplay>{localOptions.radius || 20}px</ValueDisplay></Label>
            <RangeInput
              type="range"
              min="5"
              max="100"
              value={localOptions.radius || 20}
              onChange={(e) => handleOptionChange('radius', parseInt(e.target.value))}
            />
          </ControlGroup>

          <ControlGroup>
            <Label>Blur: <ValueDisplay>{localOptions.blur || 15}px</ValueDisplay></Label>
            <RangeInput
              type="range"
              min="0"
              max="50"
              value={localOptions.blur || 15}
              onChange={(e) => handleOptionChange('blur', parseInt(e.target.value))}
            />
          </ControlGroup>

          <ControlGroup>
            <Label>Aggregation Method</Label>
            <Select
              value={localOptions.aggregationMethod || AggregationMethod.NONE}
              onChange={(e) => handleOptionChange('aggregationMethod', e.target.value as AggregationMethod)}
            >
              <option value={AggregationMethod.NONE}>None</option>
              <option value={AggregationMethod.DENSITY}>Density</option>
              <option value={AggregationMethod.AVERAGE}>Average</option>
              <option value={AggregationMethod.SUM}>Sum</option>
              <option value={AggregationMethod.MAX}>Maximum</option>
            </Select>
          </ControlGroup>

          {(localOptions.aggregationMethod && localOptions.aggregationMethod !== AggregationMethod.NONE) && (
            <ControlGroup>
              <Label>Grid Size: <ValueDisplay>{localOptions.gridSize || 10}px</ValueDisplay></Label>
              <RangeInput
                type="range"
                min="5"
                max="50"
                value={localOptions.gridSize || 10}
                onChange={(e) => handleOptionChange('gridSize', parseInt(e.target.value))}
              />
            </ControlGroup>
          )}
        </ControlsContainer>
      )}

      {showStats && (
        <StatsContainer>
          <StatItem><strong>Total Points:</strong> {stats.totalPoints}</StatItem>
          <StatItem><strong>Max Intensity:</strong> {stats.maxIntensity.toFixed(2)}</StatItem>
          <StatItem><strong>Avg Intensity:</strong> {stats.averageIntensity.toFixed(2)}</StatItem>
        </StatsContainer>
      )}
    </div>
  );
};

export default HeatmapVisualization;