import React from 'react';
import styled from 'styled-components';
import { DrawingTool, ToolSettings as ToolSettingsType, DrawingElement } from '../../types/drawing';
import { DrawingToolbar } from './DrawingToolbar';
import { ToolSettings } from './ToolSettings';
import { ElementsList } from './ElementsList';
import { Button } from '../UI/Button';

interface DrawingPanelProps {
  activeTool: DrawingTool;
  toolSettings: ToolSettingsType;
  canUndo: boolean;
  canRedo: boolean;
  elements: DrawingElement[];
  onToolChange: (tool: DrawingTool) => void;
  onSettingsChange: (settings: Partial<ToolSettingsType>) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClearAll: () => void;
  onElementRemove: (elementId: string) => void;
  onElementSelect?: (element: DrawingElement) => void;
  className?: string;
}

const PanelContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  min-width: 280px;
  max-width: 320px;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const ActionsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ActionRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const InfoText = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const Divider = styled.hr`
  margin: 0;
  border: none;
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

export const DrawingPanel: React.FC<DrawingPanelProps> = ({
  activeTool,
  toolSettings,
  canUndo,
  canRedo,
  elements,
  onToolChange,
  onSettingsChange,
  onUndo,
  onRedo,
  onClearAll,
  onElementRemove,
  onElementSelect,
  className
}) => {
  return (
    <PanelContainer className={className}>
      {/* Tools Section */}
      <div>
        <SectionTitle>Drawing Tools</SectionTitle>
        <DrawingToolbar
          activeTool={activeTool}
          onToolChange={onToolChange}
        />
      </div>

      <Divider />

      {/* Settings Section */}
      <ToolSettings
        activeTool={activeTool}
        settings={toolSettings}
        onSettingsChange={onSettingsChange}
      />

      <Divider />

      {/* Actions Section */}
      <div>
        <SectionTitle>Actions</SectionTitle>
        <ActionsSection>
          <ActionRow>
            <Button
              onClick={onUndo}
              disabled={!canUndo}
              variant="secondary"
              size="sm"
              fullWidth
            >
              Undo
            </Button>
            <Button
              onClick={onRedo}
              disabled={!canRedo}
              variant="secondary"
              size="sm"
              fullWidth
            >
              Redo
            </Button>
          </ActionRow>
          
          <Button
            onClick={onClearAll}
            disabled={elements.length === 0}
            variant="error"
            size="sm"
            fullWidth
          >
            Clear All ({elements.length})
          </Button>
        </ActionsSection>
      </div>

      <Divider />

      {/* Elements List */}
      <ElementsList
        elements={elements}
        onElementRemove={onElementRemove}
        onElementSelect={onElementSelect}
      />

      {/* Info Section */}
      <div>
        <InfoText>
          Active tool: {activeTool.charAt(0).toUpperCase() + activeTool.slice(1)}
        </InfoText>
        {activeTool === 'select' && (
          <InfoText>
            Use Delete/Backspace key to remove selected elements
          </InfoText>
        )}
      </div>
    </PanelContainer>
  );
};

export default DrawingPanel;