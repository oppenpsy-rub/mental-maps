import { useState, useRef, useCallback, useEffect } from 'react';

export interface AudioStimulus {
  id: string;
  filename: string;
  url: string;
  duration?: number;
  metadata?: {
    speaker?: string;
    dialect?: string;
    location?: string;
  };
}

export interface AudioState {
  currentStimulus: AudioStimulus | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isLoading: boolean;
  error: string | null;
  playCount: number;
}

export interface AudioControls {
  loadStimulus: (stimulus: AudioStimulus) => void;
  play: () => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  reset: () => void;
}

export const useAudio = (): [AudioState, AudioControls] => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<AudioState>({
    currentStimulus: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isLoading: false,
    error: null,
    playCount: 0
  });

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'metadata';
    }

    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setState(prev => ({
        ...prev,
        currentTime: audio.currentTime
      }));
    };

    const handleLoadedMetadata = () => {
      setState(prev => ({
        ...prev,
        duration: audio.duration,
        isLoading: false
      }));
    };

    const handlePlay = () => {
      setState(prev => ({
        ...prev,
        isPlaying: true,
        playCount: prev.playCount + 1
      }));
    };

    const handlePause = () => {
      setState(prev => ({
        ...prev,
        isPlaying: false
      }));
    };

    const handleEnded = () => {
      setState(prev => ({
        ...prev,
        isPlaying: false
      }));
    };

    const handleError = () => {
      setState(prev => ({
        ...prev,
        error: 'Fehler beim Laden der Audiodatei',
        isLoading: false,
        isPlaying: false
      }));
    };

    const handleCanPlay = () => {
      setState(prev => ({
        ...prev,
        isLoading: false
      }));
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, []);

  const loadStimulus = useCallback((stimulus: AudioStimulus) => {
    if (!audioRef.current) return;

    const audio = audioRef.current;
    
    // Reset state
    setState(prev => ({
      ...prev,
      currentStimulus: stimulus,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      isLoading: true,
      error: null,
      playCount: 0
    }));

    // Load new audio
    audio.src = stimulus.url;
    audio.volume = state.volume;
    audio.load();
  }, [state.volume]);

  const play = useCallback(async (): Promise<void> => {
    if (!audioRef.current || !state.currentStimulus) {
      throw new Error('Kein Audio-Stimulus geladen');
    }

    try {
      await audioRef.current.play();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Fehler beim Abspielen der Audiodatei',
        isPlaying: false
      }));
      throw error;
    }
  }, [state.currentStimulus]);

  const pause = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
  }, []);

  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;
    
    const clampedTime = Math.max(0, Math.min(time, state.duration));
    audioRef.current.currentTime = clampedTime;
    
    setState(prev => ({
      ...prev,
      currentTime: clampedTime
    }));
  }, [state.duration]);

  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    
    setState(prev => ({
      ...prev,
      volume: clampedVolume
    }));

    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
  }, []);

  const reset = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setState({
      currentStimulus: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      isLoading: false,
      error: null,
      playCount: 0
    });
  }, []);

  const controls: AudioControls = {
    loadStimulus,
    play,
    pause,
    seek,
    setVolume,
    reset
  };

  return [state, controls];
};

// Utility functions for audio format validation
export const SUPPORTED_AUDIO_FORMATS = ['mp3', 'wav', 'ogg', 'aac', 'm4a'];

export const isAudioFormatSupported = (filename: string): boolean => {
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension ? SUPPORTED_AUDIO_FORMATS.includes(extension) : false;
};

export const getAudioMimeType = (filename: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'mp3':
      return 'audio/mpeg';
    case 'wav':
      return 'audio/wav';
    case 'ogg':
      return 'audio/ogg';
    case 'aac':
      return 'audio/aac';
    case 'm4a':
      return 'audio/mp4';
    default:
      return 'audio/*';
  }
};