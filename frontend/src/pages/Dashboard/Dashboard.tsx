import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { Study } from '../../types';
import { studyService, StudyListOptions } from '../../services/studyService';
import { Button } from '../../components/UI/Button';
import { Card } from '../../components/UI/Card';
import { Heading1, Heading2, Heading3, Heading4, Text, SmallText } from '../../components/UI/Typography';

const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
`;

const Title = styled(Heading1)`
  margin: 0;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
`;

const StatCard = styled(Card)`
  text-align: center;
  padding: 24px;
`;

const StatNumber = styled(Heading2)`
  color: ${props => props.theme.colors.primary};
  margin: 0 0 8px 0;
`;

const StatLabel = styled(SmallText)`
  color: ${props => props.theme.colors.textSecondary};
  margin: 0;
`;

const StudiesSection = styled.div`
  margin-bottom: 32px;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const SectionTitle = styled(Heading3)`
  margin: 0;
`;

const FiltersContainer = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

const SearchInput = styled.input`
  padding: 8px 12px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 4px;
  font-size: 14px;
  min-width: 200px;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const FilterSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 4px;
  font-size: 14px;
  background: white;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const StudiesGrid = styled.div`
  display: grid;
  gap: 16px;
`;

const StudyCard = styled(Card)`
  padding: 24px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const StudyHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const StudyTitle = styled(Heading4)`
  margin: 0;
  color: ${props => props.theme.colors.text};
`;

const StudyStatus = styled.span<{ $status: string }>`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  
  ${props => {
    switch (props.$status) {
      case 'active':
        return `
          background: #d4edda;
          color: #155724;
        `;
      case 'draft':
        return `
          background: #fff3cd;
          color: #856404;
        `;
      case 'paused':
        return `
          background: #f8d7da;
          color: #721c24;
        `;
      case 'completed':
        return `
          background: #d1ecf1;
          color: #0c5460;
        `;
      default:
        return `
          background: #e2e3e5;
          color: #383d41;
        `;
    }
  }}
`;

const StudyDescription = styled(Text)`
  color: ${props => props.theme.colors.textSecondary};
  margin: 0 0 16px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const StudyMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-size: 12px;
  color: ${props => props.theme.colors.textSecondary};
`;

const StudyActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 24px;
  color: ${props => props.theme.colors.textSecondary};
`;

const ErrorMessage = styled.div`
  background: #f8d7da;
  color: #721c24;
  padding: 12px 16px;
  border-radius: 4px;
  margin-bottom: 16px;
`;

interface DashboardStats {
  totalStudies: number;
  activeStudies: number;
  draftStudies: number;
  completedStudies: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [studies, setStudies] = useState<Study[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudies: 0,
    activeStudies: 0,
    draftStudies: 0,
    completedStudies: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const loadStudies = async () => {
    try {
      setLoading(true);
      setError(null);

      const options: StudyListOptions = {
        search: searchTerm || undefined,
        active: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
        sortBy,
        sortOrder,
        limit: 50 // Load more studies for dashboard overview
      };

      const response = await studyService.getStudies(options);
      setStudies(response.studies);

      // Calculate stats from loaded studies
      const newStats = {
        totalStudies: response.studies.length,
        activeStudies: response.studies.filter(s => s.active).length,
        draftStudies: response.studies.filter(s => s.status === 'draft').length,
        completedStudies: response.studies.filter(s => s.status === 'completed').length
      };
      setStats(newStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load studies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudies();
  }, [searchTerm, statusFilter, sortBy, sortOrder]);

  const handleCreateStudy = () => {
    console.log('Navigate to study creation');
    navigate('/studies/new');
  };

  const handleEditStudy = (studyId: string) => {
    console.log('Navigate to study editor:', studyId);
    navigate(`/studies/${studyId}/edit`);
  };

  const handleViewResults = (studyId: string) => {
    // Navigate to results view - will be implemented in analysis dashboard
    console.log('Navigate to results view:', studyId);
  };

  const handleToggleStudyStatus = async (study: Study) => {
    try {
      if (study.active) {
        await studyService.deactivateStudy(study.id, 'Deactivated from dashboard');
      } else {
        await studyService.activateStudy(study.id, 'Activated from dashboard');
      }
      await loadStudies(); // Reload studies to reflect changes
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update study status');
    }
  };

  const handleDeleteStudy = async (studyId: string) => {
    if (!window.confirm('Sind Sie sicher, dass Sie diese Studie löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return;
    }

    try {
      await studyService.deleteStudy(studyId);
      await loadStudies(); // Reload studies to reflect changes
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete study');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <DashboardContainer>
      <Header>
        <Title>Forscher-Dashboard</Title>
        <Button variant="primary" onClick={handleCreateStudy}>
          Neue Studie erstellen
        </Button>
      </Header>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {/* Statistics Cards */}
      <StatsGrid>
        <StatCard>
          <StatNumber>{stats.totalStudies}</StatNumber>
          <StatLabel>Studien gesamt</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{stats.activeStudies}</StatNumber>
          <StatLabel>Aktive Studien</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{stats.draftStudies}</StatNumber>
          <StatLabel>Entwürfe</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{stats.completedStudies}</StatNumber>
          <StatLabel>Abgeschlossen</StatLabel>
        </StatCard>
      </StatsGrid>

      {/* Studies Section */}
      <StudiesSection>
        <SectionHeader>
          <SectionTitle>Meine Studien</SectionTitle>
        </SectionHeader>

        {/* Filters */}
        <FiltersContainer>
          <SearchInput
            type="text"
            placeholder="Studien durchsuchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FilterSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Alle Status</option>
            <option value="active">Aktiv</option>
            <option value="inactive">Inaktiv</option>
          </FilterSelect>
          <FilterSelect
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="updatedAt">Zuletzt bearbeitet</option>
            <option value="createdAt">Erstellungsdatum</option>
            <option value="title">Titel</option>
          </FilterSelect>
          <FilterSelect
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
          >
            <option value="desc">Absteigend</option>
            <option value="asc">Aufsteigend</option>
          </FilterSelect>
        </FiltersContainer>

        {/* Studies List */}
        {loading ? (
          <LoadingContainer>
            <Text>Lade Studien...</Text>
          </LoadingContainer>
        ) : studies.length === 0 ? (
          <EmptyState>
            <Heading4 style={{ marginBottom: '16px' }}>
              Keine Studien gefunden
            </Heading4>
            <Text style={{ marginBottom: '24px' }}>
              {searchTerm || statusFilter !== 'all' 
                ? 'Keine Studien entsprechen den aktuellen Filterkriterien.'
                : 'Sie haben noch keine Studien erstellt. Erstellen Sie Ihre erste Studie, um zu beginnen.'
              }
            </Text>
            {!searchTerm && statusFilter === 'all' && (
              <Button variant="primary" onClick={handleCreateStudy}>
                Erste Studie erstellen
              </Button>
            )}
          </EmptyState>
        ) : (
          <StudiesGrid>
            {studies.map((study) => (
              <StudyCard key={study.id}>
                <StudyHeader>
                  <StudyTitle>{study.title}</StudyTitle>
                  <StudyStatus $status={study.status}>{study.status}</StudyStatus>
                </StudyHeader>
                
                {study.description && (
                  <StudyDescription>{study.description}</StudyDescription>
                )}
                
                <StudyMeta>
                  <span>Erstellt: {formatDate(study.createdAt)}</span>
                  <span>Bearbeitet: {formatDate(study.updatedAt)}</span>
                </StudyMeta>
                
                <StudyActions>
                  <Button 
                    variant="outline" 
                    size="small"
                    onClick={() => handleEditStudy(study.id)}
                  >
                    Bearbeiten
                  </Button>
                  {study.active && (
                    <Button 
                      variant="primary" 
                      size="small"
                      onClick={() => window.open(`/participate/${study.id}`, '_blank')}
                    >
                      Teilnehmen
                    </Button>
                  )}
                  <Button 
                    variant={study.active ? "danger" : "success"} 
                    size="small"
                    onClick={() => handleToggleStudyStatus(study)}
                  >
                    {study.active ? 'Deaktivieren' : 'Aktivieren'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="small"
                    onClick={() => handleViewResults(study.id)}
                    disabled={!study.active && study.status !== 'completed'}
                  >
                    Ergebnisse
                  </Button>
                  <Button 
                    variant="outline" 
                    size="small"
                    onClick={() => navigate(`/studies/${study.id}/mental-maps`)}
                    disabled={!study.active && study.status !== 'completed'}
                  >
                    🗺️ Mental Maps
                  </Button>
                  <Button 
                    variant="danger" 
                    size="small"
                    onClick={() => handleDeleteStudy(study.id)}
                    disabled={study.active}
                  >
                    Löschen
                  </Button>
                </StudyActions>
              </StudyCard>
            ))}
          </StudiesGrid>
        )}
      </StudiesSection>
    </DashboardContainer>
  );
};

export default Dashboard;