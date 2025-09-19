import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { Button } from '../UI/Button';
import { Card } from '../UI/Card';
import { AudioStimulus } from './AudioPlayer';

interface AdvancedAudioPlayerProps {
    stimulus: AudioStimulus | null;
    enableVisualization?: boolean;
    enableRepeat?: boolean;
    onPlay?: () => void;
    onPause?: () => void;
    onEnded?: () => void;
    onTimeUpdate?: (currentTime: number) => void;
    onPlayCountChange?: (count: number) => void;
    className?: string;
}

const PlayerContainer = styled(Card)`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const VisualizationContainer = styled.div`
  height: 60px;
  background-color: ${({ theme }) => theme.colors.background.secondary};
  border-radius: 4px;
  position: relative;
  overflow: hidden;
`;

const Canvas = styled.canvas`
  width: 100%;
  height: 100%;
  display: block;
`;

const ControlsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const MainControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const SecondaryControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
`;

const ProgressContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
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
  background-color: ${({ theme }) => theme.colors.primary.main};
  width: ${({ progress }) => progress}%;
  transition: width 0.1s ease;
`;

const TimeInfo = styled.div`
  display: flex;
  justify-content: space-between;
  font-family: monospace;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const VolumeControl = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const RepeatIndicator = styled.div<{ $active: boolean }>`
  color: ${({ $active, theme }) =>
        $active ? theme.colors.primary.main : theme.colors.text.secondary};
  font-weight: ${({ $active }) => $active ? 'bold' : 'normal'};
`;

const PlayCountDisplay = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

export const AdvancedAudioPlayer: React.FC<AdvancedAudioPlayerProps> = ({
    stimulus,
    enableVisualization = true,
    enableRepeat = true,
    onPlay,
    onPause,
    onEnded,
    onTimeUpdate,
    onPlayCountChange,
    className
}) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const animationRef = useRef<number | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [repeatEnabled, setRepeatEnabled] = useState(enableRepeat);
    const [playCount, setPlayCount] = useState(0);

    // Initialize Web Audio API
    const initializeAudioContext = useCallback(async () => {
        if (!audioRef.current || audioContextRef.current) return;

        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaElementSource(audioRef.current);

            analyser.fftSize = 256;
            source.connect(analyser);
            analyser.connect(audioContext.destination);

            audioContextRef.current = audioContext;
            analyserRef.current = analyser;
            sourceRef.current = source;

            if (enableVisualization) {
                startVisualization();
            }
        } catch (err) {
            console.error('Error initializing Web Audio API:', err);
        }
    }, [enableVisualization]);

    // Visualization
    const startVisualization = useCallback(() => {
        if (!canvasRef.current || !analyserRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const analyser = analyserRef.current;

        if (!ctx) return;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            if (!isPlaying) {
                animationRef.current = requestAnimationFrame(draw);
                return;
            }

            analyser.getByteFrequencyData(dataArray);

            ctx.fillStyle = '#f5f5f5';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = (dataArray[i] / 255) * canvas.height;

                const r = barHeight + 25 * (i / bufferLength);
                const g = 250 * (i / bufferLength);
                const b = 50;

                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

                x += barWidth + 1;
            }

            animationRef.current = requestAnimationFrame(draw);
        };

        draw();
    }, [isPlaying]);

    // Setup audio element event listeners
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
        };

        const handlePlay = () => {
            setIsPlaying(true);
            setPlayCount(prev => {
                const newCount = prev + 1;
                onPlayCountChange?.(newCount);
                return newCount;
            });
            onPlay?.();

            // Resume audio context if suspended
            if (audioContextRef.current?.state === 'suspended') {
                audioContextRef.current.resume();
            }
        };

        const handlePause = () => {
            setIsPlaying(false);
            onPause?.();
        };

        const handleEnded = () => {
            setIsPlaying(false);

            if (repeatEnabled) {
                // Auto-replay if repeat is enabled
                setTimeout(() => {
                    audio.currentTime = 0;
                    audio.play().catch(console.error);
                }, 100);
            } else {
                onEnded?.();
            }
        };

        const handleError = () => {
            setError('Fehler beim Laden der Audiodatei');
            setIsLoading(false);
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
        };
    }, [repeatEnabled, onPlay, onPause, onEnded, onTimeUpdate, onPlayCountChange]);

    // Load stimulus
    useEffect(() => {
        if (!stimulus || !audioRef.current) return;

        setIsLoading(true);
        setError(null);
        setCurrentTime(0);
        setDuration(0);
        setPlayCount(0);

        const audio = audioRef.current;
        audio.src = stimulus.url;
        audio.volume = volume;
        audio.load();

        // Initialize Web Audio API on first interaction
        const initOnFirstPlay = () => {
            initializeAudioContext();
            audio.removeEventListener('play', initOnFirstPlay);
        };
        audio.addEventListener('play', initOnFirstPlay);

        return () => {
            audio.removeEventListener('play', initOnFirstPlay);
        };
    }, [stimulus, volume, initializeAudioContext]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

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

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

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

            {enableVisualization && (
                <VisualizationContainer>
                    <Canvas ref={canvasRef} width={400} height={60} />
                </VisualizationContainer>
            )}

            {error && (
                <div style={{ color: 'red', fontSize: '0.875rem' }}>
                    {error}
                </div>
            )}

            <ControlsContainer>
                <MainControls>
                    <Button
                        onClick={handlePlayPause}
                        disabled={isLoading || !!error}
                        variant="primary"
                        size="md"
                    >
                        {isLoading ? '⏳' : isPlaying ? '⏸️' : '▶️'}
                    </Button>

                    <ProgressContainer>
                        <ProgressBar onClick={handleSeek}>
                            <ProgressFill progress={progress} />
                        </ProgressBar>
                        <TimeInfo>
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                        </TimeInfo>
                    </ProgressContainer>
                </MainControls>

                <SecondaryControls>
                    <VolumeControl>
                        <span>🔊</span>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={volume}
                            onChange={handleVolumeChange}
                            style={{ width: '80px' }}
                        />
                        <span>{Math.round(volume * 100)}%</span>
                    </VolumeControl>

                    {enableRepeat && (
                        <RepeatIndicator $active={repeatEnabled}>
                            <Button
                                onClick={() => setRepeatEnabled(!repeatEnabled)}
                                variant={repeatEnabled ? 'primary' : 'secondary'}
                                size="sm"
                            >
                                🔁
                            </Button>
                        </RepeatIndicator>
                    )}

                    <PlayCountDisplay>
                        Wiedergaben: {playCount}
                    </PlayCountDisplay>
                </SecondaryControls>
            </ControlsContainer>
        </PlayerContainer>
    );
};