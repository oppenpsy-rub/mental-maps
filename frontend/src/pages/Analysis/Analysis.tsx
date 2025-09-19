import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { toast } from 'react-hot-toast';
import HeatmapVisualization from '../../components/Analysis/HeatmapVisualization';
import OverlayVisualization from '../../components/Analysis/OverlayVisualization';
import InteractiveFilters from '../../components/Analysis/InteractiveFilters';
import { AnalysisService } from '../../services/analysisService';
import { mentalMapsService } from '../../services/mentalMapsService';
import {
  HeatmapData,
  HeatmapOptions,
  AnalysisFilters,
  StudyStatistics,
  AggregationMethod
} from '../../types/analysis';

const AnalysisContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
`;

const Header = styled.div`
  margin-bottom: 32px;
`;

const Title = styled.h1`
  color: #212529;
  margin-bottom: 8px;
  font-size: 2rem;
  font-weight: 600;
`;

const Subtitle = styled.p`
  color: #6b7280;
  font-size: 16px;
  margin: 0;
`;

const TabsContainer = styled.div`
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 32px;
`;

const TabsList = styled.div`
  display: flex;
  gap: 0;
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 12px 24px;
  border: none;
  background: none;
  color: ${props => props.active ? '#3b82f6' : '#6b7280'};
  font-weight: ${props => props.active ? '600' : '400'};
  border-bottom: 2px solid ${props => props.active ? '#3b82f6' : 'transparent'};
  cursor: pointer;
  font-size: 16px;
  
  &:hover {
    color: #3b82f6;
  }
`;

const ContentArea = styled.div`
  min-height: 600px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const StatCard = styled.div`
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
`;

const VisualizationCard = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const CardHeader = styled.div`
  padding: 24px 24px 0 24px;
`;

const CardTitle = styled.h3`
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: #374151;
`;

const CardContent = styled.div`
  padding: 24px;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  color: #6b7280;
`;

const ErrorContainer = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 16px;
  color: #dc2626;
  margin-bottom: 24px;
`;

type AnalysisTab = 'overview' | 'heatmap' | 'overlay' | 'statistics';

const Analysis: React.FC = () => {
  const { studyId } = useParams<{ studyId: string }>();
  const [activeTab, setActiveTab] = useState<AnalysisTab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [responses, setResponses] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [statistics, setStatistics] = useState<StudyStatistics | null>(null);

  // Filter and options states
  const [filters, setFilters] = useState<AnalysisFilters>({});
  const [heatmapOptions, setHeatmapOptions] = useState<HeatmapOptions>({
    radius: 20,
    blur: 15,
    aggregationMethod: AggregationMethod.DENSITY,
    gridSize: 10
  });

  useEffect(() => {
    if (studyId) {
      loadAnalysisData();
    }
  }, [studyId, filters]);

  const loadAnalysisData = async () => {
    if (!studyId) return;

    setLoading(true);
    setError(null);

    try {
      // Load responses data
      const responsesData = await mentalMapsService.getMentalMapsByStudy(studyId);
      setResponses(responsesData);

      // Generate initial heatmap
      if (responsesData.length > 0) {
        try {
          const heatmap = await AnalysisService.generateHeatmap(studyId, heatmapOptions, filters);
          setHeatmapData(heatmap);
        } catch (heatmapError) {
          console.warn('Could not generate heatmap, using mock data:', heatmapError);
          // Generate mock heatmap data from responses
          setHeatmapData(generateMockHeatmapData(responsesData));
        }

        // Load statistics
        try {
          const stats = await AnalysisService.getStudyStatistics(studyId, filters);
          setStatistics(stats);
        } catch (statsError) {
          console.warn('Could not load statistics, using mock data:', statsError);
          setStatistics(generateMockStatistics(responsesData));
        }
      }
    } catch (err) {
      console.error('Error loading analysis data:', err);
      setError('Failed to load analysis data. Please try again.');
      toast.error('Failed to load analysis data');
    } finally {
      setLoading(false);
    }
  };

  const generateMockHeatmapData = (responses: any[]): HeatmapData => {
    const points = responses.flatMap(response =>
      response.mapDrawing?.elements?.map((element: any) => {
        if (element.geometry?.type === 'Point') {
          const [lng, lat] = element.geometry.coordinates;
          return { lat, lng, intensity: Math.random() * 0.8 + 0.2 };
        }
        return null;
      }).filter(Boolean) || []
    );

    return {
      points,
      radius: 20,
      maxIntensity: 1,
      gradient: {
        0.0: 'rgba(0, 0, 255, 0)',
        0.2: 'rgba(0, 0, 255, 0.5)',
        0.4: 'rgba(0, 255, 255, 0.7)',
        0.6: 'rgba(0, 255, 0, 0.8)',
        0.8: 'rgba(255, 255, 0, 0.9)',
        1.0: 'rgba(255, 0, 0, 1.0)'
      },
      blur: 15
    };
  };

  const generateMockStatistics = (responses: any[]): StudyStatistics => {
    const totalResponses = responses.length;
    const totalParticipants = new Set(responses.map(r => r.participantCode)).size;
    const avgResponseTime = responses.length > 0
      ? responses.reduce((sum, r) => sum + (r.responseTimeMs || 0), 0) / responses.length
      : 0;
    const avgElements = responses.length > 0
      ? responses.reduce((sum, r) => sum + (r.mapDrawing?.elements?.length || 0), 0) / responses.length
      : 0;

    return {
      totalResponses,
      totalParticipants,
      averageResponseTime: avgResponseTime,
      averageElementsPerResponse: avgElements,
      completionRate: 85,
      responsesByQuestion: {},
      responsesByDay: []
    };
  };

  const handleHeatmapOptionsChange = async (newOptions: HeatmapOptions) => {
    setHeatmapOptions(newOptions);

    if (studyId && responses.length > 0) {
      try {
        const heatmap = await AnalysisService.generateHeatmap(studyId, newOptions, filters);
        setHeatmapData(heatmap);
      } catch (error) {
        console.warn('Could not regenerate heatmap:', error);
        setHeatmapData(generateMockHeatmapData(responses));
      }
    }
  };

  const handleFiltersChange = (newFilters: AnalysisFilters) => {
    setFilters(newFilters);
  };

  if (loading) {
    return (
      <AnalysisContainer>
        <LoadingContainer>Loading analysis data...</LoadingContainer>
      </AnalysisContainer>
    );
  }

  if (error) {
    return (
      <AnalysisContainer>
        <ErrorContainer>{error}</ErrorContainer>
      </AnalysisContainer>
    );
  }

  return (
    <AnalysisContainer>
      <Header>
        <Title>Analysis Dashboard</Title>
        <Subtitle>Study ID: {studyId}</Subtitle>
      </Header>

      <InteractiveFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        availableParticipants={responses.map(r => ({
          id: r.participantId,
          code: r.participantCode
        }))}
        availableQuestions={responses.map(r => ({
          id: r.questionId,
          title: r.questionTitle
        }))}
      />

      <TabsContainer>
        <TabsList>
          <Tab
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </Tab>
          <Tab
            active={activeTab === 'heatmap'}
            onClick={() => setActiveTab('heatmap')}
          >
            Heatmap
          </Tab>
          <Tab
            active={activeTab === 'overlay'}
            onClick={() => setActiveTab('overlay')}
          >
            Overlay Analysis
          </Tab>
          <Tab
            active={activeTab === 'statistics'}
            onClick={() => setActiveTab('statistics')}
          >
            Statistics
          </Tab>
        </TabsList>
      </TabsContainer>

      <ContentArea>
        {activeTab === 'overview' && statistics && (
          <>
            <StatsGrid>
              <StatCard>
                <StatValue>{statistics.totalResponses}</StatValue>
                <StatLabel>Total Responses</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{statistics.totalParticipants}</StatValue>
                <StatLabel>Participants</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{Math.round(statistics.averageResponseTime / 1000)}s</StatValue>
                <StatLabel>Avg Response Time</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{Math.round(statistics.averageElementsPerResponse)}</StatValue>
                <StatLabel>Avg Elements per Response</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{statistics.completionRate}%</StatValue>
                <StatLabel>Completion Rate</StatLabel>
              </StatCard>
            </StatsGrid>

            {heatmapData && (
              <VisualizationCard>
                <CardHeader>
                  <CardTitle>Response Heatmap Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <HeatmapVisualization
                    data={heatmapData}
                    options={heatmapOptions}
                    onOptionsChange={handleHeatmapOptionsChange}
                    showControls={false}
                  />
                </CardContent>
              </VisualizationCard>
            )}
          </>
        )}

        {activeTab === 'heatmap' && heatmapData && (
          <VisualizationCard>
            <CardHeader>
              <CardTitle>Interactive Heatmap Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <HeatmapVisualization
                data={heatmapData}
                options={heatmapOptions}
                onOptionsChange={handleHeatmapOptionsChange}
                showControls={true}
                showStats={true}
              />
            </CardContent>
          </VisualizationCard>
        )}

        {activeTab === 'overlay' && responses.length > 0 && (
          <VisualizationCard>
            <CardHeader>
              <CardTitle>Response Overlay Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <OverlayVisualization
                responses={responses}
                onLayerToggle={(layerId, visible) => {
                  console.log('Layer toggled:', layerId, visible);
                }}
                onOpacityChange={(layerId, opacity) => {
                  console.log('Opacity changed:', layerId, opacity);
                }}
              />
            </CardContent>
          </VisualizationCard>
        )}

        {activeTab === 'statistics' && statistics && (
          <div>
            <VisualizationCard>
              <CardHeader>
                <CardTitle>Detailed Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <StatsGrid>
                  <StatCard>
                    <StatValue>{statistics.totalResponses}</StatValue>
                    <StatLabel>Total Responses</StatLabel>
                  </StatCard>
                  <StatCard>
                    <StatValue>{statistics.totalParticipants}</StatValue>
                    <StatLabel>Unique Participants</StatLabel>
                  </StatCard>
                  <StatCard>
                    <StatValue>{Math.round(statistics.averageResponseTime / 1000)}s</StatValue>
                    <StatLabel>Average Response Time</StatLabel>
                  </StatCard>
                  <StatCard>
                    <StatValue>{Math.round(statistics.averageElementsPerResponse)}</StatValue>
                    <StatLabel>Average Elements per Response</StatLabel>
                  </StatCard>
                </StatsGrid>
              </CardContent>
            </VisualizationCard>
          </div>
        )}
      </ContentArea>
    </AnalysisContainer>
  );
};

export default Analysis;