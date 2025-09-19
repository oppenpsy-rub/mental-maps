import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button } from '../../components/UI/Button';
import { Card } from '../../components/UI/Card';
import { studyService } from '../../services/studyService';
import { participantService } from '../../services/participantService';
import { Study } from '../../types';
import StudyParticipation from './StudyParticipation';

const EntryContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px;
`;

const WelcomeCard = styled(Card)`
  max-width: 600px;
  width: 100%;
  text-align: center;
  padding: 48px;
`;

const StudyTitle = styled.h1`
  margin: 0 0 16px 0;
  font-size: 2rem;
  font-weight: 700;
  color: #212529;
`;

const StudyDescription = styled.p`
  margin: 0 0 32px 0;
  font-size: 1.125rem;
  line-height: 1.6;
  color: #6c757d;
`;

const StudyInfo = styled.div`
  background: #f8f9fa;
  border-radius: 12px;
  padding: 24px;
  margin: 32px 0;
  text-align: left;
`;

const InfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #e9ecef;
  
  &:last-child {
    border-bottom: none;
  }
`;

const InfoLabel = styled.span`
  font-weight: 500;
  color: #495057;
`;

const InfoValue = styled.span`
  color: #212529;
`;

const ConsentSection = styled.div`
  background: rgba(0, 123, 255, 0.1);
  border: 1px solid rgba(0, 123, 255, 0.3);
  border-radius: 8px;
  padding: 20px;
  margin: 24px 0;
  text-align: left;
`;

const ConsentTitle = styled.h3`
  margin: 0 0 12px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #007bff;
`;

const ConsentText = styled.p`
  margin: 0 0 16px 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #212529;
`;

const ConsentCheckbox = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #212529;
  
  input[type="checkbox"] {
    margin-top: 2px;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-top: 32px;
`;

const LoadingScreen = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
`;

const LoadingSpinner = styled.div`
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorScreen = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
  padding: 24px;
`;

const StudyParticipationEntry: React.FC = () => {
  const { studyId } = useParams<{ studyId: string }>();
  const navigate = useNavigate();
  
  const [study, setStudy] = useState<Study | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasConsented, setHasConsented] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Load study information
  useEffect(() => {
    const loadStudyInfo = async () => {
      if (!studyId) {
        setError('Studie nicht gefunden');
        return;
      }

      try {
        setIsLoading(true);
        const studyData = await studyService.getStudy(studyId, true);
        
        if (!studyData.active) {
          setError('Diese Studie ist derzeit nicht aktiv');
          return;
        }
        
        setStudy(studyData);
      } catch (err) {
        console.error('Failed to load study info:', err);
        setError('Fehler beim Laden der Studie');
      } finally {
        setIsLoading(false);
      }
    };

    loadStudyInfo();
  }, [studyId]);

  const handleStartStudy = async () => {
    if (!hasConsented || !study) return;

    setIsStarting(true);
    try {
      // Create participant session
      await participantService.createParticipantSession(study.id, true);
      setHasStarted(true);
    } catch (error) {
      console.error('Failed to start study:', error);
      setError('Fehler beim Starten der Studie');
      setIsStarting(false);
    }
  };

  const handleDecline = () => {
    navigate('/');
  };

  const estimateStudyDuration = (questionCount: number): string => {
    // Rough estimate: 2-3 minutes per question
    const minutes = questionCount * 2.5;
    if (minutes < 60) {
      return `ca. ${Math.round(minutes)} Minuten`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `ca. ${hours}h ${remainingMinutes}m`;
  };

  // Loading state
  if (isLoading) {
    return (
      <LoadingScreen>
        <LoadingSpinner />
        <h2>Studie wird geladen...</h2>
        <p>Bitte warten Sie einen Moment.</p>
      </LoadingScreen>
    );
  }

  // Error state
  if (error) {
    return (
      <ErrorScreen>
        <h2>Fehler</h2>
        <p>{error}</p>
        <Button onClick={() => navigate('/')} variant="secondary">
          Zurück zur Startseite
        </Button>
      </ErrorScreen>
    );
  }

  // Show main study interface if started
  if (hasStarted && study) {
    return <StudyParticipation />;
  }

  // Show welcome screen
  return (
    <EntryContainer>
      <WelcomeCard>
        <StudyTitle>{study?.title || 'Studie'}</StudyTitle>
        
        <StudyDescription>
          {study?.description || 'Willkommen zu dieser sprachwissenschaftlichen Studie.'}
        </StudyDescription>

        <StudyInfo>
          <InfoItem>
            <InfoLabel>Anzahl Fragen:</InfoLabel>
            <InfoValue>{study?.questions?.length || 0}</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Geschätzte Dauer:</InfoLabel>
            <InfoValue>{estimateStudyDuration(study?.questions?.length || 0)}</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Geräte:</InfoLabel>
            <InfoValue>Desktop, Tablet, Smartphone</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Sprache:</InfoLabel>
            <InfoValue>Deutsch</InfoValue>
          </InfoItem>
        </StudyInfo>

        <ConsentSection>
          <ConsentTitle>Einverständniserklärung</ConsentTitle>
          <ConsentText>
            Mit Ihrer Teilnahme an dieser Studie erklären Sie sich damit einverstanden, dass:
          </ConsentText>
          <ul style={{ margin: '0 0 16px 0', paddingLeft: '20px', fontSize: '0.875rem', lineHeight: '1.5' }}>
            <li>Ihre Antworten anonymisiert für wissenschaftliche Zwecke verwendet werden</li>
            <li>Keine persönlichen Daten mit Ihren Antworten verknüpft werden</li>
            <li>Sie die Teilnahme jederzeit abbrechen können</li>
            <li>Die Daten entsprechend der DSGVO behandelt werden</li>
          </ul>
          
          <ConsentCheckbox>
            <input
              type="checkbox"
              checked={hasConsented}
              onChange={(e) => setHasConsented(e.target.checked)}
            />
            <span>
              Ich habe die Informationen gelesen und verstanden und erkläre mich mit der 
              Teilnahme an dieser Studie einverstanden.
            </span>
          </ConsentCheckbox>
        </ConsentSection>

        <ActionButtons>
          <Button
            variant="secondary"
            onClick={handleDecline}
            disabled={isStarting}
          >
            Ablehnen
          </Button>
          <Button
            variant="primary"
            onClick={handleStartStudy}
            disabled={!hasConsented || isStarting}
            isLoading={isStarting}
          >
            {isStarting ? 'Wird gestartet...' : 'Studie beginnen'}
          </Button>
        </ActionButtons>
      </WelcomeCard>
    </EntryContainer>
  );
};

export default StudyParticipationEntry;