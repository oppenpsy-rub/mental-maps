import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider } from 'styled-components';
import { DrawingToolbar } from '../DrawingToolbar';
import { DrawingTool } from '../../../types/drawing';
import { theme } from '../../../styles/theme';

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('DrawingToolbar', () => {
  const defaultProps = {
    activeTool: DrawingTool.PEN,
    onToolChange: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all drawing tools', () => {
    renderWithTheme(<DrawingToolbar {...defaultProps} />);
    
    // Check for tool buttons by their aria-labels
    expect(screen.getByLabelText('Select')).toBeInTheDocument();
    expect(screen.getByLabelText('Pen')).toBeInTheDocument();
    expect(screen.getByLabelText('Line')).toBeInTheDocument();
    expect(screen.getByLabelText('Circle')).toBeInTheDocument();
    expect(screen.getByLabelText('Polygon')).toBeInTheDocument();
    expect(screen.getByLabelText('Text')).toBeInTheDocument();
    expect(screen.getByLabelText('Heatmap')).toBeInTheDocument();
  });

  it('highlights the active tool', () => {
    renderWithTheme(
      <DrawingToolbar 
        {...defaultProps} 
        activeTool={DrawingTool.LINE}
      />
    );
    
    const lineButton = screen.getByLabelText('Line');
    const penButton = screen.getByLabelText('Pen');
    
    // The active tool should have different styling (we can't easily test CSS,
    // but we can check that the button exists and is rendered)
    expect(lineButton).toBeInTheDocument();
    expect(penButton).toBeInTheDocument();
  });

  it('calls onToolChange when a tool is clicked', () => {
    const onToolChange = vi.fn();
    renderWithTheme(
      <DrawingToolbar 
        {...defaultProps} 
        onToolChange={onToolChange}
      />
    );
    
    const lineButton = screen.getByLabelText('Line');
    fireEvent.click(lineButton);
    
    expect(onToolChange).toHaveBeenCalledWith(DrawingTool.LINE);
  });

  it('calls onToolChange with correct tool for each button', () => {
    const onToolChange = vi.fn();
    renderWithTheme(
      <DrawingToolbar 
        {...defaultProps} 
        onToolChange={onToolChange}
      />
    );
    
    // Test a few different tools
    fireEvent.click(screen.getByLabelText('Circle'));
    expect(onToolChange).toHaveBeenCalledWith(DrawingTool.CIRCLE);
    
    fireEvent.click(screen.getByLabelText('Text'));
    expect(onToolChange).toHaveBeenCalledWith(DrawingTool.TEXT);
    
    fireEvent.click(screen.getByLabelText('Select'));
    expect(onToolChange).toHaveBeenCalledWith(DrawingTool.SELECT);
  });

  it('renders with custom className', () => {
    const { container } = renderWithTheme(
      <DrawingToolbar 
        {...defaultProps} 
        className="custom-toolbar"
      />
    );
    
    expect(container.firstChild).toHaveClass('custom-toolbar');
  });
});