import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import StudyParticipationEntry from '../StudyParticipationEntry';
import { studyService } from '../../../services/studyService';
import { participantService } from '../../../services/participantService';

// Mock the services
vi.mock('../../../services/studyService', () => ({
  studyService: {
    getStudy: vi.fn(),
    getStudyQuestions: vi.fn()
  }
}));

vi.mock('../../../services/participantService', () => ({
  participantService: {
    createParticipantSession: vi.fn(),
    submitResponse: vi.fn(),
    submitDemographicData: vi.fn(),
    completeParticipation: vi.fn()
  }
}));

// Mock complex components
vi.mock('../../../components/Map/InteractiveMapWithDrawing', () => ({
  InteractiveMapWithDrawing: ({ onDrawingChange }: any) => (
    <div data-testid="interactive-map">
      <button onClick={() => onDrawingChange([{ id: 'test-element', type: 'pen' }])}>
        Draw Something
      </button>
    </div>
  )
}));

vi.mock('../../../components/Audio/AudioPlayerWithFeatures', () => ({
  AudioPlayerWithFeatures: ({ onPlay }: any) => (
    <div data-testid="audio-player">
      <button onClick={() => onPlay && onPlay()}>Play Audio</button>
    </div>
  )
}));

vi.mock('../../../components/Drawing/DrawingToolbar', () => ({
  DrawingToolbar: ({ onToolChange }: any) => (
    <div data-testid="drawing-toolbar">
      <button onClick={() => onToolChange('pen')}>Pen Tool</button>
    </div>
  )
}));

vi.mock('../../../components/Forms/DemographicForm', () => ({
  default: ({ onSubmit, onSkip }: any) => (
    <div data-testid="demographic-form">
      <button onClick={() => onSubmit({ age: 25 })}>Submit Demographics</button>
      <button onClick={() => onSkip()}>Skip Demographics</button>
    </div>
  )
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

// Mock useParams and useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useParams: () => ({ studyId: 'test-study' }),
    useNavigate: () => mockNavigate
  };
});

describe('StudyParticipationFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock responses
    vi.mocked(studyService.getStudy).mockResolvedValue({
      id: 'test-study',
      researcherId: 'researcher-1',
      title: 'Test Study',
      description: 'A test study for mental maps',
      active: true,
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      questions: [
        {
          id: 'q1',
          studyId: 'test-study',
          questionText: 'Where do you hear this dialect?',
          questionType: 'map_drawing',
          orderIndex: 0,
          configuration: {
            instructions: 'Draw on the map where you think this dialect is spoken.'
          }
        },
        {
          id: 'q2',
          studyId: 'test-study',
          questionText: 'Listen to this audio and mark the region',
          questionType: 'audio_response',
          orderIndex: 1,
          configuration: {
            audioFile: { id: 'audio1', filename: 'test.mp3' }
          }
        }
      ]
    });

    vi.mocked(studyService.getStudyQuestions).mockResolvedValue([
      {
        id: 'q1',
        studyId: 'test-study',
        questionText: 'Where do you hear this dialect?',
        questionType: 'map_drawing',
        orderIndex: 0
      },
      {
        id: 'q2',
        studyId: 'test-study',
        questionText: 'Listen to this audio and mark the region',
        questionType: 'audio_response',
        orderIndex: 1
      }
    ]);

    vi.mocked(participantService.createParticipantSession).mockResolvedValue({
      participantId: 'test-participant',
      sessionToken: 'test-token',
      studyId: 'test-study',
      expiresAt: new Date(Date.now() + 3600000).toISOString()
    });
  });

  it('completes full study participation flow', async () => {
    renderWithRouter(<StudyParticipationEntry />);

    // 1. Wait for study to load and show welcome screen
    await waitFor(() => {
      expect(screen.getByText('Test Study')).toBeInTheDocument();
    });

    expect(screen.getByText('A test study for mental maps')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Number of questions

    // 2. Give consent and start study
    const consentCheckbox = screen.getByRole('checkbox');
    fireEvent.click(consentCheckbox);

    const startButton = screen.getByText('Studie beginnen');
    expect(startButton).not.toBeDisabled();
    
    fireEvent.click(startButton);

    // 3. Wait for study interface to load
    await waitFor(() => {
      expect(screen.getByText('Where do you hear this dialect?')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Verify study interface elements are present
    expect(screen.getByText('Frage 1 von 2')).toBeInTheDocument();
    expect(screen.getByTestId('interactive-map')).toBeInTheDocument();
    expect(screen.getByTestId('drawing-toolbar')).toBeInTheDocument();

    // 4. Interact with the map (simulate drawing)
    const drawButton = screen.getByText('Draw Something');
    fireEvent.click(drawButton);

    // 5. Navigate to next question
    const nextButton = screen.getByText('Weiter →');
    fireEvent.click(nextButton);

    // 6. Verify second question loads
    await waitFor(() => {
      expect(screen.getByText('Listen to this audio and mark the region')).toBeInTheDocument();
    });

    expect(screen.getByText('Frage 2 von 2')).toBeInTheDocument();
    expect(screen.getByTestId('audio-player')).toBeInTheDocument();

    // 7. Interact with audio
    const playButton = screen.getByText('Play Audio');
    fireEvent.click(playButton);

    // 8. Complete the study (this should show demographics)
    const completeButton = screen.getByText('Abschließen →');
    fireEvent.click(completeButton);

    // 9. Handle demographics form
    await waitFor(() => {
      expect(screen.getByTestId('demographic-form')).toBeInTheDocument();
    });

    const submitDemographicsButton = screen.getByText('Submit Demographics');
    fireEvent.click(submitDemographicsButton);

    // 10. Verify completion screen
    await waitFor(() => {
      expect(screen.getByText('Vielen Dank für Ihre Teilnahme!')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Study')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Completed questions
    expect(screen.getByText('100%')).toBeInTheDocument(); // Completion percentage

    // 11. Complete the study
    const finishButton = screen.getByText('Studie beenden');
    fireEvent.click(finishButton);

    // Verify services were called correctly
    expect(studyService.getStudy).toHaveBeenCalledWith('test-study', true);
    expect(participantService.createParticipantSession).toHaveBeenCalledWith('test-study', true);
    expect(participantService.completeParticipation).toHaveBeenCalledWith('test-token');
  });

  it('handles study not found error', async () => {
    vi.mocked(studyService.getStudy).mockRejectedValue(new Error('Study not found'));

    renderWithRouter(<StudyParticipationEntry />);

    await waitFor(() => {
      expect(screen.getByText('Fehler beim Laden der Studie')).toBeInTheDocument();
    });

    expect(screen.getByText('Zurück zur Startseite')).toBeInTheDocument();
  });

  it('handles inactive study', async () => {
    vi.mocked(studyService.getStudy).mockResolvedValue({
      id: 'test-study',
      researcherId: 'researcher-1',
      title: 'Inactive Study',
      description: 'An inactive study',
      active: false,
      status: 'paused',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    });

    renderWithRouter(<StudyParticipationEntry />);

    await waitFor(() => {
      expect(screen.getByText('Diese Studie ist derzeit nicht aktiv')).toBeInTheDocument();
    });
  });

  it('allows skipping demographics', async () => {
    renderWithRouter(<StudyParticipationEntry />);

    // Go through the flow quickly to demographics
    await waitFor(() => {
      expect(screen.getByText('Test Study')).toBeInTheDocument();
    });

    const consentCheckbox = screen.getByRole('checkbox');
    fireEvent.click(consentCheckbox);
    fireEvent.click(screen.getByText('Studie beginnen'));

    await waitFor(() => {
      expect(screen.getByText('Where do you hear this dialect?')).toBeInTheDocument();
    });

    // Skip to completion by clicking next twice
    fireEvent.click(screen.getByText('Weiter →'));
    
    await waitFor(() => {
      expect(screen.getByText('Listen to this audio and mark the region')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Abschließen →'));

    // Skip demographics
    await waitFor(() => {
      expect(screen.getByTestId('demographic-form')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Skip Demographics'));

    // Should go to completion
    await waitFor(() => {
      expect(screen.getByText('Vielen Dank für Ihre Teilnahme!')).toBeInTheDocument();
    });
  });
});