import React from 'react';
import styled from 'styled-components';
import { MapStyle } from '../../types/map';

interface MapStyleSelectorProps {
  currentStyle: MapStyle;
  onStyleChange: (style: MapStyle) => void;
  className?: string;
}

const SelectorContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  background: ${({ theme }) => theme.colors.gray[50]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.sm};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const SelectorLabel = styled.label`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[700]};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const StyleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: ${({ theme }) => theme.spacing.xs};
`;

const StyleOption = styled.button<{ isSelected: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.sm};
  border: 2px solid ${({ theme, isSelected }) => 
    isSelected ? theme.colors.primary[500] : theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.borderRadius.base};
  background: ${({ theme, isSelected }) => 
    isSelected ? theme.colors.primary[50] : theme.colors.gray[50]};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.primary[400]};
    background: ${({ theme }) => theme.colors.primary[50]};
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary[100]};
  }
`;

const StylePreview = styled.div<{ styleType: MapStyle }>`
  width: 40px;
  height: 30px;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background: ${({ styleType }) => {
    switch (styleType) {
      case MapStyle.STANDARD:
        return 'linear-gradient(135deg, #e8f4f8 0%, #d1e7dd 50%, #c3e6cb 100%)';
      case MapStyle.SATELLITE:
        return 'linear-gradient(135deg, #2d5016 0%, #4a7c59 50%, #6b8e23 100%)';
      case MapStyle.TERRAIN:
        return 'linear-gradient(135deg, #8b4513 0%, #daa520 50%, #228b22 100%)';
      case MapStyle.DARK:
        return 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #404040 100%)';
      case MapStyle.LIGHT:
        return 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 50%, #dee2e6 100%)';
      default:
        return '#e9ecef';
    }
  }};
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
`;

const StyleName = styled.span<{ isSelected: boolean }>`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme, isSelected }) => 
    isSelected ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.normal};
  color: ${({ theme, isSelected }) => 
    isSelected ? theme.colors.primary[700] : theme.colors.gray[600]};
  text-align: center;
`;

const mapStyleLabels: Record<MapStyle, string> = {
  [MapStyle.STANDARD]: 'Standard',
  [MapStyle.SATELLITE]: 'Satellit',
  [MapStyle.TERRAIN]: 'Gelände',
  [MapStyle.DARK]: 'Dunkel',
  [MapStyle.LIGHT]: 'Hell',
};

export const MapStyleSelector: React.FC<MapStyleSelectorProps> = ({
  currentStyle,
  onStyleChange,
  className,
}) => {
  const handleStyleSelect = (style: MapStyle) => {
    onStyleChange(style);
  };

  return (
    <SelectorContainer className={className}>
      <SelectorLabel>Kartenstil</SelectorLabel>
      <StyleGrid>
        {Object.values(MapStyle).map((style) => (
          <StyleOption
            key={style}
            isSelected={currentStyle === style}
            onClick={() => handleStyleSelect(style)}
            type="button"
            aria-label={`Kartenstil ${mapStyleLabels[style]} auswählen`}
          >
            <StylePreview styleType={style} />
            <StyleName isSelected={currentStyle === style}>
              {mapStyleLabels[style]}
            </StyleName>
          </StyleOption>
        ))}
      </StyleGrid>
    </SelectorContainer>
  );
};

export default MapStyleSelector;