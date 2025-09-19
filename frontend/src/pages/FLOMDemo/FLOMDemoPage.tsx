import React, { useState } from 'react';
import styled from 'styled-components';
import { ProfessionalMapWithDrawing } from '../../components/Map/ProfessionalMapWithDrawing';
import { DrawingControls } from '../../components/Map/DrawingControls';
import { DrawingTool, ToolSettings } from '../../types/drawing';
import { MapStyle } from '../../types/map';

const PageContainer = styled.div`
  display: flex;
  height: 100vh;
  background: #f8fafc;
`;

const Sidebar = styled.div`
  width: 320px;
  background: white;
  border-right: 1px solid #e5e7eb;
  padding: 20px;
  overflow-y: auto;
`;

const MapContainer = styled.div`
  flex: 1;
  position: relative;
`;

const Header = styled.div`
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: 0;
`;

const FLOMBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 16px;
`;

const InfoBox = styled.div`
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
`;

const InfoTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: #15803d;
  margin: 0 0 8px 0;
`;

const InfoText = styled.p`
  font-size: 12px;
  color: #166534;
  margin: 0;
  line-height: 1.5;
`;

const StatsBox = styled.div`
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  margin-top: 20px;
`;

const StatItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: 12px;
`;

const StatLabel = styled.span`
  color: #6b7280;
`;

const StatValue = styled.span`
  font-weight: 600;
  color: #111827;
`;

export const FLOMDemoPage: React.FC = () => {
  const [activeTool, setActiveTool] = useState<DrawingTool>(DrawingTool.SELECT);
  const [toolSettings, setToolSettings] = useState<ToolSettings>({
    strokeColor: '#22c55e',
    strokeWidth: 3,
    fillColor: '#22c55e',
    fillOpacity: 0.2
  });
  const [elements, setElements] = useState<any[]>([]);

  const handleDrawingChange = (newElements: any[]) => {
    setElements(newElements);
    console.log('FLOM Drawing changed:', newElements);
  };

  return (
    <PageContainer>
      <Sidebar>
        <Header>
          <FLOMBadge>
            🎯 FLOM Technology
          </FLOMBadge>
          <Title>FLOM FreeDraw Demo</Title>
          <Subtitle>
            Identische Technologie wie das Original FLOM-System
          </Subtitle>
        </Header>

        <InfoBox>
          <InfoTitle>🔧 FLOM-Technologie</InfoTitle>
          <InfoText>
            Diese Demo nutzt die exakt gleiche technische Grundlage wie FLOM:
            <br />• Leaflet.FreeDraw Plugin
            <br />• Automatische Polygon-Erstellung
            <br />• Bostongraphy-kompatible Algorithmen
            <br />• Convex Hull Vereinfachung
          </InfoText>
        </InfoBox>

        <DrawingControls
          activeTool={activeTool}
          toolSettings={toolSettings}
          elements={elements}
          onToolChange={setActiveTool}
          onToolSettingsChange={setToolSettings}
          onUndo={() => {
            if (elements.length > 0) {
              const newElements = elements.slice(0, -1);
              setElements(newElements);
            }
          }}
          onClear={() => setElements([])}
          onElementDelete={(id) => {
            setElements(prev => prev.filter(el => el.id !== id));
          }}
          canUndo={elements.length > 0}
        />

        <StatsBox>
          <StatItem>
            <StatLabel>Technologie:</StatLabel>
            <StatValue>Leaflet.FreeDraw</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Algorithmus:</StatLabel>
            <StatValue>Convex Hull</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Polygone:</StatLabel>
            <StatValue>{elements.length}</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>FLOM-kompatibel:</StatLabel>
            <StatValue>✅ 100%</StatValue>
          </StatItem>
        </StatsBox>
      </Sidebar>

      <MapContainer>
        <ProfessionalMapWithDrawing
          center={[52.52, 13.405]}
          initialZoom={10}
          mapStyle={MapStyle.SATELLITE}
          enableDrawing={true}
          initialTool={activeTool}
          onDrawingChange={handleDrawingChange}
          drawingData={elements}
          onToolChange={setActiveTool}
          onToolSettingsChange={setToolSettings}
        />
      </MapContainer>
    </PageContainer>
  );
};

export default FLOMDemoPage;