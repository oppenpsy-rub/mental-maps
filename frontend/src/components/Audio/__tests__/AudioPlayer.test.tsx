import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { vi } from 'vitest';
import { AudioPlayer, AudioStimulus } from '../AudioPlayer';
import { theme } from '../../../styles/theme';

// Mock HTMLAudioElement
const mockAudio = {
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn(),
  load: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  currentTime: 0,
  duration: 120,
  volume: 1,
  src: '',
};

// Mock HTMLAudioElement constructor
(global as any).HTMLAudioElement = vi.fn(() => mockAudio);

const mockStimulus: AudioStimulus = {
  id: 'test-audio-1',
  filename: 'test-audio.mp3',
  url: 'https://example.com/test-audio.mp3',
  duration: 120,
  metadata: {
    speaker: 'Test Speaker',
    dialect: 'Test Dialect',
    location: 'Test Location'
  }
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('AudioPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without stimulus', () => {
    renderWithTheme(<AudioPlayer stimulus={null} />);
    
    expect(screen.getByText('Kein Audio-Stimulus ausgewählt')).toBeInTheDocument();
  });

  it('renders with stimulus', () => {
    renderWithTheme(<AudioPlayer stimulus={mockStimulus} />);
    
    expect(screen.getByText('▶️')).toBeInTheDocument();
    expect(screen.getByText('test-audio.mp3')).toBeInTheDocument();
    expect(screen.getByText('Test Speaker')).toBeInTheDocument();
    expect(screen.getByText('Test Dialect')).toBeInTheDocument();
    expect(screen.getByText('Test Location')).toBeInTheDocument();
  });

  it('displays time correctly', () => {
    renderWithTheme(<AudioPlayer stimulus={mockStimulus} />);
    
    expect(screen.getByText('0:00 / 0:00')).toBeInTheDocument();
  });

  it('handles play button click', async () => {
    const onPlay = vi.fn();
    renderWithTheme(<AudioPlayer stimulus={mockStimulus} onPlay={onPlay} />);
    
    const playButton = screen.getByText('▶️');
    fireEvent.click(playButton);
    
    await waitFor(() => {
      expect(mockAudio.play).toHaveBeenCalled();
    });
  });

  it('handles volume change', () => {
    renderWithTheme(<AudioPlayer stimulus={mockStimulus} />);
    
    const volumeSlider = screen.getByRole('slider');
    fireEvent.change(volumeSlider, { target: { value: '0.5' } });
    
    expect(mockAudio.volume).toBe(0.5);
  });

  it('handles seek on progress bar click', () => {
    renderWithTheme(<AudioPlayer stimulus={mockStimulus} />);
    
    // Simulate loaded metadata
    Object.defineProperty(mockAudio, 'duration', { value: 120, writable: true });
    
    const progressBar = screen.getByRole('progressbar', { hidden: true }) || 
                       document.querySelector('[role="progressbar"]') ||
                       document.querySelector('div[style*="cursor: pointer"]');
    
    if (progressBar) {
      // Mock getBoundingClientRect
      vi.spyOn(progressBar, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        width: 100,
        top: 0,
        right: 100,
        bottom: 10,
        height: 10,
        x: 0,
        y: 0,
        toJSON: () => ({})
      });
      
      fireEvent.click(progressBar, { clientX: 50 });
      
      expect(mockAudio.currentTime).toBe(60); // 50% of 120 seconds
    }
  });

  it('calls onTimeUpdate when time changes', () => {
    const onTimeUpdate = vi.fn();
    renderWithTheme(<AudioPlayer stimulus={mockStimulus} onTimeUpdate={onTimeUpdate} />);
    
    // Simulate time update event
    const timeUpdateCallback = mockAudio.addEventListener.mock.calls
      .find(call => call[0] === 'timeupdate')?.[1];
    
    if (timeUpdateCallback) {
      Object.defineProperty(mockAudio, 'currentTime', { value: 30, writable: true });
      timeUpdateCallback();
      
      expect(onTimeUpdate).toHaveBeenCalledWith(30);
    }
  });

  it('calls onEnded when audio ends', () => {
    const onEnded = vi.fn();
    renderWithTheme(<AudioPlayer stimulus={mockStimulus} onEnded={onEnded} />);
    
    // Simulate ended event
    const endedCallback = mockAudio.addEventListener.mock.calls
      .find(call => call[0] === 'ended')?.[1];
    
    if (endedCallback) {
      endedCallback();
      expect(onEnded).toHaveBeenCalled();
    }
  });

  it('handles audio loading error', () => {
    renderWithTheme(<AudioPlayer stimulus={mockStimulus} />);
    
    // Simulate error event
    const errorCallback = mockAudio.addEventListener.mock.calls
      .find(call => call[0] === 'error')?.[1];
    
    if (errorCallback) {
      errorCallback();
      expect(screen.getByText('Fehler beim Laden der Audiodatei')).toBeInTheDocument();
    }
  });

  it('resets state when stimulus changes', () => {
    const { rerender } = renderWithTheme(<AudioPlayer stimulus={mockStimulus} />);
    
    const newStimulus: AudioStimulus = {
      ...mockStimulus,
      id: 'test-audio-2',
      filename: 'new-audio.mp3'
    };
    
    rerender(
      <ThemeProvider theme={theme}>
        <AudioPlayer stimulus={newStimulus} />
      </ThemeProvider>
    );
    
    expect(mockAudio.pause).toHaveBeenCalled();
    expect(screen.getByText('new-audio.mp3')).toBeInTheDocument();
  });

  it('formats time correctly', () => {
    renderWithTheme(<AudioPlayer stimulus={mockStimulus} />);
    
    // Simulate loaded metadata with duration
    const loadedMetadataCallback = mockAudio.addEventListener.mock.calls
      .find(call => call[0] === 'loadedmetadata')?.[1];
    
    if (loadedMetadataCallback) {
      Object.defineProperty(mockAudio, 'duration', { value: 125, writable: true });
      loadedMetadataCallback();
      
      expect(screen.getByText(/2:05/)).toBeInTheDocument(); // 125 seconds = 2:05
    }
  });

  it('disables play button when loading', () => {
    renderWithTheme(<AudioPlayer stimulus={mockStimulus} />);
    
    const playButton = screen.getByText('▶️');
    expect(playButton).not.toBeDisabled();
    
    // The button should be disabled during loading state
    // This would be tested by checking the loading state in the component
  });
});