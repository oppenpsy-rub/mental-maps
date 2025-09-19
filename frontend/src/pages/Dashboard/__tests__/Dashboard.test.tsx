import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThemeProvider } from 'styled-components';
import Dashboard from '../Dashboard';
import { theme } from '../../../styles/theme';
import { studyService } from '../../../services/studyService';
import { Study } from '../../../types';

// Mock the study service
vi.mock('../../../services/studyService');

const mockStudyService = studyService as any;

const mockStudies: Study[] = [
  {
    id: '1',
    researcherId: 'researcher1',
    title: 'Test Study 1',
    description: 'Description for test study 1',
    active: true,
    status: 'active',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z'
  },
  {
    id: '2',
    researcherId: 'researcher1',
    title: 'Test Study 2',
    description: 'Description for test study 2',
    active: false,
    status: 'draft',
    createdAt: '2023-01-03T00:00:00Z',
    updatedAt: '2023-01-04T00:00:00Z'
  }
];

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockStudyService.getStudies.mockResolvedValue({
      studies: mockStudies,
      pagination: {
        page: 1,
        limit: 50,
        total: 2,
        totalPages: 1
      }
    });
  });

  it('should render dashboard title and create button', async () => {
    renderWithTheme(<Dashboard />);

    expect(screen.getByText('Forscher-Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Neue Studie erstellen')).toBeInTheDocument();
  });

  it('should display statistics cards', async () => {
    renderWithTheme(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Studien gesamt')).toBeInTheDocument();
      expect(screen.getByText('Aktive Studien')).toBeInTheDocument();
      expect(screen.getByText('Entwürfe')).toBeInTheDocument();
      expect(screen.getByText('Abgeschlossen')).toBeInTheDocument();
    });
  });

  it('should load and display studies', async () => {
    renderWithTheme(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Test Study 1')).toBeInTheDocument();
      expect(screen.getByText('Test Study 2')).toBeInTheDocument();
      expect(screen.getByText('Description for test study 1')).toBeInTheDocument();
      expect(screen.getByText('Description for test study 2')).toBeInTheDocument();
    });

    expect(mockStudyService.getStudies).toHaveBeenCalledWith({
      search: undefined,
      active: undefined,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
      limit: 50
    });
  });

  it('should display study status badges', async () => {
    renderWithTheme(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('active')).toBeInTheDocument();
      expect(screen.getByText('draft')).toBeInTheDocument();
    });
  });

  it('should handle search input', async () => {
    renderWithTheme(<Dashboard />);

    const searchInput = screen.getByPlaceholderText('Studien durchsuchen...');
    fireEvent.change(searchInput, { target: { value: 'Test Study 1' } });

    await waitFor(() => {
      expect(mockStudyService.getStudies).toHaveBeenCalledWith({
        search: 'Test Study 1',
        active: undefined,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
        limit: 50
      });
    });
  });

  it('should handle status filter', async () => {
    renderWithTheme(<Dashboard />);

    const statusFilter = screen.getByDisplayValue('Alle Status');
    fireEvent.change(statusFilter, { target: { value: 'active' } });

    await waitFor(() => {
      expect(mockStudyService.getStudies).toHaveBeenCalledWith({
        search: undefined,
        active: true,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
        limit: 50
      });
    });
  });

  it('should handle sort options', async () => {
    renderWithTheme(<Dashboard />);

    const sortBySelect = screen.getByDisplayValue('Zuletzt bearbeitet');
    fireEvent.change(sortBySelect, { target: { value: 'title' } });

    await waitFor(() => {
      expect(mockStudyService.getStudies).toHaveBeenCalledWith({
        search: undefined,
        active: undefined,
        sortBy: 'title',
        sortOrder: 'desc',
        limit: 50
      });
    });

    const sortOrderSelect = screen.getByDisplayValue('Absteigend');
    fireEvent.change(sortOrderSelect, { target: { value: 'asc' } });

    await waitFor(() => {
      expect(mockStudyService.getStudies).toHaveBeenCalledWith({
        search: undefined,
        active: undefined,
        sortBy: 'title',
        sortOrder: 'asc',
        limit: 50
      });
    });
  });

  it('should handle study activation', async () => {
    mockStudyService.activateStudy.mockResolvedValue({
      ...mockStudies[1],
      active: true,
      status: 'active'
    });

    renderWithTheme(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Test Study 2')).toBeInTheDocument();
    });

    const activateButtons = screen.getAllByText('Aktivieren');
    fireEvent.click(activateButtons[0]);

    await waitFor(() => {
      expect(mockStudyService.activateStudy).toHaveBeenCalledWith('2', 'Activated from dashboard');
    });
  });

  it('should handle study deactivation', async () => {
    mockStudyService.deactivateStudy.mockResolvedValue({
      ...mockStudies[0],
      active: false,
      status: 'paused'
    });

    renderWithTheme(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Test Study 1')).toBeInTheDocument();
    });

    const deactivateButtons = screen.getAllByText('Deaktivieren');
    fireEvent.click(deactivateButtons[0]);

    await waitFor(() => {
      expect(mockStudyService.deactivateStudy).toHaveBeenCalledWith('1', 'Deactivated from dashboard');
    });
  });

  it('should handle study deletion with confirmation', async () => {
    // Mock window.confirm
    const originalConfirm = window.confirm;
    window.confirm = vi.fn(() => true);

    mockStudyService.deleteStudy.mockResolvedValue(undefined);

    renderWithTheme(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Test Study 2')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Löschen');
    // Find the enabled delete button (for inactive study)
    const enabledDeleteButton = deleteButtons.find(button => !button.hasAttribute('disabled'));
    
    if (enabledDeleteButton) {
      fireEvent.click(enabledDeleteButton);

      expect(window.confirm).toHaveBeenCalledWith(
        'Sind Sie sicher, dass Sie diese Studie löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.'
      );

      await waitFor(() => {
        expect(mockStudyService.deleteStudy).toHaveBeenCalledWith('2');
      });
    }

    // Restore window.confirm
    window.confirm = originalConfirm;
  });

  it('should not delete study if user cancels confirmation', async () => {
    // Mock window.confirm to return false
    const originalConfirm = window.confirm;
    window.confirm = vi.fn(() => false);

    renderWithTheme(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Test Study 2')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Löschen');
    const enabledDeleteButton = deleteButtons.find(button => !button.hasAttribute('disabled'));
    
    if (enabledDeleteButton) {
      fireEvent.click(enabledDeleteButton);

      expect(window.confirm).toHaveBeenCalled();
      expect(mockStudyService.deleteStudy).not.toHaveBeenCalled();
    }

    // Restore window.confirm
    window.confirm = originalConfirm;
  });

  it('should display loading state', () => {
    mockStudyService.getStudies.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithTheme(<Dashboard />);

    expect(screen.getByText('Lade Studien...')).toBeInTheDocument();
  });

  it('should display error message', async () => {
    mockStudyService.getStudies.mockRejectedValue(new Error('Failed to load studies'));

    renderWithTheme(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load studies')).toBeInTheDocument();
    });
  });

  it('should display empty state when no studies exist', async () => {
    mockStudyService.getStudies.mockResolvedValue({
      studies: [],
      pagination: {
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0
      }
    });

    renderWithTheme(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Keine Studien gefunden')).toBeInTheDocument();
      expect(screen.getByText('Sie haben noch keine Studien erstellt. Erstellen Sie Ihre erste Studie, um zu beginnen.')).toBeInTheDocument();
      expect(screen.getByText('Erste Studie erstellen')).toBeInTheDocument();
    });
  });

  it('should display filtered empty state', async () => {
    mockStudyService.getStudies.mockResolvedValue({
      studies: [],
      pagination: {
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0
      }
    });

    renderWithTheme(<Dashboard />);

    // Set a search term
    const searchInput = screen.getByPlaceholderText('Studien durchsuchen...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(screen.getByText('Keine Studien gefunden')).toBeInTheDocument();
      expect(screen.getByText('Keine Studien entsprechen den aktuellen Filterkriterien.')).toBeInTheDocument();
      expect(screen.queryByText('Erste Studie erstellen')).not.toBeInTheDocument();
    });
  });

  it('should format dates correctly', async () => {
    renderWithTheme(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Erstellt: 1. Jan. 2023')).toBeInTheDocument();
      expect(screen.getByText('Bearbeitet: 2. Jan. 2023')).toBeInTheDocument();
    });
  });

  it('should disable delete button for active studies', async () => {
    renderWithTheme(<Dashboard />);

    await waitFor(() => {
      const deleteButtons = screen.getAllByText('Löschen');
      // The first study is active, so its delete button should be disabled
      expect(deleteButtons[0]).toBeDisabled();
      // The second study is inactive, so its delete button should be enabled
      expect(deleteButtons[1]).not.toBeDisabled();
    });
  });

  it('should disable results button for inactive draft studies', async () => {
    renderWithTheme(<Dashboard />);

    await waitFor(() => {
      const resultsButtons = screen.getAllByText('Ergebnisse');
      // The first study is active, so results should be enabled
      expect(resultsButtons[0]).not.toBeDisabled();
      // The second study is draft and inactive, so results should be disabled
      expect(resultsButtons[1]).toBeDisabled();
    });
  });
});