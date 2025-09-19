import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThemeProvider } from 'styled-components';
import StudyPreview from '../StudyPreview';
import { theme } from '../../../../styles/theme';
import { studyService } from '../../../../services/studyService';
import { Study, Question } from '../../../../types';

// Mock the study service
vi.mock('../../../../services/studyService');

const mockStudyService = studyService as any;

const mockStudy: Study = {
  id: '1',
  researcherId: 'researcher1',
  title: 'Test Study',
  description: 'Test Description',
  active: false,
  status: 'draft',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-02T00:00:00Z'
};

const mockQuestions: Question[] = [
  {
    id: 'q1',
    studyId: '1',
    questionText: 'Test Question 1',
    questionType: 'map_drawing',
    orderIndex: 0,
    configuration: {
      allowedDrawingTools: ['pen', 'line']
    }
  },
  {
    id: 'q2',
    studyId: '1',
    questionText: 'Test Question 2',
    questionType: 'rating',
    orderIndex: 1,
    configuration: {
      ratingScale: { min: 1, max: 5 }
    }
  }
];

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('StudyPreview', () => {
  const mockOnClose = vi.fn();
  const mockOnPublish = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockStudyService.getStudy.mockResolvedValue({
      ...mockStudy,
      questions: mockQuestions
    });
    
    mockStudyService.getStudyStatus.mockResolvedValue({
      currentStatus: 'draft',
      statusHistory: [],
      validTransitions: ['ready', 'archived'],
      canActivate: true,
      validationErrors: []
    });
  });

  it('should render study preview with study information', async () => {
    renderWithTheme(
      <StudyPreview
        studyId="1"
        onClose={mockOnClose}
        onPublish={mockOnPublish}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Studienvorschau')).toBeInTheDocument();
      expect(screen.getByText('Test Study')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
    });

    expect(screen.getByText('draft')).toBeInTheDocument();
    expect(screen.getByText('Nein')).toBeInTheDocument(); // Active status
    
    // Check for number of questions in the meta section
    const metaItems = screen.getAllByText('2');
    expect(metaItems.length).toBeGreaterThan(0); // Should find the number of questions
  });

  it('should display questions in correct order', async () => {
    renderWithTheme(
      <StudyPreview
        studyId="1"
        onClose={mockOnClose}
        onPublish={mockOnPublish}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Fragen (2)')).toBeInTheDocument();
      expect(screen.getByText('Test Question 1')).toBeInTheDocument();
      expect(screen.getByText('Test Question 2')).toBeInTheDocument();
    });

    expect(screen.getByText('Karten-Zeichnung')).toBeInTheDocument();
    expect(screen.getByText('Bewertung')).toBeInTheDocument();
  });

  it('should show question configurations', async () => {
    renderWithTheme(
      <StudyPreview
        studyId="1"
        onClose={mockOnClose}
        onPublish={mockOnPublish}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Verfügbare Zeichenwerkzeuge:')).toBeInTheDocument();
      expect(screen.getByText('Stift')).toBeInTheDocument();
      expect(screen.getByText('Linie')).toBeInTheDocument();
    });

    expect(screen.getByText('Bewertungsskala:')).toBeInTheDocument();
    expect(screen.getByText('Von 1 bis 5')).toBeInTheDocument();
  });

  it('should show validation success when study is valid', async () => {
    renderWithTheme(
      <StudyPreview
        studyId="1"
        onClose={mockOnClose}
        onPublish={mockOnPublish}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('✓ Studie ist bereit zur Veröffentlichung')).toBeInTheDocument();
      expect(screen.getByText('Alle Anforderungen sind erfüllt. Die Studie kann veröffentlicht werden.')).toBeInTheDocument();
    });

    const publishButton = screen.getByText('Veröffentlichen');
    expect(publishButton).not.toBeDisabled();
  });

  it('should show validation errors when study is invalid', async () => {
    mockStudyService.getStudyStatus.mockResolvedValue({
      currentStatus: 'draft',
      statusHistory: [],
      validTransitions: ['ready', 'archived'],
      canActivate: false,
      validationErrors: ['Study must have at least one question', 'Map configuration is missing']
    });

    renderWithTheme(
      <StudyPreview
        studyId="1"
        onClose={mockOnClose}
        onPublish={mockOnPublish}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('⚠ Studie hat Validierungsfehler')).toBeInTheDocument();
      expect(screen.getByText('Study must have at least one question')).toBeInTheDocument();
      expect(screen.getByText('Map configuration is missing')).toBeInTheDocument();
    });

    const publishButton = screen.getByText('Veröffentlichen');
    expect(publishButton).toBeDisabled();
  });

  it('should show empty state when no questions exist', async () => {
    mockStudyService.getStudy.mockResolvedValue({
      ...mockStudy,
      questions: []
    });

    renderWithTheme(
      <StudyPreview
        studyId="1"
        onClose={mockOnClose}
        onPublish={mockOnPublish}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Fragen (0)')).toBeInTheDocument();
      expect(screen.getByText('Keine Fragen vorhanden. Fügen Sie mindestens eine Frage hinzu, um die Studie zu veröffentlichen.')).toBeInTheDocument();
    });
  });

  it('should handle different question types', async () => {
    const questionsWithDifferentTypes: Question[] = [
      {
        id: 'q1',
        studyId: '1',
        questionText: 'Heatmap Question',
        questionType: 'heatmap',
        orderIndex: 0,
        configuration: {
          heatmapSettings: { radius: 30 }
        }
      },
      {
        id: 'q2',
        studyId: '1',
        questionText: 'Point Selection Question',
        questionType: 'point_selection',
        orderIndex: 1,
        configuration: {
          maxPoints: 3
        }
      },
      {
        id: 'q3',
        studyId: '1',
        questionText: 'Area Selection Question',
        questionType: 'area_selection',
        orderIndex: 2,
        configuration: {
          maxAreas: 2
        }
      }
    ];

    mockStudyService.getStudy.mockResolvedValue({
      ...mockStudy,
      questions: questionsWithDifferentTypes
    });

    renderWithTheme(
      <StudyPreview
        studyId="1"
        onClose={mockOnClose}
        onPublish={mockOnPublish}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Heatmap')).toBeInTheDocument();
      expect(screen.getByText('Punkt-Auswahl')).toBeInTheDocument();
      expect(screen.getByText('Bereich-Auswahl')).toBeInTheDocument();
    });

    expect(screen.getByText('Radius: 30 Pixel')).toBeInTheDocument();
    expect(screen.getByText('Maximale Anzahl Punkte: 3')).toBeInTheDocument();
    expect(screen.getByText('Maximale Anzahl Bereiche: 2')).toBeInTheDocument();
  });

  it('should disable publish button for active studies', async () => {
    mockStudyService.getStudy.mockResolvedValue({
      ...mockStudy,
      active: true,
      questions: mockQuestions
    });

    renderWithTheme(
      <StudyPreview
        studyId="1"
        onClose={mockOnClose}
        onPublish={mockOnPublish}
      />
    );

    await waitFor(() => {
      const publishButton = screen.getByText('Veröffentlichen');
      expect(publishButton).toBeDisabled();
    });
  });

  it('should show loading state', () => {
    mockStudyService.getStudy.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithTheme(
      <StudyPreview
        studyId="1"
        onClose={mockOnClose}
        onPublish={mockOnPublish}
      />
    );

    expect(screen.getByText('Lade Studienvorschau...')).toBeInTheDocument();
  });

  it('should show error state', async () => {
    mockStudyService.getStudy.mockRejectedValue(new Error('Failed to load study'));

    renderWithTheme(
      <StudyPreview
        studyId="1"
        onClose={mockOnClose}
        onPublish={mockOnPublish}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load study')).toBeInTheDocument();
    });
  });

  it('should format dates correctly', async () => {
    renderWithTheme(
      <StudyPreview
        studyId="1"
        onClose={mockOnClose}
        onPublish={mockOnPublish}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('1. Januar 2023 um 01:00')).toBeInTheDocument();
      expect(screen.getByText('2. Januar 2023 um 01:00')).toBeInTheDocument();
    });
  });

  it('should show preview instructions', async () => {
    renderWithTheme(
      <StudyPreview
        studyId="1"
        onClose={mockOnClose}
        onPublish={mockOnPublish}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Hinweise zur Vorschau')).toBeInTheDocument();
      expect(screen.getByText('• Diese Vorschau zeigt, wie Ihre Studie strukturiert ist')).toBeInTheDocument();
      expect(screen.getByText('• Nach der Veröffentlichung können keine Änderungen mehr vorgenommen werden')).toBeInTheDocument();
    });
  });
});