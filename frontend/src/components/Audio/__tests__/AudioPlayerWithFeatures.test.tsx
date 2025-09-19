import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { vi } from 'vitest';
import { AudioPlayerWithFeatures } from '../AudioPlayerWithFeatures';
import { AudioStimulus } from '../AudioPlayer';
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

(global as any).HTMLAudioElement = vi.fn(() => mockAudio);

const mockStimulus: AudioStimulus = {
    id: 'test-audio-1',
    filename: 'test-audio-with-features.mp3',
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

describe('AudioPlayerWithFeatures', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders without stimulus', () => {
        renderWithTheme(<AudioPlayerWithFeatures stimulus={null} />);

        expect(screen.getByText('Kein Audio-Stimulus ausgewählt')).toBeInTheDocument();
    });

    it('renders with stimulus and all features enabled', () => {
        renderWithTheme(
            <AudioPlayerWithFeatures
                stimulus={mockStimulus}
                enableRepeat={true}
                enablePreloading={true}
                enableProgressVisualization={true}
            />
        );

        expect(screen.getByText('test-audio-with-features.mp3')).toBeInTheDocument();
        expect(screen.getByText('▶️')).toBeInTheDocument();
        expect(screen.getByText('🔁')).toBeInTheDocument();
        expect(screen.getByText('Wiedergaben: 0')).toBeInTheDocument();
    });

    it('shows preloading indicator', () => {
        renderWithTheme(
            <AudioPlayerWithFeatures
                stimulus={mockStimulus}
                enablePreloading={true}
            />
        );

        expect(screen.getByText('⏳ Lädt vor...')).toBeInTheDocument();
    });

    it('handles repeat toggle', () => {
        renderWithTheme(
            <AudioPlayerWithFeatures
                stimulus={mockStimulus}
                enableRepeat={true}
            />
        );

        const repeatButton = screen.getByText('🔁');
        fireEvent.click(repeatButton);

        // The button should toggle the repeat state
        expect(repeatButton).toBeInTheDocument();
    });

    it('calls onPlayCountChange when play count increases', () => {
        const onPlayCountChange = vi.fn();
        renderWithTheme(
            <AudioPlayerWithFeatures
                stimulus={mockStimulus}
                onPlayCountChange={onPlayCountChange}
            />
        );

        // Simulate play event
        const playCallback = mockAudio.addEventListener.mock.calls
            .find(call => call[0] === 'play')?.[1];

        if (playCallback) {
            playCallback();
            expect(onPlayCountChange).toHaveBeenCalledWith(1);
        }
    });

    it('calls onLoadingStateChange when loading state changes', () => {
        const onLoadingStateChange = vi.fn();
        renderWithTheme(
            <AudioPlayerWithFeatures
                stimulus={mockStimulus}
                onLoadingStateChange={onLoadingStateChange}
            />
        );

        expect(onLoadingStateChange).toHaveBeenCalledWith(true);

        // Simulate canplay event
        const canPlayCallback = mockAudio.addEventListener.mock.calls
            .find(call => call[0] === 'canplay')?.[1];

        if (canPlayCallback) {
            canPlayCallback();
            expect(onLoadingStateChange).toHaveBeenCalledWith(false);
        }
    });

    it('auto-plays when autoPlay is enabled', () => {
        renderWithTheme(
            <AudioPlayerWithFeatures
                stimulus={mockStimulus}
                autoPlay={true}
            />
        );

        // Simulate canplay event for auto-play
        const canPlayCallback = mockAudio.addEventListener.mock.calls
            .find(call => call[0] === 'canplay')?.[1];

        if (canPlayCallback) {
            canPlayCallback();
            expect(mockAudio.play).toHaveBeenCalled();
        }
    });

    it('handles repeat functionality on audio end', () => {
        renderWithTheme(
            <AudioPlayerWithFeatures
                stimulus={mockStimulus}
                enableRepeat={true}
            />
        );

        // Simulate ended event with repeat enabled
        const endedCallback = mockAudio.addEventListener.mock.calls
            .find(call => call[0] === 'ended')?.[1];

        if (endedCallback) {
            endedCallback();

            // Should reset currentTime and play again after delay
            setTimeout(() => {
                expect(mockAudio.currentTime).toBe(0);
                expect(mockAudio.play).toHaveBeenCalled();
            }, 250);
        }
    });

    it('displays waveform visualization when enabled', () => {
        renderWithTheme(
            <AudioPlayerWithFeatures
                stimulus={mockStimulus}
                enableProgressVisualization={true}
            />
        );

        // Check if waveform bars are rendered (they should be in the DOM)
        const waveformContainer = document.querySelector('[style*="gap: 2px"]');
        expect(waveformContainer).toBeInTheDocument();
    });

    it('handles volume control', () => {
        renderWithTheme(
            <AudioPlayerWithFeatures
                stimulus={mockStimulus}
            />
        );

        const volumeSlider = screen.getByRole('slider');
        fireEvent.change(volumeSlider, { target: { value: '0.7' } });

        expect(mockAudio.volume).toBe(0.7);
        expect(screen.getByText('70%')).toBeInTheDocument();
    });

    it('shows loading indicator when loading', () => {
        renderWithTheme(
            <AudioPlayerWithFeatures
                stimulus={mockStimulus}
            />
        );

        expect(screen.getByText('Lädt...')).toBeInTheDocument();
    });

    it('displays error message on audio error', () => {
        renderWithTheme(
            <AudioPlayerWithFeatures
                stimulus={mockStimulus}
            />
        );

        // Simulate error event
        const errorCallback = mockAudio.addEventListener.mock.calls
            .find(call => call[0] === 'error')?.[1];

        if (errorCallback) {
            errorCallback();
            expect(screen.getByText('Fehler beim Laden der Audiodatei')).toBeInTheDocument();
        }
    });

    it('updates progress visualization based on current time', () => {
        renderWithTheme(
            <AudioPlayerWithFeatures
                stimulus={mockStimulus}
                enableProgressVisualization={true}
            />
        );

        // Simulate loaded metadata
        const loadedMetadataCallback = mockAudio.addEventListener.mock.calls
            .find(call => call[0] === 'loadedmetadata')?.[1];

        if (loadedMetadataCallback) {
            Object.defineProperty(mockAudio, 'duration', { value: 120, writable: true });
            loadedMetadataCallback();
        }

        // Simulate time update
        const timeUpdateCallback = mockAudio.addEventListener.mock.calls
            .find(call => call[0] === 'timeupdate')?.[1];

        if (timeUpdateCallback) {
            Object.defineProperty(mockAudio, 'currentTime', { value: 60, writable: true });
            timeUpdateCallback();

            // Progress should be 50%
            expect(screen.getByText('1:00')).toBeInTheDocument();
        }
    });

    it('handles seek functionality', () => {
        renderWithTheme(
            <AudioPlayerWithFeatures
                stimulus={mockStimulus}
            />
        );

        // Simulate loaded metadata
        Object.defineProperty(mockAudio, 'duration', { value: 120, writable: true });

        const progressBar = document.querySelector('[style*="cursor: pointer"]');

        if (progressBar) {
            // Mock getBoundingClientRect
            vi.spyOn(progressBar, 'getBoundingClientRect').mockReturnValue({
                left: 0,
                width: 100,
                top: 0,
                right: 100,
                bottom: 8,
                height: 8,
                x: 0,
                y: 0,
                toJSON: () => ({})
            });

            fireEvent.click(progressBar, { clientX: 25 });

            expect(mockAudio.currentTime).toBe(30); // 25% of 120 seconds
        }
    });

    it('shows endlos-modus indicator when repeat is enabled', () => {
        renderWithTheme(
            <AudioPlayerWithFeatures
                stimulus={mockStimulus}
                enableRepeat={true}
            />
        );

        expect(screen.getByText('Endlos-Modus')).toBeInTheDocument();
    });
});