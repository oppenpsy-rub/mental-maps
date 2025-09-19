import React, { useState } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setParticipantSession } from '../../store/slices/authSlice';
import { addNotification } from '../../store/slices/uiSlice';
import { authService } from '../../services/authService';

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const WelcomeText = styled.div`
  text-align: center;
  margin-bottom: 24px;
`;

const WelcomeTitle = styled.h3`
  color: #212529;
  margin-bottom: 12px;
  font-size: 1.25rem;
`;

const WelcomeDescription = styled.p`
  color: #6c757d;
  line-height: 1.6;
  margin: 0;
`;

const ConsentSection = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  border-left: 4px solid #007bff;
`;

const ConsentTitle = styled.h4`
  color: #212529;
  margin-bottom: 12px;
  font-size: 1rem;
`;

const ConsentText = styled.p`
  color: #495057;
  font-size: 0.875rem;
  line-height: 1.5;
  margin-bottom: 16px;
`;

const CheckboxContainer = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
  margin-bottom: 20px;
`;

const Checkbox = styled.input`
  margin-top: 2px;
  transform: scale(1.2);
`;

const CheckboxLabel = styled.span`
  color: #495057;
  font-size: 0.875rem;
  line-height: 1.4;
`;

const StartButton = styled.button<{ $isLoading?: boolean; disabled?: boolean }>`
  background: ${props => props.disabled ? '#6c757d' : props.$isLoading ? '#6c757d' : '#28a745'};
  color: white;
  border: none;
  padding: 16px 32px;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 500;
  cursor: ${props => props.disabled || props.$isLoading ? 'not-allowed' : 'pointer'};
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  &:hover {
    background: ${props => props.disabled ? '#6c757d' : props.$isLoading ? '#6c757d' : '#218838'};
  }
`;

const LoadingSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ParticipantEntryForm: React.FC = () => {
  const { studyId } = useParams<{ studyId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [consentGiven, setConsentGiven] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleStartStudy = async () => {
    if (!studyId || !consentGiven) return;

    setIsLoading(true);

    try {
      const response = await authService.createParticipantSession(studyId);
      
      dispatch(setParticipantSession({
        sessionToken: response.sessionToken,
      }));

      dispatch(addNotification({
        type: 'success',
        message: 'Willkommen zur Studie!',
      }));

      // Navigate to the study participation page
      navigate(`/study/${studyId}/participate`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Fehler beim Starten der Studie. Bitte versuchen Sie es erneut.';
      
      dispatch(addNotification({
        type: 'error',
        message: errorMessage,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormContainer>
      <WelcomeText>
        <WelcomeTitle>Willkommen zur Mental Maps Studie</WelcomeTitle>
        <WelcomeDescription>
          Vielen Dank für Ihr Interesse an unserer sprachwissenschaftlichen Forschung. 
          In dieser Studie werden Sie gebeten, Ihre sprachlichen Wahrnehmungen auf einer 
          interaktiven Karte zu visualisieren.
        </WelcomeDescription>
      </WelcomeText>

      <ConsentSection>
        <ConsentTitle>Einverständniserklärung</ConsentTitle>
        <ConsentText>
          Mit Ihrer Teilnahme erklären Sie sich damit einverstanden, dass Ihre Antworten 
          anonymisiert für wissenschaftliche Zwecke verwendet werden. Ihre Daten werden 
          vertraulich behandelt und nicht an Dritte weitergegeben. Sie können die Teilnahme 
          jederzeit ohne Angabe von Gründen abbrechen.
        </ConsentText>
        <ConsentText>
          Die Studie dauert etwa 10-15 Minuten. Sie werden Audio-Aufnahmen anhören und 
          Ihre Wahrnehmungen auf einer Karte markieren.
        </ConsentText>
        
        <CheckboxContainer>
          <Checkbox
            type="checkbox"
            checked={consentGiven}
            onChange={(e) => setConsentGiven(e.target.checked)}
          />
          <CheckboxLabel>
            Ich habe die Informationen gelesen und erkläre mich mit der Teilnahme 
            an dieser Studie einverstanden. Ich bin damit einverstanden, dass meine 
            Antworten anonymisiert für wissenschaftliche Zwecke verwendet werden.
          </CheckboxLabel>
        </CheckboxContainer>
      </ConsentSection>

      <StartButton
        onClick={handleStartStudy}
        disabled={!consentGiven}
        $isLoading={isLoading}
      >
        {isLoading && <LoadingSpinner />}
        {isLoading ? 'Studie wird gestartet...' : 'Studie starten'}
      </StartButton>
    </FormContainer>
  );
};

export default ParticipantEntryForm;