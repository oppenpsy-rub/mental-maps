import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
// Session components removed - using local participant session management
import { ProfessionalMapWithDrawing } from '../../components/Map/ProfessionalMapWithDrawing';
import { DrawingControls } from '../../components/Map/DrawingControls';
import { AudioPlayerWithFeatures } from '../../components/Audio/AudioPlayerWithFeatures';
import DemographicForm, { DemographicFormData } from '../../components/Forms/DemographicForm';

import { QuestionNavigator, QuestionDisplay, StudyCompletion } from './components';
import { Button } from '../../components/UI/Button';
import { Card } from '../../components/UI/Card';
import { studyService } from '../../services/studyService';
import { participantService } from '../../services/participantService';

import { Study, Question } from '../../types';
import { DrawingTool } from '../../types/drawing';

interface StudyParticipationProps {}

const ParticipationContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const Header = styled.div`
  background: rgba(255, 255, 255, 0.95);
  padding: 16px 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
`;

const StudyTitle = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #2d3748;
`;

const HeaderControls = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 24px;
  gap: 24px;
`;



const InteractionArea = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 24px;
  min-height: 0;
`;

const MapSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
`;

const MapContainer = styled.div`
  flex: 1;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-height: 400px;
`;

const SidePanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const AudioSection = styled(Card)`
  padding: 20px;
`;

const DemographicSection = styled.div`
  padding: 24px;
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



// Main component with session management
const StudyParticipationContent: React.FC = () => {
  const { studyId } = useParams<{ studyId: string }>();
  const navigate = useNavigate();
  // Local session state management instead of SessionProvider
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [drawingStates, setDrawingStates] = useState<Record<string, any>>({});
  const [completedQuestions, setCompletedQuestions] = useState<number[]>([]);
  const [startTime] = useState(Date.now());
  const [lastSaveTime, setLastSaveTime] = useState<Date>(new Date());

  // Local session functions
  const initializeSession = useCallback(async (_participantId: string, _studyId: string, _questionsData: Question[]) => {
    // Just set initial state - no remote session needed
    setCurrentQuestionIndex(0);
    setResponses({});
    setDrawingStates({});
    setCompletedQuestions([]);
    setLastSaveTime(new Date());
  }, []);

  const updateResponse = useCallback(async (questionId: string, responseData: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: responseData
    }));
    setLastSaveTime(new Date());
  }, []);



  const goToNextQuestion = useCallback(async () => {
    setCurrentQuestionIndex(prev => prev + 1);
  }, []);

  const goToPreviousQuestion = useCallback(async () => {
    setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
  }, []);

  const goToQuestion = useCallback(async (index: number) => {
    setCurrentQuestionIndex(index);
  }, []);

  const markQuestionComplete = useCallback(async (questionIndex: number) => {
    setCompletedQuestions(prev => 
      prev.includes(questionIndex) ? prev : [...prev, questionIndex]
    );
  }, []);

  const clearSession = useCallback(async () => {
    setCurrentQuestionIndex(0);
    setResponses({});
    setDrawingStates({});
    setCompletedQuestions([]);
  }, []);

  const [study, setStudy] = useState<Study | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  // Create a mock session object for compatibility (after questions is declared)
  const session = {
    currentQuestionIndex,
    responses,
    drawingStates,
    progress: {
      completedQuestions,
      totalQuestions: questions.length,
      startTime,
      lastSaveTime
    }
  };
  const [isLoading, setIsLoading] = useState(false);
  const sessionLoading = false; // No remote session loading needed
  const [error, setError] = useState<string | null>(null);
  const [currentDrawing, setCurrentDrawing] = useState<any[]>([]);
  const [activeTool, setActiveTool] = useState<DrawingTool>(DrawingTool.SELECT);
  const [toolSettings, setToolSettings] = useState({
    strokeColor: '#3b82f6',
    strokeWidth: 3,
    fillColor: '#3b82f6',
    fillOpacity: 0.2
  });

  const [showDemographics, setShowDemographics] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [participantToken, setParticipantToken] = useState<string | null>(null);
  const [audioStimulus, setAudioStimulus] = useState<any>(null);

  // Load study data
  useEffect(() => {
    const loadStudy = async () => {
      if (!studyId || study) {
        return;
      }

      try {
        setIsLoading(true);
        const studyData = await studyService.getStudy(studyId, true);
        const questionsData = await studyService.getStudyQuestions(studyId);
        
        setStudy(studyData);
        setQuestions(questionsData);

        // Create participant session if not already done
        if (!session && questionsData.length > 0) {
          try {
            const sessionData = await participantService.createParticipantSession(studyId, true);
            setParticipantToken(sessionData.sessionToken);
            await initializeSession(sessionData.participantId, studyId, questionsData);
          } catch (error) {
            console.error('Failed to create participant session:', error);
            // Fallback to local session
            const participantId = `participant_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
            await initializeSession(participantId, studyId, questionsData);
          }
        }
      } catch (err) {
        console.error('Failed to load study:', err);
        setError('Fehler beim Laden der Studie');
      } finally {
        setIsLoading(false);
      }
    };

    loadStudy();
  }, [studyId]);

  // Get current question
  const currentQuestion = session && questions.length > 0 
    ? questions[session.currentQuestionIndex] 
    : null;

  // Load audio stimulus for current question
  useEffect(() => {
    if (currentQuestion?.questionType === 'audio_response' && currentQuestion.configuration?.audioFile) {
      setAudioStimulus({
        id: currentQuestion.id,
        filename: currentQuestion.configuration.audioFile.filename,
        url: `/api/audio/${currentQuestion.configuration.audioFile.id}`
      });
    } else {
      setAudioStimulus(null);
    }
  }, [currentQuestion]);

  // Debounced submission to prevent too many API calls
  const [submissionTimeout, setSubmissionTimeout] = useState<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (submissionTimeout) {
        clearTimeout(submissionTimeout);
      }
    };
  }, [submissionTimeout]);

  // Restore drawing when question changes
  useEffect(() => {
    if (currentQuestion && drawingStates[currentQuestion.id]) {
      const savedDrawing = drawingStates[currentQuestion.id].elements;
      setCurrentDrawing(savedDrawing);
      drawingElementsRef.current = savedDrawing;
    } else {
      setCurrentDrawing([]);
      drawingElementsRef.current = [];
    }
  }, [currentQuestion?.id, drawingStates]);

  // Use ref to avoid setState during render
  const drawingElementsRef = useRef<any[]>([]);
  
  // Handle drawing changes - store in ref to avoid setState during render
  const handleDrawingChange = useCallback((elements: any[]) => {
    drawingElementsRef.current = elements;
    // Trigger a state update asynchronously
    setTimeout(() => {
      setCurrentDrawing(elements);
    }, 0);
  }, []);

  // Separate effect for server submission to avoid setState during render
  useEffect(() => {
    const elements = drawingElementsRef.current;
    if (!currentQuestion || !participantToken || elements.length === 0) {
      return;
    }

    // Debounce server submission
    if (submissionTimeout) {
      clearTimeout(submissionTimeout);
    }

    const newTimeout = setTimeout(async () => {
      try {
        const drawingState = {
          elements: elements,
          activeTool: DrawingTool.PEN,
          toolSettings: {
            strokeColor: '#000000',
            strokeWidth: 2
          },
          isDrawing: false,
          canUndo: false,
          canRedo: false
        };

        // Store drawing data locally
        setDrawingStates(prev => ({
          ...prev,
          [currentQuestion.id]: drawingState
        }));
        setLastSaveTime(new Date());

        const responsePayload = {
          questionId: currentQuestion.id,
          responseData: {
            textResponse: `Mental map with ${elements.length} elements`,
            interactionEvents: [{
              timestamp: Date.now(),
              event: 'drawing_completed',
              data: { elementCount: elements.length }
            }]
          },
          mapDrawing: {
            bounds: null,
            drawingData: {
              version: '1.0',
              canvasData: drawingState,
              metadata: {
                totalElements: elements.length,
                drawingDuration: Date.now() - startTime,
                canvasSize: { width: 800, height: 600 }
              }
            },
            elements: elements.map(element => ({
              type: element.type || 'polygon',
              geometry: element.geometry || {
                type: 'Polygon',
                coordinates: element.coordinates || [[[0,0],[1,0],[1,1],[0,1],[0,0]]]
              },
              style: element.style || toolSettings,
              metadata: {
                label: element.label || 'Drawing Element',
                createdWith: 'Drawing Tool'
              }
            }))
          },
          responseTimeMs: Date.now() - startTime
        };

        await participantService.submitResponse(participantToken, responsePayload);
        console.log('Response submitted successfully for question:', currentQuestion.id);
      } catch (error) {
        console.error('Failed to submit response to server:', error);
      }
    }, 500); // Wait 0.5 seconds after last change

    setSubmissionTimeout(newTimeout);

    // Cleanup function
    return () => {
      if (newTimeout) {
        clearTimeout(newTimeout);
      }
    };
  }, [currentQuestion?.id, participantToken, toolSettings, startTime]);

  // Drawing control handlers
  const handleToolChange = useCallback((tool: DrawingTool) => {
    setActiveTool(tool);
  }, []);

  const handleToolSettingsChange = useCallback((settings: any) => {
    setToolSettings(settings);
  }, []);

  const handleUndo = useCallback(() => {
    if (currentDrawing.length > 0) {
      const newDrawing = currentDrawing.slice(0, -1);
      setCurrentDrawing(newDrawing);
    }
  }, [currentDrawing]);

  const handleClearDrawing = useCallback(() => {
    setCurrentDrawing([]);
  }, []);

  const handleElementDelete = useCallback((elementId: string) => {
    const newDrawing = currentDrawing.filter(el => el.id !== elementId);
    setCurrentDrawing(newDrawing);
  }, [currentDrawing]);

  // Handle audio response
  const handleAudioResponse = useCallback(async (responseData: any) => {
    if (session && currentQuestion) {
      await updateResponse(currentQuestion.id, {
        type: 'audio_response',
        data: responseData,
        timestamp: Date.now()
      });
    }
  }, [session, currentQuestion, updateResponse]);

  // Handle demographic form submission
  const handleDemographicSubmit = useCallback(async (data: DemographicFormData) => {
    if (session) {
      await updateResponse('demographics', {
        type: 'demographic',
        data,
        timestamp: Date.now()
      });
      
      // Submit to server if we have a token
      if (participantToken) {
        try {
          await participantService.submitDemographicData(participantToken, data);
        } catch (error) {
          console.error('Failed to submit demographic data to server:', error);
        }
      }
      
      setShowDemographics(false);
      setIsCompleted(true);
    }
  }, [session, participantToken, updateResponse]);

  // Handle demographic skip
  const handleDemographicSkip = useCallback(() => {
    setShowDemographics(false);
  }, []);

  // Handle next question
  const handleNext = useCallback(async () => {
    if (!session || !currentQuestion) return;

    // Mark current question as complete
    await markQuestionComplete(session.currentQuestionIndex);

    // Check if this is the last question
    if (session.currentQuestionIndex >= questions.length - 1) {
      // Show demographics form if not shown yet
      if (!session.responses.demographics) {
        setShowDemographics(true);
      } else {
        // Complete the study
        setIsCompleted(true);
      }
    } else {
      // Go to next question
      await goToNextQuestion();
      setCurrentDrawing([]); // Reset drawing for new question
    }
  }, [session, currentQuestion, questions.length, markQuestionComplete, goToNextQuestion]);

  // Handle previous question
  const handlePrevious = useCallback(async () => {
    if (session && session.currentQuestionIndex > 0) {
      await goToPreviousQuestion();
      // Load previous drawing if exists
      const prevQuestion = questions[session.currentQuestionIndex - 1];
      if (prevQuestion && session.drawingStates[prevQuestion.id]) {
        setCurrentDrawing(session.drawingStates[prevQuestion.id].elements);
      }
    }
  }, [session, questions, goToPreviousQuestion]);

  // Handle study completion
  const handleComplete = useCallback(async () => {
    if (participantToken) {
      try {
        await participantService.completeParticipation(participantToken);
      } catch (error) {
        console.error('Failed to complete participation on server:', error);
      }
    }
    await clearSession();
    navigate('/');
  }, [participantToken, clearSession, navigate]);

  // Handle going to specific question
  const handleGoToQuestion = useCallback(async (index: number) => {
    if (session && index >= 0 && index < questions.length) {
      await goToQuestion(index);
      
      // Load drawing for the target question
      const targetQuestion = questions[index];
      if (targetQuestion && session.drawingStates[targetQuestion.id]) {
        setCurrentDrawing(session.drawingStates[targetQuestion.id].elements);
      } else {
        setCurrentDrawing([]);
      }
    }
  }, [session, questions, goToQuestion]);

  // Loading state
  if (isLoading || sessionLoading) {
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

  // Completion state
  if (isCompleted && session) {
    const studyDuration = Date.now() - session.progress.startTime;
    
    return (
      <StudyCompletion
        studyTitle={study?.title || 'Studie'}
        completedQuestions={session.progress.completedQuestions.length}
        totalQuestions={session.progress.totalQuestions}
        studyDuration={studyDuration}
        onComplete={handleComplete}
        showDataDownload={false}
      />
    );
  }

  // Demographics form
  if (showDemographics) {
    return (
      <ParticipationContainer>
        <Header>
          <StudyTitle>{study?.title || 'Studie'}</StudyTitle>
          <HeaderControls>
            <div style={{ fontSize: '14px', color: '#666' }}>
              Frage {currentQuestionIndex + 1} von {questions.length}
            </div>
          </HeaderControls>
        </Header>
        <DemographicSection>
          <DemographicForm
            onSubmit={handleDemographicSubmit}
            onSkip={handleDemographicSkip}
          />
        </DemographicSection>
      </ParticipationContainer>
    );
  }

  // Main study interface
  return (
    <ParticipationContainer>
      <Header>
        <StudyTitle>{study?.title || 'Studie'}</StudyTitle>
        <HeaderControls>
          <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}>
            <div style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
              Frage {currentQuestionIndex + 1} von {questions.length}
            </div>
            <div style={{ fontSize: '12px', color: '#999' }}>
              Zuletzt gespeichert: {lastSaveTime.toLocaleTimeString()}
            </div>
          </div>
        </HeaderControls>
      </Header>

      <MainContent>
        {currentQuestion && session && (
          <>
            <QuestionDisplay
              question={currentQuestion}
              questionNumber={session.currentQuestionIndex + 1}
              totalQuestions={questions.length}
            />

            <InteractionArea>
              <MapSection>

                <MapContainer>
                  <ProfessionalMapWithDrawing
                    onDrawingChange={handleDrawingChange}
                    enableDrawing={true}
                    initialTool={activeTool}
                    center={study?.settings?.mapConfiguration?.center as [number, number] || [52.52, 13.405]}
                    initialZoom={study?.settings?.mapConfiguration?.initialZoom || 10}
                    minZoom={study?.settings?.mapConfiguration?.minZoom || 3}
                    maxZoom={study?.settings?.mapConfiguration?.maxZoom || 18}
                    mapStyle={study?.settings?.mapConfiguration?.mapStyle as any || 'satellite'}
                    drawingData={currentDrawing}
                    style={{ height: '100%', width: '100%' }}
                  />
                </MapContainer>
              </MapSection>

              <SidePanel>
                {/* Zeichenwerkzeuge */}
                <DrawingControls
                  activeTool={activeTool}
                  toolSettings={toolSettings}
                  elements={currentDrawing}
                  onToolChange={handleToolChange}
                  onToolSettingsChange={handleToolSettingsChange}
                  onUndo={handleUndo}
                  onClear={handleClearDrawing}
                  onElementDelete={handleElementDelete}
                  canUndo={currentDrawing.length > 0}
                />

                {currentQuestion.questionType === 'audio_response' && audioStimulus && (
                  <AudioSection>
                    <AudioPlayerWithFeatures
                      stimulus={audioStimulus}
                      enableRepeat={true}
                      enableProgressVisualization={true}
                      onPlay={() => handleAudioResponse({ action: 'play', timestamp: Date.now() })}
                      onPause={() => handleAudioResponse({ action: 'pause', timestamp: Date.now() })}
                    />
                  </AudioSection>
                )}
                
                <QuestionNavigator
                  questions={questions}
                  currentIndex={session.currentQuestionIndex}
                  completedQuestions={session.progress.completedQuestions.length}
                  onPrevious={handlePrevious}
                  onNext={handleNext}
                  onGoToQuestion={handleGoToQuestion}
                  canGoBack={session.currentQuestionIndex > 0}
                  canGoForward={true}
                  isLoading={sessionLoading}
                />
              </SidePanel>
            </InteractionArea>
          </>
        )}
      </MainContent>
    </ParticipationContainer>
  );
};

// Wrapper component with SessionProvider
const StudyParticipation: React.FC<StudyParticipationProps> = () => {
  const { studyId } = useParams<{ studyId: string }>();

  if (!studyId) {
    return (
      <ErrorScreen>
        <h2>Fehler</h2>
        <p>Keine Studie gefunden</p>
      </ErrorScreen>
    );
  }

  return <StudyParticipationContent />;
};

export default StudyParticipation;