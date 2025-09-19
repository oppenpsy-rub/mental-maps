import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { Button } from '../UI/Button';
import { Card } from '../UI/Card';
import { AudioStimulus } from './AudioPlayer';

interface AudioPlayerWithFeaturesProps {
  stimulus: AudioStimulus | null;
  enableRepeat?: boolean;
  enablePreloading?: boolean;
  enableProgressVisualization?: boolean;
  autoPlay?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  onPlayCountChange?: (count: number) => void;
  onLoadingStateChange?: (isLoading: boolean) => void;
  className?: string;
}

const PlayerContainer = styled(Card)`
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 350px;
`;

const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
`;

const AudioInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const FileName = styled.h4`
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const LoadingIndicator = styled.div<{ $isLoading: boolean }>`
  display: ${({ $isLoading }) => $isLoading ? 'flex' : 'none'};
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const ProgressVisualization = styled.div`
  height: 80px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const WaveformContainer = styled.div`
  width: 100%;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
`;

const WaveformBar = styled.div<{ height: number; $active: boolean }>`
  width: 3px;
  height: ${({ height }) => height}px;
  background-color: ${({ $active, theme }) => 
    $active ? theme.colors.primary.main : theme.colors.background.secondary};
  border-radius: 1.5px;
  transition: all 0.2s ease;
`;

const ControlsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const MainControls = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const PlayButton = styled(Button)<{ $isLoading: boolean }>`
  min-width: 60px;
  height: 60px;
  border-radius: 50%;
  font-size: 1.5rem;
  opacity: ${({ $isLoading }) => $isLoading ? 0.6 : 1};
  cursor: ${({ $isLoading }) => $isLoading ? 'not-allowed' : 'pointer'};
`;

const ProgressSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ProgressBar = styled.div`
  height: 8px;
  background-color: ${({ theme }) => theme.colors.background.secondary};
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ progress: number }>`
  height: 100%;
  background: linear-gradient(90deg, 
    ${({ theme }) => theme.colors.primary.main} 0%, 
    ${({ theme }) => theme.colors.primary.light} 100%);
  width: ${({ progress }) => progress}%;
  transition: width 0.1s ease;
  border-radius: 4px;
`;

const TimeInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: monospace;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const SecondaryControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 0.5rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border.light};
`;

const ControlGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const VolumeControl = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const VolumeSlider = styled.input`
  width: 80px;
  height: 4px;
  border-radius: 2px;
  background: ${({ theme }) => theme.colors.background.secondary};
  outline: none;
  
  &::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.primary.main};
    cursor: pointer;
  }
`;

const RepeatButton = styled(Button)<{ $active: boolean }>`
  background-color: ${({ $active, theme }) => 
    $active ? theme.colors.primary.main : 'transparent'};
  color: ${({ $active, theme }) => 
    $active ? 'white' : theme.colors.text.secondary};
  border: 1px solid ${({ $active, theme }) => 
    $active ? theme.colors.primary.main : theme.colors.border.light};
`;

const StatsDisplay = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  text-align: right;
`;

const ErrorMessage = styled.div`
  background-color: ${({ theme }) => theme.colors.error?.light || '#fee'};
  color: ${({ theme }) => theme.colors.error?.main || '#c53030'};
  padding: 0.75rem;
  border-radius: 4px;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
`;

export const AudioPlayerWithFeatures: React.FC<AudioPlayerWithFeaturesProps> = ({
  stimulus,
  enableRepeat = true,
  enablePreloading = true,
  enableProgressVisualization = true,
  autoPlay = false,
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
  onPlayCountChange,
  onLoadingStateChange,
  className
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const preloadAudioRef = useRef<HTMLAudioElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repeatEnabled, setRepeatEnabled] = useState(enableRepeat);
  const [playCount, setPlayCount] = useState(0);
  const [isPreloaded, setIsPreloaded] = useState(false);

  // Waveform visualization data (mock data for demo)
  const waveformBars = Array.from({ length: 50 }, () => ({
    height: Math.random() * 40 + 10,
    active: false
  }));

  // Update active bars based on progress
  const activeBarCount = Math.floor((currentTime / duration) * waveformBars.length);
  waveformBars.forEach((bar, index) => {
    bar.active = index < activeBarCount;
  });

  // Preload audio when stimulus changes
  useEffect(() => {
    if (!stimulus || !enablePreloading) return;

    const preloadAudio = () => {
      if (preloadAudioRef.current) {
        preloadAudioRef.current.src = stimulus.url;
        preloadAudioRef.current.load();
        
        const handleCanPlay = () => {
          setIsPreloaded(true);
          preloadAudioRef.current?.removeEventListener('canplay', handleCanPlay);
        };
        
        preloadAudioRef.current.addEventListener('canplay', handleCanPlay);
      }
    };

    // Preload with a small delay to avoid blocking main audio
    const timeoutId = setTimeout(preloadAudio, 100);
    
    return () => {
      clearTimeout(timeoutId);
      setIsPreloaded(false);
    };
  }, [stimulus, enablePreloading]);

  // Main audio setup
  useEffect(() => {
    if (!stimulus || !audioRef.current) return;

    setIsLoading(true);
    setError(null);
    setCurrentTime(0);
    setDuration(0);
    setPlayCount(0);
    onLoadingStateChange?.(true);

    const audio = audioRef.current;
    audio.src = stimulus.url;
    audio.volume = volume;
    audio.load();

    // Auto-play if enabled
    if (autoPlay) {
      const playWhenReady = () => {
        audio.play().catch(console.error);
        audio.removeEventListener('canplay', playWhenReady);
      };
      audio.addEventListener('canplay', playWhenReady);
    }

    return () => {
      audio.pause();
      setIsPlaying(false);
    };
  }, [stimulus, volume, autoPlay, onLoadingStateChange]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const time = audio.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      onLoadingStateChange?.(false);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setPlayCount(prev => {
        const newCount = prev + 1;
        onPlayCountChange?.(newCount);
        return newCount;
      });
      onPlay?.();
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };

    const handleEnded = () => {
      setIsPlaying(false);
      
      if (repeatEnabled) {
        // Auto-repeat with a small delay
        setTimeout(() => {
          audio.currentTime = 0;
          audio.play().catch(console.error);
        }, 200);
      } else {
        onEnded?.();
      }
    };

    const handleError = () => {
      setError('Fehler beim Laden der Audiodatei');
      setIsLoading(false);
      onLoadingStateChange?.(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      onLoadingStateChange?.(false);
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
  }, [repeatEnabled, onPlay, onPause, onEnded, onTimeUpdate, onPlayCountChange, onLoadingStateChange]);

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

  const handleRepeatToggle = useCallback(() => {
    setRepeatEnabled(!repeatEnabled);
  }, [repeatEnabled]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!stimulus) {
    return (
      <PlayerContainer className={className}>
        <div style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
          Kein Audio-Stimulus ausgewählt
        </div>
      </PlayerContainer>
    );
  }

  return (
    <PlayerContainer className={className}>
      <audio ref={audioRef} preload="metadata" />
      {enablePreloading && <audio ref={preloadAudioRef} preload="auto" />}
      
      <HeaderSection>
        <AudioInfo>
          <FileName title={stimulus.filename}>
            {stimulus.filename}
          </FileName>
          <LoadingIndicator $isLoading={isLoading}>
            <span>⏳</span>
            <span>Lädt...</span>
          </LoadingIndicator>
        </AudioInfo>
        
        {enablePreloading && (
          <div style={{ fontSize: '0.75rem', color: isPreloaded ? 'green' : 'orange' }}>
            {isPreloaded ? '✓ Vorgeladen' : '⏳ Lädt vor...'}
          </div>
        )}
      </HeaderSection>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      {enableProgressVisualization && (
        <ProgressVisualization>
          <WaveformContainer>
            {waveformBars.map((bar, index) => (
              <WaveformBar
                key={index}
                height={bar.height}
                $active={bar.active}
              />
            ))}
          </WaveformContainer>
        </ProgressVisualization>
      )}
      
      <ControlsSection>
        <MainControls>
          <PlayButton
            onClick={handlePlayPause}
            disabled={isLoading || !!error}
            variant="primary"
            size="lg"
            $isLoading={isLoading}
          >
            {isLoading ? '⏳' : isPlaying ? '⏸️' : '▶️'}
          </PlayButton>
          
          <ProgressSection>
            <ProgressBar onClick={handleSeek}>
              <ProgressFill progress={progress} />
            </ProgressBar>
            <TimeInfo>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </TimeInfo>
          </ProgressSection>
        </MainControls>
        
        <SecondaryControls>
          <ControlGroup>
            <VolumeControl>
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
            </VolumeControl>
            
            {enableRepeat && (
              <RepeatButton
                onClick={handleRepeatToggle}
                $active={repeatEnabled}
                size="sm"
                title={repeatEnabled ? 'Wiederholung deaktivieren' : 'Wiederholung aktivieren'}
              >
                🔁
              </RepeatButton>
            )}
          </ControlGroup>
          
          <StatsDisplay>
            <div>Wiedergaben: {playCount}</div>
            {repeatEnabled && <div>Endlos-Modus</div>}
          </StatsDisplay>
        </SecondaryControls>
      </ControlsSection>
    </PlayerContainer>
  );
};