import React from 'react';
import styled from 'styled-components';
import { DrawingTool } from '../../types/drawing';

interface DrawingToolbarProps {
  activeTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  className?: string;
}

const ToolbarContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.gray[50]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const ToolButton = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid ${({ theme, $active }) => 
    $active ? theme.colors.primary[500] : theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background: ${({ theme, $active }) => 
    $active ? theme.colors.primary[50] : theme.colors.white};
  color: ${({ theme, $active }) => 
    $active ? theme.colors.primary[700] : theme.colors.gray[600]};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ theme, $active }) => 
      $active ? theme.colors.primary[100] : theme.colors.gray[50]};
    border-color: ${({ theme, $active }) => 
      $active ? theme.colors.primary[600] : theme.colors.gray[400]};
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary[200]};
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const ToolGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  
  &:not(:last-child) {
    border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
    padding-bottom: ${({ theme }) => theme.spacing.xs};
    margin-bottom: ${({ theme }) => theme.spacing.xs};
  }
`;

// SVG Icons for tools
const PenIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 19l7-7 3 3-7 7-3-3z"/>
    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
    <path d="M2 2l7.586 7.586"/>
  </svg>
);

const LineIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const CircleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
  </svg>
);

const PolygonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5"/>
  </svg>
);

const TextIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="4,7 4,4 20,4 20,7"/>
    <line x1="9" y1="20" x2="15" y2="20"/>
    <line x1="12" y1="4" x2="12" y2="20"/>
  </svg>
);

const SelectIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
  </svg>
);

const HeatmapIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <circle cx="12" cy="12" r="6" opacity="0.5"/>
    <circle cx="12" cy="12" r="9" opacity="0.3"/>
  </svg>
);

const toolConfig = [
  {
    group: 'Selection',
    tools: [
      { tool: DrawingTool.SELECT, icon: SelectIcon, label: 'Select' }
    ]
  },
  {
    group: 'Drawing',
    tools: [
      { tool: DrawingTool.PEN, icon: PenIcon, label: 'Pen' },
      { tool: DrawingTool.LINE, icon: LineIcon, label: 'Line' },
      { tool: DrawingTool.CIRCLE, icon: CircleIcon, label: 'Circle' },
      { tool: DrawingTool.POLYGON, icon: PolygonIcon, label: 'Polygon' }
    ]
  },
  {
    group: 'Annotation',
    tools: [
      { tool: DrawingTool.TEXT, icon: TextIcon, label: 'Text' },
      { tool: DrawingTool.HEATMAP, icon: HeatmapIcon, label: 'Heatmap' }
    ]
  }
];

export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  activeTool,
  onToolChange,
  className
}) => {
  return (
    <ToolbarContainer className={className}>
      {toolConfig.map((group, groupIndex) => (
        <ToolGroup key={groupIndex}>
          {group.tools.map(({ tool, icon: Icon, label }) => (
            <ToolButton
              key={tool}
              $active={activeTool === tool}
              onClick={() => onToolChange(tool)}
              title={label}
              aria-label={label}
            >
              <Icon />
            </ToolButton>
          ))}
        </ToolGroup>
      ))}
    </ToolbarContainer>
  );
};

export default DrawingToolbar;