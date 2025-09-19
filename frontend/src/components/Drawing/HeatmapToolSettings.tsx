import React from 'react';
import styled from 'styled-components';
import { ToolSettings, HeatmapGradient } from '../../types/drawing';
import { Button } from '../UI/Button';

interface HeatmapToolSettingsProps {
  settings: ToolSettings;
  onSettingsChange: (settings: Partial<ToolSettings>) => void;
  className?: string;
}

const SettingsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
`;

const SettingGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SettingLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
`;

/*
const _SettingInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 14px;
  background: #ffffff;
  color: #374151;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
`;
*/

const SettingRange = styled.input`
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: #e5e7eb;
  outline: none;
  -webkit-appearance: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
  }

  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: none;
  }
`;

const GradientPreview = styled.div<{ gradient: HeatmapGradient }>`
  height: 20px;
  border-radius: 4px;
  background: linear-gradient(
    to right,
    ${props => Object.entries(props.gradient)
      .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
      .map(([stop, color]) => `${color} ${parseFloat(stop) * 100}%`)
      .join(', ')
    }
  );
  border: 1px solid #e5e7eb;
`;

const GradientButtons = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const GradientButton = styled(Button)<{ $isActive: boolean }>`
  padding: 4px 8px;
  font-size: 12px;
  background: ${props => props.$isActive ? '#3b82f6' : 'transparent'};
  color: ${props => props.$isActive ? 'white' : '#374151'};
  border: 1px solid ${props => props.$isActive ? '#3b82f6' : '#e5e7eb'};
`;

const ValueDisplay = styled.span`
  font-size: 12px;
  color: #6b7280;
  margin-left: 8px;
`;

// Predefined gradient presets
const GRADIENT_PRESETS: { [key: string]: HeatmapGradient } = {
  'Blue-Red': {
    0.0: 'rgba(0, 0, 255, 0)',
    0.2: 'rgba(0, 0, 255, 0.5)',
    0.4: 'rgba(0, 255, 255, 0.7)',
    0.6: 'rgba(0, 255, 0, 0.8)',
    0.8: 'rgba(255, 255, 0, 0.9)',
    1.0: 'rgba(255, 0, 0, 1.0)'
  },
  'Thermal': {
    0.0: 'rgba(0, 0, 0, 0)',
    0.25: 'rgba(128, 0, 128, 0.6)',
    0.5: 'rgba(255, 0, 0, 0.8)',
    0.75: 'rgba(255, 255, 0, 0.9)',
    1.0: 'rgba(255, 255, 255, 1.0)'
  },
  'Ocean': {
    0.0: 'rgba(0, 0, 139, 0)',
    0.33: 'rgba(0, 0, 255, 0.6)',
    0.66: 'rgba(0, 191, 255, 0.8)',
    1.0: 'rgba(135, 206, 250, 1.0)'
  },
  'Grayscale': {
    0.0: 'rgba(0, 0, 0, 0)',
    0.5: 'rgba(128, 128, 128, 0.7)',
    1.0: 'rgba(255, 255, 255, 1.0)'
  }
};

export const HeatmapToolSettings: React.FC<HeatmapToolSettingsProps> = ({
  settings,
  onSettingsChange,
  className
}) => {
  const currentGradient = settings.heatmapGradient || GRADIENT_PRESETS['Blue-Red'];
  const currentRadius = settings.heatmapRadius || 20;
  const currentIntensity = settings.heatmapIntensity || 1;
  const currentBlur = settings.heatmapBlur || 0;

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({
      heatmapRadius: parseInt(e.target.value, 10)
    });
  };

  const handleIntensityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({
      heatmapIntensity: parseFloat(e.target.value)
    });
  };

  const handleBlurChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({
      heatmapBlur: parseFloat(e.target.value)
    });
  };

  const handleGradientChange = (gradientName: string) => {
    onSettingsChange({
      heatmapGradient: GRADIENT_PRESETS[gradientName]
    });
  };

  const getCurrentGradientName = (): string => {
    for (const [name, gradient] of Object.entries(GRADIENT_PRESETS)) {
      if (JSON.stringify(gradient) === JSON.stringify(currentGradient)) {
        return name;
      }
    }
    return 'Custom';
  };

  return (
    <SettingsContainer className={className}>
      <SettingGroup>
        <SettingLabel>
          Radius
          <ValueDisplay>{currentRadius}px</ValueDisplay>
        </SettingLabel>
        <SettingRange
          type="range"
          min="5"
          max="100"
          value={currentRadius}
          onChange={handleRadiusChange}
        />
      </SettingGroup>

      <SettingGroup>
        <SettingLabel>
          Intensity
          <ValueDisplay>{currentIntensity.toFixed(1)}</ValueDisplay>
        </SettingLabel>
        <SettingRange
          type="range"
          min="0.1"
          max="5"
          step="0.1"
          value={currentIntensity}
          onChange={handleIntensityChange}
        />
      </SettingGroup>

      <SettingGroup>
        <SettingLabel>
          Blur
          <ValueDisplay>{currentBlur}px</ValueDisplay>
        </SettingLabel>
        <SettingRange
          type="range"
          min="0"
          max="20"
          step="0.5"
          value={currentBlur}
          onChange={handleBlurChange}
        />
      </SettingGroup>

      <SettingGroup>
        <SettingLabel>Color Gradient</SettingLabel>
        <GradientPreview gradient={currentGradient} />
        <GradientButtons>
          {Object.keys(GRADIENT_PRESETS).map(gradientName => (
            <GradientButton
              key={gradientName}
              $isActive={getCurrentGradientName() === gradientName}
              onClick={() => handleGradientChange(gradientName)}
            >
              {gradientName}
            </GradientButton>
          ))}
        </GradientButtons>
      </SettingGroup>
    </SettingsContainer>
  );
};

export default HeatmapToolSettings;