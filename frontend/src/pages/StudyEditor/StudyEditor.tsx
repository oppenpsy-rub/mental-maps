import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Study, Question } from '../../types';
import { studyService } from '../../services/studyService';
import { Button } from '../../components/UI/Button';
import { Card } from '../../components/UI/Card';
import { Heading1, Heading2, Heading3, Text, SmallText } from '../../components/UI/Typography';
import {
  StudyBasicInfo,
  QuestionEditor,
  AudioUploadInterface,
  StudyPreview
} from './components';
import MapConfigurationEditor from './components/MapConfigurationEditor';

const EditorContainer = styled.div`
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

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
`;

const EditorLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 24px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SidebarCard = styled(Card)`
  padding: 16px;
`;

const QuestionsSection = styled.div``;

const QuestionsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const QuestionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const QuestionItem = styled(Card) <{ $isDragging?: boolean }>`
  padding: 16px;
  cursor: grab;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  
  ${props => props.$isDragging && `
    transform: rotate(5deg);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    border-color: ${props.theme.colors.primary};
  `}
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    cursor: grabbing;
  }
`;

const QuestionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
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
  color: ${props => props.theme.colors.textSecondary};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const QuestionActions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
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

const SuccessMessage = styled.div`
  background: #d4edda;
  color: #155724;
  padding: 12px 16px;
  border-radius: 4px;
  margin-bottom: 16px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 24px;
  color: ${props => props.theme.colors.textSecondary};
`;

// Sortable Question Item Component
interface SortableQuestionItemProps {
  question: Question;
  index: number;
  isActive: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  getQuestionTypeLabel: (type: string) => string;
}

const SortableQuestionItem: React.FC<SortableQuestionItemProps> = ({
  question,
  index,
  isActive,
  onEdit,
  onDelete,
  getQuestionTypeLabel
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id, disabled: isActive });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <QuestionItem
      ref={setNodeRef}
      style={style}
      $isDragging={isDragging}
      {...attributes}
    >
      <QuestionHeader>
        <QuestionTitle
          {...listeners}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          {index + 1}. {question.questionText || 'Unbenannte Frage'}
        </QuestionTitle>
        <QuestionType>
          {getQuestionTypeLabel(question.questionType)}
        </QuestionType>
      </QuestionHeader>

      {question.questionText && (
        <QuestionText>{question.questionText}</QuestionText>
      )}

      <QuestionActions>
        <Button
          variant="outline"
          size="small"
          onClick={() => onEdit(question.id)}
          disabled={isActive}
        >
          Bearbeiten
        </Button>
        <Button
          variant="danger"
          size="small"
          onClick={() => onDelete(question.id)}
          disabled={isActive}
        >
          Löschen
        </Button>
      </QuestionActions>
    </QuestionItem>
  );
};

interface StudyEditorProps {
  studyId?: string;
}

// Local storage key for draft questions
const DRAFT_QUESTIONS_KEY = 'draft_questions_';

const StudyEditor: React.FC<StudyEditorProps> = ({ studyId: propStudyId }) => {
  const { studyId: paramStudyId } = useParams<{ studyId: string }>();
  const navigate = useNavigate();
  const studyId = propStudyId || paramStudyId;
  const isNewStudy = !studyId;

  const [study, setStudy] = useState<Study | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);
  const [showAudioUpload, setShowAudioUpload] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load study data
  useEffect(() => {
    if (!isNewStudy && studyId) {
      loadStudy();
    } else {
      // Initialize new study
      setStudy({
        id: '',
        researcherId: '',
        title: '',
        description: '',
        active: false,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // For new studies, try to load any draft questions from localStorage
      try {
        const draftKey = DRAFT_QUESTIONS_KEY + 'new';
        const storedQuestions = localStorage.getItem(draftKey);
        if (storedQuestions) {
          const parsedQuestions = JSON.parse(storedQuestions);
          console.log('Loaded draft questions for new study:', parsedQuestions);
          setQuestions(parsedQuestions);
        }
      } catch (error) {
        console.warn('Failed to load draft questions:', error);
      }
    }
  }, [studyId, isNewStudy]);

  // Save questions to localStorage as backup
  const saveQuestionsToLocalStorage = (questionsToSave: Question[], studyIdForStorage: string) => {
    try {
      const draftKey = DRAFT_QUESTIONS_KEY + studyIdForStorage;
      localStorage.setItem(draftKey, JSON.stringify(questionsToSave));
      console.log('Saved questions to localStorage:', questionsToSave.length);
    } catch (error) {
      console.warn('Failed to save questions to localStorage:', error);
    }
  };

  // Clear localStorage backup when successfully saved to database
  const clearLocalStorageBackup = (studyIdForStorage: string) => {
    try {
      const draftKey = DRAFT_QUESTIONS_KEY + studyIdForStorage;
      localStorage.removeItem(draftKey);
      console.log('Cleared localStorage backup for study:', studyIdForStorage);
    } catch (error) {
      console.warn('Failed to clear localStorage backup:', error);
    }
  };

  const loadStudy = async () => {
    if (!studyId) return;

    try {
      setLoading(true);
      setError(null);

      const studyData = await studyService.getStudy(studyId, true);
      console.log('Loaded study data:', studyData);
      console.log('Study settings:', studyData.settings);
      console.log('Map configuration:', studyData.settings?.mapConfiguration);
      setStudy(studyData);

      // Load questions from database with localStorage fallback
      let loadedQuestions = studyData.questions || [];

      // Try to load questions from API first
      try {
        console.log('Loading questions for study:', studyId);
        loadedQuestions = await studyService.getStudyQuestions(studyId);
        console.log('Loaded questions from API:', loadedQuestions);
      } catch (apiError) {
        console.warn('Failed to load questions from API, trying localStorage:', apiError);
        
        // Fallback to localStorage
        try {
          const draftKey = DRAFT_QUESTIONS_KEY + studyId;
          const storedQuestions = localStorage.getItem(draftKey);
          if (storedQuestions) {
            const parsedQuestions = JSON.parse(storedQuestions);
            console.log('Loaded questions from localStorage:', parsedQuestions);
            loadedQuestions = parsedQuestions;
          }
        } catch (storageError) {
          console.error('Failed to load from localStorage:', storageError);
          loadedQuestions = []; // Ensure we have an empty array
        }
      }

      setQuestions(loadedQuestions);
      
      // Check if we have local changes that need to be synced
      const draftKey = DRAFT_QUESTIONS_KEY + studyId;
      const storedQuestions = localStorage.getItem(draftKey);
      if (storedQuestions && loadedQuestions.length === 0) {
        console.log('Found local questions that need to be synced');
        setSuccessMessage('Lokale Änderungen gefunden - diese werden beim nächsten Speichern synchronisiert');
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load study');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStudy = async (studyData: Partial<Study>) => {
    try {
      setSaving(true);
      setError(null);

      let savedStudy: Study;

      if (isNewStudy) {
        // Ensure we have default settings with map configuration
        const defaultSettings = {
          mapConfiguration: {
            center: [51.1657, 10.4515], // Germany center
            zoom: 6,
            bounds: null,
            allowedLayers: ['osm', 'satellite'],
            defaultLayer: 'osm'
          },
          ...studyData.settings
        };

        savedStudy = await studyService.createStudy({
          title: studyData.title!,
          description: studyData.description,
          settings: defaultSettings
        });

        // Save all existing questions to the new study
        if (questions.length > 0) {
          const savedQuestions: Question[] = [];
          for (const question of questions) {
            try {
              const questionData = {
                ...question,
                studyId: savedStudy.id
              };
              // Remove temporary ID if it exists
              if (question.id.startsWith('temp-')) {
                delete (questionData as any).id;
              }
              
              const savedQuestion = await studyService.createQuestion(savedStudy.id, questionData);
              savedQuestions.push(savedQuestion);
            } catch (err) {
              console.error('Failed to save question:', err);
              // Keep the question locally even if API fails
              savedQuestions.push({
                ...question,
                studyId: savedStudy.id
              });
            }
          }
          setQuestions(savedQuestions);
          
          // Save to localStorage as backup
          saveQuestionsToLocalStorage(savedQuestions, savedStudy.id);
        }

        // Navigate to the new study editor
        navigate(`/studies/${savedStudy.id}/edit`, { replace: true });
      } else {
        // Ensure existing studies also have map configuration
        const currentSettings = study?.settings || {};
        const updatedSettings = {
          ...currentSettings,
          mapConfiguration: currentSettings.mapConfiguration || {
            center: [51.1657, 10.4515], // Germany center
            zoom: 6,
            bounds: null,
            allowedLayers: ['osm', 'satellite'],
            defaultLayer: 'osm'
          },
          ...studyData.settings
        };

        savedStudy = await studyService.updateStudy(studyId!, {
          title: studyData.title,
          description: studyData.description,
          settings: updatedSettings
        });
        
        // Try to sync any local questions that haven't been saved to the server
        const tempQuestions = questions.filter(q => q.id.startsWith('temp-'));
        if (tempQuestions.length > 0) {
          console.log('Syncing temporary questions to server:', tempQuestions.length);
          const syncedQuestions = [...questions];
          
          for (const tempQuestion of tempQuestions) {
            try {
              const questionData = { ...tempQuestion };
              delete (questionData as any).id; // Remove temp ID
              
              const savedQuestion = await studyService.createQuestion(studyId!, questionData);
              // Replace temp question with saved question
              const index = syncedQuestions.findIndex(q => q.id === tempQuestion.id);
              if (index !== -1) {
                syncedQuestions[index] = savedQuestion;
              }
            } catch (err) {
              console.warn('Failed to sync temporary question:', err);
            }
          }
          
          setQuestions(syncedQuestions);
          // Clear localStorage backup after successful sync
          clearLocalStorageBackup(studyId!);
        }
      }

      setStudy(savedStudy);
      setSuccessMessage('Studie erfolgreich gespeichert');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save study');
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuestion = () => {
    setSelectedQuestionId(null);
    setShowQuestionEditor(true);
  };

  const handleEditQuestion = (questionId: string) => {
    setSelectedQuestionId(questionId);
    setShowQuestionEditor(true);
  };

  const getSelectedQuestion = (): Question | undefined => {
    if (!selectedQuestionId) return undefined;
    return questions.find(q => q.id === selectedQuestionId);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!window.confirm('Sind Sie sicher, dass Sie diese Frage löschen möchten?')) {
      return;
    }

    try {
      const updatedQuestions = questions.filter(q => q.id !== questionId);
      
      if (!isNewStudy && studyId) {
        try {
          await studyService.deleteQuestion(studyId, questionId);
          // Clear localStorage backup after successful API call
          clearLocalStorageBackup(studyId);
        } catch (apiError) {
          console.warn('API not available, saving to localStorage:', apiError);
          // Save to localStorage as backup
          saveQuestionsToLocalStorage(updatedQuestions, studyId);
        }
      }

      setQuestions(updatedQuestions);

      setSuccessMessage('Frage erfolgreich gelöscht');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete question');
    }
  };

  const handleQuestionSaved = async (question: Question) => {
    // Don't update questions during drag operations
    if (isDragging) {
      console.warn('Cannot save question during drag operation');
      return;
    }

    try {
      let savedQuestion: Question;
      let updatedQuestions: Question[];

      if (!isNewStudy && studyId) {
        try {
          if (selectedQuestionId) {
            // Update existing question in database
            savedQuestion = await studyService.updateQuestion(studyId, selectedQuestionId, question);
            updatedQuestions = questions.map(q => q.id === savedQuestion.id ? savedQuestion : q);
          } else {
            // Create new question with correct orderIndex
            const questionWithOrder = {
              ...question,
              orderIndex: questions.length
            };
            savedQuestion = await studyService.createQuestion(studyId, questionWithOrder);
            updatedQuestions = [...questions, savedQuestion];
          }
          
          setQuestions(updatedQuestions);
          // Clear localStorage backup after successful API call
          clearLocalStorageBackup(studyId);

        } catch (apiError: unknown) {
          console.warn('API Error when saving question, falling back to localStorage:', apiError);

          // Fallback to localStorage
          if (selectedQuestionId) {
            // Update existing question locally
            const tempQuestion = { ...question, id: selectedQuestionId };
            updatedQuestions = questions.map(q => q.id === selectedQuestionId ? tempQuestion : q);
          } else {
            // Create new question with temporary ID
            const tempId = `temp-${Date.now()}`;
            const tempQuestion = {
              ...question,
              id: tempId,
              orderIndex: questions.length,
              studyId: studyId
            };
            updatedQuestions = [...questions, tempQuestion];
          }
          
          setQuestions(updatedQuestions);
          // Save to localStorage as backup
          saveQuestionsToLocalStorage(updatedQuestions, studyId);
          
          setSuccessMessage('Frage lokal gespeichert (wird synchronisiert, wenn Server verfügbar ist)');
        }
      } else {
        // For new studies, allow creating questions locally
        const tempId = `temp-${Date.now()}`;
        const tempQuestion = {
          ...question,
          id: tempId,
          orderIndex: questions.length,
          studyId: studyId || 'new'
        };
        updatedQuestions = [...questions, tempQuestion];
        setQuestions(updatedQuestions);
        
        // Save to localStorage for new studies
        const storageKey = studyId || 'new';
        saveQuestionsToLocalStorage(updatedQuestions, storageKey);
        
        setSuccessMessage('Frage lokal gespeichert');
      }

      setShowQuestionEditor(false);
      setSelectedQuestionId(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save question');
    }
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setIsDragging(false);

    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = questions.findIndex((question) => question.id === active.id);
    const newIndex = questions.findIndex((question) => question.id === over.id);

    const updatedQuestions = arrayMove(questions, oldIndex, newIndex).map((question, index) => ({
      ...question,
      orderIndex: index
    }));

    setQuestions(updatedQuestions);

    // Save new order to backend and localStorage
    if (!isNewStudy && studyId) {
      try {
        // Only send questions with real IDs (not temporary ones)
        const realQuestions = updatedQuestions.filter(q => !q.id.startsWith('temp-'));

        if (realQuestions.length > 0) {
          const questionOrders = realQuestions.map(q => ({
            id: q.id,
            orderIndex: q.orderIndex
          }));
          await studyService.updateQuestionOrder(studyId, questionOrders);
          // Clear localStorage backup after successful API call
          clearLocalStorageBackup(studyId);
        }
      } catch (err) {
        console.warn('Failed to update question order via API, saving to localStorage:', err);
        // Save to localStorage as backup
        saveQuestionsToLocalStorage(updatedQuestions, studyId);
      }
    } else if (studyId) {
      // For new studies, save to localStorage
      saveQuestionsToLocalStorage(updatedQuestions, studyId);
    }
  };

  const handlePreviewStudy = () => {
    if (isNewStudy && (!study?.title || study.title.trim() === '')) {
      setError('Bitte speichern Sie die Studie zuerst, bevor Sie eine Vorschau anzeigen.');
      return;
    }
    setShowPreview(true);
  };

  const handlePublishStudy = async () => {
    if (!study) return;

    try {
      // Ensure the study has map configuration before activating
      const currentSettings = study.settings || {};
      if (!currentSettings.mapConfiguration) {
        console.log('Adding default map configuration before activation');
        const updatedSettings = {
          ...currentSettings,
          mapConfiguration: {
            center: [51.1657, 10.4515], // Germany center
            zoom: 6,
            bounds: null,
            allowedLayers: ['osm', 'satellite'],
            defaultLayer: 'osm'
          }
        };

        // Update the study with map configuration
        await studyService.updateStudy(study.id, {
          settings: updatedSettings
        });

        // Update local state
        setStudy(prev => prev ? { ...prev, settings: updatedSettings } : prev);
      }

      await studyService.activateStudy(study.id, 'Published from editor');
      await loadStudy(); // Reload to get updated status
      setSuccessMessage('Studie erfolgreich veröffentlicht');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish study');
    }
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

  if (loading) {
    return (
      <EditorContainer>
        <LoadingContainer>
          <Text>Lade Studie...</Text>
        </LoadingContainer>
      </EditorContainer>
    );
  }

  if (!study) {
    return (
      <EditorContainer>
        <ErrorMessage>Studie nicht gefunden</ErrorMessage>
      </EditorContainer>
    );
  }

  return (
    <EditorContainer>
      <Header>
        <Title>{isNewStudy ? 'Neue Studie erstellen' : 'Studie bearbeiten'}</Title>
        <ActionButtons>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Zurück
          </Button>
          <Button variant="outline" onClick={handlePreviewStudy}>
            Vorschau
          </Button>
          <Button
            variant="success"
            onClick={handlePublishStudy}
            disabled={isNewStudy || study.active || questions.length === 0}
          >
            Veröffentlichen
          </Button>
        </ActionButtons>
      </Header>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {successMessage && <SuccessMessage>{successMessage}</SuccessMessage>}

      <EditorLayout>
        <MainContent>
          {/* Basic Study Information */}
          <StudyBasicInfo
            study={study}
            onSave={handleSaveStudy}
            saving={saving}
            disabled={study.active}
          />

          {/* Map Configuration */}
          {!isNewStudy && (
            <MapConfigurationEditor
              configuration={study.settings?.mapConfiguration || {}}
              onConfigurationChange={(mapConfig) => {
                console.log('Map configuration changed:', mapConfig);
                const updatedStudy = {
                  ...study,
                  settings: {
                    ...study.settings,
                    mapConfiguration: mapConfig
                  }
                };
                console.log('Saving study with updated settings:', updatedStudy.settings);
                handleSaveStudy(updatedStudy);
              }}
            />
          )}

          {/* Questions Section */}
          <QuestionsSection>
            <QuestionsHeader>
              <Heading2>Fragen ({questions.length})</Heading2>
              <Button
                variant="primary"
                onClick={handleAddQuestion}
                disabled={study.active || isNewStudy}
              >
                Frage hinzufügen
              </Button>
            </QuestionsHeader>

            {questions.length === 0 ? (
              <EmptyState>
                <Heading3 style={{ marginBottom: '16px' }}>
                  Keine Fragen vorhanden
                </Heading3>
                <Text style={{ marginBottom: '24px' }}>
                  {isNewStudy
                    ? 'Speichern Sie zuerst die Studie, bevor Sie Fragen hinzufügen können.'
                    : 'Fügen Sie Fragen hinzu, um Ihre Studie zu erstellen.'
                  }
                </Text>
                <Button
                  variant="primary"
                  onClick={handleAddQuestion}
                  disabled={isNewStudy}
                >
                  Erste Frage hinzufügen
                </Button>
              </EmptyState>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={questions.map(q => q.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <QuestionsList>
                    {questions.map((question, index) => (
                      <SortableQuestionItem
                        key={question.id}
                        question={question}
                        index={index}
                        isActive={study.active}
                        onEdit={handleEditQuestion}
                        onDelete={handleDeleteQuestion}
                        getQuestionTypeLabel={getQuestionTypeLabel}
                      />
                    ))}
                  </QuestionsList>
                </SortableContext>
              </DndContext>
            )}
          </QuestionsSection>
        </MainContent>

        <Sidebar>
          <SidebarCard>
            <Heading3 style={{ marginBottom: '12px' }}>Status</Heading3>
            <Text style={{ marginBottom: '8px' }}>
              <strong>Status:</strong> {study.status}
            </Text>
            <Text style={{ marginBottom: '8px' }}>
              <strong>Aktiv:</strong> {study.active ? 'Ja' : 'Nein'}
            </Text>
            <Text style={{ marginBottom: '0' }}>
              <strong>Fragen:</strong> {questions.length}
            </Text>
          </SidebarCard>

          <SidebarCard>
            <Heading3 style={{ marginBottom: '12px' }}>Audio-Dateien</Heading3>
            <Text style={{ marginBottom: '16px' }}>
              Verwalten Sie Audio-Stimuli für Ihre Fragen.
            </Text>
            <Button
              variant="outline"
              onClick={() => setShowAudioUpload(true)}
              disabled={study.active}
              style={{ width: '100%' }}
            >
              Audio hochladen
            </Button>
          </SidebarCard>

          <SidebarCard>
            <Heading3 style={{ marginBottom: '12px' }}>Hilfe</Heading3>
            <SmallText style={{ marginBottom: '8px' }}>
              • Ziehen Sie Fragen, um die Reihenfolge zu ändern
            </SmallText>
            <SmallText style={{ marginBottom: '8px' }}>
              • Aktive Studien können nicht bearbeitet werden
            </SmallText>
            <SmallText>
              • Mindestens eine Frage ist für die Veröffentlichung erforderlich
            </SmallText>
          </SidebarCard>
        </Sidebar>
      </EditorLayout>

      {/* Question Editor Modal */}
      {showQuestionEditor && (
        <QuestionEditor
          studyId={study.id}
          questionId={selectedQuestionId}
          existingQuestion={getSelectedQuestion()}
          onSave={handleQuestionSaved}
          onCancel={() => {
            setShowQuestionEditor(false);
            setSelectedQuestionId(null);
          }}
        />
      )}

      {/* Audio Upload Modal */}
      {showAudioUpload && (
        <AudioUploadInterface
          studyId={study.id}
          onClose={() => setShowAudioUpload(false)}
        />
      )}

      {/* Study Preview Modal */}
      {showPreview && (
        <StudyPreview
          studyId={isNewStudy ? undefined : study.id}
          study={study}
          questions={questions}
          onClose={() => setShowPreview(false)}
          onPublish={handlePublishStudy}
        />
      )}
    </EditorContainer>
  );
};

export default StudyEditor;