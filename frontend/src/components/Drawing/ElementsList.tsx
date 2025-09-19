import React from 'react';
import styled from 'styled-components';
import { DrawingElement } from '../../types/drawing';
import { Button } from '../UI/Button';
import { Card } from '../UI/Card';

interface ElementsListProps {
  elements: DrawingElement[];
  onElementRemove: (elementId: string) => void;
  onElementSelect?: (element: DrawingElement) => void;
  className?: string;
}

const ListContainer = styled(Card)`
  padding: ${({ theme }) => theme.spacing.sm};
  max-height: 300px;
  overflow-y: auto;
`;

const ListHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  padding-bottom: ${({ theme }) => theme.spacing.xs};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const ListTitle = styled.h4`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const ElementCount = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
  background: ${({ theme }) => theme.colors.gray[100]};
  padding: 2px ${({ theme }) => theme.spacing.xs};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
`;

const ElementItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xs};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
  }
`;

const ElementInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
`;

const ElementType = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const ElementMeta = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const ElementActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const formatElementType = (type: string): string => {
  return type.charAt(0).toUpperCase() + type.slice(1);
};

const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'Unknown';
  }
};

export const ElementsList: React.FC<ElementsListProps> = ({
  elements,
  onElementRemove,
  onElementSelect,
  className
}) => {
  const handleElementClick = (element: DrawingElement) => {
    onElementSelect?.(element);
  };

  const handleRemoveClick = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation(); // Prevent element selection when clicking remove
    onElementRemove(elementId);
  };

  return (
    <ListContainer className={className}>
      <ListHeader>
        <ListTitle>Elements</ListTitle>
        <ElementCount>{elements.length}</ElementCount>
      </ListHeader>
      
      {elements.length === 0 ? (
        <EmptyState>
          No elements drawn yet.<br />
          Select a tool and start drawing on the map.
        </EmptyState>
      ) : (
        elements.map((element) => (
          <ElementItem
            key={element.id}
            onClick={() => handleElementClick(element)}
          >
            <ElementInfo>
              <ElementType>
                {formatElementType(element.type)}
              </ElementType>
              <ElementMeta>
                Created: {formatTimestamp(element.metadata?.createdAt || '')}
              </ElementMeta>
              {element.geoCoordinates && element.geoCoordinates.length > 0 && (
                <ElementMeta>
                  Coordinates: {element.geoCoordinates.length} point{element.geoCoordinates.length === 1 ? '' : 's'}
                </ElementMeta>
              )}
            </ElementInfo>
            
            <ElementActions>
              <Button
                size="xs"
                variant="error"
                onClick={(e) => handleRemoveClick(e, element.id)}
                title="Delete element"
              >
                ×
              </Button>
            </ElementActions>
          </ElementItem>
        ))
      )}
    </ListContainer>
  );
};

export default ElementsList;