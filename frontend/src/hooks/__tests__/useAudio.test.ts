import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useAudio, AudioStimulus, isAudioFormatSupported, getAudioMimeType } from '../useAudio';

// Mock HTMLAudioElement
const createMockAudio = () => ({
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn(),
  load: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  currentTime: 0,
  duration: 0,
  volume: 1,
  src: '',
});

const mockAudio = createMockAudio();
(global as any).Audio = vi.fn(() => createMockAudio());

const mockStimulus: AudioStimulus = {
  id: 'test-audio-1',
  filename: 'test-audio.mp3',
  url: 'https://example.com/test-audio.mp3',
  duration: 120,
  metadata: {
    speaker: 'Test Speaker',
    dialect: 'Test Dialect'
  }
};

describe('useAudio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useAudio());
    const [state] = result.current;

    expect(state).toEqual({
      currentStimulus: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      isLoading: false,
      error: null,
      playCount: 0
    });
  });

  it('loads stimulus correctly', () => {
    const { result } = renderHook(() => useAudio());
    const [, controls] = result.current;

    act(() => {
      controls.loadStimulus(mockStimulus);
    });

    const [state] = result.current;
    expect(state.currentStimulus).toEqual(mockStimulus);
    expect(state.isLoading).toBe(true);
    expect(mockAudio.src).toBe(mockStimulus.url);
    expect(mockAudio.load).toHaveBeenCalled();
  });

  it('plays audio correctly', async () => {
    const { result } = renderHook(() => useAudio());
    const [, controls] = result.current;

    act(() => {
      controls.loadStimulus(mockStimulus);
    });

    await act(async () => {
      await controls.play();
    });

    expect(mockAudio.play).toHaveBeenCalled();
  });

  it('pauses audio correctly', () => {
    const { result } = renderHook(() => useAudio());
    const [, controls] = result.current;

    act(() => {
      controls.pause();
    });

    expect(mockAudio.pause).toHaveBeenCalled();
  });

  it('seeks to correct time', () => {
    const { result } = renderHook(() => useAudio());
    const [, controls] = result.current;

    // Set duration first
    act(() => {
      controls.loadStimulus(mockStimulus);
    });

    // Simulate loaded metadata
    act(() => {
      const loadedMetadataCallback = mockAudio.addEventListener.mock.calls
        .find(call => call[0] === 'loadedmetadata')?.[1];
      
      if (loadedMetadataCallback) {
        Object.defineProperty(mockAudio, 'duration', { value: 120, writable: true });
        loadedMetadataCallback();
      }
    });

    act(() => {
      controls.seek(60);
    });

    expect(mockAudio.currentTime).toBe(60);
  });

  it('clamps seek time to valid range', () => {
    const { result } = renderHook(() => useAudio());
    const [, controls] = result.current;

    act(() => {
      controls.loadStimulus(mockStimulus);
    });

    // Simulate loaded metadata
    act(() => {
      const loadedMetadataCallback = mockAudio.addEventListener.mock.calls
        .find(call => call[0] === 'loadedmetadata')?.[1];
      
      if (loadedMetadataCallback) {
        Object.defineProperty(mockAudio, 'duration', { value: 120, writable: true });
        loadedMetadataCallback();
      }
    });

    // Test negative time
    act(() => {
      controls.seek(-10);
    });
    expect(mockAudio.currentTime).toBe(0);

    // Test time beyond duration
    act(() => {
      controls.seek(150);
    });
    expect(mockAudio.currentTime).toBe(120);
  });

  it('sets volume correctly', () => {
    const { result } = renderHook(() => useAudio());
    const [, controls] = result.current;

    act(() => {
      controls.setVolume(0.5);
    });

    const [state] = result.current;
    expect(state.volume).toBe(0.5);
    expect(mockAudio.volume).toBe(0.5);
  });

  it('clamps volume to valid range', () => {
    const { result } = renderHook(() => useAudio());
    const [, controls] = result.current;

    // Test negative volume
    act(() => {
      controls.setVolume(-0.5);
    });

    let [state] = result.current;
    expect(state.volume).toBe(0);

    // Test volume above 1
    act(() => {
      controls.setVolume(1.5);
    });

    [state] = result.current;
    expect(state.volume).toBe(1);
  });

  it('resets state correctly', () => {
    const { result } = renderHook(() => useAudio());
    const [, controls] = result.current;

    // Load stimulus and change some state
    act(() => {
      controls.loadStimulus(mockStimulus);
      controls.setVolume(0.5);
    });

    act(() => {
      controls.reset();
    });

    const [state] = result.current;
    expect(state).toEqual({
      currentStimulus: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      isLoading: false,
      error: null,
      playCount: 0
    });
    expect(mockAudio.pause).toHaveBeenCalled();
    expect(mockAudio.currentTime).toBe(0);
  });

  it('handles play event correctly', () => {
    const { result } = renderHook(() => useAudio());

    act(() => {
      const playCallback = mockAudio.addEventListener.mock.calls
        .find(call => call[0] === 'play')?.[1];
      
      if (playCallback) {
        playCallback();
      }
    });

    const [state] = result.current;
    expect(state.isPlaying).toBe(true);
    expect(state.playCount).toBe(1);
  });

  it('handles pause event correctly', () => {
    const { result } = renderHook(() => useAudio());

    act(() => {
      const pauseCallback = mockAudio.addEventListener.mock.calls
        .find(call => call[0] === 'pause')?.[1];
      
      if (pauseCallback) {
        pauseCallback();
      }
    });

    const [state] = result.current;
    expect(state.isPlaying).toBe(false);
  });

  it('handles error correctly', () => {
    const { result } = renderHook(() => useAudio());

    act(() => {
      const errorCallback = mockAudio.addEventListener.mock.calls
        .find(call => call[0] === 'error')?.[1];
      
      if (errorCallback) {
        errorCallback();
      }
    });

    const [state] = result.current;
    expect(state.error).toBe('Fehler beim Laden der Audiodatei');
    expect(state.isLoading).toBe(false);
    expect(state.isPlaying).toBe(false);
  });

  it('throws error when playing without stimulus', async () => {
    const { result } = renderHook(() => useAudio());
    const [, controls] = result.current;

    await expect(controls.play()).rejects.toThrow('Kein Audio-Stimulus geladen');
  });
});

describe('Audio utility functions', () => {
  describe('isAudioFormatSupported', () => {
    it('returns true for supported formats', () => {
      expect(isAudioFormatSupported('test.mp3')).toBe(true);
      expect(isAudioFormatSupported('test.wav')).toBe(true);
      expect(isAudioFormatSupported('test.ogg')).toBe(true);
      expect(isAudioFormatSupported('test.aac')).toBe(true);
      expect(isAudioFormatSupported('test.m4a')).toBe(true);
    });

    it('returns false for unsupported formats', () => {
      expect(isAudioFormatSupported('test.txt')).toBe(false);
      expect(isAudioFormatSupported('test.pdf')).toBe(false);
      expect(isAudioFormatSupported('test')).toBe(false);
    });

    it('is case insensitive', () => {
      expect(isAudioFormatSupported('test.MP3')).toBe(true);
      expect(isAudioFormatSupported('test.WAV')).toBe(true);
    });
  });

  describe('getAudioMimeType', () => {
    it('returns correct MIME types', () => {
      expect(getAudioMimeType('test.mp3')).toBe('audio/mpeg');
      expect(getAudioMimeType('test.wav')).toBe('audio/wav');
      expect(getAudioMimeType('test.ogg')).toBe('audio/ogg');
      expect(getAudioMimeType('test.aac')).toBe('audio/aac');
      expect(getAudioMimeType('test.m4a')).toBe('audio/mp4');
    });

    it('returns generic MIME type for unknown formats', () => {
      expect(getAudioMimeType('test.unknown')).toBe('audio/*');
      expect(getAudioMimeType('test')).toBe('audio/*');
    });

    it('is case insensitive', () => {
      expect(getAudioMimeType('test.MP3')).toBe('audio/mpeg');
      expect(getAudioMimeType('test.WAV')).toBe('audio/wav');
    });
  });
});