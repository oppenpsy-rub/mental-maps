import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DemographicForm, { DemographicFormData } from '../DemographicForm';
import { theme } from '../../../styles/theme';

// Mock the LocationSelector component
vi.mock('../../Map/LocationSelector', () => ({
  LocationSelector: ({ onLocationSelect, selectedLocation }: any) => (
    <div data-testid="location-selector">
      <button
        onClick={() => onLocationSelect && onLocationSelect([10.4515, 51.1657])}
        data-testid="select-location-btn"
      >
        Select Location
      </button>
      {selectedLocation && (
        <div data-testid="selected-location">
          {selectedLocation[0]}, {selectedLocation[1]}
        </div>
      )}
    </div>
  )
}));

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('DemographicForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnSkip = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form sections', () => {
    renderWithTheme(
      <DemographicForm onSubmit={mockOnSubmit} onSkip={mockOnSkip} />
    );

    expect(screen.getByText('Grundlegende Angaben')).toBeInTheDocument();
    expect(screen.getByText('Sprachlicher Hintergrund')).toBeInTheDocument();
    expect(screen.getByText('Geografischer Hintergrund')).toBeInTheDocument();
  });

  it('shows optional badges for all sections', () => {
    renderWithTheme(
      <DemographicForm onSubmit={mockOnSubmit} onSkip={mockOnSkip} />
    );

    const optionalBadges = screen.getAllByText('Optional');
    expect(optionalBadges).toHaveLength(3);
  });

  it('allows filling basic demographic information', async () => {
    const user = userEvent.setup();
    
    renderWithTheme(
      <DemographicForm onSubmit={mockOnSubmit} onSkip={mockOnSkip} />
    );

    // Fill basic information
    await user.type(screen.getByLabelText('Alter'), '25');
    await user.type(screen.getByLabelText('Geschlecht'), 'weiblich');
    await user.selectOptions(screen.getByLabelText('Bildungsabschluss'), 'bachelor');
    await user.type(screen.getByLabelText('Beruf'), 'Lehrerin');

    expect(screen.getByDisplayValue('25')).toBeInTheDocument();
    expect(screen.getByDisplayValue('weiblich')).toBeInTheDocument();
    expect(screen.getByDisplayValue('bachelor')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Lehrerin')).toBeInTheDocument();
  });

  it('allows adding and removing language exposure entries', async () => {
    const user = userEvent.setup();
    
    renderWithTheme(
      <DemographicForm onSubmit={mockOnSubmit} onSkip={mockOnSkip} />
    );

    // Add language exposure
    const addLanguageBtn = screen.getByText('Sprachkenntnisse hinzufügen');
    await user.click(addLanguageBtn);

    expect(screen.getByText('Sprache 1')).toBeInTheDocument();

    // Fill language information
    const languageInput = screen.getByPlaceholderText('z.B. Englisch');
    await user.type(languageInput, 'Englisch');

    // Add another language
    await user.click(addLanguageBtn);
    expect(screen.getByText('Sprache 2')).toBeInTheDocument();

    // Remove first language
    const removeButtons = screen.getAllByText('Entfernen');
    await user.click(removeButtons[0]);

    expect(screen.queryByText('Sprache 1')).not.toBeInTheDocument();
  });

  it('allows adding and removing other languages', async () => {
    const user = userEvent.setup();
    
    renderWithTheme(
      <DemographicForm onSubmit={mockOnSubmit} onSkip={mockOnSkip} />
    );

    // Add other language
    const addOtherLanguageBtn = screen.getByText('Sprache hinzufügen');
    await user.click(addOtherLanguageBtn);

    const languageInput = screen.getByPlaceholderText('Sprache eingeben');
    await user.type(languageInput, 'Französisch');

    expect(screen.getByDisplayValue('Französisch')).toBeInTheDocument();

    // Remove language
    const removeBtn = screen.getByText('Entfernen');
    await user.click(removeBtn);

    expect(screen.queryByDisplayValue('Französisch')).not.toBeInTheDocument();
  });

  it('handles location selection for birth place', async () => {
    const user = userEvent.setup();
    
    renderWithTheme(
      <DemographicForm onSubmit={mockOnSubmit} onSkip={mockOnSkip} />
    );

    // Find birth place location selector
    const locationSelectors = screen.getAllByTestId('location-selector');
    const birthPlaceSelector = locationSelectors[0];

    // Click to select location
    const selectBtn = birthPlaceSelector.querySelector('[data-testid="select-location-btn"]');
    await user.click(selectBtn!);

    // Check if location is displayed
    await waitFor(() => {
      expect(screen.getByText(/Ausgewählte Koordinaten: 51.1657, 10.4515/)).toBeInTheDocument();
    });
  });

  it('handles location selection for current residence', async () => {
    const user = userEvent.setup();
    
    renderWithTheme(
      <DemographicForm onSubmit={mockOnSubmit} onSkip={mockOnSkip} />
    );

    // Find current residence location selector
    const locationSelectors = screen.getAllByTestId('location-selector');
    const currentResidenceSelector = locationSelectors[1];

    // Click to select location
    const selectBtn = currentResidenceSelector.querySelector('[data-testid="select-location-btn"]');
    await user.click(selectBtn!);

    // Check if location is displayed
    await waitFor(() => {
      expect(screen.getByText(/Ausgewählte Koordinaten: 51.1657, 10.4515/)).toBeInTheDocument();
    });
  });

  it('calls onSkip when skip button is clicked', async () => {
    const user = userEvent.setup();
    
    renderWithTheme(
      <DemographicForm onSubmit={mockOnSubmit} onSkip={mockOnSkip} />
    );

    const skipBtn = screen.getByText('Überspringen');
    await user.click(skipBtn);

    expect(mockOnSkip).toHaveBeenCalledTimes(1);
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    
    renderWithTheme(
      <DemographicForm onSubmit={mockOnSubmit} onSkip={mockOnSkip} />
    );

    // Fill some basic data
    await user.type(screen.getByLabelText('Alter'), '30');
    await user.type(screen.getByLabelText('Muttersprache'), 'Deutsch');

    // Submit form
    const submitBtn = screen.getByText('Weiter');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          age: 30,
          nativeLanguage: 'Deutsch'
        })
      );
    });
  });

  it('validates age input', async () => {
    const user = userEvent.setup();
    
    renderWithTheme(
      <DemographicForm onSubmit={mockOnSubmit} onSkip={mockOnSkip} />
    );

    // Enter invalid age
    const ageInput = screen.getByLabelText('Alter');
    await user.type(ageInput, '15');

    // Try to submit
    const submitBtn = screen.getByText('Weiter');
    await user.click(submitBtn);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/Number must be greater than or equal to 16/)).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows loading state when isLoading is true', () => {
    renderWithTheme(
      <DemographicForm 
        onSubmit={mockOnSubmit} 
        onSkip={mockOnSkip} 
        isLoading={true}
      />
    );

    expect(screen.getByText('Wird gespeichert...')).toBeInTheDocument();
    
    const submitBtn = screen.getByText('Wird gespeichert...');
    const skipBtn = screen.getByText('Überspringen');
    
    expect(submitBtn).toBeDisabled();
    expect(skipBtn).toBeDisabled();
  });

  it('populates form with initial data', () => {
    const initialData: Partial<DemographicFormData> = {
      age: 28,
      gender: 'männlich',
      nativeLanguage: 'Deutsch',
      otherLanguages: ['Englisch', 'Französisch'],
      languageExposure: [
        {
          language: 'Englisch',
          proficiency: 'advanced',
          yearsOfExposure: 15
        }
      ]
    };

    renderWithTheme(
      <DemographicForm 
        onSubmit={mockOnSubmit} 
        onSkip={mockOnSkip}
        initialData={initialData}
      />
    );

    expect(screen.getByDisplayValue('28')).toBeInTheDocument();
    expect(screen.getByDisplayValue('männlich')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Deutsch')).toBeInTheDocument();
    // Check for multiple Englisch entries (in both otherLanguages and languageExposure)
    const englischInputs = screen.getAllByDisplayValue('Englisch');
    expect(englischInputs.length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue('Französisch')).toBeInTheDocument();
  });

  it('handles proficiency level selection correctly', async () => {
    const user = userEvent.setup();
    
    renderWithTheme(
      <DemographicForm onSubmit={mockOnSubmit} onSkip={mockOnSkip} />
    );

    // Add language exposure
    const addLanguageBtn = screen.getByText('Sprachkenntnisse hinzufügen');
    await user.click(addLanguageBtn);

    // Fill language
    const languageInput = screen.getByPlaceholderText('z.B. Englisch');
    await user.type(languageInput, 'Englisch');

    // Select proficiency level
    const proficiencySelect = screen.getByDisplayValue('Grundkenntnisse');
    await user.selectOptions(proficiencySelect, 'advanced');

    expect(screen.getByDisplayValue('Fortgeschrittene Kenntnisse')).toBeInTheDocument();
  });
});