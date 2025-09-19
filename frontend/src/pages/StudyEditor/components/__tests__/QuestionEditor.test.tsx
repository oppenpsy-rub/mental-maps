import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider } from 'styled-components';
import QuestionEditor from '../QuestionEditor';
import { theme } from '../../../../styles/theme';

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('QuestionEditor', () => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render new question editor', () => {
    renderWithTheme(
      <QuestionEditor
        studyId="study1"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Neue Frage erstellen')).toBeInTheDocument();
    expect(screen.getByLabelText('Fragetext *')).toBeInTheDocument();
    expect(screen.getByLabelText('Fragetyp *')).toBeInTheDocument();
  });

  it('should render edit question editor when questionId is provided', () => {
    renderWithTheme(
      <QuestionEditor
        studyId="study1"
        questionId="question1"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Frage bearbeiten')).toBeInTheDocument();
    expect(screen.getByText('Aktualisieren')).toBeInTheDocument();
  });

  it('should validate required question text', async () => {
    renderWithTheme(
      <QuestionEditor
        studyId="study1"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const createButton = screen.getByText('Erstellen');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Fragetext ist erforderlich')).toBeInTheDocument();
    });

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should validate question text length', async () => {
    renderWithTheme(
      <QuestionEditor
        studyId="study1"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const questionTextInput = screen.getByLabelText('Fragetext *');
    fireEvent.change(questionTextInput, { target: { value: 'short' } });

    const createButton = screen.getByText('Erstellen');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Fragetext muss mindestens 10 Zeichen lang sein')).toBeInTheDocument();
    });

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should show drawing tools configuration for map_drawing type', () => {
    renderWithTheme(
      <QuestionEditor
        studyId="study1"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Zeichenwerkzeuge')).toBeInTheDocument();
    expect(screen.getByText('Stift')).toBeInTheDocument();
    expect(screen.getByText('Linie')).toBeInTheDocument();
    expect(screen.getByText('Polygon')).toBeInTheDocument();
    expect(screen.getByText('Kreis')).toBeInTheDocument();
    expect(screen.getByText('Text')).toBeInTheDocument();
  });

  it('should validate drawing tools selection for map_drawing type', async () => {
    renderWithTheme(
      <QuestionEditor
        studyId="study1"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const questionTextInput = screen.getByLabelText('Fragetext *');
    fireEvent.change(questionTextInput, { target: { value: 'Valid question text here' } });

    const createButton = screen.getByText('Erstellen');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Mindestens ein Zeichenwerkzeug muss ausgewählt werden')).toBeInTheDocument();
    });

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should show heatmap configuration for heatmap type', () => {
    renderWithTheme(
      <QuestionEditor
        studyId="study1"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const questionTypeSelect = screen.getByLabelText('Fragetyp *');
    fireEvent.change(questionTypeSelect, { target: { value: 'heatmap' } });

    expect(screen.getByText('Heatmap-Einstellungen')).toBeInTheDocument();
    expect(screen.getByLabelText('Radius (Pixel)')).toBeInTheDocument();
  });

  it('should show rating configuration for rating type', () => {
    renderWithTheme(
      <QuestionEditor
        studyId="study1"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const questionTypeSelect = screen.getByLabelText('Fragetyp *');
    fireEvent.change(questionTypeSelect, { target: { value: 'rating' } });

    expect(screen.getByText('Bewertungsskala')).toBeInTheDocument();
    expect(screen.getByLabelText('Minimum')).toBeInTheDocument();
    expect(screen.getByLabelText('Maximum')).toBeInTheDocument();
  });

  it('should validate rating scale for rating type', async () => {
    renderWithTheme(
      <QuestionEditor
        studyId="study1"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const questionTypeSelect = screen.getByLabelText('Fragetyp *');
    fireEvent.change(questionTypeSelect, { target: { value: 'rating' } });

    const questionTextInput = screen.getByLabelText('Fragetext *');
    fireEvent.change(questionTextInput, { target: { value: 'Valid question text here' } });

    // Set invalid scale (min >= max)
    const minInput = screen.getByLabelText('Minimum');
    const maxInput = screen.getByLabelText('Maximum');
    fireEvent.change(minInput, { target: { value: '5' } });
    fireEvent.change(maxInput, { target: { value: '3' } });

    const createButton = screen.getByText('Erstellen');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Minimum muss kleiner als Maximum sein')).toBeInTheDocument();
    });

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should create question with valid data', async () => {
    renderWithTheme(
      <QuestionEditor
        studyId="study1"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const questionTextInput = screen.getByLabelText('Fragetext *');
    fireEvent.change(questionTextInput, { target: { value: 'Valid question text here' } });

    // Select drawing tools
    const penCheckbox = screen.getByRole('checkbox', { name: /stift/i });
    fireEvent.click(penCheckbox);

    const createButton = screen.getByText('Erstellen');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          studyId: 'study1',
          questionText: 'Valid question text here',
          questionType: 'map_drawing',
          configuration: {
            allowedDrawingTools: ['pen']
          }
        })
      );
    });
  });

  it('should call onCancel when cancel button is clicked', () => {
    renderWithTheme(
      <QuestionEditor
        studyId="study1"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText('Abbrechen');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should call onCancel when close button is clicked', () => {
    renderWithTheme(
      <QuestionEditor
        studyId="study1"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should show point selection configuration', () => {
    renderWithTheme(
      <QuestionEditor
        studyId="study1"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const questionTypeSelect = screen.getByLabelText('Fragetyp *');
    fireEvent.change(questionTypeSelect, { target: { value: 'point_selection' } });

    expect(screen.getByRole('heading', { name: 'Punkt-Auswahl' })).toBeInTheDocument();
    expect(screen.getByLabelText('Maximale Anzahl Punkte')).toBeInTheDocument();
  });

  it('should show area selection configuration', () => {
    renderWithTheme(
      <QuestionEditor
        studyId="study1"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const questionTypeSelect = screen.getByLabelText('Fragetyp *');
    fireEvent.change(questionTypeSelect, { target: { value: 'area_selection' } });

    expect(screen.getByRole('heading', { name: 'Bereich-Auswahl' })).toBeInTheDocument();
    expect(screen.getByLabelText('Maximale Anzahl Bereiche')).toBeInTheDocument();
  });

  it('should clear errors when input is corrected', async () => {
    renderWithTheme(
      <QuestionEditor
        studyId="study1"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Create error
    const createButton = screen.getByText('Erstellen');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Fragetext ist erforderlich')).toBeInTheDocument();
    });

    // Fix error
    const questionTextInput = screen.getByLabelText('Fragetext *');
    fireEvent.change(questionTextInput, { target: { value: 'Valid question text here' } });

    await waitFor(() => {
      expect(screen.queryByText('Fragetext ist erforderlich')).not.toBeInTheDocument();
    });
  });

  it('should handle form submission', async () => {
    renderWithTheme(
      <QuestionEditor
        studyId="study1"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const questionTextInput = screen.getByLabelText('Fragetext *');
    fireEvent.change(questionTextInput, { target: { value: 'Valid question text here' } });

    const penCheckbox = screen.getByRole('checkbox', { name: /stift/i });
    fireEvent.click(penCheckbox);

    const createButton = screen.getByText('Erstellen');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
    });
  });
});