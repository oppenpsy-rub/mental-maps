import React, { useState } from 'react';
import styled from 'styled-components';
import { AudioPlayer, AdvancedAudioPlayer } from '../../components/Audio';
import { AudioPlayerWithFeatures } from '../../components/Audio/AudioPlayerWithFeatures';
import { AudioStimulus } from '../../components/Audio/AudioPlayer';
import { Button } from '../../components/UI/Button';
import { Card } from '../../components/UI/Card';

const PageContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Title = styled.h1`
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 2rem;
  text-align: center;
`;

const Section = styled.section`
  margin-bottom: 3rem;
`;

const SectionTitle = styled.h2`
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 1rem;
  font-size: 1.5rem;
`;

const PlayerGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
`;

const ControlPanel = styled(Card)`
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const ControlGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const LogContainer = styled(Card)`
  padding: 1rem;
  background-color: ${({ theme }) => theme.colors.background.secondary};
  max-height: 200px;
  overflow-y: auto;
`;

const LogEntry = styled.div`
  font-family: monospace;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: 0.25rem;
`;

// Mock audio stimuli for demo
const mockAudioStimuli: AudioStimulus[] = [
  {
    id: 'demo-1',
    filename: 'sample-audio-1.mp3',
    url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Free sample
    duration: 30,
    metadata: {
      speaker: 'Sprecher A',
      dialect: 'Hochdeutsch',
      location: 'Berlin'
    }
  },
  {
    id: 'demo-2',
    filename: 'sample-audio-2.wav',
    url: 'https://www.soundjay.com/misc/sounds/fail-buzzer-02.wav', // Free sample
    duration: 45,
    metadata: {
      speaker: 'Sprecher B',
      dialect: 'Bayerisch',
      location: 'München'
    }
  },
  {
    id: 'demo-3',
    filename: 'sample-audio-3.ogg',
    url: 'https://www.soundjay.com/misc/sounds/success-fanfare-trumpets.wav', // Free sample
    duration: 60,
    metadata: {
      speaker: 'Sprecher C',
      dialect: 'Plattdeutsch',
      location: 'Hamburg'
    }
  }
];

export const AudioDemoPage: React.FC = () => {
  const [selectedStimulus, setSelectedStimulus] = useState<AudioStimulus | null>(mockAudioStimuli[0]);
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [playerSettings, setPlayerSettings] = useState({
    enableRepeat: true,
    enablePreloading: true,
    enableVisualization: true,
    autoPlay: false
  });

  const addLogEntry = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setEventLog(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
  };

  const handleStimulusSelect = (stimulus: AudioStimulus) => {
    setSelectedStimulus(stimulus);
    addLogEntry(`Audio-Stimulus gewechselt: ${stimulus.filename}`);
  };

  const handlePlay = () => {
    addLogEntry('Audio-Wiedergabe gestartet');
  };

  const handlePause = () => {
    addLogEntry('Audio-Wiedergabe pausiert');
  };

  const handleEnded = () => {
    addLogEntry('Audio-Wiedergabe beendet');
  };

  const handleTimeUpdate = (currentTime: number) => {
    // Log only every 5 seconds to avoid spam
    if (Math.floor(currentTime) % 5 === 0 && Math.floor(currentTime) > 0) {
      addLogEntry(`Wiedergabe-Position: ${Math.floor(currentTime)}s`);
    }
  };

  const handlePlayCountChange = (count: number) => {
    addLogEntry(`Wiedergabe-Zähler: ${count}`);
  };

  const handleLoadingStateChange = (isLoading: boolean) => {
    addLogEntry(`Ladestatus: ${isLoading ? 'Lädt...' : 'Bereit'}`);
  };

  return (
    <PageContainer>
      <Title>Audio-Player Demo</Title>
      
      <Section>
        <SectionTitle>Steuerung</SectionTitle>
        <ControlPanel>
          <h3>Audio-Stimulus auswählen:</h3>
          <ControlGroup>
            {mockAudioStimuli.map((stimulus) => (
              <Button
                key={stimulus.id}
                onClick={() => handleStimulusSelect(stimulus)}
                variant={selectedStimulus?.id === stimulus.id ? 'primary' : 'secondary'}
                size="sm"
              >
                {stimulus.filename}
              </Button>
            ))}
          </ControlGroup>
          
          <h3>Player-Einstellungen:</h3>
          <ControlGroup>
            <label>
              <input
                type="checkbox"
                checked={playerSettings.enableRepeat}
                onChange={(e) => setPlayerSettings(prev => ({
                  ...prev,
                  enableRepeat: e.target.checked
                }))}
              />
              Wiederholung aktivieren
            </label>
            
            <label>
              <input
                type="checkbox"
                checked={playerSettings.enablePreloading}
                onChange={(e) => setPlayerSettings(prev => ({
                  ...prev,
                  enablePreloading: e.target.checked
                }))}
              />
              Vorladen aktivieren
            </label>
            
            <label>
              <input
                type="checkbox"
                checked={playerSettings.enableVisualization}
                onChange={(e) => setPlayerSettings(prev => ({
                  ...prev,
                  enableVisualization: e.target.checked
                }))}
              />
              Visualisierung aktivieren
            </label>
            
            <label>
              <input
                type="checkbox"
                checked={playerSettings.autoPlay}
                onChange={(e) => setPlayerSettings(prev => ({
                  ...prev,
                  autoPlay: e.target.checked
                }))}
              />
              Auto-Play aktivieren
            </label>
          </ControlGroup>
        </ControlPanel>
      </Section>

      <Section>
        <SectionTitle>Audio-Player Varianten</SectionTitle>
        <PlayerGrid>
          <div>
            <h3>Standard Audio-Player</h3>
            <AudioPlayer
              stimulus={selectedStimulus}
              onPlay={handlePlay}
              onPause={handlePause}
              onEnded={handleEnded}
              onTimeUpdate={handleTimeUpdate}
            />
          </div>
          
          <div>
            <h3>Erweiterte Audio-Player</h3>
            <AdvancedAudioPlayer
              stimulus={selectedStimulus}
              enableVisualization={playerSettings.enableVisualization}
              enableRepeat={playerSettings.enableRepeat}
              onPlay={handlePlay}
              onPause={handlePause}
              onEnded={handleEnded}
              onTimeUpdate={handleTimeUpdate}
              onPlayCountChange={handlePlayCountChange}
            />
          </div>
        </PlayerGrid>
        
        <div>
          <h3>Audio-Player mit allen Features</h3>
          <AudioPlayerWithFeatures
            stimulus={selectedStimulus}
            enableRepeat={playerSettings.enableRepeat}
            enablePreloading={playerSettings.enablePreloading}
            enableProgressVisualization={playerSettings.enableVisualization}
            autoPlay={playerSettings.autoPlay}
            onPlay={handlePlay}
            onPause={handlePause}
            onEnded={handleEnded}
            onTimeUpdate={handleTimeUpdate}
            onPlayCountChange={handlePlayCountChange}
            onLoadingStateChange={handleLoadingStateChange}
          />
        </div>
      </Section>

      <Section>
        <SectionTitle>Event-Log</SectionTitle>
        <LogContainer>
          {eventLog.length === 0 ? (
            <LogEntry>Keine Events bisher...</LogEntry>
          ) : (
            eventLog.map((entry, index) => (
              <LogEntry key={index}>{entry}</LogEntry>
            ))
          )}
        </LogContainer>
      </Section>
    </PageContainer>
  );
};