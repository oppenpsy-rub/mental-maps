import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Study, Question } from '../../../types';
import { studyService } from '../../../services/studyService';
import { Button } from '../../../components/UI/Button';
import { Card } from '../../../components/UI/Card';
import { Heading1, Heading2, Heading3, Text, SmallText } from '../../../components/UI/Typography';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 8px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
`;

const PreviewContainer = styled.div`
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

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
`;

const StudyInfoCard = styled(Card)`
  padding: 24px;
  margin-bottom: 24px;
`;

const StudyTitle = styled(Heading2)`
  margin: 0 0 12px 0;
  color: ${props => props.theme.colors.primary};
`;

const StudyDescription = styled(Text)`
  margin: 0 0 16px 0;
  color: ${props => props.theme.colors.textSecondary};
`;

const StudyMeta = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  padding: 16px;
  background: ${props => props.theme.colors.gray[50]};
  border-radius: 4px;
`;

const MetaItem = styled.div``;

const MetaLabel = styled(SmallText)`
  font-weight: 500;
  margin: 0 0 4px 0;
  color: ${props => props.theme.colors.gray[600]};
`;

const MetaValue = styled(Text)`
  margin: 0;
  font-weight: 500;
`;

const QuestionsSection = styled.div`
  margin-bottom: 32px;
`;

const QuestionCard = styled(Card)`
  padding: 20px;
  margin-bottom: 16px;
  border-left: 4px solid ${props => props.theme.colors.primary};
`;

const QuestionHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const QuestionNumber = styled.span`
  background: ${props => props.theme.colors.primary};
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  margin-right: 12px;
  min-width: 24px;
  text-align: center;
`;

const QuestionTitle = styled(Heading3)`
  margin: 0;
  flex: 1;
`;

const QuestionType = styled.span`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background: ${props => props.theme.colors.gray[100]};
  color: ${props => props.theme.colors.gray[700]};
`;

const QuestionText = styled(Text)`
  margin: 0 0 12px 0;
`;

const QuestionConfig = styled.div`
  background: ${props => props.theme.colors.gray[50]};
  padding: 12px;
  border-radius: 4px;
  margin-top: 12px;
`;

const ConfigTitle = styled(SmallText)`
  font-weight: 500;
  margin: 0 0 8px 0;
  color: ${props => props.theme.colors.gray[700]};
`;

const ConfigList = styled.ul`
  margin: 0;
  padding-left: 16px;
  
  li {
    font-size: 14px;
    color: ${props => props.theme.colors.gray[600]};
    margin-bottom: 4px;
  }
`;

const ValidationSection = styled.div`
  margin-bottom: 24px;
`;

const ValidationCard = styled(Card)<{ $isValid: boolean }>`
  padding: 20px;
  border-left: 4px solid ${props => props.$isValid ? props.theme.colors.success : props.theme.colors.danger};
`;

const ValidationTitle = styled(Heading3)<{ $isValid: boolean }>`
  margin: 0 0 12px 0;
  color: ${props => props.$isValid ? props.theme.colors.success : props.theme.colors.danger};
`;

const ValidationList = styled.ul`
  margin: 0;
  padding-left: 16px;
  
  li {
    margin-bottom: 8px;
    color: ${props => props.theme.colors.gray[700]};
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
`;

const ErrorMessage = styled.div`
  background: #f8d7da;
  color: #721c24;
  padding: 12px 16px;
  border-radius: 4px;
  margin-bottom: 16px;
`;

interface StudyPreviewProps {
  studyId?: string;
  study?: Study;
  questions?: Question[];
  onClose: () => void;
  onPublish?: () => void;
}

const StudyPreview: React.FC<StudyPreviewProps> = ({
  studyId,
  study: propStudy,
  questions: propQuestions,
  onClose,
  onPublish
}) => {
  const [study, setStudy] = useState<Study | null>(propStudy || null);
  const [questions, setQuestions] = useState<Question[]>(propQuestions || []);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (studyId && !propStudy) {
      loadStudyData();
    } else if (propStudy) {
      // Use provided data for preview
      setStudy(propStudy);
      setQuestions(propQuestions || []);
      validateStudyData(propStudy, propQuestions || []);
    }
  }, [studyId, propStudy, propQuestions]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const loadStudyData = async () => {
    if (!studyId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const studyData = await studyService.getStudy(studyId, true);
      setStudy(studyData);
      setQuestions(studyData.questions || []);
      
      // Get validation status
      const statusData = await studyService.getStudyStatus(studyId);
      setValidationErrors(statusData.validationErrors || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load study');
    } finally {
      setLoading(false);
    }
  };

  const validateStudyData = (studyData: Study, questionsData: Question[]) => {
    const errors: string[] = [];
    
    if (!studyData.title || studyData.title.trim() === '') {
      errors.push('Titel der Studie ist erforderlich');
    }
    
    if (questionsData.length === 0) {
      errors.push('Mindestens eine Frage ist erforderlich');
    }
    
    questionsData.forEach((question, index) => {
      if (!question.questionText || question.questionText.trim() === '') {
        errors.push(`Frage ${index + 1}: Fragetext ist erforderlich`);
      }
    });
    
    setValidationErrors(errors);
  };

  const getQuestionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'map_drawing': 'Karten-Zeichnung',
      'audio_response': 'Audio-Antwort',
      'demographic': 'Demografie',
      'heatmap': 'Heatmap',
      'point_selection': 'Punkt-Auswahl',
      'area_selection': 'Bereich-Auswahl',
      'rating': 'Bewertung'
    };
    return labels[type] || type;
  };

  const renderQuestionConfiguration = (question: Question) => {
    const config = question.configuration || {};
    
    switch (question.questionType) {
      case 'map_drawing':
        if (config.allowedDrawingTools && config.allowedDrawingTools.length > 0) {
          return (
            <QuestionConfig>
              <ConfigTitle>Verfügbare Zeichenwerkzeuge:</ConfigTitle>
              <ConfigList>
                {config.allowedDrawingTools.map((tool: string) => (
                  <li key={tool}>
                    {tool === 'pen' && 'Stift'}
                    {tool === 'line' && 'Linie'}
                    {tool === 'polygon' && 'Polygon'}
                    {tool === 'circle' && 'Kreis'}
                    {tool === 'text' && 'Text'}
                  </li>
                ))}
              </ConfigList>
            </QuestionConfig>
          );
        }
        break;
        
      case 'heatmap':
        if (config.heatmapSettings) {
          return (
            <QuestionConfig>
              <ConfigTitle>Heatmap-Einstellungen:</ConfigTitle>
              <ConfigList>
                <li>Radius: {config.heatmapSettings.radius || 20} Pixel</li>
              </ConfigList>
            </QuestionConfig>
          );
        }
        break;
        
      case 'rating':
        if (config.ratingScale) {
          return (
            <QuestionConfig>
              <ConfigTitle>Bewertungsskala:</ConfigTitle>
              <ConfigList>
                <li>Von {config.ratingScale.min} bis {config.ratingScale.max}</li>
              </ConfigList>
            </QuestionConfig>
          );
        }
        break;
        
      case 'point_selection':
        return (
          <QuestionConfig>
            <ConfigTitle>Punkt-Auswahl:</ConfigTitle>
            <ConfigList>
              <li>Maximale Anzahl Punkte: {config.maxPoints || 1}</li>
            </ConfigList>
          </QuestionConfig>
        );
        
      case 'area_selection':
        return (
          <QuestionConfig>
            <ConfigTitle>Bereich-Auswahl:</ConfigTitle>
            <ConfigList>
              <li>Maximale Anzahl Bereiche: {config.maxAreas || 1}</li>
            </ConfigList>
          </QuestionConfig>
        );
    }
    
    return null;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isStudyValid = validationErrors.length === 0;

  if (loading) {
    return (
      <ModalOverlay onClick={(e) => e.target === e.currentTarget && onClose()}>
        <ModalContent>
          <PreviewContainer>
            <LoadingContainer>
              <Text>Lade Studienvorschau...</Text>
            </LoadingContainer>
          </PreviewContainer>
        </ModalContent>
      </ModalOverlay>
    );
  }

  if (error || !study) {
    return (
      <ModalOverlay onClick={(e) => e.target === e.currentTarget && onClose()}>
        <ModalContent>
          <PreviewContainer>
            <ErrorMessage>{error || 'Studie nicht gefunden'}</ErrorMessage>
            <Button variant="outline" onClick={onClose}>
              Zurück
            </Button>
          </PreviewContainer>
        </ModalContent>
      </ModalOverlay>
    );
  }

  return (
    <ModalOverlay onClick={(e) => e.target === e.currentTarget && onClose()}>
      <ModalContent>
        <PreviewContainer>
      <Header>
        <Title>Studienvorschau</Title>
        <ActionButtons>
          <Button variant="outline" onClick={onClose}>
            Zurück zum Editor
          </Button>
          {onPublish && (
            <Button 
              variant="success" 
              onClick={onPublish}
              disabled={!isStudyValid || study.active}
            >
              Veröffentlichen
            </Button>
          )}
        </ActionButtons>
      </Header>

      {/* Study Information */}
      <StudyInfoCard>
        <StudyTitle>{study.title}</StudyTitle>
        {study.description && (
          <StudyDescription>{study.description}</StudyDescription>
        )}
        
        <StudyMeta>
          <MetaItem>
            <MetaLabel>Status</MetaLabel>
            <MetaValue>{study.status}</MetaValue>
          </MetaItem>
          <MetaItem>
            <MetaLabel>Aktiv</MetaLabel>
            <MetaValue>{study.active ? 'Ja' : 'Nein'}</MetaValue>
          </MetaItem>
          <MetaItem>
            <MetaLabel>Anzahl Fragen</MetaLabel>
            <MetaValue>{questions.length}</MetaValue>
          </MetaItem>
          <MetaItem>
            <MetaLabel>Erstellt</MetaLabel>
            <MetaValue>{formatDate(study.createdAt)}</MetaValue>
          </MetaItem>
          <MetaItem>
            <MetaLabel>Zuletzt bearbeitet</MetaLabel>
            <MetaValue>{formatDate(study.updatedAt)}</MetaValue>
          </MetaItem>
        </StudyMeta>
      </StudyInfoCard>

      {/* Validation Status */}
      <ValidationSection>
        <ValidationCard $isValid={isStudyValid}>
          <ValidationTitle $isValid={isStudyValid}>
            {isStudyValid ? '✓ Studie ist bereit zur Veröffentlichung' : '⚠ Studie hat Validierungsfehler'}
          </ValidationTitle>
          
          {isStudyValid ? (
            <Text style={{ margin: 0, color: '#155724' }}>
              Alle Anforderungen sind erfüllt. Die Studie kann veröffentlicht werden.
            </Text>
          ) : (
            <div>
              <Text style={{ margin: '0 0 12px 0' }}>
                Die folgenden Probleme müssen behoben werden:
              </Text>
              <ValidationList>
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ValidationList>
            </div>
          )}
        </ValidationCard>
      </ValidationSection>

      {/* Questions Preview */}
      <QuestionsSection>
        <Heading2 style={{ marginBottom: '16px' }}>
          Fragen ({questions.length})
        </Heading2>
        
        {questions.length === 0 ? (
          <Card style={{ padding: '32px', textAlign: 'center' }}>
            <Text style={{ margin: 0, color: '#6c757d' }}>
              Keine Fragen vorhanden. Fügen Sie mindestens eine Frage hinzu, um die Studie zu veröffentlichen.
            </Text>
          </Card>
        ) : (
          questions
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((question, index) => (
              <QuestionCard key={question.id}>
                <QuestionHeader>
                  <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <QuestionNumber>{index + 1}</QuestionNumber>
                    <QuestionTitle>Frage {index + 1}</QuestionTitle>
                  </div>
                  <QuestionType>
                    {getQuestionTypeLabel(question.questionType)}
                  </QuestionType>
                </QuestionHeader>
                
                <QuestionText>{question.questionText}</QuestionText>
                
                {renderQuestionConfiguration(question)}
              </QuestionCard>
            ))
        )}
      </QuestionsSection>

      {/* Preview Instructions */}
      <Card style={{ padding: '20px', background: '#f8f9fa' }}>
        <Heading3 style={{ marginBottom: '12px' }}>Hinweise zur Vorschau</Heading3>
        <Text style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
          • Diese Vorschau zeigt, wie Ihre Studie strukturiert ist
        </Text>
        <Text style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
          • Probanden sehen die Fragen in der hier angezeigten Reihenfolge
        </Text>
        <Text style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
          • Stellen Sie sicher, dass alle Validierungsfehler behoben sind, bevor Sie veröffentlichen
        </Text>
        <Text style={{ margin: '0', fontSize: '14px' }}>
          • Nach der Veröffentlichung können keine Änderungen mehr vorgenommen werden
        </Text>
      </Card>
    </PreviewContainer>
      </ModalContent>
    </ModalOverlay>
  );
};

export default StudyPreview;