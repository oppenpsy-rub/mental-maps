import React from 'react';
import styled from 'styled-components';
import { DrawingTool, ToolSettings as ToolSettingsType } from '../../types/drawing';
import { Card } from '../UI/Card';
import HeatmapToolSettings from './HeatmapToolSettings';

interface ToolSettingsProps {
  activeTool: DrawingTool;
  settings: ToolSettingsType;
  onSettingsChange: (settings: Partial<ToolSettingsType>) => void;
  className?: string;
}

const SettingsContainer = styled(Card)`
  padding: ${({ theme }) => theme.spacing.md};
  width: 280px;
`;

const SettingsGroup = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SettingsTitle = styled.h4`
  margin: 0 0 ${({ theme }) => theme.spacing.sm} 0;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const SettingRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.label`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[700]};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const LabelText = styled.span``;

const LabelValue = styled.span`
  color: ${({ theme }) => theme.colors.gray[500]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.normal};
`;

const ColorInput = styled.input`
  width: 100%;
  height: 36px;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  cursor: pointer;
  background: ${({ theme }) => theme.colors.white};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary[500]};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary[200]};
  }
`;

const RangeInput = styled.input`
  width: 100%;
  height: 20px;
  -webkit-appearance: none;
  appearance: none;
  background: ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  outline: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    background: ${({ theme }) => theme.colors.primary[500]};
    border-radius: 50%;
    cursor: pointer;
    
    &:hover {
      background: ${({ theme }) => theme.colors.primary[600]};
    }
  }
  
  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    background: ${({ theme }) => theme.colors.primary[500]};
    border-radius: 50%;
    cursor: pointer;
    border: none;
    
    &:hover {
      background: ${({ theme }) => theme.colors.primary[600]};
    }
  }
`;

const SelectInput = styled.select`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background: ${({ theme }) => theme.colors.white};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[900]};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary[500]};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary[200]};
  }
`;

const ColorPreview = styled.div<{ color: string }>`
  width: 24px;
  height: 24px;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background: ${props => props.color};
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  display: inline-block;
  margin-left: ${({ theme }) => theme.spacing.xs};
`;

const PreviewContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background: ${({ theme }) => theme.colors.gray[50]};
`;

const PreviewStroke = styled.div.withConfig({
  shouldForwardProp: (prop) => !['color', 'width', 'fillColor', 'fillOpacity'].includes(prop),
})<{ 
  color: string; 
  width: number; 
  fillColor?: string; 
  fillOpacity?: number 
}>`
  width: 60px;
  height: 20px;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  border: ${props => props.width}px solid ${props => props.color};
  background: ${props => 
    props.fillColor 
      ? `${props.fillColor}${Math.round((props.fillOpacity || 0) * 255).toString(16).padStart(2, '0')}`
      : 'transparent'
  };
`;

const PreviewText = styled.span.withConfig({
  shouldForwardProp: (prop) => !['color', 'fontSize', 'fontFamily'].includes(prop),
})<{ 
  color: string; 
  fontSize: number; 
  fontFamily: string 
}>`
  color: ${props => props.color};
  font-size: ${props => props.fontSize}px;
  font-family: ${props => props.fontFamily};
`;

const fontFamilies = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Courier New',
  'Impact',
  'Comic Sans MS'
];

export const ToolSettings: React.FC<ToolSettingsProps> = ({
  activeTool,
  settings,
  onSettingsChange,
  className
}) => {
  const handleColorChange = (color: string) => {
    onSettingsChange({ strokeColor: color });
  };

  const handleStrokeWidthChange = (width: number) => {
    onSettingsChange({ strokeWidth: width });
  };

  const handleFillColorChange = (color: string) => {
    onSettingsChange({ fillColor: color });
  };

  const handleFillOpacityChange = (opacity: number) => {
    onSettingsChange({ fillOpacity: opacity });
  };

  const handleFontSizeChange = (size: number) => {
    onSettingsChange({ fontSize: size });
  };

  const handleFontFamilyChange = (family: string) => {
    onSettingsChange({ fontFamily: family });
  };

  const showFillSettings = [
    DrawingTool.CIRCLE,
    DrawingTool.POLYGON,
    DrawingTool.HEATMAP
  ].includes(activeTool);

  const showTextSettings = activeTool === DrawingTool.TEXT;
  const showHeatmapSettings = activeTool === DrawingTool.HEATMAP;

  // If heatmap tool is active, show heatmap-specific settings
  if (showHeatmapSettings) {
    return (
      <SettingsContainer className={className}>
        <SettingsTitle>Heatmap Settings</SettingsTitle>
        <HeatmapToolSettings
          settings={settings}
          onSettingsChange={onSettingsChange}
        />
      </SettingsContainer>
    );
  }

  return (
    <SettingsContainer className={className}>
      <SettingsTitle>Tool Settings</SettingsTitle>
      
      {/* Stroke Settings */}
      <SettingsGroup>
        <SettingRow>
          <Label>
            <LabelText>Stroke Color</LabelText>
            <ColorPreview color={settings.strokeColor} />
          </Label>
          <ColorInput
            type="color"
            value={settings.strokeColor}
            onChange={(e) => handleColorChange(e.target.value)}
          />
        </SettingRow>

        <SettingRow>
          <Label>
            <LabelText>Stroke Width</LabelText>
            <LabelValue>{settings.strokeWidth}px</LabelValue>
          </Label>
          <RangeInput
            type="range"
            min="1"
            max="20"
            value={settings.strokeWidth}
            onChange={(e) => handleStrokeWidthChange(Number(e.target.value))}
          />
        </SettingRow>
      </SettingsGroup>

      {/* Fill Settings */}
      {showFillSettings && (
        <SettingsGroup>
          <SettingRow>
            <Label>
              <LabelText>Fill Color</LabelText>
              <ColorPreview color={settings.fillColor || '#ffffff'} />
            </Label>
            <ColorInput
              type="color"
              value={settings.fillColor || '#ffffff'}
              onChange={(e) => handleFillColorChange(e.target.value)}
            />
          </SettingRow>

          <SettingRow>
            <Label>
              <LabelText>Fill Opacity</LabelText>
              <LabelValue>{Math.round((settings.fillOpacity || 0.3) * 100)}%</LabelValue>
            </Label>
            <RangeInput
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.fillOpacity || 0.3}
              onChange={(e) => handleFillOpacityChange(Number(e.target.value))}
            />
          </SettingRow>
        </SettingsGroup>
      )}

      {/* Text Settings */}
      {showTextSettings && (
        <SettingsGroup>
          <SettingRow>
            <Label>
              <LabelText>Font Size</LabelText>
              <LabelValue>{settings.fontSize || 16}px</LabelValue>
            </Label>
            <RangeInput
              type="range"
              min="8"
              max="48"
              value={settings.fontSize || 16}
              onChange={(e) => handleFontSizeChange(Number(e.target.value))}
            />
          </SettingRow>

          <SettingRow>
            <Label>
              <LabelText>Font Family</LabelText>
            </Label>
            <SelectInput
              value={settings.fontFamily || 'Arial'}
              onChange={(e) => handleFontFamilyChange(e.target.value)}
            >
              {fontFamilies.map(font => (
                <option key={font} value={font}>{font}</option>
              ))}
            </SelectInput>
          </SettingRow>
        </SettingsGroup>
      )}

      {/* Preview */}
      <SettingsGroup>
        <SettingsTitle>Preview</SettingsTitle>
        <PreviewContainer>
          {showTextSettings ? (
            <PreviewText
              color={settings.strokeColor}
              fontSize={settings.fontSize || 16}
              fontFamily={settings.fontFamily || 'Arial'}
            >
              Sample Text
            </PreviewText>
          ) : (
            <PreviewStroke
              color={settings.strokeColor}
              width={Math.max(1, Math.min(settings.strokeWidth, 5))} // Limit preview stroke width
              fillColor={showFillSettings ? settings.fillColor : undefined}
              fillOpacity={showFillSettings ? settings.fillOpacity : undefined}
            />
          )}
        </PreviewContainer>
      </SettingsGroup>
    </SettingsContainer>
  );
};

export default ToolSettings;