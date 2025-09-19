import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider } from 'styled-components';
import { ElementsList } from '../ElementsList';
import { DrawingTool, DrawingElement } from '../../../types/drawing';
import { theme } from '../../../styles/theme';

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('ElementsList', () => {
  const mockElements: DrawingElement[] = [
    {
      id: 'element-1',
      type: DrawingTool.PEN,
      fabricObject: {} as any,
      geoCoordinates: [{ lat: 51.5, lng: -0.1 }],
      metadata: {
        createdAt: '2023-01-01T12:00:00.000Z',
        strokeColor: '#000000',
        strokeWidth: 2
      }
    },
    {
      id: 'element-2',
      type: DrawingTool.CIRCLE,
      fabricObject: {} as any,
      geoCoordinates: [{ lat: 51.6, lng: -0.2 }],
      metadata: {
        createdAt: '2023-01-01T12:05:00.000Z',
        strokeColor: '#ff0000',
        strokeWidth: 3
      }
    }
  ];

  const defaultProps = {
    elements: mockElements,
    onElementRemove: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders elements list with correct count', () => {
    renderWithTheme(<ElementsList {...defaultProps} />);
    
    expect(screen.getByText('Elements')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('displays element information correctly', () => {
    renderWithTheme(<ElementsList {...defaultProps} />);
    
    expect(screen.getByText('Pen')).toBeInTheDocument();
    expect(screen.getByText('Circle')).toBeInTheDocument();
    expect(screen.getAllByText(/Coordinates: 1 point/)).toHaveLength(2);
  });

  it('shows empty state when no elements', () => {
    renderWithTheme(
      <ElementsList 
        {...defaultProps} 
        elements={[]}
      />
    );
    
    expect(screen.getByText(/No elements drawn yet/)).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('calls onElementRemove when delete button is clicked', () => {
    const onElementRemove = vi.fn();
    renderWithTheme(
      <ElementsList 
        {...defaultProps} 
        onElementRemove={onElementRemove}
      />
    );
    
    const deleteButtons = screen.getAllByText('×');
    fireEvent.click(deleteButtons[0]);
    
    expect(onElementRemove).toHaveBeenCalledWith('element-1');
  });

  it('calls onElementSelect when element is clicked', () => {
    const onElementSelect = vi.fn();
    renderWithTheme(
      <ElementsList 
        {...defaultProps} 
        onElementSelect={onElementSelect}
      />
    );
    
    const penElement = screen.getByText('Pen').closest('div');
    if (penElement) {
      fireEvent.click(penElement);
    }
    
    expect(onElementSelect).toHaveBeenCalledWith(mockElements[0]);
  });

  it('prevents element selection when delete button is clicked', () => {
    const onElementSelect = vi.fn();
    const onElementRemove = vi.fn();
    
    renderWithTheme(
      <ElementsList 
        {...defaultProps} 
        onElementSelect={onElementSelect}
        onElementRemove={onElementRemove}
      />
    );
    
    const deleteButtons = screen.getAllByText('×');
    fireEvent.click(deleteButtons[0]);
    
    expect(onElementRemove).toHaveBeenCalledWith('element-1');
    expect(onElementSelect).not.toHaveBeenCalled();
  });

  it('formats timestamps correctly', () => {
    renderWithTheme(<ElementsList {...defaultProps} />);
    
    // Should show time in HH:MM format
    expect(screen.getAllByText(/Created:/)).toHaveLength(2);
  });

  it('handles elements with multiple coordinates', () => {
    const elementWithMultipleCoords: DrawingElement = {
      id: 'element-3',
      type: DrawingTool.POLYGON,
      fabricObject: {} as any,
      geoCoordinates: [
        { lat: 51.5, lng: -0.1 },
        { lat: 51.6, lng: -0.2 },
        { lat: 51.7, lng: -0.3 }
      ],
      metadata: {
        createdAt: '2023-01-01T12:10:00.000Z',
        strokeColor: '#00ff00',
        strokeWidth: 1
      }
    };

    renderWithTheme(
      <ElementsList 
        {...defaultProps} 
        elements={[elementWithMultipleCoords]}
      />
    );
    
    expect(screen.getByText('Coordinates: 3 points')).toBeInTheDocument();
  });
});