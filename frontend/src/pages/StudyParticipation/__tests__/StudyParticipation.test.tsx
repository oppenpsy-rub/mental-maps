import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import StudyParticipation from '../StudyParticipation';
import { SessionProvider } from '../../../components/Session/SessionProvider';

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

// Mock the components that have complex dependencies
vi.mock('../../../components/Map/InteractiveMapWithDrawing', () => ({
    InteractiveMapWithDrawing: () => <div data-testid="interactive-map">Interactive Map</div>
}));

vi.mock('../../../components/Audio/AudioPlayerWithFeatures', () => ({
    AudioPlayerWithFeatures: () => <div data-testid="audio-player">Audio Player</div>
}));

vi.mock('../../../components/Drawing/DrawingToolbar', () => ({
    DrawingToolbar: ({ onToolChange }: any) => (
        <div data-testid="drawing-toolbar">
            <button onClick={() => onToolChange('pen')}>Pen Tool</button>
        </div>
    )
}));

const renderWithRouter = (component: React.ReactElement) => {
    return render(
        <BrowserRouter>
            <SessionProvider>
                {component}
            </SessionProvider>
        </BrowserRouter>
    );
};

describe('StudyParticipation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading screen initially', () => {
        renderWithRouter(<StudyParticipation />);

        expect(screen.getByText('Studie wird geladen...')).toBeInTheDocument();
    });

    it('renders error screen when study ID is missing', () => {
        // Mock useParams to return undefined studyId
        vi.mock('react-router-dom', async (importOriginal) => {
            const actual = await importOriginal<typeof import('react-router-dom')>();
            return {
                ...actual,
                useParams: () => ({ studyId: undefined })
            };
        });

        renderWithRouter(<StudyParticipation />);

        expect(screen.getByText('Fehler')).toBeInTheDocument();
        expect(screen.getByText('Keine Studie gefunden')).toBeInTheDocument();
    });

    // Add more tests as needed for specific functionality
    it('should handle session initialization', async () => {
        // This test would require more complex mocking of the session context
        // For now, we'll just verify the component renders without crashing
        renderWithRouter(<StudyParticipation />);

        expect(screen.getByText('Studie wird geladen...')).toBeInTheDocument();
    });
});