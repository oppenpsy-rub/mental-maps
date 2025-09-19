import React from 'react';
import styled from 'styled-components';
import { Question } from '../../../types';
import { Card } from '../../../components/UI/Card';

interface QuestionDisplayProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  className?: string;
}

const QuestionCard = styled(Card)`
  padding: 24px;
  margin-bottom: 20px;
`;

const QuestionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 16px;
`;

const QuestionNumber = styled.div`
  background: #007bff;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.875rem;
  white-space: nowrap;
`;

const QuestionType = styled.div`
  background: #f8f9fa;
  color: #6c757d;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const QuestionContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const QuestionText = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.4;
  color: #212529;
`;

const QuestionDescription = styled.p`
  margin: 0;
  font-size: 1rem;
  line-height: 1.6;
  color: #6c757d;
`;

const QuestionInstructions = styled.div`
  background: rgba(0, 123, 255, 0.1);
  border-left: 4px solid #007bff;
  padding: 16px;
  border-radius: 0 8px 8px 0;
  margin-top: 16px;
`;

const InstructionTitle = styled.h4`
  margin: 0 0 8px 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #007bff;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const InstructionText = styled.p`
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #212529;
`;

const ConfigurationInfo = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
`;

const ConfigBadge = styled.span`
  background: #f8f9fa;
  color: #6c757d;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 500;
`;

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  questionNumber,
  totalQuestions,
  className
}) => {
  const getQuestionTypeLabel = (type: string): string => {
    switch (type) {
      case 'map_drawing':
        return 'Kartenzeichnung';
      case 'audio_response':
        return 'Audio-Antwort';
      case 'demographic':
        return 'Demografische Daten';
      case 'heatmap':
        return 'Heatmap';
      case 'point_selection':
        return 'Punktauswahl';
      case 'area_selection':
        return 'Bereichsauswahl';
      case 'rating':
        return 'Bewertung';
      default:
        return type;
    }
  };

  const getInstructions = (type: string): string => {
    switch (type) {
      case 'map_drawing':
        return 'Verwenden Sie die Zeichenwerkzeuge, um Ihre Antwort auf der Karte zu markieren. Sie können verschiedene Werkzeuge wie Stift, Linien oder Flächen verwenden.';
      case 'audio_response':
        return 'Hören Sie sich den Audio-Stimulus an und markieren Sie dann Ihre Antwort auf der Karte. Sie können das Audio beliebig oft wiederholen.';
      case 'heatmap':
        return 'Verwenden Sie das Heatmap-Werkzeug, um Intensitätsbereiche auf der Karte zu markieren. Stärkere Bereiche werden heller dargestellt.';
      case 'point_selection':
        return 'Klicken Sie auf die Karte, um spezifische Punkte zu markieren, die Ihre Antwort repräsentieren.';
      case 'area_selection':
        return 'Zeichnen Sie Bereiche auf der Karte, die Ihre Antwort am besten repräsentieren.';
      case 'rating':
        return 'Bewerten Sie verschiedene Bereiche auf der Karte entsprechend der gestellten Frage.';
      default:
        return 'Folgen Sie den Anweisungen für diese Frage.';
    }
  };

  const renderConfigurationInfo = () => {
    if (!question.configuration) return null;

    const config = question.configuration;
    const badges: string[] = [];

    if (config.allowMultipleAnswers) badges.push('Mehrere Antworten möglich');
    if (config.requiresAudio) badges.push('Audio erforderlich');
    if (config.timeLimit) badges.push(`Zeitlimit: ${config.timeLimit}s`);
    if (config.mapBounds) badges.push('Begrenzter Kartenbereich');
    if (config.allowedTools) badges.push(`Werkzeuge: ${config.allowedTools.join(', ')}`);

    return badges.length > 0 ? (
      <ConfigurationInfo>
        {badges.map((badge, index) => (
          <ConfigBadge key={index}>{badge}</ConfigBadge>
        ))}
      </ConfigurationInfo>
    ) : null;
  };

  return (
    <QuestionCard className={className}>
      <QuestionHeader>
        <QuestionNumber>
          Frage {questionNumber} von {totalQuestions}
        </QuestionNumber>
        <QuestionType>
          {getQuestionTypeLabel(question.questionType)}
        </QuestionType>
      </QuestionHeader>

      <QuestionContent>
        <QuestionText>{question.questionText}</QuestionText>
        
        {question.configuration?.description && (
          <QuestionDescription>
            {question.configuration.description}
          </QuestionDescription>
        )}

        <QuestionInstructions>
          <InstructionTitle>Anweisungen</InstructionTitle>
          <InstructionText>
            {question.configuration?.instructions || getInstructions(question.questionType)}
          </InstructionText>
        </QuestionInstructions>

        {renderConfigurationInfo()}
      </QuestionContent>
    </QuestionCard>
  );
};

export default QuestionDisplay;