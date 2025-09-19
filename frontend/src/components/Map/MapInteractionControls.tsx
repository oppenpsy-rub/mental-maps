import React from 'react';
import styled from 'styled-components';

interface MapInteractionSettings {
  enableTouchZoom: boolean;
  enableTouchPan: boolean;
  enableScrollWheelZoom: boolean;
  enableDoubleClickZoom: boolean;
  enableKeyboardNavigation: boolean;
}

interface MapInteractionControlsProps {
  enableTouchZoom: boolean;
  enableTouchPan: boolean;
  enableScrollWheelZoom: boolean;
  enableDoubleClickZoom: boolean;
  enableKeyboardNavigation: boolean;
  onToggleInteraction: (setting: keyof MapInteractionSettings) => void;
  onResetToDefaults: () => void;
  deviceInfo?: {
    isMobile: boolean;
    isTablet: boolean;
    hasTouch: boolean;
    screenSize: string;
  };
  className?: string;
}

const ControlsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.gray[50]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.md};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const ControlsTitle = styled.h4`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[700]};
`;

const ControlGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const ControlItem = styled.label`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  cursor: pointer;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  
  &:hover {
    color: ${({ theme }) => theme.colors.gray[800]};
  }
`;

const Checkbox = styled.input.attrs({ type: 'checkbox' })`
  width: 16px;
  height: 16px;
  accent-color: ${({ theme }) => theme.colors.primary[500]};
`;

const DeviceInfo = styled.div`
  padding: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.primary[50]};
  border-radius: ${({ theme }) => theme.borderRadius.base};
  border: 1px solid ${({ theme }) => theme.colors.primary[200]};
`;

const DeviceInfoTitle = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary[700]};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const DeviceInfoItem = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.primary[600]};
  display: flex;
  justify-content: space-between;
`;

const ResetButton = styled.button`
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  background: ${({ theme }) => theme.colors.gray[500]};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.base};
  cursor: pointer;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  margin-top: ${({ theme }) => theme.spacing.sm};
  
  &:hover {
    background: ${({ theme }) => theme.colors.gray[600]};
  }
`;

const interactionLabels: Record<keyof MapInteractionSettings, string> = {
  enableTouchZoom: 'Touch-Zoom',
  enableTouchPan: 'Touch-Navigation',
  enableScrollWheelZoom: 'Mausrad-Zoom',
  enableDoubleClickZoom: 'Doppelklick-Zoom',
  enableKeyboardNavigation: 'Tastatur-Navigation',
};

export const MapInteractionControls: React.FC<MapInteractionControlsProps> = ({
  enableTouchZoom,
  enableTouchPan,
  enableScrollWheelZoom,
  enableDoubleClickZoom,
  enableKeyboardNavigation,
  onToggleInteraction,
  onResetToDefaults,
  deviceInfo,
  className,
}) => {
  const interactions = {
    enableTouchZoom,
    enableTouchPan,
    enableScrollWheelZoom,
    enableDoubleClickZoom,
    enableKeyboardNavigation,
  };

  return (
    <ControlsContainer className={className}>
      <ControlsTitle>Karteninteraktion</ControlsTitle>
      
      <ControlGroup>
        {(Object.entries(interactions) as Array<[keyof MapInteractionSettings, boolean]>).map(([key, value]) => (
          <ControlItem key={key}>
            <Checkbox
              checked={value}
              onChange={() => onToggleInteraction(key)}
            />
            {interactionLabels[key]}
          </ControlItem>
        ))}
      </ControlGroup>

      {deviceInfo && (
        <DeviceInfo>
          <DeviceInfoTitle>Geräteinformationen</DeviceInfoTitle>
          <DeviceInfoItem>
            <span>Mobil:</span>
            <span>{deviceInfo.isMobile ? 'Ja' : 'Nein'}</span>
          </DeviceInfoItem>
          <DeviceInfoItem>
            <span>Tablet:</span>
            <span>{deviceInfo.isTablet ? 'Ja' : 'Nein'}</span>
          </DeviceInfoItem>
          <DeviceInfoItem>
            <span>Touch:</span>
            <span>{deviceInfo.hasTouch ? 'Ja' : 'Nein'}</span>
          </DeviceInfoItem>
          <DeviceInfoItem>
            <span>Bildschirmgröße:</span>
            <span>{deviceInfo.screenSize}</span>
          </DeviceInfoItem>
        </DeviceInfo>
      )}

      <ResetButton onClick={onResetToDefaults}>
        Standardeinstellungen
      </ResetButton>
    </ControlsContainer>
  );
};

export default MapInteractionControls;