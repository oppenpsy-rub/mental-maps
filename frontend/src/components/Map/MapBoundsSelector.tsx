import React, { useState } from 'react';
import styled from 'styled-components';
import { MapBounds } from '../../types/map';

interface MapBoundsSelectorProps {
  currentBounds?: MapBounds;
  onBoundsChange: (bounds: MapBounds) => void;
  className?: string;
}

const SelectorContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.gray[50]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.md};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const SelectorLabel = styled.label`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[700]};
`;

const BoundsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const InputLabel = styled.label`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const Input = styled.input`
  padding: ${({ theme }) => theme.spacing.xs};
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.borderRadius.base};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary[500]};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary[100]};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const Button = styled.button`
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  background: ${({ theme }) => theme.colors.primary[500]};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.base};
  cursor: pointer;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  
  &:hover {
    background: ${({ theme }) => theme.colors.primary[600]};
  }
`;

const SecondaryButton = styled(Button)`
  background: ${({ theme }) => theme.colors.gray[500]};
  
  &:hover {
    background: ${({ theme }) => theme.colors.gray[600]};
  }
`;

// Predefined regions for quick selection
const predefinedRegions: Record<string, MapBounds> = {
  germany: {
    north: 55.0584,
    south: 47.2701,
    east: 15.0419,
    west: 5.8663,
  },
  europe: {
    north: 71.1851,
    south: 34.5428,
    east: 40.2275,
    west: -31.2660,
  },
  world: {
    north: 85,
    south: -85,
    east: 180,
    west: -180,
  },
  northAmerica: {
    north: 83.162102,
    south: 5.499550,
    east: -52.233040,
    west: -167.276413,
  },
};

export const MapBoundsSelector: React.FC<MapBoundsSelectorProps> = ({
  currentBounds,
  onBoundsChange,
  className,
}) => {
  const [bounds, setBounds] = useState<MapBounds>(
    currentBounds || predefinedRegions.germany
  );

  const handleInputChange = (field: keyof MapBounds, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setBounds(prev => ({
        ...prev,
        [field]: numValue,
      }));
    }
  };

  const handleApplyBounds = () => {
    onBoundsChange(bounds);
  };

  const handleSelectRegion = (regionKey: string) => {
    const regionBounds = predefinedRegions[regionKey];
    setBounds(regionBounds);
    onBoundsChange(regionBounds);
  };

  return (
    <SelectorContainer className={className}>
      <SelectorLabel>Kartenausschnitt konfigurieren</SelectorLabel>
      
      <BoundsGrid>
        <InputGroup>
          <InputLabel>Nord (Breitengrad)</InputLabel>
          <Input
            type="number"
            step="0.0001"
            value={bounds.north}
            onChange={(e) => handleInputChange('north', e.target.value)}
            placeholder="z.B. 55.0584"
          />
        </InputGroup>
        
        <InputGroup>
          <InputLabel>Süd (Breitengrad)</InputLabel>
          <Input
            type="number"
            step="0.0001"
            value={bounds.south}
            onChange={(e) => handleInputChange('south', e.target.value)}
            placeholder="z.B. 47.2701"
          />
        </InputGroup>
        
        <InputGroup>
          <InputLabel>Ost (Längengrad)</InputLabel>
          <Input
            type="number"
            step="0.0001"
            value={bounds.east}
            onChange={(e) => handleInputChange('east', e.target.value)}
            placeholder="z.B. 15.0419"
          />
        </InputGroup>
        
        <InputGroup>
          <InputLabel>West (Längengrad)</InputLabel>
          <Input
            type="number"
            step="0.0001"
            value={bounds.west}
            onChange={(e) => handleInputChange('west', e.target.value)}
            placeholder="z.B. 5.8663"
          />
        </InputGroup>
      </BoundsGrid>
      
      <ButtonGroup>
        <Button onClick={handleApplyBounds}>
          Ausschnitt anwenden
        </Button>
        <SecondaryButton onClick={() => handleSelectRegion('germany')}>
          Deutschland
        </SecondaryButton>
        <SecondaryButton onClick={() => handleSelectRegion('europe')}>
          Europa
        </SecondaryButton>
        <SecondaryButton onClick={() => handleSelectRegion('world')}>
          Welt
        </SecondaryButton>
      </ButtonGroup>
    </SelectorContainer>
  );
};

export default MapBoundsSelector;