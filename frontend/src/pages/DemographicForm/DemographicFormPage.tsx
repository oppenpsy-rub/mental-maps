import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import DemographicForm, { DemographicFormData } from '../../components/Forms/DemographicForm';
import { demographicService } from '../../services/demographicService';
import { addNotification } from '../../store/slices/uiSlice';
import { Card } from '../../components/UI/Card';

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ContentWrapper = styled.div`
  width: 100%;
  max-width: 900px;
`;

const HeaderCard = styled(Card)`
  text-align: center;
  padding: 32px;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  color: #212529;
  margin-bottom: 12px;
  font-size: 2rem;
  font-weight: 700;
`;

const Subtitle = styled.p`
  color: #6c757d;
  font-size: 1.125rem;
  line-height: 1.6;
  margin: 0;
`;

const ProgressIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 24px;
`;

const ProgressStep = styled.div<{ $active?: boolean; $completed?: boolean }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => 
    props.$completed ? '#28a745' : 
    props.$active ? '#007bff' : 
    '#e9ecef'
  };
  transition: background-color 0.2s ease;
`;

const ProgressLabel = styled.span`
  color: #6c757d;
  font-size: 0.875rem;
  margin-left: 8px;
`;

const DemographicFormPage: React.FC = () => {
  const { studyId } = useParams<{ studyId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [isLoading, setIsLoading] = useState(false);
  const [initialData, setInitialData] = useState<Partial<DemographicFormData> | undefined>();

  useEffect(() => {
    // Load existing demographic data if available
    const loadExistingData = async () => {
      try {
        const existingData = await demographicService.getDemographicData();
        if (existingData) {
          setInitialData(demographicService.transformApiDataToFormFormat(existingData));
        }
      } catch (error) {
        // No existing data or error loading - that's fine, start fresh
        console.log('No existing demographic data found');
      }
    };

    loadExistingData();
  }, []);

  const handleSubmit = async (data: DemographicFormData) => {
    if (!studyId) {
      dispatch(addNotification({
        type: 'error',
        message: 'Studie nicht gefunden. Bitte starten Sie die Studie erneut.',
      }));
      return;
    }

    setIsLoading(true);

    try {
      // Validate data
      const validation = demographicService.validateDemographicData(data);
      if (!validation.isValid) {
        dispatch(addNotification({
          type: 'error',
          message: `Validierungsfehler: ${validation.errors.join(', ')}`,
        }));
        setIsLoading(false);
        return;
      }

      // Transform and submit data
      const apiData = demographicService.transformFormDataToApiFormat(data);
      await demographicService.updateDemographicData(apiData);

      dispatch(addNotification({
        type: 'success',
        message: 'Demografische Daten erfolgreich gespeichert!',
      }));

      // Navigate to the study participation
      navigate(`/study/${studyId}/participate`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
        'Fehler beim Speichern der demografischen Daten. Bitte versuchen Sie es erneut.';
      
      dispatch(addNotification({
        type: 'error',
        message: errorMessage,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    if (!studyId) {
      dispatch(addNotification({
        type: 'error',
        message: 'Studie nicht gefunden. Bitte starten Sie die Studie erneut.',
      }));
      return;
    }

    dispatch(addNotification({
      type: 'info',
      message: 'Demografische Daten übersprungen.',
    }));

    // Navigate directly to study participation
    navigate(`/study/${studyId}/participate`);
  };

  return (
    <PageContainer>
      <ContentWrapper>
        <HeaderCard>
          <Title>Demografische Angaben</Title>
          <Subtitle>
            Helfen Sie uns, die Ergebnisse besser zu verstehen, indem Sie einige 
            optionale Angaben zu Ihrem Hintergrund machen.
          </Subtitle>
        </HeaderCard>

        <ProgressIndicator>
          <ProgressStep $completed />
          <ProgressStep $active />
          <ProgressStep />
          <ProgressLabel>Schritt 2 von 3: Demografische Daten</ProgressLabel>
        </ProgressIndicator>

        <DemographicForm
          onSubmit={handleSubmit}
          onSkip={handleSkip}
          isLoading={isLoading}
          initialData={initialData}
        />
      </ContentWrapper>
    </PageContainer>
  );
};

export default DemographicFormPage;