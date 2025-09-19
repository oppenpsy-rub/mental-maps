import React, { useState } from 'react';
import styled from 'styled-components';
import { Button } from '../../../components/UI/Button';
import { Card } from '../../../components/UI/Card';

interface StudyCompletionProps {
  studyTitle: string;
  completedQuestions: number;
  totalQuestions: number;
  studyDuration: number; // in milliseconds
  onComplete: () => void;
  onDownloadData?: () => void;
  showDataDownload?: boolean;
  className?: string;
}

const CompletionContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  padding: 24px;
`;

const CompletionCard = styled(Card)`
  max-width: 600px;
  width: 100%;
  text-align: center;
  padding: 48px;
`;

const SuccessIcon = styled.div`
  width: 80px;
  height: 80px;
  background: #28a745;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  font-size: 2.5rem;
  color: white;
`;

const CompletionTitle = styled.h1`
  margin: 0 0 16px 0;
  font-size: 2rem;
  font-weight: 700;
  color: #212529;
`;

const CompletionMessage = styled.p`
  margin: 0 0 32px 0;
  font-size: 1.125rem;
  line-height: 1.6;
  color: #6c757d;
`;

const StudyStats = styled.div`
  background: #f8f9fa;
  border-radius: 12px;
  padding: 24px;
  margin: 32px 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #007bff;
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #6c757d;
  font-weight: 500;
`;

const ActionButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 32px;
`;

const PrimaryButton = styled(Button)`
  padding: 16px 32px;
  font-size: 1.125rem;
  font-weight: 600;
`;

const SecondaryButton = styled(Button)`
  padding: 12px 24px;
`;

const ThankYouNote = styled.div`
  background: rgba(0, 123, 255, 0.1);
  border: 1px solid rgba(0, 123, 255, 0.3);
  border-radius: 8px;
  padding: 20px;
  margin: 24px 0;
  text-align: left;
`;

const NoteTitle = styled.h3`
  margin: 0 0 8px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #007bff;
`;

const NoteText = styled.p`
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #212529;
`;

const DataPrivacyNote = styled.div`
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  text-align: left;
`;

const PrivacyText = styled.p`
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.4;
  color: #6c757d;
`;

export const StudyCompletion: React.FC<StudyCompletionProps> = ({
  studyTitle,
  completedQuestions,
  totalQuestions,
  studyDuration,
  onComplete,
  onDownloadData,
  showDataDownload = false,
  className
}) => {
  const [isCompleting, setIsCompleting] = useState(false);

  const formatDuration = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await onComplete();
    } catch (error) {
      console.error('Error completing study:', error);
      setIsCompleting(false);
    }
  };

  const completionPercentage = totalQuestions > 0 
    ? Math.round((completedQuestions / totalQuestions) * 100)
    : 100;

  return (
    <CompletionContainer className={className}>
      <CompletionCard>
        <SuccessIcon>✓</SuccessIcon>
        
        <CompletionTitle>
          Vielen Dank für Ihre Teilnahme!
        </CompletionTitle>
        
        <CompletionMessage>
          Sie haben die Studie "{studyTitle}" erfolgreich abgeschlossen. 
          Ihre Antworten wurden sicher gespeichert und werden zur wissenschaftlichen Analyse verwendet.
        </CompletionMessage>

        <StudyStats>
          <StatItem>
            <StatValue>{completedQuestions}</StatValue>
            <StatLabel>Beantwortete Fragen</StatLabel>
          </StatItem>
          
          <StatItem>
            <StatValue>{completionPercentage}%</StatValue>
            <StatLabel>Vollständigkeit</StatLabel>
          </StatItem>
          
          <StatItem>
            <StatValue>{formatDuration(studyDuration)}</StatValue>
            <StatLabel>Bearbeitungszeit</StatLabel>
          </StatItem>
        </StudyStats>

        <ThankYouNote>
          <NoteTitle>Wichtiger Hinweis</NoteTitle>
          <NoteText>
            Ihre Teilnahme trägt zur sprachwissenschaftlichen Forschung bei. 
            Die gesammelten Daten werden ausschließlich für wissenschaftliche Zwecke verwendet 
            und entsprechend den Datenschutzbestimmungen behandelt.
          </NoteText>
        </ThankYouNote>

        <DataPrivacyNote>
          <PrivacyText>
            🔒 Alle Ihre Daten wurden anonymisiert gespeichert. 
            Persönliche Informationen können nicht mit Ihren Antworten verknüpft werden.
          </PrivacyText>
        </DataPrivacyNote>

        <ActionButtons>
          {showDataDownload && onDownloadData && (
            <SecondaryButton
              variant="secondary"
              onClick={onDownloadData}
              disabled={isCompleting}
            >
              📥 Meine Daten herunterladen
            </SecondaryButton>
          )}
          
          <PrimaryButton
            variant="primary"
            onClick={handleComplete}
            isLoading={isCompleting}
            disabled={isCompleting}
          >
            {isCompleting ? 'Wird abgeschlossen...' : 'Studie beenden'}
          </PrimaryButton>
        </ActionButtons>
      </CompletionCard>
    </CompletionContainer>
  );
};

export default StudyCompletion;