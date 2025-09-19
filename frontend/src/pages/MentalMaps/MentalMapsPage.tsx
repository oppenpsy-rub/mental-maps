import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { MentalMapData, mentalMapsService } from '../../services/mentalMapsService';
import { MentalMapViewer } from '../../components/MentalMaps/MentalMapViewer';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';

const PageContainer = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 32px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: #6b7280;
  margin: 0;
`;

const Controls = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  align-items: center;
`;

const FilterInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  min-width: 200px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const FilterSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  min-width: 150px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const StatsBar = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const StatCard = styled(Card)`
  padding: 20px;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: #6b7280;
`;

const MapsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 24px;
`;

const MapCard = styled(Card)`
  padding: 0;
  overflow: hidden;
`;

const MapHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
`;

const MapTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
`;

const MapMeta = styled.div`
  font-size: 12px;
  color: #6b7280;
  display: flex;
  gap: 16px;
`;

const LoadingState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #6b7280;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 24px;
  color: #6b7280;
`;

export const MentalMapsPage: React.FC = () => {
  const { studyId } = useParams<{ studyId: string }>();
  const [mentalMaps, setMentalMaps] = useState<MentalMapData[]>([]);
  const [filteredMaps, setFilteredMaps] = useState<MentalMapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [participantFilter, setParticipantFilter] = useState('');
  const [questionFilter, setQuestionFilter] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'participant' | 'responseTime'>('date');

  useEffect(() => {
    if (studyId) {
      loadMentalMaps();
    }
  }, [studyId]);

  useEffect(() => {
    applyFilters();
  }, [mentalMaps, participantFilter, questionFilter, sortBy]);

  const loadMentalMaps = async () => {
    try {
      setLoading(true);
      setError(null);
      const maps = await mentalMapsService.getMentalMapsByStudy(studyId!);
      setMentalMaps(maps);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Mental Maps');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...mentalMaps];

    // Filter by participant
    if (participantFilter) {
      filtered = filtered.filter(map => 
        map.participantCode.toLowerCase().includes(participantFilter.toLowerCase())
      );
    }

    // Filter by question
    if (questionFilter) {
      filtered = filtered.filter(map => 
        map.questionTitle.toLowerCase().includes(questionFilter.toLowerCase()) ||
        map.questionText.toLowerCase().includes(questionFilter.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.responseCreatedAt).getTime() - new Date(a.responseCreatedAt).getTime();
        case 'participant':
          return a.participantCode.localeCompare(b.participantCode);
        case 'responseTime':
          return b.responseTimeMs - a.responseTimeMs;
        default:
          return 0;
      }
    });

    setFilteredMaps(filtered);
  };

  const handleExport = async (format: 'geojson' | 'csv' | 'json') => {
    try {
      const blob = await mentalMapsService.exportMentalMaps(studyId!, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mental-maps-${studyId}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const getUniqueQuestions = () => {
    const questions = new Set(mentalMaps.map(map => map.questionTitle));
    return Array.from(questions);
  };

  const calculateStats = () => {
    const totalMaps = mentalMaps.length;
    const totalParticipants = new Set(mentalMaps.map(map => map.participantCode)).size;
    const avgResponseTime = mentalMaps.length > 0 
      ? Math.round(mentalMaps.reduce((sum, map) => sum + map.responseTimeMs, 0) / mentalMaps.length / 1000)
      : 0;
    const avgElements = mentalMaps.length > 0
      ? Math.round(mentalMaps.reduce((sum, map) => sum + map.mapDrawing.elements.length, 0) / mentalMaps.length)
      : 0;

    return { totalMaps, totalParticipants, avgResponseTime, avgElements };
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingState>Mental Maps werden geladen...</LoadingState>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <EmptyState>
          <h3>Fehler beim Laden</h3>
          <p>{error}</p>
          <Button onClick={loadMentalMaps}>Erneut versuchen</Button>
        </EmptyState>
      </PageContainer>
    );
  }

  const stats = calculateStats();

  return (
    <PageContainer>
      <Header>
        <Title>Mental Maps Viewer</Title>
        <Subtitle>Visualisierung aller gezeichneten Mental Maps der Studie</Subtitle>
      </Header>

      <StatsBar>
        <StatCard>
          <StatValue>{stats.totalMaps}</StatValue>
          <StatLabel>Mental Maps</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.totalParticipants}</StatValue>
          <StatLabel>Teilnehmer</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.avgResponseTime}s</StatValue>
          <StatLabel>Ø Antwortzeit</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.avgElements}</StatValue>
          <StatLabel>Ø Elemente pro Map</StatLabel>
        </StatCard>
      </StatsBar>

      <Controls>
        <FilterInput
          type="text"
          placeholder="Nach Teilnehmer filtern..."
          value={participantFilter}
          onChange={(e) => setParticipantFilter(e.target.value)}
        />
        
        <FilterSelect
          value={questionFilter}
          onChange={(e) => setQuestionFilter(e.target.value)}
        >
          <option value="">Alle Fragen</option>
          {getUniqueQuestions().map(question => (
            <option key={question} value={question}>{question}</option>
          ))}
        </FilterSelect>

        <FilterSelect
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
        >
          <option value="date">Nach Datum sortieren</option>
          <option value="participant">Nach Teilnehmer sortieren</option>
          <option value="responseTime">Nach Antwortzeit sortieren</option>
        </FilterSelect>

        <Button onClick={() => handleExport('geojson')}>
          Als GeoJSON exportieren
        </Button>
        
        <Button variant="secondary" onClick={() => handleExport('csv')}>
          Als CSV exportieren
        </Button>
      </Controls>

      {filteredMaps.length === 0 ? (
        <EmptyState>
          <h3>Keine Mental Maps gefunden</h3>
          <p>Es wurden noch keine Mental Maps für diese Studie erstellt oder sie entsprechen nicht den Filterkriterien.</p>
        </EmptyState>
      ) : (
        <MapsGrid>
          {filteredMaps.map((mentalMap) => (
            <MapCard key={mentalMap.responseId}>
              <MapHeader>
                <MapTitle>{mentalMap.questionTitle}</MapTitle>
                <MapMeta>
                  <span>Teilnehmer: {mentalMap.participantCode}</span>
                  <span>Elemente: {mentalMap.mapDrawing.elements.length}</span>
                  <span>
                    {new Date(mentalMap.responseCreatedAt).toLocaleDateString('de-DE')}
                  </span>
                </MapMeta>
              </MapHeader>
              <MentalMapViewer
                mentalMap={mentalMap}
                showParticipantInfo={false}
                onElementClick={(element) => {
                  console.log('Element clicked:', element);
                }}
              />
            </MapCard>
          ))}
        </MapsGrid>
      )}
    </PageContainer>
  );
};

export default MentalMapsPage;