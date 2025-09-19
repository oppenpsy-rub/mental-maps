import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { vi } from 'vitest';
import { theme } from '../../../styles/theme';
import HeatmapCanvas from '../HeatmapCanvas';
import { HeatmapData } from '../../../types/drawing';

const mockTheme = theme;

const defaultHeatmapData: HeatmapData = {
  points: [],
  radius: 20,
  maxIntensity: 1,
  gradient: {
    0.0: 'rgba(0, 0, 255, 0)',
    0.2: 'rgba(0, 0, 255, 0.5)',
    0.4: 'rgba(0, 255, 255, 0.7)',
    0.6: 'rgba(0, 255, 0, 0.8)',
    0.8: 'rgba(255, 255, 0, 0.9)',
    1.0: 'rgba(255, 0, 0, 1.0)'
  },
  blur: 0
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={mockTheme}>
      {component}
    </ThemeProvider>
  );
};

describe('HeatmapCanvas', () => {
  const mockOnDataChange = vi.fn();

  beforeEach(() => {
    mockOnDataChange.mockClear();
  });

  it('renders canvas element', () => {
    renderWithTheme(
      <HeatmapCanvas
        width={400}
        height={300}
        data={defaultHeatmapData}
        onDataChange={mockOnDataChange}
      />
    );

    const canvas = screen.getByRole('presentation');
    expect(canvas).toBeInTheDocument();
  });

  it('sets canvas dimensions correctly', () => {
    renderWithTheme(
      <HeatmapCanvas
        width={400}
        height={300}
        data={defaultHeatmapData}
        onDataChange={mockOnDataChange}
      />
    );

    const canvas = screen.getByRole('presentation') as HTMLCanvasElement;
    expect(canvas.width).toBe(400);
    expect(canvas.height).toBe(300);
  });

  it('changes cursor when drawing is enabled', () => {
    const { rerender } = renderWithTheme(
      <HeatmapCanvas
        width={400}
        height={300}
        data={defaultHeatmapData}
        onDataChange={mockOnDataChange}
        isDrawing={false}
      />
    );

    const canvas = screen.getByRole('presentation');
    expect(canvas).toHaveStyle('cursor: default');

    rerender(
      <ThemeProvider theme={mockTheme}>
        <HeatmapCanvas
          width={400}
          height={300}
          data={defaultHeatmapData}
          onDataChange={mockOnDataChange}
          isDrawing={true}
        />
      </ThemeProvider>
    );

    expect(canvas).toHaveStyle('cursor: crosshair');
  });

  it('adds heatmap point on mouse click when drawing', () => {
    renderWithTheme(
      <HeatmapCanvas
        width={400}
        height={300}
        data={defaultHeatmapData}
        onDataChange={mockOnDataChange}
        isDrawing={true}
      />
    );

    const canvas = screen.getByRole('presentation');
    
    // Mock getBoundingClientRect
    const mockGetBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      width: 400,
      height: 300,
      right: 400,
      bottom: 300,
      x: 0,
      y: 0,
      toJSON: () => {}
    }));
    
    Object.defineProperty(canvas, 'getBoundingClientRect', {
      value: mockGetBoundingClientRect
    });

    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 150 });

    expect(mockOnDataChange).toHaveBeenCalledWith({
      ...defaultHeatmapData,
      points: [{ x: 100, y: 150, intensity: 1 }],
      maxIntensity: 1
    });
  });

  it('does not add points when not drawing', () => {
    renderWithTheme(
      <HeatmapCanvas
        width={400}
        height={300}
        data={defaultHeatmapData}
        onDataChange={mockOnDataChange}
        isDrawing={false}
      />
    );

    const canvas = screen.getByRole('presentation');
    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 150 });

    expect(mockOnDataChange).not.toHaveBeenCalled();
  });
});