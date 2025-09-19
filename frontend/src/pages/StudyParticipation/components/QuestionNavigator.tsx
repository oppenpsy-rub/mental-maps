import React from 'react';
import styled from 'styled-components';
import { Button } from '../../../components/UI/Button';
import { Question } from '../../../types';

interface QuestionNavigatorProps {
  questions: Question[];
  currentIndex: number;
  completedQuestions: number;
  onPrevious: () => void;
  onNext: () => void;
  onGoToQuestion: (index: number) => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
  isLoading?: boolean;
  className?: string;
}

const NavigatorContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const NavigationControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
`;

const ProgressInfo = styled.div`
  text-align: center;
  color: #666;
  font-size: 0.9rem;
`;

const QuestionList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
`;

const QuestionButton = styled.button<{
  $isCurrent: boolean;
  $isCompleted: boolean;
  $isAccessible: boolean;
}>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid;
  background: ${props => {
    if (props.$isCurrent) return '#007bff';
    if (props.$isCompleted) return '#28a745';
    return 'transparent';
  }};
  color: ${props => {
    if (props.$isCurrent || props.$isCompleted) return 'white';
    return props.$isAccessible ? '#333' : '#999';
  }};
  border-color: ${props => {
    if (props.$isCurrent) return '#007bff';
    if (props.$isCompleted) return '#28a745';
    return props.$isAccessible ? '#007bff' : '#ddd';
  }};
  cursor: ${props => props.$isAccessible ? 'pointer' : 'not-allowed'};
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  
  &:hover {
    ${props => props.$isAccessible && `
      transform: scale(1.1);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    `}
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const NavigationButton = styled(Button)`
  min-width: 100px;
`;

const ProgressText = styled.div`
  font-weight: 500;
  color: #333;
`;

const CompletionBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(40, 167, 69, 0.2);
  color: #28a745;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
`;

export const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({
  questions,
  currentIndex,
  completedQuestions,
  onPrevious,
  onNext,
  onGoToQuestion,
  canGoBack = true,
  canGoForward = true,
  isLoading = false,
  className
}) => {
  const isLastQuestion = currentIndex >= questions.length - 1;
  const canNavigateBack = canGoBack && currentIndex > 0 && !isLoading;
  const canNavigateForward = canGoForward && !isLoading;

  const handleQuestionClick = (index: number) => {
    // Allow navigation to completed questions or the next question
    const isAccessible = index <= completedQuestions || index === currentIndex;
    if (isAccessible && !isLoading) {
      onGoToQuestion(index);
    }
  };

  const getQuestionStatus = (index: number) => {
    if (index === currentIndex) return 'current';
    if (index < completedQuestions) return 'completed';
    if (index === completedQuestions) return 'accessible';
    return 'locked';
  };

  const progressPercentage = questions.length > 0 
    ? Math.round((completedQuestions / questions.length) * 100)
    : 0;

  return (
    <NavigatorContainer className={className}>
      <ProgressInfo>
        <ProgressText>
          Frage {currentIndex + 1} von {questions.length}
        </ProgressText>
        {completedQuestions > 0 && (
          <CompletionBadge>
            ✓ {completedQuestions} abgeschlossen ({progressPercentage}%)
          </CompletionBadge>
        )}
      </ProgressInfo>

      <QuestionList>
        {questions.map((_, index) => {
          const status = getQuestionStatus(index);
          const isAccessible = status === 'current' || status === 'completed' || status === 'accessible';
          
          return (
            <QuestionButton
              key={index}
              $isCurrent={status === 'current'}
              $isCompleted={status === 'completed'}
              $isAccessible={isAccessible}
              onClick={() => handleQuestionClick(index)}
              disabled={!isAccessible || isLoading}
              title={`Frage ${index + 1}${
                status === 'completed' ? ' (abgeschlossen)' :
                status === 'current' ? ' (aktuell)' :
                status === 'locked' ? ' (gesperrt)' : ''
              }`}
            >
              {index + 1}
            </QuestionButton>
          );
        })}
      </QuestionList>

      <NavigationControls>
        <NavigationButton
          variant="secondary"
          onClick={onPrevious}
          disabled={!canNavigateBack}
          isLoading={isLoading}
        >
          ← Zurück
        </NavigationButton>

        <div style={{ textAlign: 'center', fontSize: '0.875rem', color: '#666' }}>
          {isLoading && 'Wird gespeichert...'}
        </div>

        <NavigationButton
          variant="primary"
          onClick={onNext}
          disabled={!canNavigateForward}
          isLoading={isLoading}
        >
          {isLastQuestion ? 'Abschließen' : 'Weiter'} →
        </NavigationButton>
      </NavigationControls>
    </NavigatorContainer>
  );
};

export default QuestionNavigator;