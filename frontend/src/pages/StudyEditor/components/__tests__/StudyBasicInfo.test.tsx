import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider } from 'styled-components';
import StudyBasicInfo from '../StudyBasicInfo';
import { theme } from '../../../../styles/theme';
import { Study } from '../../../../types';

const mockStudy: Study = {
  id: '1',
  researcherId: 'researcher1',
  title: 'Test Study',
  description: 'Test Description',
  active: false,
  status: 'draft',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z'
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('StudyBasicInfo', () => {
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render study information form', () => {
    renderWithTheme(
      <StudyBasicInfo
        study={mockStudy}
        onSave={mockOnSave}
        saving={false}
      />
    );

    expect(screen.getByText('Grundinformationen')).toBeInTheDocument();
    expect(screen.getByLabelText('Titel *')).toHaveValue('Test Study');
    expect(screen.getByLabelText('Beschreibung')).toHaveValue('Test Description');
  });

  it('should show save button when changes are made', async () => {
    renderWithTheme(
      <StudyBasicInfo
        study={mockStudy}
        onSave={mockOnSave}
        saving={false}
      />
    );

    const titleInput = screen.getByLabelText('Titel *');
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

    await waitFor(() => {
      expect(screen.getByText('Speichern')).toBeInTheDocument();
      expect(screen.getByText('Zurücksetzen')).toBeInTheDocument();
    });
  });

  it('should validate required title field', async () => {
    renderWithTheme(
      <StudyBasicInfo
        study={mockStudy}
        onSave={mockOnSave}
        saving={false}
      />
    );

    const titleInput = screen.getByLabelText('Titel *');
    fireEvent.change(titleInput, { target: { value: '' } });
    
    const saveButton = await screen.findByText('Speichern');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Titel ist erforderlich')).toBeInTheDocument();
    });

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should validate title length', async () => {
    renderWithTheme(
      <StudyBasicInfo
        study={mockStudy}
        onSave={mockOnSave}
        saving={false}
      />
    );

    const titleInput = screen.getByLabelText('Titel *');
    fireEvent.change(titleInput, { target: { value: 'ab' } });
    
    const saveButton = await screen.findByText('Speichern');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Titel muss mindestens 3 Zeichen lang sein')).toBeInTheDocument();
    });

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should validate description length', async () => {
    renderWithTheme(
      <StudyBasicInfo
        study={mockStudy}
        onSave={mockOnSave}
        saving={false}
      />
    );

    const descriptionInput = screen.getByLabelText('Beschreibung');
    fireEvent.change(descriptionInput, { target: { value: 'a'.repeat(1001) } });
    
    const saveButton = await screen.findByText('Speichern');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Beschreibung darf maximal 1000 Zeichen lang sein')).toBeInTheDocument();
    });

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should call onSave with valid data', async () => {
    mockOnSave.mockResolvedValue(undefined);

    renderWithTheme(
      <StudyBasicInfo
        study={mockStudy}
        onSave={mockOnSave}
        saving={false}
      />
    );

    const titleInput = screen.getByLabelText('Titel *');
    const descriptionInput = screen.getByLabelText('Beschreibung');
    
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });
    fireEvent.change(descriptionInput, { target: { value: 'Updated Description' } });
    
    const saveButton = await screen.findByText('Speichern');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        title: 'Updated Title',
        description: 'Updated Description'
      });
    });
  });

  it('should reset form when reset button is clicked', async () => {
    renderWithTheme(
      <StudyBasicInfo
        study={mockStudy}
        onSave={mockOnSave}
        saving={false}
      />
    );

    const titleInput = screen.getByLabelText('Titel *');
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

    const resetButton = await screen.findByText('Zurücksetzen');
    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(titleInput).toHaveValue('Test Study');
      expect(screen.queryByText('Speichern')).not.toBeInTheDocument();
    });
  });

  it('should disable form when study is active', () => {
    const activeStudy = { ...mockStudy, active: true };

    renderWithTheme(
      <StudyBasicInfo
        study={activeStudy}
        onSave={mockOnSave}
        saving={false}
        disabled={true}
      />
    );

    expect(screen.getByLabelText('Titel *')).toBeDisabled();
    expect(screen.getByLabelText('Beschreibung')).toBeDisabled();
    expect(screen.getByText('Diese Studie ist aktiv und kann nicht bearbeitet werden.')).toBeInTheDocument();
  });

  it('should show loading state when saving', () => {
    renderWithTheme(
      <StudyBasicInfo
        study={mockStudy}
        onSave={mockOnSave}
        saving={true}
      />
    );

    const titleInput = screen.getByLabelText('Titel *');
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

    expect(screen.getByText('Speichern...')).toBeInTheDocument();
    expect(screen.getByText('Speichern...')).toBeDisabled();
  });

  it('should show character count for description', () => {
    renderWithTheme(
      <StudyBasicInfo
        study={mockStudy}
        onSave={mockOnSave}
        saving={false}
      />
    );

    expect(screen.getByText('16/1000 Zeichen')).toBeInTheDocument();

    const descriptionInput = screen.getByLabelText('Beschreibung');
    fireEvent.change(descriptionInput, { target: { value: 'New description' } });

    expect(screen.getByText('15/1000 Zeichen')).toBeInTheDocument();
  });

  it('should clear errors when input is corrected', async () => {
    renderWithTheme(
      <StudyBasicInfo
        study={mockStudy}
        onSave={mockOnSave}
        saving={false}
      />
    );

    const titleInput = screen.getByLabelText('Titel *');
    
    // Create error
    fireEvent.change(titleInput, { target: { value: '' } });
    const saveButton = await screen.findByText('Speichern');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Titel ist erforderlich')).toBeInTheDocument();
    });

    // Fix error
    fireEvent.change(titleInput, { target: { value: 'Valid Title' } });

    await waitFor(() => {
      expect(screen.queryByText('Titel ist erforderlich')).not.toBeInTheDocument();
    });
  });
});