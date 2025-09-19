import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { Button } from '../UI/Button';
import { Card } from '../UI/Card';

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

interface AudioPlayerProps {
  stimulus: AudioStimulus | null;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  className?: string;
}

const PlayerContainer = styled(Card)`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 300px;
`;

const ControlsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const TimeDisplay = styled.div`
  font-family: monospace;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  min-width: 80px;
`;

const ProgressContainer = styled.div`
  flex: 1;
  height: 6px;
  background-color: ${({ theme }) => theme.colors.background.secondary};
  border-radius: 3px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
`;

const ProgressBar = styled.div<{ progress: number }>`
  height: 100%;
  background-color: ${({ theme }) => theme.colors.primary.main};
  width: ${({ progress }) => progress}%;
  transition: width 0.1s ease;
`;

const VolumeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const VolumeSlider = styled.input`
  width: 80px;
`;

const MetadataContainer = styled.div`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  border-top: 1px solid ${({ theme }) => theme.colors.border.light};
  padding-top: 0.5rem;
`;

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  stimulus,
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
  className
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when stimulus changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setError(null);
    }
  }, [stimulus?.id]);

  // Load audio when stimulus changes
  useEffect(() => {
    if (stimulus && audioRef.current) {
      setIsLoading(true);
      setError(null);
      
      const audio = audioRef.current;
      audio.src = stimulus.url;
      audio.volume = volume;
      
      const handleLoadedMetadata = () => {
        setDuration(audio.duration);
        setIsLoading(false);
      };
      
      const handleError = () => {
        setError('Fehler beim Laden der Audiodatei');
        setIsLoading(false);
      };
      
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('error', handleError);
      
      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('error', handleError);
      };
    }
  }, [stimulus, volume]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const time = audio.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [onPlay, onPause, onEnded, onTimeUpdate]);

  const handlePlayPause = useCallback(() => {
    if (!audioRef.current || !stimulus) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => {
        console.error('Error playing audio:', err);
        setError('Fehler beim Abspielen der Audiodatei');
      });
    }
  }, [isPlaying, stimulus]);

  const handleSeek = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  const handleVolumeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
    
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!stimulus) {
    return (
      <PlayerContainer className={className}>
        <div style={{ textAlign: 'center', color: '#666' }}>
          Kein Audio-Stimulus ausgewählt
        </div>
      </PlayerContainer>
    );
  }

  return (
    <PlayerContainer className={className}>
      <audio ref={audioRef} preload="metadata" />
      
      {error && (
        <div style={{ color: 'red', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}
      
      <ControlsRow>
        <Button
          onClick={handlePlayPause}
          disabled={isLoading || !!error}
          variant="primary"
          size="sm"
        >
          {isLoading ? '...' : isPlaying ? '⏸️' : '▶️'}
        </Button>
        
        <TimeDisplay>
          {formatTime(currentTime)} / {formatTime(duration)}
        </TimeDisplay>
        
        <ProgressContainer onClick={handleSeek}>
          <ProgressBar progress={progress} />
        </ProgressContainer>
      </ControlsRow>
      
      <VolumeContainer>
        <span>🔊</span>
        <VolumeSlider
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={handleVolumeChange}
        />
        <span>{Math.round(volume * 100)}%</span>
      </VolumeContainer>
      
      {stimulus.metadata && (
        <MetadataContainer>
          <div><strong>Datei:</strong> {stimulus.filename}</div>
          {stimulus.metadata.speaker && (
            <div><strong>Sprecher:</strong> {stimulus.metadata.speaker}</div>
          )}
          {stimulus.metadata.dialect && (
            <div><strong>Dialekt:</strong> {stimulus.metadata.dialect}</div>
          )}
          {stimulus.metadata.location && (
            <div><strong>Aufnahmeort:</strong> {stimulus.metadata.location}</div>
          )}
        </MetadataContainer>
      )}
    </PlayerContainer>
  );
};