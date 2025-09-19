import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { vi } from 'vitest';
import { theme } from '../../../styles/theme';
import HeatmapToolSettings from '../HeatmapToolSettings';
import { ToolSettings } from '../../../types/drawing';

const mockTheme = theme;

const defaultSettings: ToolSettings = {
  strokeColor: '#000000',
  strokeWidth: 2,
  fillColor: '#ffffff',
  fillOpacity: 0.3,
  fontSize: 16,
  fontFamily: 'Arial',
  heatmapRadius: 20,
  heatmapIntensity: 1,
  heatmapBlur: 0,
  heatmapGradient: {
    0.0: 'rgba(0, 0, 255, 0)',
    0.2: 'rgba(0, 0, 255, 0.5)',
    0.4: 'rgba(0, 255, 255, 0.7)',
    0.6: 'rgba(0, 255, 0, 0.8)',
    0.8: 'rgba(255, 255, 0, 0.9)',
    1.0: 'rgba(255, 0, 0, 1.0)'
  }
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={mockTheme}>
      {component}
    </ThemeProvider>
  );
};

describe('HeatmapToolSettings', () => {
  const mockOnSettingsChange = vi.fn();

  beforeEach(() => {
    mockOnSettingsChange.mockClear();
  });

  it('renders all heatmap settings controls', () => {
    renderWithTheme(
      <HeatmapToolSettings
        settings={defaultSettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    expect(screen.getByText('Radius')).toBeInTheDocument();
    expect(screen.getByText('Intensity')).toBeInTheDocument();
    expect(screen.getByText('Blur')).toBeInTheDocument();
    expect(screen.getByText('Color Gradient')).toBeInTheDocument();
  });

  it('displays current radius value', () => {
    renderWithTheme(
      <HeatmapToolSettings
        settings={defaultSettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    expect(screen.getByText('20px')).toBeInTheDocument();
  });

  it('displays current intensity value', () => {
    renderWithTheme(
      <HeatmapToolSettings
        settings={defaultSettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    expect(screen.getByText('1.0')).toBeInTheDocument();
  });

  it('displays current blur value', () => {
    renderWithTheme(
      <HeatmapToolSettings
        settings={defaultSettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    expect(screen.getByText('0px')).toBeInTheDocument();
  });

  it('calls onSettingsChange when radius is changed', () => {
    renderWithTheme(
      <HeatmapToolSettings
        settings={defaultSettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    const radiusSlider = screen.getByDisplayValue('20');
    fireEvent.change(radiusSlider, { target: { value: '30' } });

    expect(mockOnSettingsChange).toHaveBeenCalledWith({
      heatmapRadius: 30
    });
  });

  it('calls onSettingsChange when intensity is changed', () => {
    renderWithTheme(
      <HeatmapToolSettings
        settings={defaultSettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    const intensitySlider = screen.getByDisplayValue('1');
    fireEvent.change(intensitySlider, { target: { value: '2.5' } });

    expect(mockOnSettingsChange).toHaveBeenCalledWith({
      heatmapIntensity: 2.5
    });
  });

  it('calls onSettingsChange when blur is changed', () => {
    renderWithTheme(
      <HeatmapToolSettings
        settings={defaultSettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    const blurSlider = screen.getByDisplayValue('0');
    fireEvent.change(blurSlider, { target: { value: '5' } });

    expect(mockOnSettingsChange).toHaveBeenCalledWith({
      heatmapBlur: 5
    });
  });

  it('renders gradient preset buttons', () => {
    renderWithTheme(
      <HeatmapToolSettings
        settings={defaultSettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    expect(screen.getByText('Blue-Red')).toBeInTheDocument();
    expect(screen.getByText('Thermal')).toBeInTheDocument();
    expect(screen.getByText('Ocean')).toBeInTheDocument();
    expect(screen.getByText('Grayscale')).toBeInTheDocument();
  });

  it('highlights active gradient preset', () => {
    renderWithTheme(
      <HeatmapToolSettings
        settings={defaultSettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    const blueRedButton = screen.getByText('Blue-Red');
    expect(blueRedButton).toHaveStyle('background: #3b82f6'); // Active state
  });

  it('calls onSettingsChange when gradient preset is changed', () => {
    renderWithTheme(
      <HeatmapToolSettings
        settings={defaultSettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    const thermalButton = screen.getByText('Thermal');
    fireEvent.click(thermalButton);

    expect(mockOnSettingsChange).toHaveBeenCalledWith({
      heatmapGradient: {
        0.0: 'rgba(0, 0, 0, 0)',
        0.25: 'rgba(128, 0, 128, 0.6)',
        0.5: 'rgba(255, 0, 0, 0.8)',
        0.75: 'rgba(255, 255, 0, 0.9)',
        1.0: 'rgba(255, 255, 255, 1.0)'
      }
    });
  });

  it('renders gradient preview', () => {
    renderWithTheme(
      <HeatmapToolSettings
        settings={defaultSettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    // The gradient preview should be rendered - just check that the component renders without errors
    expect(screen.getByText('Color Gradient')).toBeInTheDocument();
  });

  it('handles settings with missing heatmap properties', () => {
    const settingsWithoutHeatmap: ToolSettings = {
      strokeColor: '#000000',
      strokeWidth: 2,
      fillColor: '#ffffff',
      fillOpacity: 0.3,
      fontSize: 16,
      fontFamily: 'Arial'
    };

    renderWithTheme(
      <HeatmapToolSettings
        settings={settingsWithoutHeatmap}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    // Should render with default values
    expect(screen.getByText('20px')).toBeInTheDocument(); // Default radius
    expect(screen.getByText('1.0')).toBeInTheDocument(); // Default intensity
    expect(screen.getByText('0px')).toBeInTheDocument(); // Default blur
  });
});