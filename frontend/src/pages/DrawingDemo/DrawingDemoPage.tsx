import React, { useState } from 'react';
import styled from 'styled-components';
import { InteractiveMapWithDrawing } from '../../components/Map/InteractiveMapWithDrawing';
import { DrawingPanel } from '../../components/Drawing/DrawingPanel';
import { useDrawing } from '../../hooks/useDrawing';
import { DrawingElement } from '../../types/drawing';

const PageContainer = styled.div`
  display: flex;
  height: 100vh;
  background: ${({ theme }) => theme.colors.gray[50]};
`;

const Sidebar = styled.div`
  width: 360px;
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.gray[50]};
  border-right: 1px solid ${({ theme }) => theme.colors.gray[200]};
  overflow-y: auto;
`;

const MapContainer = styled.div`
  flex: 1;
  position: relative;
`;

const PanelContainer = styled.div`
  position: absolute;
  top: ${({ theme }) => theme.spacing.md};
  left: ${({ theme }) => theme.spacing.md};
  z-index: 1001;
`;

export const DrawingDemoPage: React.FC = () => {
  const {
    drawingState,
    setActiveTool,
    updateToolSettings,
    removeElementById,
    undo,
    redo,
    clearAll
  } = useDrawing();

  const [elements, setElements] = useState<DrawingElement[]>([]);

  const handleDrawingChange = (newElements: DrawingElement[]) => {
    setElements(newElements);
  };

  const handleElementRemove = (elementId: string) => {
    removeElementById(elementId);
  };

  const handleElementSelect = (element: DrawingElement) => {
    console.log('Element selected:', element);
    // In a real implementation, this could highlight the element on the map
  };

  return (
    <PageContainer>
      <Sidebar>
        <DrawingPanel
          activeTool={drawingState.activeTool}
          toolSettings={drawingState.toolSettings}
          canUndo={drawingState.canUndo}
          canRedo={drawingState.canRedo}
          elements={elements}
          onToolChange={setActiveTool}
          onSettingsChange={updateToolSettings}
          onUndo={undo}
          onRedo={redo}
          onClearAll={clearAll}
          onElementRemove={handleElementRemove}
          onElementSelect={handleElementSelect}
        />
      </Sidebar>

      <MapContainer>
        <PanelContainer>
          <DrawingPanel
            activeTool={drawingState.activeTool}
            toolSettings={drawingState.toolSettings}
            canUndo={drawingState.canUndo}
            canRedo={drawingState.canRedo}
            elements={elements}
            onToolChange={setActiveTool}
            onSettingsChange={updateToolSettings}
            onUndo={undo}
            onRedo={redo}
            onClearAll={clearAll}
            onElementRemove={handleElementRemove}
            onElementSelect={handleElementSelect}
          />
        </PanelContainer>
        
        <InteractiveMapWithDrawing
          center={[51.505, -0.09]}
          initialZoom={10}
          enableDrawing={true}
          initialTool={drawingState.activeTool}
          onDrawingChange={handleDrawingChange}
        />
      </MapContainer>
    </PageContainer>
  );
};

export default DrawingDemoPage;