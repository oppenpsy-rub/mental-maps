import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider } from 'styled-components';
import { ToolSettings } from '../ToolSettings';
import { DrawingTool } from '../../../types/drawing';
import { theme } from '../../../styles/theme';

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('ToolSettings', () => {
  const defaultSettings = {
    strokeColor: '#000000',
    strokeWidth: 2,
    fillColor: '#ffffff',
    fillOpacity: 0.3,
    fontSize: 16,
    fontFamily: 'Arial'
  };

  const defaultProps = {
    activeTool: DrawingTool.PEN,
    settings: defaultSettings,
    onSettingsChange: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders basic stroke settings for all tools', () => {
    renderWithTheme(<ToolSettings {...defaultProps} />);
    
    expect(screen.getByText('Stroke Color')).toBeInTheDocument();
    expect(screen.getByText('Stroke Width')).toBeInTheDocument();
    expect(screen.getByText('2px')).toBeInTheDocument();
  });

  it('shows fill settings for shape tools', () => {
    renderWithTheme(
      <ToolSettings 
        {...defaultProps} 
        activeTool={DrawingTool.CIRCLE}
      />
    );
    
    expect(screen.getByText('Fill Color')).toBeInTheDocument();
    expect(screen.getByText('Fill Opacity')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
  });

  it('shows text settings for text tool', () => {
    renderWithTheme(
      <ToolSettings 
        {...defaultProps} 
        activeTool={DrawingTool.TEXT}
      />
    );
    
    expect(screen.getByText('Font Size')).toBeInTheDocument();
    expect(screen.getByText('Font Family')).toBeInTheDocument();
    expect(screen.getByText('16px')).toBeInTheDocument();
  });

  it('does not show fill settings for pen tool', () => {
    renderWithTheme(
      <ToolSettings 
        {...defaultProps} 
        activeTool={DrawingTool.PEN}
      />
    );
    
    expect(screen.queryByText('Fill Color')).not.toBeInTheDocument();
    expect(screen.queryByText('Fill Opacity')).not.toBeInTheDocument();
  });

  it('calls onSettingsChange when stroke color changes', () => {
    const onSettingsChange = vi.fn();
    renderWithTheme(
      <ToolSettings 
        {...defaultProps} 
        onSettingsChange={onSettingsChange}
      />
    );
    
    const colorInput = screen.getByDisplayValue('#000000');
    fireEvent.change(colorInput, { target: { value: '#ff0000' } });
    
    expect(onSettingsChange).toHaveBeenCalledWith({ strokeColor: '#ff0000' });
  });

  it('calls onSettingsChange when stroke width changes', () => {
    const onSettingsChange = vi.fn();
    renderWithTheme(
      <ToolSettings 
        {...defaultProps} 
        onSettingsChange={onSettingsChange}
      />
    );
    
    const rangeInput = screen.getByDisplayValue('2');
    fireEvent.change(rangeInput, { target: { value: '5' } });
    
    expect(onSettingsChange).toHaveBeenCalledWith({ strokeWidth: 5 });
  });

  it('calls onSettingsChange when fill opacity changes', () => {
    const onSettingsChange = vi.fn();
    renderWithTheme(
      <ToolSettings 
        {...defaultProps} 
        activeTool={DrawingTool.CIRCLE}
        onSettingsChange={onSettingsChange}
      />
    );
    
    const opacityInput = screen.getByDisplayValue('0.3');
    fireEvent.change(opacityInput, { target: { value: '0.7' } });
    
    expect(onSettingsChange).toHaveBeenCalledWith({ fillOpacity: 0.7 });
  });

  it('calls onSettingsChange when font size changes', () => {
    const onSettingsChange = vi.fn();
    renderWithTheme(
      <ToolSettings 
        {...defaultProps} 
        activeTool={DrawingTool.TEXT}
        onSettingsChange={onSettingsChange}
      />
    );
    
    const fontSizeInput = screen.getByDisplayValue('16');
    fireEvent.change(fontSizeInput, { target: { value: '24' } });
    
    expect(onSettingsChange).toHaveBeenCalledWith({ fontSize: 24 });
  });

  it('shows preview section', () => {
    renderWithTheme(<ToolSettings {...defaultProps} />);
    
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('shows text preview for text tool', () => {
    renderWithTheme(
      <ToolSettings 
        {...defaultProps} 
        activeTool={DrawingTool.TEXT}
      />
    );
    
    expect(screen.getByText('Sample Text')).toBeInTheDocument();
  });
});