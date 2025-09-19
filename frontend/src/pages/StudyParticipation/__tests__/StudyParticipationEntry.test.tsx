import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import StudyParticipationEntry from '../StudyParticipationEntry';

// Mock the services
vi.mock('../../../services/studyService', () => ({
  studyService: {
    getStudy: vi.fn().mockResolvedValue({
      id: 'test-study',
      title: 'Test Study',
      description: 'Test Description',
      active: true,
      questions: [
        { id: 'q1', questionText: 'Question 1', questionType: 'map_drawing' },
        { id: 'q2', questionText: 'Question 2', questionType: 'audio_response' }
      ]
    })
  }
}));

vi.mock('../../../services/participantService', () => ({
  participantService: {
    createParticipantSession: vi.fn().mockResolvedValue({
      participantId: 'test-participant',
      sessionToken: 'test-token'
    })
  }
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

// Mock useParams to return a study ID
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useParams: () => ({ studyId: 'test-study' }),
    useNavigate: () => vi.fn()
  };
});

describe('StudyParticipationEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading screen initially', () => {
    renderWithRouter(<StudyParticipationEntry />);
    
    expect(screen.getByText('Studie wird geladen...')).toBeInTheDocument();
  });

  it('renders study information after loading', async () => {
    renderWithRouter(<StudyParticipationEntry />);
    
    // Wait for the study to load
    await screen.findByText('Test Study');
    
    expect(screen.getByText('Test Study')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Number of questions
  });

  it('shows consent section', async () => {
    renderWithRouter(<StudyParticipationEntry />);
    
    await screen.findByText('Test Study');
    
    expect(screen.getByText('Einverständniserklärung')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.getByText('Studie beginnen')).toBeInTheDocument();
  });
});