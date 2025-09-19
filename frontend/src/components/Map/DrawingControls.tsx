import React from 'react';
import styled from 'styled-components';
import { DrawingTool, ToolSettings } from '../../types/drawing';
import { Card } from '../UI/Card';

interface DrawingControlsProps {
  activeTool: DrawingTool;
  toolSettings: ToolSettings;
  elements: any[];
  onToolChange: (tool: DrawingTool) => void;
  onToolSettingsChange: (settings: ToolSettings) => void;
  onUndo: () => void;
  onClear: () => void;
  onElementDelete: (id: string) => void;
  canUndo: boolean;
}

const ControlsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ToolbarSection = styled(Card)`
  padding: 16px;
`;

const SectionTitle = styled.h4`
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
`;

const ToolGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
`;

const ToolButton = styled.button<{ $active?: boolean }>`
  padding: 8px 12px;
  border: 2px solid ${({ $active }) => $active ? '#3b82f6' : '#e5e7eb'};
  background: ${({ $active }) => $active ? '#eff6ff' : 'white'};
  color: ${({ $active }) => $active ? '#1d4ed8' : '#4b5563'};
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  
  &:hover {
    background: ${({ $active }) => $active ? '#dbeafe' : '#f9fafb'};
    border-color: #3b82f6;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
  flex: 1;
  
  &:hover:not(:disabled) {
    background: #f3f4f6;
    border-color: #9ca3af;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SettingGroup = styled.div`
  margin-bottom: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SettingLabel = styled.label`
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #4b5563;
  margin-bottom: 4px;
`;

const ColorInput = styled.input`
  width: 100%;
  height: 32px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
`;

const RangeInput = styled.input`
  width: 100%;
  margin: 4px 0;
`;

const ElementsList = styled.div`
  max-height: 200px;
  overflow-y: auto;
`;

const ElementItem = styled.div<{ $selected?: boolean }>`
  padding: 6px 8px;
  margin: 2px 0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  background: ${({ $selected }) => $selected ? '#eff6ff' : 'transparent'};
  border: 1px solid ${({ $selected }) => $selected ? '#3b82f6' : 'transparent'};
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  &:hover {
    background: #f8fafc;
  }
`;

const DeleteButton = styled.button`
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 10px;
  cursor: pointer;
  
  &:hover {
    background: #dc2626;
  }
`;

export const DrawingControls: React.FC<DrawingControlsProps> = ({
  activeTool,
  toolSettings,
  elements,
  onToolChange,
  onToolSettingsChange,
  onUndo,
  onClear,
  onElementDelete,
  canUndo
}) => {
  return (
    <ControlsContainer>
      {/* Werkzeuge */}
      <ToolbarSection>
        <SectionTitle>Zeichenwerkzeuge</SectionTitle>
        {activeTool === DrawingTool.PEN && (
          <div style={{ 
            fontSize: '11px', 
            color: '#22c55e', 
            marginBottom: '8px',
            padding: '6px 8px',
            backgroundColor: '#f0fdf4',
            borderRadius: '4px',
            border: '1px solid #bbf7d0'
          }}>
            🎯 Smart Draw - Automatische Polygon-Erstellung
          </div>
        )}
        <ToolGrid>
          <ToolButton
            $active={activeTool === DrawingTool.SELECT}
            onClick={() => onToolChange(DrawingTool.SELECT)}
          >
            🖱️ Navigation
          </ToolButton>
          <ToolButton
            $active={activeTool === DrawingTool.PEN}
            onClick={() => onToolChange(DrawingTool.PEN)}
          >
            🎯 Smart Draw
          </ToolButton>
          <ToolButton
            $active={activeTool === DrawingTool.LINE}
            onClick={() => onToolChange(DrawingTool.LINE)}
          >
            📏 Linie
          </ToolButton>
          <ToolButton
            $active={activeTool === DrawingTool.POLYGON}
            onClick={() => onToolChange(DrawingTool.POLYGON)}
          >
            ⬟ Polygon
          </ToolButton>
          <ToolButton
            $active={activeTool === DrawingTool.CIRCLE}
            onClick={() => onToolChange(DrawingTool.CIRCLE)}
          >
            ⭕ Kreis
          </ToolButton>
        </ToolGrid>
        
        <ActionButtons>
          <ActionButton
            onClick={onUndo}
            disabled={!canUndo}
          >
            ↶ Rückgängig
          </ActionButton>
          <ActionButton
            onClick={onClear}
            disabled={!canUndo}
          >
            🗑️ Löschen
          </ActionButton>
        </ActionButtons>
      </ToolbarSection>

      {/* Einstellungen */}
      <ToolbarSection>
        <SectionTitle>Zeicheneinstellungen</SectionTitle>
        
        <SettingGroup>
          <SettingLabel>Strichfarbe</SettingLabel>
          <ColorInput
            type="color"
            value={toolSettings.strokeColor}
            onChange={(e) => onToolSettingsChange({ ...toolSettings, strokeColor: e.target.value })}
          />
        </SettingGroup>

        <SettingGroup>
          <SettingLabel>Strichstärke: {toolSettings.strokeWidth}px</SettingLabel>
          <RangeInput
            type="range"
            min="1"
            max="10"
            value={toolSettings.strokeWidth}
            onChange={(e) => onToolSettingsChange({ ...toolSettings, strokeWidth: parseInt(e.target.value) })}
          />
        </SettingGroup>

        {(activeTool === DrawingTool.POLYGON || activeTool === DrawingTool.CIRCLE) && (
          <>
            <SettingGroup>
              <SettingLabel>Füllfarbe</SettingLabel>
              <ColorInput
                type="color"
                value={toolSettings.fillColor}
                onChange={(e) => onToolSettingsChange({ ...toolSettings, fillColor: e.target.value })}
              />
            </SettingGroup>

            <SettingGroup>
              <SettingLabel>Transparenz: {Math.round((toolSettings.fillOpacity || 0.2) * 100)}%</SettingLabel>
              <RangeInput
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={toolSettings.fillOpacity}
                onChange={(e) => onToolSettingsChange({ ...toolSettings, fillOpacity: parseFloat(e.target.value) })}
              />
            </SettingGroup>
          </>
        )}
      </ToolbarSection>

      {/* Zeichnungen Liste */}
      <ToolbarSection>
        <SectionTitle>Zeichnungen ({elements.length})</SectionTitle>
        <ElementsList>
          {elements.length === 0 ? (
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
              Keine Zeichnungen vorhanden
            </p>
          ) : (
            elements.map((element, index) => (
              <ElementItem key={element.id}>
                <span>
                  {element.type === 'polyline' ? 'Linie' :
                   element.type === 'polygon' ? 'Polygon' :
                   element.type === 'circle' ? 'Kreis' : element.type} {index + 1}
                </span>
                <DeleteButton onClick={() => onElementDelete(element.id)}>
                  ×
                </DeleteButton>
              </ElementItem>
            ))
          )}
        </ElementsList>
      </ToolbarSection>
    </ControlsContainer>
  );
};

export default DrawingControls;